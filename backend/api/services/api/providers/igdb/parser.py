from datetime import timedelta
from typing import Dict, List, Optional, Tuple

from flask import url_for
from sqlalchemy import or_

from backend.api import MediaType, db
from backend.api.utils.enums import ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.functions import get, format_datetime, naive_utcnow
from backend.api.services.api.providers.base.base_extra import BaseApiExtra
from backend.api.services.api.providers.base.base_parser import BaseApiParser
from backend.api.services.api.data_classes import ApiParams, ParsedSearchItem, ApiSearchResult, ParsedSearch


class GamesApiParser(BaseApiParser):
    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search_parser(self, search_results: ApiSearchResult) -> ParsedSearch:
        results = []
        for result in search_results.results:
            if len(results) >= self.params.results_per_page or result == "message":
                break

            media_details = ParsedSearchItem(
                api_id=result.get("id"),
                name=get(result, "name"),
                image_cover=url_for("static", filename="covers/default.jpg"),
                date=result.get("first_release_date"),
                media_type=MediaType.GAMES,
            )

            cover = get(result, "cover", "image_id")
            if cover:
                media_details.image_cover = f"{self.params.poster_base_url}{cover}.jpg"

            results.append(media_details)

        return ParsedSearch(
            items=results,
            total=search_results.total,
            pages=search_results.total // self.params.results_per_page,
        )

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        media_details = dict(
            api_id=details["id"],
            image_cover=cover_name,
            last_api_update=naive_utcnow(),
            name=get(details, "name"),
            IGDB_url=get(details, "url"),
            synopsis=get(details, "summary"),
            game_engine=get(details, "game_engines", 0, "name"),
            vote_average=get(details, "total_rating", default=0),
            vote_count=get(details, "total_rating_count", default=0),
            release_date=format_datetime(get(details, "first_release_date")),
            player_perspective=get(details, "player_perspectives", 0, "name"),
            game_modes=",".join([g.get("name") for g in get(details, "game_modes", default=[])]),
        )

        if not bulk and extra:
            hltb_times = extra.execute(media_details["name"])
            media_details["hltb_main_time"] = hltb_times["main"]
            media_details["hltb_main_and_extra_time"] = hltb_times["extra"]
            media_details["hltb_total_complete_time"] = hltb_times["completionist"]

        return dict(
            media_data=media_details,
            genres_data=self._parse_genres(details),
            companies_data=self._parse_companies(details),
            platforms_data=[{"name": platform["name"]} for platform in get(details, "platforms", default=[])],
        )

    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        raise NotImplementedError("The Games does not have trending data")

    def parse_cover_url(self, details_data: Dict) -> Optional[str]:
        return self.params.poster_base_url + get(details_data, "cover", "image_id") + ".jpg"

    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        model = ModelsManager.get_unique_model(self.params.media_type, ModelTypes.MEDIA)

        query = model.query.with_entities(model.api_id).filter(
            or_(model.release_date > naive_utcnow(), model.release_date.is_(None)),
            model.last_api_update < naive_utcnow() - timedelta(days=7),
        ).all()

        return [int(game_id[0]) for game_id in query]

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

    def _common_add_update(self, data: Dict) -> Tuple[Dict, Dict]:
        models = ModelsManager.get_dict_models(self.params.media_type, "all")

        related_data = {
            models.get(ModelTypes.GENRE): data.get("genres_data", []),
            models.get(ModelTypes.COMPANIES): data.get("companies_data", []),
            models.get(ModelTypes.PLATFORMS): data.get("platforms_data", []),
        }
        return models, related_data

    @staticmethod
    def _parse_companies(details_data: Dict) -> List[Dict]:
        companies_list = []
        for item in get(details_data, "involved_companies", default=[]):
            if item["developer"] is False and item["publisher"] is False:
                continue
            companies_list.append(dict(
                name=item["company"]["name"],
                developer=item["developer"],
                publisher=item["publisher"],
            ))
        return companies_list

    @staticmethod
    def _parse_genres(details_data: Dict) -> List[Dict]:
        all_genres = get(details_data, "genres", default=[])
        all_themes = get(details_data, "themes", default=[])
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
