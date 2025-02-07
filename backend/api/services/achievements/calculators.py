from typing import List, Optional
from abc import ABC, abstractmethod

from sqlalchemy import select, func, distinct

from backend.api import db
from backend.api.models import Achievement, User
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import ModelTypes, Status, MediaType, GamesPlatformsEnum


class BaseAchievementCalculator(ABC):
    def __init__(self, media_type: MediaType, **kwargs):
        self.kwargs = kwargs
        media_models = ModelsManager.get_dict_models(media_type, "all")

        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_network = media_models.get(ModelTypes.NETWORK)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    @abstractmethod
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        pass

    def _filter_and_group_by_users(self, base_query, user_ids: Optional[List[int]] = None) -> select:
        if user_ids:
            base_query = base_query.filter(self.media_list.user_id.in_(user_ids))
        return base_query.group_by(self.media_list.user_id).cte()


class CompletedCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).filter(self.media_list.status == Status.COMPLETED)
        )
        return self._filter_and_group_by_users(base_query, user_ids)


class RatedCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).join(User, self.media_list.user_id == User.id)
            .filter(self.media_list.rating.is_not(None))
        )
        return self._filter_and_group_by_users(base_query, user_ids)


class CommentCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).filter(self.media_list.comment.is_not(None))
        )
        return self._filter_and_group_by_users(base_query, user_ids)


class PublisherCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media.publishers)
            .subquery()
        )
        return db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()


class SpecificGenreCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .join(self.media).join(self.media_genre)
            .filter(self.media_list.status == Status.COMPLETED, self.media_genre.name == achievement.value)
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class ChapterCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = db.session.query(self.media_list.user_id, (func.sum(self.media_list.total)).label("value"))
        return self._filter_and_group_by_users(base_query, user_ids)


class ShortLongCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        field_name, valid_statuses = self.kwargs["media_config"]
        is_long = "long" in achievement.code_name
        try:
            field = getattr(self.media, field_name)
        except AttributeError:
            field = getattr(self.media_list, field_name)

        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .join(self.media)
            .filter(
                self.media_list.status.in_(valid_statuses),
                field >= achievement.value if is_long else field <= achievement.value,
            )
        )
        return self._filter_and_group_by_users(base_query, user_ids)


class AuthorCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_authors)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media_authors.name)
            .subquery()
        )

        return db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()


class LanguageCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
            .having(func.count(distinct(self.media.language)) >= 2)
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class GameModeCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(
                self.media.game_modes.ilike(f"%{achievement.value}%"),
                self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]),
            )
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class CompanyCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        is_developer = achievement.value == "developer"
        company_attr = getattr(self.media_companies, "developer" if is_developer else "publisher")
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id

        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_companies)
            .filter(self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]), company_attr == True)
            .group_by(filter_, self.media_companies.name)
            .subquery()
        )

        return db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()


class PerspectiveCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(
                self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]),
                self.media.player_perspective == achievement.value,
            )
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class PlatformCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media_list.platform)).label("value"))
            .filter(self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]))
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class SpecificPlatformCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("value"))
            .filter(
                self.media_list.status.not_in([Status.PLAN_TO_PLAY, Status.DROPPED]),
                self.media_list.platform == GamesPlatformsEnum(achievement.value),
            )
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class TimeCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = db.session.query(self.media_list.user_id, (func.sum(self.media_list.playtime) / 60).label("value"))
        return self._filter_and_group_by_users(base_query, user_ids)


class DirectorCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media.director_name)
            .subquery()
        )

        return db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()


class OriginLangCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media.original_language)).label("value"))
            .select_from(self.media_list).join(self.media)
            .filter(self.media_list.status == Status.COMPLETED)
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class NetworkCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        base_query = (
            db.session.query(self.media_list.user_id, func.count(distinct(self.media_network.name)).label("value"))
            .select_from(self.media_list).join(self.media).join(self.media_network)
            .filter(self.media_list.status != Status.PLAN_TO_WATCH)
        )

        return self._filter_and_group_by_users(base_query, user_ids)


class ActorCalculator(BaseAchievementCalculator):
    def calculate(self, achievement: Achievement, user_ids: Optional[List[int]] = None) -> select:
        filter_ = self.media_list.user_id.in_(user_ids) if user_ids else self.media_list.user_id
        subq = (
            db.session.query(self.media_list.user_id, func.count(self.media_list.media_id).label("count"))
            .select_from(self.media_list).join(self.media).join(self.media_actors)
            .filter(self.media_list.status == Status.COMPLETED)
            .group_by(filter_, self.media_actors.name)
            .subquery()
        )

        return db.session.query(subq.c.user_id, func.max(subq.c.count).label("value")).group_by(subq.c.user_id).subquery()
