from __future__ import annotations

from dataclasses import asdict
from typing import Optional, List, Dict

from backend.api import db
from backend.api.services.api.strategies.changes import ChangeDetectionStrategy
from backend.api.services.api.providers.base import BaseApiParser, BaseApiCaller, BaseApiExtra


class ApiService:
    def __init__(
            self,
            api_parser: BaseApiParser,
            api_caller: BaseApiCaller,
            api_extra: Optional[BaseApiExtra] = None,
            change_strategy: Optional[ChangeDetectionStrategy] = None,
    ):
        self.api_extra = api_extra
        self.api_parser = api_parser
        self.api_caller = api_caller
        self.change_strategy = change_strategy

    def search(self, query: str, page: int = 1) -> Dict:
        """ Search for a query in the API and return the formatted results """

        # Fetch search results
        search_results = self.api_caller.search(query, page)

        # Return ParsedSearch data
        # noinspection PyTypeChecker
        return asdict(self.api_parser.search_parser(search_results))

    def save_media_to_db(self, api_id: int | str) -> db.Model:
        data = self._details(api_id)
        media = self.api_parser.add_to_db(data)
        return media

    def update_media_to_db(self, api_id: int | str, bulk: bool = False):
        data = self._details(api_id, bulk)
        self.api_parser.update_to_db(api_id, data)
        db.session.commit()

    def trending(self) -> List[Dict]:
        trending_data = self.api_caller.trending()
        return self.api_parser.trending_parser(trending_data)

    def changed_api_ids(self) -> List[int]:
        """ Return the changed API ids using the configured strategy """
        if not self.change_strategy:
            raise ValueError(f"No change detection strategy configured for '{self.api_caller.params.media_type.upper()}'")
        return self.change_strategy.get_changed_ids(self.api_caller, self.api_parser)

    def update_api_token(self):
        self.api_caller.update_token()

    def save_media_to_db_from_json(self, json_data: Dict) -> db.Model:
        """ Save media to db from json data """
        return self.api_parser.add_to_db(json_data)

    def _details(self, api_id: int | str, bulk: bool = False) -> db.Model:
        """ Fetch media details from an API, return formatted results and save the media to db """

        # Fetch main details
        details_data = self.api_caller.details(api_id)

        # Parse cover URL from details
        cover_url = self.api_parser.parse_cover_url(details_data)

        # Fetch cover image as bytes
        image_bytes = self.api_caller.fetch_cover(cover_url)

        # Save cover image to disk
        cover_saved_name = self.api_parser.save_cover_to_disk(image_bytes)

        # Parse details and return a dict
        return self.api_parser.details_parser(details_data, cover_saved_name, self.api_extra, bulk)
