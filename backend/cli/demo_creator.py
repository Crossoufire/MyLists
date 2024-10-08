from dataclasses import dataclass
from datetime import datetime, timedelta
from math import exp
import random
from typing import Optional, Tuple, List, Dict, NamedTuple

from flask import current_app
from sqlalchemy import func
from tqdm import tqdm

from backend.api import db
from backend.api.core import set_current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import User, UserMediaUpdate
from backend.api.utils.enums import MediaType, Status, Privacy, ModelTypes, UpdateType
from backend.api.utils.functions import naive_utcnow


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
    favorite_probability: float
    comment_probability: float
    redo_count_params: Optional[GaussianParams] = None
    redo_probability: Optional[float] = None


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

    def generate_score(self) -> float:
        return self._apply_gaussian_with_noise(self.params.score_params)

    def generate_favorite(self) -> bool:
        return random.random() < self.params.favorite_probability

    def generate_comment(self) -> Optional[str]:
        return random.choice(self.COMMENTS) if random.random() < self.params.comment_probability else None

    def generate_redo(self) -> int:
        redo_count = 0
        if random.random() < self.params.redo_probability:
            redo_count = int(self._apply_gaussian_with_noise(self.params.redo_count_params))
        return redo_count

    @staticmethod
    def generate_playtime(decay_rate=0.2) -> int:
        playtime_values = [
            0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275,
            300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000,
            7000, 8000, 9000, 10000,
        ]
        weights = [exp(-decay_rate * i) for i in range(len(playtime_values))]
        return random.choices(playtime_values, weights=weights, k=1)[0]

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


class DemoAccountCreator:
    DEMO_PROFILE = DemoProfile(
        username=current_app.config["DEMO_USERNAME"],
        email=current_app.config["DEMO_EMAIL"],
        password=current_app.config["DEMO_PASSWORD"],
        activated_on=naive_utcnow(),
    )

    def __init__(self, profile: DemoProfile = DEMO_PROFILE):
        self.user = None
        self.profile = profile

    def _cleanup_existing_account(self):
        """ Delete an already existing demo profile """

        demo_profile = User.query.filter_by(username=self.profile.username).first()
        if demo_profile:
            from backend.api.routes.users import delete_user_account
            print(f"*** Deleting existing '{self.profile.username}' account...")
            delete_user_account(demo_profile.id)

    def _create_new_account(self):
        """ Create a new demo profile account """

        print(f"\n*** Creating new '{self.profile.username}' account...")
        self.user = User.register_new_user(**self.profile._asdict())
        self.user.privacy = Privacy.PUBLIC
        for setting in self.user.settings:
            setting.active = True
        db.session.commit()

        # Set `current_user` proxy to this demo profile
        set_current_user(self.user)

    def _setup_follows(self):
        """ Add a follow to the demo profile (preferably with public account) """

        user_to_follow = User.query.filter_by(id=self.profile.follow_id).first()
        if user_to_follow:
            self.user.add_follow(user_to_follow)
            db.session.commit()

    def _generate_media_data(self):
        media_params = self._get_media_params()

        for params in media_params:
            self._process_media_type(params)

        print(f"*** '{self.profile.username}' account created successfully")

    def _process_media_type(self, params: EntryParams):
        generator = ProbaGenerator(params)
        media_model, list_model = ModelsManager.get_lists_models(params.media_type, [ModelTypes.MEDIA, ModelTypes.LIST])

        selected_media = media_model.query.order_by(func.random()).limit(params.total_media).all()

        for media in tqdm(selected_media, ncols=70):
            self._process_media(media, generator, list_model)

        db.session.commit()

    def _process_media(self, media, generator: ProbaGenerator, list_model):
        new_status = generator.generate_status()
        total = media.add_to_user(new_status, self.user.id)

        UserMediaUpdate.set_new_update(
            media,
            UpdateType.STATUS,
            None, new_status,
            timestamp=generator.generate_datetime(datetime(2019, 10, 15), datetime(2024, 8, 10)),
        )

        user_media = list_model.query.filter_by(user_id=self.user.id, media_id=media.id).first()
        user_media.update_time_spent(new_value=total)

        if user_media.status in (Status.PLAN_TO_PLAY, Status.PLAN_TO_WATCH, Status.PLAN_TO_READ):
            return

        user_media.score = generator.generate_score()
        user_media.favorite = generator.generate_favorite()
        user_media.comment = generator.generate_comment()

        if user_media.GROUP != MediaType.GAMES:
            user_media.redo = generator.generate_redo()
        else:
            value = generator.generate_playtime()
            user_media.playtime = value * 60
            user_media.update_time_spent(old_value=0, new_value=value * 60)

        if user_media.GROUP in (MediaType.SERIES, MediaType.ANIME):
            if user_media.status not in (Status.COMPLETED, Status.RANDOM, Status.PLAN_TO_WATCH):
                season, episode = generator.generate_eps_seasons(user_media.media.eps_seasons_list)
                user_media.current_season = season
                user_media.last_episode_watched = episode

    @staticmethod
    def _get_media_params() -> List[EntryParams]:
        return [
            EntryParams(
                media_type=MediaType.SERIES,
                total_media=random.randint(154, 265),
                status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.1, right_decay=0.3),
                score_params=GaussianParams(mean=6.5, std_dev=1.5, min_value=0, max_value=10, step=0.5),
                favorite_probability=0.06,
                comment_probability=0.07,
                redo_probability=0.04,
                redo_count_params=GaussianParams(mean=1, std_dev=3, min_value=0, max_value=10, step=1)
            ),
            EntryParams(
                media_type=MediaType.ANIME,
                total_media=random.randint(102, 223),
                status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.1, right_decay=0.4),
                score_params=GaussianParams(mean=7.5, std_dev=1.5, min_value=0, max_value=10, step=0.5),
                favorite_probability=0.12,
                comment_probability=0.005,
                redo_probability=0.08,
                redo_count_params=GaussianParams(mean=1, std_dev=3, min_value=0, max_value=10, step=1)
            ),
            EntryParams(
                media_type=MediaType.MOVIES,
                total_media=random.randint(853, 1854),
                status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=1.0, right_decay=0.02),
                score_params=GaussianParams(mean=7, std_dev=2.0, min_value=0, max_value=10, step=0.5),
                favorite_probability=0.04,
                comment_probability=0.01,
                redo_probability=0.11,
                redo_count_params=GaussianParams(mean=3, std_dev=2, min_value=0, max_value=10, step=1)
            ),
            EntryParams(
                media_type=MediaType.BOOKS,
                total_media=random.randint(64, 241),
                status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.3, right_decay=0.3),
                score_params=GaussianParams(mean=6, std_dev=2.0, min_value=0, max_value=10, step=0.5),
                favorite_probability=0.06,
                comment_probability=0.003,
                redo_probability=0.08,
                redo_count_params=GaussianParams(mean=2, std_dev=2, min_value=0, max_value=10, step=1)
            ),
            EntryParams(
                media_type=MediaType.GAMES,
                total_media=random.randint(75, 321),
                status_params=StatusParams(dominant_status=Status.COMPLETED, left_decay=0.3, right_decay=0.6),
                score_params=GaussianParams(mean=7.5, std_dev=2.5, min_value=0, max_value=10, step=0.5),
                favorite_probability=0.1,
                comment_probability=0.001,
            ),
        ]

    def create_account(self):
        self._cleanup_existing_account()
        self._create_new_account()
        self._setup_follows()
        self._generate_media_data()
