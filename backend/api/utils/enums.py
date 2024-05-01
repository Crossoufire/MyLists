from __future__ import annotations
from enum import Enum
from typing import List


class ExtendedEnum(Enum):
    """ Extend enum method """

    @classmethod
    def to_list(cls, extra: bool = False) -> List:
        """ Return the enum as a list + extra data """

        enum_values = [c.value for c in cls]
        return ["All"] + enum_values + ["Favorite", "Labels"] if extra else enum_values


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

    ALL = "All"
    SEARCH = "Search"
    FAVORITE = "Favorite"
    LABELS = "Labels"


class RoleType(str, ExtendedEnum):
    ADMIN = "admin"         # Can access to the admin dashboard (/admin)
    MANAGER = "manager"     # Can lock and edit media (/lock_media & /media_details_form)
    USER = "user"           # Standard user


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
