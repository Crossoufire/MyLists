from __future__ import annotations

import json
import secrets
from time import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any

import jwt
from flask import url_for, current_app
from sqlalchemy import desc, func, select
from flask_bcrypt import check_password_hash, generate_password_hash

from backend.api import db
from backend.api.core import current_user
from backend.api.utils.functions import compute_level, naive_utcnow
from backend.api.utils.enums import RoleType, MediaType, NotificationType, UpdateType, Privacy, SearchSelector, RatingSystem


followers = db.Table(
    "followers",
    db.Column("follower_id", db.Integer, db.ForeignKey("user.id")),
    db.Column("followed_id", db.Integer, db.ForeignKey("user.id")),
)


class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True)
    access_token = db.Column(db.String, nullable=False, index=True)
    access_expiration = db.Column(db.DateTime, nullable=False)
    refresh_token = db.Column(db.String, nullable=False, index=True)
    refresh_expiration = db.Column(db.DateTime, nullable=False)

    # --- Relationships ------------------------------------------------------------
    user = db.relationship("User", back_populates="token", lazy="select")

    def generate(self):
        self.access_token = secrets.token_urlsafe()
        self.access_expiration = naive_utcnow() + timedelta(minutes=current_app.config["ACCESS_TOKEN_MINUTES"])
        self.refresh_token = secrets.token_urlsafe()
        self.refresh_expiration = naive_utcnow() + timedelta(days=current_app.config["REFRESH_TOKEN_DAYS"])

    def expire(self, delay: int = None):
        # Add 5 seconds delay for simultaneous requests
        if delay is None:
            delay = 5 if not current_app.testing else 0

        self.access_expiration = naive_utcnow() + timedelta(seconds=delay)
        self.refresh_expiration = naive_utcnow() + timedelta(seconds=delay)

    @classmethod
    def clean(cls):
        yesterday = naive_utcnow() - timedelta(days=1)
        cls.query.filter(cls.refresh_expiration < yesterday).delete()
        db.session.commit()


class User(db.Model):
    def __repr__(self):
        return f"<{self.username} - {self.id}>"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    password = db.Column(db.String)
    image_file = db.Column(db.String, nullable=False, default="default.jpg")
    background_image = db.Column(db.String, nullable=False, default="default.jpg")
    privacy = db.Column(db.Enum(Privacy), nullable=False, default=Privacy.RESTRICTED)
    active = db.Column(db.Boolean, nullable=False, default=False)
    role = db.Column(db.Enum(RoleType), nullable=False, default=RoleType.USER)
    transition_email = db.Column(db.String)
    activated_on = db.Column(db.DateTime)
    last_notif_read_time = db.Column(db.DateTime)
    last_seen = db.Column(db.DateTime, default=naive_utcnow)
    show_update_modal = db.Column(db.Boolean, default=True)
    grid_list_view = db.Column(db.Boolean, nullable=False, default=True)
    profile_views = db.Column(db.Integer, nullable=False, default=0)
    search_selector = db.Column(db.Enum(SearchSelector), nullable=False, default=SearchSelector.TMDB)
    rating_system = db.Column(db.Enum(RatingSystem), nullable=False, default=RatingSystem.SCORE)

    # --- Relationships ----------------------------------------------------------------
    token = db.relationship("Token", back_populates="user", lazy="noload")
    anime_list = db.relationship("AnimeList", back_populates="user", lazy="select")
    games_list = db.relationship("GamesList", back_populates="user", lazy="select")
    books_list = db.relationship("BooksList", back_populates="user", lazy="select")
    movies_list = db.relationship("MoviesList", back_populates="user", lazy="select")
    series_list = db.relationship("SeriesList", back_populates="user", lazy="select")
    manga_list = db.relationship("MangaList", back_populates="user", lazy="select")
    settings = db.relationship("UserMediaSettings", back_populates="user", lazy="joined")
    mediadle_stats = db.relationship("MediadleStats", back_populates="user", lazy="select")
    achievements = db.relationship("UserAchievement", back_populates="user", lazy="select")
    mediadle_progress = db.relationship("UserMediadleProgress", back_populates="user", lazy="select")
    notifications = db.relationship(
        "Notifications",
        primaryjoin="Notifications.user_id == User.id",
        back_populates="user",
        order_by="desc(Notifications.timestamp)",
        lazy="dynamic",
    )
    updates = db.relationship(
        "UserMediaUpdate",
        primaryjoin="UserMediaUpdate.user_id == User.id",
        back_populates="user",
        order_by="desc(UserMediaUpdate.timestamp)",
        lazy="dynamic",
    )
    followed = db.relationship(
        "User",
        secondary=followers,
        primaryjoin=(followers.c.follower_id == id),
        secondaryjoin=(followers.c.followed_id == id),
        order_by="asc(User.username)",
        backref=db.backref("followers", lazy="dynamic"),
        lazy="dynamic",
    )

    @property
    def profile_image(self) -> str:
        return url_for("static", filename=f"profile_pics/{self.image_file}")

    @property
    def back_image(self) -> str:
        return url_for("static", filename=f"background_pics/{self.background_image}")

    @property
    def followers_count(self) -> int:
        return self.followers.count()

    @property
    def profile_level(self) -> int:
        return int(compute_level(sum(settings.time_spent for settings in self.settings if settings.active)))

    def to_dict(self) -> Dict:
        excluded_attrs = ("email", "password")
        user_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name not in excluded_attrs}

        user_dict.update(dict(
            registered_on=self.registered_on,
            profile_image=self.profile_image,
            back_image=self.back_image,
            profile_level=self.profile_level,
            followers_count=self.followers_count,
            settings=[setting.to_dict() for setting in self.settings],
        ))

        return user_dict

    def get_media_setting(self, media_type: MediaType) -> UserMediaSettings:
        return next(setting for setting in self.settings if setting.media_type == media_type)

    def verify_password(self, password: str) -> bool:
        if password == "" or password is None:
            return False
        return check_password_hash(self.password, password)

    def ping(self):
        self.last_seen = naive_utcnow()

    def revoke_all_tokens(self):
        Token.query.filter(Token.user == self).delete()
        db.session.commit()

    def generate_auth_token(self) -> Token:
        token = Token(user=self)
        token.generate()
        return token

    def set_view_count(self, user: User, media_type: MediaType):
        if self.id != user.id:
            user.get_media_setting(media_type).views += 1

    def add_follow(self, user: User):
        if not self.is_following(user):
            self.followed.append(user)

    def is_following(self, user: User) -> bool:
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def remove_follow(self, user: User):
        if self.is_following(user):
            self.followed.remove(user)

    def get_follows(self, limit: int = 8):
        follows = self.followed.all()
        return {"total": len(follows), "follows": [follow.to_dict() for follow in follows[:limit]]}

    def get_last_notifications(self, limit: int = 8) -> List[Dict]:
        current_user.last_notif_read_time = naive_utcnow()
        db.session.commit()
        query = (
            Notifications.query.filter_by(user_id=self.id).order_by(desc(Notifications.timestamp))
            .limit(limit).all()
        )
        return [notification.to_dict() for notification in query]

    def count_notifications(self) -> int:
        last_notif_time = self.last_notif_read_time or datetime(1900, 1, 1)
        notification_count = (
            db.session.query(func.count(Notifications.id))
            .filter(Notifications.user_id == self.id, Notifications.timestamp > last_notif_time)
            .scalar()
        )
        return notification_count

    def get_last_updates(self, limit: int) -> List[Dict]:
        return [update.to_dict() for update in self.updates.limit(limit).all()]

    def get_follows_updates(self, limit: int, as_public: bool = False) -> List[Dict]:
        followed_users = self.followed.all() if not as_public else self.followed.filter_by(privacy=Privacy.PUBLIC).all()

        follows_updates = (
            UserMediaUpdate.query.filter(UserMediaUpdate.user_id.in_([u.id for u in followed_users]))
            .order_by(desc(UserMediaUpdate.timestamp))
            .limit(limit).all()
        )
        return [{"username": update.user.username, **update.to_dict()} for update in follows_updates]

    def generate_jwt_token(self, expires_in: int = 600) -> str:
        token = jwt.encode(
            payload={"token": self.id, "exp": time() + expires_in},
            key=current_app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        return token

    @classmethod
    def generate_unique_username(cls, email: str):
        """ Generate a unique username for OAuth2 registration """

        base_username = email.split("@")[0]
        username = base_username[:14]
        while cls.query.filter_by(username=username).first():
            suffix = secrets.token_hex(2)
            username = f"{base_username}_{suffix}"[:14]

        return username

    @classmethod
    def search(cls, query: str, page: int = 1) -> Dict:
        users = db.paginate(
            db.select(cls).filter(cls.username.like(f"%{query}%"), cls.active.is_(True)),
            page=page, per_page=8, error_out=True,
        )

        users_list = [dict(
            name=user.username,
            image_cover=user.profile_image,
            date=user.registered_on.strftime("%d %b %Y"),
            media_type="User",
        ) for user in users.items]

        return dict(items=users_list, total=users.total, pages=users.pages)

    @classmethod
    def register_new_user(cls, username: str, email: str, **kwargs) -> User:
        new_user = cls(
            username=username,
            email=email,
            password=None if not kwargs.get("password") else generate_password_hash(kwargs["password"]),
            activated_on=kwargs.get("activated_on", None),
            registered_on=naive_utcnow(),
            active=kwargs.get("active", current_app.config["USER_ACTIVE_PER_DEFAULT"]),
        )
        db.session.add(new_user)
        db.session.flush()

        for media_type in MediaType:
            new_user_media_settings = UserMediaSettings(
                user_id=new_user.id,
                media_type=media_type,
                active=True if media_type in MediaType.default() else False,
            )
            db.session.add(new_user_media_settings)
        db.session.commit()

        return new_user

    @staticmethod
    def verify_access_token(access_token: str) -> User:
        # noinspection PyTypeChecker
        token = db.session.scalar(select(Token).where(Token.access_token == access_token))
        if token:
            if token.access_expiration > naive_utcnow():
                token.user.ping()
                db.session.commit()
                return token.user

    @staticmethod
    def verify_refresh_token(refresh_token: str, access_token: str) -> Optional[Token]:
        token = Token.query.filter_by(refresh_token=refresh_token, access_token=access_token).first()
        if token:
            if token.refresh_expiration > naive_utcnow():
                return token

            # Try to refresh with expired token: revoke all tokens from user as precaution
            token.user.revoke_all_tokens()
            db.session.commit()

    @staticmethod
    def verify_jwt_token(token: str) -> Optional[User]:
        try:
            user_id = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])["token"]
            return User.query.filter_by(id=user_id).first()
        except:
            return None


class UserMediaSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    media_type = db.Column(db.Enum(MediaType), nullable=False, index=True)
    active = db.Column(db.Boolean, nullable=False, default=False)

    # Media List Stats
    views = db.Column(db.Integer, nullable=False, default=0)
    time_spent = db.Column(db.Integer, nullable=False, default=0)
    total_entries = db.Column(db.Integer, nullable=False, default=0)
    total_redo = db.Column(db.Integer, nullable=False, default=0)
    entries_rated = db.Column(db.Integer, nullable=False, default=0)
    sum_entries_rated = db.Column(db.Integer, nullable=False, default=0)
    entries_commented = db.Column(db.Integer, nullable=False, default=0)
    entries_favorites = db.Column(db.Integer, nullable=False, default=0)
    total_specific = db.Column(db.Integer, nullable=False, default=0)
    status_counts = db.Column(db.JSON, nullable=False, default={})
    average_rating = db.Column(db.Float, nullable=True)

    # --- Relationships ----------------------------------------------------------------
    user = db.relationship("User", back_populates="settings", lazy="select")

    @property
    def level(self) -> float:
        return compute_level(self.time_spent)

    def to_dict(self) -> Dict:
        data_dict = {}
        if hasattr(self, "__table__"):
            data_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        data_dict.update({"level": self.level})
        return data_dict


class UserMediaUpdate(db.Model):
    UPDATE_THRESHOLD = 600

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    media_id = db.Column(db.Integer, nullable=False, index=True)
    media_name = db.Column(db.String, nullable=False)
    media_type = db.Column(db.Enum(MediaType), nullable=False, index=True)
    update_type = db.Column(db.Enum(UpdateType), nullable=False)
    payload = db.Column(db.TEXT, nullable=False)
    timestamp = db.Column(db.DateTime, default=naive_utcnow, nullable=False, index=True)

    # --- Relationships ----------------------------------------------------------------
    user = db.relationship("User", back_populates="updates", lazy="joined")

    def to_dict(self) -> Dict:
        update_dict = dict(
            id=self.id,
            user_id=self.user_id,
            media_id=self.media_id,
            media_name=self.media_name,
            media_type=self.media_type.value,
            update_type=self.update_type.value,
            payload=json.loads(self.payload),
            timestamp=self.timestamp,
        )
        return update_dict

    @classmethod
    def set_new_update(cls, media: db.Model, update_type: UpdateType, old_value: Any, new_value: Any, **kwargs):
        previous_db_entry = (
            cls.query.filter_by(user_id=current_user.id, media_id=media.id, media_type=media.GROUP)
            .order_by(cls.timestamp.desc()).first()
        )

        time_difference = float("inf")
        if previous_db_entry:
            time_difference = (naive_utcnow() - previous_db_entry.timestamp).total_seconds()

        # noinspection PyArgumentList
        new_update = cls(
            user_id=current_user.id,
            media_id=media.id,
            media_name=media.name,
            media_type=media.GROUP,
            update_type=update_type,
            payload=json.dumps({"old_value": old_value, "new_value": new_value}),
            **kwargs,
        )

        if time_difference > cls.UPDATE_THRESHOLD:
            db.session.add(new_update)
        else:
            db.session.delete(previous_db_entry)
            db.session.add(new_update)


class Notifications(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    media_id = db.Column(db.Integer)
    media_type = db.Column(db.Enum(MediaType))
    notification_type = db.Column(db.Enum(NotificationType))
    payload = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=naive_utcnow)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="notifications", lazy="select")

    @classmethod
    def search(cls, user_id: int, media_type: MediaType, media_id: int) -> Optional[Notifications]:
        data = (
            cls.query.filter_by(user_id=user_id, media_type=media_type, media_id=media_id)
            .order_by(desc(cls.timestamp))
            .first()
        )

        return data

    def to_dict(self):
        data = dict(
            user_id=self.user_id,
            media_id=self.media_id,
            media_type=self.media_type.value if self.media_type else None,
            notification_type=self.notification_type.value,
            payload=json.loads(self.payload),
            timestamp=self.timestamp,
        )
        return data
