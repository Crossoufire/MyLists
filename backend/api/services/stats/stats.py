from __future__ import annotations

from dataclasses import asdict
from typing import List, Optional, Dict, Any, Type

from sqlalchemy import text, ColumnElement, func

from backend.api import db
from backend.api.utils.functions import int_to_money
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, Status, ModelTypes, AchievementDifficulty
from backend.api.models import User, UserMediaSettings, UserAchievement, AchievementTier, UserMediaUpdate
from backend.api.services.stats.data_classes import MediaStats, MediaTotalStats, TopStats, TMDBStats, TvStats, MoviesStats, \
    BooksStats, GamesStats, GlobalMediaStats, StatsValue, MangaStats


class StatScope:
    def __init__(self, user: Optional[User] = None):
        self.user = user
        self.is_global = (user is None)
        self.user_id = user.id if user else None


class PreComputedStats:
    """ Wrapper class to provide consistent access to pre-computed stats regardless of source """

    def __init__(self, source: UserMediaSettings | Dict):
        self._source = source

    def __getattr__(self, name: str) -> Optional[int | float | Dict]:
        if isinstance(self._source, dict):
            return self._source.get(name, 0)
        return getattr(self._source, name, 0)


class MediaStatsService:
    _ms_calculators: Dict[MediaType, Type[BaseStatsCalculator]] = {}

    def __init__(self):
        self.gs_calculator = GlobalStatsCalculator

    @classmethod
    def init_calculators(cls, media_type: MediaType, calculator: Type[BaseStatsCalculator]):
        cls._ms_calculators[media_type] = calculator

    def get_stats(self, user: Optional[User] = None, media_type: Optional[MediaType] = None) -> Optional[Dict[str, Any]]:
        if media_type:
            return self._get_media_type_stats(media_type, user)

        return self._get_aggregated_stats(user)

    def _get_media_type_stats(self, media_type: MediaType, user: Optional[User] = None) -> Optional[Dict[str, Any]]:
        """ Get statistics for a specific media type. For a user or all users """

        scope = StatScope(user)

        if media_type not in self._ms_calculators.keys():
            raise Exception(f"MediaType `{media_type.upper()}` was not added to the MediaStatsService")

        # noinspection PyTypeChecker
        return asdict(self._ms_calculators[media_type](scope).calculate_stats())

    def _get_aggregated_stats(self, user: Optional[User] = None) -> Dict[str, Any]:
        """ Get aggregated statistics across all media types. For a user or all users """

        scope = StatScope(user)
        # noinspection PyTypeChecker
        return asdict(self.gs_calculator(scope).compute_stats())


class GlobalStatsCalculator:
    def __init__(self, scope: StatScope):
        self.scope = scope
        self.stats = GlobalMediaStats()

    def _add_user_filter(self, model: db.Model):
        if self.scope.user_id:
            return [model.user_id == self.scope.user_id]
        return []

    def compute_total_active_users(self):
        self.stats.total_users = db.session.query(func.count(User.id)).filter(User.active == True).scalar() or 0

    def compute_totals_from_user_media_settings(self):
        query = (
            db.session.query(
                func.coalesce(func.sum(UserMediaSettings.total_entries), 0),
                func.coalesce(func.sum(UserMediaSettings.time_spent), 0),
                func.coalesce(func.sum(UserMediaSettings.entries_rated), 0),
                func.coalesce(func.sum(UserMediaSettings.entries_favorites), 0),
                func.coalesce(func.sum(UserMediaSettings.entries_commented), 0),
                func.coalesce(func.sum(UserMediaSettings.total_redo), 0),
                func.coalesce(func.sum(UserMediaSettings.sum_entries_rated), 0),
            ).filter(*self._add_user_filter(UserMediaSettings))
            .all()
        )

        self.stats.total_entries = query[0][0]
        self.stats.total_time_spent = query[0][1]
        self.stats.total_rated = query[0][2]
        self.stats.total_favorites = query[0][3]
        self.stats.total_commented = query[0][4]
        self.stats.total_redo = query[0][5]
        self.stats.avg_rating = round(query[0][6] / self.stats.total_rated, 2) if self.stats.total_entries > 0 else None

        divider = self.stats.total_users
        if self.scope.user_id:
            divider = sum(1 for s in self.scope.user.settings if s.active)

        self.stats.avg_comments = round(self.stats.total_commented / divider, 2) if self.stats.total_entries > 0 else None
        self.stats.avg_favorites = round(self.stats.total_favorites / divider, 2) if self.stats.total_entries > 0 else None

    def compute_total_labels(self):
        """ Compute the total number of user media labels """

        total_labels = 0
        models = ModelsManager.get_dict_models("all", ModelTypes.LABELS)
        for label_model in models.values():
            label_count = (
                db.session.query(func.count(label_model.name.distinct()))
                .filter(*self._add_user_filter(label_model))
                .scalar()
            )
            total_labels += label_count

        self.stats.total_labels = total_labels

    def compute_total_achievements(self):
        total_achievements = (
            db.session.query(func.count().label("platinum_count"))
            .select_from(UserAchievement)
            .join(AchievementTier, UserAchievement.tier_id == AchievementTier.id)
            .filter(
                UserAchievement.completed == True,
                AchievementTier.difficulty == AchievementDifficulty.PLATINUM,
                *self._add_user_filter(UserAchievement),
            )
            .scalar()
        )
        self.stats.total_achievements = total_achievements or 0

    def compute_updates(self):
        """ Compute total updates, avg updates per month and update distribution """

        cte_query = (
            db.session.query(
                func.strftime("%m-%Y", UserMediaUpdate.timestamp),
                func.count(UserMediaUpdate.media_id).label("updates"),
            ).filter(*self._add_user_filter(UserMediaUpdate))
            .group_by(func.strftime("%m-%Y", UserMediaUpdate.timestamp))
            .order_by(UserMediaUpdate.timestamp)
            .cte()
        )

        updates_distrib = db.session.query(cte_query).all()
        avg_updates = db.session.query(func.avg(cte_query.c.updates)).scalar()

        self.stats.total_updates = sum(v for _, v in updates_distrib)
        self.stats.avg_updates = round(avg_updates, 2) if isinstance(avg_updates, float) else None
        self.stats.updates = [StatsValue(name=n, value=v) for (n, v) in updates_distrib]

    def compute_time_spent_per_media_type(self):
        query = (
            db.session.query(UserMediaSettings.media_type, func.sum(UserMediaSettings.time_spent))
            .join(User, User.id == UserMediaSettings.user_id)
            .filter(User.active.is_(True), *self._add_user_filter(UserMediaSettings))
            .group_by(UserMediaSettings.media_type)
            .all()
        )
        self.stats.time_spent = [StatsValue(name=n, value=v / 60) for (n, v) in sorted(query, key=lambda x: x[0])]

    def compute_stats(self) -> GlobalMediaStats:
        if self.scope.is_global:
            self.compute_total_active_users()

        self.compute_totals_from_user_media_settings()
        self.compute_total_labels()
        self.compute_total_achievements()
        self.compute_updates()
        self.compute_time_spent_per_media_type()

        return self.stats


class BaseStatsCalculator:
    GROUP: MediaType
    LIMIT: int = 10

    def __init__(self, scope: StatScope):
        self.scope = scope
        self.precomputed_stats = self._get_precomputed_stats()
        self.stats = MangaStats(total_media=MediaTotalStats(0, 0, 0))

        self.media_models = ModelsManager.get_dict_models(self.GROUP, "all")
        self._initialize_media_models()

        self.common_join = [self.media_list, self.media_list.media_id == self.media.id]

        self.status_filter = []
        self.user_filter = []
        if not self.scope.is_global:
            self.user_filter = [self.media_list.user_id == self.scope.user_id]

    def _initialize_media_models(self):
        self.media = self.media_models[ModelTypes.MEDIA]
        self.media_list = self.media_models[ModelTypes.LIST]
        self.media_genre = self.media_models[ModelTypes.GENRE]
        self.media_label = self.media_models[ModelTypes.LABELS]

    def _get_precomputed_stats(self) -> PreComputedStats:
        """ Get pre-computed stats from the database """

        if self.scope.user_id:
            return PreComputedStats(self.scope.user.get_media_setting(self.GROUP))

        aggregated_stats = (
            db.session.query(UserMediaSettings).with_entities(
                func.sum(UserMediaSettings.total_entries).label("total_entries"),
                func.sum(UserMediaSettings.time_spent).label("time_spent"),
                func.sum(UserMediaSettings.entries_rated).label("entries_rated"),
                func.sum(UserMediaSettings.total_redo).label("total_redo"),
                func.sum(UserMediaSettings.entries_favorites).label("entries_favorites"),
                func.sum(UserMediaSettings.total_specific).label("total_specific"),
                func.sum(UserMediaSettings.entries_commented).label("entries_commented"),
                func.sum(UserMediaSettings.sum_entries_rated).label("sum_entries_rated"),
                func.json_group_array(UserMediaSettings.status_counts).label("status_counts"),
            ).filter_by(media_type=self.GROUP)
            .first()
        )

        status_dict = {status: 0 for status in Status.by(self.GROUP)}
        for scd in eval(aggregated_stats.status_counts):
            scd = eval(scd)
            for key, value in scd.items():
                status_dict[key] += value

        # Convert SQLAlchemy result to dict
        stats_dict = {key: getattr(aggregated_stats, key, 0) or 0 for key in
                      ["total_entries", "total_redo", "time_spent", "entries_favorites", "entries_commented",
                       "entries_rated", "sum_entries_rated", "total_specific"]}
        stats_dict["status_counts"] = dict(status_dict)

        return PreComputedStats(stats_dict)

    def compute_ratings(self):
        """ Compute the rating distribution. And take the pre-computed average rating if available """

        rating_distrib = {str(val): 0 for val in [i * 0.5 for i in range(21)]}

        rating_query = (
            db.session.query(self.media_list.rating, func.count(self.media_list.rating))
            .filter(*self.status_filter, *self.user_filter, self.media_list.rating.is_not(None))
            .group_by(self.media_list.rating).order_by(self.media_list.rating.asc())
            .all()
        )

        rating_distrib.update({str(val): count for (val, count) in rating_query})
        self.stats.ratings = [StatsValue(name=n, value=v) for (n, v) in rating_distrib.items()]

    def compute_updates(self):
        """ Compute the number of updates per month and the average number of updates per month """

        user_filter = []
        if self.scope.user_id:
            user_filter = [UserMediaUpdate.user_id == self.scope.user_id]

        cte_query = (
            db.session.query(
                func.strftime("%m-%Y", UserMediaUpdate.timestamp),
                func.count(UserMediaUpdate.media_id).label("updates"),
            ).filter(*user_filter, UserMediaUpdate.media_type == self.GROUP)
            .group_by(func.strftime("%m-%Y", UserMediaUpdate.timestamp))
            .order_by(UserMediaUpdate.timestamp)
            .cte()
        )

        updates_distrib = db.session.query(cte_query).all()
        avg_updates = db.session.query(func.avg(cte_query.c.updates)).scalar()

        self.stats.avg_updates = round(avg_updates, 2) if isinstance(avg_updates, float) else None
        self.stats.updates = [StatsValue(name=n, value=v) for (n, v) in updates_distrib]
        self.stats.total_updates = sum(v for (n, v) in updates_distrib)

    def compute_total_labels(self):
        """ Compute the total number of user media labels """

        user_filter = []
        if self.scope.user_id:
            user_filter.append(self.media_label.user_id == self.scope.user_id)

        label_count = (
            db.session.query(func.count(self.media_label.name.distinct()))
            .filter(*user_filter)
            .scalar()
        )
        self.stats.total_labels = label_count or 0

    def compute_status_counts(self):
        """ Compute the status counts """
        status_counts = self.precomputed_stats.status_counts
        self.stats.status_counts = [StatsValue(name=n, value=v) for (n, v) in status_counts.items()]

    def compute_release_dates(self):
        """ Compute the release date distribution per year """

        release_query = (
            db.session.query(
                (((func.extract("year", self.media.release_date)) // 10) * 10).label("decade"),
                func.count(self.media.release_date)
            ).join(*self.common_join)
            .filter(*self.user_filter, self.media.release_date.is_not(None))
            .group_by("decade").order_by(self.media.release_date)
            .all()
        )

        self.stats.release_dates = [StatsValue(name=n, value=v) for (n, v) in release_query]

    def compute_genres(self, min_: int = 5):
        """ Compute the genre distribution """

        top_values = self._query_top_values(self.media_genre, self.media_genre.name)
        top_rated = self._query_top_rated(self.media_genre, self.media_genre.name, min_=min_)
        top_favorited = self._query_top_favorites(self.media_genre, self.media_genre.name)

        self.stats.genres = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def calculate_stats(self) -> MediaStats:
        """ Compute general stats """

        # Add precomputed stats to MediaStats dataclass
        unique, redo = self.precomputed_stats.total_entries, self.precomputed_stats.total_redo
        self.stats.total_media = MediaTotalStats(unique=unique, redo=redo, total=unique + redo)
        self.stats.total_hours = self.precomputed_stats.time_spent // 60
        self.stats.total_days = (self.precomputed_stats.time_spent / 60) // 24
        self.stats.total_favorites = self.precomputed_stats.entries_favorites
        self.stats.total_commented = self.precomputed_stats.entries_commented
        self.stats.total_rated = self.precomputed_stats.entries_rated
        self.stats.avg_rating = round(self.precomputed_stats.sum_entries_rated / self.precomputed_stats.entries_rated, 2) \
            if self.precomputed_stats.entries_rated > 0 else None

        self.compute_ratings()
        self.compute_updates()
        self.compute_total_labels()
        self.compute_status_counts()
        self.compute_release_dates()

        return self.stats

    def calculate_global_stats(self) -> MediaStats:
        return self.calculate_stats()

    def _query_top_values(self, model: db.Model, metric: ColumnElement, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = db.session.query(metric, func.count(metric).label("count"))
        if model.TYPE != ModelTypes.LIST:
            query = query.join(self.media_list, self.media_list.media_id == getattr(model, model_attr))

        query = (
            query.filter(*self.user_filter, *self.status_filter, *filters, metric.is_not(None))
            .group_by(metric).order_by(text("count desc"))
            .limit(self.LIMIT).all()
        )

        return query or [(None, 0)]

    def _query_top_rated(self, model: db.Model, metric: ColumnElement, min_: int = 3, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = db.session.query(metric, func.avg(self.media_list.rating).label("rating"))
        if model.TYPE != ModelTypes.LIST:
            query = query.join(self.media_list, self.media_list.media_id == getattr(model, model_attr))

        query = (
            query.filter(*self.user_filter, *self.status_filter, *filters, self.media_list.rating.is_not(None))
            .group_by(metric).having((func.count(metric) >= min_))
            .order_by(text("rating desc"))
            .limit(self.LIMIT).all()
        )

        return query or [(None, 0)]

    def _query_top_favorites(self, model: db.Model, metric: ColumnElement, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = db.session.query(metric, func.count(self.media_list.favorite).label("count"))
        if model.TYPE != ModelTypes.LIST:
            query = query.join(self.media_list, self.media_list.media_id == getattr(model, model_attr))

        query = (
            query.filter(*self.user_filter, *self.status_filter, *filters, self.media_list.favorite.is_(True), metric.is_not(None))
            .group_by(metric).order_by(text("count desc"))
            .limit(self.LIMIT).all()
        )

        return query or [(None, 0)]

    def _query_misc_genres(self, genre_name: str):
        count_query = (
            db.session.query(func.count(self.media_genre.media_id))
            .join(self.media_list, self.media_list.media_id == self.media_genre.media_id)
            .filter(*self.user_filter, *self.status_filter, self.media_genre.name == genre_name)
            .scalar()
        )
        self.stats.misc_genres.append(StatsValue(name=genre_name, value=count_query or 0))


class TMDBStatsCalculator(BaseStatsCalculator):
    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.stats = TMDBStats(total_media=MediaTotalStats(0, 0, 0))
        self.status_filter = [self.media_list.status != Status.PLAN_TO_WATCH]

    def _initialize_media_models(self):
        super()._initialize_media_models()
        self.media_actors = self.media_models[ModelTypes.ACTORS]

    def compute_actors(self):
        """ Compute the actor top values, top-rated and top favorited actors """

        min_ = 4 if self.GROUP == MediaType.MOVIES else 3

        top_values = self._query_top_values(self.media_actors, self.media_actors.name)
        top_rated = self._query_top_rated(self.media_actors, self.media_actors.name, min_=min_)
        top_favorited = self._query_top_favorites(self.media_actors, self.media_actors.name)

        self.stats.actors = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )


class TvStatsCalculator(TMDBStatsCalculator):
    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.stats = TvStats(total_media=MediaTotalStats(0, 0, 0))

    def _initialize_media_models(self):
        super()._initialize_media_models()
        self.media_eps = self.media_models[ModelTypes.EPS]
        self.media_networks = self.media_models[ModelTypes.NETWORK]

    def compute_total_eps_seasons(self):
        """ Compute the total number of seasons and episodes. total_episodes is pre-computed already """

        data = (
            db.session.query(
                func.coalesce(func.sum(self.media_list.current_season), 0))
            .filter(*self.user_filter, *self.status_filter)
            .all()
        )

        self.stats.total_seasons = data[0][0]
        self.stats.total_episodes = self.precomputed_stats.total_specific

    def compute_durations(self):
        """ Compute the duration distribution """

        duration_distrib = (
            db.session.query(
                (((self.media.duration * self.media.total_episodes) // 600) * 600).label("bin"),
                func.count(self.media_list.media_id),
            ).join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter, self.media_list.status != Status.RANDOM)
            .group_by(text("bin")).order_by(text("bin"))
            .all()
        )

        avg_duration = (
            db.session.query(
                func.avg((self.media.duration * (self.media_list.total / (self.media_list.redo + 1)))))
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter, self.media_list.status != Status.RANDOM)
            .scalar()
        )

        self.stats.avg_duration = round(avg_duration / 60, 1) if isinstance(avg_duration, float) else None
        self.stats.durations = [StatsValue(name=n / 60, value=v) for (n, v) in duration_distrib]

    def compute_networks(self):
        """ Compute network top values, top-rated and top favorited networks """

        top_values = self._query_top_values(self.media_networks, self.media_networks.name,
                                            [self.media_list.status != Status.RANDOM])
        top_rated = self._query_top_rated(self.media_networks, self.media_networks.name, 3,
                                          [self.media_list.status != Status.RANDOM])
        top_favorited = self._query_top_favorites(self.media_networks, self.media_networks.name,
                                                  [self.media_list.status != Status.RANDOM])

        self.stats.networks = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_genres(self, min_: int = 5):
        """ Compute miscellaneous genres and general genre distribution """

        super().compute_genres(min_)
        self._query_misc_genres("Documentary")
        self._query_misc_genres("Kids")

    def compute_countries(self):
        """ Compute the country distribution """

        top_values = self._query_top_values(self.media, self.media.origin_country)

        self.stats.countries = TopStats(
            top_values=[StatsValue(name=n.upper() if n else None, value=v) for (n, v) in top_values]
        )

    def calculate_stats(self) -> MediaStats:
        """ Add specific media stats """

        super().calculate_stats()
        self.compute_total_eps_seasons()
        self.compute_durations()
        self.compute_networks()
        self.compute_genres()
        self.compute_actors()
        self.compute_countries()

        return self.stats


class SeriesStatsCalculator(TvStatsCalculator):
    GROUP = MediaType.SERIES

    def __init__(self, scope: StatScope):
        super().__init__(scope)


class AnimeStatsCalculator(TvStatsCalculator):
    GROUP = MediaType.ANIME

    def __init__(self, scope: StatScope):
        super().__init__(scope)


class MoviesStatsCalculator(TMDBStatsCalculator):
    GROUP = MediaType.MOVIES

    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.stats = MoviesStats(total_media=MediaTotalStats(0, 0, 0))

    def compute_total_money(self):
        """ Compute the total budget and revenue """

        data = (
            db.session.query(
                func.coalesce(func.sum(self.media.budget), 0),
                func.coalesce(func.sum(self.media.revenue), 0)
            ).join(*self.common_join).filter(*self.user_filter, *self.status_filter)
            .all()
        )
        self.stats.total_budget = int_to_money(data[0][0])
        self.stats.total_revenue = int_to_money(data[0][1])

    def compute_durations(self):
        """ Compute the duration distribution, and the average duration """

        duration_distrib = (
            db.session.query(((self.media.duration // 30) * 30).label("bin"), func.count(self.media.id))
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter)
            .group_by(text("bin")).order_by(text("bin"))
            .all()
        )

        avg_duration = (
            db.session.query(func.avg(self.media.duration))
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter)
            .scalar()
        )

        self.stats.avg_duration = round(avg_duration, 2) if isinstance(avg_duration, float) else None
        self.stats.durations = [StatsValue(name=n, value=v) for (n, v) in duration_distrib]

    def compute_directors(self):
        """ Compute the director top values, top-rated and top favorited directors """

        top_values = self._query_top_values(self.media, self.media.director_name)
        top_rated = self._query_top_rated(self.media, self.media.director_name, min_=4)
        top_favorited = self._query_top_favorites(self.media, self.media.director_name)

        self.stats.directors = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_genres(self, min_: int = 5):
        """ Compute miscellaneous genres and general genre distribution """

        super().compute_genres(min_)
        self._query_misc_genres("Documentary")
        self._query_misc_genres("Animation")

    def compute_languages(self):
        """ Compute the language distribution """
        top_values = self._query_top_values(self.media, self.media.original_language)
        self.stats.languages = TopStats(
            top_values=[StatsValue(name=n.capitalize() if n else None, value=v) for (n, v) in top_values]
        )

    def calculate_stats(self) -> MediaStats:
        """ More stats specific to media """

        super().calculate_stats()

        self.compute_total_money()
        self.compute_durations()
        self.compute_directors()
        self.compute_genres(min_=10)
        self.compute_actors()
        self.compute_languages()

        return self.stats


class BooksStatsCalculator(BaseStatsCalculator):
    GROUP = MediaType.BOOKS

    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.stats = BooksStats(total_media=MediaTotalStats(0, 0, 0))
        self.status_filter = [self.media_list.status != Status.PLAN_TO_READ]

    def _initialize_media_models(self):
        super()._initialize_media_models()
        self.media_authors = self.media_models[ModelTypes.AUTHORS]

    def compute_total_pages(self):
        """ Already computed in user's pre-computed stats """
        self.stats.total_pages = self.precomputed_stats.total_specific

    def compute_pages(self):
        """ Compute the pages distribution, and the average pages """

        pages_distrib = (
            db.session.query(((self.media.pages // 100) * 100).label("bin"), func.count(self.media_list.media_id))
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter)
            .group_by(text("bin")).order_by(text("bin"))
            .all()
        )

        avg_pages = (
            db.session.query(func.avg((self.media_list.total / (self.media_list.redo + 1))))
            .filter(*self.user_filter, *self.status_filter)
            .scalar()
        )

        self.stats.avg_pages = round(avg_pages, 0) if isinstance(avg_pages, float) else None
        self.stats.pages = [StatsValue(name=n, value=v) for (n, v) in pages_distrib]

    def compute_genres(self, min_: int = 5):
        """ Compute miscellaneous genres and general genre distribution """

        super().compute_genres(min_)
        self._query_misc_genres("Young adult")
        self._query_misc_genres("Classic")

    def compute_publishers(self):
        """ Compute the publisher top values, top-rated and top favorited publishers """

        top_values = self._query_top_values(self.media, self.media.publishers)
        top_rated = self._query_top_rated(self.media, self.media.publishers)
        top_favorited = self._query_top_favorites(self.media, self.media.publishers)

        self.stats.publishers = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_authors(self):
        """ Compute the author top values, top-rated and top favorited authors """

        top_values = self._query_top_values(self.media_authors, self.media_authors.name)
        top_rated = self._query_top_rated(self.media_authors, self.media_authors.name, min_=3)
        top_favorited = self._query_top_favorites(self.media_authors, self.media_authors.name)

        self.stats.authors = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_languages(self):
        """ Compute the language distribution """
        top_values = self._query_top_values(self.media, self.media.language)
        self.stats.languages = TopStats(
            top_values=[StatsValue(name=n.upper() if n else None, value=v) for (n, v) in top_values]
        )

    def calculate_stats(self) -> MediaStats:
        """ Add specific stats to media """

        super().calculate_stats()
        self.compute_total_pages()
        self.compute_pages()
        self.compute_genres()
        self.compute_publishers()
        self.compute_authors()
        self.compute_languages()

        return self.stats


class GamesStatsCalculator(BaseStatsCalculator):
    GROUP = MediaType.GAMES

    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.stats = GamesStats(total_media=MediaTotalStats(0, 0, 0))
        self.status_filter = [self.media_list.status != Status.PLAN_TO_PLAY]

    def _initialize_media_models(self):
        super()._initialize_media_models()
        self.media_platforms = self.media_models[ModelTypes.PLATFORMS]
        self.media_companies = self.media_models[ModelTypes.COMPANIES]

    def compute_playtime(self):
        """ Compute the playtime distribution, and the average playtime """

        playtime = db.session.scalars(db.select(self.media_list.playtime).filter(*self.user_filter, *self.status_filter)).all()
        playtime_bins = [0, 300, 600, 1200, 2400, 4200, 6000, 30000, 60000, 600000]
        playtime_distrib = [sum(1 for play in playtime if playtime_bins[i] <= play < playtime_bins[i + 1])
                            for i in range(len(playtime_bins) - 1)]
        avg_playtime = db.session.query(func.avg(self.media_list.playtime)).filter(*self.user_filter, *self.status_filter).scalar()

        self.stats.avg_playtime = round(avg_playtime / 60, 1) if isinstance(avg_playtime, float) else None
        self.stats.playtime = [StatsValue(name=str(n / 60), value=v) for (n, v) in zip(playtime_bins, playtime_distrib)]

    def compute_genres(self, min_: int = 5):
        """ Compute miscellaneous genres and general genre distribution """
        super().compute_genres(min_)
        self._query_misc_genres("Card Game")
        self._query_misc_genres("Stealth")

    def compute_developers(self):
        """ Compute the developer top values, top-rated and top favorited developers """

        top_values = self._query_top_values(self.media_companies, self.media_companies.name,
                                            filters=[self.media_companies.developer.is_(True)])
        top_rated = self._query_top_rated(self.media_companies, self.media_companies.name, 3,
                                          filters=[self.media_companies.developer.is_(True)])
        top_favorited = self._query_top_favorites(self.media_companies, self.media_companies.name,
                                                  filters=[self.media_companies.developer.is_(True)])

        self.stats.developers = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_publishers(self):
        """ Compute the publisher top values, top-rated and top favorited publishers """

        top_values = self._query_top_values(self.media_companies, self.media_companies.name,
                                            [self.media_companies.publisher.is_(True)])
        top_rated = self._query_top_rated(self.media_companies, self.media_companies.name, 3,
                                          filters=[self.media_companies.publisher.is_(True)])
        top_favorited = self._query_top_favorites(self.media_companies, self.media_companies.name,
                                                  [self.media_companies.publisher.is_(True)])

        self.stats.publishers = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_platforms(self):
        """ Compute the platform top values, top-rated and top favorited platforms """

        top_values = self._query_top_values(self.media_list, self.media_list.platform)
        top_rated = self._query_top_rated(self.media_list, self.media_list.platform, min_=4)
        top_favorited = self._query_top_favorites(self.media_list, self.media_list.platform)

        self.stats.platforms = TopStats(
            top_values=[StatsValue(name=n.value if n else n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n.value if n else n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n.value if n else n, value=v) for (n, v) in top_favorited],
        )

    def compute_modes(self):
        """ Compute the game mode distribution """

        from collections import Counter

        data = (
            db.session.query(self.media.game_modes)
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter, self.media.game_modes.is_not(None))
            .all()
        )

        game_modes = [mode for (row,) in data for mode in row.split(",")]
        mode_counts = Counter(game_modes) or Counter({None: 0})
        self.stats.modes = TopStats(top_values=[StatsValue(name=str(n), value=v) for (n, v) in mode_counts.items()])

    def compute_engines(self):
        """ Compute the top values for game engines """
        top_values = self._query_top_values(self.media, self.media.game_engine)
        self.stats.engines = TopStats(top_values=[StatsValue(name=n, value=v) for (n, v) in top_values])

    def compute_perspectives(self):
        """ Compute the top values for player perspectives """
        top_values = self._query_top_values(self.media, self.media.player_perspective)
        self.stats.perspectives = TopStats(top_values=[StatsValue(name=n, value=v) for (n, v) in top_values])

    def calculate_stats(self) -> MediaStats:
        """ Add specific stats to media """

        super().calculate_stats()
        self.compute_playtime()
        self.compute_genres()
        self.compute_developers()
        self.compute_publishers()
        self.compute_platforms()
        self.compute_modes()
        self.compute_engines()
        self.compute_perspectives()

        return self.stats


class MangaStatsCalculator(BaseStatsCalculator):
    GROUP = MediaType.MANGA

    def __init__(self, scope: StatScope):
        super().__init__(scope)

        self.status_filter = [self.media_list.status != Status.PLAN_TO_READ]

    def _initialize_media_models(self):
        super()._initialize_media_models()
        self.media_authors = self.media_models[ModelTypes.AUTHORS]

    def compute_total_chapters(self):
        """ Already computed in user's pre-computed stats """
        self.stats.total_chapters = self.precomputed_stats.total_specific

    def compute_chapters(self):
        """ Compute the chapters distribution, and the average chapters """

        chapters_distrib = (
            db.session.query(((self.media.chapters // 50) * 50).label("bin"), func.count(self.media_list.media_id))
            .join(*self.common_join)
            .filter(*self.user_filter, *self.status_filter)
            .group_by(text("bin")).order_by(text("bin"))
            .all()
        )

        avg_chapters = (
            db.session.query(func.avg((self.media_list.total / (self.media_list.redo + 1))))
            .filter(*self.user_filter, *self.status_filter)
            .scalar()
        )

        self.stats.avg_chapters = round(avg_chapters, 0) if isinstance(avg_chapters, float) else None
        self.stats.chapters = [StatsValue(name=n, value=v) for (n, v) in chapters_distrib]

    def compute_genres(self, min_: int = 5):
        """ Compute miscellaneous genres and general genre distribution """

        super().compute_genres(min_)
        self._query_misc_genres("Ecchi")
        self._query_misc_genres("Shounen")

    def compute_publishers(self):
        """ Compute the publisher top values, top-rated and top favorited publishers """

        top_values = self._query_top_values(self.media, self.media.publishers)
        top_rated = self._query_top_rated(self.media, self.media.publishers)
        top_favorited = self._query_top_favorites(self.media, self.media.publishers)

        self.stats.publishers = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def compute_authors(self):
        """ Compute the author top values, top-rated and top favorited authors """

        top_values = self._query_top_values(self.media_authors, self.media_authors.name)
        top_rated = self._query_top_rated(self.media_authors, self.media_authors.name, min_=2)
        top_favorited = self._query_top_favorites(self.media_authors, self.media_authors.name)

        self.stats.authors = TopStats(
            top_values=[StatsValue(name=n, value=v) for (n, v) in top_values],
            top_rated=[StatsValue(name=n, value=round(v, 2)) for (n, v) in top_rated],
            top_favorited=[StatsValue(name=n, value=v) for (n, v) in top_favorited],
        )

    def calculate_stats(self) -> MediaStats:
        """ Add specific stats to media """

        super().calculate_stats()
        self.compute_total_chapters()
        self.compute_chapters()
        self.compute_genres(min_=3)
        self.compute_publishers()
        self.compute_authors()

        return self.stats
