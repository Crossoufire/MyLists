from __future__ import annotations

import json
import secrets
from datetime import timedelta
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Literal, Optional, Type
from urllib import request

import requests
from flask import url_for, current_app, abort
from howlongtobeatpy import HowLongToBeat
from requests import Response
from sqlalchemy import or_

from backend.api import db, limiter, cache
from backend.api.core.errors import log_error
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import (clean_html_text, get, is_latin, format_datetime, resize_and_save_image,
                                         reorder_seas_eps, global_limiter, naive_utcnow)


""" --- GENERAL --------------------------------------------------------------------------------------------- """


class ApiManagerMeta(type):
    subclasses = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.subclasses[attrs["GROUP"]] = new_class
        return new_class


class ApiManager(metaclass=ApiManagerMeta):
    GROUP: MediaType
    POSTER_BASE_URL: str
    LOCAL_COVER_PATH: str
    API_KEY: str
    DURATION: int
    RESULTS_PER_PAGE: int = 20

    def __init__(self, api_id: Optional[int, str] = None):
        self.api_id = api_id
        self.media_details = {}
        self.api_data = {}
        self.all_data = {}

    @classmethod
    def get_subclass(cls, media_type: MediaType) -> Type[ApiManager]:
        return cls.subclasses.get(media_type, cls)

    def save_media_to_db(self) -> db.Model:
        self._fetch_details_from_api()
        self._format_api_data()
        return self._add_data_to_db()

    def update_media_to_db(self, bulk: bool = False):
        self._fetch_details_from_api()
        self._format_api_data(bulk)
        self._update_data_to_db()
        db.session.commit()

    def _add_data_to_db(self) -> db.Model:
        models = ModelsManager.get_dict_models(self.GROUP, "all")

        media = models[ModelTypes.MEDIA](**self.all_data["media_data"])
        db.session.add(media)
        db.session.flush()

        related_data = {
            models.get(ModelTypes.EPS): self.all_data.get("seasons_data", []),
            models.get(ModelTypes.GENRE): self.all_data.get("genres_data", []),
            models.get(ModelTypes.ACTORS): self.all_data.get("actors_data", []),
            models.get(ModelTypes.NETWORK): self.all_data.get("networks_data", []),
            models.get(ModelTypes.COMPANIES): self.all_data.get("companies_data", []),
            models.get(ModelTypes.PLATFORMS): self.all_data.get("platforms_data", []),
        }

        for model, data_list in related_data.items():
            for item in data_list:
                item["media_id"] = media.id
                db.session.add(model(**item))

        db.session.commit()

        return media

    def _update_data_to_db(self):
        models = ModelsManager.get_dict_models(self.GROUP, "all")

        media = models[ModelTypes.MEDIA].query.filter_by(api_id=self.api_id).first()
        media.update(self.all_data["media_data"])

        related_data = {
            models.get(ModelTypes.EPS): self.all_data.get("seasons_data", []),
            models.get(ModelTypes.GENRE): self.all_data.get("genres_data", []),
            models.get(ModelTypes.ACTORS): self.all_data.get("actors_data", []),
            models.get(ModelTypes.NETWORK): self.all_data.get("networks_data", []),
            models.get(ModelTypes.COMPANIES): self.all_data.get("companies_data", []),
            models.get(ModelTypes.PLATFORMS): self.all_data.get("platforms_data", []),
        }

        for model, data_list in related_data.items():
            if model == models.get(ModelTypes.EPS) and data_list:
                self._update_episodes_and_seasons(model, media, data_list)
            elif data_list:
                model.query.filter_by(media_id=media.id).delete()
                db.session.add_all([model(**{**item, "media_id": media.id}) for item in data_list])

    def get_changed_api_ids(self) -> List[int]:
        raise NotImplementedError("Subclasses must implement this method.")

    def _fetch_details_from_api(self):
        raise NotImplementedError("Subclasses must implement this method.")

    def _format_api_data(self, bulk: bool = False):
        raise NotImplementedError("Subclasses must implement this method.")

    def _save_api_cover(self, cover_path: str, cover_name: str):
        request.urlretrieve(f"{cover_path}", f"{self.LOCAL_COVER_PATH}/{cover_name}")
        resize_and_save_image(
            f"{self.LOCAL_COVER_PATH}/{cover_name}",
            f"{self.LOCAL_COVER_PATH}/{cover_name}",
        )

    @staticmethod
    def _update_episodes_and_seasons(model: db.Model, media: db.Model, data_list: List[Dict]):
        old_data = [s.episodes for s in media.eps_per_season]
        new_data = [s["episodes"] for s in data_list]

        if new_data == old_data:
            return

        all_media_assoc = media.list_info.filter_by(media_id=media.id).all()
        for media_assoc in all_media_assoc:
            total_eps = (sum(media.eps_seasons_list[:media_assoc.current_season - 1])
                         + media_assoc.last_episode_watched)
            last_episode, last_season, new_total = reorder_seas_eps(total_eps, new_data)
            media_assoc.current_season = last_season
            media_assoc.last_episode_watched = last_episode
            media_assoc.total = new_total * (media_assoc.redo + 1)

        # Delete old add new
        model.query.filter_by(media_id=media.id).delete()
        db.session.add_all([model(media_id=media.id, season=s, episodes=e) for s, e in enumerate(new_data, start=1)])

    @staticmethod
    def call_api(url: str, method: Literal["get", "post"] = "get", **kwargs) -> Response:
        try:
            response = getattr(requests, method)(url, **kwargs, timeout=10)
        except requests.exceptions.RequestException as error:
            if error.response is not None:
                return abort(error.response.status_code, description=error.response.reason)
            else:
                return abort(503, description="Failed to fetch data from external API")

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
        response = self.call_api(f"https://api.themoviedb.org/3/search/multi?api_key={self.API_KEY}&query={query}&page={page}")
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

    def _fetch_details_from_api(self):
        type_ = "movie" if self.GROUP == MediaType.MOVIES else "tv"
        response = self.call_api(
            f"https://api.themoviedb.org/3/{type_}/{self.api_id}?api_key={self.API_KEY}"
            f"&append_to_response=credits"
        )
        self.api_data = json.loads(response.text)

    def _format_genres(self, bulk: bool = False) -> List[Dict]:
        """ Fetch series, anime, or movies genres (fallback for anime if Jikan API bug) """

        all_genres = get(self.api_data, "genres", default=[])
        genres_list = [{"name": genre["name"]} for genre in all_genres]

        return genres_list[:5]

    def _format_actors(self) -> List[Dict]:
        """ Get the <MAX_ACTORS> actors for series, anime and movies """

        all_actors = get(self.api_data, "credits", "cast", default=[])
        actors_list = [{"name": actor["name"]} for actor in all_actors[:self.MAX_ACTORS]]

        return actors_list

    def _get_media_cover(self) -> str:
        """ Create a name for the media image cover or fallback on the <default.jpg> """

        cover_name = "default.jpg"
        cover_path = self.api_data.get("poster_path") or None
        if cover_path:
            cover_name = f"{secrets.token_hex(16)}.jpg"
            try:
                self._save_api_cover(f"{self.POSTER_BASE_URL}{cover_path}", cover_name)
            except Exception as e:
                current_app.logger.warning(f"[WARNING] - Could not fetch the TMDB poster: {e}")
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

    def _format_api_data(self, bulk: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "name"),
            original_name=get(self.api_data, "original_name"),
            release_date=format_datetime(get(self.api_data, "first_air_date")),
            last_air_date=format_datetime(get(self.api_data, "last_air_date")),
            homepage=get(self.api_data, "homepage"),
            total_seasons=get(self.api_data, "number_of_seasons", default=1),
            total_episodes=get(self.api_data, "number_of_episodes", default=1),
            prod_status=get(self.api_data, "status"),
            vote_average=get(self.api_data, "vote_average", default=0),
            vote_count=get(self.api_data, "vote_count", default=0),
            synopsis=get(self.api_data, "overview"),
            popularity=get(self.api_data, "popularity", default=0),
            duration=get(self.api_data, "episode_run_time", 0, default=self.DURATION),
            origin_country=get(self.api_data, "origin_country", 0),
            created_by=self._format_creators(),
            api_id=self.api_data["id"],
            last_api_update=naive_utcnow(),
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

        networks = get(self.api_data, "networks", default=[])
        networks_list = [{"name": network["name"]} for network in networks[:self.MAX_NETWORK]]

        self.all_data = dict(
            media_data=self.media_details,
            seasons_data=seasons_list,
            genres_data=self._format_genres(bulk),
            actors_data=self._format_actors(),
            networks_data=networks_list,
        )

    def _format_creators(self) -> Optional[str]:
        """ Select creators, if not creators then take top 2 writers (by popularity) """

        creators = get(self.api_data, "created_by", default=[])
        if creators:
            return ", ".join([creator["name"] for creator in creators])

        tv_crew = get(self.api_data, "credits", "crew", default=[])
        writers_list = [member for member in tv_crew if member.get("department") == "Writing"
                        and member.get("known_for_department") == "Writing"]
        if not writers_list:
            return None

        top_writers = sorted(
            set(writer["name"] for writer in writers_list),
            key=lambda name: next(w.get("popularity", 0) for w in writers_list if w["name"] == name),
            reverse=True,
        )[:2]

        return ", ".join(top_writers)

    @cache.cached(timeout=300, key_prefix="tv_changed_api_ids")
    def _fetch_changed_api_ids(self) -> List[int]:
        """ Fetch API IDs for Series and Anime. This method caches results for 5 minutes, allowing the `SeriesApiManager` to
        create the data on the first call. Subsequent calls from `AnimeApiManager` will use the cached data, avoiding
        unnecessary API requests. """

        page = 1
        total_pages = 1
        changed_api_ids = []
        while page <= min(total_pages, 20):
            response = self.call_api(f"https://api.themoviedb.org/3/tv/changes?api_key={self.API_KEY}&page={page}")
            data = json.loads(response.text)
            changed_api_ids.extend(d.get("id") for d in data.get("results", []))
            total_pages = data.get("total_pages", 1)
            current_app.logger.info(f"Changed Tv Api Ids - Fetched page {page} / {total_pages}")
            page += 1

        return changed_api_ids

    def get_changed_api_ids(self) -> List[int]:
        """ Check tv shows updates every day """

        media_model = ModelsManager.get_unique_model(self.GROUP, ModelTypes.MEDIA)
        changed_api_ids = self._fetch_changed_api_ids()

        query = media_model.query.with_entities(media_model.api_id).filter(
            media_model.lock_status.is_not(True),
            media_model.api_id.in_(changed_api_ids),
            media_model.last_api_update < naive_utcnow() - timedelta(seconds=86000),
        ).all()

        return [tv_id[0] for tv_id in query]


""" --- CLASS CALL ------------------------------------------------------------------------------------------ """


class SeriesApiManager(TVApiManager):
    DURATION = 40
    GROUP = MediaType.SERIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/series_covers/")

    def fetch_and_format_trending(self) -> List[Dict]:
        response = self.call_api(f"https://api.themoviedb.org/3/trending/tv/week?api_key={self.API_KEY}")
        api_data = response.json()
        results = get(api_data, "results", default=[])

        tv_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview"),
                display_name=get(result, "name"),
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

    @limiter.limit("3/second", key_func=global_limiter)
    def api_anime_search(self, anime_name: str):
        """
        IMPORTANT: This method cannot be called if not in a request context!!! (flask-limiter)
        Fetch anime name from TMDB API. Then use Jikan API to get more accurate genres for anime.
        """

        response = self.call_api(f"https://api.jikan.moe/v4/anime?q={anime_name}")
        return json.loads(response.text)

    def _format_genres(self, bulk: bool = False) -> List[Dict]:
        """ Get anime genre from the Jikan API (fusion between genre, themes and demographic).
        Fallback on TMDB API genres if necessary """

        tmdb_genres_list = super()._format_genres(bulk)

        if bulk:
            return tmdb_genres_list

        try:
            anime_search = self.api_anime_search(self.api_data["name"])
            anime_genres = get(anime_search, "data", 0, "genres", default=[])
            anime_demographic = get(anime_search, "data", 0, "demographics", default=[])
            anime_themes = get(anime_search, "data", 0, "themes", default=[])
            fusion_list = anime_genres + anime_demographic + anime_themes
            anime_genres_list = [{"name": item["name"]} for item in fusion_list][:5]
        except Exception as e:
            log_error(e)
            return tmdb_genres_list

        return anime_genres_list


class MoviesApiManager(TMDBApiManager):
    DURATION = 90
    GROUP = MediaType.MOVIES
    LOCAL_COVER_PATH = Path(current_app.root_path, "static/covers/movies_covers")

    def fetch_and_format_trending(self) -> List[Dict]:
        response = self.call_api(f"https://api.themoviedb.org/3/trending/movie/week?api_key={self.API_KEY}")
        api_data = response.json()
        results = get(api_data, "results", default=[])

        movies_results = []
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview"),
                display_name=get(result, "title"),
                release_date=result.get("release_date"),
                media_type=MediaType.MOVIES.value,
            )

            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.POSTER_BASE_URL}{poster_path}"

            if is_latin(result.get("original_title")):
                media_data["display_name"] = result.get("original_title")

            movies_results.append(media_data)

        return movies_results

    def _format_api_data(self, bulk: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "title"),
            original_name=get(self.api_data, "original_title"),
            release_date=format_datetime(get(self.api_data, "release_date")),
            homepage=get(self.api_data, "homepage"),
            vote_average=get(self.api_data, "vote_average", default=0),
            vote_count=get(self.api_data, "vote_count", default=0),
            synopsis=get(self.api_data, "overview"),
            popularity=get(self.api_data, "popularity", default=0),
            budget=get(self.api_data, "budget", default=0),
            revenue=get(self.api_data, "revenue", default=0),
            duration=get(self.api_data, "runtime", default=self.DURATION),
            original_language=get(self.api_data, "original_language"),
            tagline=self.api_data.get("tagline"),
            api_id=self.api_data.get("id"),
            director_name=None,
            image_cover=self._get_media_cover(),
            last_api_update=naive_utcnow(),
        )

        all_crew = get(self.api_data, "credits", "crew", default=[])
        for crew in all_crew:
            if crew.get("job") == "Director":
                self.media_details["director_name"] = get(crew, "name")
                break

        self.all_data = dict(
            media_data=self.media_details,
            genres_data=self._format_genres(),
            actors_data=self._format_actors(),
        )

    def get_changed_api_ids(self) -> List[int]:
        """ Check movies updates every week, only the most recent ones """

        media_model = ModelsManager.get_unique_model(self.GROUP, ModelTypes.MEDIA)

        query = media_model.query.with_entities(media_model.api_id).filter(
            media_model.lock_status.is_not(True),
            media_model.last_api_update < naive_utcnow() - timedelta(days=7),
            or_(media_model.release_date > naive_utcnow() - timedelta(days=90), media_model.release_date.is_(None)),
        ).all()

        return [movie_id[0] for movie_id in query]


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
            "Authorization": f"Bearer {self.API_KEY}",
        }

    def search(self, query: str, page: int = 1):
        data = (
            f'fields id, name, cover.image_id, first_release_date; limit 10; '
            f'offset {(page - 1) * self.RESULTS_PER_PAGE}; search "{query}";'
        )

        response = self.call_api("https://api.igdb.com/v4/games", method="post", data=data, headers=self.headers)

        self.api_data = dict(
            results=json.loads(response.text),
            total=int(response.headers.get("X-Count", 0))
        )

    def create_search_results(self) -> Dict:
        search_results = []
        api_data = get(self.api_data, "results", default=[])
        for result in api_data:
            if len(search_results) >= self.RESULTS_PER_PAGE:
                break

            media_details = dict(
                api_id=result.get("id"),
                name=get(result, "name"),
                image_cover=url_for("static", filename="covers/default.jpg"),
                date=result.get("first_release_date"),
                media_type=MediaType.GAMES.value,
            )

            cover = get(result, "cover", "image_id")
            if cover:
                media_details["image_cover"] = f"{self.POSTER_BASE_URL}{cover}.jpg"

            search_results.append(media_details)

        data = dict(
            items=search_results,
            total=self.api_data.get("total", 0),
            pages=self.api_data.get("total", 0) // self.RESULTS_PER_PAGE,
        )

        return data

    def _fetch_details_from_api(self):
        body = (
            f"fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, "
            f"player_perspectives.name, total_rating, total_rating_count, first_release_date, "
            f"involved_companies.company.name, involved_companies.developer, involved_companies.publisher, "
            f"summary, themes.name, url; where id={self.api_id};"
        )

        response = self.call_api("https://api.igdb.com/v4/games", "post", data=body, headers=self.headers)
        self.api_data = json.loads(response.text)[0]

    def _format_platforms(self) -> List[Dict]:
        platforms = get(self.api_data, "platforms", default=[])
        return [{"name": platform["name"]} for platform in platforms]

    def _format_companies(self) -> List[Dict]:
        companies_list = []
        for item in get(self.api_data, "involved_companies", default=[]):
            if item["developer"] is False and item["publisher"] is False:
                continue
            companies_list.append(dict(
                name=item["company"]["name"],
                developer=item["developer"],
                publisher=item["publisher"],
            ))
        return companies_list

    def _format_genres(self) -> List[Dict]:
        all_genres = get(self.api_data, "genres", default=[])
        all_themes = get(self.api_data, "themes", default=[])
        fusion_list = all_genres + all_themes

        genres_list = [{"name": genre["name"]} for genre in fusion_list]
        genre_mapping = {
            "4X (explore, expand, exploit, and exterminate)": "4X",
            "Hack and slash/Beat 'em up": "Hack and Slash",
            "Card & Board Game": "Card Game",
            "Quiz/Trivia": "Quiz",
        }
        for genre in genres_list:
            genre["name"] = genre_mapping.get(genre["name"], genre["name"])

        return genres_list[:5]

    def _format_api_data(self, bulk: bool = False):
        self.media_details = dict(
            name=get(self.api_data, "name"),
            release_date=format_datetime(get(self.api_data, "first_release_date")),
            IGDB_url=get(self.api_data, "url"),
            vote_average=get(self.api_data, "total_rating", default=0),
            vote_count=get(self.api_data, "total_rating_count", default=0),
            synopsis=get(self.api_data, "summary"),
            game_engine=get(self.api_data, "game_engines", 0, "name"),
            player_perspective=get(self.api_data, "player_perspectives", 0, "name"),
            game_modes=",".join([g.get("name") for g in get(self.api_data, "game_modes", default=[])]),
            api_id=self.api_data["id"],
            last_api_update=naive_utcnow(),
            image_cover=self._get_media_cover(),
        )

        if not bulk:
            hltb_time = self._get_HLTB_time(self.media_details["name"])
            self.media_details["hltb_main_time"] = hltb_time["main"]
            self.media_details["hltb_main_and_extra_time"] = hltb_time["extra"]
            self.media_details["hltb_total_complete_time"] = hltb_time["completionist"]

        self.all_data = dict(
            media_data=self.media_details,
            companies_data=self._format_companies(),
            genres_data=self._format_genres(),
            platforms_data=self._format_platforms(),
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

        resize_and_save_image(BytesIO(image_data), f"{self.LOCAL_COVER_PATH}/{cover_name}")

    def _get_media_cover(self) -> str:
        cover_name = "default.jpg"
        cover_path = get(self.api_data, "cover", "image_id")
        if cover_path:
            cover_name = f"{secrets.token_hex(16)}.jpg"
            try:
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.warning(f"[WARNING] - Could not fetch the game poster: {e}")
                cover_name = "default.jpg"
        return cover_name

    def update_api_token(self) -> str:
        """ Update the IGDB API Token. Backend needs to restart to update the env variable. """

        try:
            response = self.call_api(
                method="post",
                url=f"https://id.twitch.tv/oauth2/token?client_id={self.CLIENT_IGDB}&"
                    f"client_secret={self.SECRET_IGDB}&grant_type=client_credentials",
            )
            data = json.loads(response.text)
            new_igdb_token = data["access_token"]

            return new_igdb_token
        except Exception as e:
            log_error(e)

    def get_changed_api_ids(self) -> List[int]:
        """ Check games to be released once a week """

        model = ModelsManager.get_unique_model(self.GROUP, ModelTypes.MEDIA)

        query = model.query.with_entities(model.api_id).filter(
            or_(model.release_date > naive_utcnow(), model.release_date.is_(None)),
            model.last_api_update < naive_utcnow() - timedelta(days=7),
        ).all()

        return [int(game_id[0]) for game_id in query]

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

    def search(self, query: str, page: int = 1):
        offset = (page - 1) * self.RESULTS_PER_PAGE
        response = self.call_api(f"https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={offset}")
        self.api_data = json.loads(response.text)

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
                name=get(info, "title"),
                author=get(info, "authors", 0),
                image_cover=get(
                    info, "imageLinks", "thumbnail",
                    default=url_for("static", filename="/covers/default.jpg")
                ),
                date=info.get("publishedDate"),
                media_type=MediaType.BOOKS.value,
            )

            media_results.append(media_details)

        total = get(self.api_data, "totalItems", default=0)
        pages = total // self.RESULTS_PER_PAGE

        return dict(items=media_results, total=total, pages=pages)

    def _format_api_data(self, bulk: bool = False):
        self.media_details = dict(
            api_id=self.api_id,
            authors=", ".join([author for author in get(self.api_data, "authors", default=[])]),
            name=get(self.api_data, "title"),
            pages=get(self.api_data, "pageCount", default=self.DEFAULT_PAGES),
            publishers=get(self.api_data, "publisher"),
            synopsis=clean_html_text(get(self.api_data, "description")),
            language=get(self.api_data, "language"),
            release_date=format_datetime(self.api_data.get("publishedDate")),
            image_cover=self._get_media_cover(),
            last_api_update=naive_utcnow(),
            lock_status=True,
        )

        self.all_data = dict(
            media_data=self.media_details,
            genres_data=[],
        )

    def _get_media_cover(self) -> str:
        cover_name = f"{secrets.token_hex(16)}.jpg"
        try:
            cover_path = get(self.api_data, "imageLinks", "medium")
            self._save_api_cover(cover_path, cover_name)
        except:
            try:
                cover_path = get(self.api_data, "imageLinks", "large")
                self._save_api_cover(cover_path, cover_name)
            except Exception as e:
                current_app.logger.warning(f"[WARNING] - Could not fetch the book poster: {e}")
                cover_name = "default.jpg"

        return cover_name
