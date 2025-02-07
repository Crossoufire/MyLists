from pathlib import Path
from typing import Dict, Any, Callable, Type

from flask import current_app

from backend.api.utils.enums import StatusManager
from backend.api.services.achievements.calculators import *
from backend.api.services.api.data_classes import ApiParams
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.services.stats.delta import DeltaStatsService
from backend.api.services.api.providers.extra import JikanApiExtra, HltbApiExtra
from backend.api.services.achievements.factory import AchievementCalculatorFactory
from backend.api.services.api.providers.igdb import GamesApiCaller, GamesApiParser
from backend.api.services.api.providers.gbook import BooksApiCaller, BooksApiParser
from backend.api.services.api.providers.jikan import MangaApiCaller, MangaApiParser
from backend.api.services.api.strategies.changes import ApiStrategy, DatabaseStrategy
from backend.api.services.api.providers.tmdb import TMDBApiCallerCaller, TVApiParser, MoviesApiParser
from backend.api.services.stats.stats import SeriesStatsCalculator, MediaStatsService, BaseStatsCalculator, AnimeStatsCalculator, \
    MoviesStatsCalculator, GamesStatsCalculator, BooksStatsCalculator, MangaStatsCalculator


class MediaConfig(ABC):
    def __init__(self, media_type: MediaType):
        self.media_type = media_type
        self.init_all()

    def init_achievements(self):
        achievements = self.get_achievements()
        AchievementCalculatorFactory.init_calculators(self.media_type, achievements)

    def init_api_provider(self):
        api_provider_data = self.get_api_provider()
        ApiServiceFactory.init_api_config(self.media_type, api_provider_data)

    def init_delta_stats(self):
        multiplier = self.get_delta_stats()
        DeltaStatsService.init_multipliers(self.media_type, multiplier)

    def init_media_stats(self):
        media_stats_calculator = self.get_media_stats_calculator()
        MediaStatsService.init_calculators(self.media_type, media_stats_calculator)

    def init_status_manager(self):
        status_list = self.get_status_config()
        StatusManager.init_status_mapping(self.media_type, status_list)

    def init_all(self):
        self.init_achievements()
        self.init_api_provider()
        self.init_delta_stats()
        self.init_media_stats()
        self.init_status_manager()

    # --- ABSTRACT METHODS ---------------------------------------------------------

    @abstractmethod
    def get_achievements(self) -> Dict[str, Any]: ...

    @abstractmethod
    def get_api_provider(self) -> Dict[str, Any]: ...

    @abstractmethod
    def get_delta_stats(self) -> Callable[[Any, Any], Any]: ...

    @abstractmethod
    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]: ...

    @abstractmethod
    def get_status_config(self) -> List[Status]: ...


class SeriesConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.SERIES)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_series=CompletedCalculator,
            rated_series=RatedCalculator,
            comment_series=CommentCalculator,
            short_series=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
            long_series=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
            comedy_series=SpecificGenreCalculator,
            drama_series=SpecificGenreCalculator,
            network_series=NetworkCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """

        return dict(
            caller=TMDBApiCallerCaller,
            parser=TVApiParser,
            extra=None,
            change_strategy=ApiStrategy,
            params=ApiParams(
                media_type=MediaType.SERIES,
                main_url="https://api.themoviedb.org/3",
                api_key=current_app.config["THEMOVIEDB_API_KEY"],
                poster_base_url="https://image.tmdb.org/t/p/w300",
                local_cover_path=Path(current_app.root_path, "static/covers/series_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, user_media: user_media.media.duration

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return SeriesStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH]


class AnimeConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.ANIME)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_anime=CompletedCalculator,
            rated_anime=RatedCalculator,
            comment_anime=CommentCalculator,
            short_anime=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
            long_anime=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
            shonen_anime=SpecificGenreCalculator,
            seinen_anime=SpecificGenreCalculator,
            network_anime=NetworkCalculator,
            actor_anime=ActorCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """
        return dict(
            caller=TMDBApiCallerCaller,
            parser=TVApiParser,
            extra=JikanApiExtra,
            change_strategy=ApiStrategy,
            params=ApiParams(
                media_type=MediaType.ANIME,
                main_url="https://api.themoviedb.org/3",
                api_key=current_app.config["THEMOVIEDB_API_KEY"],
                poster_base_url="https://image.tmdb.org/t/p/w300",
                local_cover_path=Path(current_app.root_path, "static/covers/anime_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, user_media: user_media.media.duration

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return AnimeStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH]


class MoviesConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.MOVIES)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_movies=CompletedCalculator,
            rated_movies=RatedCalculator,
            comment_movies=CommentCalculator,
            short_movies=(ShortLongCalculator, ("duration", [Status.COMPLETED])),
            long_movies=(ShortLongCalculator, ("duration", [Status.COMPLETED])),
            director_movies=DirectorCalculator,
            actor_movies=ActorCalculator,
            origin_lang_movies=OriginLangCalculator,
            war_genre_movies=SpecificGenreCalculator,
            family_genre_movies=SpecificGenreCalculator,
            sci_genre_movies=SpecificGenreCalculator,
            animation_movies=SpecificGenreCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """
        return dict(
            caller=TMDBApiCallerCaller,
            parser=MoviesApiParser,
            extra=None,
            change_strategy=DatabaseStrategy,
            params=ApiParams(
                media_type=MediaType.MOVIES,
                main_url="https://api.themoviedb.org/3",
                api_key=current_app.config["THEMOVIEDB_API_KEY"],
                poster_base_url="https://image.tmdb.org/t/p/w300",
                local_cover_path=Path(current_app.root_path, "static/covers/movies_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, user_media: user_media.media.duration

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return MoviesStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.COMPLETED, Status.PLAN_TO_WATCH]


class GamesConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.GAMES)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_games=CompletedCalculator,
            rated_games=RatedCalculator,
            comment_games=CommentCalculator,
            developer_games=CompanyCalculator,
            publisher_games=CompanyCalculator,
            short_games=(ShortLongCalculator, ("playtime", [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER])),
            long_games=(ShortLongCalculator, ("playtime", [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER])),
            first_person_games=PerspectiveCalculator,
            hack_slash_games=SpecificGenreCalculator,
            multiplayer_games=GameModeCalculator,
            log_hours_games=TimeCalculator,
            platform_games=PlatformCalculator,
            pc_games=SpecificPlatformCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """
        return dict(
            caller=GamesApiCaller,
            parser=GamesApiParser,
            extra=HltbApiExtra,
            change_strategy=DatabaseStrategy,
            params=ApiParams(
                media_type=MediaType.GAMES,
                main_url="https://api.igdb.com/v4/games",
                api_key=current_app.config["IGDB_API_KEY"],
                secret_id=current_app.config["SECRET_IGDB"],
                client_id=current_app.config["CLIENT_IGDB"],
                poster_base_url="https://images.igdb.com/igdb/image/upload/t_1080p/",
                local_cover_path=Path(current_app.root_path, "static/covers/games_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, _: 1

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return GamesStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.PLAYING, Status.COMPLETED, Status.MULTIPLAYER, Status.ENDLESS, Status.DROPPED, Status.PLAN_TO_PLAY]


class BooksConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.BOOKS)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_books=CompletedCalculator,
            rated_books=RatedCalculator,
            comment_books=CommentCalculator,
            author_books=AuthorCalculator,
            lang_books=LanguageCalculator,
            short_books=(ShortLongCalculator, ("pages", [Status.COMPLETED])),
            long_books=(ShortLongCalculator, ("pages", [Status.COMPLETED])),
            classic_books=SpecificGenreCalculator,
            young_adult_books=SpecificGenreCalculator,
            crime_books=SpecificGenreCalculator,
            fantasy_books=SpecificGenreCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """
        return dict(
            caller=BooksApiCaller,
            parser=BooksApiParser,
            extra=None,
            change_strategy=None,
            params=ApiParams(
                poster_base_url="",
                media_type=MediaType.BOOKS,
                main_url="https://www.googleapis.com/books/v1/volumes",
                local_cover_path=Path(current_app.root_path, "static/covers/books_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, user_media: user_media.TIME_PER_PAGE

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return BooksStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ]


class MangaConfig(MediaConfig):
    def __init__(self):
        super().__init__(MediaType.MANGA)

    def get_achievements(self) -> Dict[str, Any]:
        """ Return the achievement config """
        return dict(
            completed_manga=CompletedCalculator,
            rated_manga=RatedCalculator,
            comment_manga=CommentCalculator,
            author_manga=AuthorCalculator,
            publisher_manga=PublisherCalculator,
            short_manga=(ShortLongCalculator, ("volumes", [Status.COMPLETED])),
            long_manga=(ShortLongCalculator, ("volumes", [Status.COMPLETED])),
            chapter_manga=ChapterCalculator,
            hentai_manga=SpecificGenreCalculator,
            shounen_manga=SpecificGenreCalculator,
            seinen_manga=SpecificGenreCalculator,
        )

    def get_api_provider(self) -> Dict[str, Any]:
        """ Get the api provider config """
        return dict(
            caller=MangaApiCaller,
            parser=MangaApiParser,
            extra=None,
            change_strategy=DatabaseStrategy,
            params=ApiParams(
                media_type=MediaType.MANGA,
                main_url="https://api.jikan.moe/v4/manga",
                local_cover_path=Path(current_app.root_path, "static/covers/manga_covers/"),
            ),
        )

    def get_delta_stats(self) -> Callable[[Any, Any], Any]:
        """ Get the delta stats config """
        return lambda self, user_media: user_media.TIME_PER_CHAPTER

    def get_media_stats_calculator(self) -> Type[BaseStatsCalculator]:
        """ Get the media stats calculator """
        return MangaStatsCalculator

    def get_status_config(self) -> List[Status]:
        """ Get the status config """
        return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ]
