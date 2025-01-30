from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.seeds.data_classes import AchievementData, TierData, CriteriaData


def series_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_series",
            name="Couch Potato",
            description="Awarded for completing series, because finishing what you started is a true feat!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=175), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=250), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_series",
            name="TV Rater",
            description="Awarded for rating series, sharing your opinions with the world.",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_series",
            name="Episode Economist",
            description="Awarded for completing series with less than 8 episodes, proving than good things come in small packages!",
            media_type=MediaType.SERIES,
            value=8,
            tiers=[
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_series",
            name="Marathon Maverick",
            description="Awarded for completing series with over 150 episodes, because who needs sleep anyway?",
            media_type=MediaType.SERIES,
            value=150,
            tiers=[
                TierData(criteria=CriteriaData(count=1), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=7), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comedy_series",
            name="Laugh Track Legend",
            description="Awarded for completing comedy series, because laughter is the best medicine!",
            media_type=MediaType.SERIES,
            value="Comedy",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=70), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="drama_series",
            name="Drama Queen",
            description="Awarded for completing drama series, embracing the emotional roller-coaster!",
            value="Drama",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=60), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="network_series",
            name="Channel Surfer",
            description="Awarded for watching series from different networks, mastering the remote like a pro!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=25), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=60), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
