from __future__ import annotations
from enum import Enum
from typing import List


class ExtendedEnum(Enum):
    @classmethod
    def to_list(cls) -> List:
        return [c.value for c in cls]


class MediaType(ExtendedEnum):
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


class Status(str, ExtendedEnum):
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
        return [cls.COMPLETED, cls.PLAN_TO_WATCH]

    @classmethod
    def tv(cls):
        return [cls.WATCHING, cls.COMPLETED, cls.ON_HOLD, cls.RANDOM, cls.DROPPED, cls.PLAN_TO_WATCH]

    @classmethod
    def books(cls):
        return [cls.READING, cls.COMPLETED, cls.ON_HOLD, cls.DROPPED, cls.PLAN_TO_READ]

    @classmethod
    def games(cls):
        return [cls.PLAYING, cls.COMPLETED, cls.MULTIPLAYER, cls.ENDLESS, cls.DROPPED, cls.PLAN_TO_PLAY]

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


class RoleType(str, ExtendedEnum):
    ADMIN = "admin"      # Can access admin dashboard
    MANAGER = "manager"  # Can lock and edit media
    USER = "user"        # Standard user


class ModelTypes(str, ExtendedEnum):
    MEDIA = "media"
    LIST = "list"
    GENRE = "genre"
    ACTORS = "actors"
    LABELS = "labels"
    EPS = "episodesPerSeason"
    NETWORK = "network"
    PLATFORMS = "platforms"
    COMPANIES = "companies"
    AUTHORS = "authors"


class JobType(str, Enum):
    ACTOR = "actor"
    CREATOR = "creator"
    PLATFORM = "platform"


class NotificationType(str, Enum):
    TV = "tv"
    MEDIA = "media"
    FOLLOW = "follow"
