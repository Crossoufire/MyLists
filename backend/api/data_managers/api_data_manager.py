from __future__ import annotations
import json
import os.path
import secrets
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Type, Literal, Optional
from urllib import request
import requests
from PIL import Image
from flask import url_for, current_app, abort
from howlongtobeatpy import HowLongToBeat
from ratelimit import sleep_and_retry, limits
from requests import Response
from backend.api import db
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import change_air_format, get_models_group, clean_html_text, get, is_latin

""" --- GENERAL --------------------------------------------------------------------------------------------- """


class ApiData:
    """ Main class to manipulate the different APIs """

    GROUP: MediaType
    POSTER_BASE_URL: str
    LOCAL_COVER_PATH: str
    API_KEY: str
    DURATION: int
    RESULTS_PER_PAGE: int = 7

    def __init__(self, API_id: Optional[int, str] = None):
        """ Initialize the ApiData instance with its optional API ID """

        self.API_id = API_id
        self.media: db.Model = None
        self.media_details = {}
        self.API_data = {}
        self.all_data = {}

    def save_media_to_db(self) -> db.Model:
        """ Save the media data to the database and return the main media data """

        self._fetch_details_from_API()
        self._from_API_to_dict()
        self._add_data_to_db()

        return self.media

    def update_media_data(self) -> Dict:
        """ Update the media data and return a dict containing the data """

        self._fetch_details_from_API()
        self._from_API_to_dict(updating=True)

        return self.all_data

    def get_changed_api_ids(self) -> List:
        """ Get the changed API IDs for Series, Anime, Movies, and Games. Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")

    def _fetch_details_from_API(self):
        """ Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")

    def _from_API_to_dict(self, updating: bool = False):
        """ Overwritten in inherited class """
        raise NotImplementedError("Subclasses must implement this method.")

    def _add_data_to_db(self):
        """ Add the new Series/Anime/Movies/Games/Books data to the database """

        models = get_models_group(self.GROUP, "all")

        # Add main media data
        self.media = models[ModelTypes.MEDIA](**self.all_data["media_data"])
        db.session.add(self.media)
        db.session.commit()

        # Create related data dict
        related_data = {
            models.get(ModelTypes.GENRE): self.all_data.get("genres_data", []),
            models.get(ModelTypes.ACTORS): self.all_data.get("actors_data", []),
            models.get(ModelTypes.NETWORK): self.all_data.get("networks_data", []),
            models.get(ModelTypes.EPS): self.all_data.get("seasons_data", []),
            models.get(ModelTypes.COMPANIES): self.all_data.get("companies_data", []),
            models.get(ModelTypes.PLATFORMS): self.all_data.get("platforms_data", []),
            models.get(ModelTypes.AUTHORS): self.all_data.get("authors_data", []),
        }

        # Add to DB each related data
        for model, data_list in related_data.items():
            for item in data_list:
                item["media_id"] = self.media.id
                db.session.add(model(**item))

    @classmethod
    def _find_subclass(cls, media_type: MediaType, subclass: Type['ApiData']) -> Type['ApiData'] | None:
        """ Recursively search for subclass matching the <media_type> """

        if hasattr(subclass, "GROUP") and subclass.GROUP == media_type:
            return subclass

        for sub_subclass in subclass.__subclasses__():
            result = cls._find_subclass(media_type, sub_subclass)
            if result:
                return result

        return None

    @classmethod
    def get_API_class(cls, media_type: MediaType) -> Type['ApiData']:
        """ Get appropriate inherited class depending on <media_type> """

        for subclass in cls.__subclasses__():
            result = cls._find_subclass(media_type, subclass)
            if result:
                return result

        raise ValueError(f"No subclass found for media type: {media_type.value}")

    @staticmethod
    def call_api(url: str, method: Literal["get", "post"] = "get", **kwargs) -> Response:
        try:
            response = getattr(requests, method)(url, **kwargs, timeout=10)
        except requests.exceptions.RequestException as error:
            if error.response is not None:
                return abort(error.response.status_code, error.response.reason)
            else:
                return abort(500, "An unexpected error occurred trying to fetch the data. Please try again later.")

        return response


class ApiTMDB(ApiData):
    """ TMDB API class for Series, Anime and Movies """

    POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300"
    API_KEY = current_app.config["THEMOVIEDB_API_KEY"]
    MAX_TRENDING = 12
    MAX_RESULTS = 20
    MAX_ACTORS = 5

    def __init__(self, API_id: int = None):
        super().__init__(API_id)
        self.API_id = API_id

    def search(self, query: str, page: int = 1):
        """ Search in the TMDB API (series, anime, and movies) """

        response = self.call_api(f"https://api.themoviedb.org/3/search/multi?api_key={self.API_KEY}"
                                 f"&query={query}&page={page}")

        self.API_data = response.json()

    def create_search_results(self) -> Dict:
        """ Create the search results dict """

        data_passed = 0
        search_results = []
        API_results = get(self.API_data, "results", default=[])
        for result in API_results[:self.MAX_RESULTS]:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            # Continue if not Movies, Series or Anime
            if result.get("known_for_department"):
                data_passed += 1
                continue

            media_info = dict(
                api_id=result.get("id"),
                image_cover=url_for("static", filename="covers/default.jpg"),
            )

            if result.get("poster_path"):
                media_info["image_cover"] = self.POSTER_BASE_URL + result.get("poster_path")

            if result.get("media_type") == "tv":
                media_info.update(self._process_tv(result))
            elif result.get("media_type") == "movie":
                media_info.update(self._process_movie(result))

            search_results.append(media_info)

        total = self.API_data.get("total_results", 0) - data_passed
        pages = total // self.RESULTS_PER_PAGE

        search_dict = dict(
            items=search_results,
            total=total,
            pages=pages,
        )

        return search_dict

    def get_changed_api_ids(self) -> List:
        """ Fetch the IDs that changed in the last 24h from the TMDB API for Series and Anime """

        type_ = "movie" if self.GROUP == MediaType.MOVIES else "tv"
        model = get_models_group(self.GROUP, ModelTypes.MEDIA)

        response = self.call_api(f"https://api.themoviedb.org/3/{type_}/changes?api_key={self.API_KEY}")
        data = json.loads(response.text)

        changed_api_ids = {d.get("id") for d in data.get("results", {})}
        api_ids_in_db = {m[0] for m in db.session.query(model.api_id).filter(model.lock_status != True)}
        api_ids_to_refresh = list(api_ids_in_db.intersection(changed_api_ids))

        return api_ids_to_refresh

    def _fetch_details_from_API(self):
        """ Get the details and credits data for a Movie from TMDB API """

        type_ = "movie" if self.GROUP == MediaType.MOVIES else "tv"
        response = self.call_api(f"https://api.themoviedb.org/3/{type_}/{self.API_id}?api_key={self.API_KEY}"
                                 f"&append_to_response=credits")
        self.API_data = json.loads(response.text)

    def _get_genres(self) -> List[Dict]:
        """ Fetch the series, anime, or movies genres (fallback for anime if Jikan API bug) """

        genres_list = []
        all_genres = get(self.API_data, "genres", default=[])
        for genre in all_genres:
            genres_list.append({"genre": genre["name"], "genre_id": int(genre["id"])})
        if not genres_list:
            genres_list = [{"genre": "Unknown", "genre_id": 0}]

        return genres_list

    def _get_actors(self) -> List[Dict]:
        """ Get the <MAX_ACTORS> actors for series, anime and movies """

        actors_list = []
        all_actors = get(self.API_data, "credits", "cast", default=[])
        for actor in all_actors[:self.MAX_ACTORS]:
            actors_list.append({"name": actor["name"]})
        if not actors_list:
            actors_list = [{"name": "Unknown"}]

        return actors_list

    def _get_media_cover(self) -> str:
        """ Create a name for the media image cover or fallback on the <default.jpg> """

        cover_name = "default.jpg"
        cover_path = self.API_data.get("poster_path") or None
        if cover_path:
            cover_name = f"{secrets.token_hex(12)}.jpg"
            try:
                request.urlretrieve(f"{self.POSTER_BASE_URL}{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")
                with Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}") as img:
                    img = img.resize((300, 450), Image.Resampling.LANCZOS)
                    img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Trying to recover the cover: {e}")
                cover_name = "default.jpg"

        return cover_name

    @staticmethod
    def _process_tv(result):
        """ Process TV data (Series/Anime from TMDB) """

        media_info = {
            "media_type": MediaType.SERIES.value,
            "date": change_air_format(result.get("first_air_date")),
            "name": result.get("original_name") if is_latin(result.get("original_name")) else result.get("name")
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


class ApiTV(ApiTMDB):
    """ TMDB API class specifically for Series/Anime """

    MAX_NETWORK = 4

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform the TMDB API data to dict to add to the local database """

        self.media_details = dict(
            name=get(self.API_data, "name", default="Unknown"),
            original_name=get(self.API_data, "original_name", default="Unknown"),
            first_air_date=get(self.API_data, "first_air_date", default="Unknown"),
            last_air_date=get(self.API_data, "last_air_date", default="Unknown"),
            homepage=get(self.API_data, "homepage", default="Unknown"),
            in_production=get(self.API_data, "in_production", default=False),
            total_seasons=get(self.API_data, "number_of_seasons", default=1),
            total_episodes=get(self.API_data, "number_of_episodes", default=1),
            status=get(self.API_data, "status", default="Unknown"),
            vote_average=get(self.API_data, "vote_average", default=0),
            vote_count=get(self.API_data, "vote_count", default=0),
            synopsis=get(self.API_data, "overview", default="Undefined"),
            popularity=get(self.API_data, "popularity", default=0),
            duration=get(self.API_data, "episode_run_time", 0, default=self.DURATION),
            origin_country=get(self.API_data, "origin_country", 0, default="Unknown"),
            created_by=", ".join(cr["name"] for cr in (self.API_data.get("created_by") or self._get_writers())),
            api_id=self.API_data["id"],
            last_api_update=datetime.utcnow(),
            image_cover=self._get_media_cover(),
            next_episode_to_air=None,
            season_to_air=None,
            episode_to_air=None,
        )

        # Add <next_episode_to_air>, <season_to_air>, and <episode_to_air>
        next_episode_to_air = self.API_data.get("next_episode_to_air")
        if next_episode_to_air:
            self.media_details["next_episode_to_air"] = next_episode_to_air["air_date"]
            self.media_details["season_to_air"] = next_episode_to_air["season_number"]
            self.media_details["episode_to_air"] = next_episode_to_air["episode_number"]

        # Add <seasons>
        seasons_list = []
        seasons = get(self.API_data, "seasons", default=[])
        for season in seasons:
            if season.get("season_number", 0) > 0:
                seasons_list.append({"season": season["season_number"], "episodes": season["episode_count"]})
        if not seasons_list:
            seasons_list.append({"season": 1, "episodes": 1})

        # Add <networks>
        networks_list = []
        networks = get(self.API_data, "networks", default=[])
        for network in networks[:self.MAX_NETWORK]:
            networks_list.append({"network": network["name"]})
        if not networks_list:
            networks_list.append({"network": "Unknown"})

        # Add <genres_list>, <actors_list> and <anime_genres_list>
        genres_list, actors_list, anime_genres_list = (self._get_genres(), self._get_actors(),
                                                       self._get_anime_genres()) if not updating else ([], [], [])

        # Populate <all_data> attribute
        self.all_data = dict(
            media_data=self.media_details,
            seasons_data=seasons_list,
            genres_data=genres_list,
            anime_genres_data=anime_genres_list,
            actors_data=actors_list,
            networks_data=networks_list,
        )

    def _get_anime_genres(self):
        """ This method is only for the <Anime> and not the <Series>. Overridden in the <ApiAnime> class """
        return []

    def _get_writers(self) -> List[Dict]:
        """ Get the top two writers (selected by popularity) for the <created_by> field using the crew of the
        series/anime """

        tv_crew = get(self.API_data, "credits", "crew", default=[])

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

    def get_and_format_trending(self) -> List[Dict]:
        """ Fetch and format <MAX_TRENDING> trending TV obtained from the TMDB API """

        response = self.call_api(f"https://api.themoviedb.org/3/trending/tv/week?api_key={self.API_KEY}")
        API_data = response.json()
        results = get(API_data, "results", default=[])

        tv_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview", default="Unknown"),
                display_name=get(result, "name", default="Unknown"),
                release_date=change_air_format(result.get("first_air_date")),
                media_type=MediaType.SERIES.value,
                category="Series/Anime"
            )

            # Get poster path
            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            # Change <original_name> if latin
            if is_latin(result.get("original_name")):
                media_data["display_name"] = result.get("original_name")

            # Append results
            tv_results.append(media_data)

        return tv_results


class ApiAnime(ApiTV):
    """ TMDB API class specifically for the Anime """

    DURATION = 24
    GROUP = MediaType.ANIME
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/anime_covers/")

    @sleep_and_retry
    @limits(calls=1, period=4)
    def api_anime_search(self, anime_name: str):
        """ Fetch the anime name from the TMDB API to the Jikan API. Then use the Jikan API to get more accurate
        genres with the <get_anime_genres> method """

        response = self.call_api(f"https://api.jikan.moe/v4/anime?q={anime_name}")
        return json.loads(response.text)

    def _get_anime_genres(self) -> List[Dict]:
        """ Get anime genre from the Jikan API (fusion between genre, themes and demographic) """

        anime_genres_list = []
        try:
            # Search using Jikan API
            anime_search = self.api_anime_search(self.API_data["name"])

            # Extract data
            anime_genres = anime_search["data"][0]["genres"]
            anime_demographic = anime_search["data"][0]["demographics"]
            anime_themes = anime_search["data"][0]["themes"]

            # Combine and iterate
            for data_list in (anime_genres, anime_demographic, anime_themes):
                for item in data_list:
                    anime_genres_list.append({"genre": item["name"], "genre_id": int(item["mal_id"])})
        except Exception as e:
            current_app.logger.error(f"[ERROR] - Requesting the Jikan API: {e}")

        return anime_genres_list


class ApiMovies(ApiTMDB):
    """ TMDB API class specifically for the Movies """

    DURATION = 90
    GROUP = MediaType.MOVIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/movies_covers")

    def get_and_format_trending(self) -> List[Dict]:
        """ Fetch and format <MAX_TRENDING> trending Series obtained from the TMDB API """

        response = self.call_api(f"https://api.themoviedb.org/3/trending/movie/week?api_key={self.API_KEY}")
        API_data = response.json()
        results = get(API_data, "results", default=[])

        movies_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview", default="Unknown"),
                display_name=get(result, "title", default="Unknown"),
                release_date=change_air_format(result.get("release_date")),
                media_type=MediaType.MOVIES.value,
                media_name="Movies",
            )

            # Get poster path
            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            # Change <original_name> if latin
            if is_latin(result.get("original_title")):
                media_data["display_name"] = result.get("original_title")

            # Append results
            movies_results.append(media_data)

        return movies_results

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict """

        self.media_details = dict(
            name=get(self.API_data, "title", default="Unknown"),
            original_name=get(self.API_data, "original_title", default="Unknown"),
            release_date=get(self.API_data, "release_date", default="Unknown"),
            homepage=get(self.API_data, "homepage", default="Unknown"),
            released=get(self.API_data, "status", default="Unknown"),
            vote_average=get(self.API_data, "vote_average", default=0),
            vote_count=get(self.API_data, "vote_count", default=0),
            synopsis=get(self.API_data, "overview", default="Undefined"),
            popularity=get(self.API_data, "popularity", default=0),
            budget=get(self.API_data, "budget", default=0),
            revenue=get(self.API_data, "revenue", default=0),
            duration=get(self.API_data, "runtime", default=self.DURATION),
            original_language=get(self.API_data, "original_language", default="Unknown"),
            tagline=self.API_data.get("tagline"),
            api_id=self.API_data.get("id"),
            director_name="Unknown",
            image_cover=self._get_media_cover(),
            last_api_update=datetime.utcnow(),
        )

        # Fetch <director_name> from crew
        all_crew = get(self.API_data, "credits", "crew", default=[])
        for crew in all_crew:
            if crew.get("job") == "Director":
                self.media_details["director_name"] = get(crew, "name", default="Unknown")
                break

        # Add <actors_list>, and <genres_list>
        actors_list, genres_list = (self._get_actors(), self._get_genres()) if not updating else ([], [])

        # Populate <all_data> attribute
        self.all_data = dict(
            media_data=self.media_details,
            genres_data=genres_list,
            actors_data=actors_list
        )


class ApiGames(ApiData):
    """ IGDB API class specifically for the Games """

    GROUP = MediaType.GAMES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/games_covers/")
    POSTER_BASE_URL = "https://images.igdb.com/igdb/image/upload/t_1080p/"
    API_KEY = current_app.config["IGDB_API_KEY"]
    CLIENT_IGDB = current_app.config["CLIENT_IGDB"]
    SECRET_IGDB = current_app.config["SECRET_IGDB"]

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
        """ Search game using the IGDB API """

        # Request body
        data = (f'fields id, name, cover.image_id, first_release_date, storyline; limit 10; offset {(page - 1) * 10}; '
                f'search "{query}";')

        response = self.call_api("https://api.igdb.com/v4/games", method="post", data=data, headers=self.headers)

        # Populate attribute
        self.API_data = {
            "results": json.loads(response.text),
            "total": int(response.headers.get("X-Count", 0))
        }

    def create_search_results(self) -> Dict:
        """ Get generate search results """

        # Check API results
        search_results = []
        API_results = get(self.API_data, "results", default=[])
        for result in API_results:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            media_details = dict(
                api_id=result.get("id"),
                name=get(result, "name", default="Unknown"),
                image_cover=url_for("static", filename="covers/default.jpg"),
                date=change_air_format(result.get("first_release_date"), games=True),
                media_type=MediaType.GAMES.value,
            )

            cover = get(result, "cover", "image_id")
            if cover:
                media_details["image_cover"] = f"{self.POSTER_BASE_URL}{cover}.jpg"

            # Append to media results
            search_results.append(media_details)

        data = dict(
            items=search_results,
            total=self.API_data.get("total", 0),
            pages=self.API_data.get("total", 0) // self.RESULTS_PER_PAGE,
        )

        return data

    def _fetch_details_from_API(self):
        """ Get details and credits data from IGDB API """

        # Create body query for IGDB API
        body = f"fields name, cover.image_id, collection.name, game_engines.name, game_modes.name, " \
               f"platforms.name, genres.name, player_perspectives.name, total_rating, total_rating_count, " \
               f"first_release_date, involved_companies.company.name, involved_companies.developer, " \
               f"involved_companies.publisher, storyline, summary, themes.name, url, external_games.uid, " \
               f"external_games.category; where id={self.API_id};"

        response = self.call_api("https://api.igdb.com/v4/games", "post", data=body, headers=self.headers)
        self.API_data = json.loads(response.text)[0]

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to database """

        print(self.API_data)

        self.media_details = dict(
            name=get(self.API_data, "name", default="Unknown"),
            release_date=get(self.API_data, "first_release_date", default="Unknown"),
            IGDB_url=get(self.API_data, "url", default="Unknown"),
            vote_average=get(self.API_data, "total_rating", default=0),
            vote_count=get(self.API_data, "total_rating_count", default=0),
            synopsis=get(self.API_data, "summary", default="Undefined"),
            storyline=get(self.API_data, "storyline", default="Undefined"),
            collection_name=get(self.API_data, "collection", "name", default="Unknown"),
            game_engine=get(self.API_data, "game_engines", 0, "name", default="Unknown"),
            player_perspective=get(self.API_data, "player_perspectives", 0, "name", default="Unknown"),
            game_modes=",".join([g["name"] for g in get(self.API_data, "game_modes", default=[{"name": "Unknown"}])]),
            api_id=self.API_data.get("id"),
            last_api_update=datetime.utcnow(),
            image_cover=self._get_media_cover(),
            hltb_main_time=None,
            hltb_main_and_extra_time=None,
            hltb_total_complete_time=None,
        )

        # Get HLTB times
        hltb_time = self._get_HLTB_time(self.media_details["name"])
        self.media_details["hltb_main_time"] = hltb_time["main"]
        self.media_details["hltb_main_and_extra_time"] = hltb_time["extra"]
        self.media_details["hltb_total_complete_time"] = hltb_time["completionist"]

        # Add companies, genres + themes, and platforms
        companies_list, fusion_list, platforms_list = [], [], []
        if not updating:
            platforms = get(self.API_data, "platforms", default=[{"name": "Unknown"}])
            platforms_list = [{"name": pf["name"]} for pf in platforms]

            companies = get(self.API_data, "involved_companies",
                            default=[{"company": {"name": "Unknown"}, "publisher": True, "developer": True}])
            companies_list = [{
                "name": company["company"]["name"],
                "publisher": company["publisher"],
                "developer": company["developer"],
            } for company in companies]

            genres = get(self.API_data, "genres", default=[{"name": "Unknown"}])
            genres_list = [{"genre": genre["name"]} for genre in genres]

            themes = get(self.API_data, "themes", default=[{"name": "Unknown"}])
            themes_list = [{"genre": theme["name"]} for theme in themes]

            fusion_list = genres_list + themes_list or [{"genre": "Unknown"}]

            # Rename some genres/themes
            genre_mapping = {
                "4X (explore, expand, exploit, and exterminate)": "4X",
                "Hack and slash/Beat 'em up": "Hack and Slash",
                "Card & Board Game": "Card Game",
                "Quiz/Trivia": "Quiz"
            }

            for data in fusion_list:
                data["genre"] = genre_mapping.get(data["genre"], data["genre"])

        self.all_data = dict(
            media_data=self.media_details,
            companies_data=companies_list,
            genres_data=fusion_list,
            platforms_data=platforms_list
        )

    def _save_api_cover(self, cover_path: str, cover_name: str):
        """ Save game cover using the IGDB API """

        # Create specific header
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) "
                          "Chrome/23.0.1271.64 Safari/537.11",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
            "Accept-Encoding": "none",
            "Accept-Language": "en-US,en;q=0.8",
            "Connection": "keep-alive",
        }

        # Create request
        request_ = request.Request(url=f"{self.POSTER_BASE_URL}{cover_path}.jpg", headers=headers)

        # Fetch response
        with request.urlopen(request_) as response:
            image_data = response.read()

        # Open image from binary data
        with Image.open(BytesIO(image_data)) as img:
            img_resized = img.resize((300, 450), resample=Image.Resampling.LANCZOS)
            img_resized.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        """ Get the game cover """

        cover_name = "default.jpg"
        cover_path = self.API_data.get("cover")["image_id"] or None
        if cover_path:
            cover_name = f"{secrets.token_hex(12)}.jpg"
            try:
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Trying to fetch the game poster: {e}")
                cover_name = "default.jpg"

        return cover_name

    def update_API_key(self):
        """ Method to update the IGDB API key every month. Backend needs to restart to update the env variable """

        import dotenv

        try:
            response = self.call_api(f"https://id.twitch.tv/oauth2/token?client_id={self.CLIENT_IGDB}&"
                                     f"client_secret={self.SECRET_IGDB}&grant_type=client_credentials", method="post")
            data = json.loads(response.text)
            new_IGDB_token = data.get("access_token")

            if not new_IGDB_token:
                current_app.logger.error("[ERROR] - Failed to obtain the new IGDB token.")
                return

            # Write new IGDB API KEY to <.env> file
            dotenv_file = dotenv.find_dotenv()
            dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_IGDB_token)
        except (requests.exceptions.RequestException, Exception) as e:
            current_app.logger.error(f"[ERROR] - An error occurred: {e}")

    def get_changed_api_ids(self) -> List:
        """ Get the changed API IDs """

        model = get_models_group(self.GROUP, ModelTypes.MEDIA)

        all_games = model.query.all()
        api_ids_to_refresh = []
        for game in all_games:
            try:
                if datetime.utcfromtimestamp(int(game.release_date)) > datetime.now():
                    api_ids_to_refresh.append(game.api_id)
            except:
                api_ids_to_refresh.append(game.api_id)

        return api_ids_to_refresh

    @staticmethod
    def _get_HLTB_time(game_name: str) -> Dict:
        """ Fetch the HLTB time using the HowLongToBeat scraping API """

        games_list = HowLongToBeat().search(game_name.lower(), similarity_case_sensitive=False)

        main, extra, completionist = None, None, None
        if games_list:
            game = max(games_list, key=lambda x: x.similarity)
            main = game.main_story
            extra = game.main_extra
            completionist = game.completionist

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
    DEFAULT_PAGES = 50

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.query = []
        self.API_id = API_id

    @sleep_and_retry
    @limits(calls=2, period=1)
    def search(self, query: str, page: int = 1):
        """ Search a book using the Google Books API. """

        offset = (page - 1) * 10
        response = self.call_api(f"https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={offset}")
        self.API_data = json.loads(response.text)

    @sleep_and_retry
    @limits(calls=2, period=1)
    def _fetch_details_from_API(self):
        """ Get details and credits for books """

        response = self.call_api(f"https://www.googleapis.com/books/v1/volumes/{self.API_id}")
        self.API_data = json.loads(response.text)["volumeInfo"]

    def create_search_results(self) -> Dict:
        """ Create the search list """

        media_results = []
        results = get(self.API_data, "items", default=[])
        for result in results:
            info = result["volumeInfo"]
            media_details = dict(
                api_id=result.get("id"),
                name=get(info, "title", default="Unknown"),
                author=get(info, "authors", 0, default="Unknown"),
                image_cover=get(info, "imageLinks", "thumbnail",
                                default=url_for("static", filename="/covers/default.jpg")),
                date=change_air_format(info.get("publishedDate"), books=True),
                media_type=MediaType.BOOKS.value,
            )

            # Append data
            media_results.append(media_details)

        total = get(self.API_data, "totalItems", default=0)
        pages = total // self.RESULTS_PER_PAGE

        data = dict(
            items=media_results,
            total=total,
            pages=pages,
        )

        return data

    def _from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to local database """

        self.media_details = dict(
            api_id=self.API_id,
            name=get(self.API_data, "title", default="Unknown"),
            pages=get(self.API_data, "pageCount", default=self.DEFAULT_PAGES),
            publishers=get(self.API_data, "publisher", default="Unknown"),
            synopsis=clean_html_text(get(self.API_data, "description", default="Unknown")),
            language=get(self.API_data, "language", default="Unknown"),
            release_date=change_air_format(self.API_data.get("publishedDate"), books=True),
            image_cover=self._get_media_cover(),
            lock_status=True
        )

        # Get authors
        authors = get(self.API_data, "authors", default=["Unknown"])
        authors_list = [{"name": author} for author in authors]

        # Populate instance attribute
        self.all_data = dict(
            media_data=self.media_details,
            genres_data=[{"genre": "Unknown"}],
            authors_data=authors_list
        )

    def _save_api_cover(self, cover_path: str, cover_name: str):
        """ Save API book cover to the local disk """

        # Retrieve cover
        request.urlretrieve(f"{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")

        # Resize and save with PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}")
        img = img.resize((300, 450), Image.Resampling.LANCZOS)
        img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        """ Get media cover, from Google Books API or using Google Image script in /static """

        cover_name = f"{secrets.token_hex(12)}.jpg"
        try:
            cover_url = get(self.API_data, "imageLinks", "medium")
            self._save_api_cover(cover_url, cover_name)
        except:
            try:
                cover_url = get(self.API_data, "imageLinks", "large")
                self._save_api_cover(cover_url, cover_name)
            except:
                from backend.api.static.books_img_ddl.books import GoogleImages

                book_image_ddl = GoogleImages()

                arguments = dict(
                    keywords=f"cover {self.API_data['title']} {self.API_data['authors'][0]}",
                    output_directory=str(self.LOCAL_COVER_PATH),
                    size="medium",
                )

                try:
                    all_paths = book_image_ddl.download(arguments)
                    path = all_paths[0]["image"][-1]

                    img = Image.open(path)
                    img = img.resize((300, 450), Image.Resampling.LANCZOS)
                    img.save(path)

                    cover_name = os.path.basename(path)
                except:
                    cover_name = "default.jpg"

        return cover_name
