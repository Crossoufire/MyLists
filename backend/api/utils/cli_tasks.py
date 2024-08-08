from __future__ import annotations
import os
from pathlib import Path
from typing import List
from flask import current_app
from sqlalchemy import select, text
from sqlalchemy.orm import aliased
from backend.api import db
from backend.api.managers.api_data_manager import ApiData
from backend.api.managers.global_stats_manager import GlobalStats
from backend.api.models.movies_models import Movies
from backend.api.models.user_models import User
from backend.api.models.utils_models import MyListsStats
from backend.api.utils.enums import ModelTypes, MediaType, Status
from backend.api.utils.functions import ModelsFetcher


def profile_route_time(num_requests=250):
    import time
    import requests
    import statistics
    from tqdm import tqdm

    current_app.config["DISABLE_AUTH"] = True

    headers = {"Authorization": f"Bearer 15m7Z2G8Q9RWXnO3A2YLVxNRMn2-WSCc3jMaaHZSfAQ"}
    times = []

    for _ in tqdm(range(num_requests), ncols=70):
        start_time = time.time()
        response = requests.get("http://localhost:5000/api/profile/Maxine", headers=headers)
        end_time = time.time()

        if response.status_code == 200:
            execution_time = end_time - start_time
            times.append(execution_time)
        else:
            print(f"Request failed with status code: {response.status_code}")

    if times:
        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        std_dev = statistics.stdev(times) if len(times) > 1 else 0

        print(f"Number of successful requests: {len(times)}")
        print(f"Average execution time: {int(avg_time * 1000)} ms")
        print(f"Minimum execution time: {int(min_time * 1000)} ms")
        print(f"Maximum execution time: {int(max_time * 1000)} ms")
        print(f"Standard deviation: {int(std_dev * 1000)} ms")
    else:
        print("No successful requests were made.")


def correct_random_and_ptw_data():
    """ The <last_episode_watched>, <current_season>, and <total> should be zero when in <PLAN_TO_WATCH> or <RANDOM>
    status for Series and Anime """

    models = ModelsFetcher.get_lists_models([MediaType.SERIES, MediaType.ANIME], ModelTypes.LIST)
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
    """ Put the <show_update_modal> to <value> for every user on new Update """

    db.session.execute(db.update(User).values(show_update_modal=value))
    db.session.commit()


def remove_non_list_media():
    """ Remove all media not present in a user list from db """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Media Remover -")

    models = ModelsFetcher.get_dict_models("all", ModelTypes.MEDIA)
    for model in models.values():
        model.remove_non_list_media()
        db.session.commit()

    current_app.logger.info("[SYSTEM] - Finished Automatic Media Remover -")
    current_app.logger.info("###############################################################################")


def remove_all_old_covers():
    """ Remove all the old covers on disk if not present anymore in the database """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Automatic Covers Remover -")

    models = ModelsFetcher.get_dict_models("all", ModelTypes.MEDIA)
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

    models = ModelsFetcher.get_lists_models([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        api_model = ApiData.get_API_class(model.GROUP)
        api_ids_to_refresh = api_model().get_changed_api_ids()

        current_app.logger.info(f"{model.GROUP.value.capitalize()} API ids to refresh: {len(api_ids_to_refresh)}")

        for api_id in api_ids_to_refresh:
            try:
                refreshed_data = api_model(API_id=api_id).get_refreshed_media_data()
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

    models = ModelsFetcher.get_lists_models([mt for mt in MediaType if mt != MediaType.BOOKS], ModelTypes.MEDIA)
    for model in models:
        model.get_new_releasing_media()

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
    """ Compute the total time watched/played/read for each media type for each user """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Calculating User Total Time -")

    models = ModelsFetcher.get_dict_models("all", [ModelTypes.MEDIA, ModelTypes.LIST])
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

    current_app.logger.info("[SYSTEM] - Finished Calculating User Total Time -")
    current_app.logger.info("###############################################################################")


def update_Mylists_stats():
    """ Update the MyLists global stats """

    dict_stats = GlobalStats().return_results()
    stats_to_add = MyListsStats(**dict_stats)
    db.session.add(stats_to_add)
    db.session.commit()


def update_IGDB_API():
    """ Refresh the IGDB API token. The backend needs to restart to take effect. """

    current_app.logger.info("###############################################################################")
    current_app.logger.info("[SYSTEM] - Starting Fetching New IGDB API Key -")

    with current_app.app_context():
        from backend.api.managers.api_data_manager import ApiGames
        ApiGames().update_API_key()

    current_app.logger.info("[SYSTEM] - Finished Fetching New IGDB API Key -")
    current_app.logger.info("###############################################################################")


def get_active_users(days: int = 180):
    from datetime import datetime, timedelta
    delta_time = datetime.now() - timedelta(days=days)
    print(f"### Active users (< {days // 30} months) = {User.query.filter(User.last_seen >= delta_time).count()}")
