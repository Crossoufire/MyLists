from typing import List
from datetime import datetime, timedelta

from sqlalchemy import func
from flask import current_app
from rich.progress import track

from backend.api import db
from ._base import CLIBaseManager
from .media import CLIMediaManager
from backend.api.core import set_current_user
from .achievements import CLIAchievementManager
from backend.api.models import User, UserMediaUpdate
from backend.api.utils.functions import naive_utcnow
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, Status, Privacy, ModelTypes, UpdateType
from ..utils.demo_profile_creator import DemoProfile, EntryParams, ProbaGenerator, get_default_params


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

    def get_user_over_time(self):
        from collections import defaultdict

        users = User.query.filter_by(active=True).order_by(User.registered_on).all()
        user_counts = defaultdict(int)

        for user in users:
            month_year = user.registered_on.strftime("%Y-%m")
            user_counts[month_year] += 1

        sorted_counts = sorted(user_counts.items())

        cumulated_data = []
        user_per_month = []
        cumulative_count = 0
        for month_year, count in sorted_counts:
            cumulative_count += count
            user_per_month.append((month_year, count))
            cumulated_data.append((month_year, cumulative_count))

        max_height = 25
        max_users = max(count for _, count in cumulated_data)
        max_date, max_user_in_month = max(user_per_month, key=lambda x: x[1])
        scale = max_users / max_height

        chart_rows = []
        for level in range(max_height, 0, -1):
            threshold = level * scale
            row = ""
            for _, cumulative_count in cumulated_data:
                if cumulative_count >= threshold:
                    row += "█ "
                else:
                    row += "  "
            chart_rows.append(row)

        for row in chart_rows:
            print(row)

        print("─" * (len(cumulated_data) * 2))
        labels = [month[2:] for month, _ in cumulated_data]
        max_label_length = max(len(label) for label in labels)

        for i in range(max_label_length):
            label_row = ""
            for label in labels:
                label_row += (label[i] if i < len(label) else " ") + " "
            print(label_row)

        print()
        self.log_info(f"Total of {cumulated_data[-1][1]} activated users")
        self.log_info(f"Peak of {max_user_in_month} new users in '{max_date}'")
        print()


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

        from backend.api.routes.users import delete_user_account

        demo_profile = User.query.filter_by(username=self.profile.username).first()
        if demo_profile:
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

        # Calculate stats for each media type
        CLIMediaManager.compute_all_time_spent()
        CLIMediaManager.compute_all_users_stats()

        # Calculate achievements
        achievement_manager = CLIAchievementManager()
        achievement_manager.calculate_achievements(code_names="all", user_ids=[self.user.id])

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
        _ = media.add_to_user(new_status, self.user.id)

        UserMediaUpdate.set_new_update(
            media,
            UpdateType.STATUS,
            None, new_status,
            timestamp=generator.generate_datetime(datetime(2019, 10, 15), datetime(2024, 8, 10)),
        )

        user_media = list_model.query.filter_by(user_id=self.user.id, media_id=media.id).first()
        if user_media.status in (Status.PLAN_TO_PLAY, Status.PLAN_TO_WATCH, Status.PLAN_TO_READ):
            return

        user_media.rating = generator.generate_rating()
        user_media.favorite = generator.generate_favorite()
        user_media.comment = generator.generate_comment()

        if user_media.GROUP != MediaType.GAMES and user_media.status == Status.COMPLETED:
            user_media.redo = generator.generate_redo()
        else:
            user_media.playtime = generator.generate_playtime()

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
