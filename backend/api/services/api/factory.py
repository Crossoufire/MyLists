from __future__ import annotations

from pathlib import Path

from flask import current_app

from backend.api import MediaType
from backend.api.services.api.service import ApiService
from backend.api.services.api.data_classes import ApiParams
from backend.api.services.api.providers.extra import JikanApiExtra, HltbApiExtra
from backend.api.services.api.providers.igdb import GamesApiCaller, GamesApiParser
from backend.api.services.api.providers.gbook import BooksApiCaller, BooksApiParser
from backend.api.services.api.providers.jikan import MangaApiCaller, MangaApiParser
from backend.api.services.api.strategies.changes import ApiStrategy, DatabaseStrategy
from backend.api.services.api.providers.tmdb import TMDBApiCaller, TVApiParser, MoviesApiParser


class ApiServiceFactory:
    def __init__(self):
        self.apis = {
            MediaType.SERIES: dict(
                caller=TMDBApiCaller,
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
            ),
            MediaType.ANIME: dict(
                caller=TMDBApiCaller,
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
            ),
            MediaType.MOVIES: dict(
                caller=TMDBApiCaller,
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
            ),
            MediaType.BOOKS: dict(
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
            ),
            MediaType.GAMES: dict(
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
            ),
            MediaType.MANGA: dict(
                caller=MangaApiCaller,
                parser=MangaApiParser,
                extra=None,
                change_strategy=DatabaseStrategy,
                params=ApiParams(
                    media_type=MediaType.MANGA,
                    main_url="https://api.jikan.moe/v4/manga",
                    local_cover_path=Path(current_app.root_path, "static/covers/manga_covers/"),
                ),
            ),
        }

    def create(self, media_type: MediaType):
        api_data = self.apis.get(media_type)
        if not api_data:
            raise ValueError(f"No data registered for media_type: '{media_type}'")

        return ApiService(
            api_parser=api_data["parser"](api_data["params"]),
            api_caller=api_data["caller"](api_data["params"]),
            api_extra=api_data["extra"](api_data["params"]) if api_data["extra"] else None,
            change_strategy=api_data["change_strategy"]() if api_data["change_strategy"] else None,
        )
