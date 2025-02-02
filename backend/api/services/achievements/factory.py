from typing import Dict, Type, Any

from backend.api.services.achievements.calculators import *


class AchievementCalculatorFactory:
    _code_name_to_media_type: Dict[str, MediaType] = {}
    _calculators_map: Dict[MediaType, Dict[str, Type[BaseAchievementCalculator]]] = {}

    @classmethod
    def create(cls, code_name: str) -> BaseAchievementCalculator:
        media_type = cls._code_name_to_media_type.get(code_name)
        if media_type is None:
            raise ValueError(f"Could not find media type corresponding to code name '{code_name}'")

        calculator_data = cls._calculators_map[media_type][code_name]
        if isinstance(calculator_data, tuple):
            calculator_class, calculator_args = calculator_data
            return calculator_class(media_type, media_config=calculator_args)
        else:
            calculator_class = calculator_data
            return calculator_class(media_type)

    @classmethod
    def init_calculators(cls, media_type: MediaType, calculators: Dict[str, Any]):
        cls._calculators_map[media_type] = calculators

        for code_name in calculators.keys():
            cls._code_name_to_media_type[code_name] = media_type
