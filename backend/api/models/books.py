from __future__ import annotations

from typing import List, Dict

from flask import abort
from sqlalchemy import func

from backend.api import db
from backend.api.core import current_user
from backend.api.models.abstracts import Media, MediaList, Genres, Labels
from backend.api.utils.enums import MediaType, Status, ModelTypes, JobType


class Books(Media):
    GROUP = MediaType.BOOKS

    pages = db.Column(db.Integer)
    language = db.Column(db.String)
    publishers = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("BooksGenre", back_populates="media", lazy="select")
    labels = db.relationship("BooksLabels", back_populates="media", lazy="select")
    authors = db.relationship("BooksAuthors", back_populates="media", lazy="select")
    list_info = db.relationship("BooksList", back_populates="media", lazy="dynamic")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "authors": [author.name for author in self.authors],
            "genres": self.genres_list,
        })

        return media_dict

    def add_to_user(self, new_status: Status, user_id: int) -> int:
        total_read = self.pages if new_status == Status.COMPLETED else 0

        # noinspection PyArgumentList
        user_list = BooksList(
            user_id=user_id,
            media_id=self.id,
            actual_page=total_read,
            status=new_status,
            total=total_read,
        )
        db.session.add(user_list)

        return total_read

    @classmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Dict]:
        if job == JobType.CREATOR:
            query = (
                cls.query.join(BooksAuthors, BooksAuthors.media_id == cls.id)
                .filter(BooksAuthors.name == name).all()
            )
        else:
            return abort(404, description="JobType not found")

        media_in_user_list = (
            db.session.query(BooksList)
            .filter(BooksList.user_id == current_user.id, BooksList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "release_date", "pages", "language", "publishers", "synopsis"]


class BooksList(MediaList):
    GROUP = MediaType.BOOKS
    TIME_PER_PAGE = 1.7
    DEFAULT_STATUS = Status.READING

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    actual_page = db.Column(db.Integer)
    total = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="books_list", lazy="select")
    media = db.relationship("Books", back_populates="list_info", lazy="joined")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media.media_cover,
            "media_name": self.media.name,
            "total_pages": self.media.pages,
            "all_status": Status.by(self.GROUP),
            "rating": {
                "type": self.user.rating_system,
                "value": self.rating,
            }
        })

        return media_dict

    def update_total(self, new_redo: int) -> int:
        self.redo = new_redo
        new_total = self.media.pages + (new_redo * self.media.pages)
        self.total = new_total

        return new_total

    def update_status(self, new_status: Status) -> int:
        new_total = self.total

        self.status = new_status
        self.redo = 0
        if new_status == Status.COMPLETED:
            self.actual_page = self.media.pages
            self.total = self.media.pages
            new_total = self.media.pages
        elif new_status == Status.PLAN_TO_READ:
            self.actual_page = 0
            self.total = 0
            new_total = 0

        return new_total

    def update_time_spent(self, old_value: int = 0, new_value: int = 0):
        setting = current_user.get_media_setting(self.GROUP)
        setting.time_spent += (new_value - old_value) * self.TIME_PER_PAGE

    @classmethod
    def get_available_sorting(cls) -> Dict:
        sorting_dict = {
            "Title A-Z": Books.name.asc(),
            "Title Z-A": Books.name.desc(),
            "Published date +": Books.release_date.desc(),
            "Published date -": Books.release_date.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Re-read": cls.redo.desc(),
        }
        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.TIME_PER_PAGE * cls.total)


class BooksGenre(Genres):
    GROUP = MediaType.BOOKS

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="genres", lazy="select")

    @classmethod
    def replace_genres(cls, genres: List[Dict], media_id: int):
        cls.query.filter_by(media_id=media_id).delete()
        db.session.add_all([cls(media_id=media_id, name=genre["value"]) for genre in genres])
        db.session.commit()

    @staticmethod
    def get_available_genres() -> List[str]:
        return ["Action & Adventure", "Biography", "Chick lit", "Children", "Classic", "Crime", "Drama",
                "Dystopian", "Essay", "Fantastic", "Fantasy", "History", "Humor", "Horror", "Literary Novel",
                "Memoirs", "Mystery", "Paranormal", "Philosophy", "Poetry", "Romance", "Science", "Science-Fiction",
                "Short story", "Suspense", "Testimony", "Thriller", "Western", "Young adult"]


class BooksAuthors(db.Model):
    TYPE = ModelTypes.AUTHORS
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    name = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="authors", lazy="select")

    @classmethod
    def replace_authors(cls, authors: str, media_id: int):
        try:
            authors = authors.split(", ")
        except:
            return

        cls.query.filter_by(media_id=media_id).delete()
        db.session.add_all([cls(media_id=media_id, name=author) for author in authors])
        db.session.commit()


class BooksLabels(Labels):
    GROUP = MediaType.BOOKS

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="labels", lazy="select")
