from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from flask import current_app, abort
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.models.abstracts import MediaList, Genre, Actors, Labels, Media
from backend.api.models.users import Notifications, User, UserMediaUpdate
from backend.api.core.handlers import current_user
from backend.api.utils.enums import MediaType, Status, NotificationType, JobType


class Movies(Media):
    GROUP: MediaType = MediaType.MOVIES

    original_name = db.Column(db.String, nullable=False)
    director = db.Column(db.String)
    homepage = db.Column(db.String)
    duration = db.Column(db.Integer)
    language = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)
    budget = db.Column(db.Float)
    revenue = db.Column(db.Float)
    tagline = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("MoviesGenre", back_populates="media", lazy="joined")
    actors = db.relationship("MoviesActors", back_populates="media", lazy="joined")
    labels = db.relationship("MoviesLabels", back_populates="media", lazy="dynamic")
    media_list = db.relationship("MoviesList", back_populates="media", lazy="dynamic")

    def add_to_user(self, user_id: int, status: Status) -> Tuple[int, MoviesList]:
        total_watched = 1 if status != Status.PLAN_TO_WATCH else 0

        # noinspection PyArgumentList
        media_assoc = MoviesList(
            user_id=user_id,
            media_id=self.id,
            status=status,
            total=total_watched,
        )
        db.session.add(media_assoc)
        db.session.flush()

        return total_watched, media_assoc

    @classmethod
    def get_information(cls, job: JobType, name: str) -> List[Dict]:
        if job != JobType.CREATOR and job != JobType.ACTOR:
            return abort(400)

        if job == JobType.CREATOR:
            all_media = cls.query.filter(cls.director == name).all()
        elif job == JobType.ACTOR:
            all_media = (
                cls.query.join(MoviesActors, MoviesActors.media_id == cls.id)
                .filter(MoviesActors.name == name).all()
            )

        # noinspection PyUnboundLocalVariable
        media_assoc_with_user = (
            db.session.query(MoviesList)
            .filter(MoviesList.user_id == current_user.id, MoviesList.media_id.in_([media.id for media in all_media]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_assoc_with_user]

        for media in all_media:
            if media.id in user_media_ids:
                media.in_list = True

        return all_media

    @classmethod
    def remove_non_list_media(cls):
        movies_to_delete = (
            cls.query.outerjoin(MoviesList, MoviesList.media_id == cls.id)
            .filter(MoviesList.media_id.is_(None)).all()
        )

        current_app.logger.info(f"Movies to delete: {len(movies_to_delete)}")
        movie_ids = [movie.id for movie in movies_to_delete]

        MoviesActors.query.filter(MoviesActors.media_id.in_(movie_ids)).delete()
        MoviesGenre.query.filter(MoviesGenre.media_id.in_(movie_ids)).delete()
        UserMediaUpdate.query.filter(UserMediaUpdate.media_type == MediaType.MOVIES,
                                     UserMediaUpdate.media_id.in_(movie_ids)).delete()
        Notifications.query.filter(Notifications.media_type == cls.GROUP,
                                   Notifications.media_id.in_(movie_ids)).delete()
        MoviesLabels.query.filter(MoviesLabels.media_id.in_(movie_ids)).delete()
        cls.query.filter(cls.id.in_(movie_ids)).delete()

        db.session.commit()
        current_app.logger.info(f"Movies successfully deleted")

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

        unlocked_movies = db.session.query(func.count(cls.id)).filter(cls.lock_status.is_(False)).scalar()

        return locked_movies, unlocked_movies

    @classmethod
    def create_new_release_notification(cls):
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
            notification = (
                Notifications.query
                .filter_by(user_id=user_id, media_id=media_id, media_type=cls.GROUP).first()
            )

            if not notification:
                release_date = datetime.strptime(release_date, "%Y-%m-%d").strftime("%b %d %Y")
                new_notification = Notifications(
                    user_id=user_id,
                    media_id=media_id,
                    media_type=cls.GROUP,
                    notif_type=NotificationType.MEDIA,
                    payload_json=json.dumps({"name": name, "release_date": release_date})
                )
                db.session.add(new_notification)
        db.session.commit()

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

    @staticmethod
    def editable_columns() -> List[str]:
        return ["name", "original_name", "director", "release_date", "homepage", "language", "duration", "synopsis",
                "budget", "revenue", "tagline"]


class MoviesList(MediaList):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer, nullable=False, default=0)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="movies_list", lazy="select")
    media = db.relationship("Movies", back_populates="media_list", lazy="joined")

    def update_time_spent(self, user: User, old_value: int = 0, new_value: int = 0):
        setting = user.get_media_setting(self.GROUP)
        setting.time_spent += (new_value - old_value) * self.media.duration

    def update_total(self, redo: int) -> int:
        self.redo = redo
        new_total = 1 + redo
        self.total = new_total
        return new_total

    def update_status(self, status: Status) -> int:
        """ Change the movie status for the current user and return the new total watched """

        self.status = status
        self.redo = 0
        if status == Status.COMPLETED:
            self.total = 1
            new_total = 1
        else:
            self.total = 0
            new_total = 0

        return new_total

    @classmethod
    def available_sorting(cls) -> Dict[str, ColumnElement]:
        sorting_dict = {
            "Title A-Z": Movies.name.asc(),
            "Title Z-A": Movies.name.desc(),
            "Duration +": Movies.duration.desc(),
            "Duration -": Movies.duration.asc(),
            "Release date +": Movies.release_date.desc(),
            "Release date -": Movies.release_date.asc(),
            "TMDB Rating +": Movies.vote_average.desc(),
            "TMDB Rating -": Movies.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
        }
        return sorting_dict

    @classmethod
    def time_spent_calculation(cls) -> ColumnElement:
        return func.sum(Movies.duration * cls.total)


class MoviesGenre(Genre):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="genres", lazy="select")

    @staticmethod
    def available_genres() -> List[str]:
        return ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family",
                "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie",
                "Thriller", "War", "Western"]


class MoviesActors(Actors):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="actors", lazy="select")


class MoviesLabels(Labels):
    GROUP = MediaType.MOVIES

    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="labels", lazy="select")
