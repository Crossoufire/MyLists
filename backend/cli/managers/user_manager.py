from datetime import datetime, timedelta
from typing import List

from flask import current_app
from rich.progress import track
from sqlalchemy import func

from .base import CLIBaseManager
from backend.api import db
from backend.api.core import set_current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import User, UserMediaUpdate
from backend.api.utils.enums import MediaType, Status, Privacy, ModelTypes, UpdateType
from backend.api.utils.functions import naive_utcnow
from ..utils.demo_profile import DemoProfile, EntryParams, ProbaGenerator, get_default_params


class CLIUserManager(CLIBaseManager):
    def change_privacy_setting(self, user: str | int, privacy: str):
        filter_ = {"username": user} if isinstance(user, str) else {"id": user}
        user = User.query.filter_by(**filter_).first()
        if not user:
            self.log_error(f"User not found with criteria: {filter_}")
            return

        try:
            user.privacy = Privacy(privacy)
            db.session.commit()
            self.log_success(f"Changed privacy for user '{user.username}' to '{privacy}'")
        except ValueError as e:
            self.log_error(f"Invalid privacy value: {e}")

    def check_privacy_settings(self, privacy: str):
        try:
            privacy = Privacy(privacy)
        except ValueError as e:
            self.log_error(f"Invalid privacy value: {e}")
            return

        users = (
            User.query.filter(
                User.active.is_(True),
                User.privacy == privacy,
                User.last_seen.is_not(None),
            ).order_by(User.last_seen.desc())
            .all()
        )

        table = self.create_table(f"Privacy = {privacy.value}", ["Username", "Last Seen"])
        for user in users:
            table.add_row(user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S"))

        self.print_table(table)

    def toggle_new_features_flag(self, active: bool = True):
        db.session.execute(db.update(User).values(show_update_modal=active))
        db.session.commit()
        self.log_success(f"Feature flag {'activated' if active else 'deactivated'} for all users")

    def toggle_account_active(self, user: str | int, active: bool):
        filter_ = {"username": user} if isinstance(user, str) else {"id": user}
        user = User.query.filter_by(**filter_).first()
        if not user:
            self.log_error(f"User not found with criteria: {filter_}")
            return
        user.active = active
        db.session.commit()
        self.log_success(f"Account for '{user.username}' [ID: {user.id}] {'activated' if active else 'deactivated'}.")

    def check_active_users(self, days: int = 30):
        active_users = (
            User.query.filter(
                User.last_seen >= datetime.now() - timedelta(days=days),
                User.active.is_(True),
            ).order_by(User.last_seen.desc())
            .all()
        )

        period_repr = f"< {days} days" if days < 30 else f"< {days // 30} months"
        table = self.create_table(f"Active Users ({period_repr})", ["Username", "Last Seen"])
        for user in active_users:
            table.add_row(user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S"))

        self.print_table(table)

    def check_users_last_seen(self, usernames: List[str]):
        users = User.query.filter(User.username.in_(usernames)).order_by(User.last_seen.desc()).all()

        table = self.create_table(f"Users last seen", ["Username", "Last Seen"])
        for user in users:
            table.add_row(user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S"))

        self.print_table(table)

    def delete_non_activated_users(self, days: int = 7):
        delta_time = datetime.now() - timedelta(days=days)
        period_repr = f"< {days} days" if days < 30 else f"< {days // 30} months"

        non_activated_user_count = User.query.filter(User.active.is_(False), User.registered_on <= delta_time).count()
        self.log_info(f"Found {non_activated_user_count} non-activated users to delete...")

        User.query.filter(User.active.is_(False), User.registered_on <= delta_time).delete()
        db.session.commit()

        self.log_success(f"Deleted {non_activated_user_count} non-activated users ({period_repr})")


class CLIUserDemoManager(CLIBaseManager):
    DEMO_PROFILE = DemoProfile(
        username=current_app.config["DEMO_USERNAME"],
        email=current_app.config["DEMO_EMAIL"],
        password=current_app.config["DEMO_PASSWORD"],
        activated_on=naive_utcnow(),
    )

    def __init__(self, profile: DemoProfile = DEMO_PROFILE):
        super().__init__()

        self.user = None
        self.profile = profile

    def _cleanup_existing_account(self):
        """ Delete an already existing demo profile """

        demo_profile = User.query.filter_by(username=self.profile.username).first()
        if demo_profile:
            from backend.api.routes.users import delete_user_account
            self.log_warning(f"Demo profile already existing, deleting '{self.profile.username}' account...")
            delete_user_account(demo_profile.id)
            self.log_success(f"Existing '{self.profile.username}' account successfully deleted")

    def _create_new_account(self):
        """ Create a new demo profile account """

        self.log_success(f"Creating new '{self.profile.username}' account...")

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
        media_params = get_default_params()

        for params in media_params:
            self._process_media_type(params)

        self.log_success(f"'{self.profile.username}' account successfully created")

    def _process_media_type(self, params: EntryParams):
        generator = ProbaGenerator(params)
        media_model, list_model = ModelsManager.get_lists_models(params.media_type, [ModelTypes.MEDIA, ModelTypes.LIST])

        selected_media = media_model.query.order_by(func.random()).limit(params.total_media).all()

        for media in track(selected_media, description=f"Processing {media_model.GROUP.value.capitalize()}..."):
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

    def create_account(self):
        self._cleanup_existing_account()
        self._create_new_account()
        self._setup_follows()
        self._generate_media_data()
