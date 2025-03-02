from __future__ import annotations

from typing import List, Callable, Dict

from sqlalchemy.orm.attributes import flag_modified

from backend.api import MediaType
from backend.api.utils.functions import safe_div
from backend.api.models import User, UserMediaSettings
from backend.api.utils.enums import Status, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.stats.data_classes import UserGlobalMediaStats, MediaStatsSummary, StatusCount, FavoriteInfo


class DeltaStatsService:
    _multipliers: Dict[MediaType, Callable] = {}

    def __init__(self):
        self.calculator = DeltaStatsCalculator

    @classmethod
    def init_multipliers(cls, media_type: MediaType, time_multiplier: Callable):
        cls._multipliers[media_type] = time_multiplier

    def create(self, media_type: MediaType, user: User) -> DeltaStatsCalculator:
        """ Create a calculator instance for the given media type """

        if media_type not in self._multipliers:
            raise ValueError(f"No multiplier registered for media type: {media_type}")

        time_multiplier = self._multipliers[media_type]
        return self.calculator(user, media_type, time_multiplier)

    def compute_media_stats(self, settings: List[UserMediaSettings]) -> UserGlobalMediaStats:
        return self.calculator.compute_media_stats(settings)

    def compute_media_summaries(self, settings: List[UserMediaSettings], limit: int = 10) -> List[MediaStatsSummary]:
        return self.calculator.compute_media_summaries(settings, limit)


class DeltaStatsCalculator:
    def __init__(self, user: User, media_type: MediaType, time_multiplier: float | Callable):
        self.media_type = media_type
        self.time_multiplier = time_multiplier
        self.setting = user.get_media_setting(media_type)

    @classmethod
    def compute_media_stats(cls, settings: List[UserMediaSettings]) -> UserGlobalMediaStats:
        # Only active settings
        active_settings = [setting for setting in settings if setting.active]

        # Time [h] per media
        time_per_media = [setting.time_spent / 60 for setting in active_settings]

        # Total media time [h]
        total_hours = sum(time_per_media)

        # Total entries
        total_entries = sum(setting.total_entries for setting in active_settings)

        # Total entries - no plan
        excluded_statuses = [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ]
        total_entries_no_plan = sum(v for setting in active_settings for k, v in setting.status_counts.items()
                                    if k not in excluded_statuses)

        # Total and percentage rated
        total_rated = sum(setting.entries_rated for setting in active_settings)
        percent_rated = safe_div(total_rated, total_entries_no_plan, percentage=True)

        # Total avg rating
        avg_rating = safe_div(sum(setting.sum_entries_rated for setting in active_settings), total_rated)

        data = UserGlobalMediaStats(
            total_hours=int(total_hours),
            total_days=round(total_hours / 24, 0),
            total_media=total_entries,
            total_media_no_plan_to_x=total_entries_no_plan,
            time_per_media=time_per_media,
            total_rated=total_rated,
            percent_rated=percent_rated,
            mean_rated=avg_rating,
            media_types=[setting.media_type for setting in active_settings],
        )

        return data

    @classmethod
    def compute_media_summaries(cls, settings: List[UserMediaSettings], limit: int = 10) -> List[MediaStatsSummary]:
        data = []
        active_settings = [setting for setting in settings if setting.active]
        excluded_statuses = {Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ}
        for setting in active_settings:
            total_no_plan = sum(c for s, c in setting.status_counts.items() if s not in excluded_statuses)

            list_model = ModelsManager.get_unique_model(setting.media_type, ModelTypes.LIST)
            favorites_query = list_model.query.filter_by(user_id=setting.user_id, favorite=True).limit(limit).all()

            status_list = [StatusCount(
                status=status,
                count=count,
                percent=safe_div(count, setting.total_entries, True),
            ) for status, count in setting.status_counts.items()]

            favorites_list = [FavoriteInfo(
                media_name=favorite.media.name,
                media_id=favorite.media_id,
                media_cover=favorite.media.media_cover,
            ) for favorite in favorites_query]

            summary = MediaStatsSummary(
                media_type=setting.media_type,
                specific_total=setting.total_specific,
                time_hours=int(setting.time_spent / 60),
                time_days=int(setting.time_spent / 1440),
                total_media=setting.total_entries,
                total_media_no_plan_to_x=total_no_plan,
                no_data=setting.total_entries == 0,
                status_count=status_list,
                favorites=favorites_list,
                total_favorites=setting.entries_favorites,
                media_rated=setting.entries_rated,
                percent_rated=safe_div(setting.entries_rated, total_no_plan, percentage=True),
                mean_rating=setting.average_rating,
            )
            data.append(summary)

        return data

    def on_update(self, **kwargs):
        self._update_entries(**kwargs)
        self._update_time(**kwargs)
        self._update_redo(**kwargs)
        self._update_rating(**kwargs)
        self._update_status(**kwargs)
        self._update_comment(**kwargs)
        self._update_favorite(**kwargs)
        self._update_specific(**kwargs)

    def _update_entries(self, **kwargs):
        """ Update the total number of entries in the list """
        old_entry, new_entry = kwargs.get("old_entry", 0), kwargs.get("new_entry", 0)
        self.setting.total_entries += (new_entry - old_entry)

    def _update_comment(self, **kwargs):
        old_comment, new_comment = kwargs.get("old_comment"), kwargs.get("new_comment")

        if old_comment is not None and old_comment.strip() == "":
            old_comment = None

        if new_comment is not None and new_comment.strip() == "":
            new_comment = None

        if old_comment is None and new_comment is not None:
            self.setting.entries_commented += 1

        if old_comment is not None and new_comment is None:
            self.setting.entries_commented -= 1

    def _update_favorite(self, **kwargs):
        favorite_value = kwargs.get("favorite_value")
        if favorite_value is None:
            return

        if favorite_value is True:
            self.setting.entries_favorites += 1
        else:
            self.setting.entries_favorites -= 1

    def _update_status(self, **kwargs):
        """ Update status distribution counts """

        old_status, new_status = kwargs.get("old_status"), kwargs.get("new_status")

        # Initialize `status_counts` if necessary
        if self.setting.status_counts == {}:
            self.setting.status_counts = {status: 0 for status in Status.by(self.media_type)}

        if old_status:
            self.setting.status_counts[old_status] -= 1
        if new_status:
            self.setting.status_counts[new_status] += 1

        # Necessary, complex JSON type not tracked by SQLAlchemy
        flag_modified(self.setting, "status_counts")

    def _update_redo(self, **kwargs):
        old_redo, new_redo = kwargs.get("old_redo", 0), kwargs.get("new_redo", 0)
        self.setting.total_redo += (new_redo - old_redo)

    def _update_rating(self, **kwargs):
        old_rating, new_rating = kwargs.get("old_rating"), kwargs.get("new_rating")

        if old_rating is None and new_rating is not None:
            self.setting.entries_rated += 1
            self.setting.sum_entries_rated += new_rating

        if old_rating is not None and new_rating is None:
            self.setting.entries_rated -= 1
            self.setting.sum_entries_rated -= old_rating

        if old_rating is not None and new_rating is not None:
            self.setting.sum_entries_rated += (new_rating - old_rating)

        # Recalculate average rating
        self.setting.average_rating = self.setting.sum_entries_rated / self.setting.entries_rated \
            if self.setting.entries_rated > 0 else None

    def _update_specific(self, **kwargs):
        if self.media_type == MediaType.GAMES:
            return
        old_value, new_value = kwargs.get("old_value", 0), kwargs.get("new_value", 0)
        self.setting.total_specific += (new_value - old_value)

    def _update_time(self, **kwargs):
        user_media, old_value, new_value = kwargs.get("user_media"), kwargs.get("old_value", 0), kwargs.get("new_value", 0)
        self.setting.time_spent += (new_value - old_value) * self.time_multiplier(self, user_media)
