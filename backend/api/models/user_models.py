from __future__ import annotations
import json
import secrets
from datetime import datetime, timedelta, timezone
from time import time
from typing import List, Dict
import jwt
from flask import url_for, current_app, abort
from flask_bcrypt import check_password_hash
from sqlalchemy import desc, func, Integer, case, select, union_all, literal
from sqlalchemy.ext.hybrid import hybrid_property
from backend.api import db
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import RoleType, MediaType, Status, ModelTypes
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
    admin_token = db.Column(db.String(64))
    admin_expiration = db.Column(db.DateTime)

    # --- Relationships ------------------------------------------------------------
    user = db.relationship("User", backref=db.backref("token", lazy="noload"))

    def generate(self):
        """ Generate the <access_token> and the <refresh_token> for a user """

        self.access_token = secrets.token_urlsafe()
        self.access_expiration = datetime.utcnow() + timedelta(minutes=current_app.config["ACCESS_TOKEN_MINUTES"])
        self.refresh_token = secrets.token_urlsafe()
        self.refresh_expiration = datetime.utcnow() + timedelta(days=current_app.config["REFRESH_TOKEN_DAYS"])

    def generate_admin(self):
        """ Generate a short-lived <admin_token> """

        self.access_token = secrets.token_urlsafe()
        self.access_expiration = datetime.utcnow() + timedelta(minutes=0)

        self.refresh_token = secrets.token_urlsafe()
        self.refresh_expiration = datetime.utcnow() + timedelta(days=0)

        self.admin_token = secrets.token_urlsafe()
        self.admin_expiration = datetime.utcnow() + timedelta(minutes=current_app.config["ADMIN_TOKEN_MINUTES"])

    def expire(self, delay: int = None):
        """ Add an expiration time on old <access_token>, <refresh_token>, and <admin_token> """

        # Add 5 second delay for simultaneous requests
        if delay is None:
            delay = 5 if not current_app.testing else 0

        self.access_expiration = datetime.utcnow() + timedelta(seconds=delay)
        self.refresh_expiration = datetime.utcnow() + timedelta(seconds=delay)
        self.admin_expiration = datetime.utcnow() + timedelta(seconds=delay)

    @classmethod
    def clean(cls):
        """ Remove all tokens that have been expired for more than a day to keep the database clean """

        yesterday = datetime.utcnow() - timedelta(days=1)
        cls.query.filter(cls.refresh_expiration < yesterday).delete()
        cls.query.filter(cls.admin_expiration < yesterday).delete()

        # Commit changes
        db.session.commit()


class User(db.Model):
    """ User class representation """

    def __repr__(self):
        return f"<{self.username} - {self.id}>"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    password = db.Column(db.String(60))
    image_file = db.Column(db.String(20), nullable=False, default="default.jpg")
    background_image = db.Column(db.String(50), nullable=False, default="default.jpg")
    private = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=False)
    role = db.Column(db.Enum(RoleType), nullable=False, default=RoleType.USER)
    transition_email = db.Column(db.String(120))
    activated_on = db.Column(db.DateTime)
    last_notif_read_time = db.Column(db.DateTime)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    show_update_modal = db.Column(db.Boolean, default=True)

    time_spent_series = db.Column(db.Integer, nullable=False, default=0)
    time_spent_anime = db.Column(db.Integer, nullable=False, default=0)
    time_spent_movies = db.Column(db.Integer, nullable=False, default=0)
    time_spent_games = db.Column(db.Integer, nullable=False, default=0)
    time_spent_books = db.Column(db.Integer, nullable=False, default=0)

    profile_views = db.Column(db.Integer, nullable=False, default=0)
    series_views = db.Column(db.Integer, nullable=False, default=0)
    anime_views = db.Column(db.Integer, nullable=False, default=0)
    movies_views = db.Column(db.Integer, nullable=False, default=0)
    games_views = db.Column(db.Integer, nullable=False, default=0)
    books_views = db.Column(db.Integer, nullable=False, default=0)

    add_anime = db.Column(db.Boolean, nullable=False, default=False)
    add_books = db.Column(db.Boolean, nullable=False, default=False)
    add_games = db.Column(db.Boolean, nullable=False, default=False)
    add_feeling = db.Column(db.Boolean, nullable=False, default=False)

    # --- Relationships ----------------------------------------------------------------
    series_list = db.relationship("SeriesList", backref="user", lazy="select")
    anime_list = db.relationship("AnimeList", backref="user", lazy="select")
    movies_list = db.relationship("MoviesList", backref="user", lazy="select")
    games_list = db.relationship("GamesList", backref="user", lazy="select")
    books_list = db.relationship("BooksList", backref="user", lazy="select")
    notifications = db.relationship("Notifications", backref="user", lazy="select")
    last_updates = db.relationship("UserLastUpdate", backref="user", order_by="desc(UserLastUpdate.date)",
                                   lazy="dynamic")
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
        """ Return the profile image url """
        return url_for("static", filename=f"profile_pics/{self.image_file}")

    @property
    def back_image(self) -> str:
        """ Return the background image url """
        return url_for("static", filename=f"background_pics/{self.background_image}")

    @property
    def profile_border(self) -> str:
        """ Get the profile border based on the profile level """

        profile_border = "border_40.png"
        profile_border_level = (self.profile_level // 8) + 1
        if profile_border_level < 40:
            profile_border = f"border_{profile_border_level}.png"

        return url_for("static", filename=f"img/profile_borders/{profile_border}")

    @property
    def followers_count(self) -> int:
        """ Return the number of followers of the user """
        return self.followers.count()

    @hybrid_property
    def profile_level(self) -> int:
        """ Return the user's profile level """

        total_time = 0
        for media_type in self.activated_media_type():
            total_time += getattr(self, f"time_spent_{media_type.value}")

        return int(compute_level(total_time))

    # noinspection PyMethodParameters
    @profile_level.expression
    def profile_level(cls) -> int:
        """ Return the user's profile level as an SQLAlchemy query """

        total_time = cls.time_spent_series + cls.time_spent_movies
        total_time = case(*[(cls.add_anime, total_time + cls.time_spent_anime)], else_=total_time)
        total_time = case(*[(cls.add_books, total_time + cls.time_spent_books)], else_=total_time)
        total_time = case(*[(cls.add_games, total_time + cls.time_spent_games)], else_=total_time)

        return func.cast(((func.power(400 + 80 * total_time, 0.5)) - 20) / 40, Integer)

    def to_dict(self) -> Dict:
        excluded_attrs = ("email", "password")
        user_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name not in excluded_attrs}

        user_dict.update({
            "role": self.role.value,
            "registered_on": self.registered_on.strftime("%d %b %Y"),
            "profile_image": self.profile_image,
            "back_image": self.back_image,
            "profile_level": self.profile_level,
            "profile_border": self.profile_border,
            "followers_count": self.followers_count,
        })

        return user_dict

    def activated_media_type(self) -> List[MediaType]:
        activated_media_types = []
        for mt in MediaType:
            if hasattr(self, f"add_{mt.value.lower()}") and getattr(self, f"add_{mt.value.lower()}"):
                activated_media_types.append(mt)

        activated_media_types += MediaType.default()

        return sorted(activated_media_types)

    def verify_password(self, password: str) -> bool:
        if password == "" or password is None:
            return False

        return check_password_hash(self.password, password)

    def ping(self):
        self.last_seen = datetime.utcnow()

    def revoke_all_tokens(self):
        Token.query.filter(Token.user == self).delete()
        db.session.commit()

    def generate_auth_token(self) -> Token:
        token = Token(user=self)
        token.generate()
        return token

    def generate_admin_token(self) -> Token:
        token = Token(user=self)
        token.generate_admin()
        return token

    def check_autorization(self, username: str) -> User:
        """ Check if the <current_user> can see the other <user> profile page """

        user = self.query.filter_by(username=username).first()
        if not user:
            return abort(404)

        # <Admin> account protection
        if user.username == "admin" and self.role != RoleType.ADMIN:
            return abort(403)

        return user

    def set_view_count(self, user: User, media_type: MediaType):
        """ Set new view count to the <user> if different from <current_user> """

        if self.role != RoleType.ADMIN and self.id != user.id:
            setattr(user, f"{media_type.value}_views", getattr(user, f"{media_type.value}_views") + 1)

    def add_follow(self, user: User):
        """ Add the followed user to the current user """

        if not self.is_following(user):
            self.followed.append(user)

    def is_following(self, user: User) -> bool:
        """ Check if the current user is not already following the other user """
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def remove_follow(self, user: User):
        """ Remove the followed user from the current user """

        if self.is_following(user):
            self.followed.remove(user)

    def get_follows(self, limit_: int = 8):
        follows = self.followed.all()
        return {"total":  len(follows), "follows": [follow.to_dict() for follow in follows[:limit_]]}

    def get_last_notifications(self, limit_: int = 8) -> List[Dict]:
        """ Get the last <limit_> notifications for the current user """

        # Register read time
        current_user.last_notif_read_time = datetime.utcnow()
        db.session.commit()

        query = (Notifications.query.filter_by(user_id=self.id)
                 .order_by(desc(Notifications.timestamp)).limit(limit_).all())

        return [notification.to_dict() for notification in query]

    def count_notifications(self) -> int:
        """ Count the number of unread notifications for the current user """

        last_notif_time = self.last_notif_read_time or datetime(1900, 1, 1)
        return Notifications.query.filter_by(user_id=self.id).filter(Notifications.timestamp > last_notif_time).count()

    def get_global_media_stats(self) -> Dict:
        """ Get the user's global media stats based on the user's activated MediaType """

        models = ModelsManager.get_lists_models(self.activated_media_type(), ModelTypes.LIST)

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

    def get_list_levels(self) -> List[Dict]:
        """ Get all list levels for a user """

        from backend.api.models.utils_models import Ranks

        models = ModelsManager.get_lists_models(self.activated_media_type(), ModelTypes.LIST)
        all_ranks = {rank.level: {"image": rank.image, "name": rank.name} for rank in Ranks.query.all()}

        level_per_ml = []
        for i, ml in enumerate(models):
            time_in_min = getattr(self, f"time_spent_{ml.GROUP.value}")

            level, level_percent = map(float, divmod(compute_level(time_in_min), 1))
            level_percent *= 100
            rank_info = all_ranks.get(min(level, 149))

            level_per_ml.append({
                "media_type": ml.GROUP.value,
                "level": level,
                "level_percent": level_percent,
                "rank_image": rank_info["image"],
                "rank_name": rank_info["name"],
            })

        return level_per_ml

    def get_last_updates(self, limit_: int) -> List[Dict]:
        """ Get last current user's media updates """
        return [update.to_dict() for update in self.last_updates.filter_by(user_id=self.id).limit(limit_).all()]

    def get_follows_updates(self, limit_: int) -> List[Dict]:
        """ Get the last updates of the current user's followed users """

        follows_updates = (UserLastUpdate.query.filter(UserLastUpdate.user_id.in_([u.id for u in self.followed.all()]))
                           .order_by(desc(UserLastUpdate.date)).limit(limit_))

        return [{"username": update.user.username, **update.to_dict()} for update in follows_updates]

    def generate_jwt_token(self, expires_in: int = 600) -> str:
        """ Generate a <register token> or a <forgot password token> """

        token = jwt.encode(
            payload={"token": self.id, "exp": time() + expires_in},
            key=current_app.config["SECRET_KEY"],
            algorithm="HS256",
        )

        return token

    @classmethod
    def create_search_results(cls, search: str, page: int = 1) -> Dict:
        """ Create the <users> search results for /autocomplete """

        users = db.paginate(
            db.select(cls).filter(
                cls.username.like(f"%{search}%"),
                cls.role != RoleType.ADMIN,
                cls.active == True
            ),
            page=page, per_page=8, error_out=True
        )

        users_list = [{
            "name": user.username,
            "image_cover": user.profile_image,
            "date": user.registered_on.strftime("%d %b %Y"),
            "media_type": "User",
        } for user in users.items]

        return {"items": users_list, "total": users.total, "pages": users.pages}

    @staticmethod
    def verify_access_token(access_token: str) -> User:
        """ Verify the <access token> viability of the user and return the user object or None """

        token = db.session.scalar(select(Token).where(Token.access_token == access_token))

        if token:
            if token.access_expiration > datetime.utcnow():
                token.user.ping()
                db.session.commit()

                return token.user

    @staticmethod
    def verify_admin_token(admin_token: str) -> User | None:
        """ Verify the <admin_token> and return the user object or None """

        if admin_token is None:
            return

        token = Token.query.filter_by(admin_token=admin_token).first()

        if token:
            if token.admin_expiration > datetime.utcnow():
                token.user.ping()
                db.session.commit()

                return token.user

    @staticmethod
    def verify_refresh_token(refresh_token: str, access_token: str) -> Token:
        """ Verify the <refresh_token> of the user """

        token = Token.query.filter_by(refresh_token=refresh_token, access_token=access_token).first()

        if token:
            if token.refresh_expiration > datetime.utcnow():
                return token

            # Try to refresh with expired token: revoke all tokens from user as precaution
            token.user.revoke_all_tokens()

            # Commit changes
            db.session.commit()

    @staticmethod
    def verify_jwt_token(token: str) -> User | None:
        """ Verify the user <jwt token> for the validation of his account or for the forgot password """

        try:
            user_id = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])["token"]
        except:
            return None

        return User.query.filter_by(id=user_id).first()


class UserLastUpdate(db.Model):
    THRESHOLD = 600

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True, nullable=False)

    media_name = db.Column(db.String(50), nullable=False)
    media_type = db.Column(db.Enum(MediaType), index=True, nullable=False)
    date = db.Column(db.DateTime, index=True, nullable=False)

    media_id = db.Column(db.Integer)
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
    """ Notification SQL model """

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    media_type = db.Column(db.String(50))
    media_id = db.Column(db.Integer)
    payload_json = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)

    @classmethod
    def search(cls, user_id: int, media_type: str, media_id: int):
        """ Search if there are existing notifications for a user related to a specific <media_type> and <media_id> """

        data = (
            cls.query.filter_by(user_id=user_id, media_type=media_type, media_id=media_id)
            .order_by(desc(cls.timestamp))
            .first()
        )

        return data

    def to_dict(self):
        """ Serialize the Notifications data """

        data = dict(
            media_id=self.media_id,
            media=self.media_type.replace("list", "") if self.media_type else None,
            timestamp=self.timestamp.replace(tzinfo=timezone.utc).isoformat(),
            payload=json.loads(self.payload_json)
        )

        return data
