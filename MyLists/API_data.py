"""
APIs related functions and classes
"""

import json
import os.path
import secrets
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Tuple
from urllib import request
from urllib.request import urlretrieve, Request
import requests
from PIL import Image
from flask import url_for
from howlongtobeatpy import HowLongToBeat
from ratelimit import sleep_and_retry, limits
from MyLists import app, db
from MyLists.models import MediaType, Series, SeriesGenre, SeriesActors, Movies, SeriesNetwork, MoviesGenre, \
    SeriesEpisodesPerSeason, MoviesActors, GamesCompanies, GamesPlatforms, Games, GamesGenre, Books, BooksGenre, \
    BooksAuthors, Anime, AnimeGenre, AnimeActors, AnimeNetwork, AnimeEpisodesPerSeason, change_air_format
from MyLists.utils import latin_alphabet, get_subclasses, clean_text


""" --- GENERAL --------------------------------------------------------------------------------------------- """


class ApiData:
    """ Main class for API manipulation """

    DURATION = 0
    GROUP = None
    LOCAL_COVER_PATH = None

    def __init__(self, API_id: int = None):
        self.API_id = API_id

        self.media = None
        self.API_data = None
        self.api_key = None

        self.media_details = {}
        self.all_data = {}

    @classmethod
    def get_API_class(cls, media_type: Enum):
        """ Get the appropriate inherited class depending on <media_type> """

        subclasses = get_subclasses(cls)
        for class_ in subclasses:
            if media_type == class_.GROUP:
                return class_

    def save_media_to_db(self) -> object:
        """ Save media to the database and return the media """

        self.get_details_and_credits_data()
        self.from_API_to_dict()
        self.add_data_to_db()

        return self.media

    def update_media_data(self) -> Dict:
        """ Update the media data and return it """

        self.get_details_and_credits_data()
        self.from_API_to_dict(updating=True)

        return self.all_data

    def get_details_and_credits_data(self):
        """ Overwrited in inherited class """
        raise NotImplementedError

    def from_API_to_dict(self, updating: bool = False):
        """ Overwrited in inherited class """
        raise NotImplementedError

    def add_data_to_db(self):
        """ Overwrited in inherited class """
        raise NotImplementedError


class ApiTMDB(ApiData):
    """ TMDB API class (Series, Anime and Movies) """

    GROUP = []
    POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300"

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.api_key = app.config["THEMOVIEDB_API_KEY"]
        self.API_id = API_id

    def search(self, media_name: str, page: int = 1):
        """ Search for series, anime and movies """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/search/multi?api_key={self.api_key}"
                                f"&query={media_name}&page={page}", timeout=10)

        # Raise for statud
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)

    def get_autocomplete_list(self) -> List[Dict]:
        """ Create autocomplete list for autocomplete search """

        media_results = []
        if self.API_data.get("total_results", 0) > 0:
            for i, result in enumerate(self.API_data["results"]):
                media_details = {}
                if i >= self.API_data["total_results"] or i > 19 or len(media_results) >= 7:
                    break
                if result.get('known_for_department'):
                    continue

                media_details['api_id'] = result.get('id')
                media_details["image_cover"]: url_for("static", filename="covers/series_covers/default.jpg")
                if result.get('poster_path'):
                    media_details['image_cover'] = f"{self.POSTER_BASE_URL}{result.get('poster_path')}"

                if result.get('media_type') == "tv":
                    media_details['category'] = "Series/Anime"

                    return_latin = latin_alphabet(result.get("original_name"))
                    media_details['display_name'] = result.get('name')
                    if return_latin is True:
                        media_details['display_name'] = result.get('original_name')

                    media_details['date'] = change_air_format(result.get('first_air_date'))
                    media_details['type'] = 'Series'
                    if result.get('origin_country') == 'JP' or result.get('original_language') == 'ja' \
                            and 16 in result.get('genre_ids'):
                        media_details['type'] = 'Anime'
                elif result.get('media_type') == 'movie':
                    media_details['category'] = 'Movies'

                    return_latin = latin_alphabet(result.get('original_title'))
                    media_details['display_name'] = result.get('title')
                    if return_latin is True:
                        media_details['display_name'] = result.get('original_title')

                    media_details['date'] = change_air_format(result.get('release_date'))
                    media_details['type'] = 'Movies'

                # Append dict to list
                media_results.append(media_details)

        return media_results

    def get_search_list(self) -> Tuple[List[Dict], int, int]:
        """ Create search list for search page (not autocomplete) """

        media_results = []
        for result in self.API_data["results"]:

            if result.get('known_for_department'):
                continue

            media_data = dict(
                name=result.get('title') or result.get('name'),
                overview=result.get('overview'),
                first_air_date=result.get('first_air_date') or result.get('release_date'),
                api_id=result['id']
            )

            # Modify <first_air_date>/<release_date> format
            if media_data['first_air_date'] == "":
                media_data['first_air_date'] = "Unknown"

            # Recover <poster_path> or take <default> image
            media_data["poster_path"] = url_for('static', filename="covers/series_covers/default.jpg")
            if result["poster_path"]:
                media_data["poster_path"] = f"{self.POSTER_BASE_URL}{result['poster_path']}"

            # Put data in different lists in function of <media_type>
            if result['media_type'] == 'tv':
                media_data['url'] = f"https://www.themoviedb.org/tv/{result['id']}"
                media_data['media'] = 'Series'
                if result["origin_country"] == "JP" or result['original_language'] == "ja" \
                        and 16 in result["genre_ids"]:
                    media_data["media_type"] = "Anime"
                    media_data["name"] = result["name"]
                    media_data["'media"] = "Anime"
                else:
                    media_data["media_type"] = "Series"
                media_results.append(media_data)
            elif result['media_type'] == 'movie':
                media_data['media'] = "Movies"
                media_data['media_type'] = "Movies"
                media_data["url"] = f"https://www.themoviedb.org/movie/{result['id']}"

                if result["original_language"] == "ja" and 16 in result["genre_ids"]:
                    media_data["name"] = result["title"]

                # Append dict to list
                media_results.append(media_data)

        # Fetch <total_page> and <total_results>
        total_results = self.API_data['total_results']
        total_pages = self.API_data['total_pages']

        return media_results, total_results, total_pages

    def get_genres(self) -> List[Dict]:
        """ Get genres for series, anime and movies (fallback for anime) """

        genres = self.API_data.get('genres') or None
        genres_list = []
        if genres:
            for i in range(0, len(genres)):
                genres_list.append({"genre": genres[i]["name"], "genre_id": int(genres[i]["id"])})
        else:
            genres_list.append({"genre": "Unknown", "genre_id": 0})

        return genres_list

    def get_actors(self) -> List[Dict]:
        """ Get top 5 actors for series, anime and movies """

        actors = self.API_data.get("credits", {"cast": None}).get("cast") or None
        actors_list = []
        if actors:
            for actor in actors[:5]:
                actors_list.append({"name": actor["name"]})
        else:
            actors_list.append({'name': 'Unknown'})

        return actors_list

    def save_api_cover(self, media_cover_path: str, media_cover_name: str):
        """ Save cover to local disk """

        # Get cover from url
        urlretrieve(f"{self.POSTER_BASE_URL}{media_cover_path}", f"{self.LOCAL_COVER_PATH}/{media_cover_name}")

        # Resize and save using PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{media_cover_name}")
        img = img.resize((300, 450), Image.ANTIALIAS)
        img.save(f"{self.LOCAL_COVER_PATH}/{media_cover_name}", quality=90)

    def get_media_cover(self) -> str:
        """ Get media cover name """

        media_cover_name = "default.jpg"
        media_cover_path = self.API_data.get('poster_path') or None
        if media_cover_path:
            media_cover_name = "{secrets.token_hex(8)}.jpg"
            try:
                self.save_api_cover(media_cover_path, media_cover_name)
            except Exception as e:
                app.logger.error(f"[ERROR] - Trying to recover the poster: {e}")
                media_cover_name = "default.jpg"

        return media_cover_name


class ApiTV(ApiTMDB):
    """ TMDB API class (Series and Anime) """

    GROUP = []

    def get_details_and_credits_data(self):
        """ Get details and credits from TMDB for series and anime """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/tv/{self.API_id}?"
                                f"api_key={self.api_key}&append_to_response=credits", timeout=15)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)

    def get_changed_data(self) -> Dict:
        """ Get changed ID from TMDB API for series and anime """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/tv/changes?api_key={self.api_key}", timeout=15)

        # Raise for status
        response.raise_for_status()

        return json.loads(response.text)

    def from_API_to_dict(self, updating: bool = False):
        """ Change API data to dict to add in local database """

        self.media_details = dict(
            name=self.API_data.get('name', 'Unknown') or 'Unknown',
            original_name=self.API_data.get('original_name', 'Unknown') or 'Unknown',
            first_air_date=self.API_data.get('first_air_date', 'Unknown') or 'Unknown',
            last_air_date=self.API_data.get('last_air_date', 'Unknown') or 'Unknown',
            homepage=self.API_data.get('homepage', 'Unknown') or 'Unknown',
            in_production=self.API_data.get('in_production', False) or False,
            total_seasons=self.API_data.get('number_of_seasons', 1) or 1,
            total_episodes=self.API_data.get('number_of_episodes', 1) or 1,
            status=self.API_data.get('status', 'Unknown') or 'Unknown',
            vote_average=self.API_data.get('vote_average', 0) or 0,
            vote_count=self.API_data.get('vote_count', 0) or 0,
            synopsis=self.API_data.get('overview', 'Not defined.') or 'Not defined.',
            popularity=self.API_data.get('popularity', 0) or 0,
            api_id=self.API_data.get('id'),
            next_episode_to_air=None,
            season_to_air=None,
            episode_to_air=None,
            last_update=datetime.utcnow(),
            image_cover=self.get_media_cover()
        )

        # Add next epsiode to air
        next_episode_to_air = self.API_data.get("next_episode_to_air") or None
        if next_episode_to_air:
            self.media_details['next_episode_to_air'] = next_episode_to_air['air_date']
            self.media_details['season_to_air'] = next_episode_to_air['season_number']
            self.media_details['episode_to_air'] = next_episode_to_air['episode_number']

        # Check duration
        duration = self.API_data.get("episode_run_time") or None
        self.media_details['duration'] = self.DURATION
        if duration and float(duration[0]) != 0:
            self.media_details['duration'] = duration[0]

        # Check origin country
        origin_country = self.API_data.get("origin_country") or None
        self.media_details['origin_country'] = 'Unknown'
        if origin_country:
            self.media_details['origin_country'] = origin_country[0]

        # Check created by
        created_by = self.API_data.get("created_by") or None
        self.media_details['created_by'] = 'Unknown'
        if created_by:
            self.media_details['created_by'] = ", ".join(creator['name'] for creator in created_by)

        # Add seasons info
        seasons, seasons_list = self.API_data.get('seasons') or None, []
        if seasons:
            for i in range(0, len(seasons)):
                if seasons[i]['season_number'] <= 0:
                    continue
                seasons_list.append({'season': seasons[i]['season_number'], 'episodes': seasons[i]['episode_count']})
        else:
            seasons_list.append({'season': 1, 'episodes': 1})

        # Add networks
        networks, networks_list = self.API_data.get('networks') or None, []
        if networks:
            for network in networks[:4]:
                networks_list.append({'network': network["name"]})
        else:
            networks_list.append({'network': 'Unknown'})

        # Add genres
        genres_list, actors_list, anime_genres_list = [], [], []
        if not updating:
            genres_list = self.get_genres()
            actors_list = self.get_actors()
            anime_genres_list = self.get_anime_genres()

        # Populate attribute
        self.all_data = {'media_data': self.media_details, 'seasons_data': seasons_list, 'genres_data': genres_list,
                         'anime_genres_data': anime_genres_list, 'actors_data': actors_list,
                         'networks_data': networks_list}

    def get_anime_genres(self):
        """ Get anime genre consistancy for inherited class """

        return []


""" --- CLASS CALL ------------------------------------------------------------------------------------------ """


class ApiSeries(ApiTV):
    """ TMDB API class for Series """

    DURATION = 40
    GROUP = MediaType.SERIES
    LOCAL_COVER_PATH = Path(app.root_path, "static/covers/series_covers/")

    def get_trending(self) -> str:
        """ Get week trending data from TMDB API """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/trending/tv/week?api_key={self.api_key}", timeout=10)

        # Raise for status
        response.raise_for_status()

        return json.loads(response.text)

    def add_data_to_db(self):
        """ Add new series to local database """

        # noinspection PyArgumentList
        self.media = Series(**self.all_data['media_data'])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Fallback (never anime genre for series) just consistancy
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
    """ Anime specific API class """

    DURATION = 24
    GROUP = MediaType.ANIME
    LOCAL_COVER_PATH = Path(app.root_path, "static/covers/anime_covers/")

    @staticmethod
    @sleep_and_retry
    @limits(calls=1, period=4)
    def api_anime_search(anime_name: str):
        """ Recover the anime title from TMDB API to the unofficial MyAnimeList API to gather more accurate genres
         with the <get_anime_genres> method """

        # Api call
        response = requests.get(f"https://api.jikan.moe/v4/anime?q={anime_name}", timeout=10)

        # Raise for status
        response.raise_for_status()

        return json.loads(response.text)

    def get_anime_genres(self) -> List[Dict]:
        """ Get anime genre from Jikan (fusion between genre, themes and demographic) """

        anime_genres_list = []
        try:
            # Search using jikan API
            anime_search = self.api_anime_search(self.API_data.get("name"))

            # Add data
            anime_genres = anime_search["data"][0]["genres"]
            anime_demographic = anime_search["data"][0]["demographics"]
            anime_themes = anime_search["data"][0]["themes"]
        except Exception as e:
            app.logger.error(f"[ERROR] - Requesting the Jikan API: {e}")
            anime_genres = None
            anime_demographic = None
            anime_themes = None

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

    def add_data_to_db(self):
        """ Add new Anime to local database """

        # noinspection PyArgumentList
        self.media = Anime(**self.all_data['media_data'])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Fallback on TMDB genre if problem with jikan
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
    """ Movies specific API class """

    GROUP = MediaType.MOVIES
    LOCAL_COVER_PATH = Path(app.root_path, "static/covers/movies_covers")

    def get_details_and_credits_data(self):
        """ Get details and credits data from TMDB API """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/movie/{self.API_id}?api_key={self.api_key}"
                                f"&append_to_response=credits", timeout=15)

        # Raise for status
        response.raise_for_status()

        # Add data to instance attribute
        self.API_data = json.loads(response.text)

    def get_changed_data(self) -> Dict:
        """ Get the changed ID from TMDB to update the local database. Used in scheduled-tasks. """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/movie/changes?api_key={self.api_key}", timeout=15)

        # Raise for status
        response.raise_for_status()

        # Return text as json
        return json.loads(response.text)

    def get_trending(self) -> Dict:
        """ Get trending Movies from TMDB """

        # API call
        response = requests.get(f"https://api.themoviedb.org/3/trending/movie/week?api_key={self.api_key}", timeout=10)

        # Raise for status
        response.raise_for_status()

        # Return json
        return json.loads(response.text)

    def from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict """

        self.media_details = {'name': self.API_data.get('title', 'Unknown') or 'Unknown',
                              'original_name': self.API_data.get('original_title', 'Unknown') or 'Unknown',
                              'release_date': self.API_data.get('release_date', 'Unknown') or 'Unknown',
                              'homepage': self.API_data.get('homepage', 'Unknown') or 'Unknown',
                              'released': self.API_data.get('status', 'Unknown') or '"Unknown',
                              'vote_average': self.API_data.get('vote_average', 0) or 0,
                              'vote_count': self.API_data.get('vote_count', 0) or 0,
                              'synopsis': self.API_data.get('overview', 'Not defined.') or 'Not defined.',
                              'popularity': self.API_data.get('popularity', 0) or 0,
                              'budget': self.API_data.get('budget', 0) or 0,
                              'revenue': self.API_data.get('revenue', 0) or 0,
                              'tagline': self.API_data.get('tagline', '-') or '-',
                              'duration': self.API_data.get('runtime', 0) or 0,
                              'original_language': self.API_data.get('original_language', 'Unknown') or 'Unknown',
                              'api_id': self.API_data.get('id'),
                              'director_name': "Unknown",
                              'image_cover': self.get_media_cover()}

        # Fetch <director_name> from crew
        the_crew = self.API_data.get('credits', {'crew': None}).get('crew') or None
        if the_crew:
            for element in the_crew:
                if element["job"] == "Director":
                    self.media_details["director_name"] = element.get("name", "Unknown")
                    break

        # Create genres and actors list
        genres_list, actors_list = [], []
        if not updating:
            genres_list = self.get_genres()
            actors_list = self.get_actors()

        # Populate dict attribute
        self.all_data = {"media_data": self.media_details, "genres_data": genres_list, "actors_data": actors_list}

    def add_data_to_db(self):
        """ Add new Movies data to the database """

        # Add media to local database
        # noinspection PyArgumentList
        self.media = Movies(**self.all_data["media_data"])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Add genres to local db (add media.id to genre dict)
        for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
            db.session.add(MoviesGenre(**genre))

        # Add actors to local db (add media.id to actor dict)
        for actor in [{**item, "media_id": self.media.id} for item in self.all_data["actors_data"]]:
            db.session.add(MoviesActors(**actor))


class ApiGames(ApiData):
    """ Games specific API class """

    GROUP = MediaType.GAMES
    LOCAL_COVER_PATH = Path(app.root_path, "static/covers/games_covers/")
    POSTER_BASE_URL = "https://images.igdb.com/igdb/image/upload/t_1080p/"

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.API_id = API_id
        self.query = []

        # Create header
        self.headers = {"Client-ID": f"{app.config['CLIENT_IGDB']}",
                        "Authorization": f"Bearer {app.config['IGDB_API_KEY']}"}

    @staticmethod
    def HLTB_time(game_name: str) -> Dict:
        """ Fetch HLTB time using a HowLongToBeat scraping API """

        # Create return dict
        return_data = {"main": None, "extra": None, "completionist": None}

        # Get matching games in list
        games_list = HowLongToBeat().search(game_name.lower(), similarity_case_sensitive=False)

        # Check <games_list>
        if games_list and len(games_list) > 0:
            # Fetch game with max similarity
            game = max(games_list, key=lambda x: x.similarity)

            # Replace data
            return_data["main"] = game.main_story
            return_data["extra"] = game.main_extra
            return_data["completionist"] = game.completionist

        return return_data

    # noinspection PyUnusedLocal
    @sleep_and_retry
    @limits(calls=4, period=1)
    def search(self, game_name: str, page: int = 1):
        """ Search game using IGDB API. <page> attribute necessary for consistency """

        body = f'fields id, name, cover.image_id, first_release_date, storyline; limit 50; search "{game_name}";'
        response = requests.post("https://api.igdb.com/v4/games", data=body, headers=self.headers, timeout=10)

        # Check game name in local db
        self.query = Games.query.filter(Games.name.ilike("%" + game_name + "%")).all()

        # Raise fo status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)

    def get_autocomplete_list(self) -> List[Dict]:
        """ Get autocomplete list for autocomplete search """

        # Add games from db to result
        db_results = []
        for game in self.query:
            media_details = {
                "api_id": game.api_id,
                "display_name": game.name,
                "category": "Games",
                "type": "Games",
                "image_cover": game.get_media_cover(),
                "date": change_air_format(game.release_date, games=True)
            }
            db_results.append(media_details)

        # Check for API results
        media_results = []
        if len(self.API_data) > 0:
            for result in self.API_data:
                media_details = {}
                if len(media_results) >= 8:
                    break

                media_details["api_id"] = result.get("id")
                media_details["display_name"] = result.get("name")
                media_details["category"] = "Games"
                media_details["type"] = "Games"
                media_details["image_cover"] = url_for("static", filename="covers/series_covers/default.jpg")

                if result.get("cover"):
                    media_details["image_cover"] = f"{self.POSTER_BASE_URL}{result['cover']['image_id']}.jpg"

                # Format date
                media_details["date"] = change_air_format(result.get("first_release_date"), games=True)

                # Append to media results
                media_results.append(media_details)

        # Sum both list of dict
        media_results = db_results + media_results

        return media_results

    def get_search_list(self) -> Tuple[List[Dict], int, int]:
        """ Create search list for search page (not autocomplete) """

        media_results = []
        if len(self.API_data) > 0:
            for result in self.API_data:
                media_data = dict(
                    name=result.get("name", "Unknown"),
                    overview=result.get("storyline", "No storyline found.") or "No storyline found.",
                    first_air_date=change_air_format(result.get("first_release_date"), games=True),
                    api_id=result.get("id"),
                    poster_path=url_for("static", filename="covers/games_covers/default.jpg")
                )

                # Recover <poster_path> or take <default> image
                if result.get("cover"):
                    media_data["poster_path"] = f"{self.POSTER_BASE_URL}{result['cover']['image_id']}.jpg"

                # Put data in different lists in function of <media_type>
                media_data["media"] = "Games"
                media_data["media_type"] = "Games"
                media_results.append(media_data)

        # Return list, total elements, page
        return media_results, 50, 1

    def get_details_and_credits_data(self):
        """ Get details and credits data from IGDB API """

        # Create query for IGDB game
        body = f"fields name, cover.image_id, collection.name, game_engines.name, game_modes.name, " \
               f"platforms.name, genres.name, player_perspectives.name, total_rating, total_rating_count, " \
               f"first_release_date, involved_companies.company.name, involved_companies.developer, " \
               f"involved_companies.publisher, storyline, summary, themes.name, url, external_games.uid, " \
               f"external_games.category; where id={self.API_id};" \
 \
            # API call
        response = requests.post("https://api.igdb.com/v4/games", data=body, headers=self.headers, timeout=15)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)[0]

    def from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to local db """

        self.media_details = dict(
            name=self.API_data.get('name', 'Unknown') or 'Unknown',
            release_date=self.API_data.get('first_release_date', 'Unknown') or 'Unknown',
            IGDB_url=self.API_data.get('url', 'Unknown') or 'Unknown',
            vote_average=self.API_data.get('total_rating', 0) or 0,
            vote_count=self.API_data.get('total_rating_count', 0) or 0,
            synopsis=self.API_data.get('summary', 'No synopsis found.') or 'No synopsis found.',
            storyline=self.API_data.get('storyline', 'No storyline found.') or 'No storyline found.',
            collection_name=self.API_data.get('collection', {'name': 'Unknown'})['name'] or 'Unknown',
            game_engine=self.API_data.get('game_engines', [{'name': 'Unknown'}])[0]['name'] or 'Unknown',
            player_perspective=self.API_data.get('player_perspectives', [{'name': 'Unknown'}])[0]['name'] or 'Unknown',
            game_modes=",".join([x["name"] for x in self.API_data.get('game_modes', [{'name': 'Unknown'}])]),
            api_id=self.API_data.get("id"),
            image_cover=self.get_media_cover(),
            hltb_main_time=None,
            hltb_main_and_extra_time=None,
            hltb_total_complete_time=None,
        )

        # Get HLTB times
        hltb_time = self.HLTB_time(self.media_details["name"])

        # Populate <media_details> with HLTB data
        self.media_details["hltb_main_time"] = hltb_time["main"]
        self.media_details["hltb_main_and_extra_time"] = hltb_time["extra"]
        self.media_details["hltb_total_complete_time"] = hltb_time["completionist"]

        # Add companies, genres (fusion with themes), and platforms
        companies_list, fusion_list, platforms_list = [], [], []
        if not updating:
            # Platform list
            platforms = self.API_data.get("platforms") or None
            if platforms:
                for platform in platforms:
                    platforms_list.append({"name": platform["name"]})
            else:
                platforms_list.append({"name": "Unknown"})

            # Companies list
            companies = self.API_data.get("involved_companies") or None
            if companies:
                for company in companies:
                    companies_list.append({"name": company["company"]["name"],
                                           "publisher": company["publisher"],
                                           "developer": company["developer"]})
            else:
                companies_list.append({'name': 'Unknown', 'publisher': False, 'developer': False})

            # Genres list
            genres_list = []
            genres = self.API_data.get("genres") or None
            if genres:
                for i in range(0, len(genres)):
                    genres_list.append({"genre": genres[i]["name"]})

            # Themes list
            themes_list = []
            themes = self.API_data.get("themes") or None
            if themes:
                for i in range(0, len(themes)):
                    themes_list.append({"genre": themes[i]["name"]})

            fusion_list = genres_list + themes_list
            if len(fusion_list) == 0:
                fusion_list.append({"genre": "Unknown"})

        # Populate dict attribute
        self.all_data = {"media_data": self.media_details, "companies_data": companies_list,
                         "genres_data": fusion_list, "platforms_data": platforms_list}

    def add_data_to_db(self):
        """ Add game to local database """

        # noinspection PyArgumentList
        self.media = Games(**self.all_data['media_data'])
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
        for company in [{**item, 'media_id': self.media.id} for item in self.all_data['companies_data']]:
            db.session.add(GamesCompanies(**company))

        # Add platform
        for platform in [{**item, 'media_id': self.media.id} for item in self.all_data['platforms_data']]:
            db.session.add(GamesPlatforms(**platform))

    def save_api_cover(self, media_cover_path: str, media_cover_name: str):
        """ Save game cover using API """

        # Create header
        headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) "
                                 "Chrome/23.0.1271.64 Safari/537.11",
                   "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                   "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
                   "Accept-Encoding": "none",
                   "Accept-Language": "en-US,en;q=0.8",
                   "Connection": "keep-alive"}

        # Create request
        request_ = Request(url=f"{self.POSTER_BASE_URL}{media_cover_path}.jpg", headers=headers)

        # Fetch response
        response = request.urlopen(request_)

        # Write cover to disk
        f = open(f"{self.LOCAL_COVER_PATH}/{media_cover_name}", "wb")
        f.write(response.read())
        f.close()

        # Resize image using PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{media_cover_name}")
        img = img.resize((300, 450), Image.ANTIALIAS)
        img.save(f"{self.LOCAL_COVER_PATH}/{media_cover_name}", quality=90)

    def get_media_cover(self) -> str:
        """ Get the media cover for the game """

        media_cover_name = "default.jpg"
        media_cover_path = self.API_data.get("cover")["image_id"] or None
        if media_cover_path:
            media_cover_name = f"{secrets.token_hex(8)}.jpg"
            try:
                self.save_api_cover(media_cover_path, media_cover_name)
            except Exception as e:
                app.logger.error(f"[ERROR] - Trying to recover the poster: {e}")
                media_cover_name = "default.jpg"

        return media_cover_name


class ApiBooks(ApiData):
    """ Fetch books using the Google Books API """

    GROUP = MediaType.BOOKS
    LOCAL_COVER_PATH = Path(app.root_path, "static/covers/books_covers/")

    def __init__(self, API_id: int = None):
        super().__init__(API_id)

        self.query = []
        self.API_id = API_id
        self.default_path = "/static/covers/series_covers/default.jpg"

    @sleep_and_retry
    @limits(calls=2, period=1)
    def search(self, query: str, page: int = 0):
        """ Search game using IGDB API. <page> attribute begin at zero """

        # API call
        response = requests.get(f"https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={str(page)}",
                                timeout=10)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)

    def get_autocomplete_list(self) -> List[Dict]:
        """ Create the autocomplete list for the autocomplete search """

        media_results = []
        get_qte = self.API_data.get("totalItems")
        if get_qte and get_qte > 0:
            for result in self.API_data["items"]:
                info = result["volumeInfo"]
                media_details = dict(
                    api_id=result.get("id"),
                    display_name=info.get("title", "Unknown") or "Unknown",
                    author=info.get("authors", ["Unknown"])[0] or "Unknown",
                    date=change_air_format(info.get("publishedDate"), books=True),
                    image_cover=info.get("imageLinks", {"thumbnail": self.default_path})["thumbnail"] or "Unknown",
                    category='Books',
                    type='Books',
                )

                # Append data to list
                media_results.append(media_details)

        return media_results

    def get_search_list(self) -> Tuple[List[Dict], int, int]:
        """ Get search list for search page, not autocomplete """

        media_results = []
        get_qte = self.API_data.get("totalItems")
        if get_qte and get_qte > 0:
            for result in self.API_data["items"]:
                info = result["volumeInfo"]
                media_details = dict(
                    api_id=result.get("id"),
                    name=info.get("title", "Unknown") or "Unknown",
                    author=info.get("authors", ["Unknown"])[0] or "Unknown",
                    overview=clean_text(info.get("description", "Unknown")),
                    first_air_date=change_air_format(info.get("publishedDate"), books=True),
                    poster_path=info.get("imageLinks", {"thumbnail": self.default_path})["thumbnail"] or "Unknown",
                    media="Books"
                )

                # Append dict to list
                media_results.append(media_details)

        # Get total results
        total_results = self.API_data.get("totalItems")
        try:
            total_pages = total_results // 10
        except:
            total_pages = 1

        return media_results, total_results, total_pages

    @sleep_and_retry
    @limits(calls=2, period=1)
    def get_details_and_credits_data(self):
        """ Get details and credits for books """

        # API call
        response = requests.get(f"https://www.googleapis.com/books/v1/volumes/{self.API_id}", timeout=10)

        # Raise for status
        response.raise_for_status()

        # Populate attribute
        self.API_data = json.loads(response.text)["volumeInfo"]

    def from_API_to_dict(self, updating: bool = False):
        """ Transform API data to dict to add to local database """

        self.media_details = dict(
            name=self.API_data.get('title', 'Unknown') or 'Unknown',
            release_date=change_air_format(self.API_data.get('publishedDate'), books=True),
            pages=self.API_data.get('pageCount', 0) or 0,
            publishers=self.API_data.get('publisher', 'Unknown') or 'Unknown',
            synopsis=clean_text(self.API_data.get('description', 'Unknown')),
            language=self.API_data.get('language', 'Unknown') or 'Unknown',
            api_id=self.API_id,
            image_cover=self.get_media_cover(),
            lock_status=True
        )

        # Get authors
        authors, authors_list = self.API_data.get('authors') or None, []
        if authors:
            for author in authors:
                authors_list.append({"name": author})
        else:
            authors_list.append({"name": "Unknown"})

        # No genres in books API
        genres_list = [{"genre": "Unknown"}]

        # Populate attribute
        self.all_data = {"media_data": self.media_details, "genres_data": genres_list, "authors_data": authors_list}

    def add_data_to_db(self):
        """ Add new book data to local database """

        # noinspection PyArgumentList
        self.media = Books(**self.all_data['media_data'])
        db.session.add(self.media)

        # Commit changes
        db.session.commit()

        # Add genres
        for genre in [{**item, "media_id": self.media.id} for item in self.all_data["genres_data"]]:
            db.session.add(BooksGenre(**genre))

        # Add authors
        for author in [{**item, "media_id": self.media.id} for item in self.all_data["authors_data"]]:
            db.session.add(BooksAuthors(**author))

    def save_api_cover(self, media_cover_path: str, media_cover_name: str):
        """ Save API book cover to local disk """

        # Retrieve cover
        urlretrieve(f"{media_cover_path}", f"{self.LOCAL_COVER_PATH}/{media_cover_name}")

        # Resize and save with PIL
        img = Image.open(f"{self.LOCAL_COVER_PATH}/{media_cover_name}")
        img = img.resize((300, 450), Image.ANTIALIAS)
        img.save(f"{self.LOCAL_COVER_PATH}/{media_cover_name}", quality=90)

    def get_media_cover(self) -> str:
        """ Get media cover, from Google Books API or using Google Image script in /static """

        media_cover_name = f"{secrets.token_hex(8)}.jpg"
        try:
            self.save_api_cover(self.API_data["imageLinks"]["medium"], media_cover_name)
        except:
            try:
                self.save_api_cover(self.API_data["imageLinks"]["large"], media_cover_name)
            except:
                from MyLists.static.books_img_ddl.books import GoogleImages

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
                    img = img.resize((300, 450), Image.ANTIALIAS)
                    img.save(path)

                    # Get cover name
                    media_cover_name = os.path.basename(path)
                except:
                    media_cover_name = "default.jpg"

        return media_cover_name
