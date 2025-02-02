from dataclasses import dataclass
from typing import Optional, List

from backend.api.utils.enums import AchievementDifficulty, MediaType


@dataclass(frozen=True)
class CriteriaData:
    count: Optional[int] = None


@dataclass(frozen=True)
class TierData:
    criteria: CriteriaData
    difficulty: AchievementDifficulty


@dataclass(frozen=True)
class AchievementData:
    name: str
    code_name: str
    description: str
    tiers: List[TierData]
    value: Optional[str | int] = None
    media_type: Optional[MediaType] = None
