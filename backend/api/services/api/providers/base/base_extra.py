from abc import abstractmethod, ABC
from typing import Optional, Dict, Literal, List

import requests
from flask import abort
from requests import Response

from backend.api.services.api.data_classes import ApiParams


class BaseApiExtra(ABC):
    def __init__(self, params: Optional[ApiParams] = None):
        self.params = params

    @abstractmethod
    def execute(self, name: str) -> List[Dict] | Dict:
        """ Function that execute the api call and format the data """
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
