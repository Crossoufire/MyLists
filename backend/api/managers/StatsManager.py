from __future__ import annotations
from typing import List
from sqlalchemy import func, ColumnElement, desc
from backend.api import db
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.users import User, UserMediaUpdate
from backend.api.utils.enums import MediaType, ModelTypes, Status

""" --- SUPERCLASSES ----------------------------------------------------------------------------------- """


class StatsMeta(type):
    subclasses = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.subclasses[attrs["GROUP"]] = new_class
        return new_class


class BaseStats(metaclass=StatsMeta):
    LIMIT: int = 10
    GROUP: MediaType = None

    def __init__(self, user: User):
        self.user = user
        self.data = {}

        self._initialize_models()

        self.common_join = [self.media_list, self.media_list.media_id == self.media.id]
        self.common_filter = []

    @classmethod
    def get_subclass(cls, media_type: MediaType):
        return cls.subclasses.get(media_type, cls)

    def _initialize_models(self):
        self.media_models = ModelsManager.get_dict_models(self.GROUP, "all")

        self.media = self.media_models[ModelTypes.MEDIA]
        self.media_list = self.media_models[ModelTypes.LIST]
        self.media_genre = self.media_models[ModelTypes.GENRE]
        self.media_label = self.media_models[ModelTypes.LABELS]

    def compute_total_media(self):
        data = (
            db.session.query(
                func.count(self.media_list.media_id),
                func.coalesce(func.sum(self.media_list.redo), 0)
            ).filter(self.media_list.user_id == self.user.id)
            .all()
        )

        self.data["total_unique_media"] = data[0][0]
        self.data["total_media"] = data[0][0] + data[0][1]
        self.data["total_redo_media"] = data[0][1]

    def compute_total_time(self):
        raise NotImplementedError("Should be implemented in subclass")

    def compute_total_favorites(self):
        data = (
            db.session.query(func.count(self.media_list.favorite))
            .filter(*self.common_filter, self.media_list.favorite.is_(True))
            .scalar()
        )
        self.data["total_favorites"] = data

    def compute_total_labels(self):
        data = (
            db.session.query(func.count(self.media_label.name.distinct()))
            .filter(self.media_label.user_id == self.user.id)
            .scalar()
        )
        self.data["total_labels"] = data

    def compute_rating(self):
        cte_query = (
            self.media_list.query.with_entities(self.media_list.rating, func.count(self.media_list.rating))
            .filter(*self.common_filter, self.media_list.rating.is_not(None))
            .group_by(self.media_list.rating).order_by(self.media_list.rating)
            .cte()
        )

        distrib_query = db.session.query(cte_query).all()
        avg_rating = db.session.query(func.avg(cte_query.c.rating)).scalar()

        self.data["rating_distribution"] = [{"name": n, "value": v} for n, v in distrib_query]
        self.data["avg_rating"] = round(avg_rating, 2) if isinstance(avg_rating, float) else "-"

    def compute_updates(self):
        cte_query = (
            db.session.query(
                func.strftime("%m", UserMediaUpdate.timestamp).label("month"),
                func.strftime("%Y", UserMediaUpdate.timestamp).label("year"),
                func.count(UserMediaUpdate.media_id).label("updates_count"),
            ).filter(UserMediaUpdate.user_id == self.user.id, UserMediaUpdate.media_type == self.GROUP)
            .group_by("year", "month").order_by("year", "month")
            .cte()
        )

        heatmap_query = db.session.query(cte_query).all()
        avg_updates = db.session.query(func.avg(cte_query.c.updates_count)).scalar()

        self.data["heatmap_updates"] = [{"x_axis": x, "y_axis": y, "value": v} for x, y, v in heatmap_query]
        self.data["avg_updates"] = round(avg_updates, 2) if isinstance(avg_updates, float) else "-"

    def compute_genres(self):
        min_ = 10 if self.GROUP == MediaType.MOVIES else 5

        top_values = self._query_top_values(self.media_genre, self.media_genre.genre)
        top_rated = self._query_top_rated(self.media_genre, self.media_genre.genre, min_=min_)
        top_favorited = self._query_top_favorites(self.media_genre, self.media_genre.genre)

        self.data["lists"]["genres"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def create_stats(self):
        raise NotImplementedError("Should be implemented in subclass")

    def _query_top_values(self, model: db.Model, metric: ColumnElement, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = (
            db.session.query(metric, func.count(metric).label("count"))
            .join(self.media_list, self.media_list.media_id == getattr(model, model_attr))
            .filter(*self.common_filter, metric != "Undefined", *filters)
            .group_by(metric).order_by(desc("count"))
            .limit(self.LIMIT).all()
        )

        return query or [("-", 0)]

    def _query_top_rated(self, model: db.Model, metric: ColumnElement, min_: int = 3, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = (
            db.session.query(metric, func.avg(self.media_list.rating).label("rating"))
            .join(self.media_list, self.media_list.media_id == getattr(model, model_attr))
            .filter(*self.common_filter, metric != "Undefined", self.media_list.rating.is_not(None), *filters)
            .group_by(metric).having((func.count(metric) >= min_))
            .order_by(desc("rating"))
            .limit(self.LIMIT).all()
        )

        return query or [("-", 0)]

    def _query_top_favorites(self, model: db.Model, metric: ColumnElement, filters: List = None):
        if filters is None:
            filters = []

        model_attr = "media_id" if model.TYPE != ModelTypes.MEDIA else "id"
        query = (
            db.session.query(metric, func.count(self.media_list.favorite).label("count"))
            .join(self.media_list, self.media_list.media_id == getattr(model, model_attr))
            .filter(*self.common_filter, metric != "Unknown", self.media_list.favorite.is_(True), *filters)
            .group_by(metric).order_by(desc("count"))
            .limit(self.LIMIT).all()
        )

        return query or [("-", 0)]

    def _query_misc_genres(self, genre: str):
        count_misc_genre = (
            db.session.query(func.count(self.media_genre.media_id))
            .join(self.media_list, self.media_list.media_id == self.media_genre.media_id)
            .filter(*self.common_filter, self.media_genre.genre == genre)
            .scalar()
        )
        self.data[f"total_{genre.lower().replace(' ', '_')}"] = count_misc_genre


class TMDBStats(BaseStats):
    def __init__(self, user: User):
        super().__init__(user)
        self.common_filter = [self.media_list.user_id == self.user.id, self.media_list.status != Status.PLAN_TO_WATCH]

    def _initialize_models(self):
        super()._initialize_models()
        self.media_actors = self.media_models[ModelTypes.ACTORS]

    def compute_total_time(self):
        data = (
            db.session.query(func.coalesce(func.sum(self.media.duration * self.media_list.total), 0))
            .join(*self.common_join).filter(*self.common_filter)
            .scalar()
        )
        self.data["total_time"] = data

    def compute_actors(self):
        min_ = 4 if self.GROUP == MediaType.MOVIES else 3

        top_values = self._query_top_values(self.media_actors, self.media_actors.name)
        top_rated = self._query_top_rated(self.media_actors, self.media_actors.name, min_=min_)
        top_favorited = self._query_top_favorites(self.media_actors, self.media_actors.name)

        self.data["lists"]["actors"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }


class TvStats(TMDBStats):
    def __init__(self, user: User):
        super().__init__(user)

    def _initialize_models(self):
        super()._initialize_models()
        self.media_platforms = self.media_models[ModelTypes.PLATFORMS]
        self.media_eps = self.media_models[ModelTypes.EPS]

    def compute_total_eps_seasons(self):
        data = (
            db.session.query(
                func.coalesce(func.sum(self.media_list.current_season), 0),
                func.coalesce(func.sum(self.media_list.total), 0),
            ).filter(*self.common_filter)
            .all()
        )
        self.data["total_seasons"] = data[0][0]
        self.data["total_episodes"] = data[0][1]

    def compute_durations(self):
        duration_distrib = (
            db.session.query(
                (((self.media.duration * self.media.total_episodes) // 600) * 600).label("bin"),
                func.count(self.media_list.media_id)
            ).join(*self.common_join)
            .filter(*self.common_filter, self.media_list.status != Status.RANDOM)
            .group_by("bin").order_by("bin")
            .all()
        )

        avg_duration = (
            db.session.query(
                func.avg((self.media.duration * (self.media_list.total / (self.media_list.redo + 1)))))
            .join(*self.common_join)
            .filter(*self.common_filter, self.media_list.status != Status.RANDOM)
            .scalar()
        )

        self.data["durations_distribution"] = [{"name": v / 60, "value": c} for (v, c) in duration_distrib]
        self.data["avg_duration"] = round(avg_duration / 60, 1) if isinstance(avg_duration, float) else "-"

    def compute_platforms(self):
        top_values = self._query_top_values(self.media_platforms, self.media_platforms.name,
                                            [self.media_list.status != Status.RANDOM])
        top_rated = self._query_top_rated(self.media_platforms, self.media_platforms.name, 3,
                                          [self.media_list.status != Status.RANDOM])
        top_favorited = self._query_top_favorites(self.media_platforms, self.media_platforms.name,
                                                  [self.media_list.status != Status.RANDOM])

        self.data["lists"]["networks"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_genres(self):
        super().compute_genres()
        self._query_misc_genres("Documentary")
        self._query_misc_genres("Kids")

    def compute_countries(self):
        top_values = self._query_top_values(self.media, self.media.origin_country)
        self.data["lists"]["countries"] = [{"name": d.capitalize(), "value": c} for (d, c) in top_values]

    def compute_release_dates(self):
        release_dates = (
            db.session.query(
                (((func.extract("year", self.media.first_air_date)) // 10) * 10).label("decade"),
                func.count(self.media.first_air_date)
            ).join(*self.common_join)
            .filter(*self.common_filter, self.media.first_air_date != "Unknown")
            .group_by("decade").order_by(self.media.first_air_date.asc())
            .all()
        )

        self.data["lists"]["release_dates"] = [{"name": r, "value": c} for (r, c) in release_dates]

    def create_stats(self):
        self.compute_total_time()
        self.compute_total_media()
        self.compute_total_favorites()
        self.compute_total_eps_seasons()
        self.compute_total_labels()
        self.compute_rating()
        self.compute_durations()
        self.compute_updates()
        self.compute_genres()
        self.compute_platforms()
        self.compute_actors()
        self.compute_countries()
        self.compute_release_dates()

        return self.data


""" --- SUBCLASSES ------------------------------------------------------------------------------------- """


class SeriesStats(TvStats):
    GROUP = MediaType.SERIES

    def __init__(self, user: User):
        super().__init__(user)


class AnimeStats(TvStats):
    GROUP = MediaType.ANIME

    def __init__(self, user: User):
        super().__init__(user)


class MoviesStats(TMDBStats):
    GROUP = MediaType.MOVIES

    def __init__(self, user: User):
        super().__init__(user)

    def compute_total_money(self):
        data = (
            db.session.query(
                func.coalesce(func.sum(self.media.budget), 0),
                func.coalesce(func.sum(self.media.revenue), 0),
            )
            .join(*self.common_join).filter(*self.common_filter)
            .all()
        )
        self.data["values"]["total_budget"] = data[0][0]
        self.data["values"]["total_revenue"] = data[0][1]

    def compute_durations(self):
        duration_distrib = (
            db.session.query(((self.media.duration // 30) * 30).label("bin"), func.count(self.media.id))
            .join(*self.common_join)
            .filter(*self.common_filter)
            .group_by("bin").order_by("bin")
            .all()
        )

        avg_duration = (
            db.session.query(func.avg(self.media.duration))
            .join(*self.common_join)
            .filter(*self.common_filter)
            .scalar()
        )

        self.data["values"]["avg_duration"] = round(avg_duration, 2) if isinstance(avg_duration, float) else "-"
        self.data["lists"]["durations"] = [{"name": v, "value": c} for (v, c) in duration_distrib]

    def compute_directors(self):
        top_values = self._query_top_values(self.media, self.media.director_name)
        top_rated = self._query_top_rated(self.media, self.media.director_name, min_=4)
        top_favorited = self._query_top_favorites(self.media, self.media.director_name)

        self.data["lists"]["directors"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }
        self.data["lists"]["directors"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_genres(self):
        super().compute_genres()
        self._query_misc_genres("Documentary")
        self._query_misc_genres("Animation")

    def compute_languages(self):
        top_values = self._query_top_values(self.media, self.media.original_language)
        self.data["lists"]["languages"] = [{"name": d.capitalize(), "value": c} for (d, c) in top_values]

    def compute_release_dates(self):
        release_dates = (
            db.session.query(
                (((func.extract("year", self.media.release_date)) // 10) * 10).label("decade"),
                func.count(self.media.release_date)
            ).join(*self.common_join)
            .filter(*self.common_filter, self.media.release_date != "Unknown",)
            .group_by("decade").order_by(self.media.release_date.asc())
            .all()
        )

        self.data["lists"]["release_dates"] = [{"name": r, "value": c} for (r, c) in release_dates]

    def create_stats(self):
        self.compute_total_time()
        self.compute_total_media()
        self.compute_total_favorites()
        self.compute_total_money()
        self.compute_total_labels()
        self.compute_rating()
        self.compute_durations()
        self.compute_updates()
        self.compute_directors()
        self.compute_genres()
        self.compute_actors()
        self.compute_languages()
        self.compute_release_dates()

        return self.data


class BooksStats(BaseStats):

    GROUP = MediaType.BOOKS

    def __init__(self, user: User):
        super().__init__(user)
        self.common_filter = [self.media_list.user_id == self.user.id, self.media_list.status != Status.PLAN_TO_READ]

    def _initialize_models(self):
        super()._initialize_models()
        self.media_authors = self.media_models[ModelTypes.AUTHORS]

    def compute_total_time(self):
        data = (
            db.session.query(func.coalesce(func.sum(self.media_list.TIME_PER_PAGE * self.media_list.total), 0))
            .filter(*self.common_filter).scalar()
        )
        self.data["total_time"] = data

    def compute_total_pages(self):
        data = db.session.query(func.coalesce(func.sum(self.media_list.total), 0)).filter(*self.common_filter).scalar()
        self.data["values"]["total_pages"] = data

    def compute_pages(self):
        pages_distrib = (
            db.session.query(((self.media.pages // 100) * 100).label("bin"), func.count(self.media_list.media_id))
            .join(*self.common_join)
            .filter(*self.common_filter)
            .group_by("bin").order_by("bin")
            .all()
        )

        avg_pages = (
            db.session.query(func.avg((self.media_list.total / (self.media_list.redo + 1))))
            .filter(*self.common_filter)
            .scalar()
        )

        self.data["values"]["avg_pages"] = round(avg_pages, 0) if isinstance(avg_pages, float) else "-"
        self.data["lists"]["pages"] = [{"name": v, "value": c} for (v, c) in pages_distrib]

    def compute_genres(self):
        super().compute_genres()
        self._query_misc_genres("Young adult")
        self._query_misc_genres("Classic")

    def compute_publishers(self):
        top_values = self._query_top_values(self.media, self.media.publishers)
        top_rated = self._query_top_rated(self.media, self.media.publishers)
        top_favorited = self._query_top_favorites(self.media, self.media.publishers)

        self.data["lists"]["publishers"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_authors(self):
        top_values = self._query_top_values(self.media_authors, self.media_authors.name)
        top_rated = self._query_top_rated(self.media_authors, self.media_authors.name, min_=3)
        top_favorited = self._query_top_favorites(self.media_authors, self.media_authors.name)

        self.data["lists"]["authors"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_languages(self):
        top_values = self._query_top_values(self.media, self.media.language)
        self.data["lists"]["languages"] = [{"name": d.capitalize(), "value": c} for (d, c) in top_values]

    def compute_release_dates(self):
        release_dates = (
            db.session.query(
                ((self.media.release_date // 10) * 10).label("decade"),
                func.count(self.media.release_date)
            ).join(*self.common_join)
            .filter(*self.common_filter, self.media.release_date != "Unknown",)
            .group_by("decade").order_by(self.media.release_date.asc())
            .all()
        )

        self.data["lists"]["release_dates"] = [{"name": r, "value": c} for (r, c) in release_dates]

    def create_stats(self):
        self.compute_total_media()
        self.compute_total_time()
        self.compute_total_favorites()
        self.compute_total_pages()
        self.compute_total_labels()
        self.compute_rating()
        self.compute_pages()
        self.compute_updates()
        self.compute_authors()
        self.compute_genres()
        self.compute_publishers()
        self.compute_languages()
        self.compute_release_dates()

        return self.data


class GamesStats(BaseStats):

    GROUP = MediaType.GAMES

    def __init__(self, user: User):
        super().__init__(user)
        self.common_filter = [self.media_list.user_id == self.user.id, self.media_list.status != Status.PLAN_TO_PLAY]

    def _initialize_models(self):
        super()._initialize_models()
        self.media_platforms = self.media_models[ModelTypes.PLATFORMS]
        self.media_companies = self.media_models[ModelTypes.COMPANIES]

    def compute_total_media(self):
        data = (
            db.session.query(func.count(self.media_list.media_id))
            .filter(self.media_list.user_id == self.user.id)
            .scalar()
        )
        self.data["total_unique_media"] = data or 0

    def compute_total_time(self):
        data = db.session.query(func.sum(self.media_list.current_playtime)).filter(*self.common_filter).scalar()
        self.data["total_time"] = data or 0

    def compute_playtime(self):
        playtime = db.session.scalars(db.select(self.media_list.current_playtime).filter(*self.common_filter)).all()
        play_bins = [0, 300, 600, 1200, 2400, 4200, 6000, 30000, 60000, 600000]
        play_distrib = [sum(1 for play in playtime if play_bins[i] <= play < play_bins[i + 1])
                        for i in range(len(play_bins) - 1)]
        avg_play = db.session.query(func.avg(self.media_list.current_playtime)).filter(*self.common_filter).scalar()

        self.data["values"]["avg_playtime"] = round(avg_play / 60, 1) if isinstance(avg_play, float) else "-"
        self.data["lists"]["playtime"] = [{"name": v / 60, "value": c} for (v, c) in zip(play_bins, play_distrib)]

    def compute_genres(self):
        super().compute_genres()
        self._query_misc_genres("Card Game")
        self._query_misc_genres("Stealth")

    def compute_developers(self):
        top_values = self._query_top_values(self.media_companies, self.media_companies.name,
                                            filters=[self.media_companies.developer.is_(True)])
        top_rated = self._query_top_rated(self.media_companies, self.media_companies.name, 3,
                                          filters=[self.media_companies.developer.is_(True)])
        top_favorited = self._query_top_favorites(self.media_companies, self.media_companies.name,
                                                  filters=[self.media_companies.developer.is_(True)])

        self.data["lists"]["developers"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_publishers(self):
        top_values = self._query_top_values(self.media_companies, self.media_companies.name,
                                            [self.media_companies.publisher.is_(True)])
        top_rated = self._query_top_rated(self.media_companies, self.media_companies.name, 3,
                                          filters=[self.media_companies.publisher.is_(True)])
        top_favorited = self._query_top_favorites(self.media_companies, self.media_companies.name,
                                                  [self.media_companies.publisher.is_(True)])

        self.data["lists"]["publishers"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_platforms(self):
        top_values = self._query_top_values(self.media_platforms, self.media_platforms.name)
        top_rated = self._query_top_rated(self.media_platforms, self.media_platforms.name)
        top_favorited = self._query_top_favorites(self.media_platforms, self.media_platforms.name)

        self.data["lists"]["platforms"] = {
            "top_values": [{"name": d, "value": c} for (d, c) in top_values],
            "top_rated": [{"name": d, "value": round(c, 2)} for (d, c) in top_rated],
            "top_favorited": [{"name": d, "value": c} for (d, c) in top_favorited],
        }

    def compute_modes(self):
        from collections import Counter

        data = (
            db.session.query(self.media.game_modes)
            .join(*self.common_join).filter(*self.common_filter, self.media.game_modes != "Unknown")
            .all()
        )
        game_modes = [mode for row in data for mode in row[0].split(",")]
        mode_counts = Counter(game_modes)
        self.data["lists"]["modes"] = [{"name": d, "value": c} for (d, c) in mode_counts.items()]

    def compute_engines(self):
        top_values = self._query_top_values(self.media, self.media.game_engine)
        self.data["lists"]["engines"] = [{"name": d, "value": c} for (d, c) in top_values]

    def compute_perspectives(self):
        top_values = self._query_top_values(self.media, self.media.player_perspective)
        self.data["lists"]["perspectives"] = [{"name": d, "value": c} for (d, c) in top_values]

    def compute_release_dates(self):
        release_dates = (
            db.session.query(
                ((func.strftime("%Y", func.datetime(self.media.release_date, "unixepoch")) // 5) * 5).label("re"),
                func.count(self.media_list.media_id)
            ).join(*self.common_join)
            .filter(*self.common_filter, self.media.release_date != "Unknown", self.media.release_date.is_not(None))
            .group_by("re").order_by("re")
            .all()
        )

        self.data["lists"]["release_dates"] = [{"name": r, "value": c} for (r, c) in release_dates]

    def create_stats(self):
        self.compute_total_media()
        self.compute_total_time()
        self.compute_total_favorites()
        self.compute_total_labels()
        self.compute_playtime()
        self.compute_rating()
        self.compute_updates()
        self.compute_developers()
        self.compute_publishers()
        self.compute_platforms()
        self.compute_perspectives()
        self.compute_engines()
        self.compute_genres()
        self.compute_modes()
        self.compute_release_dates()

        return self.data
