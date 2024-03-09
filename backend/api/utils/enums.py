from enum import Enum
from typing import List


class ExtendedEnum(Enum):
    """ Extend enum to add <to_list> method """

    @classmethod
    def to_list(cls, extra: bool = False) -> List:
        """ Add this <to list> method on an enum. Extra add <all>, <favorite>, and <stats> """

        enum_values = [c.value for c in cls]
        return ["All"] + enum_values + ["Favorite", "Stats", "Labels"] if extra else enum_values


class MediaType(ExtendedEnum):
    SERIES = "series"
    ANIME = "anime"
    MOVIES = "movies"
    BOOKS = "books"
    GAMES = "games"

    @classmethod
    def optional_media_types(cls):
        """ Return the optional media """
        return [member for member in cls if member not in [cls.SERIES, cls.MOVIES]]

    @classmethod
    def default_media_types(cls):
        """ Return the default media """
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
    STATS = "Stats"
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
