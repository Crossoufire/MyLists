import json
from typing import Dict

from backend.api.services.api.data_classes import ApiParams, ApiSearchResult
from backend.api.services.api.providers.base.base_caller import BaseApiCaller


class MangaApiCaller(BaseApiCaller):
    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        response = self.call(f"{self.params.main_url}?q={query}&page={page}")
        return ApiSearchResult(results=json.loads(response.text), total=0)

    def details(self, api_id: int | str) -> Dict:
        response = self.call(f"{self.params.main_url}/{api_id}/full")
        return json.loads(response.text)["data"]
