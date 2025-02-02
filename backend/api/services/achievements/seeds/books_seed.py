from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.data_classes import AchievementData, TierData, CriteriaData


def books_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_books",
            name="Bibliophile Conqueror",
            description="Awarded for completing books, because every finished book is a new world conquered in your literary journey!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_books",
            name="Rating Wizard",
            description="Awarded for rating books, because your insights can turn a hidden gem into a bestseller!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_books",
            name="Commentary Bard",
            description="Awarded for commenting books, because every opinion adds a new layer to the storytelling tapestry!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="author_books",
            name="Author Aficionado",
            description="Awarded for completing books from the same author, showing your unwavering devotion to their literary magic!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="lang_books",
            name="Linguistic Explorer",
            description="Awarded for completing books in 2 different languages, because you’re mastering the art of storytelling across cultures!",
            media_type=MediaType.BOOKS,
            value=2,
            tiers=[
                TierData(criteria=CriteriaData(count=1), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_books",
            name="Quick Read Guru",
            description="Awarded for completing books with less than 150 pages, because you appreciate the art of concise storytelling that gets straight to the point!",
            media_type=MediaType.BOOKS,
            value=150,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_books",
            name="Epic Page Turner",
            description="Awarded for completing books with more than 800 pages, proving you have the stamina for literary marathon sessions!",
            media_type=MediaType.BOOKS,
            value=800,
            tiers=[
                TierData(criteria=CriteriaData(count=1), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=2), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=4), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="classic_books",
            name="Classic Crusader",
            description="Awarded for completing Classic books, because you’re embracing the timeless tales that shaped literature!",
            media_type=MediaType.BOOKS,
            value="Classic",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="young_adult_books",
            name="Young Adult Adventurer",
            description="Awarded for completing Young Adult books, because sometimes the journey to self-discovery is just as thrilling!",
            media_type=MediaType.BOOKS,
            value="Young adult",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="crime_books",
            name="Serial Seeker",
            description="Awarded for completing Crime books, because you thrive on plot twists and heart-pounding suspense!",
            media_type=MediaType.BOOKS,
            value="Crime",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="fantasy_books",
            name="Fantasy Realm Adventurer",
            description="Awarded for completing Fantasy books, because you’ve traversed enchanted lands and battled mythical creatures like a true hero!",
            media_type=MediaType.BOOKS,
            value="Fantasy",
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
