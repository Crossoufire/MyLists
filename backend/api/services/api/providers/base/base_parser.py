import secrets
from io import BytesIO
from abc import ABC, abstractmethod
from typing import List, Dict, Optional

from backend.api import db
from backend.api.utils.functions import resize_and_save_image
from backend.api.services.api.providers.base.base_extra import BaseApiExtra
from backend.api.services.api.data_classes import ParsedSearch, ApiParams, ApiSearchResult


class BaseApiParser(ABC):
    def __init__(self, params: ApiParams):
        self.params = params

    @abstractmethod
    def search_parser(self, search_results: ApiSearchResult) -> ParsedSearch:
        """ Parse the search results as ParsedSearch object """
        pass

    @abstractmethod
    def details_parser(self, details: Dict, cover_name: str, extra: Optional[BaseApiExtra] = None, bulk: bool = False) -> Dict:
        """ Parse the details, with additional cover_name, and extra if any, as a dict """
        pass

    @abstractmethod
    def trending_parser(self, trending_data: Dict) -> List[Dict]:
        """ Parse the trending data as a list of dict """
        pass

    @abstractmethod
    def parse_cover_url(self, details_data: Dict) -> Optional[str]:
        """ Parse the cover URL from the details data """
        pass

    @abstractmethod
    def add_to_db(self, data: Dict) -> db.Model:
        """ Add the media data to the database """
        pass

    @abstractmethod
    def update_to_db(self, api_id: int | str, data: Dict):
        pass

    @abstractmethod
    def get_ids_for_update(self, api_ids: Optional[List[int]] = None) -> List[int]:
        """ Get the ids for update from the database """
        pass

    def save_cover_to_disk(self, image_bytes: Optional[BytesIO]) -> str:
        """ Save the image data to disk and return the saved cover name """

        cover_name = "default.jpg" if not image_bytes else f"{secrets.token_hex(16)}.jpg"
        if not image_bytes:
            return cover_name

        resize_and_save_image(image_bytes, f"{self.params.local_cover_path}/{cover_name}")
        return cover_name
