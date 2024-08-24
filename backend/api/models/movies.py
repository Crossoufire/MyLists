from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Type
from flask import current_app, abort
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.core import current_user
from backend.api.models.abstracts import Media, MediaList, Genres, Actors, Labels
from backend.api.models.user import Notifications, UserMediaUpdate
from backend.api.utils.enums import MediaType, Status, JobType, NotificationType


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
            return abort(400, "Invalid job type")

        media_in_user_list = (
            db.session.query(MoviesList)
            .filter(MoviesList.user_id == current_user.id, MoviesList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @classmethod
    def remove_non_list_media(cls):
        try:
            movies_to_delete = (
                cls.query.outerjoin(MoviesList, MoviesList.media_id == cls.id)
                .filter(MoviesList.media_id.is_(None))
                .all()
            )

            current_app.logger.info(f"Movies to delete: {len(movies_to_delete)}")
            movie_ids = [movie.id for movie in movies_to_delete]

            MoviesActors.query.filter(MoviesActors.media_id.in_(movie_ids)).delete()
            MoviesGenre.query.filter(MoviesGenre.media_id.in_(movie_ids)).delete()
            UserMediaUpdate.query.filter(
                UserMediaUpdate.media_type == cls.GROUP,
                UserMediaUpdate.media_id.in_(movie_ids)
            ).delete()
            Notifications.query.filter(
                Notifications.media_type == cls.GROUP,
                Notifications.media_id.in_(movie_ids)
            ).delete()
            MoviesLabels.query.filter(MoviesLabels.media_id.in_(movie_ids)).delete()
            cls.query.filter(cls.id.in_(movie_ids)).delete()

            db.session.commit()

            current_app.logger.info(f"Movies successfully deleted")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing movies and related records: {str(e)}")

    @classmethod
    def get_new_releasing_media(cls):
        query = (
            db.session.query(cls.id, MoviesList.user_id, cls.release_date, cls.name)
            .join(MoviesList, cls.id == MoviesList.media_id)
            .filter(
                cls.release_date.is_not(None),
                cls.release_date > datetime.utcnow(),
                cls.release_date <= datetime.utcnow() + timedelta(days=cls.RELEASE_WINDOW),
            ).all()
        )

        for media_id, user_id, release_date, name in query:
            notification = Notifications.search(user_id, cls.GROUP, media_id)

            if not notification:
                new_notification = Notifications(
                    user_id=user_id,
                    media_id=media_id,
                    media_type=cls.GROUP,
                    notification_type=NotificationType.MEDIA,
                    payload=json.dumps({"name": name, "release_date": release_date})
                )
                db.session.add(new_notification)

        db.session.commit()

    @classmethod
    def automatic_locking(cls) -> Tuple[int, int]:
        locking_threshold = datetime.utcnow() - timedelta(days=cls.LOCKING_DAYS)

        locked_movies = (
            cls.query.filter(
                cls.lock_status != True,
                cls.image_cover != "default.jpg",
                cls.release_date < locking_threshold
            ).update(dict(lock_status=True), synchronize_session="fetch")
        )
        db.session.commit()

        unlocked_movies = cls.query.filter(cls.lock_status == False).count()

        return locked_movies, unlocked_movies

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

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
        is_feeling = self.user.add_feeling

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        del media_dict["feeling"]
        del media_dict["score"]

        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name
        media_dict["all_status"] = Status.by(self.GROUP)
        media_dict["labels"] = [label.name for label in self.media.labels]
        media_dict["rating"] = {
            "type": "feeling" if is_feeling else "score",
            "value": self.feeling if is_feeling else self.score
        }

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

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        old_time = current_user.time_spent_movies
        current_user.time_spent_movies = old_time + ((new_value - old_value) * self.media.duration)

    @classmethod
    def total_user_time_def(cls):
        return func.sum(Movies.duration * cls.total)

    @classmethod
    def additional_search_joins(cls) -> List[Tuple[Type[MoviesActors], bool]]:
        return [(MoviesActors, MoviesActors.media_id == Movies.id),]

    @classmethod
    def additional_search_filters(cls, search: str) -> List[ColumnElement]:
        return [Movies.name.ilike(f"%{search}%"), Movies.original_name.ilike(f"%{search}%"),
                Movies.director_name.ilike(f"%{search}%"), MoviesActors.name.ilike(f"%{search}%")]


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

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict
