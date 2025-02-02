from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.data_classes import AchievementData, TierData, CriteriaData


def anime_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_anime",
            name="Binge No Jutsu!",
            description="Awarded for completing anime, because who needs sleep when there's just one more episode?",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=120), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=200), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_anime",
            name="Rate My Waifu",
            description="Awarded for rating anime, because judging anime is serious business...",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_anime",
            name="Weeb-splainer",
            description="Awarded for commenting anime, because sometimes a 3-paragraph rant about plot holes is necessary.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_anime",
            name="Short King",
            description="Awarded for watching anime with less than 20 episodes, because this anime will never have another season!",
            media_type=MediaType.ANIME,
            value=20,
            tiers=[
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_anime",
            name="Filler Arc Survivor",
            description="Awarded for watching anime with more than 200 episodes, because you powered through the 50 flashbacks and 20 beach episodes.",
            media_type=MediaType.ANIME,
            value=200,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=7), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=9), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="shonen_anime",
            name="Shonen Showdown!",
            description="Awarded for watching Shonen anime, because power-ups and friendship speeches never get old.",
            media_type=MediaType.ANIME,
            value="Shounen",
            tiers=[
                TierData(criteria=CriteriaData(count=7), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=17), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=22), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="seinen_anime",
            name="Seinen Sage!",
            description="Awarded for completing Seinen anime, because you're too deep into complex plots to enjoy slice-of-life fluff.",
            media_type=MediaType.ANIME,
            value="Seinen",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="network_anime",
            name="Network Lurker",
            description="Awarded for watching anime from different networks, because consistency is key, or maybe your subscription just auto-renewed.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=16), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="actor_anime",
            name="Seiyuu Sensei",
            description="Awarded for watching anime featuring the same voice actor, because now you can spot that voice faster than an anime power-up scream.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=22), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
