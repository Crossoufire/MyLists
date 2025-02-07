from typing import List

from backend.api import MediaType
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.data_classes import AchievementData, TierData, CriteriaData


def movies_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_movies",
            name="Cinephile Marathoner",
            description="Awarded for completing movies, because real life has too few explosions and car chases.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=400), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=800), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=1500), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_movies",
            name="Certified Movie Critic",
            description="Awarded for rating movies, because slapping stars on films is harder than it looks, right?",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=250), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_movies",
            name="Couch Commentator",
            description="Awarded for commenting movies, because every film deserves your unsolicited director’s cut.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=60), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="director_movies",
            name="Director Devotee",
            description="Awarded for completing movies from the same director, because you’re practically their personal biographer at this point.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="actor_movies",
            name="Typecast Connoisseur",
            description="Awarded for completing movies featuring the same actor, because you enjoy watching them save the world—again.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=8), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=15), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="origin_lang_movies",
            name="World Tour",
            description="Awarded for completing movies from different languages, proving that subtitles are no match for your wanderlust.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=3), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=7), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="war_genre_movies",
            name="War Room Veteran",
            description="Awarded for completing War movies, because nothing says relaxation like intense geopolitical conflicts.",
            media_type=MediaType.MOVIES,
            value="War",
            tiers=[
                TierData(criteria=CriteriaData(count=5), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="family_genre_movies",
            name="Family at Heart",
            description="Awarded for completing Family movies, because secretly, you just miss the talking animals.",
            media_type=MediaType.MOVIES,
            value="Family",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="sci_genre_movies",
            name="Sci-Fi Navigator",
            description="Awarded for completing Science Fiction movies, because you like your plot twists served with a side of quantum stuff.",
            media_type=MediaType.MOVIES,
            value="Science Fiction",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="animation_movies",
            name="Animation Enthusiast",
            description="Awarded for completing Animation movies, because you know that cartoons aren’t just for kids.",
            media_type=MediaType.MOVIES,
            value="Animation",
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_movies",
            name="Epic Endurance",
            description="Awarded for completing movies longer than 2h30, because you’ve trained for the cinematic marathon.",
            media_type=MediaType.MOVIES,
            value=151,
            tiers=[
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=25), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=45), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_movies",
            name="Short Attention Span",
            description="Awarded for completing movies shorter than 1h30, because ain’t nobody got time for three-hour epics.",
            media_type=MediaType.MOVIES,
            value=89,
            tiers=[
                TierData(criteria=CriteriaData(count=12), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=25), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=45), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]
