from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Type
from flask import current_app, abort
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.models.abstracts import Platform, Actors, Media, MediaList, Genre, Labels
from backend.api.models.users import Notifications, User, UserMediaUpdate
from backend.api.core.handlers import current_user
from backend.api.utils.enums import MediaType, Status, ModelTypes, NotificationType, JobType
from backend.api.utils.functions import ModelsFetcher, reorder_seas_eps


class TVModel(Media):
    __abstract__ = True

    original_name = db.Column(db.String, nullable=False)
    last_air_date = db.Column(db.String)
    next_episode_to_air = db.Column(db.String)
    season_to_air = db.Column(db.Integer)
    episode_to_air = db.Column(db.Integer)
    homepage = db.Column(db.String)
    in_production = db.Column(db.Boolean)
    created_by = db.Column(db.String)
    duration = db.Column(db.Integer)
    total_seasons = db.Column(db.Integer)
    total_episodes = db.Column(db.Integer)
    language = db.Column(db.String)
    prod_status = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)

    @staticmethod
    def get_medialist_model(media_type: MediaType) -> Type[MediaList]:
        return SeriesList if media_type == MediaType.SERIES else AnimeList

    def add_to_user(self, user_id: int, status: Status) -> Tuple[int, MediaList]:
        total_watched, new_season, new_episode = 1, 1, 1
        if status == Status.COMPLETED:
            new_season = len(self.eps_seasons)
            new_episode = self.eps_seasons[-1].episodes
            total_watched = sum([s.episode for s in self.eps_seasons])
        elif status in (Status.RANDOM, Status.PLAN_TO_WATCH):
            new_episode = 0
            total_watched = 0

        tv_list = self.get_medialist_model(self.GROUP)

        # noinspection PyArgumentList
        media_assoc = tv_list(
            user_id=user_id,
            media_id=self.id,
            current_season=new_season,
            current_episode=new_episode,
            status=status,
            total=total_watched,
        )
        db.session.add(media_assoc)
        db.session.flush()

        return total_watched, media_assoc

    @classmethod
    def create_new_release_notification(cls):
        media_list, eps_model = ModelsFetcher.get_lists_models(cls.GROUP, [ModelTypes.LIST, ModelTypes.EPS])

        top_eps_sub = (
            db.session.query(
                eps_model.media_id, eps_model.episodes.label("last_episode"),
                func.max(eps_model.season)
            ).group_by(eps_model.media_id)
            .subquery()
        )

        query = (
            db.session.query(
                cls.id, cls.episode_to_air, cls.season_to_air, cls.name, cls.next_episode_to_air,
                media_list.user_id, top_eps_sub.c.last_episode
            ).join(media_list, cls.id == media_list.media_id)
            .join(top_eps_sub, cls.id == top_eps_sub.c.media_id)
            .filter(
                cls.next_episode_to_air.is_not(None),
                cls.next_episode_to_air > datetime.utcnow(),
                cls.next_episode_to_air <= datetime.utcnow() + timedelta(days=cls.RELEASE_WINDOW),
                media_list.status.notin_([Status.RANDOM, Status.DROPPED])
            ).all()
        )

        for media_id, eps_to_air, seas_to_air, name, next_eps_to_air, user_id, last_episode in query:
            notification = (
                Notifications.query.filter_by(user_id=user_id, media_id=media_id, media_type=cls.GROUP)
                .first()
            )
            release_date = datetime.strptime(next_eps_to_air, "%Y-%m-%d").strftime("%b %d %Y")

            if notification:
                payload = json.loads(notification.notif_data)
                if (release_date == payload["release_date"] and int(eps_to_air) == int(payload["episode"])
                        and int(seas_to_air) == int(payload["season"])):
                    continue

            payload = dict(
                name=name,
                release_date=release_date,
                season=f"{seas_to_air:02d}",
                episode=f"{eps_to_air:02d}",
                finale=(last_episode == eps_to_air),
            )

            new_notification = Notifications(
                user_id=user_id,
                media_type=cls.GROUP,
                media_id=media_id,
                notif_type=NotificationType.MEDIA,
                notif_data=json.dumps(payload),
            )
            db.session.add(new_notification)
        db.session.commit()

    @classmethod
    def get_information(cls, job: JobType, name: str) -> List[Dict]:
        if job == JobType.CREATOR:
            all_media = cls.query.filter(cls.created_by.ilike(f"%{name}%")).all()

        if job == JobType.ACTOR:
            tv_actors = eval(f"{cls.__name__}Actors")
            all_media = cls.query.join(tv_actors, tv_actors.media_id == cls.id).filter(tv_actors.name == name).all()

        if job == JobType.PLATFORM:
            tv_net = eval(f"{cls.__name__}Platform")
            all_media = cls.query.join(tv_net, tv_net.media_id == cls.id).filter(tv_net.network == name).all()

        tv_list = cls.get_medialist_model(cls.GROUP)

        # noinspection PyUnboundLocalVariable
        media_assoc_with_user = (
            db.session.query(tv_list)
            .filter(tv_list.user_id == current_user.id, tv_list.media_id.in_([media.id for media in all_media]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_assoc_with_user]

        for media in all_media:
            if media.id in user_media_ids:
                media.in_list = True

        return all_media

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        """ Refresh a media using the updated data created with the ApiData class """

        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        media = cls.query.filter_by(api_id=api_id).first()

        old_seas_eps = [season.episodes for season in media.eps_seasons]
        new_seas_eps = [season["episodes"] for season in new_data["seasons_data"]]

        # Check episodes/seasons compared to refreshed data
        if new_seas_eps == old_seas_eps:
            db.session.commit()
            return

        # Different lists of episodes
        all_users_list = media.list_info.filter_by(media_id=media.id).all()
        for user_list in all_users_list:
            total_eps = (sum(user_list.media.eps_per_season_list[:user_list.current_season - 1])
                         + user_list.last_episode_watched)
            last_episode, last_season, new_total = reorder_seas_eps(total_eps, new_seas_eps)
            user_list.current_season = last_season
            user_list.last_episode_watched = last_episode
            user_list.total = new_total * (user_list.rewatched + 1)

            # # Send notifications to new episodes/seasons and update media status to <ON_HOLD>
            # if sum(old_seas_eps) < sum(new_seas_eps) and user_list.status == Status.COMPLETED:
            #     user_list.status = Status.ON_HOLD
            #     user_list.total = new_total
            #     user_list.rewatched = 0
            #     new_notification = Notifications(
            #         user_id=user_list.user_id,
            #         media_type=f"{cls.GROUP.value}list",
            #         media_id=media.id,
            #         payload_json=json.dumps({
            #             "new": True,
            #             "name": user_list.media.name,
            #             "message": "New episodes available!",
            #         }),
            #     )
            #     db.session.add(new_notification)
            #     UserLastUpdate.set_new_update(
            #         media=media,
            #         update_type="status",
            #         old_value=Status.COMPLETED,
            #         new_value=Status.ON_HOLD,
            #     )

        # Delete old seasons/episodes for this media
        eps_seas_model = eval(f"{cls.__name__}EpisodesPerSeason")
        eps_seas_model.query.filter_by(media_id=media.id).delete()
        db.session.commit()

        # Add new seasons/episodes
        new_eps_seas_list = []
        for season, episodes in enumerate(new_seas_eps, start=1):
            new_eps_seas_list.append(eps_seas_model(media_id=media.id, season=season, episodes=episodes))
        db.session.add_all(new_eps_seas_list)
        db.session.commit()

    @classmethod
    def remove_non_list_media(cls):
        models = ModelsFetcher.get_dict_models(cls.GROUP, "all")
        media_model = models[ModelTypes.MEDIA]
        media_list_model = models[ModelTypes.LIST]
        actors_model = models[ModelTypes.ACTORS]
        genres_model = models[ModelTypes.GENRE]
        network_model = models[ModelTypes.PLATFORMS]
        eps_model = models[ModelTypes.EPS]
        label_model = models[ModelTypes.LABELS]

        media_to_delete = (
            cls.query.outerjoin(media_list_model, media_list_model.media_id == cls.id)
            .filter(media_list_model.media_id.is_(None)).all()
        )

        current_app.logger.info(f"{cls.GROUP.value} to delete: {len(media_to_delete)}")
        media_ids = [media.id for media in media_to_delete]

        actors_model.query.filter(actors_model.media_id.in_(media_ids)).delete()
        genres_model.query.filter(genres_model.media_id.in_(media_ids)).delete()
        network_model.query.filter(network_model.media_id.in_(media_ids)).delete()
        eps_model.query.filter(eps_model.media_id.in_(media_ids)).delete()
        UserMediaUpdate.query.filter(UserMediaUpdate.media_type == cls.GROUP,
                                     UserMediaUpdate.media_id.in_(media_ids)).delete()
        Notifications.query.filter(Notifications.media_type == cls.GROUP,
                                   Notifications.media_id.in_(media_ids)).delete()
        label_model.query.filter(label_model.media_id.in_(media_ids)).delete()
        media_model.query.filter(cls.id.in_(media_ids)).delete()

        db.session.commit()
        current_app.logger.info(f"{cls.GROUP.value} successfully deleted")

    @staticmethod
    def editable_columns() -> List[str]:
        return ["name", "original_name", "release_date", "last_air_date", "homepage", "created_by", "duration",
                "origin_country", "status", "synopsis"]


class TVListModel(MediaList):
    __abstract__ = True

    DEFAULT_STATUS = Status.WATCHING

    current_season = db.Column(db.Integer, nullable=False)
    current_episode = db.Column(db.Integer, nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer, nullable=False, default=0)

    @staticmethod
    def get_media_model(media_type: MediaType) -> Type[Media]:
        return Series if media_type == MediaType.SERIES else Anime

    def update_time_spent(self, user: User, old_value: int = 0, new_value: int = 0):
        setting = user.get_media_setting(self.GROUP)
        setting.time_spent += (new_value - old_value) * self.media.duration

    def update_total(self, redo: int) -> int:
        self.redo = redo
        sum_episodes = sum([s.episode for s in self.media.eps_seasons])
        new_total = sum_episodes + (redo * sum_episodes)
        self.total = new_total

        return new_total

    def update_status(self, status: str) -> int:
        new_total = self.total

        self.status = status
        self.redo = 0
        if status == Status.COMPLETED:
            total_eps = sum([s.episode for s in self.media.eps_seasons])
            self.current_season = len(self.media.eps_seasons)
            self.current_episode = self.media.eps_seasons[-1].episode
            self.total = total_eps
            new_total = total_eps
        elif status in (Status.RANDOM, Status.PLAN_TO_WATCH):
            new_total = 0
            self.total = 0
            self.current_season = 1
            self.current_episode = 0

        return new_total

    @classmethod
    def available_sorting(cls) -> Dict[str, ColumnElement]:
        media_model = cls.get_media_model(cls.GROUP)
        sorting_dict = {
            "Title A-Z": media_model.name.asc(),
            "Title Z-A": media_model.name.desc(),
            "Duration +": media_model.duration.desc(),
            "Duration -": media_model.duration.asc(),
            "Release date +": media_model.release_date.desc(),
            "Release date -": media_model.release_date.asc(),
            "TMDB Rating +": media_model.vote_average.desc(),
            "TMDB Rating -": media_model.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
        }
        return sorting_dict

    @classmethod
    def time_spent_calculation(cls) -> ColumnElement:
        media_model = ModelsFetcher.get_unique_model(cls.GROUP, ModelTypes.MEDIA)
        return func.sum(media_model.duration * cls.total)


# --- SERIES ------------------------------------------------------------------------------------------------------


class Series(TVModel):
    GROUP = MediaType.SERIES

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("SeriesGenre", back_populates="media", lazy="select")
    actors = db.relationship("SeriesActors", back_populates="media", lazy="select")
    labels = db.relationship("SeriesLabels", back_populates="media", lazy="dynamic")
    media_list = db.relationship("SeriesList", back_populates="media", lazy="dynamic")
    platforms = db.relationship("SeriesPlatform", back_populates="media", lazy="select")
    eps_seasons = db.relationship("SeriesEpsPerSeason", back_populates="media", lazy="joined")


class SeriesList(TVListModel):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="series_list", lazy="select")
    media = db.relationship("Series", back_populates="media_list", lazy="joined")


class SeriesGenre(Genre):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="genres", lazy="select")

    @staticmethod
    def available_genres() -> List[str]:
        return ["Action & Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Kids",
                "Mystery", "News", "Reality", "Sci-Fi & Fantasy", "Soap", "Talk", "War & Politics", "Western"]


class SeriesEpsPerSeason(db.Model):
    TYPE = ModelTypes.EPS
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episode = db.Column(db.Integer, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="eps_seasons", lazy="select")


class SeriesPlatform(Platform):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="platforms", lazy="select")


class SeriesActors(Actors):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="actors", lazy="select")


class SeriesLabels(Labels):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="labels", lazy="select")


# --- ANIME -------------------------------------------------------------------------------------------------------


class Anime(TVModel):
    GROUP = MediaType.ANIME

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("AnimeGenre", back_populates="media", lazy="select")
    actors = db.relationship("AnimeActors", back_populates="media", lazy="select")
    labels = db.relationship("AnimeLabels", back_populates="media", lazy="dynamic")
    media_list = db.relationship("AnimeList", back_populates="media", lazy="dynamic")
    platforms = db.relationship("AnimePlatform", back_populates="media", lazy="select")
    eps_seasons = db.relationship("AnimeEpsPerSeason", back_populates="media", lazy="joined")


class AnimeList(TVListModel):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -------------------------------------------------------------
    user = db.relationship("User", back_populates="anime_list", lazy="select")
    media = db.relationship("Anime", back_populates="media_list", lazy="joined")


class AnimeGenre(Genre):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="genres", lazy="select")

    @staticmethod
    def available_genres() -> List[str]:
        return ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Mystery", "Drama",
                "Ecchi", "Fantasy", "Game", "Hentai", "Historical", "Horror", "Magic", "Martial Arts", "Mecha",
                "Music", "Samurai", "Romance", "School", "Sci-Fi", "Shoujo", "Shounen", "Space", "Sports",
                "Super Power", "Vampire", "Harem", "Slice Of Life", "Supernatural", "Military", "Police",
                "Psychological", "Thriller", "Seinen", "Josei"]


class AnimeEpsPerSeason(db.Model):
    TYPE = ModelTypes.EPS
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="eps_seasons", lazy="select")


class AnimePlatform(Platform):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="platforms", lazy="select")


class AnimeActors(Actors):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="actors", lazy="select")


class AnimeLabels(Labels):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="labels", lazy="select")
