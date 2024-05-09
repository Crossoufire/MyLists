from __future__ import annotations
import json
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Tuple
from flask import current_app, abort
from sqlalchemy import func, text, extract, ColumnElement
from backend.api import db
from backend.api.routes.handlers import current_user
from backend.api.models.user_models import User, UserLastUpdate, Notifications
from backend.api.models.utils_models import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes
from backend.api.utils.functions import change_air_format, get_models_group


class TVModel(db.Model):
    """ Abstract SQL model for the <Series> and <Anime> models """

    __abstract__ = True

    TYPE = ModelTypes.MEDIA

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
        return [r.episodes for r in self.eps_per_season]

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

    def add_media_to_user(self, new_status: Enum, user_id: int) -> int:
        """ Add a new series or anime to the current user and return the <new_watched> value """

        new_watched, new_season, new_episode, completion_date = 1, 1, 1, None
        if new_status == Status.COMPLETED:
            new_season = len(self.eps_per_season)
            new_episode = self.eps_per_season[-1].episodes
            new_watched = self.total_episodes
            completion_date = datetime.today()
        elif new_status in (Status.RANDOM, Status.PLAN_TO_WATCH):
            new_episode = 0
            new_watched = 0

        # Get either <SeriesList> or <AnimeList> SQL model
        tv_list = eval(f"{self.__class__.__name__}List")

        # Set new media to user
        user_list = tv_list(
            user_id=user_id,
            media_id=self.id,
            current_season=new_season,
            last_episode_watched=new_episode,
            status=new_status,
            total=new_watched,
            completion_date=completion_date
        )

        db.session.add(user_list)

        return new_watched

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
        """ Refresh a media using the new_data from ApiData """

        # Update main details
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        media = cls.query.filter_by(api_id=api_id).first()

        # Check episodes/seasons compared to refreshed data
        old_seas_eps = [n.episodes for n in media.eps_per_season]
        new_seas_eps = [d["episodes"] for d in new_data["seasons_data"]]

        # Only if two list are different
        if new_seas_eps != old_seas_eps:
            # Get all users with media in list
            all_users_list = media.list_info.filter_by(media_id=media.id).all()

            # For each user update new seasons/episodes
            for user in all_users_list:
                episodes_watched = user.total
                seasons_data = new_data["seasons_data"]

                # Total episodes watched by user >= total new episodes => last season and episode
                if episodes_watched >= sum(s["episodes"] for s in seasons_data):
                    user.last_episode_watched = seasons_data[-1]["episodes"]
                    user.current_season = seasons_data[-1]["season"]
                    continue

                # Else recalculate new season and episodes based on new data
                count = 0
                for season_dict in seasons_data:
                    count += season_dict["episodes"]
                    if count >= episodes_watched:
                        user.last_episode_watched = season_dict["episodes"] - (count - episodes_watched)
                        user.current_season = season_dict["season"]
                        break

            # Delete old seasons/episodes for this media
            eps_seas_model = eval(f"{cls.__name__}EpisodesPerSeason")
            eps_seas_model.query.filter_by(media_id=media.id).delete()

            # Commit deletion
            db.session.commit()

            # Add new seasons/episodes
            for seas in new_data["seasons_data"]:
                season = eps_seas_model(
                    media_id=media.id,
                    season=seas["season"],
                    episodes=seas["episodes"]
                )
                db.session.add(season)

        # Finally commit
        db.session.commit()

    @classmethod
    def get_new_releasing_media(cls):
        """ Check for the new releasing series/anime in a week or less from the TMDB API """

        media_list, eps_model = get_models_group(cls.GROUP, types=[ModelTypes.LIST, ModelTypes.EPS])
        media_list_str = f"{cls.GROUP.value}list"

        try:
            top_eps_sub = (db.session.query(eps_model.media_id, eps_model.episodes.label("last_episode"),
                                            func.max(eps_model.season))
                           .group_by(eps_model.media_id).subquery())

            # noinspection PyComparisonWithNone
            query = (db.session.query(cls.id, cls.episode_to_air, cls.season_to_air, cls.name, cls.next_episode_to_air,
                                      media_list.user_id, top_eps_sub.c.last_episode)
                     .join(media_list, cls.id == media_list.media_id)
                     .join(top_eps_sub, cls.id == top_eps_sub.c.media_id)
                     .filter(cls.next_episode_to_air != None, cls.next_episode_to_air > datetime.utcnow(),
                             cls.next_episode_to_air <= datetime.utcnow() + timedelta(days=7),
                             media_list.status.notin_([Status.RANDOM, Status.DROPPED])).all())

            for info in query:
                notif = Notifications.search(info[5], media_list_str, info[0])
                release_date = datetime.strptime(info[4], "%Y-%m-%d").strftime("%b %d %Y")

                if notif:
                    payload = json.loads(notif.payload_json)
                    # Check if notification fresh
                    if (release_date == payload["release_date"] and int(info[1]) == int(payload["episode"])
                            and int(info[2]) == int(payload["season"])):
                        continue

                payload = {
                    "name": info[3],
                    "release_date": release_date,
                    "season": f"{info[2]:02d}",
                    "episode": f"{info[1]:02d}",
                    "finale": info[6] == info[1],
                }

                # noinspection PyArgumentList
                new_notification = Notifications(
                    user_id=info[5],
                    media_type=media_list_str,
                    media_id=info[0],
                    payload_json=json.dumps(payload)
                )
                db.session.add(new_notification)

            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Error occurred while checking for new releasing {cls.GROUP.value}: {e}")
            db.session.rollback()

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all the TV data not present in a List from the database and locally """

        models = get_models_group(cls.GROUP, "all")
        media_model = models[ModelTypes.MEDIA]
        media_list_model = models[ModelTypes.LIST]
        actors_model = models[ModelTypes.ACTORS]
        genres_model = models[ModelTypes.GENRE]
        network_model = models[ModelTypes.NETWORK]
        eps_model = models[ModelTypes.EPS]
        label_model = models[ModelTypes.LABELS]
        notifications_model = f"{cls.GROUP.value}list"

        try:
            media_to_delete = (cls.query.outerjoin(media_list_model, media_list_model.media_id == cls.id)
                               .filter(media_list_model.media_id.is_(None)).all())

            count_ = 0
            for media in media_to_delete:
                actors_model.query.filter_by(media_id=media.id).delete()
                genres_model.query.filter_by(media_id=media.id).delete()
                network_model.query.filter_by(media_id=media.id).delete()
                eps_model.query.filter_by(media_id=media.id).delete()
                UserLastUpdate.query.filter_by(media_type=cls.GROUP, media_id=media.id).delete()
                Notifications.query.filter_by(media_type=notifications_model, media_id=media.id).delete()
                label_model.query.filter_by(media_id=media.id).delete()
                media_model.query.filter_by(id=media.id).delete()

                count_ += 1
                current_app.logger.info(f"Removed {cls.GROUP.value} with ID: [{media.id}]")

            current_app.logger.info(f"Total {cls.GROUP.value} removed: {count_}")
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
    completion_date = db.Column(db.DateTime)

    class Status(ExtendedEnum):
        """ Status class specific for the series and easiness """

        WATCHING = "Watching"
        COMPLETED = "Completed"
        ON_HOLD = "On Hold"
        RANDOM = "Random"
        DROPPED = "Dropped"
        PLAN_TO_WATCH = "Plan to Watch"

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media.media_cover,
            "media_name": self.media.name,
            "all_status": self.Status.to_list(),
            "eps_per_season": self.media.eps_per_season_list,
        })

        return media_dict

    def update_total_watched(self, new_rewatch: int) -> int:
        """ Update the new total watched series and total and return new total """

        self.rewatched = new_rewatch

        # Calculate new total
        new_total = self.media.total_episodes + (new_rewatch * self.media.total_episodes)
        self.total = new_total

        return new_total

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        """ Compute the new time spent for the user """

        old_time = getattr(current_user, f"time_spent_{self.GROUP.value}")
        setattr(current_user, f"time_spent_{self.GROUP.value}", old_time
                + ((new_value - old_value) * self.media.duration))

    @classmethod
    def total_user_time_def(cls):
        media_model = get_models_group(cls.GROUP, ModelTypes.MEDIA)
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
        return ["All", "Action & Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Kids",
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
        return ["All", "Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Mystery", "Drama",
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
