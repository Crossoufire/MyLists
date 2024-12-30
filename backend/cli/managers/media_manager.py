from __future__ import annotations

import os
import sys
import json
from pathlib import Path
from datetime import timedelta
from typing import List, Type, Tuple, Optional, cast

from flask import current_app
from rich.progress import track
from sqlalchemy import func, update

from backend.api import db
from backend.api.core.errors import log_error
from backend.api.utils.functions import naive_utcnow
from backend.cli.managers._base import CLIBaseManager
from backend.api.managers.ApiManager import ApiManager
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, ModelTypes, NotificationType, Status
from backend.api.models.user import UserMediaUpdate, Notifications, UserMediaSettings


class CLIMediaManagerMeta(type):
    media_managers = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.media_managers[attrs["GROUP"]] = new_class
        return new_class


class CLIMediaManager(CLIBaseManager, metaclass=CLIMediaManagerMeta):
    GROUP: MediaType = None

    def __init__(self):
        super().__init__()

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
    def get_manager(cls, media_type: MediaType) -> Type[CLIMediaManager]:
        return cls.media_managers.get(media_type, cls)

    @classmethod
    def remove_all_non_list_media(cls):
        for media_type in MediaType:
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._remove_non_list_media()

    @classmethod
    def remove_all_old_media_covers(cls):
        for media_type in MediaType:
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._remove_old_covers()

    @classmethod
    def compute_all_time_spent(cls):
        for media_type in MediaType:
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._compute_user_time_spent()

    @classmethod
    def compute_all_users_stats(cls):
        for media_type in MediaType:
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._update_all_users_media_stats()

    @classmethod
    def add_all_media_notifications(cls):
        for media_type in MediaType:
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._add_media_notifications()

    @classmethod
    def bulk_all_media_refresh(cls):
        for media_type in [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES]:
            api_manager = ApiManager.get_subclass(media_type)
            media_manager = cls.get_manager(cast(MediaType, media_type))
            media_manager()._bulk_media_refresh(api_manager)

    def automatic_locking(self) -> Tuple[int, int]:
        raise NotImplementedError("Subclasses must implement this method")

    def _update_all_users_media_stats(self):
        self._update_all_users_specific_total()
        self._update_all_users_media_per_status()
        self._update_all_users_favorites()
        self._update_all_users_media_rating()

    def _update_all_users_specific_total(self):
        if self.GROUP == MediaType.GAMES:
            return

        subq = (
            db.session.query(self.media_list.user_id, func.sum(self.media_list.total).label("total"))
            .group_by(self.media_list.user_id).subquery()
        )

        # Fetch current values of `total_specific` before updating
        before_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.total_specific.label("old_total_specific"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.GROUP)
            .all()
        )
        before_update = {row.user_id: row.old_total_specific for row in before_update}

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.GROUP)
            .values(total_specific=subq.c.total)
        )
        db.session.execute(update_stmt)
        db.session.commit()

        # Fetch new values after updating
        after_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.total_specific.label("new_total_specific"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.GROUP)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_value = before_update.get(row.user_id, 0)
            new_value = row.new_total_specific
            discrepancy = new_value - old_value
            if discrepancy > 0.001:
                self.log_warning(f"User [ID {row.user_id}] - Before: {old_value}, After: {new_value}, Discrepancy: {discrepancy}")

        self.log_success(f"Total specific '{self.GROUP}' for each user successfully updated")

    def _update_all_users_media_per_status(self):
        status_counts = (
            db.session.query(self.media_list.user_id, self.media_list.status, func.count(self.media_list.id).label("count"))
            .group_by(self.media_list.user_id, self.media_list.status)
            .all()
        )

        user_status_counts = {}
        for user_id, status, count in status_counts:
            if user_id not in user_status_counts:
                user_status_counts[user_id] = {status: 0 for status in Status.by(self.GROUP)}
            user_status_counts[user_id][status] = count

        for user_id, counts in user_status_counts.items():
            (db.session.query(UserMediaSettings)
             .filter(UserMediaSettings.user_id == user_id, UserMediaSettings.media_type == self.GROUP)
             .update({"status_counts": counts}))

        db.session.commit()

        self.log_success(f"media per status '{self.GROUP}' for each user successfully updated")

    def _update_all_users_favorites(self):
        if self.GROUP == MediaType.GAMES:
            redo_data = True
        else:
            redo_data = func.sum(self.media_list.redo.label("redo_sum"))

        subquery = (
            db.session.query(
                self.media_list.user_id,
                func.count(self.media_list.favorite.label("fav_count")),
                redo_data,
                func.count(self.media_list.comment.label("com_count")),
            ).filter(self.media_list.comment.is_not(None), self.media_list.favorite.is_(True))
            .group_by(self.media_list.user_id).subquery()
        )

        if not db.session.query(subquery).all():
            self.log_success(f"total favorites '{self.GROUP}' for each user successfully updated")
            self.log_success(f"total redo '{self.GROUP}' for each user successfully updated")
            self.log_success(f"total comments '{self.GROUP}' for each user successfully updated")
            return

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subquery.c.user_id, UserMediaSettings.media_type == self.GROUP)
            .values(
                entries_favorites=subquery.c.fav_count,
                total_redo=subquery.c.redo_sum,
                entries_commented=subquery.c.com_count,
            )
        )
        db.session.execute(update_stmt)
        db.session.commit()

        self.log_success(f"total favorites '{self.GROUP}' for each user successfully updated")
        self.log_success(f"total redo '{self.GROUP}' for each user successfully updated")
        self.log_success(f"total comments '{self.GROUP}' for each user successfully updated")

    def _update_all_users_media_rating(self):
        subquery = (
            db.session.query(
                self.media_list.user_id,
                func.count(self.media_list.rating).label("rating_count"),
                func.count(self.media_list.media_id).label("media_count"),
                func.sum(self.media_list.rating).label("sum_rating"),
            ).group_by(self.media_list.user_id).subquery()
        )

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subquery.c.user_id, UserMediaSettings.media_type == self.GROUP)
            .values(
                total_entries=subquery.c.media_count,
                entries_rated=subquery.c.rating_count,
                sum_entries_rated=subquery.c.sum_rating,
                average_rating=subquery.c.sum_rating / subquery.c.rating_count,
            )
        )
        db.session.execute(update_stmt)
        db.session.commit()

        self.log_success(f"Total entries '{self.GROUP}' for each user successfully updated")
        self.log_success(f"Entries rated '{self.GROUP}' for each user successfully updated")
        self.log_success(f"Sum entries rated '{self.GROUP}' for each user successfully updated")
        self.log_success(f"Average rating '{self.GROUP}' for each user successfully updated")

    def _compute_user_time_spent(self):
        # Subquery with all users and total `time_spent` per media_type
        subq = (
            db.session.query(self.media_list.user_id, self.media_list.total_user_time_def().label("time_spent"))
            .join(self.media, self.media.id == self.media_list.media_id)
            .group_by(self.media_list.user_id)
            .subquery()
        )

        # Fetch current values of `time_spent` before updating
        before_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.time_spent.label("old_time_spent"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.media_list.GROUP)
            .all()
        )
        before_update = {row.user_id: row.old_time_spent for row in before_update}

        # Update `time_spent` for each user
        db.session.query(UserMediaSettings).filter(
            UserMediaSettings.user_id == subq.c.user_id,
            UserMediaSettings.media_type == self.media_list.GROUP,
        ).update({UserMediaSettings.time_spent: subq.c.time_spent}, synchronize_session=False)

        db.session.commit()

        # Fetch new values after updating
        after_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.time_spent.label("new_time_spent"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.media_list.GROUP)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_time = before_update.get(row.user_id, 0)
            new_time = row.new_time_spent
            discrepancy = new_time - old_time
            if discrepancy > 0.001:
                self.log_warning(f"User [ID {row.user_id}] - Before: {old_time}, After: {new_time}, Discrepancy: {discrepancy}")

        self.log_success(f"Time spent on '{self.GROUP.value}' for each user successfully updated")

    def _bulk_media_refresh(self, api_manager: Type[ApiManager]):
        media_type = api_manager.GROUP.value

        with self.console.status(f"Fetching the API ids for {media_type}, this can take a minute..."):
            api_ids_to_refresh = api_manager().get_changed_api_ids()

        errors = False
        self.log_info(f"There are {len(api_ids_to_refresh)} '{media_type}' API ids to refresh")
        for api_id in api_ids_to_refresh:
            try:
                api_manager(api_id=api_id).update_media_to_db(bulk=True)
                self.log_success(f"'{media_type}' [API ID {api_id}] successfully refreshed")
            except Exception as e:
                errors = True
                db.session.rollback()
                self.log_error(f"'{media_type}' [API ID {api_id}] could not be refreshed")
                if not sys.stdin.isatty():
                    log_error(e)

        if not errors:
            self.log_success(f"'{media_type}' API ids successfully refreshed")

    def _remove_non_list_media(self) -> Optional[List[int]]:
        media_to_delete = (
            self.media.query.outerjoin(self.media_list, self.media_list.media_id == self.media.id)
            .filter(self.media_list.media_id.is_(None))
            .all()
        )

        if len(media_to_delete) > 50:
            self.log_warning(f"Too many '{self.GROUP.value}' to delete ({len(media_to_delete)}). Validation necessary.")
            if sys.stdin.isatty():
                confirm = input("Do you want to continue? [y/n] ")
                if confirm.lower() in ["y", "yes", "oui", "o", "ok", "t", "true", True]:
                    pass
                else:
                    return
            else:
                return

        if not len(media_to_delete):
            self.log_info(f"No non-list '{self.GROUP.value}' to remove.")
            return

        self.log_info(f"There are {len(media_to_delete)} '{self.GROUP.value}' to delete")
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

    def _remove_old_covers(self):
        path_covers = Path(current_app.root_path, f"static/covers/{self.GROUP.value}_covers/")
        covers_in_db = self.media.query.with_entities(self.media.image_cover).all()
        covers_in_db = [image[0] for image in covers_in_db]
        covers_to_delete = [image for image in os.listdir(path_covers) if image not in covers_in_db]

        if len(covers_to_delete) > 100:
            self.log_warning(f"Too many old '{self.GROUP.value}' covers to remove ({len(covers_to_delete)}). Validation necessary.")
            if sys.stdin.isatty():
                confirm = input("Do you want to continue? [y/n] ")
                if confirm.lower() in ["y", "yes", "oui", "o", "ok", "t", "true", True]:
                    pass
                else:
                    return
            else:
                return

        if not len(covers_to_delete):
            self.log_info(f"No old '{self.GROUP.value}' covers to remove.")
            return

        deletion_count = 0
        self.log_info(f"{len(covers_to_delete)} '{self.GROUP.value}' covers to remove...")
        for cover in track(covers_to_delete, description=f"Removing '{self.GROUP.value}' covers..."):
            file_path = os.path.join(path_covers, cover)
            try:
                os.remove(file_path)
                deletion_count += 1
            except:
                self.log_warning(f"Failed to delete {cover} from the '{self.GROUP.value}' covers")

        self.log_success(f"Successfully deleted {deletion_count} old '{self.GROUP.value}' covers")

    def _add_media_notifications(self):
        query = (
            db.session.query(self.media, self.media_list)
            .join(self.media_list, self.media.id == self.media_list.media_id)
            .filter(
                self.media.release_date.is_not(None),
                self.media.release_date > naive_utcnow(),
                self.media.release_date <= naive_utcnow() + timedelta(days=self.media.RELEASE_WINDOW),
            ).all()
        )

        notif_logs = []
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
                notif_logs.append((media_list.user_id, media.name))

        db.session.commit()

        for user_id, media_name in notif_logs:
            self.log_info(f"Notification added for user [ID {user_id}], for the '{self.GROUP.value}': {media_name}")
        self.log_info(f"There was {len(notif_logs)} notifications added for the '{self.GROUP.value}'")


class CLITvManager(CLIMediaManager):
    def _remove_non_list_media(self):
        media_ids = super()._remove_non_list_media()
        if not media_ids:
            return
        self.media_actors.query.filter(self.media_actors.media_id.in_(media_ids)).delete()
        self.media_network.query.filter(self.media_network.media_id.in_(media_ids)).delete()
        self.media_eps.query.filter(self.media_eps.media_id.in_(media_ids)).delete()
        db.session.commit()

        self.log_success(f"Non-list '{self.GROUP.value}' successfully deleted")

    def _add_media_notifications(self):
        top_eps_subq = (
            db.session.query(
                self.media_eps.media_id,
                self.media_eps.episodes.label("last_episode"),
                func.max(self.media_eps.season),
            ).group_by(self.media_eps.media_id)
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

        notif_logs = []
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
                finale=(last_episode == media.episode_to_air and media.episode_to_air != 1),
            )

            new_notification = Notifications(
                user_id=media_list.user_id,
                media_id=media.id,
                media_type=self.GROUP,
                notification_type=NotificationType.TV,
                payload=json.dumps(payload),
            )
            db.session.add(new_notification)
            notif_logs.append((media_list.user_id, media.name))

        db.session.commit()

        for user_id, media_name in notif_logs:
            self.log_info(f"Notification added for user [ID {user_id}], for the '{self.GROUP.value}': {media_name}")
        self.log_info(f"There was {len(notif_logs)} notifications added for the '{self.GROUP.value}'")


class CLISeriesManager(CLITvManager):
    GROUP = MediaType.SERIES


class CLIAnimeManager(CLITvManager):
    GROUP = MediaType.ANIME


class CLIMoviesManager(CLIMediaManager):
    GROUP = MediaType.MOVIES

    def _remove_non_list_media(self):
        media_ids = super()._remove_non_list_media()
        if not media_ids:
            return
        self.media_actors.query.filter(self.media_actors.media_id.in_(media_ids)).delete()
        db.session.commit()
        self.log_success(f"Non-list 'Movies' successfully deleted")

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

        self.log_success(f"Successfully locked {locked_movies} movies")
        self.log_info(f"Number of movies still unlocked: {unlocked_movies}")


class CLIBooksManager(CLIMediaManager):
    GROUP = MediaType.BOOKS

    def _remove_non_list_media(self):
        media_ids = super()._remove_non_list_media()
        if not media_ids:
            return
        self.media_authors.query.filter(self.media_authors.media_id.in_(media_ids)).delete()
        db.session.commit()
        self.log_success(f"Non-list 'Books' successfully deleted")

    def _add_media_notifications(self):
        return


class CLIGamesManager(CLIMediaManager):
    GROUP = MediaType.GAMES

    def _remove_non_list_media(self):
        media_ids = super()._remove_non_list_media()
        if not media_ids:
            return
        self.media_platform.query.filter(self.media_platform.media_id.in_(media_ids)).delete()
        self.media_companies.query.filter(self.media_companies.media_id.in_(media_ids)).delete()
        db.session.commit()
        self.log_success(f"Non-list 'Games' successfully deleted")
