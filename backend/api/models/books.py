from __future__ import annotations
from typing import List, Dict
from flask import abort, current_app
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.core.handlers import current_user
from backend.api.models.abstracts import Media, MediaList, Genre, Labels
from backend.api.models.users import Notifications, User, UserMediaUpdate
from backend.api.utils.enums import MediaType, Status, ModelTypes, JobType


class Books(Media):
    GROUP = MediaType.BOOKS

    pages = db.Column(db.Integer, nullable=False)
    language = db.Column(db.String)
    publishers = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("BooksGenre", back_populates="media", lazy="select")
    labels = db.relationship("BooksLabels", back_populates="media", lazy="dynamic")
    authors = db.relationship("BooksAuthors", back_populates="media", lazy="select")
    media_list = db.relationship("BooksList", back_populates="media", lazy="dynamic")

    def add_to_user(self, user_id: int, status: Status) -> int:
        total_read = self.pages if status == Status.COMPLETED else 0

        # noinspection PyArgumentList
        user_list = BooksList(
            user_id=user_id,
            media_id=self.id,
            current_page=total_read,
            status=status,
            total=total_read,
        )
        db.session.add(user_list)
        db.session.flush()

        return total_read

    @classmethod
    def get_information(cls, job: JobType, name: str) -> List[Media]:
        if job != JobType.CREATOR:
            return abort(400)

        all_media = (
            cls.query.join(BooksAuthors, BooksAuthors.media_id == cls.id)
            .filter(BooksAuthors.name == name).all()
        )

        media_assoc_with_user = (
            db.session.query(BooksList)
            .filter(BooksList.user_id == current_user.id, BooksList.media_id.in_([media.id for media in all_media]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_assoc_with_user]

        for media in all_media:
            if media.id in user_media_ids:
                media.in_list = True

        return all_media

    @classmethod
    def remove_non_list_media(cls):
        books_to_delete = (
            cls.query.outerjoin(BooksList, BooksList.media_id == cls.id)
            .filter(BooksList.media_id.is_(None)).all()
        )

        current_app.logger.info(f"Books to delete: {len(books_to_delete)}")
        books_ids = [book.id for book in books_to_delete]

        BooksAuthors.query.filter(BooksAuthors.media_id.in_(books_ids)).delete()
        BooksGenre.query.filter(BooksGenre.media_id.in_(books_ids)).delete()
        UserMediaUpdate.query.filter(UserMediaUpdate.media_type == MediaType.BOOKS,
                                     UserMediaUpdate.media_id.in_(books_ids)).delete()
        Notifications.query.filter(Notifications.media_type == cls.GROUP,
                                   Notifications.media_id.in_(books_ids)).delete()
        BooksLabels.query.filter(BooksLabels.media_id.in_(books_ids)).delete()
        cls.query.filter(cls.id.in_(books_ids)).delete()

        db.session.commit()
        current_app.logger.info(f"Books successfully deleted")

    @staticmethod
    def editable_columns() -> List[str]:
        return ["name", "release_date", "pages", "language", "publishers", "synopsis"]


class BooksList(MediaList):
    TIME_PER_PAGE = 1.7
    GROUP = MediaType.BOOKS
    DEFAULT_STATUS = Status.READING

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    redo = db.Column(db.Integer, nullable=False, default=0)
    current_page = db.Column(db.Integer)
    total = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="books_list", lazy="select")
    media = db.relationship("Books", back_populates="media_list", lazy="joined")

    def update_total(self, redo: int) -> int:
        self.redo = redo
        new_total = self.media.pages + (redo * self.media.pages)
        self.total = new_total
        return new_total

    def update_status(self, status: Status) -> int:
        new_total = self.total
        self.status = status
        self.redo = 0
        if status == Status.COMPLETED:
            self.current_page = self.media.pages
            self.total = self.media.pages
            new_total = self.media.pages
        elif status == Status.PLAN_TO_READ:
            self.current_page = 0
            self.total = 0
            new_total = 0

        return new_total

    def update_time_spent(self, user: User, old_value: int = 0, new_value: int = 0):
        setting = user.get_media_setting(self.GROUP)
        setting.time_spent += (new_value - old_value) * self.TIME_PER_PAGE

    @classmethod
    def available_sorting(cls) -> Dict:
        sorting_dict = {
            "Title A-Z": Books.name.asc(),
            "Title Z-A": Books.name.desc(),
            "Published date +": Books.release_date.desc(),
            "Published date -": Books.release_date.asc(),
            "Total Pages +": Books.pages.desc(),
            "Total Pages -": Books.pages.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
        }
        return sorting_dict

    @classmethod
    def time_spent_calculation(cls) -> ColumnElement:
        return func.sum(cls.TIME_PER_PAGE * cls.total)


class BooksGenre(Genre):
    GROUP = MediaType.BOOKS

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="genres", lazy="select")

    @classmethod
    def replace_genres(cls, genres: List[Dict], media_id: int):
        cls.query.filter_by(media_id=media_id).delete()
        db.session.add_all([cls(media_id=media_id, genre=genre["value"]) for genre in genres])
        db.session.commit()

    @staticmethod
    def available_genres() -> List[str]:
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


class BooksLabels(Labels):
    GROUP = MediaType.BOOKS

    media_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Books", back_populates="labels", lazy="select")
