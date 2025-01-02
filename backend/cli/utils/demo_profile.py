from dataclasses import dataclass
from datetime import datetime, timedelta
from math import exp
import random
from typing import Optional, NamedTuple, Dict, List, Tuple

from backend.api.utils.enums import Status, MediaType


@dataclass(frozen=True)
class GaussianParams:
    mean: float
    std_dev: float
    min_value: float
    max_value: float
    step: float


@dataclass(frozen=True)
class StatusParams:
    dominant_status: Status
    left_decay: float
    right_decay: float
    dominant_weight: float = 1.0


@dataclass(frozen=True)
class EntryParams:
    media_type: MediaType
    total_media: int
    status_params: StatusParams
    score_params: GaussianParams
    favorite_proba: float
    comment_proba: float
    redo_params: Optional[GaussianParams] = None
    redo_proba: Optional[float] = None


class DemoProfile(NamedTuple):
    username: str
    email: str
    password: str
    activated_on: datetime
    active: bool = True
    follow_id: int = 3


class ProbaGenerator:
    COMMENTS = ["Great!", "Could be better", "Masterpiece", "Interesting concept", "Looking forward to more",
                "Was good at first :/", "It could have been better", "I hope there will be another one!"]

    def __init__(self, params: EntryParams):
        self.params = params
        self.statuses = Status.by(params.media_type)
        self.status_weights = self._calculate_weights()

    def _calculate_weights(self) -> Dict[Status, float]:
        config = self.params.status_params
        dominant_index = self.statuses.index(config.dominant_status)
        weights = {config.dominant_status: config.dominant_weight}

        # Calculate left weights
        for i, status in enumerate(self.statuses[:dominant_index]):
            distance = dominant_index - i
            weights[status] = config.dominant_weight * (config.left_decay ** distance)

        # Calculate right weights
        for i, status in enumerate(self.statuses[dominant_index + 1:], start=1):
            weights[status] = config.dominant_weight * (config.right_decay ** i)

        total_weight = sum(weights.values())

        return {status: weight / total_weight for status, weight in weights.items()}

    @staticmethod
    def _apply_gaussian_with_noise(params: GaussianParams) -> float:
        while True:
            base = random.normalvariate(params.mean, params.std_dev)
            noise = random.uniform(-params.step / 2, params.step / 2)
            value = round((base + noise) / params.step) * params.step
            if params.min_value <= value <= params.max_value:
                return value

    def generate_status(self) -> Status:
        return random.choices(list(self.status_weights.keys()), weights=list(self.status_weights.values()))[0]

    def generate_rating(self) -> float:
        return self._apply_gaussian_with_noise(self.params.score_params)

    def generate_favorite(self) -> bool:
        return random.random() < self.params.favorite_proba

    def generate_comment(self) -> Optional[str]:
        return random.choice(self.COMMENTS) if random.random() < self.params.comment_proba else None

    def generate_redo(self) -> int:
        redo_count = 0
        if random.random() < self.params.redo_proba:
            redo_count = int(self._apply_gaussian_with_noise(self.params.redo_params))
        return redo_count

    @staticmethod
    def generate_playtime(decay_rate=0.2) -> int:
        playtime_values = [
            0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275,
            300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000,
            7000, 8000, 9000, 10000,
        ]
        weights = [exp(-decay_rate * i) for i in range(len(playtime_values))]
        return random.choices(playtime_values, weights=weights, k=1)[0] * 60

    @staticmethod
    def generate_datetime(start_date: datetime, end_date: datetime) -> datetime:
        delta = end_date - start_date
        return start_date + timedelta(seconds=random.randint(0, int(delta.total_seconds())))

    @staticmethod
    def generate_eps_seasons(eps_seasons: List[int]) -> Tuple[int, int]:
        if len(eps_seasons) == 0:
            return 0, 0

        season_index = random.randint(0, len(eps_seasons) - 1) if len(eps_seasons) > 1 else 0
        season = season_index + 1
        nb_episodes = eps_seasons[season_index]
        episode = random.randint(0, nb_episodes)

        return season, (episode + 1) if episode == 0 else episode


def get_default_params() -> List[EntryParams]:
    return [
        EntryParams(
            media_type=MediaType.SERIES,
            total_media=random.randint(154, 265),
            status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.1, right_decay=0.3),
            score_params=GaussianParams(mean=6.5, std_dev=1.5, min_value=0, max_value=10, step=0.5),
            favorite_proba=0.06,
            comment_proba=0.07,
            redo_proba=0.04,
            redo_params=GaussianParams(mean=1, std_dev=3, min_value=0, max_value=10, step=1)
        ),
        EntryParams(
            media_type=MediaType.ANIME,
            total_media=random.randint(102, 223),
            status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.1, right_decay=0.4),
            score_params=GaussianParams(mean=7.5, std_dev=1.5, min_value=0, max_value=10, step=0.5),
            favorite_proba=0.12,
            comment_proba=0.005,
            redo_proba=0.08,
            redo_params=GaussianParams(mean=1, std_dev=3, min_value=0, max_value=10, step=1)
        ),
        EntryParams(
            media_type=MediaType.MOVIES,
            total_media=random.randint(853, 1854),
            status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=1.0, right_decay=0.02),
            score_params=GaussianParams(mean=7, std_dev=2.0, min_value=0, max_value=10, step=0.5),
            favorite_proba=0.04,
            comment_proba=0.01,
            redo_proba=0.11,
            redo_params=GaussianParams(mean=3, std_dev=2, min_value=0, max_value=10, step=1)
        ),
        EntryParams(
            media_type=MediaType.BOOKS,
            total_media=random.randint(64, 241),
            status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.3, right_decay=0.3),
            score_params=GaussianParams(mean=6, std_dev=2.0, min_value=0, max_value=10, step=0.5),
            favorite_proba=0.06,
            comment_proba=0.003,
            redo_proba=0.08,
            redo_params=GaussianParams(mean=2, std_dev=2, min_value=0, max_value=10, step=1)
        ),
        EntryParams(
            media_type=MediaType.GAMES,
            total_media=random.randint(75, 321),
            status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.3, right_decay=0.6),
            score_params=GaussianParams(mean=7.5, std_dev=2.5, min_value=0, max_value=10, step=0.5),
            favorite_proba=0.1,
            comment_proba=0.001,
        ),
    ]
