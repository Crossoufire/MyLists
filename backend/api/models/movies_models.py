from __future__ import annotations
import json
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Tuple, Type
from flask import current_app, abort
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.models.user_models import UserLastUpdate, Notifications
from backend.api.models.utils_models import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes
from backend.api.utils.functions import change_air_format


class Movies(MediaMixin, db.Model):
    """ Movies SQLAlchemy model """

    TYPE = ModelTypes.MEDIA
    GROUP = MediaType.MOVIES
    LOCKING_DAYS = 180

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    original_name = db.Column(db.String(50), nullable=False)
    director_name = db.Column(db.String(100))
    release_date = db.Column(db.String(30))
    homepage = db.Column(db.String(200))
    released = db.Column(db.String(30))
    duration = db.Column(db.Integer)
    original_language = db.Column(db.String(20))
    synopsis = db.Column(db.Text)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)
    budget = db.Column(db.Float)
    revenue = db.Column(db.Float)
    tagline = db.Column(db.String(30))
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)
    last_api_update = db.Column(db.DateTime)

    genres = db.relationship("MoviesGenre", backref="movies", lazy=True)
    actors = db.relationship("MoviesActors", backref="movies", lazy=True)
    list_info = db.relationship("MoviesList", back_populates="media", lazy="dynamic")
    labels = db.relationship("MoviesLabels", back_populates="media", lazy="dynamic")

    def to_dict(self) -> Dict:
        """ Serialization of the movies class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "formatted_date": change_air_format(self.release_date),
            "actors": self.actors_list,
            "genres": self.genres_list,
        })

        return media_dict

    def add_media_to_user(self, new_status: Enum, user_id: int) -> int:
        """ Add a new movie to the user and return the <new_watched> value """

        new_watched = 1 if new_status != Status.PLAN_TO_WATCH else 0

        # noinspection PyArgumentList
        add_movie = MoviesList(
            user_id=user_id,
            media_id=self.id,
            status=new_status,
            total=new_watched
        )
        db.session.add(add_movie)

        return new_watched

    @classmethod
    def get_information(cls, job: str, info: str) -> List[Dict]:
        """ Get the movies from a specific creator or actor """

        if job == "creator":
            query = cls.query.filter(cls.director_name.ilike(f"%{info}%")).all()
        elif job == "actor":
            query = (cls.query.join(MoviesActors, MoviesActors.media_id == cls.id)
                     .filter(MoviesActors.name == info).all())
        else:
            return abort(400)

        media_in_user_list = (
            db.session.query(MoviesList)
            .filter(MoviesList.user_id == current_user.id, MoviesList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all movies that are not present in a User list from the database and the disk """

        try:
            movies_to_delete = (
                cls.query.outerjoin(MoviesList, MoviesList.media_id == cls.id)
                .filter(MoviesList.media_id.is_(None))
                .all()
            )

            count = 0
            for movie in movies_to_delete:
                MoviesActors.query.filter_by(media_id=movie.id).delete()
                MoviesGenre.query.filter_by(media_id=movie.id).delete()
                UserLastUpdate.query.filter_by(media_type=MediaType.MOVIES, media_id=movie.id).delete()
                Notifications.query.filter_by(media_type="movieslist", media_id=movie.id).delete()
                MoviesLabels.query.filter_by(media_id=movie.id).delete()
                Movies.query.filter_by(id=movie.id).delete()

                count += 1
                current_app.logger.info(f"Removed movie with ID: [{movie.id}]")

            current_app.logger.info(f"Total movies removed: {count}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing movies and related records: {str(e)}")

    @classmethod
    def get_new_releasing_media(cls):
        """ Check for the new releasing movies in a week or less from the TMDB API """

        try:
            # noinspection PyComparisonWithNone
            query = (
                db.session.query(cls.id, MoviesList.user_id, cls.release_date, cls.name)
                .join(MoviesList, cls.id == MoviesList.media_id)
                .filter(
                    cls.release_date.is_not(None),
                    cls.release_date > datetime.utcnow(),
                    cls.release_date <= datetime.utcnow() + timedelta(days=7),
                    MoviesList.status != Status.PLAN_TO_WATCH
                ).all()
            )

            for info in query:
                notif = Notifications.search(info[1], "movieslist", info[0])

                if notif is None:
                    release_date = datetime.strptime(info[2], "%Y-%m-%d").strftime("%b %d %Y")
                    payload = {"name": info[3].name,
                               "release_date": release_date}

                    # noinspection PyArgumentList
                    new_notification = Notifications(
                        user_id=info[1],
                        media_type="movieslist",
                        media_id=info[0],
                        payload_json=json.dumps(payload)
                    )
                    db.session.add(new_notification)

            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Error occurred while checking for new releasing anime: {e}")
            db.session.rollback()

    @classmethod
    def automatic_locking(cls) -> Tuple[int, int]:
        """ Automatically lock the movies that are more than about 6 months old """

        locking_threshold = datetime.utcnow() - timedelta(days=cls.LOCKING_DAYS)

        query = (
            cls.query.filter(cls.lock_status != True, cls.image_cover != "default.jpg",
                             cls.release_date < locking_threshold)
            .update({"lock_status": True}, synchronize_session="fetch")
        )
        db.session.commit()

        locked_movies = query
        unlocked_movies = cls.query.filter(cls.lock_status == False).count()

        return locked_movies, unlocked_movies

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        """ Refresh a media using the new_data from ApiData """

        # Update main details and commit changes
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

    @staticmethod
    def form_only() -> List[str]:
        """ Return the allowed fields for a form """
        return ["name", "original_name", "director_name", "release_date", "homepage", "original_language",
                "duration", "synopsis", "budget", "revenue", "tagline"]


class MoviesList(MediaListMixin, db.Model):
    """ Movieslist SQL model """

    TYPE = ModelTypes.LIST
    GROUP = MediaType.MOVIES
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.COMPLETED

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(50))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", back_populates="list_info", lazy=False)

    class Status(ExtendedEnum):
        COMPLETED = "Completed"
        PLAN_TO_WATCH = "Plan to Watch"

    def to_dict(self) -> Dict:
        """ Serialization of the MoviesList SQL model """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name
        media_dict["all_status"] = self.Status.to_list()

        return media_dict

    def update_total_watched(self, new_rewatch: int) -> int:
        """ Update the new total watched movies and total and return new total """

        self.rewatched = new_rewatch

        # Calculate new total
        new_total = 1 + new_rewatch
        self.total = new_total

        return new_total

    def update_status(self, new_status: Enum) -> int:
        """ Change the movie status for the current user and return the new total watched """

        # Set new status
        self.status = new_status

        if new_status == Status.COMPLETED:
            self.completion_date = datetime.today()
            self.total = 1
            new_total = 1
        else:
            self.total = 0
            new_total = 0

        # Reset rewatched value
        self.rewatched = 0

        return new_total

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        """ Compute the new computed time for the movies """

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


class MoviesGenre(db.Model):
    """ Movies genres SQL model """

    TYPE = ModelTypes.GENRE
    GROUP = MediaType.MOVIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)

    @staticmethod
    def get_available_genres() -> List:
        """ Return the available genres for the movies """
        return ["All", "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family",
                "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie",
                "Thriller", "War", "Western"]


class MoviesActors(db.Model):
    """ Movies actors SQL model """

    TYPE = ModelTypes.ACTORS
    GROUP = MediaType.MOVIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    name = db.Column(db.String(150))


class MoviesLabels(MediaLabelMixin, db.Model):
    """ MoviesLabels SQL model """

    TYPE = ModelTypes.LABELS
    GROUP = MediaType.MOVIES

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    label = db.Column(db.String(64), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Movies", lazy=False)

    def to_dict(self) -> Dict:
        """ Serialization of the MoviesLabels class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict
