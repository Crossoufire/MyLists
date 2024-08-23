from __future__ import annotations
import json
import re
import secrets
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Literal, Optional
from urllib import request
import requests
from PIL import Image
from flask import url_for, current_app, abort
from howlongtobeatpy import HowLongToBeat
from ratelimit import sleep_and_retry, limits
from requests import Response
from backend.api import db
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import clean_html_text, get, is_latin, format_datetime
from backend.api.managers.ModelsManager import ModelsManager

""" --- GENERAL --------------------------------------------------------------------------------------------- """


class ApiMeta(type):
    subclasses = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.subclasses[attrs["GROUP"]] = new_class
        return new_class


class ApiManager(metaclass=ApiMeta):
    GROUP: MediaType
    POSTER_BASE_URL: str
    LOCAL_COVER_PATH: str
    API_KEY: str
    DURATION: int
    RESULTS_PER_PAGE: int = 20

    def __init__(self, api_id: Optional[int, str] = None):
        self.api_id = api_id
        self.media: db.Model = None
        self.media_details = {}
        self.api_data = {}
        self.all_data = {}

    def save_media_to_db(self) -> db.Model:
        self._fetch_details_from_api()
        self._format_api_data()
        self._add_data_to_db()

        return self.media

    def get_refreshed_media_data(self) -> Dict:
        self._fetch_details_from_api()
        self._format_api_data(updating=True)

        return self.all_data

    def _add_data_to_db(self):
        models = ModelsManager.get_dict_models(self.GROUP, "all")

        self.media = models[ModelTypes.MEDIA](**self.all_data["media_data"])
        db.session.add(self.media)
        db.session.commit()

        related_data = {
            models.get(ModelTypes.GENRE): self.all_data.get("genres_data", []),
            models.get(ModelTypes.ACTORS): self.all_data.get("actors_data", []),
            models.get(ModelTypes.NETWORK): self.all_data.get("networks_data", []),
            models.get(ModelTypes.EPS): self.all_data.get("seasons_data", []),
            models.get(ModelTypes.COMPANIES): self.all_data.get("companies_data", []),
            models.get(ModelTypes.PLATFORMS): self.all_data.get("platforms_data", []),
            models.get(ModelTypes.AUTHORS): self.all_data.get("authors_data", []),
        }

        for model, data_list in related_data.items():
            for item in data_list:
                item["media_id"] = self.media.id
                db.session.add(model(**item))

    def get_changed_api_ids(self) -> List[int]:
        raise NotImplementedError("Subclasses must implement this method.")

    def _fetch_details_from_api(self):
        raise NotImplementedError("Subclasses must implement this method.")

    def _format_api_data(self, updating: bool = False):
        raise NotImplementedError("Subclasses must implement this method.")

    @classmethod
    def get_subclass(cls, media_type: MediaType):
        return cls.subclasses.get(media_type, cls)

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


class TMDBApiManager(ApiManager):
    POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300"
    API_KEY = current_app.config["THEMOVIEDB_API_KEY"]
    MAX_TRENDING = 12
    MAX_RESULTS = 20
    MAX_ACTORS = 5

    def __init__(self, api_id: int = None):
        super().__init__(api_id)
        self.api_id = api_id

    def search(self, query: str, page: int = 1):
        response = self.call_api(
            f"https://api.themoviedb.org/3/search/multi?api_key={self.API_KEY}"
            f"&query={query}&page={page}"
        )
        self.api_data = response.json()

    def create_search_results(self) -> Dict:
        search_results = []
        results = get(self.api_data, "results", default=[])
        for result in results:
            if result.get("known_for_department"):
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

        total = self.api_data.get("total_results", 0)
        pages = (total // self.RESULTS_PER_PAGE) + 1

        return dict(items=search_results, total=total, pages=pages)

    def get_changed_api_ids(self) -> List:
        """ Fetch the IDs that changed in the last 24h from the TMDB API """

        type_ = "movie" if self.GROUP == MediaType.MOVIES else "tv"
        model = ModelsManager.get_unique_model(self.GROUP, ModelTypes.MEDIA)

        response = self.call_api(f"https://api.themoviedb.org/3/{type_}/changes?api_key={self.API_KEY}")
        data = json.loads(response.text)

        changed_api_ids = {d.get("id") for d in data.get("results", {})}
        api_ids_in_db = {m[0] for m in db.session.query(model.api_id).filter(model.lock_status != True)}
        api_ids_to_refresh = list(api_ids_in_db.intersection(changed_api_ids))

        return api_ids_to_refresh

    def _fetch_details_from_api(self):
        type_ = "movie" if self.GROUP == MediaType.MOVIES else "tv"
        response = self.call_api(
            f"https://api.themoviedb.org/3/{type_}/{self.api_id}?api_key={self.API_KEY}"
            f"&append_to_response=credits"
        )
        self.api_data = json.loads(response.text)

    def _get_genres(self) -> List[Dict]:
        """ Fetch the series, anime, or movies genres (fallback for anime if Jikan API bug) """

        genres_list = []
        all_genres = get(self.api_data, "genres", default=[])
        for genre in all_genres:
            genres_list.append({"genre": genre["name"], "genre_id": int(genre["id"])})
        if not genres_list:
            genres_list = [{"genre": "Unknown", "genre_id": 0}]

        return genres_list

    def _get_actors(self) -> List[Dict]:
        """ Get the <MAX_ACTORS> actors for series, anime and movies """

        actors_list = []
        all_actors = get(self.api_data, "credits", "cast", default=[])
        for actor in all_actors[:self.MAX_ACTORS]:
            actors_list.append({"name": actor["name"]})
        if not actors_list:
            actors_list = [{"name": "Unknown"}]

        return actors_list

    def _get_media_cover(self) -> str:
        """ Create a name for the media image cover or fallback on the <default.jpg> """

        cover_name = "default.jpg"
        cover_path = self.api_data.get("poster_path") or None
        if cover_path:
            cover_name = f"{secrets.token_hex(16)}.jpg"
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
        media_info = dict(
            media_type=MediaType.SERIES.value,
            date=result.get("first_air_date"),
            name=result.get("original_name") if is_latin(result.get("original_name")) else result.get("name")
        )

        # Change <media_type> to <anime> on conditions
        is_jap = result.get("origin_country") == "JP" or result.get("original_language") == "ja"
        is_anime = 16 in result.get("genre_ids")
        if is_jap and is_anime:
            media_info["media_type"] = MediaType.ANIME.value

        return media_info

    @staticmethod
    def _process_movie(result):
        media_info = dict(
            media_type=MediaType.MOVIES.value,
            date=result.get("release_date"),
            name=result.get("original_title") if is_latin(result.get("original_title")) else result.get("title")
        )
        return media_info


class TVApiManager(TMDBApiManager):
    MAX_NETWORK = 4

    def _format_api_data(self, updating: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "name", default="Unknown"),
            original_name=get(self.api_data, "original_name", default="Unknown"),
            release_date=format_datetime(get(self.api_data, "first_air_date")),
            last_air_date=format_datetime(get(self.api_data, "last_air_date")),
            homepage=get(self.api_data, "homepage", default="Unknown"),
            in_production=get(self.api_data, "in_production", default=False),
            total_seasons=get(self.api_data, "number_of_seasons", default=1),
            total_episodes=get(self.api_data, "number_of_episodes", default=1),
            status=get(self.api_data, "status", default="Unknown"),
            vote_average=get(self.api_data, "vote_average", default=0),
            vote_count=get(self.api_data, "vote_count", default=0),
            synopsis=get(self.api_data, "overview", default="Undefined"),
            popularity=get(self.api_data, "popularity", default=0),
            duration=get(self.api_data, "episode_run_time", 0, default=self.DURATION),
            origin_country=get(self.api_data, "origin_country", 0, default="Unknown"),
            created_by=", ".join(cr["name"] for cr in (self.api_data.get("created_by") or self._get_writers())),
            api_id=self.api_data["id"],
            last_api_update=datetime.utcnow(),
            image_cover=self._get_media_cover(),
            next_episode_to_air=None,
            season_to_air=None,
            episode_to_air=None,
        )

        next_episode_to_air = self.api_data.get("next_episode_to_air")
        if next_episode_to_air:
            self.media_details["next_episode_to_air"] = format_datetime(next_episode_to_air["air_date"])
            self.media_details["season_to_air"] = next_episode_to_air["season_number"]
            self.media_details["episode_to_air"] = next_episode_to_air["episode_number"]

        seasons_list = []
        seasons = get(self.api_data, "seasons", default=[])
        for season in seasons:
            if season.get("season_number", 0) > 0:
                seasons_list.append({"season": season["season_number"], "episodes": season["episode_count"]})
        if not seasons_list:
            seasons_list.append({"season": 1, "episodes": 1})

        networks_list = []
        networks = get(self.api_data, "networks", default=[])
        for network in networks[:self.MAX_NETWORK]:
            networks_list.append({"network": network["name"]})
        if not networks_list:
            networks_list.append({"network": "Unknown"})

        genres_list, actors_list, anime_genres_list = (
            self._get_genres(), self._get_actors(), self._get_anime_genres()
        ) if not updating else ([], [], [])

        self.all_data = dict(
            media_data=self.media_details,
            seasons_data=seasons_list,
            genres_data=genres_list,
            anime_genres_data=anime_genres_list,
            actors_data=actors_list,
            networks_data=networks_list,
        )

    def _get_anime_genres(self):
        """ Method only for <Anime>, not <Series>. Overridden in <ApiAnime> class """
        return []

    def _get_writers(self) -> List[Dict]:
        """ Get top 2 writers (by popularity) for <created_by> field using the series/anime crew """

        tv_crew = get(self.api_data, "credits", "crew", default=[])

        creator_names = [member for member in tv_crew if member.get("department") == "Writing"
                         and member.get("known_for_department") == "Writing"]

        if not creator_names:
            return [{"name": "Unknown"}]

        return sorted(creator_names, key=lambda x: x.get("popularity", 0), reverse=True)[:2]


""" --- CLASS CALL ------------------------------------------------------------------------------------------ """


class SeriesApiManager(TVApiManager):
    DURATION = 40
    GROUP = MediaType.SERIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/series_covers/")

    def get_and_format_trending(self) -> List[Dict]:
        response = self.call_api(f"https://api.themoviedb.org/3/trending/tv/week?api_key={self.API_KEY}")
        api_data = response.json()
        results = get(api_data, "results", default=[])

        tv_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview", default="Unknown"),
                display_name=get(result, "name", default="Unknown"),
                release_date=result.get("first_air_date"),
                media_type=MediaType.SERIES.value,
            )

            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            if is_latin(result.get("original_name")):
                media_data["display_name"] = result.get("original_name")

            tv_results.append(media_data)

        return tv_results


class AnimeApiManager(TVApiManager):
    DURATION = 24
    GROUP = MediaType.ANIME
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/anime_covers/")

    @sleep_and_retry
    @limits(calls=1, period=4)
    def api_anime_search(self, anime_name: str):
        """
        Fetch the anime name from the TMDB API to the Jikan API. Then use the Jikan API to get more accurate
        genres with the <get_anime_genres> method
        """

        response = self.call_api(f"https://api.jikan.moe/v4/anime?q={anime_name}")
        return json.loads(response.text)

    def _get_anime_genres(self) -> List[Dict]:
        """ Get anime genre from the Jikan API (fusion between genre, themes and demographic) """

        anime_genres_list = []
        try:
            anime_search = self.api_anime_search(self.api_data["name"])

            anime_genres = anime_search["data"][0]["genres"]
            anime_demographic = anime_search["data"][0]["demographics"]
            anime_themes = anime_search["data"][0]["themes"]

            for data_list in (anime_genres, anime_demographic, anime_themes):
                for item in data_list:
                    anime_genres_list.append({"genre": item["name"], "genre_id": int(item["mal_id"])})
        except Exception as e:
            current_app.logger.error(f"[ERROR] - Requesting the Jikan API: {e}")

        return anime_genres_list


class MoviesApiManager(TMDBApiManager):
    DURATION = 90
    GROUP = MediaType.MOVIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/movies_covers")

    def get_and_format_trending(self) -> List[Dict]:
        response = self.call_api(f"https://api.themoviedb.org/3/trending/movie/week?api_key={self.API_KEY}")
        api_data = response.json()
        results = get(api_data, "results", default=[])

        movies_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview", default="Unknown"),
                display_name=get(result, "title", default="Unknown"),
                release_date=result.get("release_date"),
                media_type=MediaType.MOVIES.value,
            )

            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            if is_latin(result.get("original_title")):
                media_data["display_name"] = result.get("original_title")

            movies_results.append(media_data)

        return movies_results

    def _format_api_data(self, updating: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "title", default="Unknown"),
            original_name=get(self.api_data, "original_title", default="Unknown"),
            release_date=format_datetime(get(self.api_data, "release_date")),
            homepage=get(self.api_data, "homepage", default="Unknown"),
            vote_average=get(self.api_data, "vote_average", default=0),
            vote_count=get(self.api_data, "vote_count", default=0),
            synopsis=get(self.api_data, "overview", default="Undefined"),
            popularity=get(self.api_data, "popularity", default=0),
            budget=get(self.api_data, "budget", default=0),
            revenue=get(self.api_data, "revenue", default=0),
            duration=get(self.api_data, "runtime", default=self.DURATION),
            original_language=get(self.api_data, "original_language", default="Unknown"),
            tagline=self.api_data.get("tagline"),
            api_id=self.api_data.get("id"),
            director_name="Unknown",
            image_cover=self._get_media_cover(),
            last_api_update=datetime.utcnow(),
        )

        all_crew = get(self.api_data, "credits", "crew", default=[])
        for crew in all_crew:
            if crew.get("job") == "Director":
                self.media_details["director_name"] = get(crew, "name", default="Unknown")
                break

        actors_list, genres_list = (self._get_actors(), self._get_genres()) if not updating else ([], [])

        self.all_data = dict(
            media_data=self.media_details,
            genres_data=genres_list,
            actors_data=actors_list
        )


class GamesApiManager(ApiManager):
    GROUP = MediaType.GAMES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/games_covers/")
    POSTER_BASE_URL = "https://images.igdb.com/igdb/image/upload/t_1080p/"
    API_KEY = current_app.config["IGDB_API_KEY"]
    CLIENT_IGDB = current_app.config["CLIENT_IGDB"]
    SECRET_IGDB = current_app.config["SECRET_IGDB"]

    def __init__(self, api_id: int = None):
        super().__init__(api_id)

        self.api_id = api_id
        self.query = []

        self.headers = {
            "Client-ID": self.CLIENT_IGDB,
            "Authorization": f"Bearer {self.API_KEY}"
        }

    @sleep_and_retry
    @limits(calls=4, period=1)
    def search(self, query: str, page: int = 1):
        data = (
            f'fields id, name, cover.image_id, first_release_date, storyline; limit 10; '
            f'offset {(page - 1) * self.RESULTS_PER_PAGE}; search "{query}";'
        )

        response = self.call_api("https://api.igdb.com/v4/games", method="post", data=data, headers=self.headers)

        self.api_data = {
            "results": json.loads(response.text),
            "total": int(response.headers.get("X-Count", 0))
        }

    def create_search_results(self) -> Dict:
        search_results = []
        api_data = get(self.api_data, "results", default=[])
        for result in api_data:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            media_details = dict(
                api_id=result.get("id"),
                name=get(result, "name", default="Unknown"),
                image_cover=url_for("static", filename="covers/default.jpg"),
                date=result.get("first_release_date"),
                media_type=MediaType.GAMES.value,
            )

            cover = get(result, "cover", "image_id")
            if cover:
                media_details["image_cover"] = f"{self.POSTER_BASE_URL}{cover}.jpg"

            # Append to media results
            search_results.append(media_details)

        data = dict(
            items=search_results,
            total=self.api_data.get("total", 0),
            pages=self.api_data.get("total", 0) // self.RESULTS_PER_PAGE,
        )

        return data

    def _fetch_details_from_api(self):
        body = (
            f"fields name, cover.image_id, collection.name, game_engines.name, game_modes.name, "
            f"platforms.name, genres.name, player_perspectives.name, total_rating, total_rating_count, "
            f"first_release_date, involved_companies.company.name, involved_companies.developer, "
            f"involved_companies.publisher, storyline, summary, themes.name, url, external_games.uid, "
            f"external_games.category; where id={self.api_id};"
        )

        response = self.call_api("https://api.igdb.com/v4/games", "post", data=body, headers=self.headers)
        self.api_data = json.loads(response.text)[0]

    def _format_api_data(self, updating: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "name", default="Unknown"),
            release_date=format_datetime(get(self.api_data, "first_release_date")),
            IGDB_url=get(self.api_data, "url", default="Unknown"),
            vote_average=get(self.api_data, "total_rating", default=0),
            vote_count=get(self.api_data, "total_rating_count", default=0),
            synopsis=get(self.api_data, "summary", default="Undefined"),
            storyline=get(self.api_data, "storyline", default="Undefined"),
            collection_name=get(self.api_data, "collection", "name", default="Unknown"),
            game_engine=get(self.api_data, "game_engines", 0, "name", default="Unknown"),
            player_perspective=get(self.api_data, "player_perspectives", 0, "name", default="Unknown"),
            game_modes=",".join([g["name"] for g in get(self.api_data, "game_modes", default=[{"name": "Unknown"}])]),
            api_id=self.api_data.get("id"),
            last_api_update=datetime.utcnow(),
            image_cover=self._get_media_cover(),
            hltb_main_time=None,
            hltb_main_and_extra_time=None,
            hltb_total_complete_time=None,
        )

        hltb_time = self._get_HLTB_time(self.media_details["name"])
        self.media_details["hltb_main_time"] = hltb_time["main"]
        self.media_details["hltb_main_and_extra_time"] = hltb_time["extra"]
        self.media_details["hltb_total_complete_time"] = hltb_time["completionist"]

        companies_list, fusion_list, platforms_list = [], [], []
        if not updating:
            platforms = get(self.api_data, "platforms", default=[{"name": "Unknown"}])
            platforms_list = [{"name": pf["name"]} for pf in platforms]

            companies = get(self.api_data, "involved_companies",
                            default=[{"company": {"name": "Unknown"}, "publisher": True, "developer": True}])
            companies_list = [{
                "name": company["company"]["name"],
                "publisher": company["publisher"],
                "developer": company["developer"],
            } for company in companies]

            genres = get(self.api_data, "genres", default=[{"name": "Unknown"}])
            genres_list = [{"genre": genre["name"]} for genre in genres]

            themes = get(self.api_data, "themes", default=[{"name": "Unknown"}])
            themes_list = [{"genre": theme["name"]} for theme in themes]

            fusion_list = genres_list + themes_list or [{"genre": "Unknown"}]

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
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) "
                          "Chrome/23.0.1271.64 Safari/537.11",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
            "Accept-Encoding": "none",
            "Accept-Language": "en-US,en;q=0.8",
            "Connection": "keep-alive",
        }

        request_ = request.Request(url=f"{self.POSTER_BASE_URL}{cover_path}.jpg", headers=headers)

        with request.urlopen(request_) as response:
            image_data = response.read()

        with Image.open(BytesIO(image_data)) as img:
            img_resized = img.resize((300, 450), resample=Image.Resampling.LANCZOS)
            img_resized.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        cover_name = "default.jpg"
        cover_path = self.api_data.get("cover")["image_id"] or None
        if cover_path:
            cover_name = f"{secrets.token_hex(12)}.jpg"
            try:
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Trying to fetch the game poster: {e}")
                cover_name = "default.jpg"

        return cover_name

    def update_api_key(self):
        """ Update IGDB API key every month. Backend needs to restart to update the env variable. """

        import dotenv

        try:
            response = self.call_api(
                f"https://id.twitch.tv/oauth2/token?client_id={self.CLIENT_IGDB}&"
                f"client_secret={self.SECRET_IGDB}&grant_type=client_credentials", method="post"
            )
            data = json.loads(response.text)
            new_IGDB_token = data.get("access_token")

            if not new_IGDB_token:
                current_app.logger.error("[ERROR] - Failed to obtain the new IGDB token.")
                return

            # Write new IGDB API KEY to <.env> file
            dotenv_file = dotenv.find_dotenv()
            dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_IGDB_token)
        except Exception as ex:
            current_app.logger.error(f"[ERROR] - An error occurred obtaining the new IGDB API key: {ex}")

    def get_changed_api_ids(self) -> List:
        model = ModelsManager.get_unique_model(self.GROUP, ModelTypes.MEDIA)

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
        games_list = HowLongToBeat().search(game_name.lower(), similarity_case_sensitive=False)

        main, extra, completionist = None, None, None
        if games_list:
            game = max(games_list, key=lambda x: x.similarity)
            main = game.main_story
            extra = game.main_extra
            completionist = game.completionist

        return dict(main=main, extra=extra, completionist=completionist)


class BooksApiManager(ApiManager):
    GROUP = MediaType.BOOKS
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/books_covers/")
    DEFAULT_PAGES = 50

    def __init__(self, api_id: int = None):
        super().__init__(api_id)

        self.query = []
        self.api_id = api_id

    @sleep_and_retry
    @limits(calls=2, period=1)
    def search(self, query: str, page: int = 1):
        offset = (page - 1) * self.RESULTS_PER_PAGE
        response = self.call_api(f"https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={offset}")
        self.api_data = json.loads(response.text)

    @sleep_and_retry
    @limits(calls=2, period=1)
    def _fetch_details_from_api(self):
        response = self.call_api(f"https://www.googleapis.com/books/v1/volumes/{self.api_id}")
        self.api_data = json.loads(response.text)["volumeInfo"]

    def create_search_results(self) -> Dict:
        media_results = []
        results = get(self.api_data, "items", default=[])
        for result in results:
            info = result["volumeInfo"]
            media_details = dict(
                api_id=result.get("id"),
                name=get(info, "title", default="Unknown"),
                author=get(info, "authors", 0, default="Unknown"),
                image_cover=get(info, "imageLinks", "thumbnail",
                                default=url_for("static", filename="/covers/default.jpg")),
                date=info.get("publishedDate"),
                media_type=MediaType.BOOKS.value,
            )

            # Append data
            media_results.append(media_details)

        total = get(self.api_data, "totalItems", default=0)
        pages = total // self.RESULTS_PER_PAGE

        return dict(items=media_results, total=total, pages=pages)

    def _format_api_data(self, updating: bool = False):
        self.media_details = dict(
            api_id=self.api_id,
            name=get(self.api_data, "title", default="Unknown"),
            pages=get(self.api_data, "pageCount", default=self.DEFAULT_PAGES),
            publishers=get(self.api_data, "publisher", default="Unknown"),
            synopsis=clean_html_text(get(self.api_data, "description", default="Unknown")),
            language=get(self.api_data, "language", default="Unknown"),
            release_date=format_datetime(self.api_data.get("publishedDate")),
            image_cover=self._get_media_cover(),
            last_api_update=datetime.utcnow(),
            lock_status=True,
        )

        authors = get(self.api_data, "authors", default=["Unknown"])
        authors_list = [{"name": author} for author in authors]

        self.all_data = dict(
            media_data=self.media_details,
            genres_data=[{"genre": "Unknown"}],
            authors_data=authors_list
        )

    def _save_api_cover(self, cover_path: str, cover_name: str):
        request.urlretrieve(f"{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{cover_name}")
        img = img.resize((300, 450), Image.Resampling.LANCZOS)
        img.save(f"{self.LOCAL_COVER_PATH}/{cover_name}", quality=90)

    def _get_media_cover(self) -> str:
        cover_name = f"{secrets.token_hex(16)}.jpg"
        try:
            cover_url = get(self.api_data, "imageLinks", "medium")
            self._save_api_cover(cover_url, cover_name)
        except:
            try:
                cover_url = get(self.api_data, "imageLinks", "large")
                self._save_api_cover(cover_url, cover_name)
            except:
                cover_name = "default.jpg"

        return cover_name
