from __future__ import annotations
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import List, Dict
import jwt
from flask import url_for, current_app
from flask_bcrypt import check_password_hash, generate_password_hash
from sqlalchemy import desc, func, select, union_all, literal
from backend.api import db
from backend.api.core.handlers import current_user
from backend.api.models.mixins import SearchableMixin
from backend.api.utils.enums import RoleType, MediaType, Status, ModelTypes, PrivacyType, RatingSystem, UpdateType, \
    NotificationType
from backend.api.utils.functions import compute_level, safe_div
from backend.api.managers.ModelsManager import ModelsManager

followers = db.Table(
    "followers",
    db.Column("follower_id", db.Integer, db.ForeignKey("user.id")),
    db.Column("followed_id", db.Integer, db.ForeignKey("user.id")),
)


class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True)
    access_token = db.Column(db.String(64), nullable=False, index=True)
    access_expiration = db.Column(db.DateTime, nullable=False)
    refresh_token = db.Column(db.String(64), nullable=False, index=True)
    refresh_expiration = db.Column(db.DateTime, nullable=False)

    # --- Relationships ------------------------------------------------------------
    user = db.relationship("User", back_populates="token")

    def generate(self):
        self.access_token = secrets.token_urlsafe()
        self.access_expiration = datetime.utcnow() + timedelta(minutes=current_app.config["ACCESS_TOKEN_MINUTES"])
        self.refresh_token = secrets.token_urlsafe()
        self.refresh_expiration = datetime.utcnow() + timedelta(days=current_app.config["REFRESH_TOKEN_DAYS"])

    def expire(self, delay: int = None):
        # Add 5 second delay for simultaneous requests
        if delay is None:
            delay = 5 if not current_app.testing else 0

        self.access_expiration = datetime.utcnow() + timedelta(seconds=delay)
        self.refresh_expiration = datetime.utcnow() + timedelta(seconds=delay)

    @classmethod
    def clean(cls):
        yesterday = datetime.utcnow() - timedelta(days=1)
        cls.query.filter(cls.refresh_expiration < yesterday).delete()
        db.session.commit()


class User(db.Model, SearchableMixin):
    def __repr__(self):
        return f"<{self.username} - {self.id}>"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    password_hash = db.Column(db.String)
    image_file = db.Column(db.String, nullable=False, default="default.jpg")
    background_image = db.Column(db.String, nullable=False, default="default.jpg")
    rating_system = db.Column(db.Enum(RatingSystem), nullable=False, default=RatingSystem.SCORE)
    privacy = db.Column(db.Enum(PrivacyType), nullable=False, default=PrivacyType.NORMAL)
    role = db.Column(db.Enum(RoleType), nullable=False, default=RoleType.USER)
    active = db.Column(db.Boolean, nullable=False, default=False)
    transition_email = db.Column(db.String)
    activated_on = db.Column(db.DateTime)
    last_notif_read_time = db.Column(db.DateTime)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    show_update_modal = db.Column(db.Boolean, default=True)
    profile_views = db.Column(db.Integer, nullable=False, default=0)

    __searchable__ = ["username"]

    # --- Relationships ----------------------------------------------------------------
    anime_list = db.relationship("AnimeList", back_populates="user", lazy="select")
    games_list = db.relationship("GamesList", back_populates="user", lazy="select")
    books_list = db.relationship("BooksList", back_populates="user", lazy="select")
    movies_list = db.relationship("MoviesList", back_populates="user", lazy="select")
    series_list = db.relationship("SeriesList", back_populates="user", lazy="select")
    token = db.relationship("Token", back_populates="user", lazy="noload")
    settings = db.relationship("UserMediaSettings", back_populates="user", lazy="joined")
    updates = db.relationship(
        "UserMediaUpdate",
        primaryjoin="UserMediaUpdate.user_id == User.id",
        back_populates="user",
        order_by="desc(UserMediaUpdate.timestamp)",
        lazy="dynamic",
    )
    notifications = db.relationship(
        "Notifications",
        primaryjoin="Notifications.user_id == User.id",
        back_populates="user",
        order_by="desc(Notifications.timestamp)",
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
    def password(self):
        raise AttributeError("password is not a readable attribute")

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    @property
    def profile_image(self) -> str:
        return url_for("static", filename=f"profile_pictures/{self.image_file}")

    @property
    def back_image(self) -> str:
        return url_for("static", filename=f"back_pictures/{self.background_image}")

    @property
    def profile_border(self) -> str:
        profile_border = "border_40.png"
        profile_border_level = (self.profile_level // 8) + 1
        if profile_border_level < 40:
            profile_border = f"border_{profile_border_level}.png"

        return url_for("static", filename=f"profile_borders/{profile_border}")

    @property
    def profile_level(self) -> int:
        total_time = 0
        for setting in self.settings:
            total_time += setting.time_spent if setting.active else 0
        return int(compute_level(total_time))

    def ping(self):
        self.last_seen = datetime.utcnow()

    def verify_password(self, password: str) -> bool:
        if self.password_hash:
            return check_password_hash(self.password_hash, password)

    def revoke_all_tokens(self):
        Token.query.filter(Token.user == self).delete()
        db.session.commit()

    def generate_auth_token(self) -> Token:
        token = Token(user=self)
        token.generate()
        return token

    def generate_jwt_token(self, expires_in: int = 600) -> str:
        token = jwt.encode(
            payload={"token": self.id, "exp": time.time() + expires_in},
            key=current_app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        return token

    def get_media_setting(self, media_type: MediaType) -> UserMediaSettings:
        return next(setting for setting in self.settings if setting.media_type == media_type)

    def add_follow(self, user: User):
        if not self.is_following(user):
            self.followed.append(user)

    def is_following(self, user: User) -> bool:
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def remove_follow(self, user: User):
        if self.is_following(user):
            self.followed.remove(user)

    def get_follows(self, limit_: int = 8) -> Dict:
        follows = self.followed.all()
        return {"total": len(follows), "follows": follows[:limit_]}

    def get_global_media_stats(self) -> Dict:
        """ Get the user's global media stats based on the user's activated MediaType """

        activated_media_types = [setting.media_type for setting in self.user.settings if setting.active]
        models = ModelsManager.get_lists_models(activated_media_types, ModelTypes.LIST)

        # Calculate time per media [hours]
        query_attrs = [getattr(User, f"time_spent_{model.GROUP.value}") for model in models]
        time_per_media = [t / 60 for t in db.session.query(*query_attrs).filter_by(id=self.id).first()]

        # Total time [hours]
        total_hours = sum(time_per_media)

        # If feeling - count per feeling
        count_per_feeling = []
        if self.add_feeling:
            # Create temporary table subquery with all feelings [0 to 5]
            all_feelings = union_all(select(literal(0).label("feeling")), select(literal(1)), select(literal(2)),
                                     select(literal(3)), select(literal(4)), select(literal(5))).subquery()

            # Query feelings for each model
            user_feelings = union_all(*[db.session.query(model.feeling.label("feeling"))
                                      .filter(model.user_id == self.id, model.feeling.isnot(None))
                                        for model in models]).subquery()

            # Query results as list of tuple
            results = (db.session.query(all_feelings.c.feeling, func.count(user_feelings.c.feeling))
                       .outerjoin(user_feelings, all_feelings.c.feeling == user_feelings.c.feeling)
                       .group_by(all_feelings.c.feeling).order_by(desc(all_feelings.c.feeling)).all())

            # Create List[int] always size 5 from highest to lowest
            count_per_feeling = [r[1] for r in results]

        # Combine queries for count total media, percentage rated, and average rating
        rating = "feeling" if self.add_feeling else "score"
        subqueries = union_all(*[(db.session.query(func.count(model.media_id), func.count(getattr(model, rating)),
                                                   func.coalesce(func.sum(getattr(model, rating)), 0))
                                  .filter(model.user_id == self.id)) for model in models])
        results = db.session.execute(subqueries).all()

        # Calculation for total media, percent scored, and mean score
        total_media, total_scored, sum_score = map(sum, zip(*results))
        percent_scored = safe_div(total_scored, total_media, percentage=True)
        mean_score = safe_div(sum_score, total_scored)

        data = dict(
            total_hours=int(total_hours),
            total_days=round(total_hours / 24, 0),
            total_media=total_media,
            time_per_media=time_per_media,
            total_scored=total_scored,
            percent_scored=percent_scored,
            mean_score=mean_score,
            count_per_feeling=count_per_feeling,
            media_types=[model.GROUP.value for model in models],
        )

        return data

    def get_one_media_details(self, media_type: MediaType) -> Dict:
        """ Get the selected media details for the user """

        media_list, media_label = ModelsManager.get_lists_models(media_type, [ModelTypes.LIST, ModelTypes.LABELS])

        media_dict = dict(
            media_type=media_type.value,
            specific_total=media_list.get_specific_total(self.id),
            count_per_metric=media_list.get_media_count_per_rating(self),
            time_hours=int(getattr(self, f"time_spent_{media_type.value}") / 60),
            time_days=int(getattr(self, f"time_spent_{media_type.value}") / 1440),
            labels=media_label.get_total_and_labels_names(self.id, limit_=10),
        )

        media_dict.update(media_list.get_media_count_per_status(self.id))
        media_dict.update(media_list.get_favorites_media(self.id, limit=10))
        media_dict.update(media_list.get_media_rating(self))

        return media_dict

    @staticmethod
    def verify_access_token(access_token: str) -> User:
        token = Token.query.filter_by(access_token=access_token).first()
        if token:
            if token.access_expiration > datetime.utcnow():
                token.user.ping()
                db.session.commit()
                return token.user

    @staticmethod
    def verify_refresh_token(refresh_token: str, access_token: str) -> Token:
        token = Token.query.filter_by(refresh_token=refresh_token, access_token=access_token).first()
        if token:
            if token.refresh_expiration > datetime.utcnow():
                return token
            # Tried to refresh with expired token: revoke all tokens from user as precaution
            token.user.revoke_all_tokens()
            db.session.commit()

    @staticmethod
    def verify_jwt_token(token: str) -> User:
        try:
            user_id = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])["token"]
            return User.query.filter_by(id=user_id).first()
        except:
            pass


class UserMediaSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    media_type = db.Column(db.Enum(MediaType), nullable=False, index=True)
    time_spent = db.Column(db.Integer, nullable=False, default=0)
    views = db.Column(db.Integer, nullable=False, default=0)
    active = db.Column(db.Boolean, nullable=False, default=False)

    # --- Relationships ----------------------------------------------------------------
    user = db.relationship("User", back_populates="settings", lazy="select")


class UserMediaUpdate(db.Model, SearchableMixin):
    THRESHOLD = 600

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    media_id = db.Column(db.Integer, nullable=False, index=True)
    media_name = db.Column(db.String, nullable=False)
    media_type = db.Column(db.Enum(MediaType), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    update_type = db.Column(db.Enum(UpdateType), nullable=False)
    update_data = db.Column(db.TEXT, nullable=False)

    # --- Relationships ----------------------------------------------------------------
    user = db.relationship("User", back_populates="updates", lazy="joined")

    __searchable_rs__ = {"media": {"model": "Media", "fields": ["name"]}}

    @classmethod
    def get_last_updates(cls, user_id: int, limit_: int = 10, follows: bool = False) -> List[UserMediaUpdate]:
        query = cls.query

        if follows:
            query = query.join(followers, followers.c.follower_id == cls.user_id)
            query = query.filter(followers.c.followed_id == user_id)
        else:
            query = query.filter_by(user_id=user_id)

        return query.order_by(cls.timestamp.desc()).limit(limit_).all()

    @classmethod
    def set_new_update(cls, user_id: int, media: db.Model, update_type: UpdateType, old_value, new_value):
        previous_db_entry = (
            cls.query.filter_by(user_id=user_id, media_id=media.id, media_type=media.GROUP)
            .order_by(cls.timestamp.desc()).first()
        )

        time_difference = float("inf")
        if previous_db_entry:
            time_difference = (datetime.utcnow() - previous_db_entry.timestamp).total_seconds()

        # noinspection PyArgumentList
        new_update = cls(
            user_id=user_id,
            media_id=media.id,
            media_name=media.name,
            media_type=media.media_type,
            update_type=update_type,
            update_data=json.dumps({"old_value": old_value, "new_value": new_value}),
        )

        if time_difference > cls.THRESHOLD:
            db.session.add(new_update)
        else:
            db.session.delete(previous_db_entry)
            db.session.add(new_update)

    @classmethod
    def get_history(cls, user_id: int, media_id: int, media_type: MediaType) -> Dict:
        return (
            cls.query.filter_by(user_id=user_id, media_id=media_id, media_type=media_type)
            .order_by(cls.timestamp.desc()).all()
        )

    @classmethod
    def delete_history(cls, user_id: int, media_id: int, media_type: MediaType):
        cls.query.filter_by(user_id=user_id, media_id=media_id, media_type=media_type).delete()


class UserLastUpdate(db.Model):
    THRESHOLD = 600

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True, nullable=False)
    media_id = db.Column(db.Integer)
    media_name = db.Column(db.String(50), nullable=False)
    media_type = db.Column(db.Enum(MediaType), index=True, nullable=False)
    date = db.Column(db.DateTime, index=True, nullable=False)

    old_status = db.Column(db.Enum(Status))
    new_status = db.Column(db.Enum(Status))
    old_season = db.Column(db.Integer)
    new_season = db.Column(db.Integer)
    old_episode = db.Column(db.Integer)
    new_episode = db.Column(db.Integer)
    old_playtime = db.Column(db.Integer)
    new_playtime = db.Column(db.Integer)
    old_page = db.Column(db.Integer)
    new_page = db.Column(db.Integer)
    old_redo = db.Column(db.Integer)
    new_redo = db.Column(db.Integer)

    def to_dict(self) -> Dict:
        update_dict = {}

        # Page update
        if self.old_page is not None and self.new_page is not None and self.old_page >= 0 and self.new_page >= 0:
            update_dict["update"] = [f"p. {int(self.old_page)}", f"p. {int(self.new_page)}"]

        # Playtime update
        elif (self.old_playtime is not None and self.new_playtime is not None and self.old_playtime >= 0
              and self.new_playtime >= 0):
            update_dict["update"] = [f"{int(self.old_playtime / 60)} h", f"{int(self.new_playtime / 60)} h"]

        # Redo update
        elif self.old_redo is not None and self.new_redo is not None and self.old_redo >= 0 and self.new_redo >= 0:
            value = "watched" if self.media_type != MediaType.BOOKS else "read"
            update_dict["update"] = [f"Re-{value} {int(self.old_redo)}x", f"{int(self.new_redo)}x"]

        # Status update
        elif self.old_status is not None and self.new_status is not None:
            update_dict["update"] = [f"{self.old_status.value}", f"{self.new_status.value}"]

        # Newly added media
        elif self.old_status is None and self.new_status is not None:
            update_dict["update"] = [f"{self.new_status.value}"]

        # Season and episode update
        else:
            try:
                update_dict["update"] = [
                    f"S{self.old_season:02d}.E{self.old_episode:02d}",
                    f"S{self.new_season:02d}.E{self.new_episode:02d}",
                ]
            except:
                update_dict["update"] = ["Watching"]
                current_app.logger.error(f"[ERROR] - An error occurred updating the user last updates for: "
                                         f"({self.media_id}, {self.media_name}, {self.media_type})")

        # Update date and add media name
        update_dict["date"] = self.date.replace(tzinfo=timezone.utc).isoformat()
        update_dict["media_name"] = self.media_name
        update_dict["media_id"] = self.media_id
        update_dict["media_type"] = self.media_type.value

        return update_dict

    @classmethod
    def set_new_update(cls, media: db.Model, update_type: str, old_value, new_value, **kwargs):
        """ Add a new <Status> update to the model. Kwargs for specific details """

        # Check previous database entry
        previous_entry = (
            cls.query.filter_by(user_id=current_user.id, media_type=media.GROUP, media_id=media.id)
            .order_by(desc(cls.date))
            .first()
        )

        time_difference = float("inf")
        if previous_entry:
            time_difference = (datetime.utcnow() - previous_entry.date).total_seconds()

        # Create new update dict
        update_dict = {
            "user_id": current_user.id,
            "media_name": media.name,
            "media_id": media.id,
            "media_type": media.GROUP,
            f"old_{update_type}": old_value,
            f"new_{update_type}": new_value,
            "date": datetime.utcnow(),
        }

        # Check for season
        if kwargs.get("old_episode") and kwargs.get("new_episode"):
            update_dict.update({"old_episode": kwargs["old_episode"], "new_episode": kwargs["new_episode"]})

        # Check for episode
        if kwargs.get("old_season"):
            update_dict.update({"old_season": kwargs["old_season"], "new_season": kwargs["old_season"]})

        # Create new update
        new_update = cls(**update_dict)

        # Add new update
        if time_difference > cls.THRESHOLD:
            db.session.add(new_update)
        else:
            db.session.delete(previous_entry)
            db.session.add(new_update)

    @classmethod
    def get_history(cls, media_type: MediaType, media_id: int) -> List[Dict]:
        """ Get the <current_user> history for a specific <media> """

        history = cls.query.filter(cls.user_id == current_user.id, cls.media_type == media_type,
                                   cls.media_id == media_id).order_by(desc(UserLastUpdate.date)).all()

        return [update.to_dict() for update in history]


class Notifications(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    media_id = db.Column(db.Integer, index=True)
    media_type = db.Column(db.Enum(MediaType), index=True)
    notif_type = db.Column(db.Enum(NotificationType), nullable=False)
    notif_data = db.Column(db.TEXT, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # --- Relationships ----------------------------------------------------------------
    user = db.relationship("User", back_populates="notifications", lazy="select")
