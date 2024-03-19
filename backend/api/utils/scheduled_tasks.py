from __future__ import annotations
import json
import os
from datetime import datetime
from pathlib import Path
from flask import current_app
from sqlalchemy.orm import aliased
from tqdm import tqdm
from backend.api import db
from backend.api.classes.API_data import ApiData
from backend.api.classes.Global_stats import GlobalStats
from backend.api.models.games_models import Games
from backend.api.models.movies_models import Movies
from backend.api.models.tv_models import Series, Anime
from backend.api.models.user_models import User
from backend.api.models.user_models import UserLastUpdate
from backend.api.models.utils_models import MyListsStats
from backend.api.utils.enums import ModelTypes
from backend.api.utils.functions import get_models_type


def delete_old_invalid_last_updates():
    """ delete the invalid (meaning the media is not in the user list) media from last updates """

    users = User.query.all()

    for user in tqdm(users, ncols=70):
        for model in get_models_type(ModelTypes.LIST):
            media_ids = db.session.query(model.media_id).filter_by(user_id=user.id).all()

            (UserLastUpdate.query.filter(
                UserLastUpdate.user_id == user.id,
                UserLastUpdate.media_id.notin_([m[0] for m in media_ids]),
                UserLastUpdate.media_type == model.GROUP)
             .delete())

        db.session.commit()


def remove_non_list_media():
    """ Remove all media that are not present in a User list from the database and the disk """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic media remover -")

    for model in get_models_type(ModelTypes.MEDIA):
        model.remove_non_list_media()

        # Commit changes
        db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished Automatic media remover -")
    current_app.logger.info("###############################################################################")


def automatic_media_refresh():
    """ Automatically refresh the media using the appropriate API """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic media refresh -")

    for model in [Series, Anime, Movies, Games]:
        api_model = ApiData.get_API_class(model.GROUP)

        if model == Games:
            all_games = Games.query.all()
            api_ids_to_refresh = []
            for game in all_games:
                try:
                    if datetime.utcfromtimestamp(int(game.release_date)) > datetime.now():
                        api_ids_to_refresh.append(game.api_id)
                except:
                    api_ids_to_refresh.append(game.api_id)
        else:
            changed_api_ids: set[int] = api_model().get_changed_api_ids()
            api_ids_in_db = {m[0] for m in db.session.query(model.api_id).filter(model.lock_status != True)}
            api_ids_to_refresh = list(api_ids_in_db.intersection(changed_api_ids))

        for api_id in api_ids_to_refresh:
            try:
                refreshed_data = api_model(API_id=api_id).update_media_data()
                model.refresh_element_data(api_id, refreshed_data)
                current_app.logger.info(f"[INFO] - Refreshed {model.GROUP.value} with API ID = [{api_id}]")
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Refreshing {model.GROUP.value} with API ID = [{api_id}]: {e}")

    current_app.logger.info("[SYSTEM] - Finished Automatic media refresh -")
    current_app.logger.info('###############################################################################')


def remove_all_old_covers():
    """ Remove all the old covers on disk if they are not present anymore in the database """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting automatic covers remover -")

    for model in get_models_type(ModelTypes.MEDIA):
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


def add_media_related_notifications():
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting checking new releasing media -")

    # Books return None because no available checks for new releases
    for model in get_models_type(ModelTypes.MEDIA):
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

    all_media = get_models_type(ModelTypes.MEDIA)
    all_media_list = get_models_type(ModelTypes.LIST)

    for media, media_list in zip(all_media, all_media_list):
        media_alias = aliased(media)
        query = (db.session.query(User, media, media_list, media_list.total_user_time_def())
                 .join(media_list, media.id == media_list.media_id)
                 .join(User, User.id == media_list.user_id)
                 .join(media_alias, media_alias.id == media_list.media_id)
                 .group_by(media_list.user_id).all())

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

    total_time = User.get_total_time_spent()
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
    nb_users, nb_media = stats.get_nb_media_and_users()

    stats = MyListsStats(
        nb_users=nb_users,
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
        total_pages=total_pages,
    )

    # Add and commit changes
    db.session.add(stats)
    db.session.commit()


def update_IGDB_API():
    """ Refresh the IGDB API token. The backend needs to restart to take effect. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting fetching the new IGDB API key -")

    with current_app.app_context():
        from backend.api.classes.API_data import ApiGames
        ApiGames().update_API_key()

    current_app.logger.info("[SYSTEM] - Finished fetching the new IGDB API key -")
    current_app.logger.info("###############################################################################")


# ---------------------------------------------------------------------------------------------------------------


def add_cli_commands():
    """ Register the command for the Flask CLI """

    @current_app.cli.command()
    def add_notifs():
        """ Update the notifications """
        add_media_related_notifications()

    @current_app.cli.command()
    def delete_invalid():
        """ Delete the invalid media (= not in the user list) from last updates """
        delete_old_invalid_last_updates()

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

    @current_app.cli.command()
    def update_igdb_key():
        """ Update to a new IGDB API key - Server needs to restart to take effect. """
        update_IGDB_API()
