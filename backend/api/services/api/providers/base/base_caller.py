from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal, Dict, Optional, Protocol, List

import requests
from flask import abort
from requests import Response

from backend.api.services.api.data_classes import ApiSearchResult, ApiParams


class TrendingCallerProtocol(Protocol):
    def trending(self) -> Dict: ...


class ChangedApiIdsCallerProtocol(Protocol):
    def changed_api_ids(self) -> List[int]: ...


class UpdateTokenCallerProtocol(Protocol):
    def update_token(self) -> Optional[str]: ...


class BaseApiCaller(ABC, TrendingCallerProtocol, ChangedApiIdsCallerProtocol, UpdateTokenCallerProtocol):
    def __init__(self, params: ApiParams):
        self.params = params

    @abstractmethod
    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        pass

    @abstractmethod
    def details(self, api_id: int | str) -> Dict:
        pass

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


class ChangedApiIdsCaller(ABC):
    @abstractmethod
    def changed_api_ids(self):
        pass


class UpdateTokenCaller(ABC):
    @abstractmethod
    def update_token(self):
        pass


class TrendingCaller(ABC):
    @abstractmethod
    def trending(self) -> Dict:
        pass
