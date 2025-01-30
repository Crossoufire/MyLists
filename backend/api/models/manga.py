from __future__ import annotations

from typing import Dict, List

from flask import abort
from sqlalchemy import func, ColumnElement

from backend.api import db
from backend.api.core import current_user
from backend.api.utils.enums import MediaType, Status, JobType, ModelTypes
from backend.api.models.abstracts import Media, MediaList, Genres, Labels


class Manga(Media):
    GROUP: MediaType = MediaType.MANGA

    original_name = db.Column(db.String)
    chapters = db.Column(db.Integer)
    prod_status = db.Column(db.String)
    site_url = db.Column(db.String)
    end_date = db.Column(db.String)
    volumes = db.Column(db.Integer)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)
    publishers = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("MangaGenre", back_populates="media", lazy="select")
    labels = db.relationship("MangaLabels", back_populates="media", lazy="select")
    authors = db.relationship("MangaAuthors", back_populates="media", lazy="select")
    list_info = db.relationship("MangaList", back_populates="media", lazy="dynamic")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "genres": self.genres_list,
            "authors": [author.name for author in self.authors],
            "media_cover": self.media_cover,
        })

        return media_dict

    def add_to_user(self, new_status: Status, user_id: int) -> int:
        total_chapters = self.chapters if new_status == Status.COMPLETED else 0

        user_list = MangaList(
            user_id=user_id,
            media_id=self.id,
            current_chapter=total_chapters,
            status=new_status,
            total=total_chapters,
        )
        db.session.add(user_list)

        return total_chapters

    @classmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Dict]:
        if job == JobType.CREATOR:
            query = (
                cls.query.join(MangaAuthors, MangaAuthors.media_id == cls.id)
                .filter(MangaAuthors.name == name).all()
            )
        elif job == JobType.PUBLISHER:
            query = cls.query.filter(cls.publishers.ilike(f"%{name}%")).all()
        else:
            return abort(404, description="JobType not found")

        media_in_user_list = (
            db.session.query(MangaList)
            .filter(MangaList.user_id == current_user.id, MangaList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "synopsis"]


class MangaList(MediaList):
    GROUP = MediaType.MANGA
    TIME_PER_CHAPTER: int = 7
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.READING

    media_id = db.Column(db.Integer, db.ForeignKey("manga.id"), nullable=False)
    current_chapter = db.Column(db.Integer, nullable=False, default=0)
    redo = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="manga_list", lazy="select")
    media = db.relationship("Manga", back_populates="list_info", lazy="joined")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_name": self.media.name,
            "media_cover": self.media.media_cover,
            "all_status": Status.by(self.GROUP),
            "total_chapters": self.media.chapters,
            "rating": {
                "type": self.user.rating_system,
                "value": self.rating,
            }
        })

        return media_dict

    def update_status(self, new_status: Status) -> int:
        new_total = self.total

        self.status = new_status
        self.redo = 0
        if new_status == Status.COMPLETED:
            self.current_chapter = self.media.chapters
            self.total = self.media.chapters
            new_total = self.media.chapters
        elif new_status == Status.PLAN_TO_READ:
            self.current_chapter = 0
            self.total = 0
            new_total = 0

        return new_total

    def update_total(self, new_redo: int) -> int:
        self.redo = new_redo
        new_total = self.media.chapters + (new_redo * self.media.chapters)
        self.total = new_total

        return new_total

    @classmethod
    def get_available_sorting(cls) -> Dict[str, ColumnElement]:
        sorting_dict = {
            "Title A-Z": Manga.name.asc(),
            "Title Z-A": Manga.name.desc(),
            "Start date +": Manga.release_date.desc(),
            "Start date -": Manga.release_date.asc(),
            "End date +": Manga.end_date.desc(),
            "End date -": Manga.end_date.asc(),
            "MAL Rating +": Manga.vote_average.desc(),
            "MAL Rating -": Manga.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Re-read": cls.redo.desc(),
        }
        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.TIME_PER_CHAPTER * cls.total)


class MangaAuthors(db.Model):
    TYPE = ModelTypes.AUTHORS
    GROUP = MediaType.MANGA

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("manga.id"), nullable=False)
    name = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Manga", back_populates="authors", lazy="select")


class MangaGenre(Genres):
    GROUP = MediaType.MANGA

    media_id = db.Column(db.Integer, db.ForeignKey("manga.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Manga", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List:
        return ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi", "Slice of Life", "Supernatural",
                "Ecchi", "Hentai", "Josei", "Seinen", "Shoujo", "Shounen", "Detective", "Harem", "Historical", "Isekai",
                "Psychological", "School", "Super Power", "Team Sports", "Time Travel", "Video Game", "Sports", "Suspense",
                "Gag Humor", "Gore", "Martial Arts", "Music", "Parody", "Reincarnation", "Space", "Survival", "Vampire"]


class MangaLabels(Labels):
    GROUP = MediaType.MANGA

    media_id = db.Column(db.Integer, db.ForeignKey("manga.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Manga", back_populates="labels", lazy="select")
