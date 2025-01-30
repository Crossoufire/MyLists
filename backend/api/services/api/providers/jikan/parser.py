from typing import Dict, List, Optional, Tuple

from flask import url_for

from backend.api import MediaType, db
from backend.api.utils.enums import ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.providers.base.base_extra import BaseApiExtra
from backend.api.services.api.providers.base.base_parser import BaseApiParser
from backend.api.utils.functions import get, format_datetime, naive_utcnow, clean_html_text
from backend.api.services.api.data_classes import ApiParams, ParsedSearchItem, ApiSearchResult, ParsedSearch


class MangaApiParser(BaseApiParser):
    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search_parser(self, search_results: ApiSearchResult) -> ParsedSearch:
        results = []
        raw_results = get(search_results.results, "data", default=[])
        for result in raw_results:
            media_details = ParsedSearchItem(
                media_type=MediaType.MANGA,
                api_id=result.get("mal_id"),
                name=result.get("title_english"),
                date=format_datetime(get(result, "published", "from")),
                image_cover=get(
                    result, "images", "jpg", "image_url",
                    default=url_for("static", filename="/covers/default.jpg"),
                ),
            )

            results.append(media_details)

        total = get(search_results.results, "items", "total", default=1)

        return ParsedSearch(items=results, total=total, pages=(total // 25) + 1)

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        media_details = dict(
            image_cover=cover_name,
            api_id=details["mal_id"],
            last_api_update=naive_utcnow(),
            site_url=get(details, "url"),
            volumes=get(details, "volumes"),
            chapters=get(details, "chapters"),
            prod_status=get(details, "status"),
            name=get(details, "title_english"),
            vote_average=get(details, "score"),
            vote_count=get(details, "scored_by"),
            popularity=get(details, "popularity"),
            publishers=self._format_publishers(details),
            original_name=get(details, "title_japanese"),
            synopsis=clean_html_text(get(details, "synopsis")),
            end_date=format_datetime(get(details, "published", "to")),
            release_date=format_datetime(get(details, "published", "from")),
        )

        return dict(
            media_data=media_details,
            authors_data=[{"name": author} for author in self._format_authors(details)],
            genres_data=[{"name": genre["name"]} for genre in details.get("genres", [])][:5],
        )

    def parse_cover_url(self, details_data: Dict) -> Optional[str]:
        return get(details_data, "images", "jpg", "large_image_url")

    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        raise NotImplementedError("The Manga does not have trending data")

    # TODO: IMPLEMENT changed_api_ids
    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        raise NotImplementedError("The Manga does not update the api ids")

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
            models.get(ModelTypes.AUTHORS): data.get("authors_data", []),
        }
        return models, related_data

    @staticmethod
    def _format_authors(details_data: Dict) -> List[str]:
        """ "authors": [{ "mal_id": 1881, "type": "people", "name": "Oda, Eiichiro"}, {...}] """

        def normalize_name(author_name: str) -> str:
            """ Convert 'LastName, FirstName' to 'FirstName LastName' format. """
            if not author_name:
                return ""
            parts = [p.strip() for p in author_name.split(",", 1)]
            return f"{parts[1]} {parts[0]}" if len(parts) > 1 else parts[0]

        author_list = []
        for author in get(details_data, "authors", default=[])[:2]:
            author_list.append(normalize_name(author["name"]))
        return author_list

    @staticmethod
    def _format_publishers(details_data: Dict) -> str:
        """ "serializations": [{ "mal_id": ..., "type": "manga", "name": "...", "url": ...}] """

        publisher_list = []
        for pub in get(details_data, "serializations", default=[])[:2]:
            publisher_list.append(pub["name"])
        return publisher_list[0] if publisher_list else None
