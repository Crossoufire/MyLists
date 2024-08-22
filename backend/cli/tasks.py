from __future__ import annotations
import json
import os
from pathlib import Path
from typing import List
import dotenv
from flask import current_app
from sqlalchemy import select, text
from sqlalchemy.orm import aliased
from tqdm import tqdm
from backend.api import db, cache
from backend.api.managers.ApiManager import BaseApiManager, GamesApiManager
from backend.api.managers.GlobalStatsManager import GlobalStats
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import GamesCompanies
from backend.api.models.movies import Movies
from backend.api.models.users import (User, UserMediaSettings, UserLastUpdate, UserMediaUpdate, Notifications,
                                      NewNotifications)
from backend.api.utils.enums import ModelTypes, MediaType, Status, RatingSystem, UpdateType, NotificationType
from backend.api.utils.functions import format_datetime


def correct_data(data: str):
    if data == "Unknown" or data == "Not Defined.":
        return None

    return data


def format_hltb_time(time: str | None | float):
    if time is None:
        return None

    if isinstance(time, str) and "½" in time:
        time = time.split("½")[0]
        return float(int(time) + 0.5)

    time = float(time)
    if time == -1 or time == 0:
        return None

    return time


def check_update_type(data):
    if data.old_status is not None or data.new_status is not None:
        return UpdateType.STATUS, {"old_value": data.old_status, "new_value": data.new_status}
    elif data.old_season is not None or data.new_season is not None:
        return UpdateType.TV, {
            "old_value": (int(data.old_season), int(data.old_episode)),
            "new_value": (int(data.new_season), int(data.new_episode)),
        }
    elif data.old_playtime is not None or data.new_playtime is not None:
        return UpdateType.PLAYTIME, {"old_value": data.old_playtime, "new_value": data.new_playtime}
    elif data.old_page is not None or data.new_page is not None:
        return UpdateType.PAGE, {"old_value": data.old_page, "new_value": data.new_page}
    elif data.old_redo is not None or data.new_redo is not None:
        return UpdateType.REDO, {"old_value": data.old_redo, "new_value": data.new_redo}


def check_notification_type(data):
    if data.media_type:
        media_type = MediaType(data.media_type.replace("list", ""))
        return NotificationType.MEDIA, media_type
    else:
        return NotificationType.FOLLOW, None


def transform_media_list_data(data):
    user = User.query.filter_by(id=data.user_id).first()
    if user.rating_system == RatingSystem.SCORE:
        return data.score
    else:
        try:
            feeling = float(data.feeling) * 2
        except:
            feeling = None
        return feeling


# -------------------------------------------------------------------------------------------


def change_add_feeling_with_rating_system():
    print("Changing add_feeling with rating_system...")
    for user in tqdm(User.query.all(), ncols=70):
        user.rating_system = RatingSystem.FEELING if user.add_feeling else RatingSystem.SCORE
    db.session.commit()


def add_user_media_settings_data_from_user_table():
    print("Adding user_media_settings...")
    for user in tqdm(User.query.all(), ncols=70):
        for media_type in MediaType:
            time_spent_col = f"time_spent_{media_type.value}"
            views_col = f"{media_type.value}_views"
            active_col = f"add_{media_type.value}"
            media_time = UserMediaSettings(
                user_id=user.id,
                media_type=media_type,
                views=getattr(user, views_col),
                active=getattr(user, active_col, True),
                time_spent=getattr(user, time_spent_col),
            )
            db.session.add(media_time)
    db.session.commit()


def correct_media_data():
    """ Executed after Mylists-v2 migration """
    print("Correcting media data...")
    models = ModelsManager.get_lists_models(list(MediaType), ModelTypes.MEDIA)
    for model in models:
        query = model.query.all()
        for data in tqdm(query, ncols=70, desc=f"Correcting {model.GROUP.value.capitalize()} data"):
            if getattr(data, "director", None):
                data.director = correct_data(data.director)
            if getattr(data, "created_by", None):
                data.created_by = correct_data(data.created_by)
            if getattr(data, "last_air_date", None):
                data.last_air_date = correct_data(data.last_air_date)
            if getattr(data, "collection_name", None):
                data.collection_name = correct_data(data.collection_name)
            if getattr(data, "synopsis", None):
                data.synopsis = correct_data(data.synopsis)
            if getattr(data, "homepage", None):
                data.homepage = correct_data(data.homepage)
            if getattr(data, "language", None):
                data.language = correct_data(data.language)
            if getattr(data, "prod_status", None):
                data.prod_status = correct_data(data.prod_status)
            if getattr(data, "tagline", None):
                data.tagline = correct_data(data.tagline)
            if getattr(data, "release_date", None):
                data.release_date = format_datetime(data.release_date)
            if getattr(data, "game_engine", None):
                data.game_engine = correct_data(data.game_engine)
            if getattr(data, "game_modes", None):
                data.game_modes = correct_data(data.game_modes)
            if getattr(data, "player_perspective", None):
                data.player_perspective = correct_data(data.player_perspective)
            if getattr(data, "hltb_main_time", None):
                data.hltb_main_time = format_hltb_time(data.hltb_main_time)
            if getattr(data, "hltb_main_extra_time", None):
                data.hltb_main_extra_time = format_hltb_time(data.hltb_main_extra_time)
            if getattr(data, "hltb_total_time", None):
                data.hltb_total_time = format_hltb_time(data.hltb_total_time)
        db.session.commit()


def add_data_to_user_media_updates():
    print("Adding user_media_updates...")
    for data in tqdm(UserLastUpdate.query.all(), ncols=70):
        update_type, update_data = check_update_type(data)
        # noinspection PyArgumentList
        update = UserMediaUpdate(
            user_id=data.user_id,
            media_name=data.media_name,
            media_id=data.media_id,
            media_type=data.media_type,
            timestamp=format_datetime(data.date),
            update_type=update_type,
            update_data=json.dumps(update_data),
        )
        db.session.add(update)
    db.session.commit()


def correct_notifications_to_db():
    print("Modifying Notifications...")
    for data in tqdm(Notifications.query.all(), ncols=70):
        notif_type, media_type_or_none = check_notification_type(data)
        # noinspection PyArgumentList
        notif = NewNotifications(
            user_id=data.user_id,
            media_id=data.media_id,
            media_type=media_type_or_none,
            timestamp=format_datetime(data.timestamp),
            notif_type=notif_type,
            notif_data=data.payload_json,
        )
        db.session.add(notif)
    db.session.commit()


def replace_score_and_feeling_with_rating_system():
    print("Replacing score and feeling with rating_system in media_list...")
    models = ModelsManager.get_lists_models(list(MediaType), ModelTypes.LIST)
    for model in models:
        for data in tqdm(model.query.all(), ncols=70, desc=f"Replacing {model.GROUP.value.capitalize()} data"):
            value = transform_media_list_data(data)
            data.rating = value
        db.session.commit()


def remove_non_dev_nor_publisher_companies():
    print("Removing non dev nor publisher companies...")
    for company in tqdm(GamesCompanies.query.all(), ncols=70):
        if not company.developer and not company.publisher:
            db.session.delete(company)
    db.session.commit()


# -------------------------------------------------------------------------------------------


def correct_random_and_ptw_data():
    """ The <last_episode_watched>, <current_season>, and <total> should be zero when in <PLAN_TO_WATCH> or <RANDOM>
    status for Series and Anime """

    models = ModelsManager.get_lists_models([MediaType.SERIES, MediaType.ANIME], ModelTypes.LIST)
    for model in models:
        query = model.query.filter(model.status.in_([Status.PLAN_TO_WATCH, Status.RANDOM])).all()
        for data in query:
            data.total = 0
            data.last_episode_watched = 0
            data.current_season = 1
        db.session.commit()


def correct_medialist_duplicates():
    """ Some users have a media more than once in a medialist (example: 2 times breaking bad in its list) """

    media_lists = ["series_list", "anime_list", "movies_list", "games_list", "books_list"]

    for media_list in media_lists:
        raw_sql = text(f"""
            SELECT list_id, name, user_id, row_num
            FROM (
                SELECT
                    B.id AS list_id,
                    A.name,
                    B.user_id,
                    ROW_NUMBER() OVER (PARTITION BY A.id, A.name, B.user_id ORDER BY B.id) AS row_num
                FROM {media_list.replace("_list", "")} AS A
                JOIN {media_list} AS B ON A.id = B.media_id
            )
            WHERE row_num > 1
            ORDER BY 2;
        """)

        data = db.session.execute(raw_sql).fetchall()
        ids_to_delete = [data[0] for data in data]
        print(f"{media_list} IDs to delete: {len(ids_to_delete)}")

        placeholders = ", ".join([":id_" + str(i) for i in range(len(ids_to_delete))])
        delete_sql = text(f"""
            DELETE FROM {media_list} 
            WHERE id IN ({placeholders})
        """)

        db.session.execute(delete_sql, {"id_" + str(i): id_ for (i, id_) in enumerate(ids_to_delete)})
        db.session.commit()


def generate_dbml():
    def generate_dbml_from_models(metadata):
        dbml_lines = []

        def get_column_attributes(column) -> str:
            attrs = []

            if column.primary_key:
                attrs.append("pk")
            if column.unique:
                attrs.append("unique")
            if column.nullable is False:
                attrs.append("not null")
            if column.foreign_keys:
                attrs.extend([f"ref: > {fk.column.table.name}.{fk.column.name}" for fk in column.foreign_keys])

            return f"[{', '.join(attrs)}]" if attrs else ""

        def get_table_indexes(table) -> List[str]:
            indexes_lines = []
            for index in table.indexes:
                index_columns = ", ".join(index.columns.keys())
                unique_str = " [unique]" if index.unique else ""
                indexes_lines.append(f"\t\t{index_columns}{unique_str}")
            return indexes_lines

        for table in metadata.sorted_tables:
            dbml_lines.append(f"Table {table.name} {{")

            for column in table.columns:
                column_attrs = get_column_attributes(column)
                dbml_lines.append(f"\t{column.name} {str(column.type).lower()} {column_attrs}")

            if table.indexes:
                dbml_lines.append("\n\tIndexes {")
                dbml_lines.extend(get_table_indexes(table))
                dbml_lines.append("\t}")

            dbml_lines.append("}")
            dbml_lines.append("")

        return "\n".join(dbml_lines)

    with current_app.app_context():
        dbml_schema = generate_dbml_from_models(db.metadata)
        with open("db_schema.dbml", "w") as fp:
            fp.write(dbml_schema)
        print("DBML file 'db_schema.dbml' created successfully!")


def reactivate_update_modal(value: bool = True):
    db.session.execute(db.update(User).values(show_update_modal=value))
    db.session.commit()


def remove_non_list_media():
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Media Remover -")

    models = ModelsManager.get_dict_models("all", ModelTypes.MEDIA)
    for model in models.values():
        model.remove_non_list_media()
        db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished Automatic Media Remover -")
    current_app.logger.info("###############################################################################")


def remove_all_old_covers():
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Covers Remover -")

    models = ModelsManager.get_dict_models("all", ModelTypes.MEDIA)
    for model in models.values():
        path_covers = Path(current_app.root_path, f"static/covers/{model.GROUP.value}_covers/")
        images_in_db = set(db.session.execute(select(model.image_cover)).scalars().all())
        images_to_remove = [image for image in os.listdir(path_covers) if image not in images_in_db]

        count = 0
        current_app.logger.info(f"Deleting {model.GROUP.value} covers...")
        for image in images_to_remove:
            file_path = os.path.join(path_covers, image)
            try:
                os.remove(file_path)
                count += 1
            except Exception as e:
                current_app.logger.error(f"Error deleting this old {model.GROUP.value} cover {image}: {e}")
        current_app.logger.info(f"Total old {model.GROUP.value} covers deleted: {count}")

    current_app.logger.info("[SYSTEM] - Finished Automatic Covers Remover -")
    current_app.logger.info("###############################################################################")


def automatic_media_refresh():
    """ Automatically refresh the media using the appropriate API """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Media Refresh -")

    models = ModelsManager.get_lists_models([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        api_manager = BaseApiManager.get_subclass(model.GROUP)
        api_ids_to_refresh = api_manager().get_changed_api_ids()

        current_app.logger.info(f"{model.GROUP.value.capitalize()} API ids to refresh: {len(api_ids_to_refresh)}")

        for api_id in api_ids_to_refresh:
            try:
                refreshed_data = api_manager(api_id=api_id).get_refreshed_media_data()
                model.refresh_element_data(api_id, refreshed_data)
            except Exception as e:
                current_app.logger.error(f"[ERROR] - Refreshing {model.GROUP.value} with API ID = [{api_id}]: {e}")

        current_app.logger.info(f"{model.GROUP.value.capitalize()} API ids refreshed")

    current_app.logger.info("[SYSTEM] - Finished Automatic Media Refresh -")
    current_app.logger.info("###############################################################################")


def add_media_related_notifications():
    """ Create and send media new releases and updates notifications """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Checking New Releasing Media -")

    models = ModelsManager.get_lists_models([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        model.create_new_release_notification()

    current_app.logger.info("[SYSTEM] - Finished Checking New Releasing Media -")
    current_app.logger.info("###############################################################################")


def automatic_movies_locking():
    """ Automatically lock the movies that are more than about 6 months old """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Movies Locking -")

    count_locked, count_unlocked = Movies.automatic_locking()

    current_app.logger.info(f"Number of movies locked: {count_locked}")
    current_app.logger.info(f"Number of movies not locked: {count_unlocked}")
    current_app.logger.info("[SYSTEM] - Finished Automatic Movies Locking -")
    current_app.logger.info("###############################################################################")


def compute_media_time_spent():
    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Calculating User Total Time -")

    models = ModelsManager.get_dict_models("all", [ModelTypes.MEDIA, ModelTypes.LIST])

    for model in models.values():
        media, media_list = model[ModelTypes.MEDIA], model[ModelTypes.LIST]
        media_alias = aliased(media)
        query = (
            db.session.query(User, media, media_list, media_list.time_spent_calculation())
            .join(media_list, media.id == media_list.media_id)
            .join(User, User.id == media_list.user_id)
            .join(media_alias, media_alias.id == media_list.media_id)
            .group_by(media_list.user_id).all()
        )

        # TODO: Change that to use UserMediaSettings
        for user, _, _, time_spent in query:
            setattr(user, f"time_spent_{media.GROUP.value}", time_spent)

    db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished Calculating User Total Time -")
    current_app.logger.info("###############################################################################")


def update_Mylists_stats():
    """ Update the MyLists global stats. Every day at 3:00 AM UTC+1 """
    stats = GlobalStats().compute_global_stats()
    cache.set("mylists-stats", stats, timeout=86400)
    current_app.logger.info("*** Global stats calculated and cache refreshed.")


def update_IGDB_API():
    """ Refresh the IGDB API token. The backend needs to restart to take effect. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Fetching New IGDB API Key -")

    new_IGDB_token = GamesApiManager().update_api_key()
    if not new_IGDB_token:
        current_app.logger.error("[ERROR] - Failed to obtain the new IGDB token.")
        return

    # Write new new_IGDB_token to .env file
    dotenv_file = dotenv.find_dotenv()
    dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_IGDB_token)

    current_app.logger.info("[SYSTEM] - Finished Fetching New IGDB API Key -")
    current_app.logger.info("###############################################################################")


def get_active_users(days: int = 180):
    from datetime import datetime, timedelta
    from math import ceil

    delta_time = datetime.now() - timedelta(days=days)
    if days < 30:
        period_repr = f"< {days} days"
    else:
        months = ceil(days / 30)
        period_repr = f"< {months} months"

    active_user_count = User.query.filter(User.last_seen >= delta_time).count()
    print(f"### Active users ({period_repr}) = {active_user_count}")
