from __future__ import annotations
from datetime import datetime
from typing import List, Dict
from flask import url_for
from sqlalchemy import func
from backend.api import db
from backend.api.core.handlers import current_user
from backend.api.models.mixins import SearchableMixin
from backend.api.models.users import User, followers
from backend.api.utils.enums import ModelTypes, MediaType, Status
from backend.api.managers.ModelsManager import ModelsManager


class Media(db.Model, SearchableMixin):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.MEDIA
    LOCKING_DAYS: int = 180
    RELEASE_WINDOW: int = 7
    SIMILAR_GENRES: int = 12

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    release_date = db.Column(db.String)
    synopsis = db.Column(db.Text)
    image_cover = db.Column(db.String, nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)
    last_api_update = db.Column(db.DateTime)

    @property
    def media_cover(self) -> str:
        return url_for("static", filename=f"covers/{self.GROUP.value}_covers/{self.image_cover}")

    def get_similar(self, limit: int = 12) -> List[Media]:
        media_model = self.__class__
        media_genre = ModelsManager.get_unique_model(self.GROUP, ModelTypes.GENRE)

        if len(self.genres) == 0 or self.genres[0].name == "Undefined":
            return []

        similar_media = (
            db.session.query(media_model).outerjoin(media_model.genres)
            .filter(media_genre.id.in_([g.id for g in self.genres]), media_model.id != self.id)
            .group_by(media_model.id).having(func.count(media_genre.id) >= 1)
            .order_by(func.count(media_genre.id).desc())
            .limit(limit).all()
        )

        return similar_media

    def in_follows_lists(self) -> List[Dict]:
        media_list = ModelsManager.get_unique_model(self.GROUP, ModelTypes.LIST)

        in_follows_lists = (
            db.session.query(User, media_list)
            .join(media_list, media_list.user_id == followers.c.followed_id)
            .join(followers, User.id == followers.c.followed_id)
            .filter(media_list.media_id == self.id, followers.c.follower_id == current_user.id)
            .all()
        )

        data = [dict(
            username=user.username,
            profile_cover=user.profile_cover,
            media_assoc=media_list,
        ) for user, media_list in in_follows_lists]

        return data


class MediaList(db.Model, SearchableMixin):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.LIST
    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.COMPLETED

    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    status = db.Column(db.Enum(Status), nullable=False)
    rating = db.Column(db.Float)
    favorite = db.Column(db.Boolean)
    comment = db.Column(db.Text)

    @classmethod
    def get_upcoming_media(cls) -> List[Dict]:
        """ Fetch the upcoming media for the current user. Not available for Books """

        media = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)

        upcoming_media = (
            db.session.query(media).join(cls)
            .filter(
                media.release_date > datetime.utcnow(),
                cls.user_id == current_user.id,
                cls.status.notin_([Status.DROPPED, Status.RANDOM]),
            ).order_by(media.release_date).all()
        )

        data = [dict(
            media_id=media.id,
            media_name=media.name,
            media_cover=media.media_cover,
            season_to_air=media.season_to_air if cls.GROUP in [MediaType.SERIES, MediaType.ANIME] else None,
            episode_to_air=media.episode_to_air if cls.GROUP in [MediaType.SERIES, MediaType.ANIME] else None,
            release_date=datetime.strptime(media.release_date, "%Y-%m-%d").strftime("%d %b %Y"),
        ) for media in upcoming_media]

        return data


class Genre(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.GENRE

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)


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
    name = db.Column(db.String, nullable=False)

    @classmethod
    def get_user_labels(cls, user_id: int) -> List[str]:
        q_all = db.session.query(cls.label.distinct()).filter_by(user_id=user_id).order_by(cls.label).all()
        return [label[0] for label in q_all]

    @classmethod
    def get_user_media_labels(cls, user_id: int, media_id: int) -> Dict:
        all_labels = set(cls.get_user_labels(user_id))
        q_in = db.session.query(cls.label).filter_by(user_id=user_id, media_id=media_id).order_by(cls.label).all()
        already_in = {label[0] for label in q_in}
        available = all_labels - already_in
        return dict(already_in=list(already_in), available=list(available))

    @classmethod
    def get_total_and_labels_names(cls, user_id: int, limit_: int = 10) -> Dict:
        all_labels = cls.get_user_labels(user_id)
        return {"count": len(all_labels), "names": all_labels[:limit_]}

    @classmethod
    def remove_from_media_list(cls, user_id: int, media_id: int):
        cls.query.filter_by(user_id=user_id, media_id=media_id).delete()


class Platform(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.PLATFORMS

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
