from __future__ import annotations

from typing import List
from enum import StrEnum


# --- USERS ------------------------------------------------------------------------

class RoleType(StrEnum):
    """
    Represents the different roles available in MyLists.
    - `manager`: can lock, edit, and refresh the media details
    - `user`: standard user
    """

    MANAGER = "manager"
    USER = "user"


class Privacy(StrEnum):
    """
    Represents the different privacy settings available in MyLists.
    - `public`: everyone can see the user profile.
    - `restricted` (default): only the users connected can see the user profile.
    - `private`: only the owner and the accepted followers can see the user profile.
    """

    PUBLIC = "public"
    RESTRICTED = "restricted"
    PRIVATE = "private"


class RatingSystem(StrEnum):
    """ Represents the rating system used by the user """

    SCORE = "score"
    FEELING = "feeling"


# --- MEDIA ------------------------------------------------------------------------


class MediaType(StrEnum):
    """
    Represents each media type available in MyLists.
    The enum order is used, do not modify !!
    """

    SERIES = "series"
    ANIME = "anime"
    MOVIES = "movies"
    BOOKS = "books"
    GAMES = "games"
    MANGA = "manga"

    def __lt__(self, other: MediaType):
        order = {mt: idx for (idx, mt) in enumerate(MediaType)}
        return order[self] < order.get(other, 0)

    @classmethod
    def default(cls) -> List[MediaType]:
        return [cls.SERIES, cls.MOVIES]


class Status(StrEnum):
    """
    Represents all the different statuses available in MyLists for all the media types.
    As well as the default status for each media type.
    """

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
        mapping = {
            MediaType.SERIES: cls.tv(),
            MediaType.ANIME: cls.tv(),
            MediaType.MOVIES: cls.movies(),
            MediaType.BOOKS: cls.books(),
            MediaType.GAMES: cls.games(),
            MediaType.MANGA: cls.books(),
        }
        return mapping[media_type]


class JobType(StrEnum):
    """
    Represents the different accepted job type in a media details page:
    - `creator`: director (movies), tv creator (series/anime), developer (games), or author (books)
    - `actor`: actors (series/anime/movies)
    - `platform`: tv network (series/anime)
    """

    ACTOR = "actor"
    CREATOR = "creator"
    PLATFORM = "platform"
    PUBLISHER = "publisher"


class GamesPlatformsEnum(StrEnum):
    """
    Represents the different platforms available for the games in MyLists.
    Needs to be updated when new video games platforms are created.
    """

    PC = "PC"
    ANDROID = "Android"
    IPHONE = "Iphone"

    PLAYSTATION_5 = "Playstation 5"
    PLAYSTATION_4 = "Playstation 4"
    PLAYSTATION_3 = "Playstation 3"
    PLAYSTATION_2 = "Playstation 2"
    PLAYSTATION = "Playstation"

    PSP = "PSP"
    PS_VITA = "PS Vita"

    XBOX_SERIES = "Xbox Series"
    XBOX_ONE = "Xbox One"
    XBOX_360 = "Xbox 360"
    XBOX = "Xbox"

    NINTENDO_SWITCH = "Switch"
    WII_U = "Wii U"
    WII = "Wii"
    GAMECUBE = "Gamecube"
    NINTENDO_64 = "Nintendo 64"
    SNES = "SNES"
    NES = "NES"

    NINTENDO_3DS = "Nintendo 3DS"
    NINTENDO_DS = "Nintendo DS"
    GAME_BOY_ADVANCE = "GB Advance"
    GAME_BOY_COLOR = "GB Color"
    GAME_BOY = "Game Boy"

    ARCADE = "Arcade"

    OLD_SEGA_CONSOLE = "Old Sega"
    OLD_ATARI_CONSOLE = "Old Atari"
    OTHER = "Other"


# --- OTHER ------------------------------------------------------------------------


class ModelTypes(StrEnum):
    """
    Represents the different types of SQLAlchemy models available in MyLists.
    Used to determine the appropriate model to use in polymorphic endpoints
    """

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


class NotificationType(StrEnum):
    """
    Represents the different types of notifications available in MyLists, excluding the books.
    - `tv`: notifications for the series/anime
    - `media`: notifications for movies/games
    - `follow`: notifications for following users
    """

    TV = "tv"
    MEDIA = "media"
    FOLLOW = "follow"


class UpdateType(StrEnum):
    """
    Represents the different types of updates available in MyLists.
    - `tv`: seasons and episodes updates for the series/anime
    - `page`: updates for the books
    - `redo`: updates re-watched / re-read for the series/anime/movies/books
    - `status`: updates for the status of the media (all media concerned)
    - `chapter`: updates for the chapters of the manga
    - `playtime`: updates for the playtime of the games
    """

    TV = "tv"
    PAGE = "page"
    REDO = "redo"
    STATUS = "status"
    CHAPTER = "chapter"
    PLAYTIME = "playtime"


class AchievementDifficulty(StrEnum):
    """
    Represents the different difficulties available for the achievements.
    - `BRONZE`: lowest difficulty
    - `SILVER`: medium difficulty
    - `GOLD`: high difficulty
    - `PLATINUM`: highest difficulty
    """

    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class SearchSelector(StrEnum):
    """ Search selector enum for the navbar search. """

    TMDB = "tmdb"
    BOOKS = "books"
    IGDB = "igdb"
    USERS = "users"
