from __future__ import annotations
from datetime import datetime
from typing import List, Dict, Optional
from flask import url_for
from sqlalchemy import func, desc
from backend.api import db
from backend.api.core import current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.mixins import SearchableMixin, UpdateMixin
from backend.api.models.user import User, followers, UserMediaUpdate
from backend.api.utils.enums import ModelTypes, Status, MediaType
from backend.api.utils.functions import safe_div


class Media(db.Model, SearchableMixin, UpdateMixin):
    __abstract__ = True

    TYPE: ModelTypes = ModelTypes.MEDIA
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

    @property
    def media_cover(self) -> str:
        return url_for("static", filename=f"covers/{self.GROUP.value}_covers/{self.image_cover}")

    @property
    def genres_list(self) -> List[str]:
        return [g.name for g in self.genres[:5]]

    @property
    def actors_list(self) -> List[str]:
        return [a.name for a in self.actors]

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
            "add_feeling": follow[0].add_feeling,
            **follow[1].to_dict(),
        } for follow in in_follows_lists]

        return data

    def get_user_list_info(self, label_class: Labels) -> Optional[Dict]:
        media_assoc = self.list_info.filter_by(user_id=current_user.id).first()
        user_data = media_assoc.to_dict() if media_assoc else None

        if user_data:
            user_data.update(dict(
                username=current_user.username,
                labels=label_class.get_user_media_labels(user_id=current_user.id, media_id=self.id),
                history=UserMediaUpdate.get_history(self.id, self.GROUP)),
            )

        return user_data


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

    @classmethod
    def get_media_count_per_status(cls, user_id: int) -> Dict:
        media_count = (
            db.session.query(cls.status, func.count(cls.status))
            .filter_by(user_id=user_id).group_by(cls.status)
            .all()
        )

        status_count = {status.value: {"count": 0, "percent": 0} for status in Status.by(cls.GROUP)}
        total_media = sum(count for _, count in media_count)
        no_data = (total_media == 0)

        # Update <status_count> dict with actual values from <media_count> query
        if media_count:
            media_dict = {
                status.value: {"count": count, "percent": safe_div(count, total_media, True)}
                for status, count in media_count
            }

            status_count.update(media_dict)

        status_list = [{"status": key, **val} for key, val in status_count.items()]

        return dict(total_media=total_media, no_data=no_data, status_count=status_list)

    @classmethod
    def get_media_count_per_rating(cls, user: User) -> List[int]:
        rating = cls.feeling if user.add_feeling else cls.score
        range_ = list(range(6)) if user.add_feeling else [i * 0.5 for i in range(21)]

        media_count = (
            db.session.query(rating, func.count(rating))
            .filter(cls.user_id == user.id, rating.is_not(None))
            .group_by(rating).order_by(rating).all()
        )

        metric_counts = {str(val): 0 for val in range_}
        new_metric = {str(val): count for val, count in media_count}
        metric_counts.update(new_metric)

        return list(metric_counts.values())

    @classmethod
    def get_media_rating(cls, user: User) -> Dict:
        rating = cls.feeling if user.add_feeling else cls.score

        media_ratings = (
            db.session.query(func.count(rating), func.count(cls.media_id), func.sum(rating))
            .filter(cls.user_id == user.id).all()
        )

        count_rating, count_media, sum_rating = media_ratings[0]
        percent_rating = safe_div(count_rating, count_media, percentage=True)
        mean_metric = safe_div(sum_rating, count_rating)

        return dict(media_metric=count_rating, percent_metric=percent_rating, mean_metric=mean_metric)

    @classmethod
    def get_specific_total(cls, user_id: int) -> int:
        """
        Retrieve a specific aggregate value: either the total count of episodes for TV shows, the total watched
        count along with the number of rewatched movies for movies, or the total number of pages read for books.
        This behavior is overridden by the <GamesList> class, which doesn't possess an interesting specific aggregate
        value in its SQL table
        """
        return db.session.query(func.sum(cls.total)).filter(cls.user_id == user_id).scalar() or 0

    @classmethod
    def get_favorites_media(cls, user_id: int, limit: int = 10) -> Dict:
        favorites_query = cls.query.filter_by(user_id=user_id, favorite=True).order_by(func.random()).all()

        favorites_list = [dict(
            media_name=favorite.media.name,
            media_id=favorite.media_id,
            media_cover=favorite.media.media_cover,
        ) for favorite in favorites_query[:limit]]

        return dict(favorites=favorites_list, total_favorites=len(favorites_query))

    @classmethod
    def get_available_sorting(cls, is_feeling: bool) -> Dict:
        media = ModelsManager.get_unique_model(cls.GROUP, ModelTypes.MEDIA)

        sorting_dict = {
            "Title A-Z": media.name.asc(),
            "Title Z-A": media.name.desc(),
            "Release Date +": media.release_date.desc(),
            "Release Date -": media.release_date.asc(),
            "Score TMDB +": media.vote_average.desc(),
            "Score TMDB -": media.vote_average.asc(),
            "Comments": cls.comment.desc(),
            "Rating +": cls.feeling.desc() if is_feeling else cls.score.desc(),
            "Rating -": cls.feeling.asc() if is_feeling else cls.score.asc(),
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
                getattr(media, media_date) > datetime.utcnow(),
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
    def get_user_labels(cls, user_id: int) -> List[str]:
        q_all = db.session.query(cls.name.distinct()).filter_by(user_id=user_id).order_by(cls.name).all()
        return [label[0] for label in q_all]

    @classmethod
    def get_user_media_labels(cls, user_id: int, media_id: int) -> Dict:
        all_labels = set(cls.get_user_labels(user_id))
        q_in = db.session.query(cls.name).filter_by(user_id=user_id, media_id=media_id).order_by(cls.name).all()
        already_in = {label[0] for label in q_in}
        available = all_labels - already_in
        return dict(already_in=list(already_in), available=list(available))

    @classmethod
    def get_total_and_labels_names(cls, user_id: int, limit: int = 10) -> Dict:
        all_labels = cls.get_user_labels(user_id)
        return {"count": len(all_labels), "names": all_labels[:limit]}
