from __future__ import annotations
import json
import os
from pathlib import Path
from flask import current_app
from sqlalchemy.orm import aliased
from backend.api import db
from backend.api.data_managers.api_data_manager import ApiData
from backend.api.data_managers.global_stats_manager import GlobalStats
from backend.api.models.movies_models import Movies
from backend.api.models.user_models import User
from backend.api.models.utils_models import MyListsStats
from backend.api.utils.enums import ModelTypes, MediaType
from backend.api.utils.functions import get_models_group


def remove_non_list_media():
    """ Remove all media that are not present in a User list from the database and the disk """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic media remover -")

    models = get_models_group("all", ModelTypes.MEDIA)
    for model in models.values():
        model.remove_non_list_media()
        db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished Automatic media remover -")
    current_app.logger.info("###############################################################################")


def remove_all_old_covers():
    """ Remove all the old covers on disk if they are not present anymore in the database """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic covers remover -")

    models = get_models_group("all", ModelTypes.MEDIA)
    for model in models.values():
        path_covers = Path(current_app.root_path, f"static/covers/{model.GROUP.value}_covers/")
        images_in_db = [media.image_cover for media in model.query.all()]

        # Filter out images that need to be removed
        images_to_remove = [file for file in os.listdir(path_covers) if file not in images_in_db]

        # Delete old covers and log info
        count = 0
        for image in images_to_remove:
            file_path = path_covers / image
            try:
                os.remove(file_path)
                current_app.logger.info(f"Removed old {model.GROUP.value} cover with name ID: {image}")
                count += 1
            except Exception as e:
                current_app.logger.error(
                    f"Error occurred while deleting this old {model.GROUP.value} cover {image}: {e}")
        current_app.logger.info(f'Total old {model.GROUP.value} covers deleted: {count}')

    current_app.logger.info("[SYSTEM] - Finished automatic covers remover")
    current_app.logger.info('###############################################################################')


def automatic_media_refresh():
    """ Automatically refresh the media using the appropriate API """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic media refresh -")

    models = get_models_group([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        api_model = ApiData.get_API_class(model.GROUP)
        api_ids_to_refresh = api_model().get_changed_api_ids()

        for api_id in api_ids_to_refresh:
            try:
                refreshed_data = api_model(API_id=api_id).update_media_data()
                model.refresh_element_data(api_id, refreshed_data)
                current_app.logger.info(f"[INFO] - Refreshed {model.GROUP.value} with API ID = [{api_id}]")
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Refreshing {model.GROUP.value} with API ID = [{api_id}]: {e}")

    current_app.logger.info("[SYSTEM] - Finished Automatic media refresh -")
    current_app.logger.info('###############################################################################')


def add_media_related_notifications():
    """ Update the notifications """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting checking new releasing media -")

    models = get_models_group([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        model.get_new_releasing_media()

    current_app.logger.info("[SYSTEM] - Finished checking new releasing media -")
    current_app.logger.info("###############################################################################")


def automatic_movies_locking():
    """ Automatically lock the movies that are more than about 6 months old """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic movies locking -")

    count_locked, count_unlocked = Movies.automatic_locking()

    current_app.logger.info(f"Number of movies locked: {count_locked}")
    current_app.logger.info(f"Number of movies not locked: {count_unlocked}")
    current_app.logger.info("[SYSTEM] - Finished automatic movies locking -")
    current_app.logger.info("###############################################################################")


def compute_media_time_spent():
    """ Compute the total time watched/played/read for each media type for each user. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting to compute the total time spent for each user -")

    models = get_models_group("all", [ModelTypes.MEDIA, ModelTypes.LIST])
    for model in models.values():
        media, media_list = model[ModelTypes.MEDIA], model[ModelTypes.LIST]
        media_alias = aliased(media)
        query = (
            db.session.query(User, media, media_list, media_list.total_user_time_def())
            .join(media_list, media.id == media_list.media_id)
            .join(User, User.id == media_list.user_id)
            .join(media_alias, media_alias.id == media_list.media_id)
            .group_by(media_list.user_id).all()
        )

        for user, _, _, time_spent in query:
            setattr(user, f"time_spent_{media.GROUP.value}", time_spent)

    # Commit changes
    db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished computing the total time spent for each user -")
    current_app.logger.info("###############################################################################")


def update_Mylists_stats():
    """ Update the MyLists global stats """

    # Get global stats
    stats = GlobalStats()

    nb_users, nb_media = stats.get_nb_media_and_users()
    total_time = stats.get_total_time_spent()
    media_top = stats.get_top_media()
    media_genres = stats.get_top_genres()
    media_actors = stats.get_top_actors()
    media_authors = stats.get_top_authors()
    media_developers = stats.get_top_developers()
    media_directors = stats.get_top_directors()
    media_dropped = stats.get_top_dropped()
    media_eps_seas = stats.get_total_eps_seasons()
    total_movies = stats.get_total_movies()
    total_pages = stats.get_total_book_pages()

    stats = MyListsStats(
        nb_users=nb_users,
        total_pages=total_pages,
        nb_media=json.dumps(nb_media),
        total_time=json.dumps(total_time),
        top_media=json.dumps(media_top),
        top_genres=json.dumps(media_genres),
        top_actors=json.dumps(media_actors),
        top_directors=json.dumps(media_directors),
        top_dropped=json.dumps(media_dropped),
        total_episodes=json.dumps(media_eps_seas),
        total_seasons=json.dumps(media_eps_seas),
        total_movies=json.dumps(total_movies),
        top_authors=json.dumps(media_authors),
        top_developers=json.dumps(media_developers),
    )

    # Add and commit changes
    db.session.add(stats)
    db.session.commit()


def update_IGDB_API():
    """ Refresh the IGDB API token. The backend needs to restart to take effect. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting fetching the new IGDB API key -")

    with current_app.app_context():
        from backend.api.data_managers.api_data_manager import ApiGames
        ApiGames().update_API_key()

    current_app.logger.info("[SYSTEM] - Finished fetching the new IGDB API key -")
    current_app.logger.info("###############################################################################")


# ---------------------------------------------------------------------------------------------------------------


def add_cli_commands():
    """ Register the command for the Flask CLI """

    @current_app.cli.command()
    def remove_media():
        """ Remove all media that are not present in a User list from the database and the disk """
        remove_non_list_media()

    @current_app.cli.command()
    def auto_refresh():
        """ Automatically refresh the media using the appropriate API """
        automatic_media_refresh()

    @current_app.cli.command()
    def remove_covers():
        """ Remove all the old covers on disk if they are not present anymore in the database """
        remove_all_old_covers()

    @current_app.cli.command()
    def add_notifications():
        """ Update the notifications """
        add_media_related_notifications()

    @current_app.cli.command()
    def movies_locking():
        """ Automatically lock the movies that are more than about 6 months old """
        automatic_movies_locking()

    @current_app.cli.command()
    def compute_media_time():
        """ Compute the total time watched/played/read for each media type for each user. """
        compute_media_time_spent()

    @current_app.cli.command()
    def update_stats():
        """ Update the MyLists global stats """
        update_Mylists_stats()

    @current_app.cli.command()
    def update_igdb_key():
        """ Update to a new IGDB API key - Server needs to restart to take effect. """
        update_IGDB_API()

    @current_app.cli.command()
    def scheduled_tasks():
        """ Run all the necessary scheduled jobs """

        remove_non_list_media()
        remove_all_old_covers()
        automatic_media_refresh()
        add_media_related_notifications()
        automatic_movies_locking()
        compute_media_time_spent()
        update_Mylists_stats()
