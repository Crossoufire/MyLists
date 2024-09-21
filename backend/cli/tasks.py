from __future__ import annotations

from typing import List

from flask import current_app

from backend.api.managers.ApiManager import ApiManager, GamesApiManager
from backend.api.managers.GlobalStatsManager import GlobalStats
from backend.api.managers.TasksManager import TasksManager
from backend.api.utils.enums import MediaType


def reactivate_update_modal(value: bool = True):
    """ Change the `show_update_modal` to `value` for every user on new Update """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Reactivating Update Modal -")

    TasksManager.reactivate_update_modal(value)

    current_app.logger.info("[SYSTEM] - Finished Reactivating Update Modal -")
    current_app.logger.info("###############################################################################")


def remove_non_list_media():
    """ Remove all media not present in User list from db """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Media Remover -")

    for media_type in MediaType:
        tasks_manager = TasksManager.get_subclass(media_type)
        tasks_manager().remove_non_list_media()

    current_app.logger.info("[SYSTEM] - Finished Automatic Media Remover -")
    current_app.logger.info("###############################################################################")


def remove_all_old_covers():
    """ Remove all the old covers on disk not associated to any media in the db"""

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Covers Remover -")

    for media_type in MediaType:
        tasks_manager = TasksManager.get_subclass(media_type)
        tasks_manager().remove_all_old_covers()

    current_app.logger.info("[SYSTEM] - Finished Automatic Covers Remover -")
    current_app.logger.info("###############################################################################")


def bulk_media_refresh():
    """ Automatically refresh the media using the appropriate API """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Media Refresh -")

    for media_type in [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES]:
        api_manager = ApiManager.get_subclass(media_type)
        TasksManager.bulk_media_refresh(api_manager)

    current_app.logger.info("[SYSTEM] - Finished Automatic Media Refresh -")
    current_app.logger.info("###############################################################################")


def add_media_related_notifications():
    """ Add media notifications to users """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Adding Media Notifications -")

    for media_type in MediaType:
        tasks_manager = TasksManager.get_subclass(media_type)
        tasks_manager().add_notifications()

    current_app.logger.info("[SYSTEM] - Finished Adding Media Notifications -")
    current_app.logger.info("###############################################################################")


def automatic_movies_locking():
    """ Automatically lock the movies that are more than about 6 months old """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Movies Locking -")

    tasks_manager = TasksManager.get_subclass(MediaType.MOVIES)
    tasks_manager().automatic_locking()

    current_app.logger.info("[SYSTEM] - Finished Automatic Movies Locking -")
    current_app.logger.info("###############################################################################")


def compute_media_time_spent():
    """ Compute the total time watched/played/read for each media type for each user """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Calculating User Total Time -")

    for media_type in MediaType:
        tasks_manager = TasksManager.get_subclass(media_type)
        tasks_manager().compute_user_time_spent()

    current_app.logger.info("[SYSTEM] - Finished Calculating User Total Time -")
    current_app.logger.info("###############################################################################")


def update_Mylists_stats():
    """ Update the MyLists global stats. Every day at 3:00 AM UTC+1 """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Updating MyLists Stats -")

    TasksManager.update_Mylists_stats(GlobalStats)

    current_app.logger.info("[SYSTEM] - Finished Updating MyLists Stats -")
    current_app.logger.info("###############################################################################")


def update_igdb_api_token():
    """ Refresh the IGDB API token. The backend needs to restart to take effect. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Fetching New IGDB API Key -")

    TasksManager.update_igdb_token(GamesApiManager)

    current_app.logger.info("[SYSTEM] - Finished Fetching New IGDB API Key -")
    current_app.logger.info("###############################################################################")


def get_active_users(days: int = 30):
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Getting Active Users -")

    TasksManager.get_active_users(days)

    current_app.logger.info("[SYSTEM] - Finished Getting Active Users -")
    current_app.logger.info("###############################################################################")


def get_users_last_seen(usernames: List[str]):
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Getting Active Users -")

    TasksManager.get_users_last_seen(usernames)

    current_app.logger.info("[SYSTEM] - Finished Getting Active Users -")
    current_app.logger.info("###############################################################################")


def delete_non_activated_users(days: int = 7):
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Deleting Inactive Users -")

    TasksManager.delete_non_activated_users(days)

    current_app.logger.info("[SYSTEM] - Finished Deleting Inactive Users -")
    current_app.logger.info("###############################################################################")


def activate_user_account(username: str, toggle: bool):
    """ Activate users accounts that have been inactive for more than 30 days """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Activating User Manually -")

    TasksManager.activate_user_account(username, toggle)

    current_app.logger.info("[SYSTEM] - Finished Activating User Manually -")
    current_app.logger.info("###############################################################################")
