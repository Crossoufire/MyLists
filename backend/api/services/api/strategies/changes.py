from typing import List
from abc import abstractmethod, ABC

from backend.api.services.api.providers.base import BaseApiCaller, BaseApiParser
from backend.api.services.api.providers.base.base_caller import ChangedApiIdsCallerProtocol
from backend.api.services.api.providers.base.base_parser import ChangedApiIdsParserProtocol


class ChangeDetectionStrategy(ABC, ChangedApiIdsCallerProtocol, ChangedApiIdsParserProtocol):
    @abstractmethod
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        pass


class DatabaseStrategy(ChangeDetectionStrategy):
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        """ Strategy which check directly in database """
        return api_parser.get_ids_for_update()


class ApiStrategy(ChangeDetectionStrategy):
    def get_changed_ids(self, api_caller: BaseApiCaller, api_parser: BaseApiParser) -> List[int]:
        """ Strategy which first check against the API then parses the results """
        api_changed_ids = api_caller.changed_api_ids()
        return api_parser.get_ids_for_update(api_changed_ids)
