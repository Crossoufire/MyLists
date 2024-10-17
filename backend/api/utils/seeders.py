import dataclasses
from dataclasses import dataclass
from typing import Optional, List

from backend.api import db
from backend.api.models import AchievementDifficulty, Achievement, AchievementTier
from backend.api.utils.enums import MediaType


@dataclass(frozen=True)
class CriteriaData:
    count: Optional[int] = None
    value: Optional[int | str] = None


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
    media_type: Optional[MediaType] = None


def general_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_media",
            name="MyLists Master",
            description="Awarded for completing media, because every finished title is a new conquest in your quest for cultural enlightenment!",
            media_type=None,
            tiers=[
                TierData(criteria=CriteriaData(count=400), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=800), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=1500), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=3000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rate_media",
            name="Rating Overlord",
            description="Awarded for rating media, because your star ratings hold the power to influence future masterpieces and duds alike!",
            media_type=None,
            tiers=[
                TierData(criteria=CriteriaData(count=400), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=800), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=1500), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=3000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_media",
            name="Commentary Champion",
            description="Awarded for commenting media, because every opinion shared adds a new layer to the discussion and enriches the community!",
            media_type=None,
            tiers=[
                TierData(criteria=CriteriaData(count=400), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=800), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=1500), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=3000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_media",
            name="MyLists Time Lord",
            description="Awarded for logging hours on media, proving your dedication to exploring stories and experiences across every type of media!",
            media_type=None,
            tiers=[
                TierData(criteria=CriteriaData(count=1000), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=2000), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=5000), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]


def series_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_series",
            name="Couch Potato",
            description="Awarded for completing series, because finishing what you started is a true feat!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="rated_series",
            name="TV Rater",
            description="Awarded for rating series, sharing your opinions with the world.",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
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
            tiers=[
                TierData(criteria=CriteriaData(count=5, value=8), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=8, value=8), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=12, value=8), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15, value=8), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_series",
            name="Marathon Maverick",
            description="Awarded for completing series with over 150 episodes, because who needs sleep anyway?",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=5, value=150), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=8, value=150), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=12, value=150), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15, value=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comedy_series",
            name="Laugh Track Legend",
            description="Awarded for completing comedy series, because laughter is the best medicine!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="Comedy"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=15, value="Comedy"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=25, value="Comedy"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=35, value="Comedy"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="drama_series",
            name="Drama Llama",
            description="Awarded for completing drama series, embracing the emotional rollercoaster!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=15, value="Drama"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30, value="Drama"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50, value="Drama"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=80, value="Drama"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="network_series",
            name="Channel Surfer",
            description="Awarded for watching series from different networks, mastering the remote like a pro!",
            media_type=MediaType.SERIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]


def anime_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_anime",
            name="Binge No Jutsu!",
            description="Awarded for completing anime, because who needs sleep when there's just one more episode?",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=120), difficulty=AchievementDifficulty.PLATINUM),
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
            tiers=[
                TierData(criteria=CriteriaData(count=5, value=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=8, value=20), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=12, value=20), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15, value=20), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_anime",
            name="Filler Arc Survivor",
            description="Awarded for watching anime with more than 200 episodes, because you powered through the 50 flashbacks and 20 beach episodes.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value=200), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value=200), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=7, value=200), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=9, value=200), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="shonen_anime",
            name="Shonen Showdown!",
            description="Awarded for watching Shonen anime, because power-ups and friendship speeches never get old.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=7, value="Shounen"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=12, value="Shounen"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=17, value="Shounen"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=22, value="Shounen"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="seinen_anime",
            name="Seinen Sage!",
            description="Awarded for completing Seinen anime, because you're too deep into complex plots to enjoy slice-of-life fluff.",
            media_type=MediaType.ANIME,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Seinen"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Seinen"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Seinen"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Seinen"), difficulty=AchievementDifficulty.PLATINUM),
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
                TierData(criteria=CriteriaData(count=20), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=60), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="comment_movies",
            name="Couch Commentator",
            description="Awarded for commenting movies, because every film deserves your unsolicited director’s cut.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=50), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=120), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=350), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=500), difficulty=AchievementDifficulty.PLATINUM),
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
            tiers=[
                TierData(criteria=CriteriaData(count=5, value="War"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=10, value="War"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=20, value="War"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=30, value="War"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="family_genre_movies",
            name="Family at Heart",
            description="Awarded for completing Family movies, because secretly, you just miss the talking animals.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="Family"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20, value="Family"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35, value="Family"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50, value="Family"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="sci_genre_movies",
            name="Sci-Fi Navigator",
            description="Awarded for completing Science Fiction movies, because you like your plot twists served with a side of quantum stuff.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="Science Fiction"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20, value="Science Fiction"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35, value="Science Fiction"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50, value="Science Fiction"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="animation_movies",
            name="Animation Enthusiast",
            description="Awarded for completing Animation movies, because you know that cartoons aren’t just for kids.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="Animation"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20, value="Animation"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35, value="Animation"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=50, value="Animation"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_movies",
            name="Epic Endurance",
            description="Awarded for completing movies longer than 2h30, because you’ve trained for the cinematic marathon.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=12, value=151), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=25, value=151), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35, value=151), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=45, value=151), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_movies",
            name="Short Attention Span",
            description="Awarded for completing movies shorter than 1h30, because ain’t nobody got time for three-hour epics.",
            media_type=MediaType.MOVIES,
            tiers=[
                TierData(criteria=CriteriaData(count=12, value=89), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=25, value=89), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=35, value=89), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=45, value=89), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]


def games_achievements() -> List[AchievementData]:
    return [
        AchievementData(
            code_name="completed_games",
            name="Gaming Completionist",
            description="Awarded for completing games, because finishing a game is the only thing that counts in the endless cycle of gaming.",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=10), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=30), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=80), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=150), difficulty=AchievementDifficulty.PLATINUM),
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
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=200), difficulty=AchievementDifficulty.PLATINUM),
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
                TierData(criteria=CriteriaData(count=40), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="developer_games",
            name="Devoted Fan",
            description="Awarded for playing games from the same developers, showing your unwavering loyalty to your favorite game creators!",
            media_type=MediaType.GAMES,
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
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="First person"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20, value="First person"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=40, value="First person"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=60, value="First person"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="hack_slash_games",
            name="Slash & Dash",
            description="Awarded for completing Hack & Slash games, because sometimes, mashing buttons is the best form of therapy!.",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Hack and Slash"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Hack and Slash"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Hack and Slash"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Hack and Slash"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="multiplayer_games",
            name="Multiplayer Maestro",
            description="Awarded for playing multiplayer games, because teamwork makes the dream work—until it doesn’t!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=4, value="Multiplayer"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=10, value="Multiplayer"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=14, value="Multiplayer"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=22, value="Multiplayer"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="log_hours_games",
            name="Time Sink Extraordinaire",
            description="Awarded for logging hours, because you’ve officially become a time lord in the gaming universe!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=100), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=500), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=1000), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=2000), difficulty=AchievementDifficulty.PLATINUM),
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
            tiers=[
                TierData(criteria=CriteriaData(count=10, value="PC"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=20, value="PC"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=50, value="PC"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=100, value="PC"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_games",
            name="Short Game Sage",
            description="Awarded for completing games under 5 hours, because you appreciate the beauty of bite-sized adventures that pack a punch!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value=300), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value=300), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value=300), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=15, value=300), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_games",
            name="Epic Adventurer",
            description="Awarded for completing games above 100 hours, because your gaming journey is basically an epic saga at this point!",
            media_type=MediaType.GAMES,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value=6000), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value=6000), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value=6000), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value=6000), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]


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
            tiers=[
                TierData(criteria=CriteriaData(count=1, value=2), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=3, value=2), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=5, value=2), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=8, value=2), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="short_books",
            name="Quick Read Guru",
            description="Awarded for completing books with less than 150 pages, because you appreciate the art of concise storytelling that gets straight to the point!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value=150), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value=150), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value=150), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value=150), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="long_books",
            name="Epic Page Turner",
            description="Awarded for completing books with more than 800 pages, proving you have the stamina for literary marathon sessions!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=1, value=800), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=2, value=800), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=3, value=800), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=4, value=800), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="classic_books",
            name="Classic Crusader",
            description="Awarded for completing Classic books, because you’re embracing the timeless tales that shaped literature!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Classic"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Classic"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Classic"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Classic"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="young_adult_books",
            name="Young Adult Adventurer",
            description="Awarded for completing Young Adult books, because sometimes the journey to self-discovery is just as thrilling!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Young adult"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Young adult"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Young adult"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Young adult"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="crime_books",
            name="Serial Seeker",
            description="Awarded for completing Crime books, because you thrive on plot twists and heart-pounding suspense!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Crime"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Crime"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Crime"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Crime"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
        AchievementData(
            code_name="fantasy_books",
            name="Fantasy Realm Adventurer",
            description="Awarded for completing Fantasy books, because you’ve traversed enchanted lands and battled mythical creatures like a true hero!",
            media_type=MediaType.BOOKS,
            tiers=[
                TierData(criteria=CriteriaData(count=3, value="Fantasy"), difficulty=AchievementDifficulty.BRONZE),
                TierData(criteria=CriteriaData(count=5, value="Fantasy"), difficulty=AchievementDifficulty.SILVER),
                TierData(criteria=CriteriaData(count=8, value="Fantasy"), difficulty=AchievementDifficulty.GOLD),
                TierData(criteria=CriteriaData(count=12, value="Fantasy"), difficulty=AchievementDifficulty.PLATINUM),
            ],
        ),
    ]


def apply_seed_achievements():
    achievements_definition = (series_achievements() + anime_achievements() + movies_achievements() +
                               books_achievements() + games_achievements())

    for achievement_data in achievements_definition:
        achievement = Achievement.query.filter_by(code_name=achievement_data.code_name).first()
        if not achievement:
            achievement = Achievement(
                name=achievement_data.name,
                code_name=achievement_data.code_name,
                media_type=achievement_data.media_type,
                description=achievement_data.description,
            )
            db.session.add(achievement)
            db.session.flush()

            for tier_data in achievement_data.tiers:
                # noinspection PyTypeChecker
                tier = AchievementTier(
                    achievement_id=achievement.id,
                    difficulty=tier_data.difficulty,
                    criteria=dataclasses.asdict(tier_data.criteria),
                )
                db.session.add(tier)
                achievement.tiers.append(tier)
        else:
            achievement.name = achievement_data.name
            achievement.code_name = achievement_data.code_name
            achievement.description = achievement_data.description
            achievement.media_type = achievement_data.media_type

            # Remove any non-existing tiers in achievement object
            new_difficulties = {t.difficulty for t in achievement_data.tiers}
            for tier in achievement.tiers:
                if tier.difficulty not in new_difficulties:
                    db.session.delete(tier)

            # Update/add tiers
            for tier_data in achievement_data.tiers:
                existing_tier = next((t for t in achievement.tiers if t.difficulty == tier_data.difficulty), None)
                if existing_tier:
                    # noinspection PyTypeChecker
                    existing_tier.criteria = dataclasses.asdict(tier_data.criteria)
                else:
                    # noinspection PyTypeChecker
                    new_tier = AchievementTier(
                        achievement_id=achievement.id,
                        difficulty=tier_data.difficulty,
                        criteria=dataclasses.asdict(tier_data.criteria),
                    )
                    db.session.add(new_tier)
                    achievement.tiers.append(new_tier)

    db.session.commit()

    # Remove non-existing achievements
    achievements = Achievement.query.all()
    new_code_names = {a.code_name for a in achievements_definition}

    # Remove non-existing achievement code_name
    for achievement in achievements:
        if achievement.code_name not in new_code_names:
            db.session.delete(achievement)

    db.session.commit()
