"""
All SQL models and helper functions
"""

import datetime as dt
import json
import random
from collections import OrderedDict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Tuple, List, Iterable, Any, Union
import flask_login
import iso639
import pytz
import rq
from flask import abort, url_for
from flask_login import current_user
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from sqlalchemy import func, desc, text, and_, or_, extract, asc
from sqlalchemy.orm import aliased
from MyLists import app, db, login_manager
from MyLists.utils import change_air_format


@login_manager.user_loader
def load_user(user_id: str):
    """ Load the user for login manager """

    return User.query.get(int(user_id))


def class_registry(cls):
    """ Dynamically gets class registry of sqlalchemy from specified model """

    try:
        return cls._sa_registry._class_registry
    except:
        return cls._decl_class_registry


def get_models_group(media_type):
    """ Get SQL model from group """

    _ = []
    registry = class_registry(db.Model)
    for cls in registry.values():
        if isinstance(cls, type) and issubclass(cls, db.Model):
            try:
                if media_type == cls.GROUP:
                    _.append(cls)
            except:
                pass

    return _


def get_models_type(model_type: str) -> List:
    """ Get the model type (List, Media, User) """

    _ = []
    registry = class_registry(db.Model)
    for cls in registry.values():
        if isinstance(cls, type) and issubclass(cls, db.Model):
            try:
                # noinspection PyUnresolvedReferences
                if cls._type == model_type:
                    _.append(cls)
            except:
                pass
    return _


class dotdict(dict):
    """ dictionary attributes accessed with dot.notation """

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


class ListType(Enum):
    """ List Type enumeration """

    SERIES = 'serieslist'
    ANIME = 'animelist'
    MOVIES = 'movieslist'
    BOOKS = 'bookslist'
    GAMES = 'gameslist'


class MediaType(Enum):
    """ Media Type enumeration """

    SERIES = "series"
    ANIME = 'anime'
    MOVIES = 'movies'
    GAMES = 'games'
    BOOKS = 'books'


class Status(Enum):
    """ Status enumeration """

    ALL = 'All'
    WATCHING = 'Watching'
    READING = 'Reading'
    PLAYING = 'Playing'
    COMPLETED = 'Completed'
    MULTIPLAYER = 'Multiplayer'
    ON_HOLD = 'On Hold'
    ENDLESS = 'Endless'
    RANDOM = 'Random'
    DROPPED = 'Dropped'
    PLAN_TO_WATCH = 'Plan to Watch'
    PLAN_TO_READ = 'Plan to Read'
    PLAN_TO_PLAY = 'Plan to Play'
    SEARCH = 'Search'
    FAVORITE = 'Favorite'
    STATS = 'Stats'


class HomePage(Enum):
    """ Homepage enumeration """

    ACCOUNT = "account"
    MYSERIESLIST = "serieslist"
    MYMOVIESLIST = "movieslist"
    MYGAMESLIST = "gameslist"


class RoleType(Enum):
    """ Role Type enumeration """

    ADMIN = "admin"         # Can access to the admin dashboard (/admin)
    MANAGER = "manager"     # Can lock and edit media (/lock_media & /media_details_form)
    USER = "user"           # Standard user


# --- USERS -------------------------------------------------------------------------------------------------------

followers = db.Table('followers',
                     db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
                     db.Column('followed_id', db.Integer, db.ForeignKey('user.id')))


class UserMixin(flask_login.UserMixin):
    """ Override get_id() method of <flask_login> to remove 'text_type' """

    # noinspection PyUnresolvedReferences
    def get_id(self):
        """ Get id """
        try:
            return self.id
        except AttributeError:
            raise NotImplementedError('No `id` attribute - override `get_id`')


class User(UserMixin, db.Model):
    """ User SQL model """

    GROUP = ["User"]

    def __repr__(self):
        return f"{self.username}"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    homepage = db.Column(db.Enum(HomePage), nullable=False, default=HomePage.ACCOUNT)
    image_file = db.Column(db.String(20), nullable=False, default="default.jpg")
    background_image = db.Column(db.String(50), nullable=False, default="default.jpg")
    time_spent_series = db.Column(db.Integer, nullable=False, default=0)
    time_spent_anime = db.Column(db.Integer, nullable=False, default=0)
    time_spent_movies = db.Column(db.Integer, nullable=False, default=0)
    time_spent_games = db.Column(db.Integer, nullable=False, default=0)
    time_spent_books = db.Column(db.Integer, nullable=False, default=0)
    private = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=False)
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
    role = db.Column(db.Enum(RoleType), nullable=False, default=RoleType.USER)
    biography = db.Column(db.Text)
    transition_email = db.Column(db.String(120))
    activated_on = db.Column(db.DateTime)
    last_notif_read_time = db.Column(db.DateTime)

    # --- RELATIONSHIPS ------------------------------------------------------------------------- """

    series_list = db.relationship('SeriesList', backref='user', lazy=True)
    anime_list = db.relationship('AnimeList', backref='user', lazy=True)
    movies_list = db.relationship('MoviesList', backref='user', lazy=True)
    games_list = db.relationship('GamesList', backref='user', lazy=True)
    redis_tasks = db.relationship('RedisTasks', backref='user', lazy='dynamic')
    last_updates = db.relationship('UserLastUpdate', backref='user', order_by="desc(UserLastUpdate.date)",
                                   lazy="dynamic")
    followed = db.relationship('User', secondary=followers, primaryjoin=(followers.c.follower_id == id),
                               secondaryjoin=(followers.c.followed_id == id), order_by="asc(User.username)",
                               backref=db.backref('followers', lazy='dynamic'), lazy='dynamic')

    def check_autorization(self, username: str) -> db.Model:
        """ Check if <user> can see the other user pages """

        # Retrieve user
        user = self.query.filter_by(username=username).first()

        # Check if <user> exist
        if user is None:
            return abort(404)

        # <admin> protection
        if user.username == "admin":
            if self.role != RoleType.ADMIN:
                return abort(403)

        return user

    def add_view_count(self, user: db.Model, media_type: str):
        """ Add view count to user SQL object """

        if self.role != RoleType.ADMIN and self.id != user.id:
            setattr(user, f"{media_type}_views", getattr(user, f"{media_type}_views") + 1)

    def add_follow(self, user: db.Model):
        """ Add follow to user """

        if not self.is_following(user):
            self.followed.append(user)

    def remove_follow(self, user: db.Model):
        """ Remove follow from user """

        if self.is_following(user):
            self.followed.remove(user)

    def is_following(self, user: db.Model):
        """ Check if user is following another user """

        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def count_notifications(self) -> int:
        """ Count number of notifications """

        last_notif_time = self.last_notif_read_time or datetime(1900, 1, 1)

        return Notifications.query.filter_by(user_id=self.id).filter(Notifications.timestamp > last_notif_time).count()

    def get_notifications(self) -> List[db.Model]:
        """ Get notifications fo the user """

        return Notifications.query.filter_by(user_id=self.id).order_by(desc(Notifications.timestamp)).limit(8).all()

    def get_token(self) -> str:
        """ Get token when creating new user """

        s = Serializer(app.config["SECRET_KEY"])

        return s.dumps({"user_id": self.id}).decode("utf-8")

    def get_kn_frame_level(self) -> Tuple[int, int]:
        """ Get frame level and knowledge level """

        # Calculate <total_time>
        total_time = self.time_spent_series + self.time_spent_movies

        if self.add_anime:
            total_time += self.time_spent_anime
        if self.add_books:
            total_time += self.time_spent_books
        if self.add_games:
            total_time += self.time_spent_games

        # Account level
        knowledge_level = int((((400+80*total_time)**(1/2))-20)/40)

        # If frame level > 40, take highest border
        frame_level = (knowledge_level//8)+1
        frame_level = 40 if frame_level > 40 else frame_level

        return knowledge_level, frame_level

    def get_frame_info(self) -> Dict:
        """ Get level, frame_id and frame_level for the account """

        # Calculation
        knowledge_level, frame_level = self.get_kn_frame_level()

        # Get frame from DB
        query_frame = Frames.query.filter_by(level=frame_level).first()

        frame_id = url_for('static', filename='img/icon_frames/new/border_40')
        if query_frame:
            frame_id = url_for('static', filename=f'img/icon_frames/new/{query_frame.image_id}')

        return {"level": knowledge_level, "frame_id": frame_id, "frame_level": frame_level}

    def get_last_updates(self, limit_: int) -> List[Dict]:
        """ Get last media updates for user """

        # Last update query
        last_updates = self.last_updates.filter_by(user_id=self.id).limit(limit_).all()

        # Transform updates to dict
        user_updates = self._shape_to_dict_updates(last_updates)

        return user_updates

    def get_follows_updates(self, limit_: int) -> List[Dict]:
        """ Get followers last updates """

        follows_update = UserLastUpdate.query\
            .filter(UserLastUpdate.user_id.in_([u.id for u in self.followed.all()]))\
            .order_by(desc(UserLastUpdate.date)).limit(limit_)

        follows_update_list = []
        for fol_update in follows_update:
            tmp = {'username': fol_update.user.username}
            tmp.update(self._shape_to_dict_updates([fol_update])[0])
            follows_update_list.append(tmp)

        return follows_update_list

    @classmethod
    def get_autocomplete_list(cls, search: str) -> List[Dict]:
        """ Find user for autocomplete search """

        # Query user with username (search string)
        query = cls.query.filter(cls.username.like("%" + search + "%"), cls.role != RoleType.ADMIN).limit(7).all()

        users_list = []
        for user in query:
            users_list.append({"display_name": user.username,
                               "image_cover": '/static/profile_pics/' + user.image_file,
                               "date": datetime.strftime(user.registered_on, '%d %b %Y'),
                               "category": "Users",
                               "type": "User"})

        return users_list

    @staticmethod
    def _shape_to_dict_updates(last_update: Iterable) -> List[Dict]:
        """ Tranform SQL object of last media updates to List[Dict] """

        update = []
        for element in last_update:
            element_data = {}

            # Page update
            try:
                if element.old_page >= 0 and element.new_page >= 0:
                    element_data["update"] = [f"p. {int(element.old_page)}", f"p. {int(element.new_page)}"]
            except:
                pass

            # Playtime update
            try:
                if element.old_playtime >= 0 and element.new_playtime >= 0:
                    element_data["update"] = [f"{int(element.old_playtime/60)} h", f"{int(element.new_playtime/60)} h"]
            except:
                pass

            # Season or episode update
            if not element.old_status and not element.new_status:
                element_data["update"] = [f"S{element.old_season:02d}.E{element.old_episode:02d}",
                                          f"S{element.new_season:02d}.E{element.new_episode:02d}"]

            # Category update
            elif element.old_status and element.new_status:
                element_data["update"] = [f"{element.old_status.value}", f"{element.new_status.value}"]

            # Newly added media
            elif not element.old_status and element.new_status:
                element_data["update"] = ["{}".format(element.new_status.value)]

            # Update date and add media name
            element_data["date"] = element.date.replace(tzinfo=pytz.UTC).isoformat()
            element_data["media_name"] = element.media_name
            element_data["media_id"] = element.media_id

            if element.media_type == ListType.SERIES:
                element_data["category"] = "Series"
                element_data["icon-color"] = "fas fa-tv text-series"
                element_data["border"] = "#216e7d"
            if element.media_type == ListType.ANIME:
                element_data["category"] = "Anime"
                element_data["icon-color"] = "fas fa-torii-gate text-anime"
                element_data["border"] = "#945141"
            elif element.media_type == ListType.MOVIES:
                element_data["category"] = "Movies"
                element_data["icon-color"] = "fas fa-film text-movies"
                element_data["border"] = "#8c7821"
            elif element.media_type == ListType.BOOKS:
                element_data["category"] = "Books"
                element_data["icon-color"] = "fas fa-book text-books"
                element_data["border"] = "#5d4683"
            elif element.media_type == ListType.GAMES:
                element_data["category"] = "Games"
                element_data["icon-color"] = "fas fa-gamepad text-games"
                element_data["border"] = "#196219"

            update.append(element_data)

        return update

    @staticmethod
    def verify_token(token: Any) -> Union[None, db.Model]:
        """ Verify the token when user validates account """

        s = Serializer(app.config['SECRET_KEY'])
        try:
            user_id = s.loads(token)["user_id"]
        except:
            return None
        user = User.query.get(user_id)
        if not user:
            return None
        else:
            return user


class UserLastUpdate(db.Model):
    """ UserLastUpdate SQL model """

    GROUP = ["User"]

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    media_name = db.Column(db.String(50), nullable=False)
    media_type = db.Column(db.Enum(MediaType), nullable=False)
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

    date = db.Column(db.DateTime, index=True, nullable=False)

    @classmethod
    def set_last_update(cls, media, media_type, old_status=None, new_status=None, old_season=None, new_season=None,
                        old_episode=None, new_episode=None, old_playtime=None, new_playtime=None, old_page=None,
                        new_page=None, user_id=None):
        """ Set last updates depending on *lots* of parameters """

        # Use for list import function (redis process), can't import <current_user> context
        if current_user:
            user_id = current_user.id

        # Check query
        check = cls.query.filter_by(user_id=user_id, media_type=media_type, media_id=media.id)\
            .order_by(desc(cls.date)).first()

        diff = 10000
        if check:
            diff = (datetime.utcnow()-check.date).total_seconds()

        # Add new last updates
        update = cls(user_id=user_id, media_name=media.name, media_id=media.id, media_type=media_type,
                     old_status=old_status, new_status=new_status, old_season=old_season, new_season=new_season,
                     old_episode=old_episode, new_episode=new_episode, old_playtime=old_playtime,
                     new_playtime=new_playtime, old_page=old_page, new_page=new_page, date=datetime.utcnow())

        if diff > 600:
            db.session.add(update)
        else:
            db.session.delete(check)
            db.session.add(update)


class RedisTasks(db.Model):
    """ Redis queue SQL model """

    GROUP = ["User"]

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    name = db.Column(db.String(150), index=True)
    description = db.Column(db.String(150))
    complete = db.Column(db.Boolean, default=False)

    def get_rq_job(self):
        """ Get a redis job """

        try:
            # noinspection PyUnresolvedReferences
            rq_job = rq.job.Job.fetch(self.id, connection=app.r)
        except Exception as e:
            app.logger.info(f"[ERROR] - {e}")
            return None

        return rq_job

    def get_progress(self):
        """ Get job progress """

        job = self.get_rq_job()

        return job.meta.get('progress', 0) if job is not None else 100


class Notifications(db.Model):
    """ Notification SQL model """

    GROUP = ["User"]

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    media_type = db.Column(db.String(50))
    media_id = db.Column(db.Integer)
    payload_json = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)


# --- CLASS MIXIN -------------------------------------------------------------------------------------------------


# noinspection PyUnresolvedReferences
class MediaMixin:
    """ Methods in class only used for <media_details> route """

    def get_similar_genres(self) -> Union[None, List[db.Model]]:
        """ Get similar genre compared to the media in <media_details> """

        # Get <media> class and <media_genre>
        media = self.__class__
        media_genre = eval(f"{self.__class__.__name__}Genre")

        # Get <genres_list> from actual <media> genres
        genres_list = [r.genre for r in self.genres][:3]

        if media.__name__ == "Books":
            genres_list = [r.genre for r in self.genres][:2]

        if genres_list[0] == "Unknown":
            return None

        similar_genres = db.session.query(media, media_genre) \
            .join(media, media.id == media_genre.media_id) \
            .group_by(media_genre.media_id) \
            .filter(media_genre.genre.in_(genres_list), media_genre.media_id != self.id) \
            .having(func.group_concat(media_genre.genre.distinct()).ilike(','.join(genres_list)))\
            .limit(8).all()

        return similar_genres

    def in_follows_lists(self) -> List[db.Model]:
        """ Check if media in list of followed users """

        # Get <media_list> SQL model
        media_list = eval(f"{self.__class__.__name__}List")

        # Create query
        in_follows_lists = db.session.query(User, media_list, followers) \
            .join(User, User.id == followers.c.followed_id) \
            .join(media_list, media_list.user_id == followers.c.followed_id) \
            .filter(followers.c.follower_id == current_user.id, media_list.media_id == self.id).all()

        return in_follows_lists

    def get_genres(self) -> str:
        """ Fetch genres for the media """

        return ", ".join([d.genre for d in self.genres])

    def get_original_name(self) -> Union[None, str]:
        """ Return latin original name or name if original_name == name """

        if self.original_name == self.name:
            return None

        return_latin = latin_alphabet(self.original_name)

        return return_latin

    def get_actors(self) -> List[str]:
        """ Fetch the actors of the media """

        return [d.name for d in self.actors]

    def get_networks(self) -> str:
        """ Fetch the networks of the media """

        return ", ".join([d.network for d in self.networks])


# noinspection PyUnresolvedReferences,PyAttributeOutsideInit
class MediaListMixin:
    """ Create MediaList Mixin for other SQL model """

    def category_changes(self, new_status: str) -> int:
        """ Change the category """

        self.status = new_status
        new_total = self.total

        if new_status == Status.COMPLETED:
            self.current_season = len(self.media.eps_per_season)
            self.last_episode_watched = self.media.eps_per_season[-1].episodes
            self.total = self.media.total_episodes
            new_total = self.media.total_episodes
            self.completion_date = dt.date.today()
        elif new_status == Status.RANDOM or new_status == Status.PLAN_TO_WATCH:
            self.current_season = 1
            self.last_episode_watched = 0
            self.total = 0
            new_total = 0

        #  Reset the rewatched
        self.rewatched = 0

        return new_total

    @classmethod
    def get_media_count_by_status(cls, user_id: int) -> Tuple[Dict, int, bool]:
        """ Get media count by status """

        media_count = db.session.query(cls.status, func.count(cls.status))\
            .filter_by(user_id=user_id).group_by(cls.status).all()

        total = sum(x[1] for x in media_count)
        nodata = False
        if total == 0:
            nodata = True

        data = {}
        x = False
        for status in cls.Status:
            for media in media_count:
                if status.value == media[0].value:
                    data[status.value] = {"count": media[1], "percent": (media[1]/total)*100}
                    x = True
            if x is False:
                data[status.value] = {"count": 0, "percent": 0}
            x = False

        return data, total, nodata

    @classmethod
    def get_media_count_by_score(cls, user_id: int) -> List[Dict]:
        """ Get media count by score """

        media_count = db.session.query(cls.score, func.count(cls.score)).filter_by(user_id=user_id) \
            .group_by(cls.score).order_by(cls.score.asc()).all()

        data = {}
        for media in media_count:
            data[media[0]] = media[1]

        scores = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0,
                  6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
        for sc in scores:
            if sc not in data.keys():
                data[sc] = 0

        data.pop(None, None)
        data.pop(-1, None)
        data = OrderedDict(sorted(data.items()))

        data_list = []
        for key, value in data.items():
            data_list.append(value)

        return data_list

    @classmethod
    def get_media_count_by_feeling(cls, user_id: int) -> List[Dict]:
        """ Get media count by feeling """

        media_count = db.session.query(cls.feeling, func.count(cls.feeling))\
            .filter_by(user_id=user_id) \
            .group_by(cls.feeling).order_by(cls.feeling.asc()).all()

        data = {}
        for media in media_count:
            data[media[0]] = media[1]

        feelings = [5, 4, 3, 2, 1, 0]
        for feel in feelings:
            if feel not in data.keys():
                data[feel] = 0

        data.pop(None, None)
        data.pop(-1, None)

        data = OrderedDict(sorted(data.items()))

        data_list = []
        for key, value in data.items():
            data_list.append(value)

        return data_list

    @classmethod
    def get_only_levels_and_time(cls, user: Any) -> Tuple[int, int, int]:
        """ Get only levels and time """

        # Get user.time_spent_<media> from the <User> table
        time_min = getattr(user, f"time_spent_{cls.__name__.replace('List', '').lower()}")

        media_level_tmp = f"{(((400+80*time_min)**(1/2))-20)/40:.2f}"
        media_level = int(media_level_tmp.split('.')[0])
        media_percentage = int(media_level_tmp.split('.')[1])

        return media_level, media_percentage, time_min

    @classmethod
    def get_media_levels_and_time(cls, user: Any) -> Tuple[Dict, int]:
        """ Get media levels and time """

        # Get user.time_spent_<media> from <USER> table
        media_level, media_percentage, time_min = cls.get_only_levels_and_time(user)

        query_rank = Ranks.query.filter_by(level=media_level, type='media_rank\n').first()
        grade_id = url_for('static', filename='img/levels_ranks/ReachRank49')
        grade_title = "Inheritor"
        if query_rank:
            grade_id = url_for('static', filename='img/levels_ranks/{}'.format(query_rank.image_id))
            grade_title = query_rank.name

        return {"level": media_level, "level_percent": media_percentage, "grade_id": grade_id,
                "grade_title": grade_title}, time_min

    @classmethod
    def get_media_score(cls, user_id: int) -> Dict:
        """ Get media score """

        media_score = db.session.query(func.count(cls.score), func.count(cls.media_id), func.sum(cls.score)) \
            .filter(cls.user_id == user_id).all()

        try:
            percentage = int(float(media_score[0][0])/float(media_score[0][1]) * 100)
        except (ZeroDivisionError, TypeError):
            percentage = '-'

        try:
            mean_score = round(float(media_score[0][2])/float(media_score[0][0]), 2)
        except (ZeroDivisionError, TypeError):
            mean_score = '-'

        return {'scored_media': media_score[0][0], 'total_media': media_score[0][1],
                'percentage': percentage, 'mean_score': mean_score}

    @classmethod
    def get_media_feeling(cls, user_id: int) -> Dict:
        """ Get media feeling """

        media_feeling = db.session.query(func.count(cls.feeling), func.count(cls.media_id), func.sum(cls.feeling)) \
            .filter(cls.user_id == user_id).all()

        try:
            percentage = int(float(media_feeling[0][0])/float(media_feeling[0][1]) * 100)
        except (ZeroDivisionError, TypeError):
            percentage = '-'

        try:
            mean_score = round(float(media_feeling[0][2])/float(media_feeling[0][0]), 2)
        except (ZeroDivisionError, TypeError):
            mean_score = '-'

        return {'scored_media': media_feeling[0][0], 'total_media': media_feeling[0][1],
                'percentage': percentage, 'mean_score': mean_score}

    @classmethod
    def get_media_total_eps(cls, user_id: int) -> int:
        """Get media total episodes """

        query = db.session.query(func.sum(cls.total)).filter(cls.user_id == user_id).all()
        eps_watched = query[0][0]

        if eps_watched is None:
            eps_watched = 0

        return eps_watched

    @classmethod
    def get_favorites(cls, user_id: int) -> List[db.Model]:
        """ Get favorites """

        favorites = cls.query.filter_by(user_id=user_id, favorite=True).all()
        random.shuffle(favorites)

        return favorites


class TVBase(db.Model):
    """ Abstact SQL model for Series and Anime """

    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    original_name = db.Column(db.String(50), nullable=False)
    first_air_date = db.Column(db.String(30))
    last_air_date = db.Column(db.String(30))
    next_episode_to_air = db.Column(db.String(30))
    season_to_air = db.Column(db.Integer)
    episode_to_air = db.Column(db.Integer)
    homepage = db.Column(db.String(200))
    in_production = db.Column(db.Boolean)
    created_by = db.Column(db.String(100))
    duration = db.Column(db.Integer)
    total_seasons = db.Column(db.Integer, nullable=False)
    total_episodes = db.Column(db.Integer)
    origin_country = db.Column(db.String(20))
    status = db.Column(db.String(50))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    synopsis = db.Column(db.Text)
    popularity = db.Column(db.Float)
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)

    def get_eps_per_season(self) -> List:
        """ Get episode per season of the media """

        return [r.episodes for r in self.eps_per_season]

    def get_user_list_info(self) -> Dict:
        """ Get info of the user for this media """

        tmp = self.list_info.filter_by(user_id=current_user.id).first()
        data = {'in_list': False, 'last_episode_watched': 1, 'current_season': 1, 'score': '---', 'feeling': None,
                'favorite': False, 'status': Status.WATCHING.value, 'rewatched': 0, 'comment': None,
                'completion_date': None}
        if tmp:
            try:
                comp_date = tmp.completion_date.strftime("%Y-%m-%d")
            except:
                comp_date = None

            data = {'in_list': True, 'last_episode_watched': tmp.last_episode_watched,
                    'current_season': tmp.current_season, 'score': tmp.score, 'favorite': tmp.favorite,
                    'status': tmp.status.value, 'rewatched': tmp.rewatched, 'comment': tmp.comment,
                    'feeling': tmp.feeling, 'completion_date': comp_date}
        data = dotdict(data)

        return data

    def get_formated_dates(self) -> str:
        """ Format the date of airing """

        first_air_date = change_air_format(self.first_air_date, tv=True)
        last_air_date = change_air_format(self.last_air_date, tv=True)

        return f"{first_air_date} - {last_air_date}"

    def add_media_to_user(self, new_status: Enum) -> int:
        """ Add new media to user """

        new_watched = 1
        new_season = 1
        new_episode = 1
        completion_date = None
        if new_status == Status.COMPLETED:
            new_season = len(self.eps_per_season)
            new_episode = self.eps_per_season[-1].episodes
            new_watched = self.total_episodes
            completion_date = dt.date.today()
        elif new_status == Status.RANDOM or new_status == Status.PLAN_TO_WATCH:
            new_episode = 0
            new_watched = 0

        # Get media_list SQL model
        tv_list = eval(f"{self.__class__.__name__}List")

        # Set new media to user
        user_list = tv_list(user_id=current_user.id, media_id=self.id, current_season=new_season,
                            last_episode_watched=new_episode, status=new_status, total=new_watched,
                            completion_date=completion_date)

        db.session.add(user_list)

        return new_watched

    @classmethod
    def get_persons(cls, job: str, person: str) -> List[db.Model]:
        """ Get person """

        if job == "creator":
            query = cls.query.filter(cls.created_by.ilike("%" + person + "%")).all()
        # job == "actor"
        else:
            # Get actor SQL model
            tv_actors = eval(f"{cls.__name__}Actors")

            data = tv_actors.query.filter(tv_actors.name == person).all()
            query = cls.query.filter(cls.id.in_([p.media_id for p in data])).all()

        return query

    @staticmethod
    def form_only() -> List[str]:
        """ Return the fields to be displayed in form """

        return ["name", "original_name", "first_air_date", "last_air_date", "homepage", "created_by", "duration",
                "origin_country", "status", "synopsis"]


# --- SERIES ------------------------------------------------------------------------------------------------------


class Series(MediaMixin, TVBase):
    GROUP = MediaType.SERIES
    _type = "Media"

    genres = db.relationship('SeriesGenre', backref='series', lazy=True)
    actors = db.relationship('SeriesActors', backref='series', lazy=True)
    eps_per_season = db.relationship('SeriesEpisodesPerSeason', backref='series', lazy=False)
    networks = db.relationship('SeriesNetwork', backref='series', lazy=True)
    list_info = db.relationship('SeriesList', back_populates='media', lazy="dynamic")

    def get_media_cover(self):
        return url_for('static', filename='covers/series_covers/'+self.image_cover)

    @staticmethod
    def media_details_template():
        return 'media_details_series.html'


class SeriesList(MediaListMixin, db.Model):
    GROUP = MediaType.SERIES
    _type = "List"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    total = db.Column(db.Integer)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    media = db.relationship("Series", back_populates='list_info', lazy=False)

    class Status(Enum):
        WATCHING = 'Watching'
        DROPPED = 'Dropped'
        COMPLETED = 'Completed'
        PLAN_TO_WATCH = 'Plan to Watch'
        ON_HOLD = 'On Hold'
        RANDOM = 'Random'

    def update_total_watched(self, new_rewatch):
        self.rewatched = new_rewatch
        new_total = self.media.total_episodes + (new_rewatch * self.media.total_episodes)
        self.total = new_total
        return new_total

    def compute_new_time_spent(self, old_data=0, new_data=0, user_id=None):
        # Use for the list import function (redis and rq backgound process), can't import the <current_user> context
        if current_user:
            user = current_user
        else:
            user = User.query.filter(User.id == user_id).first()

        old_time = user.time_spent_series
        user.time_spent_series = old_time + ((new_data - old_data) * self.media.duration)

    @classmethod
    def get_more_stats(cls, user):
        media_data = cls.query.filter_by(user_id=user.id).all()

        airing_dates = db.session.query(Series, cls, func.count(Series.first_air_date),
                                        ((extract('year', Series.first_air_date)/5)*5).label('decade')) \
            .join(Series, Series.id == cls.media_id) \
            .filter(cls.user_id == user.id, Series.first_air_date != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(text('decade')).order_by(Series.first_air_date.asc()).all()

        top_networks = db.session.query(SeriesNetwork.network, cls, func.count(SeriesNetwork.network).label('count')) \
            .join(SeriesNetwork, SeriesNetwork.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, SeriesNetwork.network != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(SeriesNetwork.network).order_by(text('count desc')).limit(10).all()

        top_genres = db.session.query(SeriesGenre.genre, cls, func.count(SeriesGenre.genre).label('count')) \
            .join(SeriesGenre, SeriesGenre.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, SeriesGenre.genre != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(SeriesGenre.genre).order_by(text('count desc')).limit(10).all()

        top_countries = db.session.query(Series.origin_country, cls, func.count(Series.origin_country).label('count')) \
            .join(Series, Series.id == cls.media_id) \
            .filter(cls.user_id == user.id, Series.origin_country != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(Series.origin_country).order_by(text('count desc')).all()

        media_eps = OrderedDict({'1-25': 0, '26-49': 0, '50-99': 0, '100-149': 0, '150-199': 0, '200+': 0})
        for media in media_data:
            if media.status == Status.PLAN_TO_WATCH:
                continue

            nb_watched = media.total
            if media.rewatched > 0:
                nb_watched = media.media.total_episodes

            if 1 <= nb_watched < 26:
                media_eps['1-25'] += 1
            elif 26 <= nb_watched < 50:
                media_eps['26-49'] += 1
            elif 50 <= nb_watched < 100:
                media_eps['50-99'] += 1
            elif 100 <= nb_watched < 150:
                media_eps['100-149'] += 1
            elif 150 <= nb_watched < 200:
                media_eps['150-199'] += 1
            elif nb_watched >= 200:
                media_eps['200+'] += 1

        return {'eps_time': media_eps, 'periods': airing_dates, 'genres': top_genres, 'networks': top_networks,
                'countries': top_countries}

    @staticmethod
    def default_sorting():
        return 'Title A-Z'

    @staticmethod
    def default_category():
        return Status.WATCHING

    @staticmethod
    def html_template():
        return 'medialist_series.html'

    @staticmethod
    def get_media_color():
        return '#216e7d'


class SeriesGenre(db.Model):
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class SeriesEpisodesPerSeason(db.Model):
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class SeriesNetwork(db.Model):
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class SeriesActors(db.Model):
    GROUP = MediaType.SERIES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    name = db.Column(db.String(150))


# --- ANIME -------------------------------------------------------------------------------------------------------


class Anime(MediaMixin, TVBase):
    GROUP = MediaType.ANIME
    _type = 'Media'

    genres = db.relationship('AnimeGenre', backref='anime', lazy=True)
    actors = db.relationship('AnimeActors', backref='anime', lazy=True)
    eps_per_season = db.relationship('AnimeEpisodesPerSeason', backref='anime', lazy=False)
    networks = db.relationship('AnimeNetwork', backref='anime', lazy=True)
    list_info = db.relationship('AnimeList', back_populates='media', lazy='dynamic')

    def get_media_cover(self):
        return url_for('static', filename='covers/anime_covers/'+self.image_cover)

    @staticmethod
    def media_details_template():
        return 'media_details_anime.html'


class AnimeList(MediaListMixin, db.Model):
    GROUP = MediaType.ANIME
    _type = 'List'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    total = db.Column(db.Integer)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    media = db.relationship("Anime", back_populates='list_info', lazy=False)

    class Status(Enum):
        WATCHING = 'Watching'
        DROPPED = 'Dropped'
        COMPLETED = 'Completed'
        PLAN_TO_WATCH = 'Plan to Watch'
        ON_HOLD = 'On Hold'
        RANDOM = 'Random'

    def update_total_watched(self, new_rewatch):
        self.rewatched = new_rewatch
        new_total = self.media.total_episodes + (new_rewatch * self.media.total_episodes)
        self.total = new_total
        return new_total

    def compute_new_time_spent(self, old_data=0, new_data=0, user_id=None):
        # Use for the list import function (redis and rq backgound process), can't import the <current_user> context
        if current_user:
            user = current_user
        else:
            user = User.query.filter(User.id == user_id).first()

        old_time = user.time_spent_anime
        user.time_spent_anime = old_time + ((new_data - old_data) * self.media.duration)

    @classmethod
    def get_more_stats(cls, user):
        media_data = cls.query.filter_by(user_id=user.id).all()

        airing_dates = db.session.query(Anime, cls, func.count(Anime.first_air_date),
                                        ((extract('year', Anime.first_air_date)/5)*5).label('decade')) \
            .join(Anime, Anime.id == cls.media_id) \
            .filter(cls.user_id == user.id, Anime.first_air_date != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(text('decade')).order_by(Anime.first_air_date.asc()).all()

        top_networks = db.session.query(AnimeNetwork.network, cls, func.count(AnimeNetwork.network).label('count')) \
            .join(AnimeNetwork, AnimeNetwork.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, AnimeNetwork.network != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(AnimeNetwork.network).order_by(text('count desc')).limit(10).all()

        top_genres = db.session.query(AnimeGenre.genre, cls, func.count(AnimeGenre.genre).label('count')) \
            .join(AnimeGenre, AnimeGenre.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, AnimeGenre.genre != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(AnimeGenre.genre).order_by(text('count desc')).limit(10).all()

        media_eps = OrderedDict({'1-25': 0, '26-49': 0, '50-99': 0, '100-149': 0, '150-199': 0, '200+': 0})
        for media in media_data:
            if media.status == Status.PLAN_TO_WATCH:
                continue

            nb_watched = media.total
            if media.rewatched > 0:
                nb_watched = media.media.total_episodes

            if 1 <= nb_watched < 26:
                media_eps['1-25'] += 1
            elif 26 <= nb_watched < 50:
                media_eps['26-49'] += 1
            elif 50 <= nb_watched < 100:
                media_eps['50-99'] += 1
            elif 100 <= nb_watched < 150:
                media_eps['100-149'] += 1
            elif 150 <= nb_watched < 200:
                media_eps['150-199'] += 1
            elif nb_watched >= 200:
                media_eps['200+'] += 1

        return {'eps_time': media_eps, 'periods': airing_dates, 'genres': top_genres, 'networks': top_networks}

    @staticmethod
    def default_sorting():
        return 'Title A-Z'

    @staticmethod
    def default_category():
        return Status.WATCHING

    @staticmethod
    def html_template():
        return 'medialist_anime.html'

    @staticmethod
    def get_media_color():
        return '#945141'


class AnimeGenre(db.Model):
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class AnimeEpisodesPerSeason(db.Model):
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class AnimeNetwork(db.Model):
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class AnimeActors(db.Model):
    GROUP = MediaType.ANIME

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    name = db.Column(db.String(150))


# --- MOVIES ------------------------------------------------------------------------------------------------------


class Movies(MediaMixin, db.Model):
    GROUP = MediaType.MOVIES
    _type = 'Media'

    def __repr__(self):
        return self.name

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    original_name = db.Column(db.String(50), nullable=False)
    director_name = db.Column(db.String(100))
    release_date = db.Column(db.String(30))
    homepage = db.Column(db.String(200))
    released = db.Column(db.String(30))
    duration = db.Column(db.Integer)
    original_language = db.Column(db.String(20))
    synopsis = db.Column(db.Text)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    popularity = db.Column(db.Float)
    budget = db.Column(db.Float)
    revenue = db.Column(db.Float)
    tagline = db.Column(db.String(30))
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship('MoviesGenre', backref='movies', lazy=True)
    actors = db.relationship('MoviesActors', backref='movies', lazy=True)
    list_info = db.relationship('MoviesList', back_populates='media', lazy='dynamic')

    def add_media_to_user(self, new_status):
        new_watched = 1
        if new_status == Status.PLAN_TO_WATCH:
            new_watched = 0

        add_movie = MoviesList(user_id=current_user.id, media_id=self.id, status=new_status, total=new_watched)
        db.session.add(add_movie)

        return new_watched

    def get_media_cover(self):
        return url_for('static', filename='covers/movies_covers/'+self.image_cover)

    def get_user_list_info(self):
        tmp = self.list_info.filter_by(user_id=current_user.id).first()
        data = {'in_list': False, 'score': '---', 'favorite': False, 'status': Status.COMPLETED.value,
                'rewatched': 0, 'comment': None, 'feeling': None, 'completion_date': None}
        if tmp:
            try:
                comp_date = tmp.completion_date.strftime("%Y-%m-%d")
            except:
                comp_date = None

            data = {'in_list': True, 'score': tmp.score, 'favorite': tmp.favorite, 'status': tmp.status.value,
                    'rewatched': tmp.rewatched, 'comment': tmp.comment, 'feeling': tmp.feeling,
                    'completion_date': comp_date}
        data = dotdict(data)
        return data

    def get_formated_dates(self):
        release_date = change_air_format(self.release_date)
        formated_date = f"{release_date}"

        return formated_date

    @classmethod
    def get_persons(cls, job, person):
        if job == 'creator':
            query = cls.query.filter(cls.director_name.ilike('%' + person + '%')).all()
        elif job == 'actor':
            data = MoviesActors.query.filter(MoviesActors.name == person).all()
            query = cls.query.filter(cls.id.in_([p.media_id for p in data])).all()

        return query

    @staticmethod
    def media_details_template():
        return 'media_details_movies.html'

    @staticmethod
    def form_only():
        return ['name', 'original_name', 'director_name', 'release_date', 'homepage', 'original_language',
                'duration', 'synopsis', 'budget', 'revenue', 'tagline']


class MoviesList(MediaListMixin, db.Model):
    GROUP = MediaType.MOVIES
    _type = 'List'

    def __repr__(self):
        return f"{self.user}"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(50))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    media = db.relationship("Movies", back_populates='list_info', lazy=False)

    class Status(Enum):
        COMPLETED = 'Completed'
        PLAN_TO_WATCH = 'Plan to Watch'

    def update_total_watched(self, new_rewatch):
        self.rewatched = new_rewatch
        new_total = 1 + new_rewatch
        self.total = new_total
        return new_total

    def category_changes(self, new_status):
        self.status = new_status

        if new_status == Status.COMPLETED:
            self.completion_date = dt.date.today()
            self.total = 1
            new_total = 1
        else:
            self.total = 0
            new_total = 0

        # Set rewatched value
        self.rewatched = 0

        return new_total

    def compute_new_time_spent(self, old_data=0, new_data=0, user_id=None):
        # Use for the list import function (redis and rq backgound process), can't import the <current_user> context
        if current_user:
            user = current_user
        else:
            user = User.query.filter(User.id == user_id).first()

        old_time = user.time_spent_movies
        user.time_spent_movies = old_time + ((new_data - old_data) * self.media.duration)

    @classmethod
    def get_more_stats(cls, user: db.Model) -> Dict:
        """ Get the stats category for Movies """

        media_data = MoviesList.query.filter_by(user_id=user.id).all()

        release_dates = db.session.query(Movies, cls, func.count(Movies.release_date),
                                         ((extract('year', Movies.release_date)/10)*10).label('decade')) \
            .join(Movies, Movies.id == cls.media_id) \
            .filter(cls.user_id == user.id, Movies.release_date != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(text('decade')).order_by(asc(Movies.release_date)).all()

        top_actors = db.session.query(MoviesActors.name, cls, func.count(MoviesActors.name).label("count")) \
            .join(MoviesActors, MoviesActors.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, MoviesActors.name != 'Unknown', cls.status != Status.PLAN_TO_WATCH) \
            .group_by(MoviesActors.name).order_by(text('count desc')).limit(10).all()

        top_genres = db.session.query(MoviesGenre.genre, cls, func.count(MoviesGenre.genre).label("count")) \
            .join(MoviesGenre, MoviesGenre.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, MoviesGenre.genre != "Unknown", cls.status != Status.PLAN_TO_WATCH) \
            .group_by(MoviesGenre.genre).order_by(text("count desc")).limit(10).all()

        top_directors = db.session.query(Movies.director_name, cls, func.count(Movies.director_name).label("count")) \
            .join(Movies, Movies.id == cls.media_id)\
            .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_WATCH)\
            .group_by(Movies.director_name).order_by(text("count desc")).limit(10).all()

        top_languages = db.session.query(Movies.original_language, cls,
                                         func.count(Movies.original_language).label("count")) \
            .join(Movies, Movies.id == cls.media_id)\
            .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_WATCH) \
            .group_by(Movies.original_language).order_by(text("count desc")).limit(5).all()

        list_languages = []
        for language in top_languages:
            try:
                name_iso = iso639.to_name(language[0])
            except:
                if language[0] == "cn":
                    name_iso = "Chinese"
                else:
                    name_iso = language[0]
            list_languages.append([name_iso, language[1], language[2]])

        runtimes = OrderedDict({'<1h': 0, '1h-1h29': 0, '1h30-1h59': 0, '2h00-2h29': 0, '2h30-2h59': 0, '3h+': 0})
        for media in media_data:
            if media.status == Status.PLAN_TO_WATCH:
                continue

            time_watched = media.media.duration
            if time_watched < 60:
                runtimes['<1h'] += 1
            elif 60 <= time_watched < 90:
                runtimes['1h-1h29'] += 1
            elif 90 <= time_watched < 120:
                runtimes['1h30-1h59'] += 1
            elif 120 <= time_watched < 150:
                runtimes['2h00-2h29'] += 1
            elif 150 <= time_watched < 180:
                runtimes['2h30-2h59'] += 1
            elif time_watched >= 180:
                runtimes['3h+'] += 1

        data = {'runtimes': runtimes, 'periods': release_dates, 'actors': top_actors, 'genres': top_genres,
                'top_languages': list_languages, 'top_directors': top_directors}

        return data

    @staticmethod
    def default_sorting() -> str:
        """ Return default sorting """
        return 'Title A-Z'

    @staticmethod
    def default_category() -> Enum:
        """ Return default category """
        return Status.COMPLETED

    @staticmethod
    def html_template() -> str:
        """ Return html template """
        return 'medialist_movies.html'

    @staticmethod
    def get_media_color() -> str:
        """ Return the media color """
        return "#8c7821"


class MoviesGenre(db.Model):
    GROUP = MediaType.MOVIES

    def __repr__(self):
        return self.genre

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class MoviesActors(db.Model):
    GROUP = MediaType.MOVIES

    def __repr__(self):
        return self.name

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    name = db.Column(db.String(150))


# --- BOOKS -------------------------------------------------------------------------------------------------------


class Books(MediaMixin, db.Model):
    GROUP = MediaType.BOOKS
    _type = 'Media'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    release_date = db.Column(db.String(30), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    language = db.Column(db.String(20), nullable=False)
    publishers = db.Column(db.String(50))
    synopsis = db.Column(db.Text)
    image_cover = db.Column(db.String(100), nullable=False)
    api_id = db.Column(db.Integer)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship('BooksGenre')
    authors = db.relationship('BooksAuthors')
    list_info = db.relationship('BooksList', back_populates='media', lazy='dynamic')

    def add_media_to_user(self, new_status):
        new_watched = 0
        if new_status == Status.COMPLETED:
            new_watched = self.pages
        elif new_status == Status.PLAN_TO_READ:
            new_watched = 0

        user_list = BooksList(user_id=current_user.id, media_id=self.id, actual_page=new_watched, status=new_status,
                              total=new_watched)
        db.session.add(user_list)

        return new_watched

    def get_authors(self):
        return [d.name for d in self.authors]

    def get_original_name(self):
        pass

    def get_media_cover(self):
        return url_for('static', filename='covers/books_covers/'+self.image_cover)

    def get_user_list_info(self):
        tmp = self.list_info.filter_by(user_id=current_user.id).first()
        data = {'in_list': False, 'score': '---', 'favorite': False, 'status': Status.READING.value,
                'rewatched': 0, 'comment': None, 'actual_page': 0, 'feeling': None, 'completion_date': None}
        if tmp:
            try:
                comp_date = tmp.completion_date.strftime("%Y-%m-%d")
            except:
                comp_date = None

            data = {'in_list': True, 'score': tmp.score, 'favorite': tmp.favorite, 'status': tmp.status.value,
                    'rewatched': tmp.rewatched, 'comment': tmp.comment, 'actual_page': tmp.actual_page,
                    'feeling': tmp.feeling, 'completion_date': comp_date}
        data = dotdict(data)
        return data

    @classmethod
    def get_persons(cls, job, person):
        if job == 'creator':
            data = BooksAuthors.query.filter(BooksAuthors.name == person).all()
            query = cls.query.filter(cls.id.in_([p.media_id for p in data])).all()
        elif job == 'actor':
            abort(400)

        return query

    @staticmethod
    def media_details_template():
        return 'media_details_books.html'

    @staticmethod
    def form_only():
        return ['name', 'release_date', 'pages', 'language', 'publishers', 'synopsis']


class BooksList(MediaListMixin, db.Model):
    GROUP = MediaType.BOOKS
    _type = 'List'
    _time_per_page = 1.7

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    actual_page = db.Column(db.Integer)
    total = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    media = db.relationship("Books", back_populates='list_info', lazy=False)

    class Status(Enum):
        READING = 'Reading'
        DROPPED = 'Dropped'
        COMPLETED = 'Completed'
        PLAN_TO_READ = 'Plan to Read'
        ON_HOLD = 'On Hold'

    def update_total_watched(self, new_rewatch):
        self.rewatched = new_rewatch
        new_total = self.media.pages + (new_rewatch * self.media.pages)
        self.total = new_total

        return new_total

    def category_changes(self, new_status):
        #  Set the new status and actual page
        self.status = new_status

        new_total = self.total
        if new_status == Status.COMPLETED:
            self.actual_page = self.media.pages
            self.total = self.media.pages
            new_total = self.media.pages
            self.completion_date = dt.date.today()
        elif new_status == Status.PLAN_TO_READ:
            self.actual_page = 0
            self.total = 0
            new_total = 0

        #  Reset the rewatched
        self.rewatched = 0

        return new_total

    def compute_new_time_spent(self, old_data=0, new_data=0, user_id=None):
        # Use for the list import function (redis and rq backgound process), can't import the <current_user> context
        if current_user:
            user = current_user
        else:
            user = User.query.filter(User.id == user_id).first()

        old_time = user.time_spent_books
        user.time_spent_books = old_time + ((new_data - old_data) * self._time_per_page)

    @classmethod
    def get_more_stats(cls, user):
        media_data = BooksList.query.filter_by(user_id=user.id).all()

        release_dates = db.session.query(Books, cls, func.count(Books.release_date),
                                         ((Books.release_date/10)*10).label('decade')) \
            .join(Books, Books.id == cls.media_id) \
            .filter(cls.user_id == user.id, Books.release_date != 'Unknown', cls.status != Status.PLAN_TO_READ) \
            .group_by(text('decade')).order_by(Books.release_date.asc()).all()

        top_genres = db.session.query(BooksGenre.genre, cls, func.count(BooksGenre.genre).label('count')) \
            .join(BooksGenre, BooksGenre.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, BooksGenre.genre != 'Unknown', cls.status != Status.PLAN_TO_READ) \
            .group_by(BooksGenre.genre).order_by(text('count desc')).limit(10).all()

        top_authors = db.session.query(BooksAuthors.name, cls, func.count(BooksAuthors.name).label('count')) \
            .join(BooksAuthors, BooksAuthors.id == cls.media_id)\
            .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_READ)\
            .group_by(BooksAuthors.name).order_by(text('count desc')).limit(10).all()

        top_languages = db.session.query(Books.language, cls, func.count(Books.language).label('count')) \
            .join(Books, Books.id == cls.media_id)\
            .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_READ) \
            .group_by(Books.language).order_by(text('count desc')).limit(5).all()

        list_languages = []
        for language in top_languages:
            try:
                name_iso = iso639.to_name(language[0])
            except:
                if language[0] == 'cn':
                    name_iso = 'Chinese'
                else:
                    name_iso = language[0]
            list_languages.append([name_iso, language[1], language[2]])

        tot_pages = OrderedDict({'<100': 0, '100-200': 0, '200-300': 0, '300-400': 0, '400-500': 0, '600+': 0})
        for media in media_data:
            if media.status == Status.PLAN_TO_READ:
                continue

            total_pages = media.media.pages
            if total_pages < 100:
                tot_pages['<100'] += 1
            elif 100 <= total_pages < 200:
                tot_pages['100-200'] += 1
            elif 200 <= total_pages < 300:
                tot_pages['200-300'] += 1
            elif 300 <= total_pages < 400:
                tot_pages['300-400'] += 1
            elif 400 <= total_pages < 500:
                tot_pages['400-500'] += 1
            elif total_pages >= 600:
                tot_pages['600+'] += 1

        data = {'pages': tot_pages, 'periods': release_dates, 'genres': top_genres, 'top_languages': list_languages,
                'top_authors': top_authors}

        return data

    @staticmethod
    def default_sorting():
        return 'Title A-Z'

    @staticmethod
    def default_category():
        return Status.READING

    @staticmethod
    def html_template():
        return 'medialist_books.html'

    @staticmethod
    def get_media_color():
        return '#584c6e'


class BooksGenre(db.Model):
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)


class BooksAuthors(db.Model):
    GROUP = MediaType.BOOKS

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    name = db.Column(db.String(150))


# --- GAMES -------------------------------------------------------------------------------------------------------


class Games(MediaMixin, db.Model):
    GROUP = MediaType.GAMES
    _type = 'Media'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    image_cover = db.Column(db.String(100), nullable=False)
    collection_name = db.Column(db.String(50))
    game_engine = db.Column(db.String(50))
    game_modes = db.Column(db.String(200))
    player_perspective = db.Column(db.String(50))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    release_date = db.Column(db.String(30))
    storyline = db.Column(db.Text)
    synopsis = db.Column(db.Text)
    IGDB_url = db.Column(db.String(200))
    hltb_main_time = db.Column(db.String(20))
    hltb_main_and_extra_time = db.Column(db.String(20))
    hltb_total_complete_time = db.Column(db.String(20))
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=1)

    genres = db.relationship('GamesGenre', backref='games', lazy=True)
    platforms = db.relationship('GamesPlatforms', backref='games', lazy=True)
    companies = db.relationship('GamesCompanies', backref='games', lazy=True)
    list_info = db.relationship('GamesList', back_populates='media', lazy='dynamic')

    def add_media_to_user(self, new_status):
        user_list = GamesList(user_id=current_user.id, media_id=self.id, status=new_status,
                              completion=False, playtime=0)
        db.session.add(user_list)
        return 0

    def get_formated_dates(self):
        return change_air_format(self.release_date, games=True)

    def get_user_list_info(self):
        tmp = self.list_info.filter_by(user_id=current_user.id).first()
        data = {'in_list': False, 'score': '---', 'favorite': False, 'status': Status.COMPLETED.value,
                'playtime': 0, 'comment': None, 'feeling': None, 'completion_date': None}
        if tmp:
            try:
                comp_date = tmp.completion_date.strftime("%Y-%m-%d")
            except:
                comp_date = None

            data = {'in_list': True, 'score': tmp.score, 'favorite': tmp.favorite, 'status': tmp.status.value,
                    'playtime': tmp.playtime, 'comment': tmp.comment, 'feeling': tmp.feeling,
                    'completion_date': comp_date}
        data = dotdict(data)
        return data

    def get_media_cover(self):
        return url_for('static', filename='covers/games_covers/'+self.image_cover)

    def get_developers(self):
        data = []
        for company in self.companies:
            if company.developer is True:
                data.append(company.name)
        return data

    def get_platforms(self):
        return ", ".join([r.name for r in self.platforms])

    def get_publishers(self):
        data = []
        for company in self.companies:
            if company.publisher is True:
                data.append(company.name)
        return ", ".join(data)

    def get_original_name(self):
        pass

    @classmethod
    def get_persons(cls, job, person):
        if job == 'creator':
            data = GamesCompanies.query.filter(GamesCompanies.name == person, GamesCompanies.developer == True).all()
            query = cls.query.filter(cls.id.in_([p.media_id for p in data])).all()
        elif job == 'actor':
            abort(400)

        return query

    @classmethod
    def get_next_airing(cls):
        media_list = eval(cls.__name__ + 'List')

        query = db.session.query(cls, media_list) \
            .join(cls, cls.id == media_list.media_id) \
            .filter(cls.release_date > datetime.utcnow(), media_list.user_id == current_user.id,
                    and_(media_list.status != Status.RANDOM, media_list.status != Status.DROPPED)) \
            .order_by(cls.release_date.asc()).all()

        formated_dates = []
        for data in query:
            formated_dates.append(change_air_format(data[0].release_date))

        return list(map(list, zip(query, formated_dates)))

    @staticmethod
    def media_details_template():
        return 'media_details_games.html'

    @staticmethod
    def form_only():
        return ['name', 'collection_name', 'game_engine', 'game_modes', 'player_perspective', 'release_date',
                'synopsis', 'hltb_main_time', 'hltb_main_and_extra_time', 'hltb_total_complete_time']


class GamesList(MediaListMixin, db.Model):
    GROUP = MediaType.GAMES
    _type = 'List'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    completion = db.Column(db.Boolean)
    playtime = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    media = db.relationship("Games", back_populates='list_info', lazy=False)

    class Status(Enum):
        COMPLETED = 'Completed'
        MULTIPLAYER = 'Multiplayer'
        ENDLESS = 'Endless'
        DROPPED = 'Dropped'
        PLAN_TO_PLAY = 'Plan to Play'

    def category_changes(self, new_status):
        self.status = new_status

        if new_status == Status.COMPLETED:
            self.completion_date = dt.date.today()
        elif new_status == Status.PLAN_TO_PLAY:
            self.playtime = 0

        return self.playtime

    def compute_new_time_spent(self, old_data=0, new_data=0, user_id=None):
        # Use for the list import function (redis and rq backgound process), can't import the <current_user> context
        if current_user:
            user = current_user
        else:
            user = User.query.filter(User.id == user_id).first()

        old_time = user.time_spent_games
        user.time_spent_games = old_time + (new_data - old_data)

    @classmethod
    def get_media_total_eps(cls, user_id):
        query = db.session.query(func.count(cls.media_id)).filter(cls.user_id == user_id).all()
        eps_watched = query[0][0]

        if eps_watched is None:
            eps_watched = 0

        return eps_watched

    @classmethod
    def get_more_stats(cls, user):
        media_data = cls.query.filter_by(user_id=user.id).all()

        top_companies = db.session.query(GamesCompanies.name, cls, func.count(GamesCompanies.name).label('count')) \
            .join(GamesCompanies, GamesCompanies.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, GamesCompanies.name != 'Unknown') \
            .group_by(GamesCompanies.name).order_by(text('count desc')).limit(10).all()

        top_platforms = db.session.query(GamesPlatforms.name, cls, func.count(GamesPlatforms.name).label('count')) \
            .join(GamesPlatforms, GamesPlatforms.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, GamesPlatforms.name != 'Unknown') \
            .group_by(GamesPlatforms.name).order_by(text('count desc')).limit(10).all()

        top_genres = db.session.query(GamesGenre.genre, cls, func.count(GamesGenre.genre).label('count')) \
            .join(GamesGenre, GamesGenre.media_id == cls.media_id) \
            .filter(cls.user_id == user.id, GamesGenre.genre != 'Unknown') \
            .group_by(GamesGenre.genre).order_by(text('count desc')).limit(10).all()

        top_perspectives = db.session.query(Games.player_perspective, cls,
                                            func.count(Games.player_perspective).label('count')) \
            .join(Games, Games.id == cls.media_id) \
            .filter(cls.user_id == user.id, Games.player_perspective != 'Unknown') \
            .group_by(Games.player_perspective).order_by(text('count desc')).limit(5).all()

        release_dates = OrderedDict({"'70": 0, "'80": 0, "'90": 0, "'00": 0, "'10": 0, "'20+": 0})
        playtimes = OrderedDict({'<5h': 0, '5-10h': 0, '10-20h': 0, '20-40h': 0, '40-70h': 0, '70-100h': 0, '100h+': 0})
        for media in media_data:
            release_date = change_air_format(media.media.release_date, games=True)
            if release_date == 'Unknown':
                continue
            else:
                release_date = int(release_date.split(' ')[-1])

            if media.playtime < 300:
                playtimes['<5h'] += 1
            elif 300 <= media.playtime < 600:
                playtimes['5-10h'] += 1
            elif 600 <= media.playtime < 1200:
                playtimes['10-20h'] += 1
            elif 1200 <= media.playtime < 2400:
                playtimes['20-40h'] += 1
            elif 2400 <= media.playtime < 4200:
                playtimes['40-70h'] += 1
            elif 4200 <= media.playtime < 6000:
                playtimes['70-100h'] += 1
            elif media.playtime >= 6000:
                playtimes['100h+'] += 1

            if 1970 <= release_date < 1980:
                release_dates["'70"] += 1
            elif 1980 <= release_date < 1990:
                release_dates["'80"] += 1
            elif 1990 <= release_date < 2000:
                release_dates["'90"] += 1
            elif 2000 <= release_date < 2010:
                release_dates["'00"] += 1
            elif 2010 <= release_date < 2020:
                release_dates["'10"] += 1
            elif 2020 <= release_date:
                release_dates["'20+"] += 1

        data = {'playtimes': playtimes, 'periods': release_dates, 'genres': top_genres, 'platforms': top_platforms,
                'companies': top_companies, 'top_perspectives': top_perspectives}

        return data

    @staticmethod
    def default_sorting():
        return 'Playtime +'

    @staticmethod
    def default_category():
        return Status.COMPLETED

    @staticmethod
    def html_template():
        return 'medialist_games.html'

    @staticmethod
    def get_media_color():
        return '#196219'


class GamesGenre(db.Model):
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)


class GamesPlatforms(db.Model):
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(150))


class GamesCompanies(db.Model):
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(100))
    publisher = db.Column(db.Boolean)
    developer = db.Column(db.Boolean)


""" --- BADGES & RANKS -------------------------------------------------------------------------------------- """


class Badges(db.Model):
    """ Badges SQL model """

    GROUP = ['Other']

    id = db.Column(db.Integer, primary_key=True)
    threshold = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    genres_id = db.Column(db.String(100))

    @classmethod
    def add_badges_to_db(cls):
        """ Add the badges to the db using the CSV in static/csv_data folder """

        list_all_badges = []
        path = Path(app.root_path, 'static/csv_data/badges.csv')
        with open(path) as fp:
            for line in fp:
                list_all_badges.append(line.split(";"))

        for i in range(1, len(list_all_badges)):
            try:
                genre_id = str(list_all_badges[i][4])
            except:
                genre_id = None

            badge = cls(threshold=int(list_all_badges[i][0]),
                        image_id=list_all_badges[i][1],
                        title=list_all_badges[i][2],
                        type=list_all_badges[i][3],
                        genres_id=genre_id)
            # Add data
            db.session.add(badge)

    @classmethod
    def refresh_db_badges(cls):
        """ Refresh badges if new data in CSV """

        list_all_badges = []
        path = Path(app.root_path, 'static/csv_data/badges.csv')
        with open(path) as fp:
            for line in fp:
                list_all_badges.append(line.split(";"))

        # Query badges
        badges = cls.query.order_by(cls.id).all()

        for i in range(1, len(list_all_badges)):
            try:
                genre_id = str(list_all_badges[i][4])
            except:
                genre_id = None

            badges[i - 1].threshold = int(list_all_badges[i][0])
            badges[i - 1].image_id = list_all_badges[i][1]
            badges[i - 1].title = list_all_badges[i][2]
            badges[i - 1].type = list_all_badges[i][3]
            badges[i - 1].genres_id = genre_id


class Ranks(db.Model):
    """ Ranks SQL model """

    GROUP = ['Other']

    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False)

    @classmethod
    def add_ranks_to_db(cls):
        """ Add ranks for the first time using CSV """

        list_all_ranks = []
        path = Path(app.root_path, 'static/csv_data/ranks.csv')
        with open(path) as fp:
            for line in fp:
                list_all_ranks.append(line.split(";"))

        for i in range(1, len(list_all_ranks)):
            rank = cls(level=int(list_all_ranks[i][0]),
                       image_id=list_all_ranks[i][1],
                       name=list_all_ranks[i][2],
                       type=list_all_ranks[i][3])
            db.session.add(rank)

    @classmethod
    def refresh_db_ranks(cls):
        """ Refresh newly added ranks in CSV to the db """

        list_all_ranks = []
        path = Path(app.root_path, 'static/csv_data/ranks.csv')
        with open(path) as fp:
            for line in fp:
                list_all_ranks.append(line.split(";"))

        ranks = cls.query.order_by(cls.id).all()
        for i in range(1, len(list_all_ranks)):
            ranks[i - 1].level = int(list_all_ranks[i][0])
            ranks[i - 1].image_id = list_all_ranks[i][1]
            ranks[i - 1].name = list_all_ranks[i][2]
            ranks[i - 1].type = list_all_ranks[i][3]

    @classmethod
    def get_levels(cls) -> Iterable:
        """ Query all levels in the db """

        return cls.query.filter_by(type='media_rank\n').order_by(asc(cls.level)).all()


class Frames(db.Model):
    """ Frames SQL model """

    GROUP = ['Other']

    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)

    @classmethod
    def add_frames_to_db(cls):
        """ Add the frames to the db using the CSV in static/csv_data folder """

        list_all_frames = []
        path = Path(app.root_path, 'static/csv_data/icon_frames.csv')
        with open(path) as fp:
            for line in fp:
                list_all_frames.append(line.split(";"))

        for i in range(1, len(list_all_frames)):
            frame = cls(level=int(list_all_frames[i][0]), image_id=list_all_frames[i][1])

            db.session.add(frame)

    @classmethod
    def refresh_db_frames(cls):
        """ Refresh newly added frames in CSV to db """

        list_all_frames = []
        path = Path(app.root_path, 'static/csv_data/icon_frames.csv')
        with open(path) as fp:
            for line in fp:
                list_all_frames.append(line.split(";"))

        # Query frames
        frames = cls.query.order_by(cls.id).all()

        for i in range(1, len(list_all_frames)):
            frames[i-1].level = int(list_all_frames[i][0])
            frames[i-1].image_id = list_all_frames[i][1]


""" --- GLOBAL STATS ---------------------------------------------------------------------------------------- """


class MyListsStats(db.Model):
    """ Model to get all global stats for MyLists """

    GROUP = ['Stats']

    id = db.Column(db.Integer, primary_key=True)
    nb_users = db.Column(db.Integer)
    nb_media = db.Column(db.Text)
    total_time = db.Column(db.Text)

    top_media = db.Column(db.Text)
    top_genres = db.Column(db.Text)
    top_actors = db.Column(db.Text)
    top_authors = db.Column(db.Text)
    top_directors = db.Column(db.Text)
    top_developers = db.Column(db.Text)
    top_dropped = db.Column(db.Text)

    total_episodes = db.Column(db.Text)
    total_seasons = db.Column(db.Text)
    total_movies = db.Column(db.Text)
    total_pages = db.Column(db.Integer, default=0)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def get_all_stats(cls) -> Dict:
        """ Get the stats from the SQL model """

        # Query stats
        all_stats = cls.query.order_by(desc(cls.timestamp)).first()

        # Dict with all data
        data = {'nb_users': all_stats.nb_users,
                'nb_media': json.loads(all_stats.nb_media),
                'total_time': json.loads(all_stats.total_time),
                'top_media': json.loads(all_stats.top_media),
                'top_genres': json.loads(all_stats.top_genres),
                'top_actors': json.loads(all_stats.top_actors),
                'top_authors': json.loads(all_stats.top_authors),
                'top_directors': json.loads(all_stats.top_directors),
                'top_dropped': json.loads(all_stats.top_dropped),
                'total_pages': all_stats.total_pages,
                'total_episodes': json.loads(all_stats.total_episodes),
                'total_seasons': json.loads(all_stats.total_seasons),
                'total_movies': json.loads(all_stats.total_movies),
                'top_developers': json.loads(all_stats.top_developers)}

        return data


""" --- OTHER ----------------------------------------------------------------------------------------------- """


def get_media_query(user: db.Model, media_type: Enum, category: str, genre: str, sorting: str, page: int,
                    search_q: str, lang: str) -> Tuple[str, Dict]:
    """ Create the query for the <medialist> route depending on the media """

    # Get SQL models
    media = eval(media_type.value.capitalize())
    media_list = eval(media_type.value.capitalize()+"List")
    media_genre = eval(media_type.value.capitalize()+"Genre")

    if media_type in (MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES):
        media_more = eval(media_type.value.capitalize()+"Actors")
    elif media_type == MediaType.GAMES:
        media_more = eval(media_type.value.capitalize()+"Companies")
    else:
        media_more = eval(media_type.value.capitalize()+"Authors")

    if media_type in (MediaType.SERIES, MediaType.ANIME):
        add_sort = {'Release date +': media.first_air_date.desc(),
                    'Release date -': media.first_air_date.asc(),
                    'Rewatch': media_list.rewatched.desc(),
                    'Score TMDB +': media.vote_average.desc(),
                    'Score TMDB -': media.vote_average.asc()}
    elif media_type == MediaType.MOVIES:
        add_sort = {'Release date +': media.release_date.desc(),
                    'Release date -': media.release_date.asc(),
                    'Rewatch': media_list.rewatched.desc(),
                    'Score TMDB +': media.vote_average.desc(),
                    'Score TMDB -': media.vote_average.asc()}
    elif media_type == MediaType.GAMES:
        add_sort = {'Release date +': media.release_date.desc(),
                    'Release date -': media.release_date.asc(),
                    'Playtime +': media_list.playtime.desc(),
                    'Playtime -': media_list.playtime.asc(),
                    'Score IGDB +': media.vote_average.desc(),
                    'Score IGDB -': media.vote_average.asc()}
    else:
        add_sort = {'Re-read': media_list.rewatched.desc(),
                    'Published date +': media.release_date.desc(),
                    'Published date -': media.release_date.asc()}

    # Create a sorting dict
    sorting_dict = {'Title A-Z': media.name.asc(),
                    'Title Z-A': media.name.desc(),
                    'Comments': media_list.comment.desc()}
    sorting_dict.update(add_sort)

    add_more = {'Score +': media_list.score.desc(),
                'Score -': media_list.score.asc()}
    if user.add_feeling:
        add_more = {'Score +': media_list.feeling.desc(),
                    'Score -': media_list.feeling.asc()}
    sorting_dict.update(add_more)

    # Check sorting
    try:
        sorting = sorting_dict[sorting]
    except KeyError:
        return abort(400)

    # Check category
    try:
        category = Status(category)
        cat_value = category.value
    except ValueError:
        return abort(400)

    # Check genre
    genre_filter = text("")
    if genre != "All":
        genre_filter = media_genre.genre.like(genre)

    # Check lang
    lang_filter = text("")
    if lang:
        lang_filter = media.original_language.like(lang)

    # Check <filter_val> value - NOT USED FOR NOW
    filter_val = False
    com_ids = [-1]
    if filter_val:
        v1, v2 = aliased(media_list), aliased(media_list)
        get_common = db.session.query(v1, v2) \
            .join(v2, and_(v2.user_id == user.id, v2.media_id == v1.media_id)) \
            .filter(v1.user_id == current_user.id).all()
        com_ids = [r[0].media_id for r in get_common]

    # Create query
    query = db.session.query(media, media_list, media_genre, media_more) \
        .outerjoin(media, media.id == media_list.media_id) \
        .outerjoin(media_genre, media_genre.media_id == media_list.media_id) \
        .outerjoin(media_more, media_more.media_id == media_list.media_id) \
        .filter(media_list.user_id == user.id, media_list.media_id.notin_(com_ids), genre_filter, lang_filter)

    if category != Status.FAVORITE and category != Status.SEARCH and category != Status.ALL:
        query = query.filter(media_list.status == category)
    elif category == Status.FAVORITE:
        query = query.filter(media_list.favorite)
    elif category == Status.SEARCH:
        if media_type in (MediaType.SERIES, MediaType.ANIME):
            query = query.filter(or_(media.name.ilike("%" + search_q + "%"),
                                     media_more.name.ilike("%" + search_q + "%"),
                                     media.original_name.ilike("%" + search_q + "%")))
        elif media_type == MediaType.MOVIES:
            query = query.filter(or_(media.name.ilike("%" + search_q + "%"),
                                     media_more.name.ilike("%" + search_q + "%"),
                                     media.director_name.ilike("%" + search_q + "%"),
                                     media.original_name.ilike("%" + search_q + "%")))
        elif media_type == MediaType.GAMES:
            query = query.filter(or_(media.name.ilike("%" + search_q + "%"),
                                     media_more.name.ilike("%" + search_q + "%")))
        elif media_type == MediaType.BOOKS:
            query = query.filter(or_(media.name.ilike("%" + search_q + "%"),
                                     media_more.name.ilike("%" + search_q + "%")))

    # Run pagniate query
    paginate_result = query.group_by(media.id).order_by(sorting, asc(media.name))\
        .paginate(int(page), 36, error_out=True)

    # Get results
    results = [item[1] for item in paginate_result.items]

    # Get <common_media> and <common_elements> between users
    common_ids, common_elements = get_media_count(user.id, media_type)

    data = {'actual_page': paginate_result.page,
            'total_pages': paginate_result.pages,
            'total_media': paginate_result.total,
            'common_elements': common_elements,
            'common_ids': common_ids,
            'items_list': results}

    return cat_value, data


def get_media_count(user_id: int, media_type: Enum) -> Tuple[List, List]:
    """ Count number of media in a list for a user """

    # If <user> IS <current_user>: common media not calculated
    if user_id == current_user.id:
        common_ids, common_elements = [], []
        return common_ids, common_elements

    # Get Media list SQL model
    media_list = eval(media_type.value.capitalize()+"List")

    # Create aliases
    v1, v2 = aliased(media_list), aliased(media_list)

    # Count total
    count_total = media_list.query.filter_by(user_id=user_id).count()

    # Count against other user
    count_versus = db.session.query(v1, v2) \
        .join(v2, and_(v2.user_id == user_id, v2.media_id == v1.media_id)) \
        .filter(v1.user_id == current_user.id).all()

    # Get common ids
    common_ids = [r[0].media_id for r in count_versus]

    # Create percentage
    try:
        percentage = int((len(common_ids) / count_total) * 100)
    except ZeroDivisionError:
        percentage = 0

    # Create common elements list
    common_elements = [len(common_ids), count_total, percentage]

    return common_ids, common_elements


def get_next_airing(list_type):
    """ Fetch the next airing media for the user """

    media = eval(list_type.value.capitalize().replace('list', ''))
    media_list = eval(list_type.value.capitalize().replace('l', 'L'))

    if list_type == ListType.SERIES or list_type == ListType.ANIME:
        media_data = media.next_episode_to_air
    else:
        media_data = media.release_date

    if list_type == ListType.GAMES:
        tmp = db.session.query(media, media_list) \
            .join(media, media.id == media_list.media_id) \
            .filter(media_list.user_id == current_user.id, media_list.status != Status.DROPPED) \
            .order_by(media_data.asc()).all()

        query = []
        for game in tmp:
            try:
                if datetime.utcfromtimestamp(int(game[0].release_date)) > datetime.now():
                    query.append(game[0])
            except:
                if game[0].release_date == 'Unknown':
                    query.append(game[0])

    else:
        query = db.session.query(media, media_list) \
            .join(media, media.id == media_list.media_id) \
            .filter(media_data > datetime.utcnow(), media_list.user_id == current_user.id,
                    and_(media_list.status != Status.RANDOM, media_list.status != Status.DROPPED)) \
            .order_by(media_data.asc()).all()

    return query
