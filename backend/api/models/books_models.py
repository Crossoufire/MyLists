from __future__ import annotations
import datetime
from enum import Enum
from typing import List, Dict, Tuple
from flask import abort, current_app
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.routes.handlers import current_user
from backend.api.models.user_models import UserLastUpdate, Notifications
from backend.api.models.utils_models import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.utils.functions import change_air_format
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes


class Books(MediaMixin, db.Model):
    """ Books SQL model """

    GROUP = MediaType.BOOKS
    TYPE = ModelTypes.MEDIA

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    release_date = db.Column(db.String(30), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    language = db.Column(db.String(20), nullable=False)
    publishers = db.Column(db.String(50))
    synopsis = db.Column(db.Text)
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship("BooksGenre")
    authors = db.relationship("BooksAuthors")
    list_info = db.relationship("BooksList", back_populates="media", lazy="dynamic")

    def to_dict(self) -> Dict:
        """ Serialization of the books class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "formatted_date": change_air_format(self.release_date, books=True),
            "authors": [author.name for author in self.authors],
            "genres": self.genres_list,
        })

        return media_dict

    def add_media_to_user(self, new_status: Status, user_id: int) -> int:
        """ Add a new book to the user and return the <new_read> value """

        new_read = self.pages if new_status == Status.COMPLETED else 0

        # noinspection PyArgumentList
        user_list = BooksList(
            user_id=user_id,
            media_id=self.id,
            actual_page=new_read,
            status=new_status,
            total=new_read
        )
        db.session.add(user_list)

        return new_read

    @classmethod
    def get_information(cls, job: str, info: str) -> List[Dict]:
        """ Get all the authors' related books """

        if job == "creator":
            query = (cls.query.join(BooksAuthors, BooksAuthors.media_id == cls.id)
                     .filter(BooksAuthors.name == info).all())
        else:
            return abort(400)

        media_in_user_list = (
            db.session.query(BooksList)
            .filter(BooksList.user_id == current_user.id, BooksList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all books that are not present in a User list from the database and the disk """

        try:
            # Books remover
            books_to_delete = (cls.query.outerjoin(BooksList, BooksList.media_id == cls.id)
                               .filter(BooksList.media_id.is_(None)).all())
            count_ = 0
            for book in books_to_delete:
                BooksAuthors.query.filter_by(media_id=book.id).delete()
                BooksGenre.query.filter_by(media_id=book.id).delete()
                UserLastUpdate.query.filter_by(media_type=MediaType.BOOKS, media_id=book.id).delete()
                Notifications.query.filter_by(media_type="bookslist", media_id=book.id).delete()
                BooksLabels.query.filter_by(media_id=book.id).delete()
                Books.query.filter_by(id=book.id).delete()

                count_ += 1
                current_app.logger.info(f"Removed book with ID: [{book.id}]")

            current_app.logger.info(f"Total books removed: {count_}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing books and related records: {str(e)}")

    @staticmethod
    def form_only() -> List[str]:
        """ Return the allowed fields for the edit book form """
        return ["name", "release_date", "pages", "language", "publishers", "synopsis"]


class BooksList(MediaListMixin, db.Model):
    """ Books list SQL model """

    TYPE = ModelTypes.LIST
    GROUP = MediaType.BOOKS
    TIME_PER_PAGE = 1.7
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.READING

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    actual_page = db.Column(db.Integer)
    total = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="list_info", lazy=False)

    class Status(ExtendedEnum):
        """ New status class for easiness """
        READING = "Reading"
        COMPLETED = "Completed"
        ON_HOLD = "On Hold"
        DROPPED = "Dropped"
        PLAN_TO_READ = "Plan to Read"

    def to_dict(self) -> Dict:
        is_feeling = self.user.add_feeling

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        del media_dict["feeling"]
        del media_dict["score"]

        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name
        media_dict["total_pages"] = self.media.pages
        media_dict["all_status"] = self.Status.to_list()
        media_dict["rating"] = {
            "type": "feeling" if is_feeling else "score",
            "value": self.feeling if is_feeling else self.score
        }

        return media_dict

    def update_total_watched(self, new_rewatch: int) -> int:
        """ Update total read and return the new total """

        self.rewatched = new_rewatch

        # Computed new total
        new_total = self.media.pages + (new_rewatch * self.media.pages)
        self.total = new_total

        return new_total

    def update_status(self, new_status: Enum) -> int:
        """ Change the book status for the current user and return the new total """

        #  Set new status and actual page
        self.status = new_status
        new_total = self.total
        if new_status == Status.COMPLETED:
            self.actual_page = self.media.pages
            self.total = self.media.pages
            new_total = self.media.pages
            self.completion_date = datetime.datetime.today()
        elif new_status == Status.PLAN_TO_READ:
            self.actual_page = 0
            self.total = 0
            new_total = 0

        #  Reset rewatched
        self.rewatched = 0

        return new_total

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        """ Update the new time spent reading for the user """

        old_time = current_user.time_spent_books
        current_user.time_spent_books = old_time + ((new_value - old_value) * self.TIME_PER_PAGE)

    @classmethod
    def get_available_sorting(cls, is_feeling: bool) -> Dict:
        """ Return the available sorting for books """

        sorting_dict = {
            "Title A-Z": Books.name.asc(),
            "Title Z-A": Books.name.desc(),
            "Published date +": Books.release_date.desc(),
            "Published date -": Books.release_date.asc(),
            "Comments": cls.comment.desc(),
            "Rating +": cls.feeling.desc() if is_feeling else cls.score.desc(),
            "Rating -": cls.feeling.asc() if is_feeling else cls.score.asc(),
            "Re-read": cls.rewatched.desc(),
        }

        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.TIME_PER_PAGE * cls.total)

    @classmethod
    def additional_search_joins(cls) -> List[Tuple]:
        return [(BooksAuthors, BooksAuthors.media_id == Books.id)]

    @classmethod
    def additional_search_filters(cls, search: str) -> List[ColumnElement]:
        return [Books.name.ilike(f"%{search}%"), BooksAuthors.name.ilike(f"%{search}%")]


class BooksGenre(db.Model):
    """ Books genres SQL model """

    TYPE = ModelTypes.GENRE
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    genre = db.Column(db.String(100), nullable=False)

    @classmethod
    def replace_genres(cls, genres: List[Dict], media_id: int):
        """ Replace the old genres by the new ones """

        # Remove actual genres
        cls.query.filter_by(media_id=media_id).delete()

        # Add new genres
        db.session.add_all([cls(media_id=media_id, genre=genre["value"]) for genre in genres])

        # Commit changes
        db.session.commit()

    @staticmethod
    def get_available_genres() -> List:
        """ Return the available genres for the books """
        return ["Action & Adventure", "Biography", "Chick lit", "Children", "Classic", "Crime", "Drama",
                "Dystopian", "Essay", "Fantastic", "Fantasy", "History", "Humor", "Horror", "Literary Novel",
                "Memoirs", "Mystery", "Paranormal", "Philosophy", "Poetry", "Romance", "Science", "Science-Fiction",
                "Short story", "Suspense", "Testimony", "Thriller", "Western", "Young adult"]


class BooksAuthors(db.Model):
    """ Books authors SQL model """

    TYPE = ModelTypes.AUTHORS
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    name = db.Column(db.String(150))


class BooksLabels(MediaLabelMixin, db.Model):
    """ Personal BooksList SQL model """

    TYPE = ModelTypes.LABELS
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    label = db.Column(db.String(64), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", lazy=False)

    def to_dict(self) -> Dict:
        """ Serialization of the BooksLabels class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict
