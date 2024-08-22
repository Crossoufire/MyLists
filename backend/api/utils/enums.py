from __future__ import annotations
from enum import Enum
from typing import List


class MediaType(str, Enum):
    """ The enum order is used, do not modify !! """

    SERIES = "series"
    ANIME = "anime"
    MOVIES = "movies"
    BOOKS = "books"
    GAMES = "games"

    def __lt__(self, other: MediaType):
        order = {t: idx for (idx, t) in enumerate(MediaType)}
        return order[self] < order[other]

    @classmethod
    def default(cls) -> List[MediaType]:
        return [cls.SERIES, cls.MOVIES]

    @classmethod
    def tmdb(cls):
        return [cls.SERIES, cls.ANIME, cls.MOVIES]

    @classmethod
    def tv(cls):
        return [cls.SERIES, cls.ANIME]

    @classmethod
    def other(cls):
        return [cls.BOOKS, cls.GAMES]

    @classmethod
    def by(cls, type_: str):
        if type_ == "tv":
            return cls.tv()
        elif type_ == "tmdb":
            return cls.tmdb()
        elif type_ == "other":
            return cls.other()
        else:
            raise ValueError(f"Invalid type_: {type_}")


class ModelTypes(str, Enum):
    MEDIA = "media"
    LIST = "list"
    GENRE = "genre"
    ACTORS = "actors"
    AUTHORS = "authors"
    LABELS = "labels"
    EPS = "epsPerSeason"
    PLATFORMS = "platforms"
    COMPANIES = "companies"


class Status(str, Enum):
    ALL = "All"
    WATCHING = "Watching"
    READING = "Reading"
    PLAYING = "Playing"
    COMPLETED = "Completed"
    MULTIPLAYER = "Multiplayer"
    ON_HOLD = "On Hold"
    ENDLESS = "Endless"
    RANDOM = "Random"
    DROPPED = "Dropped"
    PLAN_TO_WATCH = "Plan to Watch"
    PLAN_TO_READ = "Plan to Read"
    PLAN_TO_PLAY = "Plan to Play"

    @classmethod
    def movies(cls):
        return [cls.ALL, cls.COMPLETED, cls.PLAN_TO_WATCH]

    @classmethod
    def tv(cls):
        return [cls.ALL, cls.WATCHING, cls.COMPLETED, cls.ON_HOLD, cls.RANDOM, cls.DROPPED, cls.PLAN_TO_WATCH]

    @classmethod
    def books(cls):
        return [cls.ALL, cls.READING, cls.COMPLETED, cls.ON_HOLD, cls.DROPPED, cls.PLAN_TO_READ]

    @classmethod
    def games(cls):
        return [cls.ALL, cls.PLAYING, cls.COMPLETED, cls.MULTIPLAYER, cls.ENDLESS, cls.DROPPED, cls.PLAN_TO_PLAY]

    @classmethod
    def by(cls, media_type: MediaType):
        if media_type == MediaType.SERIES or media_type == MediaType.ANIME:
            return cls.tv()
        elif media_type == MediaType.MOVIES:
            return cls.movies()
        elif media_type == MediaType.BOOKS:
            return cls.books()
        elif media_type == MediaType.GAMES:
            return cls.games()
        else:
            raise ValueError(f"Invalid media type: {media_type}")


class RoleType(str, Enum):
    USER = "user"        # Standard user
    ADMIN = "admin"      # Can access admin dashboard
    MANAGER = "manager"  # Can lock and edit media


class UpdateType(str, Enum):
    TV = "tv"
    PAGE = "page"
    REDO = "redo"
    STATUS = "status"
    PLAYTIME = "playtime"


class NotificationType(str, Enum):
    MEDIA = "media"
    FOLLOW = "follow"


class JobType(str, Enum):
    ACTOR = "actor"
    CREATOR = "creator"
    PLATFORM = "platform"


class PrivacyType(str, Enum):
    PUBLIC = "public"
    NORMAL = "normal"
    PRIVATE = "private"


class RatingSystem(str, Enum):
    SCORE = "score"
    FEELING = "feeling"
