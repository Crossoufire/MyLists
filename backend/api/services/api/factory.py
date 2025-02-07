from __future__ import annotations

from typing import Dict, Any

from backend.api import MediaType
from backend.api.services.api.service import ApiService


class ApiServiceFactory:
    api_configs: Dict[MediaType, Dict[str, Any]] = {}

    @classmethod
    def create(cls, media_type: MediaType):
        api_data = cls.api_configs.get(media_type)
        if not api_data:
            raise ValueError(f"No data registered for media_type: '{media_type}'")

        return ApiService(
            api_caller=api_data["caller"](api_data["params"]),
            api_parser=api_data["parser"](api_data["params"]),
            api_extra=api_data["extra"](api_data["params"]) if api_data["extra"] else None,
            change_strategy=api_data["change_strategy"]() if api_data["change_strategy"] else None,
        )

    @classmethod
    def init_api_config(cls, media_type: MediaType, api_configs: Dict[str, Any]):
        cls.api_configs[media_type] = api_configs
