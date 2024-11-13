from __future__ import annotations

from typing import Type, List, Dict, Optional

from sqlalchemy import func, distinct, case, literal, select, update, exists, insert

from backend.api import db
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import User
from backend.api.models.achievements import UserAchievement, Achievement, AchievementTier
from backend.api.utils.enums import MediaType, ModelTypes, Status, GamesPlatformsEnum, AchievementDifficulty
from backend.api.utils.functions import naive_utcnow


class AchievementManagerMeta(type):
    all_code_names = {}
    achievement_manager = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs and attrs["GROUP"] is not None:
            cls.achievement_manager[attrs["GROUP"]] = new_class
            for code_name in new_class().calculator_map.keys():
                cls.all_code_names[code_name] = new_class
        return new_class


class AchievementManager(metaclass=AchievementManagerMeta):
    GROUP: MediaType = None

    def __init__(self):
        self.calculator_map = {}
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.GROUP, "all")

        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]

        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_network = media_models.get(ModelTypes.NETWORK)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    @classmethod
    def get_manager(cls, media_type: MediaType) -> Type[AchievementManager]:
        return cls.achievement_manager.get(media_type, cls)

    @classmethod
    def get_manager_by_code(cls, code_name: str) -> Type[AchievementManager]:
        return cls.all_code_names.get(code_name, cls)

    @staticmethod
    def calculate_achievements_rarity():
        """ Calculate the rarity for each achievement considering the activated account """

        total_active_users = db.session.query(func.count(User.id)).filter(User.active.is_(True)).scalar()

        rarity_subquery = (
            db.session.query(UserAchievement.tier_id, func.count(UserAchievement.user_id).label("count"))
            .filter(UserAchievement.completed.is_(True))
            .group_by(UserAchievement.tier_id)
            .subquery()
        )

        update_stmt = (
            AchievementTier.__table__.update()
            .values(rarity=func.coalesce((100 * rarity_subquery.c.count / total_active_users), 0))
            .where(AchievementTier.id == rarity_subquery.c.tier_id)
        )

        db.session.execute(update_stmt)
        db.session.commit()

    @staticmethod
    def update_achievement(code_name: str, name: str = None, description: str = None) -> bool:
        achievement = Achievement.query.filter_by(code_name=code_name).first()
        if not achievement:
            return False

        # Update only if `name` and/or `description` are not `None`
        achievement.name = name if name else achievement.name
        achievement.description = description if description else achievement.description
        db.session.commit()

        return True

    @staticmethod
    def update_tier_achievement(code_name: str, tier: AchievementDifficulty, criteria: Dict):
        achievement = Achievement.query.filter_by(code_name=code_name).first()
        if not achievement:
            return False
        tier = [ach for ach in achievement.tiers if ach.difficulty == tier][0]
        tier.criteria = criteria
        db.session.commit()

        return True

    @staticmethod
    def _execute_statements(achievement: Achievement, subquery: select, **kwargs):
        """ Execute the update and insert statements of an achievement and its tiers for N users """

        tiers = AchievementTier.query.filter_by(achievement_id=achievement.id).all()

        for tier in tiers:
            value_needed = kwargs.get("value_needed", tier.criteria["count"])
            completed = kwargs.get("completed", (subquery.c.value >= value_needed))
            count = kwargs.get("count", subquery.c.value)
            progress = func.min(kwargs.get("progress", (subquery.c.value / value_needed) * 100.0), 100.0)
            completed_at = case(
                (completed & (UserAchievement.completed.is_(False)), literal(naive_utcnow())),
                else_=UserAchievement.completed_at
            )

            # noinspection PyTypeChecker
            update_stmt = (
                update(UserAchievement)
                .where(
                    UserAchievement.tier_id == tier.id,
                    UserAchievement.user_id == subquery.c.user_id,
                    UserAchievement.achievement_id == achievement.id,
                )
                .values(
                    count=count,
                    progress=progress,
                    completed=completed,
                    completed_at=completed_at,
                    last_calculated_at=naive_utcnow(),
                )
            )
            db.session.execute(update_stmt)

            # Get columns of interest and redefine `completed_at` for insert statement
            columns_to_insert = ["user_id", "achievement_id", "tier_id", "count", "progress", "completed", "completed_at",
                                 "last_calculated_at"]
            # noinspection PyTypeChecker
            completed_at = case((completed, literal(naive_utcnow())), else_=None)

            # noinspection PyTypeChecker
            select_query = (
                db.session.query(
                    subquery.c.user_id,
                    literal(achievement.id),
                    literal(tier.id),
                    count,
                    progress,
                    completed,
                    completed_at,
                    literal(naive_utcnow())
                )
                .filter(~exists().where(
                    UserAchievement.tier_id == tier.id,
                    UserAchievement.user_id == subquery.c.user_id,
                    UserAchievement.achievement_id == achievement.id,
                ))
            )
            insert_stmt = insert(UserAchievement).from_select(columns_to_insert, select_query)
            db.session.execute(insert_stmt)

        db.session.commit()

    def _filter_and_group_by_users(self, base_query, user_ids: List[int] = None) -> select:
        if user_ids:
            base_query = base_query.filter(self.media_list.user_id.in_(user_ids))
        return base_query.group_by(self.media_list.user_id).cte()

    def calculate_achievements(self, code_name: Optional[str], user_ids: Optional[List[int]], callback=None):
        """ Calculate achievements for users based on `code_names` and `user_ids`. """

        query = Achievement.query
        if code_name:
            query = query.filter(Achievement.code_name == code_name)
        achievements = query.filter(Achievement.media_type == self.GROUP).all()

        total_achievements = len(achievements)
        for i, achievement in enumerate(achievements):
            data = self.calculator_map.get(achievement.code_name)
            if isinstance(data, tuple):
                self.calculator_map[achievement.code_name][0](achievement, user_ids, data[-1])
            else:
                self.calculator_map[achievement.code_name](achievement, user_ids)

            if callback:
                callback((i + 1) / total_achievements)

    # --- General implementations -----------------------------------------

    def _calculate_completed(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N media """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).filter(self.media_list.status == Status.COMPLETED)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_rated(self, achievement: Achievement, user_ids: List[int] = None):
        """ Rate N media """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).join(User, self.media_list.user_id == User.id)
            .filter(case((User.add_feeling.is_(True), self.media_list.feeling), else_=self.media_list.score).is_not(None))
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_comment(self, achievement: Achievement, user_ids: List[int] = None):
        """ Comment N media """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).filter(self.media_list.comment.is_not(None))
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_specific_genre(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N media with a specific genre """

        genre_name = achievement.tiers[0].criteria["value"]

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).join(self.media_genre)
            .filter(self.media_list.status == Status.COMPLETED, self.media_genre.name == genre_name)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)


class TMDBAchievementManager(AchievementManager):
    GROUP: MediaType = None

    def _calculate_actor(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N TMDB media with the same (voice) actor """

        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_actors)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media_actors.name)
            .subquery()
        )

        subquery = db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()
        self._execute_statements(achievement, subquery)


class TVAchievementManager(TMDBAchievementManager):
    GROUP: MediaType = None

    def _calculate_short_or_long(self, achievement: Achievement, user_ids: List[int] = None, GTE: bool = False):
        """ Complete N TV shows LTE (Less Than or Equal) or GTE (Greater Than or Equal) to M episodes """

        value = achievement.tiers[0].criteria["value"]
        filter_cond = self.media.total_episodes >= value if GTE else self.media.total_episodes <= value

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).filter(self.media_list.status == Status.COMPLETED, filter_cond)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_network(self, achievement: Achievement, user_ids: List[int] = None):
        """ Watched TV shows from N different networks """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media_network.name)).label("value"))
            .select_from(self.media_list).join(self.media).join(self.media_network)
            .filter(self.media_list.status != Status.PLAN_TO_WATCH)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)


""" --- CLASS CALL ------------------------------------------------------------------------------------------ """


class SeriesAchievementManager(TVAchievementManager):
    GROUP = MediaType.SERIES

    def __init__(self):
        super().__init__()
        self.calculator_map = {
            "completed_series": self._calculate_completed,
            "rated_series": self._calculate_rated,
            "short_series": (self._calculate_short_or_long, False),
            "long_series": (self._calculate_short_or_long, True),
            "comedy_series": self._calculate_specific_genre,
            "drama_series": self._calculate_specific_genre,
            "network_series": self._calculate_network,
        }


class AnimeAchievementManager(TVAchievementManager):
    GROUP = MediaType.ANIME

    def __init__(self):
        super().__init__()
        self.calculator_map = {
            "completed_anime": self._calculate_completed,
            "rated_anime": self._calculate_rated,
            "comment_anime": self._calculate_comment,
            "short_anime": (self._calculate_short_or_long, False),
            "long_anime": (self._calculate_short_or_long, True),
            "shonen_anime": self._calculate_specific_genre,
            "seinen_anime": self._calculate_specific_genre,
            "network_anime": self._calculate_network,
            "actor_anime": self._calculate_actor,
        }


class MoviesAchievementManager(TMDBAchievementManager):
    GROUP = MediaType.MOVIES

    def __init__(self):
        super().__init__()
        self.calculator_map = {
            "completed_movies": self._calculate_completed,
            "rated_movies": self._calculate_rated,
            "comment_movies": self._calculate_comment,
            "director_movies": self._calculate_director,
            "actor_movies": self._calculate_actor,
            "origin_lang_movies": self._calculate_original_language,
            "war_genre_movies": self._calculate_specific_genre,
            "family_genre_movies": self._calculate_specific_genre,
            "sci_genre_movies": self._calculate_specific_genre,
            "animation_movies": self._calculate_specific_genre,
            "short_movies": (self._calculate_short_or_long, False),
            "long_movies": (self._calculate_short_or_long, True),
        }

    def _calculate_short_or_long(self, achievement: Achievement, user_ids: List[int] = None, GTE: bool = False):
        """ Complete N movies LTE (Less Than or Equal) or GTE (Greater Than or Equal) to M length """

        value = achievement.tiers[0].criteria["value"]
        filter_cond = self.media.duration >= value if GTE else self.media.duration <= value

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .join(self.media).filter(self.media_list.status == Status.COMPLETED, filter_cond)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_director(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N Movies from the same director """

        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media.director_name)
            .subquery()
        )

        subquery = db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()
        self._execute_statements(achievement, subquery)

    def _calculate_original_language(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete Movies from N different original language """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media.original_language)).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)


class BooksAchievementManager(AchievementManager):
    GROUP = MediaType.BOOKS

    def __init__(self):
        super().__init__()
        self.calculator_map = {
            "completed_books": self._calculate_completed,
            "rated_books": self._calculate_rated,
            "comment_books": self._calculate_comment,
            "author_books": self._calculate_authors,
            "lang_books": self._calculate_languages,
            "short_books": (self._calculate_short_or_long, False),
            "long_books": (self._calculate_short_or_long, True),
            "classic_books": self._calculate_specific_genre,
            "young_adult_books": self._calculate_specific_genre,
            "crime_books": self._calculate_specific_genre,
            "fantasy_books": self._calculate_specific_genre,
        }

    def _calculate_short_or_long(self, achievement: Achievement, user_ids: List[int], GTE: bool = False):
        """ Complete N books LTE (Less Than or Equal) or GTE (Greater Than or Equal) to M pages """

        value = achievement.tiers[0].criteria["value"]
        filter_cond = self.media.pages >= value if GTE else self.media.pages <= value

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .join(self.media).filter(self.media_list.status == Status.COMPLETED, filter_cond)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_authors(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N books from the same author """

        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_authors)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media_authors.name)
            .subquery()
        )

        subquery = db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()
        self._execute_statements(achievement, subquery)

    def _calculate_languages(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N Books from 2 different languages """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
            .having(func.count(distinct(self.media.language)) >= 2)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)


class GamesAchievementManager(AchievementManager):
    GROUP = MediaType.GAMES

    def __init__(self):
        super().__init__()
        self.calculator_map = {
            "completed_games": self._calculate_completed,
            "rated_games": self._calculate_rated,
            "comment_games": self._calculate_comment,
            "developer_games": (self._calculate_companies, True),
            "publisher_games": (self._calculate_companies, False),
            "short_games": (self._calculate_short_or_long, False),
            "long_games": (self._calculate_short_or_long, True),
            "first_person_games": self._calculate_perspectives,
            "hack_slash_games": self._calculate_specific_genre,
            "multiplayer_games": self._calculate_game_modes,
            "log_hours_games": self._calculate_time,
            "platform_games": self._calculate_platforms,
            "pc_games": self._calculate_specific_platforms,
        }

    def _calculate_short_or_long(self, achievement: Achievement, user_ids: List[int] = None, GTE: bool = False):
        """ Complete N games LTE (Less Than or Equal) or GTE (Greater Than or Equal) to M playtime """

        value = achievement.tiers[0].criteria["value"]

        if GTE:
            filter_cond = self.media_list.playtime >= value
            statuses_cond = [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER]
        else:
            filter_cond = self.media_list.playtime <= value
            statuses_cond = [Status.COMPLETED]

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .filter(self.media_list.status.in_(statuses_cond), filter_cond)
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_game_modes(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N games from a specific game mode """

        value = achievement.tiers[0].criteria["value"]

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]), self.media.game_modes.ilike(f"%{value}%"))
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_time(self, achievement: Achievement, user_ids: List[int] = None):
        """ Log N hours of games """

        base_query = db.session.query(self.media_list.user_id, (func.sum(self.media_list.playtime) / 60).label("value"))
        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_companies(self, achievement: Achievement, user_ids: List[int] = None, developer: bool = True):
        """ Complete N games from the same developer/publisher """

        company_attr = getattr(self.media_companies, "developer" if developer else "publisher")
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_companies)
            .filter(self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]), company_attr == True)
            .group_by(filter_, self.media_companies.name)
            .subquery()
        )

        subquery = db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()
        self._execute_statements(achievement, subquery)

    def _calculate_perspectives(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N games from a specific perspective """

        value = achievement.tiers[0].criteria["value"]

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(
                self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]),
                self.media.player_perspective == value,
            )
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_platforms(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete games from N different platforms """

        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media_list.platform)).label("value"))
            .filter(self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]))
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)

    def _calculate_specific_platforms(self, achievement: Achievement, user_ids: List[int] = None):
        """ Complete N games from specific platform """

        value = achievement.tiers[0].criteria["value"]

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .filter(
                self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]),
                self.media_list.platform == GamesPlatformsEnum(value),
            )
        )

        subquery = self._filter_and_group_by_users(base_query, user_ids)
        self._execute_statements(achievement, subquery)
