from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Type, Tuple

import dotenv
from flask import current_app, jsonify
from sqlalchemy import func

from backend.api import db, cache
from backend.api.core.errors import log_error
from backend.api.managers.ApiManager import GamesApiManager, ApiManager
from backend.api.managers.GlobalStatsManager import GlobalStats
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.user import User, UserMediaUpdate, Notifications, UserMediaSettings
from backend.api.utils.enums import MediaType, ModelTypes, NotificationType, Status, Privacy
from backend.api.utils.functions import naive_utcnow


class TasksManagerMeta(type):
    subclasses = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.subclasses[attrs["GROUP"]] = new_class
        return new_class


class TasksManager(metaclass=TasksManagerMeta):
    GROUP: MediaType

    def __init__(self):
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.GROUP, "all")

        # Always exists
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]

        # MediaType dependent
        self.media_eps = media_models.get(ModelTypes.EPS)
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_network = media_models.get(ModelTypes.NETWORK)
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    @classmethod
    def get_subclass(cls, media_type: MediaType) -> Type[TasksManager]:
        return cls.subclasses.get(media_type, cls)

    @staticmethod
    def check_accounts(privacy: str):
        users = (
            User.query.filter(
                User.active == True,
                User.last_seen.is_not(None),
                User.privacy == Privacy(privacy),
            ).order_by(User.last_seen.desc())
            .all()
        )

        headers = ["Username", "Last Seen"]
        table_data = [[user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S")] for user in users]
        col_widths = [max(len(str(row[i])) for row in [headers] + table_data) for i in range(len(headers))]

        separator = "+" + "+".join("-" * (width + 2) for width in col_widths) + "+"
        row_format = "|" + "|".join(" {:%d} " % width for width in col_widths) + "|"

        print(f"\n### Users with privacy = {privacy}")
        print(separator)
        print(row_format.format(*headers))
        print(separator)
        for row in table_data:
            print(row_format.format(*row))
        print(separator)

    @staticmethod
    def change_privacy_setting(user: str | int, privacy: str):
        filter_ = {"username": user} if isinstance(user, str) else {"id": user}
        user = User.query.filter_by(**filter_).first()
        if not user:
            raise ValueError(f"User not found with criteria: {filter_}")
        user.privacy = privacy
        db.session.commit()

    @staticmethod
    def reactivate_update_modal(value: bool = True):
        db.session.execute(db.update(User).values(show_update_modal=value))
        db.session.commit()

    @staticmethod
    def activate_user_account(user: str | int, toggle: bool):
        """ Toggle users accounts activation manually """

        filter_ = {"username": user} if isinstance(user, str) else {"id": user}
        user = User.query.filter_by(**filter_).first()
        if not user:
            raise ValueError(f"User not found with criteria: {filter_}")
        user.active = toggle
        db.session.commit()

    @staticmethod
    def get_active_users(days: int = 30):
        delta_time = datetime.now() - timedelta(days=days)
        if days < 30:
            period_repr = f"< {days} days"
        else:
            months = days // 30
            period_repr = f"< {months} months"

        active_users = (
            User.query.filter(User.last_seen >= delta_time, User.active.is_(True))
            .order_by(User.last_seen.desc())
            .all()
        )

        headers = ["Username", "Last Seen"]
        table_data = [[user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S")] for user in active_users]
        col_widths = [max(len(str(row[i])) for row in [headers] + table_data) for i in range(len(headers))]

        separator = "+" + "+".join("-" * (width + 2) for width in col_widths) + "+"
        row_format = "|" + "|".join(" {:%d} " % width for width in col_widths) + "|"

        print(f"\n### Active users ({period_repr}) = {len(active_users)}")
        print(separator)
        print(row_format.format(*headers))
        print(separator)
        for row in table_data:
            print(row_format.format(*row))
        print(separator)

    @staticmethod
    def get_users_last_seen(usernames: List[str]):
        users = User.query.filter(User.username.in_(usernames)).order_by(User.last_seen.desc()).all()

        headers = ["Username", "Last Seen"]
        table_data = [[user.username, user.last_seen.strftime("%d %b %Y - %H:%M:%S")] for user in users]
        col_widths = [max(len(str(row[i])) for row in [headers] + table_data) for i in range(len(headers))]

        separator = "+" + "+".join("-" * (width + 2) for width in col_widths) + "+"
        row_format = "|" + "|".join(" {:%d} " % width for width in col_widths) + "|"

        print(f"\n### Selected users")
        print(separator)
        print(row_format.format(*headers))
        print(separator)
        for row in table_data:
            print(row_format.format(*row))
        print(separator)

    @staticmethod
    def delete_non_activated_users(days: int = 7):
        delta_time = datetime.now() - timedelta(days=days)

        if days < 30:
            period_repr = f"> {days} days"
        else:
            months = days // 30
            period_repr = f"> {months} months"

        non_activated_user_count = User.query.filter(User.active.is_(False), User.registered_on <= delta_time).count()
        User.query.filter(User.active.is_(False), User.registered_on <= delta_time).delete()
        current_app.logger.info(f"### Deleted {non_activated_user_count} non-activated users ({period_repr})")
        db.session.commit()

    @staticmethod
    def update_Mylists_stats(global_stats_manager: Type[GlobalStats]):
        stats = global_stats_manager().compute_global_stats()
        cache.set("mylists-stats", jsonify(data=stats), timeout=86400)

    @staticmethod
    def update_igdb_token(games_api_manager: Type[GamesApiManager]):
        with current_app.app_context():
            new_igdb_token = games_api_manager().update_api_token()
            dotenv_file = dotenv.find_dotenv()
            dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_igdb_token)

    @staticmethod
    def bulk_media_refresh(api_manager: Type[ApiManager]):
        media_type = api_manager.GROUP.value
        api_ids_to_refresh = api_manager().get_changed_api_ids()
        current_app.logger.info(f"{media_type} API ids to refresh: {len(api_ids_to_refresh)}")
        for api_id in api_ids_to_refresh:
            try:
                api_manager(api_id=api_id).update_media_to_db(bulk=True)
                current_app.logger.info(f"{media_type} [API ID {api_id}] refreshed")
            except Exception as e:
                log_error(e)
        current_app.logger.info(f"{media_type} API ids refreshed")

    def compute_user_time_spent(self):
        subq = (
            db.session.query(self.media_list.user_id, self.media_list.total_user_time_def().label("time_spent"))
            .join(self.media, self.media.id == self.media_list.media_id)
            .group_by(self.media_list.user_id)
            .subquery()
        )

        db.session.query(UserMediaSettings).filter(
            UserMediaSettings.user_id == subq.c.user_id,
            UserMediaSettings.media_type == self.GROUP,
        ).update({UserMediaSettings.time_spent: subq.c.time_spent}, synchronize_session=False)

        db.session.commit()

    def remove_all_old_covers(self):
        path_covers = Path(current_app.root_path, f"static/covers/{self.GROUP.value}_covers/")
        images_in_db = self.media.query.with_entities(self.media.image_cover).all()
        images_in_db = [image[0] for image in images_in_db]
        images_to_remove = [image for image in os.listdir(path_covers) if image not in images_in_db]

        if len(images_to_remove) > 100:
            current_app.logger.error(f"Too many images to remove ({len(images_to_remove)}). Validation necessary.")
            return

        count = 0
        current_app.logger.info(f"Deleting {self.GROUP.value} covers...")
        for image in images_to_remove:
            file_path = os.path.join(path_covers, image)
            try:
                os.remove(file_path)
                count += 1
            except:
                current_app.logger.warning(f"[WARNING] - Failed to delete {image} from {self.GROUP.value} covers")
        current_app.logger.info(f"Total old {self.GROUP.value} covers deleted: {count}")

    def remove_non_list_media(self) -> List[int]:
        media_to_delete = (
            self.media.query.outerjoin(self.media_list, self.media_list.media_id == self.media.id)
            .filter(self.media_list.media_id.is_(None))
            .all()
        )

        if len(media_to_delete) > 50:
            current_app.logger.error(f"Too many media to delete ({len(media_to_delete)}). Validation necessary.")
            raise Exception("Too many media to delete")

        current_app.logger.info(f"{self.GROUP.value.capitalize()} to delete: {len(media_to_delete)}")
        media_ids = [media.id for media in media_to_delete]

        self.media_genre.query.filter(self.media_genre.media_id.in_(media_ids)).delete()
        UserMediaUpdate.query.filter(
            UserMediaUpdate.media_type == self.GROUP,
            UserMediaUpdate.media_id.in_(media_ids)
        ).delete()
        Notifications.query.filter(
            Notifications.media_type == self.GROUP,
            Notifications.media_id.in_(media_ids)
        ).delete()
        self.media_label.query.filter(self.media_label.media_id.in_(media_ids)).delete()
        self.media.query.filter(self.media.id.in_(media_ids)).delete()

        return media_ids

    def automatic_locking(self) -> Tuple[int, int]:
        raise NotImplementedError("Subclasses must implement this method")

    def add_notifications(self):
        query = (
            db.session.query(self.media, self.media_list)
            .join(self.media_list, self.media.id == self.media_list.media_id)
            .filter(
                self.media.release_date.is_not(None),
                self.media.release_date > naive_utcnow(),
                self.media.release_date <= naive_utcnow() + timedelta(days=self.media.RELEASE_WINDOW),
            ).all()
        )

        for media, media_list in query:
            notification = Notifications.search(media_list.user_id, self.GROUP, media.id)

            if not notification:
                new_notification = Notifications(
                    user_id=media_list.user_id,
                    media_id=media.id,
                    media_type=self.GROUP,
                    notification_type=NotificationType.MEDIA,
                    payload=json.dumps({"name": media.name, "release_date": media.release_date})
                )
                db.session.add(new_notification)

        db.session.commit()


class TvTasksManager(TasksManager):
    def remove_non_list_media(self):
        media_ids = super().remove_non_list_media()
        self.media_actors.query.filter(self.media_actors.media_id.in_(media_ids)).delete()
        self.media_network.query.filter(self.media_network.media_id.in_(media_ids)).delete()
        self.media_eps.query.filter(self.media_eps.media_id.in_(media_ids)).delete()
        db.session.commit()
        current_app.logger.info(f"{self.GROUP.value.capitalize()} successfully deleted")

    def add_notifications(self):
        top_eps_subq = (
            db.session.query(self.media_eps.media_id, self.media_eps.episodes.label("last_episode"),
                             func.max(self.media_eps.season))
            .group_by(self.media_eps.media_id)
            .subquery()
        )

        query = (
            db.session.query(self.media, self.media_list, top_eps_subq.c.last_episode)
            .join(self.media_list, self.media.id == self.media_list.media_id)
            .join(top_eps_subq, self.media.id == top_eps_subq.c.media_id)
            .filter(
                self.media.next_episode_to_air.is_not(None),
                self.media.next_episode_to_air > naive_utcnow(),
                self.media.next_episode_to_air <= naive_utcnow() + timedelta(days=self.media.RELEASE_WINDOW),
                self.media_list.status.notin_([Status.RANDOM, Status.DROPPED]),
            ).all()
        )

        for media, media_list, last_episode in query:
            notification = Notifications.search(media_list.user_id, self.GROUP, media.id)

            if notification:
                payload = json.loads(notification.payload)
                if (media.next_episode_to_air == payload["release_date"]
                        and int(media.episode_to_air) == int(payload["episode"])
                        and int(media.season_to_air) == int(payload["season"])):
                    continue

            payload = dict(
                name=media.name,
                season=f"{media.season_to_air:02d}",
                episode=f"{media.episode_to_air:02d}",
                release_date=media.next_episode_to_air,
                finale=(last_episode == media.episode_to_air),
            )

            new_notification = Notifications(
                user_id=media_list.user_id,
                media_id=media.id,
                media_type=self.GROUP,
                notification_type=NotificationType.TV,
                payload=json.dumps(payload),
            )
            db.session.add(new_notification)

        db.session.commit()


class SeriesTasksManager(TvTasksManager):
    GROUP = MediaType.SERIES


class AnimeTasksManager(TvTasksManager):
    GROUP = MediaType.ANIME


class MoviesTasksManager(TasksManager):
    GROUP = MediaType.MOVIES

    def remove_non_list_media(self):
        media_ids = super().remove_non_list_media()
        self.media_actors.query.filter(self.media_actors.media_id.in_(media_ids)).delete()
        db.session.commit()
        current_app.logger.info(f"Movies successfully deleted")

    def automatic_locking(self):
        locking_threshold = naive_utcnow() - timedelta(days=self.media.LOCKING_DAYS)
        locked_movies = (
            self.media.query.filter(
                self.media.lock_status.is_not(True),
                self.media.image_cover != "default.jpg",
                self.media.release_date < locking_threshold,
            ).update({"lock_status": True}, synchronize_session="fetch")
        )
        db.session.commit()
        unlocked_movies = self.media.query.filter(self.media.lock_status.is_(False)).count()

        current_app.logger.info(f"Number of movies locked: {locked_movies}")
        current_app.logger.info(f"Number of movies not locked: {unlocked_movies}")


class BooksTasksManager(TasksManager):
    GROUP = MediaType.BOOKS

    def remove_non_list_media(self):
        media_ids = super().remove_non_list_media()
        self.media_authors.query.filter(self.media_authors.media_id.in_(media_ids)).delete()
        db.session.commit()
        current_app.logger.info(f"Books successfully deleted")

    def add_notifications(self):
        return


class GamesTasksManager(TasksManager):
    GROUP = MediaType.GAMES

    def remove_non_list_media(self):
        media_ids = super().remove_non_list_media()
        self.media_platform.query.filter(self.media_platform.media_id.in_(media_ids)).delete()
        self.media_companies.query.filter(self.media_companies.media_id.in_(media_ids)).delete()
        db.session.commit()
        current_app.logger.info(f"Games successfully deleted")
