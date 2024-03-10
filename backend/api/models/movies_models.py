from __future__ import annotations

import json
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Tuple

from flask import current_app, abort
from sqlalchemy import func, text, and_

from backend.api import db
from backend.api.models.user_models import User, UserLastUpdate, Notifications
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

    def to_dict(self, coming_next: bool = False) -> Dict:
        """ Serialization of the movies class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        if coming_next:
            media_dict["media_cover"] = self.media_cover
            media_dict["date"] = change_air_format(self.release_date)
            return media_dict

        media_dict["media_cover"] = self.media_cover
        media_dict["formated_date"] = change_air_format(self.release_date)
        media_dict["actors"] = self.actors_list
        media_dict["genres"] = self.genres_list
        media_dict["similar_media"] = self.get_similar_genres()

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

        return [q.to_dict(coming_next=True) for q in query]

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all movies that are not present in a User list from the database and the disk """

        try:
            # Movies remover
            movies_to_delete = (cls.query.outerjoin(MoviesList, MoviesList.media_id == cls.id)
                                .filter(MoviesList.media_id.is_(None)).all())
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
            query = (db.session.query(cls.id, MoviesList.user_id, cls.release_date, cls.name)
            .join(MoviesList, cls.id == MoviesList.media_id)
            .filter(and_(
                cls.release_date != None,
                cls.release_date > datetime.utcnow(),
                cls.release_date <= datetime.utcnow() + timedelta(days=7),
                MoviesList.status != Status.PLAN_TO_WATCH,
                ))).all()

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

        query = (cls.query.filter(and_(cls.lock_status != True, cls.image_cover != "default.jpg",
                                       cls.release_date < locking_threshold))
                 .update({"lock_status": True}, synchronize_session="fetch"))

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
        """ Special status class for the movies """

        COMPLETED = "Completed"
        PLAN_TO_WATCH = "Plan to Watch"

    def to_dict(self) -> Dict:
        """ Serialization of the movieslist class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
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
    def get_media_stats(cls, user: User) -> List[Dict]:
        """ Get the movies stats for a user and return a list of dict """

        subquery = MoviesList.query.filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_WATCH).subquery()
        rating = subquery.c.feeling if user.add_feeling else subquery.c.score

        runtimes = (db.session.query(((Movies.duration // 30) * 30).label("bin"), func.count(Movies.id).label("count"))
                    .join(subquery, (Movies.id == subquery.c.media_id) & (Movies.duration != "Unknown"))
                    .group_by("bin").order_by("bin").all())

        release_dates = (db.session.query((((func.extract("year", Movies.release_date)) // 10) * 10).label("decade"),
                                          func.count(Movies.release_date))
                         .join(subquery, (Movies.id == subquery.c.media_id) & (Movies.release_date != "Unknown"))
                         .group_by("decade").order_by(Movies.release_date.asc()).all())

        top_directors = (db.session.query(Movies.director_name, func.count(Movies.director_name).label("count"))
                         .join(subquery, (Movies.id == subquery.c.media_id) & (Movies.director_name != "Unknown"))
                         .group_by(Movies.director_name).order_by(text("count desc")).limit(10).all())

        # top_rated_directors = (db.session.query(Movies.director_name, func.count(Movies.director_name),
        #                                         func.round(func.avg(rating), 2), func.group_concat(Movies.name),
        #                                         func.ifnull(func.sum(subquery.c.favorite), 0))
        #                        .join(subquery, (Movies.id == subquery.c.media_id) & (rating.isnot(None)))
        #                        .group_by(Movies.director_name).having(func.count(Movies.director_name) >= 5)
        #                        .order_by(func.avg(rating).desc(), func.sum(subquery.c.favorite).desc())
        #                        .limit(10).all())

        top_actors = (db.session.query(MoviesActors.name, func.count(MoviesActors.name).label("count"))
                      .join(subquery, (MoviesActors.media_id == subquery.c.media_id) & (MoviesActors.name != "Unknown"))
                      .group_by(MoviesActors.name).order_by(text("count desc")).limit(10).all())

        # top_rated_actors = (db.session.query(MoviesActors.name, func.count(MoviesActors.name),
        #                                      func.round(func.avg(rating), 2),
        #                                      func.ifnull(func.sum(subquery.c.favorite), 0))
        #                     .join(subquery, (MoviesActors.media_id == subquery.c.media_id) &
        #                           (rating.isnot(None)) & (MoviesActors.name != "Unknown"))
        #                     .group_by(MoviesActors.name).having(func.count(MoviesActors.name) >= 8)
        #                     .order_by(func.avg(rating).desc(), func.sum(subquery.c.favorite).desc())
        #                     .limit(10).all())

        top_genres = (db.session.query(MoviesGenre.genre, func.count(MoviesGenre.genre).label("count"))
                      .join(subquery, (MoviesGenre.media_id == subquery.c.media_id) & (MoviesGenre.genre != "Unknown"))
                      .group_by(MoviesGenre.genre).order_by(text("count desc")).limit(10).all())

        # top_rated_genres = (db.session.query(MoviesGenre.genre, func.count(MoviesGenre.genre),
        #                                      func.round(func.avg(rating), 2),
        #                                      func.ifnull(func.sum(subquery.c.favorite), 0))
        #                     .join(subquery, (MoviesGenre.media_id == subquery.c.media_id) &
        #                           (rating.isnot(None)) & (MoviesGenre.genre != "Unknown"))
        #                     .group_by(MoviesGenre.genre).having(func.count(MoviesGenre.genre) >= 15)
        #                     .order_by(func.avg(rating).desc(), func.sum(subquery.c.favorite).desc())
        #                     .limit(10).all())

        top_languages = (db.session.query(Movies.original_language, func.count(Movies.original_language).label("nb"))
                         .join(subquery, (Movies.id == subquery.c.media_id) & (Movies.original_language != "Unknown"))
                         .group_by(Movies.original_language).order_by(text("nb desc")).limit(10).all())

        stats = [
            {"name": "Runtimes", "values": [(run, count_) for run, count_ in runtimes]},
            {"name": "Releases date", "values": [(rel, count_) for rel, count_ in release_dates]},
            {"name": "Directors", "values": [(director, count_) for director, count_ in top_directors]},
            {"name": "Actors", "values": [(actor, count_) for actor, count_ in top_actors]},
            {"name": "Genres", "values": [(genre,count_) for genre, count_ in top_genres]},
            {"name": "Languages", "values": [(lang, count_) for lang, count_ in top_languages]},
        ]

        return stats

    @classmethod
    def total_user_time_def(cls):
        return func.sum(Movies.duration * cls.total)


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
