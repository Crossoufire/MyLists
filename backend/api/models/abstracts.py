from __future__ import annotations

from abc import abstractmethod
from typing import List, Dict, Optional

from flask import url_for
from sqlalchemy import func, desc

from backend.api import db
from backend.api.core import current_user
from backend.api.models.mixins import UpdateMixin
from backend.api.models.user import User, followers
from backend.api.utils.functions import naive_utcnow
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import ModelTypes, Status, MediaType, JobType


class Media(db.Model, UpdateMixin):
    __abstract__ = True

    TYPE = ModelTypes.MEDIA
    LOCKING_DAYS: int = 180
    RELEASE_WINDOW: int = 7
    SIMILAR_GENRES: int = 12

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    synopsis = db.Column(db.Text)
    release_date = db.Column(db.String)
    image_cover = db.Column(db.String, nullable=False)
    api_id = db.Column(db.String, nullable=False)
    lock_status = db.Column(db.Boolean, nullable=False, default=0)
    last_api_update = db.Column(db.DateTime)

    # --- ABSTRACT METHODS ---------------------------------------------------------

    @abstractmethod
    def to_dict(self) -> Dict:
        pass

    @abstractmethod
    def add_to_user(self, new_status: Status, user_id: int) -> int:
        pass

    @classmethod
    @abstractmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Dict]:
        pass

    @staticmethod
    @abstractmethod
    def form_only() -> List[str]:
        pass

    # --- PROPERTIES ---------------------------------------------------------------

    @property
    def media_cover(self) -> str:
        return url_for("static", filename=f"covers/{self.GROUP.value}_covers/{self.image_cover}")

    @property
    def genres_list(self) -> List[str]:
        return [g.name for g in self.genres[:5]]

    # --- CONCRETE METHODS --------------------------------------------------------

    def get_similar(self) -> List[Dict]:
        media_model = self.__class__
        media_genre = ModelsManager.get_unique_model(self.GROUP, ModelTypes.GENRE)

        if not self.genres_list:
            return []

        similar_media = (
            db.session.query(media_model, func.count(func.distinct(media_genre.name)).label("genre_c"))
            .join(media_genre, media_model.id == media_genre.media_id)
            .filter(media_genre.name.in_(self.genres_list), media_genre.media_id != self.id)
            .group_by(media_model.id).having(func.count(func.distinct(media_genre.name)) >= 1)
            .order_by(desc("genre_c")).limit(self.SIMILAR_GENRES).all()
        )

        return [dict(media_id=m[0].id, media_name=m[0].name, media_cover=m[0].media_cover) for m in similar_media]

    def in_follows_lists(self) -> List[Dict]:
        media_list = ModelsManager.get_unique_model(self.GROUP, ModelTypes.LIST)
        in_follows_lists = (
            db.session.query(User, media_list, followers)
            .join(User, User.id == followers.c.followed_id)
            .join(media_list, media_list.user_id == followers.c.followed_id)
            .filter(followers.c.follower_id == current_user.id, media_list.media_id == self.id)
            .all()
        )

        data = [{
            "username": follow[0].username,
            "profile_image": follow[0].profile_image,
            **follow[1].to_dict(),
        } for follow in in_follows_lists]

        return data

    def get_user_media_data(self, label_class: Labels) -> Optional[Dict]:
        user_media = self.list_info.filter_by(user_id=current_user.id).first()
        user_media = user_media.to_dict() if user_media else None

        if user_media:
            user_media.update(dict(
                username=current_user.username,
                labels=label_class.get_user_media_labels(user_id=current_user.id, media_id=self.id),
            ))

        return user_media


class MediaList(db.Model):
    __abstract__ = True

    DEFAULT_SORTING = "Title A-Z"
    DEFAULT_STATUS = Status.COMPLETED
    TYPE: ModelTypes = ModelTypes.LIST

    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    status = db.Column(db.Enum(Status), nullable=False)
    rating = db.Column(db.Float)
    favorite = db.Column(db.Boolean)
    comment = db.Column(db.Text)

    # --- ABSTRACT METHODS ---------------------------------------------------------

    @abstractmethod
    def to_dict(self) -> Dict:
        pass

    @abstractmethod
    def update_status(self, new_status: Status) -> int:
        pass

    @classmethod
    @abstractmethod
    def total_user_time_def(cls):
        pass

    # --- CLASS METHODS ------------------------------------------------------------

    @classmethod
    def get_available_sorting(cls) -> Dict:
        media = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)

        sorting_dict = {
            "Title A-Z": media.name.asc(),
            "Title Z-A": media.name.desc(),
            "Release Date +": media.release_date.desc(),
            "Release Date -": media.release_date.asc(),
            "TMDB Rating +": media.vote_average.desc(),
            "TMDB Rating -": media.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Re-watched": cls.redo.desc(),
        }

        return sorting_dict

    @classmethod
    def get_coming_next(cls) -> List[Dict]:
        media = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)
        media_date = "next_episode_to_air" if cls.GROUP in (MediaType.SERIES, MediaType.ANIME) else "release_date"

        next_media = (
            db.session.query(media).join(cls, media.id == cls.media_id)
            .filter(
                getattr(media, media_date) > naive_utcnow(),
                cls.user_id == current_user.id,
                cls.status.notin_([Status.DROPPED, Status.RANDOM]),
            ).order_by(getattr(media, media_date))
            .all()
        )

        data = [dict(
            media_id=media.id,
            media_name=media.name,
            media_cover=media.media_cover,
            date=getattr(media, media_date),
            season_to_air=media.season_to_air if cls.GROUP in (MediaType.SERIES, MediaType.ANIME) else None,
            episode_to_air=media.episode_to_air if cls.GROUP in (MediaType.SERIES, MediaType.ANIME) else None
        ) for media in next_media]

        return data


class Genres(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.GENRE

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    # --- ABSTRACT METHODS ---------------------------------------------------------

    @staticmethod
    @abstractmethod
    def get_available_genres() -> List[str]:
        pass


class Actors(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.ACTORS

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)


class Platforms(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.PLATFORMS

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)


class Labels(db.Model):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.LABELS

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String, nullable=False)

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict

    @classmethod
    def get_user_media_labels(cls, user_id: int, media_id: int) -> List[str]:
        media_labels = cls.query.with_entities(cls.name).filter_by(user_id=user_id, media_id=media_id).order_by(cls.name).all()
        return [label[0] for label in media_labels]

    @classmethod
    def get_total_and_user_labels(cls, user_id: int, limit: int = 10) -> Dict:
        all_labels = cls.query.with_entities(cls.name.distinct()).filter_by(user_id=user_id).order_by(cls.name).all()
        return {"count": len(all_labels), "names": [label[0] for label in all_labels][:limit]}
