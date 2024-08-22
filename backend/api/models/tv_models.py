from __future__ import annotations

import json
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Tuple

from flask import current_app, abort
from sqlalchemy import func, ColumnElement

from backend.api import db
from backend.api.models.user_models import UserLastUpdate, Notifications
from backend.api.models.utils_models import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes
from backend.api.utils.functions import change_air_format, reorder_seas_eps
from backend.api.managers.ModelsManager import ModelsManager


class TVModel(db.Model):
    """ Abstract SQL model for the <Series> and <Anime> models """

    __abstract__ = True

    TYPE = ModelTypes.MEDIA
    RELEASE_WINDOW: int = 7

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    original_name = db.Column(db.String(50), nullable=False)
    first_air_date = db.Column(db.String(30))
    last_air_date = db.Column(db.String(30))
    next_episode_to_air = db.Column(db.String(30))
    season_to_air = db.Column(db.Integer)
    episode_to_air = db.Column(db.Integer)
    homepage = db.Column(db.String(200))
    in_production = db.Column(db.Boolean)
    created_by = db.Column(db.String(100))
    duration = db.Column(db.Integer)
    total_seasons = db.Column(db.Integer, nullable=False)
    total_episodes = db.Column(db.Integer)
    origin_country = db.Column(db.String(20))
    status = db.Column(db.String(50))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    synopsis = db.Column(db.Text)
    popularity = db.Column(db.Float)
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    last_api_update = db.Column(db.DateTime)
    lock_status = db.Column(db.Boolean, default=0)

    @property
    def formatted_date(self) -> List[str]:
        first_air_date = change_air_format(self.first_air_date, tv=True)
        last_air_date = change_air_format(self.last_air_date, tv=True)
        return [first_air_date, last_air_date]

    @property
    def eps_per_season_list(self):
        return [s.episodes for s in self.eps_per_season]

    def to_dict(self):
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "formatted_date": self.formatted_date,
            "eps_per_season": self.eps_per_season_list,
            "networks": [r.network for r in self.networks],
            "actors": self.actors_list,
            "genres": self.genres_list,
        })

        return media_dict

    def add_media_to_user(self, new_status: Status, user_id: int) -> int:
        """ Add a new series or anime to the current user and return the <total_watched> value """

        total_watched, new_season, new_episode = 1, 1, 1
        if new_status == Status.COMPLETED:
            new_season = len(self.eps_per_season)
            new_episode = self.eps_per_season[-1].episodes
            # Better using <sum(eps_per_season)> than <total_episodes> (discrepancy happens between the two)
            total_watched = sum(self.eps_per_season_list)
        elif new_status in (Status.RANDOM, Status.PLAN_TO_WATCH):
            new_episode = 0
            total_watched = 0

        # Get <SeriesList> or <AnimeList> model
        tv_list = eval(f"{self.__class__.__name__}List")

        user_list = tv_list(
            user_id=user_id,
            media_id=self.id,
            current_season=new_season,
            last_episode_watched=new_episode,
            status=new_status,
            total=total_watched,
        )

        db.session.add(user_list)

        return total_watched

    @classmethod
    def get_information(cls, job: str, info: str) -> List[Dict]:
        """ Get either creator or actor and return its list of series/anime """

        if job == "creator":
            query = cls.query.filter(cls.created_by.ilike(f"%{info}%")).all()
        elif job == "actor":
            tv_actors = eval(f"{cls.__name__}Actors")
            query = cls.query.join(tv_actors, tv_actors.media_id == cls.id).filter(tv_actors.name == info).all()
        elif job == "network":
            tv_net = eval(f"{cls.__name__}Network")
            query = cls.query.join(tv_net, tv_net.media_id == cls.id).filter(tv_net.network == info).all()
        else:
            return abort(400)

        # Check media in user's list
        tv_list = eval(f"{cls.__name__}List")
        media_in_user_list = (
            db.session.query(tv_list)
            .filter(tv_list.user_id == current_user.id, tv_list.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        """ Refresh a media using the updated data created with the ApiData class """

        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        media = cls.query.filter_by(api_id=api_id).first()

        old_seas_eps = [season.episodes for season in media.eps_per_season]
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
    def get_new_releasing_media(cls):
        """ Check for the new releasing TV media in a week or less from the TMDB API """

        media_list, eps_model = ModelsManager.get_lists_models(cls.GROUP, [ModelTypes.LIST, ModelTypes.EPS])
        media_list_str = f"{cls.GROUP.value}list"

        try:
            top_eps_sub = (
                db.session.query(
                    eps_model.media_id, eps_model.episodes.label("last_episode"),
                    func.max(eps_model.season)
                ).group_by(eps_model.media_id)
                .subquery()
            )

            query = (
                db.session.query(cls.id, cls.episode_to_air, cls.season_to_air, cls.name, cls.next_episode_to_air,
                                 media_list.user_id, top_eps_sub.c.last_episode)
                .join(media_list, cls.id == media_list.media_id)
                .join(top_eps_sub, cls.id == top_eps_sub.c.media_id)
                .filter(
                    cls.next_episode_to_air.is_not(None),
                    cls.next_episode_to_air > datetime.utcnow(),
                    cls.next_episode_to_air <= datetime.utcnow() + timedelta(days=cls.RELEASE_WINDOW),
                    media_list.status.notin_([Status.RANDOM, Status.DROPPED])
                ).all()
            )

            for info in query:
                tv_id, eps_to_air, seas_to_air, name, next_eps_to_air, user_id, last_episode = info
                notif = Notifications.search(user_id, media_list_str, tv_id)
                release_date = datetime.strptime(next_eps_to_air, "%Y-%m-%d").strftime("%b %d %Y")

                # Check if notification fresh
                if notif:
                    payload = json.loads(notif.payload_json)
                    if (
                            release_date == payload["release_date"]
                            and int(eps_to_air) == int(payload["episode"])
                            and int(seas_to_air) == int(payload["season"])
                    ):
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
                    media_type=media_list_str,
                    media_id=tv_id,
                    payload_json=json.dumps(payload)
                )
                db.session.add(new_notification)

            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Error occurred while checking for new releasing {cls.GROUP.value}: {e}")
            db.session.rollback()

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all the TV data not present in a List from the database and the disk """

        models = ModelsManager.get_dict_models(cls.GROUP, "all")
        media_model = models[ModelTypes.MEDIA]
        media_list_model = models[ModelTypes.LIST]
        actors_model = models[ModelTypes.ACTORS]
        genres_model = models[ModelTypes.GENRE]
        network_model = models[ModelTypes.NETWORK]
        eps_model = models[ModelTypes.EPS]
        label_model = models[ModelTypes.LABELS]
        notifications_model = f"{cls.GROUP.value}list"

        try:
            media_to_delete = (
                cls.query.outerjoin(media_list_model, media_list_model.media_id == cls.id)
                .filter(media_list_model.media_id.is_(None))
                .all()
            )

            current_app.logger.info(f"{cls.GROUP.value} to delete: {len(media_to_delete)}")
            media_ids = [media.id for media in media_to_delete]

            actors_model.query.filter(actors_model.media_id.in_(media_ids)).delete()
            genres_model.query.filter(genres_model.media_id.in_(media_ids)).delete()
            network_model.query.filter(network_model.media_id.in_(media_ids)).delete()
            eps_model.query.filter(eps_model.media_id.in_(media_ids)).delete()
            UserLastUpdate.query.filter(UserLastUpdate.media_type == cls.GROUP,
                                        UserLastUpdate.media_id.in_(media_ids)).delete()
            Notifications.query.filter(Notifications.media_type == notifications_model,
                                       Notifications.media_id.in_(media_ids)).delete()
            label_model.query.filter(label_model.media_id.in_(media_ids)).delete()
            media_model.query.filter(cls.id.in_(media_ids)).delete()

            db.session.commit()

            current_app.logger.info(f"{cls.GROUP.value} successfully deleted")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing {cls.GROUP.value} and related records: {str(e)}")

    @staticmethod
    def form_only() -> List[str]:
        """ Return the allowed fields for a form """
        return ["name", "original_name", "first_air_date", "last_air_date", "homepage", "created_by", "duration",
                "origin_country", "status", "synopsis"]


class TVListModel(MediaListMixin, db.Model):
    """ Abstract SQL model for the <SeriesList> and <AnimeList> models """

    __abstract__ = True

    GROUP = None
    TYPE = ModelTypes.LIST
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.WATCHING

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    total = db.Column(db.Integer)
    comment = db.Column(db.Text)

    class Status(ExtendedEnum):
        """ Status class specific for the series and easiness """

        WATCHING = "Watching"
        COMPLETED = "Completed"
        ON_HOLD = "On Hold"
        RANDOM = "Random"
        DROPPED = "Dropped"
        PLAN_TO_WATCH = "Plan to Watch"

    def to_dict(self) -> Dict:
        is_feeling = self.user.add_feeling

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        del media_dict["feeling"]
        del media_dict["score"]

        media_dict.update({
            "media_cover": self.media.media_cover,
            "media_name": self.media.name,
            "all_status": self.Status.to_list(),
            "eps_per_season": self.media.eps_per_season_list,
            "rating": {
                "type": "feeling" if is_feeling else "score",
                "value": self.feeling if is_feeling else self.score
            }
        })

        return media_dict

    def update_total_watched(self, new_rewatch: int) -> int:
        """ Update the new rewatched and total watched for Series and Anime. The <media.total_episodes> is unused
        for discrepancy happening with the <sum(eps_per_season)>. Return the new total. """

        self.rewatched = new_rewatch

        sum_episodes = sum(self.media.eps_per_season_list)
        new_total = sum_episodes + (new_rewatch * sum_episodes)
        self.total = new_total

        return new_total

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        """ Compute the new time spent for the user """

        time_spent_attr = f"time_spent_{self.GROUP.value}"
        old_time = getattr(current_user, time_spent_attr)
        setattr(
            current_user,
            time_spent_attr,
            old_time + ((new_value - old_value) * self.media.duration),
        )

    @classmethod
    def total_user_time_def(cls):
        media_model = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)
        return func.sum(media_model.duration * cls.total)


class TVLabelsModel(MediaLabelMixin, db.Model):
    """ Abstract SQL model for the <SeriesLabels> and <AnimeLabels> models """

    __abstract__ = True

    TYPE = ModelTypes.LABELS

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    label = db.Column(db.String(64), nullable=False)

    def to_dict(self) -> Dict:
        """ Serialization of the <SeriesLabels> and <AnimeLabels> models """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict


# --- SERIES ------------------------------------------------------------------------------------------------------


class Series(MediaMixin, TVModel):
    """ Series SQL model """

    GROUP = MediaType.SERIES

    genres = db.relationship("SeriesGenre", backref="series", lazy=True)
    actors = db.relationship("SeriesActors", backref="series", lazy=True)
    eps_per_season = db.relationship("SeriesEpisodesPerSeason", backref="series", lazy=False)
    networks = db.relationship("SeriesNetwork", backref="series", lazy=True)
    list_info = db.relationship("SeriesList", back_populates="media", lazy="dynamic")


class SeriesList(TVListModel):
    """ SeriesList SQL Model """

    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="list_info", lazy="joined")

    @classmethod
    def additional_search_joins(cls) -> List[Tuple[db.Model, ColumnElement]]:
        return [(SeriesNetwork, SeriesNetwork.media_id == Series.id),
                (SeriesActors, SeriesActors.media_id == Series.id)]

    @classmethod
    def additional_search_filters(cls, search: str) -> List[ColumnElement]:
        return [Series.name.ilike(f"%{search}%"), Series.original_name.ilike(f"%{search}%"),
                SeriesNetwork.network.ilike(f"%{search}%"), SeriesActors.name.ilike(f"%{search}%")]


class SeriesGenre(db.Model):
    """ Series genres SQL Model """

    TYPE = ModelTypes.GENRE
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)

    @staticmethod
    def get_available_genres() -> List[str]:
        """ Return all the series genres """
        return ["Action & Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Kids",
                "Mystery", "News", "Reality", "Sci-Fi & Fantasy", "Soap", "Talk", "War & Politics", "Western"]


class SeriesEpisodesPerSeason(db.Model):
    """ Series episodes per season SQL Model """

    TYPE = ModelTypes.EPS
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class SeriesNetwork(db.Model):
    """ Series networks SQL Model """

    TYPE = ModelTypes.NETWORK
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class SeriesActors(db.Model):
    """ Series actors SQL Model """

    TYPE = ModelTypes.ACTORS
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    name = db.Column(db.String(150))


class SeriesLabels(TVLabelsModel):
    """ SeriesLabels SQL model """

    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", lazy="joined")


# --- ANIME -------------------------------------------------------------------------------------------------------


class Anime(MediaMixin, TVModel):
    """ Anime SQL Model """

    GROUP = MediaType.ANIME

    genres = db.relationship("AnimeGenre", backref="anime", lazy=True)
    actors = db.relationship("AnimeActors", backref="anime", lazy=True)
    eps_per_season = db.relationship('AnimeEpisodesPerSeason', backref="anime", lazy=False)
    networks = db.relationship("AnimeNetwork", backref="anime", lazy=True)
    list_info = db.relationship("AnimeList", back_populates="media", lazy="dynamic")


class AnimeList(TVListModel):
    """ AnimeList SQL model """

    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -------------------------------------------------------------
    media = db.relationship("Anime", back_populates="list_info", lazy="joined")

    @classmethod
    def additional_search_joins(cls) -> List[Tuple[db.Model, ColumnElement]]:
        return [(AnimeNetwork, AnimeNetwork.media_id == Anime.id),
                (AnimeActors, AnimeActors.media_id == Anime.id)]

    @classmethod
    def additional_search_filters(cls, search: str) -> List[ColumnElement]:
        return [Anime.name.ilike(f"%{search}%"), Anime.original_name.ilike(f"%{search}%"),
                AnimeNetwork.network.ilike(f"%{search}%"), AnimeActors.name.ilike(f"%{search}%")]


class AnimeGenre(db.Model):
    """ Anime genre SQL model """

    TYPE = ModelTypes.GENRE
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)

    @staticmethod
    def get_available_genres() -> List[str]:
        """ Return all the anime genres """
        return ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Mystery", "Drama",
                "Ecchi", "Fantasy", "Game", "Hentai", "Historical", "Horror", "Magic", "Martial Arts", "Mecha",
                "Music", "Samurai", "Romance", "School", "Sci-Fi", "Shoujo", "Shounen", "Space", "Sports",
                "Super Power", "Vampire", "Harem", "Slice Of Life", "Supernatural", "Military", "Police",
                "Psychological", "Thriller", "Seinen", "Josei"]


class AnimeEpisodesPerSeason(db.Model):
    """ Anime episode per season SQL model """

    TYPE = ModelTypes.EPS
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class AnimeNetwork(db.Model):
    """ Anime network SQL model """

    TYPE = ModelTypes.NETWORK
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class AnimeActors(db.Model):
    """ Anime actors SQL model """

    TYPE = ModelTypes.ACTORS
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    name = db.Column(db.String(150))


class AnimeLabels(TVLabelsModel):
    """ AnimeLabels SQL model """

    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", lazy="joined")
