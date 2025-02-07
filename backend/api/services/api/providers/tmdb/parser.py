from datetime import timedelta
from typing import Dict, List, Optional, Tuple

from flask import url_for
from sqlalchemy import or_

from backend.api import db
from backend.api.utils.enums import ModelTypes, MediaType
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.providers.base.base_extra import BaseApiExtra
from backend.api.utils.functions import get, format_datetime, naive_utcnow, is_latin
from backend.api.services.api.data_classes import ApiParams, ParsedSearchItem, ApiSearchResult, ParsedSearch
from backend.api.services.api.providers.base.base_parser import BaseApiParser, TrendingParser, ChangedApiIdsParser


class TMDBApiParser(BaseApiParser, ChangedApiIdsParser, TrendingParser):
    MAX_GENRES: int = 5
    MAX_ACTORS: int = 5
    MAX_NETWORK: int = 4
    MAX_TRENDING: int = 12

    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search_parser(self, search_results: ApiSearchResult) -> ParsedSearch:
        s_results = []
        results = get(search_results.results, "results", default=[])
        for result in results:
            if result.get("known_for_department"):
                continue

            media_info = dict(
                api_id=result.get("id"),
                image_cover=url_for("static", filename="covers/default.jpg"),
            )

            if result.get("poster_path"):
                media_info["image_cover"] = self.params.poster_base_url + result.get("poster_path")

            if result.get("media_type") == "tv":
                # noinspection PyUnresolvedReferences
                media_info.update(self._process_tv(result))
            elif result.get("media_type") == "movie":
                # noinspection PyUnresolvedReferences
                media_info.update(self._process_movie(result))

            s_results.append(ParsedSearchItem(**media_info))

        total = 0
        pages = (total // self.params.results_per_page) + 1

        return ParsedSearch(items=s_results, total=total, pages=pages)

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        raise NotImplementedError("The specifics must be implemented in the subclasses")

    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        raise NotImplementedError("The specifics must be implemented in the subclasses")

    def parse_cover_url(self, details_data: Dict) -> Optional[str]:
        return self.params.poster_base_url + details_data.get("poster_path")

    def add_to_db(self, data: Dict) -> db.Model:
        models, related_data = self._common_add_update(data)

        media = models[ModelTypes.MEDIA](**data["media_data"])
        db.session.add(media)
        db.session.flush()

        for model, data_list in related_data.items():
            if data_list:
                db.session.add_all([model(**{**item, "media_id": media.id}) for item in data_list])

        db.session.commit()

        return media

    def update_to_db(self, api_id: int | str, data: Dict):
        models, related_data = self._common_add_update(data)

        media = models[ModelTypes.MEDIA].query.filter_by(api_id=api_id).first()
        media.update(data["media_data"])

        for model, data_list in related_data.items():
            if data_list:
                model.query.filter_by(media_id=media.id).delete()
                db.session.add_all([model(**{**item, "media_id": media.id}) for item in data_list])

    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        raise NotImplementedError("The specifics must be implemented in the subclasses")

    # --- UTILS ------------------------------------------------------------

    def _common_add_update(self, data: Dict) -> Tuple[Dict, Dict]:
        models = ModelsManager.get_dict_models(self.params.media_type, "all")

        related_data = {
            models.get(ModelTypes.EPS): data.get("seasons_data", []),
            models.get(ModelTypes.GENRE): data.get("genres_data", []),
            models.get(ModelTypes.ACTORS): data.get("actors_data", []),
            models.get(ModelTypes.NETWORK): data.get("networks_data", []),
        }
        return models, related_data

    @staticmethod
    def _process_movie(result: Dict) -> Dict:
        media_info = dict(
            media_type=MediaType.MOVIES,
            date=result.get("release_date"),
            name=result.get("original_title") if is_latin(result.get("original_title")) else result.get("title")
        )
        return media_info

    @staticmethod
    def _process_tv(result: Dict) -> Dict:
        media_info = dict(
            media_type=MediaType.SERIES,
            date=result.get("first_air_date"),
            name=result.get("original_name") if is_latin(result.get("original_name")) else result.get("name")
        )

        # Change <media_type> to <anime> on conditions
        is_jap = result.get("origin_country") == "JP" or result.get("original_language") == "ja"
        is_anime = 16 in result.get("genre_ids")
        if is_jap and is_anime:
            media_info["media_type"] = MediaType.ANIME

        return media_info

    def _format_actors(self, details: Dict) -> List[Dict]:
        """ Get the <MAX_ACTORS> actors for series, anime and movies """

        all_actors = get(details, "credits", "cast", default=[])
        actors_list = [{"name": actor["name"]} for actor in all_actors[:self.MAX_ACTORS]]

        return actors_list

    def _format_genres(self, details: Dict, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> List[Dict]:
        """ Fetch series, anime, or movies genres (fallback for anime) """

        all_genres = get(details, "genres", default=[])
        genres_list = [{"name": genre["name"]} for genre in all_genres]

        return genres_list[:self.MAX_GENRES]


class TVApiParser(TMDBApiParser):
    """ Parser for both Series and Anime """

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        media_details = dict(
            api_id=details["id"],
            image_cover=cover_name,
            last_api_update=naive_utcnow(),
            name=get(details, "name"),
            synopsis=get(details, "overview"),
            homepage=get(details, "homepage"),
            prod_status=get(details, "status"),
            created_by=self._format_creators(details),
            original_name=get(details, "original_name"),
            vote_count=get(details, "vote_count", default=0),
            popularity=get(details, "popularity", default=0),
            origin_country=get(details, "origin_country", 0),
            vote_average=get(details, "vote_average", default=0),
            total_seasons=get(details, "number_of_seasons", default=1),
            total_episodes=get(details, "number_of_episodes", default=1),
            release_date=format_datetime(get(details, "first_air_date")),
            last_air_date=format_datetime(get(details, "last_air_date")),
            duration=get(details, "episode_run_time", 0, default=self._default_duration()),
            next_episode_to_air=None,
            season_to_air=None,
            episode_to_air=None,
        )

        next_episode_to_air = details.get("next_episode_to_air")
        if next_episode_to_air:
            media_details["next_episode_to_air"] = format_datetime(next_episode_to_air["air_date"])
            media_details["season_to_air"] = next_episode_to_air["season_number"]
            media_details["episode_to_air"] = next_episode_to_air["episode_number"]

        seasons_list = []
        seasons = get(details, "seasons", default=[])
        for season in seasons:
            if season.get("season_number", 0) > 0:
                seasons_list.append({"season": season["season_number"], "episodes": season["episode_count"]})
        if not seasons_list:
            seasons_list.append({"season": 1, "episodes": 1})

        networks = get(details, "networks", default=[])
        networks_list = [{"name": network["name"]} for network in networks[:self.MAX_NETWORK]]

        return dict(
            media_data=media_details,
            seasons_data=seasons_list,
            networks_data=networks_list,
            actors_data=self._format_actors(details),
            genres_data=self._format_genres(details, extra, bulk),
        )

    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        tv_results = []
        results = get(trending_data, "results", default=[])
        for result in results[:self.MAX_TRENDING]:
            mt = MediaType.SERIES
            if 16 in result.get("genre_ids") and result.get("origin_country") == "JP" or result.get("original_language") == "ja":
                mt = MediaType.ANIME

            media_data = dict(
                media_type=mt,
                api_id=result.get("id"),
                overview=get(result, "overview"),
                display_name=get(result, "name"),
                release_date=result.get("first_air_date"),
            )

            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.params.poster_base_url}{poster_path}"

            if is_latin(result.get("original_name")):
                media_data["display_name"] = result.get("original_name")

            tv_results.append(media_data)

        return tv_results

    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        media_model = ModelsManager.get_unique_model(self.params.media_type, ModelTypes.MEDIA)

        query = media_model.query.with_entities(media_model.api_id).filter(
            media_model.api_id.in_(api_ids),
            media_model.lock_status.is_not(True),
            media_model.last_api_update < naive_utcnow() - timedelta(seconds=86000),
        ).all()

        return [api_ids[0] for api_ids in query]

    # --- UTILS ------------------------------------------------------------

    def _default_duration(self) -> int:
        return 40 if self.params.media_type == MediaType.SERIES else 24

    def _format_genres(self, details: Dict, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> List[Dict]:
        """ Get anime genre from the Jikan API (genres + demographic). Fallback on TMDB API genres if necessary """

        # Always parse TMDB genres
        tmdb_genres_list = super()._format_genres(details, extra, bulk)

        # If Series always use TMDB genres
        if self.params.media_type == MediaType.SERIES:
            return tmdb_genres_list

        # If Anime BUT bulk == True, use TMDB genres
        if bulk:
            return tmdb_genres_list

        # If Anime and not bulk, use Jikan API genres (extra)
        anime_genres_list = extra.execute(details["name"])

        # If list empty, fallback on TMDB genres
        if not anime_genres_list:
            return tmdb_genres_list

        return anime_genres_list

    @staticmethod
    def _format_creators(details: Dict) -> Optional[str]:
        """ Select creators, if not creators then take top 2 writers (by popularity) """

        creators = get(details, "created_by", default=[])
        if creators:
            return ", ".join([creator["name"] for creator in creators])

        tv_crew = get(details, "credits", "crew", default=[])
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


class MoviesApiParser(TMDBApiParser):
    DURATION = 90

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        media_details = dict(
            api_id=details["id"],
            image_cover=cover_name,
            tagline=details.get("tagline"),
            last_api_update=naive_utcnow(),
            name=get(details, "title"),
            synopsis=get(details, "overview"),
            homepage=get(details, "homepage"),
            budget=get(details, "budget", default=0),
            revenue=get(details, "revenue", default=0),
            original_name=get(details, "original_title"),
            vote_count=get(details, "vote_count", default=0),
            popularity=get(details, "popularity", default=0),
            original_language=get(details, "original_language"),
            vote_average=get(details, "vote_average", default=0),
            duration=get(details, "runtime", default=self.DURATION),
            release_date=format_datetime(get(details, "release_date")),
            director_name=None,
        )

        all_crew = get(details, "credits", "crew", default=[])
        for crew in all_crew:
            if crew.get("job") == "Director":
                media_details["director_name"] = get(crew, "name")
                break

        return dict(
            media_data=media_details,
            actors_data=self._format_actors(details),
            genres_data=self._format_genres(details, extra, bulk),
        )

    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        movies_results = []
        results = get(trending_data, "results", default=[])
        for result in results[:self.MAX_TRENDING]:
            media_data = dict(
                api_id=result.get("id"),
                overview=get(result, "overview"),
                display_name=get(result, "title"),
                release_date=result.get("release_date"),
                media_type=MediaType.MOVIES,
            )

            poster_path = get(result, "poster_path", default=url_for("static", filename="covers/default.jpg"))
            media_data["poster_path"] = f"{self.params.poster_base_url}{poster_path}"

            if is_latin(result.get("original_title")):
                media_data["display_name"] = result.get("original_title")

            movies_results.append(media_data)

        return movies_results

    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        media_model = ModelsManager.get_unique_model(self.params.media_type, ModelTypes.MEDIA)

        query = media_model.query.with_entities(media_model.api_id).filter(
            media_model.lock_status.is_not(True),
            media_model.last_api_update < naive_utcnow() - timedelta(days=7),
            or_(media_model.release_date > naive_utcnow() - timedelta(days=90), media_model.release_date.is_(None)),
        ).all()

        return [movie_id[0] for movie_id in query]
