import json
import os.path
import secrets
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from urllib import request
from urllib.request import urlretrieve, Request
import requests
from PIL import Image
from PIL.Image import Resampling
from flask import url_for, current_app, abort
from howlongtobeatpy import HowLongToBeat
from ratelimit import sleep_and_retry, limits
from backend.api import db
from backend.api.models.books_models import Books, BooksGenre, BooksAuthors
from backend.api.models.games_models import Games, GamesCompanies, GamesPlatforms, GamesGenre
from backend.api.models.movies_models import Movies, MoviesGenre, MoviesActors
from backend.api.models.tv_models import (Series, SeriesGenre, SeriesActors, SeriesNetwork, SeriesEpisodesPerSeason,
                                          Anime, AnimeGenre, AnimeNetwork, AnimeEpisodesPerSeason, AnimeActors)
from backend.api.utils.enums import MediaType
from backend.api.utils.functions import get_subclasses, change_air_format, is_latin, clean_html_text


""" --- GENERAL --------------------------------------------------------------------------------------------- """

class ApiData:
    """ Main class to manipulate the different APIs """

    DURATION: int = 0
    GROUP: MediaType = None
    POSTER_BASE_URL: str = ""
    LOCAL_COVER_PATH: str = ""
    API_KEY: str = ""
    RESULTS_PER_PAGE = 7

    def __init__(self, API_id: int = None):
        """ Initialize the ApiData instance with its API ID """

        self.API_id = API_id
        self.API_data = {}
        self.media: db.Model = None
        self.media_details = {}
        self.all_data = {}

    @classmethod
    def get_API_class(cls, media_type: MediaType):
        """ Get the appropriate inherited class depending on the <media_type> """

        subclasses = get_subclasses(cls)
        for class_ in subclasses:
            if media_type == class_.GROUP:
                return class_

    def save_media_to_db(self) -> db.Model:
        """ Save the media data to the database and return all the media data """

        self._get_details_and_credits_data()
        self._from_API_to_dict()
        self._add_data_to_db()

        return self.media

    def update_media_data(self) -> Dict:
        """ Update the media data and return a dict containing the data """

        self._get_details_and_credits_data()
        self._from_API_to_dict(updating=True)

        return self.all_data

    def _get_details_and_credits_data(self):
        """ Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")

    def _from_API_to_dict(self, updating: bool = False):
        """ Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")

    def _add_data_to_db(self):
        """ Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")


class ApiTMDB(ApiData):
    """ TMDB API class for Series, Anime and Movies """

    POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300"
    API_KEY = current_app.config["THEMOVIEDB_API_KEY"]
    MAX_RESULTS = 20
    MAX_ACTORS = 5

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.API_id = API_id

    def search(self, query: str, page: int = 1):
        """ Search in the TMDB API (series, anime, and movies) """

        # Make API call
        url = f"https://api.themoviedb.org/3/search/multi?api_key={self.API_KEY}&query={query}&page={page}"
        self.API_data = requests.get(url, timeout=10).json()

    def create_search_results(self) -> Dict:
        """ Create the search results dict from the search """

        API_results = self.API_data.get("results", [])
        search_results = []
        for result in API_results[:self.MAX_RESULTS]:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            # Continue if not Movies, Series or Anime
            if result.get("known_for_department"):
                continue

            # Create initial common data
            media_info = dict(
                api_id=result.get("id"),
                image_cover=url_for("static", filename="covers/default.jpg"),
            )

            # Overwrite <image_cover> if <poster_path>
            if result.get("poster_path"):
                media_info["image_cover"] = self.POSTER_BASE_URL + result.get("poster_path")

            if result.get("media_type") == "tv":
                media_info.update(self._process_tv(result))
            elif result.get("media_type") == "movie":
                media_info.update(self._process_movie(result))

            search_results.append(media_info)

        # Create <data> dict
        search_dict = dict(
            items=search_results,
            total=self.API_data.get("total_results", 0),
            pages=self.API_data.get("total_pages", 0),
        )

        return search_dict

    @staticmethod
    def _process_tv(result):
        """ Process TV data (Series and Anime from TMDB) """

        media_info = {
            "media_type": MediaType.SERIES.value,
            "date": change_air_format(result.get("first_air_date")),
            "name": result.get("name") if is_latin(result.get("original_name")) else result.get("name")
        }

        # Change <media_type> to <anime> on conditions
        is_jap = result.get("origin_country") == "JP" or result.get("original_language") == "ja"
        is_anime = 16 in result.get("genre_ids")

        if is_jap and is_anime:
            media_info["media_type"] = MediaType.ANIME.value

        return media_info

    @staticmethod
    def _process_movie(result):
        """ Process the Movie data from TMDB """

        media_info = {
            "media_type": MediaType.MOVIES.value,
            "date": change_air_format(result.get("release_date")),
            "name": result.get("original_title") if is_latin(result.get("original_title")) else result.get("title")
        }

        return media_info

    def _get_genres(self) -> List[Dict]:
        """ Fetch the genres for series, anime and movies (fallback for anime if the Jikan API bug) """

        all_genres = self.API_data.get("genres", [])
        genres_list = [{"genre": genre.get("name"), "genre_id": int(genre.get("id"))} for genre in all_genres]
        if not genres_list:
            genres_list = [{"genre": "Unknown", "genre_id": 0}]

        return genres_list

    def _get_actors(self) -> List[Dict]:
        """ Get the <MAX_ACTORS> actors for series, anime and movies """

        actors = self.API_data.get("credits", {}).get("cast", [])[:self.MAX_ACTORS]
        actors_list = [{"name": actor["name"]} for actor in actors] or [{"name": "Unknown"}]

        return actors_list

    def _save_api_cover(self, cover_path: str, cover_name: str):
        """ Save the media (Series, Anime or Movies) cover to the local backend disk """

        # Get cover from url
        urlretrieve(f"{self.POSTER_BASE_URL}{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")

        # Resize and save using PIL
        with Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}") as img:
            img = img.resize((300, 450), Resampling.LANCZOS)
            img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        """ Create a name for the media image cover or fallback on the default.jpg """

        cover_name = "default.jpg"
        cover_path = self.API_data.get("poster_path") or None
        if cover_path:
            cover_name = f"{secrets.token_hex(8)}.jpg"
            try:
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Trying to recover the cover: {e}")
                cover_name = "default.jpg"

        return cover_name


class ApiTV(ApiTMDB):
    """ TMDB API class for the Series and the Anime specifically """

    MAX_NETWORK = 4

    def get_changed_api_ids(self) -> set[int]:
        """ Fetch the IDs that changed in the last 24h from the TMDB API for Series and Anime """

        response = requests.get(f"https://api.themoviedb.org/3/tv/changes?api_key={self.API_KEY}", timeout=10)
        response.raise_for_status()

        data = json.loads(response.text)
        all_api_ids = {d.get("id") for d in data.get("results", {})}

        return all_api_ids

    def _get_details_and_credits_data(self):
        """ Get the details and credits for a Series or an Anime from the TMDB API """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/tv/{self.API_id}?api_key={self.API_KEY}"
                                f"&append_to_response=credits", timeout=15)

        if not response.ok:
            resp_json = response.json()
            return abort(404, resp_json.get("status_message"))

        # Add data to instance attribute
        self.API_data = json.loads(response.text)

    def _from_API_to_dict(self, updating: bool = False):
        """ Fetch the wanted data from the TMDB API to the <all_data> dict """

        self.media_details = dict(
            name=self.API_data.get("name", "Unknown") or "Unknown",
            original_name=self.API_data.get("original_name", "Unknown") or "Unknown",
            first_air_date=self.API_data.get("first_air_date", "Unknown") or "Unknown",
            last_air_date=self.API_data.get("last_air_date", "Unknown") or "Unknown",
            homepage=self.API_data.get("homepage", "Unknown") or "Unknown",
            in_production=self.API_data.get("in_production", False) or False,
            total_seasons=self.API_data.get("number_of_seasons", 1) or 1,
            total_episodes=self.API_data.get("number_of_episodes", 1) or 1,
            status=self.API_data.get("status", "Unknown") or "Unknown",
            vote_average=self.API_data.get("vote_average", 0) or 0,
            vote_count=self.API_data.get("vote_count", 0) or 0,
            synopsis=self.API_data.get("overview", "Not defined.") or "Not defined.",
            popularity=self.API_data.get("popularity", 0) or 0,
            api_id=self.API_data.get("id"),
            last_update=datetime.utcnow(),
            image_cover=self._get_media_cover(),
            next_episode_to_air=None,
            season_to_air=None,
            episode_to_air=None,
            duration=self.DURATION,
            origin_country="Unknown",
            created_by="Unknown",
        )

        # Add <next_episode_to_air>
        next_episode_to_air = self.API_data.get("next_episode_to_air") or None
        if next_episode_to_air:
            self.media_details["next_episode_to_air"] = next_episode_to_air["air_date"]
            self.media_details["season_to_air"] = next_episode_to_air["season_number"]
            self.media_details["episode_to_air"] = next_episode_to_air["episode_number"]

        # Check <duration>
        duration = self.API_data.get("episode_run_time") or None
        if duration and float(duration[0]) != 0:
            self.media_details["duration"] = duration[0]

        # Check <origin_country>
        origin_country = self.API_data.get("origin_country") or None
        if origin_country:
            self.media_details["origin_country"] = origin_country[0]

        # Check <created_by>
        created_by = self.API_data.get("created_by") or None
        self.media_details["created_by"] = ", ".join(c["name"] for c in (created_by or self._get_writers()))

        # Add <seasons>
        seasons, seasons_list = self.API_data.get("seasons") or None, []
        if seasons:
            for season in seasons:
                # Remove special seasons
                if season["season_number"] <= 0:
                    continue
                seasons_list.append({"season": season["season_number"], "episodes": season["episode_count"]})
        else:
            seasons_list.append({"season": 1, "episodes": 1})

        # Add <networks>
        networks, networks_list = self.API_data.get("networks") or None, []
        if networks:
            for network in networks[:self.MAX_NETWORK]:
                networks_list.append({"network": network["name"]})
        else:
            networks_list.append({"network": "Unknown"})

        # Add <actors_list>, <actors_list> and <anime_genres_list>
        genres_list, actors_list, anime_genres_list = [], [], []
        if not updating:
            genres_list = self._get_genres()
            actors_list = self._get_actors()
            anime_genres_list = self._get_anime_genres()

        # Populate <all_data> attribute
        self.all_data = dict(
            media_data=self.media_details,
            seasons_data=seasons_list,
            genres_data=genres_list,
            anime_genres_data=anime_genres_list,
            actors_data=actors_list,
            networks_data=networks_list
        )

    def _get_anime_genres(self):
        """ The <_get_anime_genres> method is here only for consistency for the inherited class """
        return []

    def _get_writers(self) -> List[Dict]:
        """ Get the top two writers (selected by popularity) for the <created_by> field using the crew of the
        series/anime """

        tv_credits = self.API_data.get("credits") or None
        if not tv_credits:
            return [{"name": "Unknown"}]

        tv_crew = tv_credits.get("crew") or None
        if not tv_crew:
            return [{"name": "Unknown"}]

        creator_names = [member for member in tv_crew if member.get("department") == "Writing"
                         and member.get("known_for_department") == "Writing"]
        if not creator_names:
            return [{"name": "Unknown"}]

        return sorted(creator_names, key=lambda x: x.get("popularity", 0), reverse=True)[:2]


""" --- CLASS CALL ------------------------------------------------------------------------------------------ """

class ApiSeries(ApiTV):
    """ TMDB API class specifically for the Series """

    DURATION = 40
    GROUP = MediaType.SERIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/series_covers/")
    MAX_TRENDING = 12

    def get_and_format_trending(self) -> List[Dict]:
        """ Fetch and format <MAX_TRENDING> trending TV obtained from the TMDB API """

        # Make API call
        url = f"https://api.themoviedb.org/3/trending/tv/week?api_key={self.API_KEY}"
        API_data = requests.get(url, timeout=10).json()
        results = API_data.get("results", [])

        tv_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = {
                "api_id": result.get("id"),
                "overview": result.get("overview", "Unknown") or "Unknown",
                "release_date": change_air_format(result.get("first_air_date")),
                "display_name": result.get("name", "Unknown") or "Unknown",
                "media_type": MediaType.SERIES.value,
                "category": "Series/Anime"
            }

            # Get poster path
            poster_path = result.get("poster_path", url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            # Change <original_name> if latin
            if is_latin(result.get("original_name")):
                media_data["display_name"] = result.get("original_name")

            # Append results
            tv_results.append(media_data)

        return tv_results

    def _add_data_to_db(self):
        """ Add new series data to the database """

        # noinspection PyArgumentList
        self.media = Series(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Fallback (never anime genre for series) just for consistency
        if len(self.all_data["anime_genres_data"]) != 0:
            for genre in [{**item, "media_id": self.media.id} for item in self.all_data["anime_genres_data"]]:
                db.session.add(SeriesGenre(**genre))
        else:
            for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
                db.session.add(SeriesGenre(**genre))

        # Add actors
        for actor in [{**item, "media_id": self.media.id} for item in self.all_data["actors_data"]]:
            db.session.add(SeriesActors(**actor))

        # Add networks
        for network in [{**item, "media_id": self.media.id} for item in self.all_data["networks_data"]]:
            db.session.add(SeriesNetwork(**network))

        # Add episodes per season
        for season in [{**item, "media_id": self.media.id} for item in self.all_data["seasons_data"]]:
            db.session.add(SeriesEpisodesPerSeason(**season))


class ApiAnime(ApiTV):
    """ TMDB API class specifically for the Anime """

    DURATION = 24
    GROUP = MediaType.ANIME
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/anime_covers/")

    @staticmethod
    @sleep_and_retry
    @limits(calls=1, period=4)
    def api_anime_search(anime_name: str):
        """ Fetch the anime name from the TMDB API to the Jikan API. Then use the Jikan API to get more accurate
        genres with the <get_anime_genres> method """

        # Api call
        response = requests.get(f"https://api.jikan.moe/v4/anime?q={anime_name}", timeout=10)

        # Raise for status
        response.raise_for_status()

        return json.loads(response.text)

    def _get_anime_genres(self) -> List[Dict]:
        """ Get anime genre from the Jikan API (fusion between genre, themes and demographic) """

        anime_genres_list, anime_genres, anime_demographic, anime_themes = [], None, None, None
        try:
            # Search using Jikan API
            anime_search = self.api_anime_search(self.API_data.get("name"))

            # Add data
            anime_genres = anime_search["data"][0]["genres"]
            anime_demographic = anime_search["data"][0]["demographics"]
            anime_themes = anime_search["data"][0]["themes"]
        except Exception as e:
            current_app.logger.error(f"[ERROR] - Requesting the Jikan API: {e}")

        if anime_genres:
            for genre in anime_genres:
                anime_genres_list.append({"genre": genre["name"], "genre_id": int(genre["mal_id"])})
        if anime_demographic:
            for demo in anime_demographic:
                anime_genres_list.append({"genre": demo["name"], "genre_id": int(demo["mal_id"])})
        if anime_themes:
            for theme in anime_themes:
                anime_genres_list.append({"genre": theme["name"], "genre_id": int(theme["mal_id"])})

        return anime_genres_list

    def _add_data_to_db(self):
        """ Add the new Anime to the database """

        # noinspection PyArgumentList
        self.media = Anime(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Fallback on TMDB genres if problem with jikan API
        if len(self.all_data["anime_genres_data"]) > 0:
            for genre in [{**item, "media_id": self.media.id} for item in self.all_data["anime_genres_data"]]:
                db.session.add(AnimeGenre(**genre))
        else:
            for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
                db.session.add(AnimeGenre(**genre))

        # Add actors
        for actor in [{**item, "media_id": self.media.id} for item in self.all_data["actors_data"]]:
            db.session.add(AnimeActors(**actor))

        # Add networks
        for network in [{**item, "media_id": self.media.id} for item in self.all_data["networks_data"]]:
            db.session.add(AnimeNetwork(**network))

        # Add seasons per episodes
        for season in [{**item, "media_id": self.media.id} for item in self.all_data["seasons_data"]]:
            db.session.add(AnimeEpisodesPerSeason(**season))


class ApiMovies(ApiTMDB):
    """ TMDB API class specifically for the Movies """

    GROUP = MediaType.MOVIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/movies_covers")
    MAX_TRENDING = 12

    def get_changed_api_ids(self) -> set[int]:
        """ Fetch the IDs that changed in the last 24h from the TMDB API for Movies """

        response = requests.get(f"https://api.themoviedb.org/3/movie/changes?api_key={self.API_KEY}", timeout=10)
        response.raise_for_status()

        data = json.loads(response.text)
        all_api_ids = {d.get("id") for d in data.get("results", {})}

        return all_api_ids

    def get_and_format_trending(self) -> List[Dict]:
        """ Fetch and format <MAX_TRENDING> trending Series obtained from the TMDB API """

        # Make API call
        url = f"https://api.themoviedb.org/3/trending/movie/week?api_key={self.API_KEY}"
        API_data = requests.get(url, timeout=10).json()
        results = API_data.get("results", [])

        movies_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=result.get("overview", "Unknown") or "Unknown",
                release_date=change_air_format(result.get("release_date")),
                display_name=result.get("title", "Unknown") or "Unknown",
                media_type=MediaType.MOVIES.value,
                media_name="Movies",
            )

            # Get poster path
            poster_path = result.get("poster_path", url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            # Change <original_name> if latin
            if is_latin(result.get("original_title")):
                media_data["display_name"] = result.get("original_title")

            # Append results
            movies_results.append(media_data)

        return movies_results

    def _get_details_and_credits_data(self):
        """ Get the details and credits data for a Movie from TMDB API """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/movie/{self.API_id}?api_key={self.API_KEY}"
                                f"&append_to_response=credits", timeout=15)

        if not response.ok:
            resp_json = response.json()
            return abort(404, resp_json.get("status_message"))

        # Add data to instance attribute
        self.API_data = json.loads(response.text)

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict """

        self.media_details = dict(
            name=self.API_data.get("title", "Unknown") or "Unknown",
            original_name=self.API_data.get("original_title", "Unknown") or "Unknown",
            release_date=self.API_data.get("release_date", "Unknown") or "Unknown",
            homepage=self.API_data.get("homepage", "Unknown") or "Unknown",
            released=self.API_data.get("status", "Unknown") or "Unknown",
            vote_average=self.API_data.get("vote_average", 0) or 0,
            vote_count=self.API_data.get("vote_count", 0) or 0,
            synopsis=self.API_data.get("overview", "Not defined.") or "Not defined.",
            popularity=self.API_data.get("popularity", 0) or 0,
            budget=self.API_data.get("budget", 0) or 0,
            revenue=self.API_data.get("revenue", 0) or 0,
            tagline=self.API_data.get("tagline") or None,
            duration=self.API_data.get("runtime", 0) or 0,
            original_language=self.API_data.get("original_language", "Unknown") or "Unknown",
            api_id=self.API_data.get("id"),
            director_name="Unknown",
            image_cover=self._get_media_cover()
        )

        # Fetch <director_name> from crew
        all_crew = self.API_data.get("credits", {"crew": None}).get("crew") or None
        if all_crew:
            for crew in all_crew:
                if crew["job"] == "Director":
                    self.media_details["director_name"] = crew.get("name", "Unknown")
                    break

        # Create genres and actors list
        actors_list, genres_list = [], []
        if not updating:
            genres_list = self._get_genres()
            actors_list = self._get_actors()

        # Populate <all_data> attribute
        self.all_data = dict(
            media_data=self.media_details,
            genres_data=genres_list,
            actors_data=actors_list
        )

    def _add_data_to_db(self):
        """ Add the new movie data to the local database """

        # noinspection PyArgumentList, SQLAlchemy Bug
        self.media = Movies(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Add genres
        for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
            db.session.add(MoviesGenre(**genre))

        # Add actors
        for actor in [{**item, "media_id": self.media.id} for item in self.all_data["actors_data"]]:
            db.session.add(MoviesActors(**actor))


class ApiGames(ApiData):
    """ IGDB API class specifically for the Games """

    GROUP = MediaType.GAMES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/games_covers/")
    POSTER_BASE_URL = "https://images.igdb.com/igdb/image/upload/t_1080p/"
    CLIENT_IGDB = current_app.config["CLIENT_IGDB"]
    SECRET_IGDB = current_app.config["SECRET_IGDB"]
    API_KEY = current_app.config["IGDB_API_KEY"]

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.API_id = API_id
        self.query = []

        # Create specific IGDB header
        self.headers = {
            "Client-ID": self.CLIENT_IGDB,
            "Authorization": f"Bearer {self.API_KEY}"
        }

    @sleep_and_retry
    @limits(calls=4, period=1)
    def search(self, query: str, page: int = 1):
        """ Search game using the IGDB API. <page> attribute unused, here for consistency """

        # Request body
        offset = (page - 1) * 10
        data = (f'fields id, name, cover.image_id, first_release_date, storyline; limit 10; offset {offset}; '
                f'search "{query}";')

        # API call
        response = requests.post("https://api.igdb.com/v4/games", data=data, headers=self.headers, timeout=10)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = {
            "results": json.loads(response.text),
            "total": int(response.headers.get("X-Count", 0))
        }

    def create_search_results(self) -> Dict:
        """ Get generate search list as dict """

        # Check API results
        search_results = []
        for result in self.API_data.get("results", []) or []:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            media_details = dict(
                api_id=result.get("id"),
                name=result.get("name"),
                media_type=MediaType.GAMES.value,
                image_cover=url_for("static", filename="covers/default.jpg"),
                date=change_air_format(result.get("first_release_date"), games=True),
            )

            if result.get("cover"):
                media_details["image_cover"] = f"{self.POSTER_BASE_URL}{result['cover']['image_id']}.jpg"

            # Append to media results
            search_results.append(media_details)

        data = dict(
            items=search_results,
            total=self.API_data.get("total"),
            pages=self.API_data.get("total") // self.RESULTS_PER_PAGE,
        )

        return data

    def _get_details_and_credits_data(self):
        """ Get details and credits data from IGDB API """

        # Create body query for IGDB API
        body = f"fields name, cover.image_id, collection.name, game_engines.name, game_modes.name, " \
               f"platforms.name, genres.name, player_perspectives.name, total_rating, total_rating_count, " \
               f"first_release_date, involved_companies.company.name, involved_companies.developer, " \
               f"involved_companies.publisher, storyline, summary, themes.name, url, external_games.uid, " \
               f"external_games.category; where id={self.API_id};"

        # API call
        response = requests.post("https://api.igdb.com/v4/games", data=body, headers=self.headers, timeout=15)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)[0]

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to database """

        self.media_details = dict(
            name=self.API_data.get("name", "Unknown") or "Unknown",
            release_date=self.API_data.get("first_release_date", "Unknown") or "Unknown",
            IGDB_url=self.API_data.get("url", "Unknown") or "Unknown",
            vote_average=self.API_data.get("total_rating", 0) or 0,
            vote_count=self.API_data.get("total_rating_count", 0) or 0,
            synopsis=self.API_data.get("summary", "No synopsis found.") or "No synopsis found.",
            storyline=self.API_data.get("storyline", "No storyline found.") or "No storyline found.",
            collection_name=self.API_data.get("collection", {"name": "Unknown"})["name"] or "Unknown",
            game_engine=self.API_data.get("game_engines", [{"name": "Unknown"}])[0]["name"] or "Unknown",
            player_perspective=self.API_data.get("player_perspectives", [{"name": "Unknown"}])[0]["name"] or "Unknown",
            game_modes=",".join([x["name"] for x in self.API_data.get("game_modes", [{"name": "Unknown"}])]),
            api_id=self.API_data.get("id"),
            image_cover=self._get_media_cover(),
            hltb_main_time=None,
            hltb_main_and_extra_time=None,
            hltb_total_complete_time=None,
        )

        # Get HLTB times
        hltb_time = self._get_HLTB_time(self.media_details["name"])

        # Populate <media_details> with HLTB data
        self.media_details["hltb_main_time"] = hltb_time["main"]
        self.media_details["hltb_main_and_extra_time"] = hltb_time["extra"]
        self.media_details["hltb_total_complete_time"] = hltb_time["completionist"]

        # Add companies, genres (fusion with themes), and platforms
        companies_list, fusion_list, platforms_list = [], [], []
        if not updating:
            # Platform list
            platforms: List = self.API_data.get("platforms") or None
            if platforms:
                for platform in platforms:
                    platforms_list.append({"name": platform["name"]})
            else:
                platforms_list.append({"name": "Unknown"})

            # Companies list
            companies: List = self.API_data.get("involved_companies") or None
            if companies:
                for company in companies:
                    companies_list.append({
                        "name": company["company"]["name"],
                        "publisher": company["publisher"],
                        "developer": company["developer"]
                    })
            else:
                companies_list.append({"name": "Unknown", "publisher": False, "developer": False})

            # Genres list
            genres_list = []
            genres: List = self.API_data.get("genres") or None
            if genres:
                genres_list = [{"genre": genre["name"]} for genre in genres]

            # Themes list
            themes_list = []
            themes: List = self.API_data.get("themes") or None
            if themes:
                themes_list = [{"genre": theme["name"]} for theme in themes]

            fusion_list = genres_list + themes_list
            if len(fusion_list) == 0:
                fusion_list.append({"genre": "Unknown"})

        # Populate dict attribute
        self.all_data = dict(
            media_data=self.media_details,
            companies_data=companies_list,
            genres_data=fusion_list,
            platforms_data=platforms_list
        )

    def _add_data_to_db(self):
        """ Add the game to the local database """

        # noinspection PyArgumentList
        self.media = Games(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Modify genres/themes and add genres
        for genre in self.all_data["genres_data"]:
            if genre["genre"] == "4X (explore, expand, exploit, and exterminate)":
                genre["genre"] = "4X"
            elif genre["genre"] == "Hack and slash/Beat 'em up":
                genre["genre"] = "Hack and Slash"
            elif genre["genre"] == "Card & Board Game":
                genre["genre"] = "Card Game"
            elif genre["genre"] == "Quiz/Trivia":
                genre["genre"] = "Quiz"
            genre.update({"media_id": self.media.id})
            db.session.add(GamesGenre(**genre))

        # Add company
        for company in [{**item, "media_id": self.media.id} for item in self.all_data["companies_data"]]:
            db.session.add(GamesCompanies(**company))

        # Add platform
        for platform in [{**item, "media_id": self.media.id} for item in self.all_data["platforms_data"]]:
            db.session.add(GamesPlatforms(**platform))

    def _save_api_cover(self, cover_path: str, cover_name: str):
        """ Save game cover using the IGDB API """

        # Create specific header
        headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) "
                                 "Chrome/23.0.1271.64 Safari/537.11",
                   "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                   "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
                   "Accept-Encoding": "none",
                   "Accept-Language": "en-US,en;q=0.8",
                   "Connection": "keep-alive"}

        # Create request
        request_ = Request(url=f"{self.POSTER_BASE_URL}{cover_path}.jpg", headers=headers)

        # Fetch response
        response = request.urlopen(request_)

        # Write cover to disk
        f = open(f"{self.LOCAL_COVER_PATH}/{cover_name}", "wb")
        f.write(response.read())
        f.close()

        # Resize image using PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}")
        img = img.resize((300, 450), Resampling.LANCZOS)
        img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        """ Get the game cover """

        cover_name = "default.jpg"
        cover_path = self.API_data.get("cover")["image_id"] or None
        if cover_path:
            cover_name = f"{secrets.token_hex(8)}.jpg"
            try:
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Trying to fetch the game poster: {e}")
                cover_name = "default.jpg"

        return cover_name

    def update_API_key(self):
        """ Method to update the IGDB API key every month. The backend needs to restart to update the env variable. """

        import dotenv

        try:
            response = requests.post(f"https://id.twitch.tv/oauth2/token?client_id={self.CLIENT_IGDB}&"
                                     f"client_secret={self.SECRET_IGDB}&grant_type=client_credentials", timeout=10)

            response.raise_for_status()
            data = json.loads(response.text)
            new_IGDB_token = data.get("access_token") or None

            if not new_IGDB_token:
                current_app.logger.error("[ERROR] - trying to obtain the new IGDB token.")
                return

            # Write new IGDB API KEY to <.env> file
            dotenv_file = dotenv.find_dotenv()
            dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_IGDB_token)

        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"[ERROR] - Request to IGDB API failed to update the API Key: {e}")
        except Exception as e:
            current_app.logger.error(f"[ERROR] - {e}")

    @staticmethod
    def _get_HLTB_time(game_name: str) -> Dict:
        """ Fetch the HLTB time using the HowLongToBeat scraping API """

        # Get matching games in list
        games_list = HowLongToBeat().search(game_name.lower(), similarity_case_sensitive=False)

        # Check <games_list>
        main, extra, completionist = None, None, None
        if games_list and len(games_list) > 0:
            # Fetch game with max similarity
            game = max(games_list, key=lambda x: x.similarity)

            main = game.main_story
            extra = game.main_extra
            completionist = game.completionist

        # Create dict
        data = dict(
            main=main,
            extra=extra,
            completionist=completionist,
        )

        return data


class ApiBooks(ApiData):
    """ Google Books API class specifically for the Books """

    GROUP = MediaType.BOOKS
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/books_covers/")

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.query = []
        self.API_id = API_id
        self.default_path = url_for("static", filename="/covers/default.jpg")

    @sleep_and_retry
    @limits(calls=2, period=1)
    def search(self, query: str, page: int = 1):
        """ Search a book using the Google Books API. """

        # Request body
        offset = (page - 1) * 10

        # API call
        response = requests.get(f"https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={offset}",
                                timeout=10)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)

    def create_search_results(self) -> Dict:
        """ Create the search list """

        media_results = []
        total_items = self.API_data.get("totalItems")
        if total_items and total_items > 0:
            for result in self.API_data["items"]:
                info = result["volumeInfo"]
                media_details = dict(
                    api_id=result.get("id"),
                    name=info.get("title", "Unknown") or "Unknown",
                    author=info.get("authors", ["Unknown"])[0] or "Unknown",
                    image_cover=info.get("imageLinks", {"thumbnail": self.default_path})["thumbnail"] or "Unknown",
                    date=change_air_format(info.get("publishedDate"), books=True),
                    media_type=MediaType.BOOKS.value,
                )

                # Append data to list
                media_results.append(media_details)

        # Get total results
        total_results = self.API_data.get("totalItems")
        try:
            total_pages = total_results // 10
        except:
            total_pages = 1

        data = dict(
            items=media_results,
            total=total_results,
            pages=total_pages,
        )

        return data

    @sleep_and_retry
    @limits(calls=2, period=1)
    def _get_details_and_credits_data(self):
        """ Get details and credits for books """

        # API call
        response = requests.get(f"https://www.googleapis.com/books/v1/volumes/{self.API_id}", timeout=10)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)["volumeInfo"]

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to local database """

        self.media_details = dict(
            name=self.API_data.get("title", "Unknown") or "Unknown",
            release_date=change_air_format(self.API_data.get("publishedDate"), books=True),
            pages=self.API_data.get("pageCount", 0) or 0,
            publishers=self.API_data.get("publisher", "Unknown") or "Unknown",
            synopsis=clean_html_text(self.API_data.get("description", "Unknown")),
            language=self.API_data.get("language", "Unknown") or "Unknown",
            api_id=self.API_id,
            image_cover=self._get_media_cover(),
            lock_status=True
        )

        # Get authors
        authors, authors_list = self.API_data.get("authors") or None, []
        if authors:
            for author in authors:
                authors_list.append({"name": author})
        else:
            authors_list.append({"name": "Unknown"})

        # No genres in google books API :(
        genres_list = [{"genre": "Unknown"}]

        # Populate instance attribute
        self.all_data = dict(
            media_data=self.media_details,
            genres_data=genres_list,
            authors_data=authors_list
        )

    def _add_data_to_db(self):
        """ Add the new book data to the local database """

        # noinspection PyArgumentList, SQLAlchemy bug
        self.media = Books(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Add genres
        for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
            db.session.add(BooksGenre(**genre))

        # Add authors
        for author in [{**item, "media_id": self.media.id} for item in self.all_data["authors_data"]]:
            db.session.add(BooksAuthors(**author))

    def _save_api_cover(self, cover_path: str, cover_name: str):
        """ Save API book cover to the local disk """

        # Retrieve cover
        urlretrieve(f"{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")

        # Resize and save with PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}")
        img = img.resize((300, 450), Resampling.LANCZOS)
        img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        """ Get media cover, from Google Books API or using Google Image script in /static """

        cover_name = f"{secrets.token_hex(8)}.jpg"
        try:
            self._save_api_cover(self.API_data["imageLinks"]["medium"], cover_name)
        except:
            try:
                self._save_api_cover(self.API_data["imageLinks"]["large"], cover_name)
            except:
                from backend.api.static.books_img_ddl.books import GoogleImages

                # Get google image class
                book_image_ddl = GoogleImages()

                # Get arguments
                arguments = dict(
                    keywords=f"cover {self.API_data['title']} {self.API_data['authors'][0]}",
                    output_directory=str(self.LOCAL_COVER_PATH),
                    size="medium",
                )

                try:
                    # Try to download image from arguments
                    all_paths = book_image_ddl.download(arguments)
                    path = all_paths[0]["image"][-1]

                    # Resize and save image with PIL
                    img = Image.open(path)
                    img = img.resize((300, 450), Resampling.LANCZOS)
                    img.save(path)

                    # Get cover name
                    cover_name = os.path.basename(path)
                except:
                    cover_name = "default.jpg"

        return cover_name
