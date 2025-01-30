from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.seeds.data_classes import AchievementData, TierData, CriteriaData


def manga_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_manga",
            name="Finish Line Hero",
            description="Awarded for completing manga, because you have more commitment to them than your real-life relationships",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_manga",
            name="Opinionated Otaku",
            description="Awarded for rating manga, because everyone needs to know your totally professional 2AM judgment calls.",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_manga",
            name="Keyboard Warrior Sensei",
            description="Awarded for commenting manga, because typing 'OMG THAT PLOT TWIST!!1!' is literary criticism now.",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="author_manga",
            name="Stalker-san",
            description="Awarded for completing manga from the same author, because following someone's entire career isn't creepy at all.",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="publisher_manga",
            name="Corporate Loyalty",
            description="Awarded for completing manga from the same publisher, because brand loyalty is totally a personality trait.",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_manga",
            name="Commitment Issues",
            description="Awarded for completing manga with less than 5 volumes, because good things come in small packages (or you're just lazy).",
            media_type=MediaType.MANGA,
            value=5,
            tiers=[
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_manga",
            name="Marathon Masochist",
            description="Awarded for completing manga with more than 50 volumes, because who needs sleep when you have 1000+ chapters to read?",
            media_type=MediaType.MANGA,
            value=50,
            tiers=[
                TierData(criteria=CriteriaData(count=1), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="chapter_manga",
            name="Page Turner Pro",
            description="Awarded for reading LOTS of manga chapters, because who needs vitamin D when you have manga?",
            media_type=MediaType.MANGA,
            tiers=[
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=500), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=1000), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=5000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="hentai_manga",
            name="Yamete Senpai",
            description="Awarded for completing hentai manga, because 'I read it for the plot' needed its own achievement.",
            media_type=MediaType.MANGA,
            value="Hentai",
            tiers=[
                TierData(criteria=CriteriaData(count=1), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="shounen_manga",
            name="Power of Friendship",
            description="Awarded for completing shounen manga, because screaming makes you stronger and that's just science.",
            media_type=MediaType.MANGA,
            value="Shounen",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=6), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=9), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="seinen_manga",
            name="Sophisticated Weeb",
            description="Awarded for completing seinen manga, because reading about existential crises makes you mature.",
            media_type=MediaType.MANGA,
            value="Seinen",
            tiers=[
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=6), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
