from time import time
from ast import literal_eval
from datetime import timedelta
from typing import List, Literal, Tuple, Optional

from backend.api.utils.functions import naive_utcnow
from backend.cli.managers._base import CLIBaseManager
from backend.api.utils.enums import AchievementDifficulty
from backend.api.services.achievements.service import apply_seed_achievements, AchievementService


achievement_service = AchievementService()


class CLIAchievementManager(CLIBaseManager):
    cnType = List[str] | Literal["all"]
    uiType = List[int] | Literal["active", "all"]

    def seed_achievements(self):
        """ Add/update the achievements and calculate them for all users and media types """

        apply_seed_achievements()
        self.log_success("Achievements successfully added/updated.")
        self.log_info("Achievements are now being calculated...")
        self.calculate_achievements(code_names="all", user_ids="all")

    def get_code_names(self):
        """ Return all the available `code_names`. """

        all_code_names = achievement_service.get_code_names()
        table = self.create_table(title=f"All code names", columns=["Code name", "Media type"])

        previous_mt = None
        for code_name, media_type in all_code_names.items():
            current_mt = media_type
            if previous_mt and previous_mt != current_mt:
                table.add_section()
            table.add_row(code_name, media_type)
            previous_mt = current_mt

        self.print_table(table)

    def update_achievement_definition(self, code_name: str, name: Optional[str] = None, description: Optional[str] = None):
        is_updated = achievement_service.update_achievement(code_name, name, description)
        if not is_updated:
            return self.log_error("Achievement not found, verify the entered 'code_name'.")

        self.log_success("Achievement successfully updated!")

    def update_achievement_tier(self, code_name: str, tier: str, criteria: str):
        try:
            criteria = literal_eval(criteria)
            if not isinstance(criteria, dict):
                return self.log_error("Invalid criteria, not parsed as a dict -> must be a str representing a python dict.")
        except Exception:
            return self.log_error("Invalid criteria, it must be a str representing a python dict.")

        try:
            tier = AchievementDifficulty(tier)
        except ValueError:
            return self.log_error(f"Invalid tier, choices are: '{"', '".join([t for t in AchievementDifficulty])}'.")

        is_updated = achievement_service.update_tier_achievement(code_name, tier, criteria)
        if not is_updated:
            return self.log_error("Achievement tier not found, verify the entered inputs.")

        self.log_success("Achievement tier successfully updated!")
        self.log_info(f"Achievement '{code_name}' is now being re-calculated...")
        self.calculate_achievements(code_names=[code_name], user_ids="all")

    def calculate_achievements(self, code_names: cnType, user_ids: uiType):
        """ Calculate achievements for users based on `code_names` and `user_ids`. """

        code_names, user_ids = self._process_arguments(code_names, user_ids)

        start_time = time()
        self._calculate(code_names, user_ids)
        end_time = time()

        self.log_info(f"Achievements calculation took: {round(end_time - start_time, 3)} seconds.")
        self.log_info("Achievements rarities are being updated...")
        achievement_service.calculate_achievements_rarity()
        self.log_success("Achievements rarities successfully updated.")

    def _process_arguments(self, code_names: cnType, user_ids: uiType) -> Tuple[Optional[List[str]], Optional[List[int]]]:
        if isinstance(code_names, (list, tuple)):
            self.log_info(f"Calculating {len(code_names)} achievement(s): {', '.join(c for c in code_names)}.")
        if isinstance(user_ids, (list, tuple)):
            self.log_info(f"Calculating for {len(user_ids)} user(s): {', '.join(str(f"ID [{u}]") for u in user_ids)}.")

        if code_names == "all":
            code_names = None
            self.log_info("Calculating all achievements.")

        if user_ids == "active":
            from backend.api.models import User
            user_ids = [user.id for user in User.query.filter(User.last_seen >= (naive_utcnow() - timedelta(days=1))).all()]
            self.log_info(
                f"Calculating for {len(user_ids)} active user(s) in the past 24 hours. "
                f"IDs: {', '.join(str(f"ID [{u}]") for u in user_ids)}."
            )
        elif user_ids == "all":
            user_ids = None
            self.log_info(f"Calculating achievement(s) for all users.")

        # noinspection PyTypeChecker
        return code_names, user_ids

    def _calculate(self, code_names: Optional[List[str]], user_ids: Optional[List[int]]):
        if code_names:
            with self.progress:
                task_id = self.progress.add_task("[cyan]Processing code names...", total=100)
                for i, code_name in enumerate(code_names):
                    achievement_service.calculate_achievements(code_name, user_ids)
                    self.progress.update(task_id, completed=(i + 1) / len(code_names) * 100, refresh=True)
        else:
            def update_progress(percent: float):
                self.progress.update(task_id, completed=percent * 100, refresh=True)

            with self.progress:
                task_id = self.progress.add_task(f"[cyan]Processing all achievements...", total=100)
                achievement_service.calculate_achievements(None, user_ids, update_progress)
