from typing import List, Optional
from dataclasses import dataclass, field

from backend.api import MediaType


@dataclass
class StatusCount:
    status: str
    count: int
    percent: float


@dataclass
class StatsValue:
    name: str
    value: float


@dataclass
class FavoriteInfo:
    media_name: str
    media_id: int
    media_cover: str


@dataclass
class UserGlobalMediaStats:
    total_hours: int
    total_days: float
    total_media: int
    total_media_no_plan_to_x: int
    time_per_media: List[float]
    total_rated: int
    percent_rated: float
    mean_rated: float
    media_types: List[str]


@dataclass
class MediaStatsSummary:
    media_type: MediaType
    specific_total: int
    time_hours: int
    time_days: int
    total_media: int
    total_media_no_plan_to_x: int
    no_data: bool
    status_count: List[StatusCount]
    favorites: List[FavoriteInfo]
    total_favorites: int
    media_rated: int
    percent_rated: float
    mean_rating: float


@dataclass
class TopStats:
    top_values: List[StatsValue]
    top_rated: Optional[List[StatsValue]] = field(default_factory=list)
    top_favorited: Optional[List[StatsValue]] = field(default_factory=list)


@dataclass
class MediaTotalStats:
    unique: int
    redo: int
    total: int


@dataclass(kw_only=True)
class GlobalMediaStats:
    total_entries: int = 0
    total_time_spent: int = 0
    total_rated: int = 0
    total_favorites: int = 0
    total_labels: int = 0
    total_commented: int = 0
    total_users: int = 0
    total_redo: int = 0
    total_updates: int = 0
    total_achievements: int = 0
    avg_rating: Optional[float] = None
    avg_updates: Optional[float] = None
    avg_comments: Optional[float] = None
    avg_favorites: Optional[float] = None
    updates: List[StatsValue] = field(default_factory=list)
    time_spent: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class MediaStats:
    total_media: MediaTotalStats
    total_days: int = 0
    total_hours: int = 0
    total_rated: int = 0
    total_labels: int = 0
    total_updates: int = 0
    total_favorites: int = 0
    total_commented: int = 0
    genres: Optional[TopStats] = None
    avg_rating: Optional[float] = None
    avg_updates: Optional[float] = None
    ratings: List[StatsValue] = field(default_factory=list)
    updates: List[StatsValue] = field(default_factory=list)
    misc_genres: List[StatsValue] = field(default_factory=list)
    release_dates: List[StatsValue] = field(default_factory=list)
    status_counts: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class TMDBStats(MediaStats):
    actors: Optional[TopStats] = None


@dataclass(kw_only=True)
class TvStats(TMDBStats):
    total_seasons: int = 0
    total_episodes: int = 0
    avg_duration: Optional[float] = None
    networks: Optional[TopStats] = None
    countries: Optional[TopStats] = None
    durations: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class MoviesStats(TMDBStats):
    total_budget: int = 0
    total_revenue: int = 0
    avg_duration: Optional[float] = None
    directors: Optional[TopStats] = None
    languages: Optional[TopStats] = None
    durations: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class BooksStats(MediaStats):
    total_pages: int = 0
    avg_pages: Optional[float] = None
    authors: Optional[TopStats] = None
    languages: Optional[TopStats] = None
    publishers: Optional[TopStats] = None
    pages: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class GamesStats(MediaStats):
    avg_playtime: Optional[float] = None
    modes: Optional[TopStats] = None
    engines: Optional[TopStats] = None
    platforms: Optional[TopStats] = None
    developers: Optional[TopStats] = None
    publishers: Optional[TopStats] = None
    perspectives: Optional[TopStats] = None
    playtime: List[StatsValue] = field(default_factory=list)


@dataclass(kw_only=True)
class MangaStats(MediaStats):
    total_chapters: int = 0
    avg_chapters: Optional[float] = None
    authors: Optional[TopStats] = None
    publishers: Optional[TopStats] = None
    chapters: List[StatsValue] = field(default_factory=list)
