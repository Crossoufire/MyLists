from __future__ import annotations

from typing import List, Dict, Tuple

from flask import abort
from sqlalchemy import func, text

from backend.api import db
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, Status, ModelTypes, JobType
from backend.api.models.abstracts import Media, MediaList, Labels, Genres, Actors


class TVModel(Media):
    __abstract__ = True

    original_name = db.Column(db.String)
    last_air_date = db.Column(db.String)
    next_episode_to_air = db.Column(db.String)
    season_to_air = db.Column(db.Integer)
    episode_to_air = db.Column(db.Integer)
    homepage = db.Column(db.String)
    created_by = db.Column(db.String)
    duration = db.Column(db.Integer)
    total_seasons = db.Column(db.Integer)
    total_episodes = db.Column(db.Integer)
    origin_country = db.Column(db.String)
    prod_status = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)

    @property
    def eps_seasons_list(self):
        return [s.episodes for s in self.eps_per_season]

    def to_dict(self):
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "eps_per_season": self.eps_seasons_list,
            "networks": [n.name for n in self.networks],
            "actors": [actor.name for actor in self.actors],
            "genres": self.genres_list,
        })

        return media_dict

    def add_to_user(self, new_status: Status, user_id: int) -> int:
        total_watched, new_season, new_episode = 1, 1, 1
        if new_status == Status.COMPLETED:
            new_season = len(self.eps_per_season)
            new_episode = self.eps_per_season[-1].episodes
            total_watched = sum(self.eps_seasons_list)
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
            redo2=[0] * len(self.eps_per_season),
        )

        db.session.add(user_list)

        return total_watched

    @classmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Media]:
        if job == JobType.CREATOR:
            query = cls.query.filter(cls.created_by.ilike(f"%{name}%")).all()
        elif job == JobType.ACTOR:
            tv_actors = eval(f"{cls.__name__}Actors")
            query = cls.query.join(tv_actors, tv_actors.media_id == cls.id).filter(tv_actors.name == name).all()
        elif job == JobType.PLATFORM:
            tv_net = eval(f"{cls.__name__}Network")
            query = cls.query.join(tv_net, tv_net.media_id == cls.id).filter(tv_net.name == name).all()
        else:
            return abort(404, description="JobType not found")

        return query

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "original_name", "release_date", "last_air_date", "homepage",
                "created_by", "duration", "origin_country", "status", "synopsis"]


class TVListModel(MediaList):
    __abstract__ = True

    DEFAULT_STATUS = Status.WATCHING

    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    redo2 = db.Column(db.JSON, nullable=False, default=list)
    total = db.Column(db.Integer)

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media.media_cover,
            "media_name": self.media.name,
            "all_status": Status.by(self.GROUP),
            "eps_per_season": self.media.eps_seasons_list,
            "rating": {
                "type": self.user.rating_system,
                "value": self.rating,
            }
        })

        return media_dict

    def update_status(self, new_status: str) -> Tuple[int, int]:
        """ Return the sum of new redo not the list of seasons redo """

        special_statuses = (Status.RANDOM, Status.PLAN_TO_WATCH)
        new_total = self.total
        new_redo = sum(self.redo2)

        if self.status in special_statuses and new_status not in special_statuses:
            self.last_episode_watched = 1

        self.status = new_status
        if new_status == Status.COMPLETED:
            total_eps = sum(self.media.eps_seasons_list)
            self.current_season = len(self.media.eps_per_season)
            self.last_episode_watched = self.media.eps_per_season[-1].episodes
            self.total = total_eps + sum([self.redo2[i] * self.media.eps_seasons_list[i] for i in range(len(self.media.eps_seasons_list))])
            new_total = total_eps + sum([self.redo2[i] * self.media.eps_seasons_list[i] for i in range(len(self.media.eps_seasons_list))])
        elif new_status in special_statuses:
            self.total = 0
            self.current_season = 1
            self.last_episode_watched = 0
            self.redo2 = [0] * len(self.media.eps_seasons_list)
            new_redo = 0
            new_total = 0

        return new_total, new_redo

    def update_total(self, season_redo: List[int]) -> int:
        old_redo = self.redo2
        old_total = self.total

        redo_diff = [new - old for new, old in zip(season_redo, old_redo)]
        values_to_apply = sum([redo_diff[i] * self.media.eps_seasons_list[i] for i in range(len(redo_diff))])
        new_total = values_to_apply + old_total
        self.total = new_total
        self.redo2 = season_redo

        return new_total

    @classmethod
    def get_available_sorting(cls) -> Dict:
        media = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)
        tablename = cls.__tablename__

        avg_redo = text(f"""
        (
            CASE 
                WHEN JSON_ARRAY_LENGTH({tablename}_redo2) > 0
                THEN (
                    SELECT CAST(SUM(CAST(value AS FLOAT)) AS FLOAT) / 
                    JSON_ARRAY_LENGTH({tablename}_redo2) FROM JSON_EACH({tablename}_redo2)
                ) ELSE 0 
            END
        ) DESC
        """)

        sorting_dict = {
            "Title A-Z": media.name.asc(),
            "Title Z-A": media.name.desc(),
            "Release Date +": media.release_date.desc(),
            "Release Date -": media.release_date.asc(),
            "TMDB Rating +": media.vote_average.desc(),
            "TMDB Rating -": media.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Re-watched": avg_redo,
        }

        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        media_model = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)
        return func.sum(media_model.duration * cls.total)


# --- SERIES -----------------------------------------------------------------------------------------------


class Series(TVModel):
    GROUP = MediaType.SERIES

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("SeriesGenre", back_populates="media", lazy="select")
    actors = db.relationship("SeriesActors", back_populates="media", lazy="select")
    labels = db.relationship("SeriesLabels", back_populates="media", lazy="select")
    list_info = db.relationship("SeriesList", back_populates="media", lazy="dynamic")
    networks = db.relationship("SeriesNetwork", back_populates="media", lazy="select")
    eps_per_season = db.relationship("SeriesEpisodesPerSeason", back_populates="media", lazy="joined")


class SeriesList(TVListModel):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    redo2 = db.Column(db.JSON, nullable=False, default=list)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="series_list", lazy="select")
    media = db.relationship("Series", back_populates="list_info", lazy="joined")


class SeriesGenre(Genres):
    GROUP = MediaType.SERIES

    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List[str]:
        return ["Action & Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Kids",
                "Mystery", "News", "Reality", "Sci-Fi & Fantasy", "Soap", "Talk", "War & Politics", "Western"]


class SeriesEpisodesPerSeason(db.Model):
    TYPE = ModelTypes.EPS
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="eps_per_season", lazy="select")


class SeriesNetwork(db.Model):
    TYPE = ModelTypes.NETWORK
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("series.id"), nullable=False)
    name = db.Column(db.String, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Series", back_populates="networks", lazy="select")


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


# --- ANIME ------------------------------------------------------------------------------------------------


class Anime(TVModel):
    GROUP = MediaType.ANIME

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("AnimeGenre", back_populates="media", lazy="select")
    actors = db.relationship("AnimeActors", back_populates="media", lazy="select")
    labels = db.relationship("AnimeLabels", back_populates="media", lazy="select")
    list_info = db.relationship("AnimeList", back_populates="media", lazy="dynamic")
    networks = db.relationship("AnimeNetwork", back_populates="media", lazy="select")
    eps_per_season = db.relationship("AnimeEpisodesPerSeason", back_populates="media", lazy="joined")


class AnimeList(TVListModel):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    redo2 = db.Column(db.JSON, nullable=False, default=list)

    # --- Relationships -------------------------------------------------------------
    user = db.relationship("User", back_populates="anime_list", lazy="select")
    media = db.relationship("Anime", back_populates="list_info", lazy="joined")


class AnimeGenre(Genres):
    GROUP = MediaType.ANIME

    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List[str]:
        return ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Mystery", "Drama",
                "Ecchi", "Fantasy", "Game", "Hentai", "Historical", "Horror", "Magic", "Martial Arts", "Mecha",
                "Music", "Samurai", "Romance", "School", "Sci-Fi", "Shoujo", "Shounen", "Space", "Sports",
                "Super Power", "Vampire", "Harem", "Slice Of Life", "Supernatural", "Military", "Police",
                "Psychological", "Thriller", "Seinen", "Josei"]


class AnimeEpisodesPerSeason(db.Model):
    TYPE = ModelTypes.EPS
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="eps_per_season", lazy="select")


class AnimeNetwork(db.Model):
    TYPE = ModelTypes.NETWORK
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("anime.id"), nullable=False)
    name = db.Column(db.String, nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Anime", back_populates="networks", lazy="select")


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
