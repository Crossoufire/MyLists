from __future__ import annotations

from io import BytesIO
from urllib import request
from abc import ABC, abstractmethod
from typing import Literal, Dict, Optional

import requests
from flask import abort
from requests import Response

from backend.api import MediaType
from backend.api.services.api.data_classes import ApiSearchResult, ApiParams


class BaseApiCaller(ABC):
    def __init__(self, params: ApiParams):
        self.params = params

    @abstractmethod
    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        pass

    @abstractmethod
    def details(self, api_id: int | str) -> Dict:
        pass

    @abstractmethod
    def changed_api_ids(self):
        pass

    @abstractmethod
    def trending(self) -> Dict:
        pass

    def update_token(self):
        if self.params.media_type != MediaType.GAMES:
            raise NotImplementedError("Only the GamesApiCaller has this method.")

    @staticmethod
    def fetch_cover(cover_url: Optional[str]) -> Optional[BytesIO]:
        """ Fetch image data from a URL and returns it as BytesIO object. """

        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
            "Accept-Encoding": "none",
            "Accept-Language": "en-US,en;q=0.8",
            "Connection": "keep-alive",
        }

        try:
            req = request.Request(url=cover_url, headers=headers)
            with request.urlopen(req) as response:
                image_data = response.read()
            return BytesIO(image_data)
        except:
            return None

    @staticmethod
    def call(url: str, method: Literal["get", "post"] = "get", **kwargs) -> Response:
        try:
            response = getattr(requests, method)(url, **kwargs, timeout=10)
        except requests.exceptions.RequestException as error:
            if error.response is not None:
                return abort(error.response.status_code, description=error.response.reason)
            else:
                return abort(503, description="Failed to fetch data from external API")

        return response
