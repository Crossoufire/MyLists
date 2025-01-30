import json
from typing import Dict, List

from flask import current_app

from backend.api import MediaType, cache
from backend.api.services.api.data_classes import ApiParams, ApiSearchResult
from backend.api.services.api.providers.base.base_caller import BaseApiCaller


class TMDBApiCaller(BaseApiCaller):
    def __init__(self, params: ApiParams):
        super().__init__(params)
        self.mt = "movie" if self.params.media_type == MediaType.MOVIES else "tv"

    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        response = self.call(f"{self.params.main_url}/search/multi?api_key={self.params.api_key}&query={query}&page={page}")
        return ApiSearchResult(results=response.json(), total=0)

    def details(self, api_id: int | str) -> Dict:
        response = self.call(f"{self.params.main_url}/{self.mt}/{api_id}?api_key={self.params.api_key}&append_to_response=credits")
        return json.loads(response.text)

    def trending(self) -> Dict:
        response = self.call(f"{self.params.main_url}/trending/{self.mt}/week?api_key={self.params.api_key}")
        return response.json()

    def changed_api_ids(self) -> List[int]:
        """ Only TV (Series, Anime) changed API IDs """
        return self._tv_changed_api_ids()

    @cache.cached(timeout=300, key_prefix="tv_changed_ids")
    def _tv_changed_api_ids(self) -> List[int]:
        """ Data cached to be used for Series and Anime """

        page = 1
        total_pages = 1
        changed_api_ids = []
        while page <= min(total_pages, 20):
            response = self.call(f"{self.params.main_url}/tv/changes?api_key={self.params.api_key}&page={page}")
            data = json.loads(response.text)
            changed_api_ids.extend(d.get("id") for d in data.get("results", []))
            total_pages = data.get("total_pages", 1)
            current_app.logger.info(f"Changed TV API Ids - Fetched page {page} / {total_pages}")
            page += 1

        return changed_api_ids
