from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.seeds.data_classes import AchievementData, TierData, CriteriaData


def games_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_games",
            name="Gaming Completionist",
            description="Awarded for completing games, because finishing a game is the only thing that counts in the endless cycle of gaming.",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=250), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_games",
            name="Critique Commander",
            description="Awarded for rating games, because everyone needs to know that that boss fight was so unfair!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=120), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_games",
            name="Commentary Crusader",
            description="Awarded for commenting games, because your opinions on loot boxes are too hot to keep to yourself!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="developer_games",
            name="Devoted Fan",
            description="Awarded for playing games from the same developers, showing your unwavering loyalty to your favorite game creators!",
            media_type=MediaType.GAMES,
            value="developer",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="publisher_games",
            name="Publisher Pal",
            description="Awarded for playing games from the same publishers, because you've sworn an oath to defend their titles from all foes!",
            media_type=MediaType.GAMES,
            value="publisher",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="first_person_games",
            name="First-Person Pro",
            description="Awarded for playing First Person Perspective games, because you prefer to see the world through your character's eyes—and their shaky hands.",
            media_type=MediaType.GAMES,
            value="First person",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=60), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="hack_slash_games",
            name="Slash & Dash",
            description="Awarded for completing Hack & Slash games, because sometimes, mashing buttons is the best form of therapy!.",
            media_type=MediaType.GAMES,
            value="Hack and Slash",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="multiplayer_games",
            name="Multiplayer Maestro",
            description="Awarded for playing multiplayer games, because teamwork makes the dream work—until it doesn’t!",
            media_type=MediaType.GAMES,
            value="Multiplayer",
            tiers=[
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="log_hours_games",
            name="Time Sink Extraordinaire",
            description="Awarded for logging hours, because you’ve officially become a time lord in the gaming universe!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=200), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=800), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=2000), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=5000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="platform_games",
            name="Platform Hopper",
            description="Awarded for playing games on different platforms, proving you're a true adventurer who leaves no console unturned!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="pc_games",
            name="PC Mastermind",
            description="Awarded for playing games on PC, because you like modding your way through every title!",
            media_type=MediaType.GAMES,
            value="PC",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_games",
            name="Short Game Sage",
            description="Awarded for completing games under 5 hours, because you appreciate the beauty of bite-sized adventures that pack a punch!",
            media_type=MediaType.GAMES,
            value=300,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_games",
            name="Epic Adventurer",
            description="Awarded for completing games above 100 hours, because your gaming journey is basically an epic saga at this point!",
            media_type=MediaType.GAMES,
            value=6000,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
