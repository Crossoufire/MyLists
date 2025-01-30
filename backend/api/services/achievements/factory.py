from typing import Dict, Type

from backend.api.services.achievements.calculators import *


class AchievementCalculatorFactory:
    def __init__(self):
        self._calculators_map: Dict[MediaType, Dict[str, Type[BaseAchievementCalculator]]] = {
            MediaType.SERIES: dict(
                completed_series=CompletedCalculator,
                rated_series=RatedCalculator,
                comment_series=CommentCalculator,
                short_series=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
                long_series=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
                comedy_series=SpecificGenreCalculator,
                drama_series=SpecificGenreCalculator,
                network_series=NetworkCalculator,
            ),
            MediaType.ANIME: dict(
                completed_anime=CompletedCalculator,
                rated_anime=RatedCalculator,
                comment_anime=CommentCalculator,
                short_anime=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
                long_anime=(ShortLongCalculator, ("total_episodes", [Status.COMPLETED])),
                shonen_anime=SpecificGenreCalculator,
                seinen_anime=SpecificGenreCalculator,
                network_anime=NetworkCalculator,
                actor_anime=ActorCalculator,
            ),
            MediaType.MOVIES: dict(
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
            ),
            MediaType.GAMES: dict(
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
            ),
            MediaType.BOOKS: dict(
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
            ),
            MediaType.MANGA: dict(
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
            ),
        }
        self._code_name_to_media_type: Dict[str, MediaType] = {}
        self._initialize_cache()

    def create(self, code_name: str) -> BaseAchievementCalculator:
        media_type = self._code_name_to_media_type.get(code_name)
        if media_type is None:
            raise ValueError(f"Could not find media type corresponding to code name '{code_name}'")

        calculator_data = self._calculators_map[media_type][code_name]
        if isinstance(calculator_data, tuple):
            calculator_class, calculator_args = calculator_data
            return calculator_class(media_type, media_config=calculator_args)
        else:
            calculator_class = calculator_data
            return calculator_class(media_type)

    def _initialize_cache(self):
        """ Generate the reverse lookup map for quick <code_name> to <media_type> resolution """

        self._code_name_to_media_type.clear()
        for media_type, code_map in self._calculators_map.items():
            for code_name in code_map:
                self._code_name_to_media_type[code_name] = media_type
