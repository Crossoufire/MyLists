from __future__ import annotations

import os
import time
import json
from typing import cast
from pathlib import Path
from datetime import timedelta

from flask import current_app
from rich.progress import track
from sqlalchemy import func, update, case

from backend.api import db
from backend.api.core.errors import log_error
from backend.api.utils.functions import naive_utcnow
from backend.cli.managers._base import CLIBaseManager
from backend.api.services.api.service import ApiService
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.utils.enums import MediaType, ModelTypes, NotificationType, Status
from backend.api.models.user import UserMediaUpdate, Notifications, UserMediaSettings


def is_confirmed(input_: str | bool) -> bool:
    return input_.lower() in ["y", "yes", "oui", "o", "ok", "t", "true", True]


class CLIMediaManager:
    @staticmethod
    def remove_all_non_list_media():
        for media_type in MediaType:
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.remove_non_list_media()

    @staticmethod
    def remove_all_old_media_covers():
        for media_type in MediaType:
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.remove_old_covers()

    @staticmethod
    def compute_all_time_spent():
        for media_type in MediaType:
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.compute_user_time_spent()

    @staticmethod
    def compute_all_users_stats():
        for media_type in MediaType:
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.compute_users_media_stats()

    @staticmethod
    def add_all_media_notifications():
        for media_type in MediaType:
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.add_media_notifications()

    @staticmethod
    def bulk_all_media_refresh():
        for media_type in MediaType:
            api_service = ApiServiceFactory.create(cast(MediaType, media_type))
            media_manager = CLIMedia(cast(MediaType, media_type))
            media_manager.bulk_media_refresh(api_service)

    @staticmethod
    def movies_automatic_locking():
        media_manager = CLIMedia(MediaType.MOVIES)
        media_manager.movies_automatic_locking()


class CLIMedia(CLIBaseManager):
    def __init__(self, media_type: MediaType):
        super().__init__()
        self.media_type = media_type
        self._initialize_media_models()

    def _initialize_media_models(self):
        models = ModelsManager.get_dict_models(self.media_type, "all")

        # Always exists
        self.media = models[ModelTypes.MEDIA]
        self.media_list = models[ModelTypes.LIST]
        self.media_genre = models[ModelTypes.GENRE]
        self.media_label = models[ModelTypes.LABELS]

        # MediaType dependent
        self.media_eps = models.get(ModelTypes.EPS)
        self.media_actors = models.get(ModelTypes.ACTORS)
        self.media_authors = models.get(ModelTypes.AUTHORS)
        self.media_network = models.get(ModelTypes.NETWORK)
        self.media_platform = models.get(ModelTypes.PLATFORMS)
        self.media_companies = models.get(ModelTypes.COMPANIES)

    def remove_non_list_media(self):
        """ Remove all media not associated with a user in MediaList """

        media_to_delete = (
            self.media.query.outerjoin(self.media_list, self.media_list.media_id == self.media.id)
            .filter(self.media_list.media_id.is_(None))
            .all()
        )

        if len(media_to_delete) == 0:
            self.log_info(f"No non-list '{self.media_type}' to remove.")
            return

        if len(media_to_delete) > 50:
            self.log_warning(f"Too many '{self.media_type}' to delete ({len(media_to_delete)}). Validation is necessary.")
            if not self.is_terminal:
                return

            confirm = input("Do you want to continue? [y/n] ")
            if not is_confirmed(confirm):
                return
        else:
            self.log_info(f"There are {len(media_to_delete)} '{self.media_type}' to delete")

        media_ids = [media.id for media in media_to_delete]

        # Delete all rows in dependent tables
        Notifications.query.filter(Notifications.media_type == self.media_type, Notifications.media_id.in_(media_ids)).delete()
        UserMediaUpdate.query.filter(UserMediaUpdate.media_type == self.media_type, UserMediaUpdate.media_id.in_(media_ids)).delete()

        # Delete all rows in dependent models
        all_models = ModelsManager.get_lists_models(self.media_type, list(ModelTypes))
        for model in all_models:
            if model.TYPE == ModelTypes.MEDIA:
                model.query.filter(model.id.in_(media_ids)).delete()
            else:
                model.query.filter(model.media_id.in_(media_ids)).delete()

        self.log_success(f"Successfully deleted {len(media_to_delete)} '{self.media_type}' media")

        db.session.commit()

    def remove_old_covers(self):
        path_covers = Path(current_app.root_path, f"static/covers/{self.media_type}_covers/")
        covers_in_db = self.media.query.with_entities(self.media.image_cover).all()
        covers_in_db = [image[0] for image in covers_in_db]
        covers_to_del = [image for image in os.listdir(path_covers) if image not in covers_in_db]

        if len(covers_to_del) > 100:
            self.log_warning(f"Too many old '{self.media_type}' covers to remove ({len(covers_to_del)}). Validation is necessary.")
            if not self.is_terminal:
                return

            confirm = input("Do you want to continue? [y/n] ")
            if not is_confirmed(confirm):
                return

        if len(covers_to_del) == 0:
            self.log_info(f"No old '{self.media_type}' covers to remove.")
            return

        deletion_count = 0
        self.log_info(f"{len(covers_to_del)} '{self.media_type}' covers to remove...")
        for cover in track(covers_to_del, description=f"Removing '{self.media_type}' covers..."):
            file_path = os.path.join(path_covers, cover)
            try:
                os.remove(file_path)
                deletion_count += 1
            except:
                self.log_warning(f"Failed to delete {cover} from the '{self.media_type}' covers")
        self.log_success(f"Successfully deleted {deletion_count} old '{self.media_type}' covers")

    def compute_user_time_spent(self):
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
                self.log_warning(f"User [ID {row.user_id}] - Before: {old_time} | After: {new_time} | Discrepancy: {discrepancy}")

        self.log_success(f"Time spent on '{self.media_type}' for each user successfully updated")

    def compute_users_media_stats(self):
        """ Update the delta stats (UserMediaSettings) for all users """

        stats_table = self.create_table(None, ["Stat Type", "Status", "Details"])
        stats_table.columns[1].justify = "center"

        operations = {
            "Total Specific": self._update_all_users_specific_total,
            "Media per Status": self._update_all_users_media_per_status,
            "Favorites & Comments": self._update_all_users_favorites,
            "Ratings": self._update_all_users_media_rating,
        }

        with self.progress as progress:
            task = progress.add_task(f"[cyan]Updating {self.media_type} stats...", total=len(operations))
            for op_name, op_func in operations.items():
                with self.console.capture() as capture:
                    op_func()
                details = capture.get() or "No Issues Found"
                details = details.strip()

                if details != "No Issues Found":
                    details = self.strip_ansi(details)

                symbol = "[green]✓[/green]" if details == "No Issues Found" else "[yellow]![/yellow]"
                stats_table.add_row(op_name, symbol, details)
                progress.advance(task)

        self.print_table(stats_table)

    def add_media_notifications(self):
        # Build the appropriate query based on media type
        if self.media_type in [MediaType.SERIES, MediaType.ANIME]:
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
        else:
            query = (
                db.session.query(self.media, self.media_list)
                .join(self.media_list, self.media.id == self.media_list.media_id)
                .filter(
                    self.media.release_date.is_not(None),
                    self.media.release_date > naive_utcnow(),
                    self.media.release_date <= naive_utcnow()
                    + timedelta(days=self.media.RELEASE_WINDOW),
                ).all()
            )

        notif_logs = []
        for query_result in query:
            if self.media_type in [MediaType.SERIES, MediaType.ANIME]:
                media, media_list, last_episode = query_result
            else:
                media, media_list = query_result
                last_episode = None

            notification = Notifications.search(media_list.user_id, self.media_type, media.id)
            if self.media_type in [MediaType.SERIES, MediaType.ANIME]:
                if notification:
                    payload = json.loads(notification.payload)
                    if (media.next_episode_to_air == payload["release_date"] and int(media.episode_to_air) ==
                            int(payload["episode"]) and int(media.season_to_air) == int(payload["season"])):
                        continue

                payload = dict(
                    name=media.name,
                    season=f"{media.season_to_air:02d}",
                    episode=f"{media.episode_to_air:02d}",
                    release_date=media.next_episode_to_air,
                    finale=(last_episode == media.episode_to_air and media.episode_to_air != 1),
                )
                notification_type = NotificationType.TV
            else:
                if notification:
                    continue
                payload = {"name": media.name, "release_date": media.release_date}
                notification_type = NotificationType.MEDIA

            new_notification = Notifications(
                media_id=media.id,
                user_id=media_list.user_id,
                media_type=self.media_type,
                payload=json.dumps(payload),
                notification_type=notification_type,
            )
            db.session.add(new_notification)
            notif_logs.append((media_list.user_id, media.name))

        db.session.commit()

        # Log results
        for user_id, media_name in notif_logs:
            self.log_info(f"Notification added for user [ID {user_id}], for the '{self.media_type}': {media_name}")
        self.log_info(f"There was {len(notif_logs)} notifications added for the '{self.media_type}'")

    def bulk_media_refresh(self, api_service: ApiService):
        with self.console.status(f"Fetching the API ids for {self.media_type}, this can take a minute..."):
            try:
                api_ids_to_refresh = api_service.changed_api_ids()
            except Exception as e:
                self.log_warning(str(e))
                return

        errors = False
        self.log_info(f"There are {len(api_ids_to_refresh)} '{self.media_type}' API ids to refresh")
        for api_id in api_ids_to_refresh:
            try:
                if self.media_type == MediaType.MANGA:
                    time.sleep(0.5)
                api_service.update_media_to_db(api_id=api_id, bulk=True)
                self.log_success(f"'{self.media_type}' [API ID {api_id}] successfully refreshed")
            except Exception as e:
                errors = True
                db.session.rollback()
                self.log_error(f"'{self.media_type}' [API ID {api_id}] could not be refreshed")
                if not self.is_terminal:
                    log_error(e)

        if not errors:
            self.log_success(f"'{self.media_type}' API ids successfully refreshed")

    def movies_automatic_locking(self):
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

    # --- INTERNAL METHODS ---------------------------------------------------------

    def _update_all_users_specific_total(self):
        if self.media_type == MediaType.GAMES:
            return

        subq = (
            db.session.query(self.media_list.user_id, func.sum(self.media_list.total).label("total"))
            .group_by(self.media_list.user_id).subquery()
        )

        # Fetch `total_specific` values before updating
        before_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.total_specific.label("old_total_specific"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.media_type)
            .all()
        )
        before_update = {row.user_id: row.old_total_specific for row in before_update}

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.media_type)
            .values(total_specific=subq.c.total)
        )
        db.session.execute(update_stmt)
        db.session.commit()

        # Fetch `total_specific` values after updating
        after_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.total_specific.label("new_total_specific"))
            .filter(UserMediaSettings.user_id == subq.c.user_id, UserMediaSettings.media_type == self.media_type)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_value = before_update.get(row.user_id, 0) or 0
            new_value = row.new_total_specific or 0
            discrepancy = new_value - old_value
            if abs(discrepancy) > 0.001:
                self.log_print(f"User ID {row.user_id} - Before: {old_value} | After: {new_value} | Discrepancy: {discrepancy}")

    def _update_all_users_media_per_status(self):
        # Fetch `status_counts` values before updating
        before_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.status_counts)
            .filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )
        before_update = {row.user_id: row.status_counts for row in before_update}

        status_counts = (
            db.session.query(self.media_list.user_id, self.media_list.status, func.count(self.media_list.id).label("count"))
            .group_by(self.media_list.user_id, self.media_list.status)
            .all()
        )

        user_status_counts = {}
        for user_id, status, count in status_counts:
            if user_id not in user_status_counts:
                user_status_counts[user_id] = {status: 0 for status in Status.by(self.media_type)}
            user_status_counts[user_id][status] = count

        for user_id, counts in user_status_counts.items():
            (db.session.query(UserMediaSettings)
             .filter(UserMediaSettings.user_id == user_id, UserMediaSettings.media_type == self.media_type)
             .update({"status_counts": counts}))

        db.session.commit()

        # Fetch `status_count` values after updating
        after_update = (
            db.session.query(UserMediaSettings.user_id, UserMediaSettings.status_counts)
            .filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_counts = before_update.get(row.user_id, {}) or {}
            new_counts = row.status_counts or {}

            for status in Status.by(self.media_type):
                old_value = old_counts.get(status, 0) or 0
                new_value = new_counts.get(status, 0) or 0
                discrepancy = new_value - old_value
                if abs(discrepancy) > 0.001:
                    self.log_print(f"User ID {row.user_id} - Status '{status}' - Before: {old_value} | After: {new_value} | Discrepancy: {discrepancy}")

    def _update_all_users_favorites(self):
        # Fetch current values before updating
        before_update = (
            db.session.query(
                UserMediaSettings.user_id,
                UserMediaSettings.entries_favorites,
                UserMediaSettings.total_redo,
                UserMediaSettings.entries_commented,
            ).filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )
        before_update = {
            row.user_id: {
                "favorites": row.entries_favorites or 0,
                "redo": row.total_redo or 0,
                "comments": row.entries_commented or 0
            } for row in before_update
        }

        if self.media_type == MediaType.GAMES:
            redo_data = func.coalesce(func.sum(0), 0).label("redo_sum")
        else:
            redo_data = func.coalesce(func.sum(self.media_list.redo), 0).label("redo_sum")

        # noinspection PyTypeChecker
        subquery = (
            db.session.query(
                self.media_list.user_id,
                func.coalesce(func.sum(case((self.media_list.favorite.is_(True), 1), else_=0)), 0).label("fav_count"),
                redo_data,
                func.coalesce(func.sum(case((func.trim(self.media_list.comment) != "", 1), else_=0)), 0).label("com_count"),
            ).group_by(self.media_list.user_id)
            .subquery()
        )

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subquery.c.user_id, UserMediaSettings.media_type == self.media_type)
            .values(
                entries_favorites=subquery.c.fav_count,
                total_redo=subquery.c.redo_sum,
                entries_commented=subquery.c.com_count,
            )
        )
        db.session.execute(update_stmt)
        db.session.commit()

        # Fetch new values after updating
        after_update = (
            db.session.query(
                UserMediaSettings.user_id,
                UserMediaSettings.entries_favorites,
                UserMediaSettings.total_redo,
                UserMediaSettings.entries_commented
            ).filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_values = before_update.get(row.user_id, {"favorites": 0, "redo": 0, "comments": 0})
            new_values = {
                "favorites": row.entries_favorites or 0,
                "redo": row.total_redo or 0,
                "comments": row.entries_commented or 0
            }

            for field in ["favorites", "redo", "comments"]:
                discrepancy = new_values[field] - old_values[field]
                if abs(discrepancy) > 0.00001:
                    self.log_print(f"User ID {row.user_id} - {field} - Before: {old_values[field]} | After: {new_values[field]} | Discrepancy: {discrepancy}")

    def _update_all_users_media_rating(self):
        subquery = (
            db.session.query(
                self.media_list.user_id,
                func.count(self.media_list.rating).label("rating_count"),
                func.count(self.media_list.media_id).label("media_count"),
                func.coalesce(func.sum(self.media_list.rating), 0).label("sum_rating"),
            ).group_by(self.media_list.user_id).subquery()
        )

        # Fetch current values before updating
        before_update = (
            db.session.query(
                UserMediaSettings.user_id,
                UserMediaSettings.total_entries,
                UserMediaSettings.entries_rated,
                UserMediaSettings.sum_entries_rated,
                UserMediaSettings.average_rating
            ).filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )
        before_update = {
            row.user_id: {
                "total": row.total_entries or 0,
                "rated": row.entries_rated or 0,
                "sum": row.sum_entries_rated or 0,
                "avg": row.average_rating or 0
            } for row in before_update
        }

        # noinspection PyTypeChecker
        update_stmt = (
            update(UserMediaSettings)
            .where(UserMediaSettings.user_id == subquery.c.user_id, UserMediaSettings.media_type == self.media_type)
            .values(
                total_entries=subquery.c.media_count,
                entries_rated=subquery.c.rating_count,
                sum_entries_rated=subquery.c.sum_rating,
                average_rating=subquery.c.sum_rating / subquery.c.rating_count,
            )
        )
        db.session.execute(update_stmt)
        db.session.commit()

        # Fetch new values after updating
        after_update = (
            db.session.query(
                UserMediaSettings.user_id,
                UserMediaSettings.total_entries,
                UserMediaSettings.entries_rated,
                UserMediaSettings.sum_entries_rated,
                UserMediaSettings.average_rating
            ).filter(UserMediaSettings.media_type == self.media_type)
            .all()
        )

        # Compare and log discrepancies
        for row in after_update:
            old_values = before_update.get(row.user_id, {"total": 0, "rated": 0, "sum": 0, "avg": 0})
            new_values = {
                "total": row.total_entries or 0,
                "rated": row.entries_rated or 0,
                "sum": row.sum_entries_rated or 0,
                "avg": row.average_rating or 0
            }

            for field in ["total", "rated", "sum", "avg"]:
                discrepancy = new_values[field] - old_values[field]
                if abs(discrepancy) > 0.000001:
                    self.log_print(f"User ID {row.user_id} - {field} - Before: {old_values[field]} | After: {new_values[field]} | Discrepancy: {discrepancy}")
