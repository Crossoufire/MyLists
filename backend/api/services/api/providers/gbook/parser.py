from typing import Dict, Optional, Tuple

from flask import url_for

from backend.api import MediaType, db
from backend.api.utils.enums import ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.providers.base.base_extra import BaseApiExtra
from backend.api.services.api.providers.base.base_parser import BaseApiParser
from backend.api.utils.functions import get, format_datetime, naive_utcnow, clean_html_text
from backend.api.services.api.data_classes import ApiParams, BooksParsedSearchItem, ParsedSearch, ApiSearchResult


class BooksApiParser(BaseApiParser):
    DEFAULT_PAGES: int = 50

    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search_parser(self, search_results: ApiSearchResult) -> ParsedSearch:
        media_results = []
        results = get(search_results.results, "items", default=[])
        for result in results:
            info = result["volumeInfo"]

            media_details = BooksParsedSearchItem(
                api_id=result.get("id"),
                media_type=MediaType.BOOKS,
                name=get(info, "title"),
                date=info.get("publishedDate"),
                author=get(info, "authors", 0),
                image_cover=get(info, "imageLinks", "thumbnail", default=url_for("static", filename="/covers/default.jpg")),
            )

            media_results.append(media_details)

        total = get(search_results.results, "totalItems", default=0)
        pages = total // self.params.results_per_page

        return ParsedSearch(items=media_results, total=total, pages=pages)

    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        volume_info = details.get("volumeInfo")
        media_details = dict(
            lock_status=True,
            api_id=details["id"],
            image_cover=cover_name,
            last_api_update=naive_utcnow(),
            name=get(volume_info, "title"),
            language=get(volume_info, "language"),
            publishers=get(volume_info, "publisher"),
            release_date=format_datetime(volume_info.get("publishedDate")),
            synopsis=clean_html_text(get(volume_info, "description")),
            pages=get(volume_info, "pageCount", default=self.DEFAULT_PAGES),
        )

        return dict(
            media_data=media_details,
            genres_data=[],
            authors_data=[{"name": author} for author in get(volume_info, "authors", default=[])],
        )

    def parse_cover_url(self, details_data: Dict) -> Optional[str]:
        volume_info = details_data.get("volumeInfo")
        cover_url = get(volume_info, "imageLinks", "large")
        if not cover_url:
            cover_url = get(volume_info, "imageLinks", "medium")
        return cover_url

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

    # --- UTILS ------------------------------------------------------------

    def _common_add_update(self, data: Dict) -> Tuple[Dict, Dict]:
        models = ModelsManager.get_dict_models(self.params.media_type, "all")

        related_data = {
            models.get(ModelTypes.GENRE): data.get("genres_data", []),
            models.get(ModelTypes.AUTHORS): data.get("authors_data", []),
        }
        return models, related_data
