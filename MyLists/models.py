import rq
import iso639
from enum import Enum
from datetime import datetime
from flask import abort, flash
from sqlalchemy.orm import aliased
from collections import OrderedDict
from MyLists import app, db, login_manager
from flask_login import UserMixin, current_user

from sqlalchemy import func, desc, text, and_, or_
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class ListType(Enum):
    SERIES = 'serieslist'
    ANIME = 'animelist'
    MOVIES = 'movieslist'
    GAMES = 'gameslist'


class Status(Enum):
    ALL = 'All'
    WATCHING = 'Watching'
    PLAYING = 'Playing'
    COMPLETED = 'Completed'
    MULTIPLAYER = 'Multiplayer'
    ON_HOLD = 'On Hold'
    ENDLESS = 'Endless'
    RANDOM = 'Random'
    DROPPED = 'Dropped'
    PLAN_TO_WATCH = 'Plan to Watch'
    SEARCH = 'Search'
    FAVORITE = 'Favorite'
    STATS = 'Stats'


class MediaType(Enum):
    SERIES = "Series"
    ANIME = "Anime"
    MOVIES = 'Movies'
    GAMES = 'Games'


class HomePage(Enum):
    ACCOUNT = "account"
    MYSERIESLIST = "serieslist"
    MYANIMELIST = "animelist"
    MYMOVIESLIST = "movieslist"
    MYGAMESLIST = "gameslist"


class RoleType(Enum):
    # Can access to the admin dashboard (/admin)
    ADMIN = "admin"
    # Can lock and edit media (/lock_media & /media_sheet_form)
    MANAGER = "manager"
    # Standard user
    USER = "user"


followers = db.Table('followers',
                     db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
                     db.Column('followed_id', db.Integer, db.ForeignKey('user.id')))


class User(UserMixin, db.Model):
    def __repr__(self):
        return f'<User {self.id}-{self.username}>'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    homepage = db.Column(db.Enum(HomePage), nullable=False, default=HomePage.ACCOUNT)
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    background_image = db.Column(db.String(50), nullable=False, default='default.jpg')
    time_spent_series = db.Column(db.Integer, nullable=False, default=0)
    time_spent_anime = db.Column(db.Integer, nullable=False, default=0)
    time_spent_movies = db.Column(db.Integer, nullable=False, default=0)
    time_spent_games = db.Column(db.Integer, nullable=False, default=0)
    private = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=False)
    profile_views = db.Column(db.Integer, nullable=False, default=0)
    series_views = db.Column(db.Integer, nullable=False, default=0)
    anime_views = db.Column(db.Integer, nullable=False, default=0)
    movies_views = db.Column(db.Integer, nullable=False, default=0)
    games_views = db.Column(db.Integer, nullable=False, default=0)
    add_games = db.Column(db.Boolean, nullable=False, default=False)
    biography = db.Column(db.Text)
    transition_email = db.Column(db.String(120))
    activated_on = db.Column(db.DateTime)
    last_notif_read_time = db.Column(db.DateTime)
    role = db.Column(db.Enum(RoleType), nullable=False, default=RoleType.USER)

    series_list = db.relationship('SeriesList', backref='user', lazy=True)
    anime_list = db.relationship('AnimeList', backref='user', lazy=True)
    movies_list = db.relationship('MoviesList', backref='user', lazy=True)
    games_list = db.relationship('GamesList', backref='user', lazy=True)
    redis_tasks = db.relationship('RedisTasks', backref='user', lazy='dynamic')
    followed = db.relationship('User',
                               secondary=followers,
                               primaryjoin=(followers.c.follower_id == id),
                               secondaryjoin=(followers.c.followed_id == id),
                               backref=db.backref('followers', lazy='dynamic'), lazy='dynamic')

    def check_autorization(self, user_name):
        # retrieve the user
        user = self.query.filter_by(username=user_name).first()

        # No account with this username & Protection of the admin account
        if user is None or (self.role != RoleType.ADMIN and user.role == RoleType.ADMIN):
            abort(404)

        # Check if the current account can see the target's account
        if self.id == user.id or self.role == RoleType.ADMIN:
            pass
        elif user.private and not self.is_following(user):
            abort(404)

        return user

    def add_view_count(self, user, list_type):
        if self.role != RoleType.ADMIN and user.id != self.id:
            if list_type == ListType.SERIES:
                user.series_views += 1
            elif list_type == ListType.ANIME:
                user.anime_views += 1
            elif list_type == ListType.MOVIES:
                user.movies_views += 1
            elif list_type == ListType.GAMES:
                user.games_views += 1
            db.session.commit()

    def add_follow(self, user):
        if not self.is_following(user):
            self.followed.append(user)

    def remove_follow(self, user):
        if self.is_following(user):
            self.followed.remove(user)

    def is_following(self, user):
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def count_notifications(self):
        last_notif_time = self.last_notif_read_time or datetime(1900, 1, 1)
        return Notifications.query.filter_by(user_id=self.id) \
            .filter(Notifications.timestamp > last_notif_time).count()

    def get_notifications(self):
        return Notifications.query.filter_by(user_id=self.id).order_by(desc(Notifications.timestamp)).limit(8).all()

    def launch_task(self, name, description, *args, **kwargs):
        rq_job = app.q.enqueue('MyLists.main.rq_tasks.' + name, self.id, *args, **kwargs)
        task = RedisTasks(id=rq_job.get_id(), name=name, description=description, user=self)
        db.session.add(task)
        return task

    def get_task_in_progress(self, name):
        return RedisTasks.query.filter_by(name=name, user=self, complete=False).first()

    def get_token(self):
        s = Serializer(app.config['SECRET_KEY'])
        return s.dumps({'user_id': self.id}).decode('utf-8')

    @staticmethod
    def verify_token(token):
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
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_name = db.Column(db.String(50), nullable=False)
    media_type = db.Column(db.Enum(ListType), nullable=False)
    media_id = db.Column(db.Integer)
    old_status = db.Column(db.Enum(Status))
    new_status = db.Column(db.Enum(Status))
    old_season = db.Column(db.Integer)
    new_season = db.Column(db.Integer)
    old_episode = db.Column(db.Integer)
    new_episode = db.Column(db.Integer)
    date = db.Column(db.DateTime, nullable=False)

    user = db.relationship('User', backref='UserLastUpdate', lazy=False)


class RedisTasks(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String(150), index=True)
    description = db.Column(db.String(150))
    complete = db.Column(db.Boolean, default=False)

    def get_rq_job(self):
        try:
            rq_job = rq.job.Job.fetch(self.id, connection=app.r)
        except Exception as e:
            app.logger.info(f'[ERROR] - {e}')
            return None
        return rq_job

    def get_progress(self):
        job = self.get_rq_job()
        return job.meta.get('progress', 0) if job is not None else 100


class Notifications(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    media_type = db.Column(db.String(50))
    media_id = db.Column(db.Integer)
    payload_json = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)


class MediaMixin(object):
    def get_same_genres(self, genres_list):
        media = eval(self.__class__.__name__)
        media_genre = eval(self.__class__.__name__+'Genre')

        same_genres = db.session.query(media, media_genre) \
            .join(media, media.id == media_genre.media_id) \
            .filter(media_genre.genre.in_(genres_list), media_genre.media_id != self.id) \
            .group_by(media_genre.media_id) \
            .having(func.group_concat(media_genre.genre.distinct()) == ','.join(genres_list)).limit(8).all()
        return same_genres

    def in_follows_lists(self):
        media_list = eval(self.__class__.__name__+'List')

        in_follows_lists = db.session.query(User, media_list, followers) \
            .join(User, User.id == followers.c.followed_id) \
            .join(media_list, media_list.user_id == followers.c.followed_id) \
            .filter(followers.c.follower_id == current_user.id, media_list.media_id == self.id).all()
        return in_follows_lists

    def in_user_list(self):
        in_user_list = self.list_info.filter_by(user_id=current_user.id).first()
        return in_user_list


# --- SERIES ------------------------------------------------------------------------------------------------------


class Series(MediaMixin, db.Model):
    def __repr__(self):
        return f'<Series {self.id}-{self.name}>'

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
    themoviedb_id = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship('SeriesGenre', backref='series', lazy=True)
    actors = db.relationship('SeriesActors', backref='series', lazy=True)
    eps_per_season = db.relationship('SeriesEpisodesPerSeason', backref='series', lazy=False)
    networks = db.relationship('SeriesNetwork', backref='series', lazy=True)
    list_info = db.relationship('SeriesList', backref='series', lazy="dynamic")


class SeriesList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    favorite = db.Column(db.Boolean)
    score = db.Column(db.Float)
    eps_watched = db.Column(db.Integer)
    comment = db.Column(db.Text)


class SeriesGenre(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class SeriesEpisodesPerSeason(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class SeriesNetwork(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class SeriesActors(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('series.id'), nullable=False)
    name = db.Column(db.String(150))


# --- ANIME -------------------------------------------------------------------------------------------------------


class Anime(MediaMixin, db.Model):
    def __repr__(self):
        return f'<Anime {self.id}-{self.name}>'

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
    themoviedb_id = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship('AnimeGenre', backref='anime', lazy=True)
    actors = db.relationship('AnimeActors', backref='anime', lazy=True)
    eps_per_season = db.relationship('AnimeEpisodesPerSeason', backref='anime', lazy=False)
    list_info = db.relationship('AnimeList', backref='anime', lazy='dynamic')
    networks = db.relationship('AnimeNetwork', backref='anime', lazy=True)


class AnimeList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    current_season = db.Column(db.Integer, nullable=False)
    last_episode_watched = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    favorite = db.Column(db.Boolean)
    score = db.Column(db.Float)
    eps_watched = db.Column(db.Integer)
    comment = db.Column(db.Text)


class AnimeGenre(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class AnimeEpisodesPerSeason(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    episodes = db.Column(db.Integer, nullable=False)


class AnimeNetwork(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    network = db.Column(db.String(150), nullable=False)


class AnimeActors(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    name = db.Column(db.String(150))


# --- MOVIES ------------------------------------------------------------------------------------------------------


class Movies(MediaMixin, db.Model):
    def __repr__(self):
        return f'<Movies {self.id}-{self.name}>'

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
    themoviedb_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=0)

    genres = db.relationship('MoviesGenre', backref='movies', lazy=True)
    actors = db.relationship('MoviesActors', backref='movies', lazy=True)
    list_info = db.relationship('MoviesList', backref='movies', lazy='dynamic')


class MoviesList(MediaMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    rewatched = db.Column(db.Integer, nullable=False, default=0)
    eps_watched = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    score = db.Column(db.Float)
    comment = db.Column(db.Text)


class MoviesGenre(MediaMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    genre_id = db.Column(db.Integer, nullable=False)


class MoviesActors(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    name = db.Column(db.String(150))


# --- GAMES -------------------------------------------------------------------------------------------------------


class Games(MediaMixin, db.Model):
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
    summary = db.Column(db.Text)
    IGDB_url = db.Column(db.String(200))
    hltb_main_time = db.Column(db.String(20))
    hltb_main_and_extra_time = db.Column(db.String(20))
    hltb_total_complete_time = db.Column(db.String(20))
    igdb_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=1)

    genres = db.relationship('GamesGenre', backref='games', lazy=True)
    platforms = db.relationship('GamesPlatforms', backref='games', lazy=True)
    companies = db.relationship('GamesCompanies', backref='games', lazy=True)
    list_info = db.relationship('GamesList', backref='games', lazy='dynamic')


class GamesList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    completion = db.Column(db.Boolean)
    playtime = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    score = db.Column(db.Float)
    comment = db.Column(db.Text)


class GamesGenre(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=False)


class GamesPlatforms(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(150))


class GamesCompanies(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(100))
    publisher = db.Column(db.Boolean)
    developer = db.Column(db.Boolean)


# --- BADGES & RANKS ----------------------------------------------------------------------------------------------


class Badges(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    threshold = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    genres_id = db.Column(db.String(100))


class Ranks(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False)


class Frames(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)


# --- STATS and TRENDS --------------------------------------------------------------------------------------------


class MyListsStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nb_users = db.Column(db.Integer)
    nb_media = db.Column(db.Text)
    total_time = db.Column(db.Text)
    top_media = db.Column(db.Text)
    top_genres = db.Column(db.Text)
    top_actors = db.Column(db.Text)
    top_directors = db.Column(db.Text)
    top_dropped = db.Column(db.Text)
    total_episodes = db.Column(db.Text)
    total_seasons = db.Column(db.Text)
    total_movies = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# --- OTHERS ------------------------------------------------------------------------------------------------------


class GlobalStats:
    def __init__(self):
        self.truncated_list_type = [ListType.SERIES, ListType.ANIME]
        self.no_games_list_type = [ListType.SERIES, ListType.ANIME, ListType.MOVIES]
        self.media = None
        self.media_genre = None
        self.media_actors = None
        self.media_eps = None
        self.media_list = None

    @classmethod
    def get_total_time_spent(cls):
        times_spent = db.session.query(func.sum(User.time_spent_series), func.sum(User.time_spent_anime),
                                       func.sum(User.time_spent_movies), func.sum(User.time_spent_games)) \
            .filter(User.role != RoleType.ADMIN, User.active == True).all()

        return times_spent

    def get_query_data(self, list_type):
        self.media = eval(list_type.value.capitalize().replace('list', ''))
        self.media_list = eval(list_type.value.capitalize().replace('l', 'L'))
        self.media_genre = eval(list_type.value.capitalize().replace('list', 'Genre'))
        self.media_actors = eval(list_type.value.capitalize().replace('list', 'Actors'))
        if list_type != ListType.MOVIES:
            self.media_eps = eval(list_type.value.capitalize().replace('list', 'EpisodesPerSeason'))

    def get_top_media(self):
        queries = []
        for list_type in self.no_games_list_type:
            self.get_query_data(list_type)
            queries.append(db.session.query(self.media.name, self.media_list,
                                            func.count(self.media_list.media_id == self.media.id).label("count"))
                           .join(self.media_list, self.media_list.media_id == self.media.id)
                           .group_by(self.media_list.media_id).order_by(text("count desc")).limit(5).all())
        return queries

    def get_top_genres(self):
        queries = []
        for list_type in self.no_games_list_type:
            self.get_query_data(list_type)
            queries.append(db.session.query(self.media_genre.genre, self.media_list,
                                            func.count(self.media_genre.genre).label('count'))
                           .join(self.media_genre, self.media_genre.media_id == self.media_list.media_id)
                           .group_by(self.media_genre.genre).order_by(text('count desc')).limit(5).all())
        return queries

    def get_top_actors(self):
        queries = []
        for list_type in self.no_games_list_type:
            self.get_query_data(list_type)
            queries.append(db.session.query(self.media_actors.name, self.media_list,
                                            func.count(self.media_actors.name).label('count'))
                           .join(self.media_actors, self.media_actors.media_id == self.media_list.media_id)
                           .group_by(self.media_actors.name).filter(self.media_actors.name != 'Unknown')
                           .order_by(text('count desc')).limit(5).all())
        return queries

    def get_top_directors(self):
        self.get_query_data(ListType.MOVIES)
        query = db.session.query(self.media.director_name, self.media_list,
                                 func.count(self.media.director_name).label('count'))\
            .filter(self.media.director_name != 'Unknown')\
            .order_by(text('count desc')).limit(5).all()

        return [[], [], query]

    def get_top_dropped(self):
        queries = []
        for list_type in self.truncated_list_type:
            self.get_query_data(list_type)
            queries.append(db.session.query(self.media.name, self.media_list,
                                            func.count(self.media_list.media_id == self.media.id).label('count'))
                           .join(self.media_list, self.media_list.media_id == self.media.id)
                           .filter(self.media_list.status == Status.DROPPED).group_by(self.media_list.media_id)
                           .order_by(text('count desc')).limit(5).all())
        return queries

    def get_total_eps_seasons(self):
        queries = []
        for list_type in self.truncated_list_type:
            self.get_query_data(list_type)
            queries.append(db.session.query(func.sum(self.media_list.eps_watched),
                                            func.sum(self.media_list.current_season)).all())
        return queries

    def get_total_movies(self):
        self.get_query_data(ListType.MOVIES)
        total_movies = db.session.query(self.media, func.count(self.media.id)).all()
        t_movies = 0
        if total_movies:
            t_movies = total_movies[0][1]

        return t_movies


# Query for <mymedialist> route
def get_media_query(user_id, list_type, category, genre, sorting, page, q):
    media = eval(list_type.value.capitalize().replace('list', ''))
    media_list = eval(list_type.value.capitalize().replace('l', 'L'))
    media_genre = eval(list_type.value.capitalize().replace('list', 'Genre'))

    if list_type != ListType.GAMES:
        media_more = eval(list_type.value.capitalize().replace('list', 'Actors'))
    elif list_type == ListType.GAMES:
        media_more = eval(list_type.value.capitalize().replace('list', 'Companies'))

    if list_type == ListType.SERIES or list_type == ListType.ANIME:
        add_sort = {'Release date +': media.first_air_date.desc(),
                    'Release date -': media.first_air_date.asc(),
                    'Rewatch': media_list.rewatched.desc(),
                    'Score TMDB +': media.vote_average.desc(),
                    'Score TMDB -': media.vote_average.asc()}
    elif list_type == ListType.MOVIES:
        add_sort = {'Release date +': media.release_date.desc(),
                    'Release date -': media.release_date.asc(),
                    'Rewatch': media_list.rewatched.desc(),
                    'Score TMDB +': media.vote_average.desc(),
                    'Score TMDB -': media.vote_average.asc()}
    elif list_type == ListType.GAMES:
        add_sort = {'Release date +': media.release_date.desc(),
                    'Release date -': media.release_date.asc(),
                    'Playtime +': media_list.playtime.desc(),
                    'Playtime -': media_list.playtime.asc(),
                    'Score IGDB +': media.vote_average.desc(),
                    'Score IGDB -': media.vote_average.asc()}

    # Create a sorting dict
    sorting_dict = {'Title A-Z': media.name.asc(),
                    'Title Z-A': media.name.desc(),
                    'Score +': media_list.score.desc(),
                    'Score -': media_list.score.asc(),
                    'Comments': media_list.comment.desc()}
    sorting_dict.update(add_sort)

    # Check the sorting value
    try:
        sorting = sorting_dict[sorting]
    except KeyError:
        abort(400)

    # Check the category
    try:
        category = Status(category)
        cat_value = category.value
    except ValueError:
        return abort(400)

    # Check the genre
    genre_filter = media_genre.genre.like(genre)
    if genre == 'All':
        genre_filter = text('')

    # Check the <filter_val> value - NOT USED FOR NOW
    filter_val = False
    com_ids = [-1]
    if filter_val:
        v1, v2 = aliased(media_list), aliased(media_list)
        get_common = db.session.query(v1, v2) \
            .join(v2, and_(v2.user_id == user_id, v2.media_id == v1.media_id)) \
            .filter(v1.user_id == current_user.id).all()
        com_ids = [r[0].media_id for r in get_common]

    query = db.session.query(media, media_list, media_genre, media_more) \
        .outerjoin(media, media.id == media_list.media_id) \
        .outerjoin(media_genre, media_genre.media_id == media_list.media_id) \
        .outerjoin(media_more, media_more.media_id == media_list.media_id) \
        .filter(media_list.user_id == user_id, media_list.media_id.notin_(com_ids), genre_filter)

    if category != Status.FAVORITE and category != Status.SEARCH and category != Status.ALL:
        query = query.filter(media_list.status == category)
    elif category == Status.FAVORITE:
        query = query.filter(media_list.favorite)
    elif category == Status.SEARCH:
        if list_type == ListType.SERIES or list_type == ListType.ANIME:
            query = query.filter(or_(media.name.like('%' + q + '%'), media_more.name.like('%' + q + '%'),
                                     media.original_name.like('%' + q + '%')))
        elif list_type == ListType.MOVIES:
            query = query.filter(or_(media.name.like('%' + q + '%'), media_more.name.like('%' + q + '%'),
                                     media.director_name.like('%' + q + '%'), media.original_name.like('%' + q + '%')))
        elif list_type == ListType.GAMES:
            query = query.filter(or_(media.name.like('%' + q + '%'),
                                     media_more.name.like('%' + q + '%')))

    # Run the query
    results = query.group_by(media.id).order_by(sorting).paginate(int(page), 48, error_out=True)

    # Get <common_media> and <common_elements> between the users
    common_media, common_elements = get_media_count(user_id, list_type)

    # Recover the media data into a dict
    items_data_list = []
    for item in results.items:
        from MyLists.main.media_object import MediaListObj
        add_data = MediaListObj(item, common_media, list_type)
        items_data_list.append(add_data)

    data = {'actual_page': results.page,
            'total_pages': results.pages,
            'total_media': results.total,
            'common_elements': common_elements,
            'items_list': items_data_list}

    return cat_value, data


# Count the number of media in a list type for a user
def get_media_count(user_id, list_type):
    # If user_id == current_user.id the common media does not need to be calculated.
    if user_id == current_user.id:
        common_media, common_elements = [], []
        return common_media, common_elements

    media_list = eval(list_type.value.capitalize().replace('l', 'L'))

    v1, v2 = aliased(media_list), aliased(media_list)
    count_total = media_list.query.filter_by(user_id=user_id).count()
    count_versus = db.session.query(v1, v2) \
        .join(v2, and_(v2.user_id == user_id, v2.media_id == v1.media_id)) \
        .filter(v1.user_id == current_user.id).all()
    common_ids = [r[0].media_id for r in count_versus]

    try:
        percentage = int((len(common_ids) / count_total) * 100)
    except ZeroDivisionError:
        percentage = 0
    common_elements = [len(common_ids), count_total, percentage]

    return common_ids, common_elements


# Recover the next airing media for the user
def get_next_airing(list_type):
    media = eval(list_type.value.capitalize().replace('list', ''))
    media_list = eval(list_type.value.capitalize().replace('l', 'L'))

    if list_type != ListType.MOVIES:
        media_data = media.next_episode_to_air
    else:
        media_data = Movies.release_date

    query = db.session.query(media, media_list) \
        .join(media, media.id == media_list.media_id) \
        .filter(media_data > datetime.utcnow(), media_list.user_id == current_user.id,
                and_(media_list.status != Status.RANDOM, media_list.status != Status.DROPPED)) \
        .order_by(media_data.asc()).all()

    return query


# Recover the total time by medialist for all users
def compute_media_time_spent():
    for list_type in ListType:
        media = eval(list_type.value.capitalize().replace('list', ''))
        media_list = eval(list_type.value.capitalize().replace('l', 'L'))

        if media_list != GamesList:
            query = db.session.query(User, media.duration, media_list.eps_watched,
                                     func.sum(media.duration * media_list.eps_watched)) \
                .join(media, media.id == media_list.media_id) \
                .join(User, User.id == media_list.user_id) \
                .group_by(media_list.user_id).all()
        else:
            query = db.session.query(User, media_list.playtime, media_list.score, func.sum(media_list.playtime)) \
                .join(media, media.id == media_list.media_id) \
                .join(User, User.id == media_list.user_id) \
                .group_by(media_list.user_id).all()

        for q in query:
            setattr(q[0], f"time_spent_{list_type.value.replace('list', '')}", q[3])


# Check if media exists
def check_media(media_id, list_type, add=False):
    media = eval(list_type.value.capitalize().replace('list', ''))
    media_list = eval(list_type.value.capitalize().replace('l', 'L'))

    if add:
        query = db.session.query(media).filter(media.id == media_id).first()
        if query:
            test = db.session.query(media_list)\
                .filter(media_list.media_id == media_id, media_list.user_id == current_user.id).first()
            if test:
                query = None
    else:
        query = db.session.query(media, media_list) \
            .join(media, media.id == media_list.media_id) \
            .filter(media.id == media_id, media_list.user_id == current_user.id).first()

    return query


# Get additional stats on the <list_type> and the <user>
def get_more_stats(user, list_type):
    if list_type == ListType.GAMES:
        return flash('Not available for now ;)', 'warning')

    media = eval(list_type.value.capitalize().replace('list', ''))
    media_list = eval(list_type.value.capitalize().replace('l', 'L'))
    media_actors = eval(list_type.value.capitalize().replace('list', 'Actors'))
    media_genres = eval(list_type.value.capitalize().replace('list', 'Genre'))

    media_data = db.session.query(media, media_list) \
        .join(media_list, media_list.media_id == media.id) \
        .filter(media_list.user_id == user.id)

    top_actors = db.session.query(media_actors.name, media_list, func.count(media_actors.name).label('count')) \
        .join(media_actors, media_actors.media_id == media_list.media_id) \
        .filter(media_list.user_id == user.id, media_actors.name != 'Unknown') \
        .group_by(media_actors.name).order_by(text('count desc')).limit(10).all()

    top_genres = db.session.query(media_genres.genre, media_list, func.count(media_genres.genre).label('count')) \
        .join(media_genres, media_genres.media_id == media_list.media_id) \
        .filter(media_list.user_id == user.id, media_genres.genre != 'Unknown') \
        .group_by(media_genres.genre).order_by(text('count desc')).limit(10).all()

    top_langages, top_directors = [], []
    if list_type == ListType.MOVIES:
        langages = db.session.query(media.original_language, media_list,
                                    func.count(media.original_language).label('count')) \
            .join(media, media.id == media_list.media_id).filter(media_list.user_id == user.id) \
            .group_by(media.original_language).order_by(text('count desc')).limit(5).all()

        top_langages = []
        for langage in langages:
            try:
                name_iso = iso639.to_name(langage[0])
            except:
                if langage[0] == 'cn':
                    name_iso = 'Chinese'
                else:
                    name_iso = langage[0]
            top_langages.append([name_iso, langage[1], langage[2]])

        top_directors = db.session.query(media.director_name, media_list,
                                         func.count(media.director_name).label('count')) \
            .join(media, media.id == media_list.media_id).filter(media_list.user_id == user.id) \
            .group_by(media.director_name).order_by(text('count desc')).limit(10).all()

    media_periods = OrderedDict({"'60s-": 0, "'70s": 0, "'80s": 0, "'90s": 0, "'00s": 0, "'10s": 0, "'20s+": 0})
    media_eps = OrderedDict({'1-25': 0, '26-49': 0, '50-99': 0, '100-149': 0, '150-199': 0, '200+': 0})
    movies_runtime = OrderedDict({'<1h': 0, '1h-1h29': 0, '1h30-1h59': 0, '2h00-2h29': 0, '2h30-2h59': 0, '3h+': 0})
    for element in media_data:
        if element[1].status == Status.PLAN_TO_WATCH:
            continue

        # --- Period stats ----------------------------------------------------------------------------
        try:
            airing_year = int(element[0].first_air_date.split('-')[0])
        except:
            try:
                airing_year = int(element[0].release_date.split('-')[0])
            except:
                airing_year = 0

        if airing_year < 1970:
            media_periods["'60s-"] += 1
        elif 1970 <= airing_year < 1980:
            media_periods["'70s"] += 1
        elif 1980 <= airing_year < 1990:
            media_periods["'80s"] += 1
        elif 1990 <= airing_year < 2000:
            media_periods["'90s"] += 1
        elif 2000 <= airing_year < 2010:
            media_periods["'00s"] += 1
        elif 2010 <= airing_year < 2020:
            media_periods["'10s"] += 1
        elif airing_year >= 2020:
            media_periods["'20s+"] += 1

        # --- Eps / runtime stats ---------------------------------------------------------------------
        if list_type == ListType.SERIES or list_type == ListType.ANIME:
            nb_watched = element[1].eps_watched
            if element[1].rewatched > 0:
                nb_watched = element[0].total_episodes

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
        elif list_type == ListType.MOVIES:
            time_watched = element[0].duration

            if time_watched < 60:
                movies_runtime['<1h'] += 1
            elif 60 <= time_watched < 90:
                movies_runtime['1h-1h29'] += 1
            elif 90 <= time_watched < 120:
                movies_runtime['1h30-1h59'] += 1
            elif 120 <= time_watched < 150:
                movies_runtime['2h00-2h29'] += 1
            elif 150 <= time_watched < 180:
                movies_runtime['2h30-2h59'] += 1
            elif time_watched >= 180:
                movies_runtime['3h+'] += 1

    data = {'genres': top_genres, 'actors': top_actors, 'periods': media_periods, 'eps_time': media_eps,
            'movies_times': movies_runtime, 'top_langage': top_langages, 'top_directors': top_directors}

    return data
