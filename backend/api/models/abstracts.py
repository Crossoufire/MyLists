from __future__ import annotations
from flask import url_for
from backend.api import db
from backend.api.models.mixins import SearchableMixin
from backend.api.utils.enums import ModelTypes, Status


class Media(db.Model, SearchableMixin):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.MEDIA
    LOCKING_DAYS: int = 180
    RELEASE_WINDOW: int = 7
    SIMILAR_GENRES: int = 12

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    synopsis = db.Column(db.Text)
    image_cover = db.Column(db.String, nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, nullable=False, default=0)

    @property
    def media_cover(self) -> str:
        return url_for("static", filename=f"covers/{self.GROUP.value}_covers/{self.image_cover}")


class MediaList(db.Model, SearchableMixin):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.LIST
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.COMPLETED

    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    status = db.Column(db.Enum(Status), nullable=False)
    feeling = db.Column(db.String)
    score = db.Column(db.Float)
    favorite = db.Column(db.Boolean)
    comment = db.Column(db.Text)


class Genres(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.GENRE

    id = db.Column(db.Integer, primary_key=True)
    genre = db.Column(db.String, nullable=False)


class Actors(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.ACTORS

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)


class Labels(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.LABELS

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    label = db.Column(db.String, nullable=False)


class Platforms(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.PLATFORMS

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
