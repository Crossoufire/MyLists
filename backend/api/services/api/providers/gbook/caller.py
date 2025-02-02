import json
from typing import Dict

from backend.api.services.api.data_classes import ApiParams, ApiSearchResult
from backend.api.services.api.providers.base.base_caller import BaseApiCaller


class BooksApiCaller(BaseApiCaller):
    def __init__(self, params: ApiParams):
        super().__init__(params)

    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        offset = (page - 1) * self.params.results_per_page
        response = self.call(f"{self.params.main_url}?q={query}&startIndex={offset}")
        return ApiSearchResult(results=json.loads(response.text), total=0)

    def details(self, api_id: int | str) -> Dict:
        response = self.call(f"{self.params.main_url}/{api_id}")
        return json.loads(response.text)
