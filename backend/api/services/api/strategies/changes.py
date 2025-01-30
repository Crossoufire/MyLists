from typing import List
from abc import abstractmethod, ABC

from backend.api.services.api.providers.base import BaseApiCaller, BaseApiParser


class ChangeDetectionStrategy(ABC):
    @abstractmethod
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        pass


class DatabaseStrategy(ChangeDetectionStrategy):
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        """ Strategy for Games and Movies - check age in database """
        return api_parser.get_ids_for_update()


class ApiStrategy(ChangeDetectionStrategy):
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        """ Strategy for series and anime - check against API """
        api_changed_ids = api_caller.changed_api_ids()
        return api_parser.get_ids_for_update(api_changed_ids)
