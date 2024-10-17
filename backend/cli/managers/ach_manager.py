from ast import literal_eval
from typing import List, cast

from backend.api.managers.AchievementsManager import AchievementManager
from backend.api.utils.enums import MediaType, AchievementDifficulty
from backend.api.utils.seeders import apply_seed_achievements
from backend.cli.managers._base import CLIBaseManager, with_console_status


class CLIAchievementManager(CLIBaseManager):
    def update_achievement_definition(self, code_name: str, name: str = None, description: str = None):
        is_updated = AchievementManager.update_achievement(code_name, name, description)
        if not is_updated:
            self.log_error("Achievement not found, verify the entered 'code_name'.")
        else:
            self.log_success("Achievement successfully updated!")

    def update_tier_achievement(self, code_name, tier: str, criteria: str):
        criteria = literal_eval(criteria)
        tier = AchievementDifficulty(tier.capitalize())

        is_updated = AchievementManager.update_tier_achievement(code_name, tier, criteria)
        if not is_updated:
            self.log_error("Achievement tier not found, verify the entered 'code_name' and 'tier'.")
            return
        self.log_success("Achievement tier successfully updated!")

        self.calculate_achievements(code_name)

    @with_console_status("Calculating achievements, this may take a minute...")
    def calculate_achievements(self, code_names: List[str] | str = None, user_ids: List[int] | int = None):
        """ Calculate achievements for users based on optional `code_names` and `user_ids`. """

        if isinstance(code_names, str):
            code_names = [code_names]
        if isinstance(user_ids, int):
            user_ids = [user_ids]

        if not code_names:
            for media_type in MediaType:
                achievement_manager = AchievementManager.get_manager(cast(MediaType, media_type))
                achievement_manager().calculate_achievements(code_names, user_ids)
                self.log_success(f"{media_type.capitalize()} achievements successfully calculated.")
        else:
            for code_name in code_names:
                achievement_manager = AchievementManager.get_manager_by_code(code_name)
                achievement_manager().calculate_achievements([code_name], user_ids)
                self.log_success(f"The '{code_name}' achievement was successfully calculated.")

        AchievementManager.calculate_achievements_rarity()
        self.log_success("Achievements rarities successfully updated.")

    def seed_achievements(self):
        apply_seed_achievements()
        self.log_success("Achievements successfully added/updated.")
        self.calculate_achievements()

    def get_code_names(self, media_type: str = None):
        """ Return all the code_names available per media type """

        if media_type:
            media_type = MediaType(media_type)

        all_code_names = AchievementManager.all_code_names
        table = self.create_table("All code names", ["Code name", "Media type"])

        previous_media_type = None
        for code_name, manager in all_code_names.items():
            current_media_type = manager.GROUP
            if media_type and current_media_type != media_type:
                continue

            if previous_media_type and previous_media_type != current_media_type:
                table.add_section()

            table.add_row(code_name, current_media_type)
            previous_media_type = current_media_type

        self.print_table(table)
