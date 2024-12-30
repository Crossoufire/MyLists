from __future__ import annotations

from typing import List, Dict

from flask import abort
from sqlalchemy import func

from backend.api import db
from backend.api.core import current_user
from backend.api.utils.enums import MediaType, Status, JobType
from backend.api.models.abstracts import Media, MediaList, Genres, Actors, Labels


class Movies(Media):
    GROUP: MediaType = MediaType.MOVIES

    original_name = db.Column(db.String, nullable=False)
    director_name = db.Column(db.String)
    homepage = db.Column(db.String)
    duration = db.Column(db.Integer)
    original_language = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)
    budget = db.Column(db.Float)
    revenue = db.Column(db.Float)
    tagline = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("MoviesGenre", back_populates="media", lazy="select")
    actors = db.relationship("MoviesActors", back_populates="media", lazy="select")
    labels = db.relationship("MoviesLabels", back_populates="media", lazy="select")
    list_info = db.relationship("MoviesList", back_populates="media", lazy="dynamic")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "actors": [actor.name for actor in self.actors],
            "genres": self.genres_list,
        })

        return media_dict

    def add_to_user(self, new_status: Status, user_id: int) -> int:
        total_watched = 1 if new_status != Status.PLAN_TO_WATCH else 0

        # noinspection PyArgumentList
        add_movie = MoviesList(
            user_id=user_id,
            media_id=self.id,
            status=new_status,
            total=total_watched,
        )
        db.session.add(add_movie)

        return total_watched

    @classmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Dict]:
        if job == JobType.CREATOR:
            query = cls.query.filter(cls.director_name.ilike(f"%{name}%")).all()
        elif job == JobType.ACTOR:
            query = (
                cls.query.join(MoviesActors, MoviesActors.media_id == cls.id)
                .filter(MoviesActors.name == name)
                .all()
            )
        else:
            return abort(404, description="JobType not found")

        media_in_user_list = (
            db.session.query(MoviesList)
            .filter(MoviesList.user_id == current_user.id, MoviesList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "original_name", "director_name", "release_date", "homepage", "original_language",
                "duration", "synopsis", "budget", "revenue", "tagline"]


class MoviesList(MediaList):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="movies_list", lazy="select")
    media = db.relationship("Movies", back_populates="list_info", lazy="joined")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media.media_cover,
            "media_name": self.media.name,
            "all_status": Status.by(self.GROUP),
            "rating": {
                "type": self.user.rating_system,
                "value": self.rating,
            }
        })

        return media_dict

    def update_total(self, new_redo: int) -> int:
        self.redo = new_redo
        new_total = 1 + new_redo
        self.total = new_total

        return new_total

    def update_status(self, new_status: Status) -> int:
        self.status = new_status
        self.redo = 0
        if new_status == Status.COMPLETED:
            self.total = 1
            new_total = 1
        else:
            self.total = 0
            new_total = 0

        return new_total

    @classmethod
    def total_user_time_def(cls):
        return func.sum(Movies.duration * cls.total)


class MoviesGenre(Genres):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List:
        return ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family",
                "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie",
                "Thriller", "War", "Western"]


class MoviesActors(Actors):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="actors", lazy="select")


class MoviesLabels(Labels):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="labels", lazy="select")
