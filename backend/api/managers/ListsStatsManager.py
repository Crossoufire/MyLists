from __future__ import annotations

from typing import Type, Any
from abc import abstractmethod

from sqlalchemy.orm.attributes import flag_modified

from backend.api import db
from backend.api.models import User
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, UpdateType, Status, ModelTypes


class ListStatsManagerMeta(type):
    subclasses = {}

    def __new__(cls, name, bases, attrs):
        new_class = super().__new__(cls, name, bases, attrs)
        if "GROUP" in attrs:
            cls.subclasses[attrs["GROUP"]] = new_class
        return new_class


class ListStatsManager(metaclass=ListStatsManagerMeta):
    GROUP: MediaType

    def __init__(self, user: User):
        self.setting = user.get_media_setting(self.GROUP)

    @classmethod
    def get_manager(cls, media_type: MediaType) -> Type[ListStatsManager]:
        return cls.subclasses.get(media_type, cls)

    # --- UPDATES ------------------------------------------------------------

    def on_add_media_update(self, **kwargs):
        self.setting.total_entries += 1
        self._update_time(**kwargs)
        self._update_status(**kwargs)
        self._update_specific(**kwargs)

    def on_favorite_update(self, **kwargs):
        self._update_favorite(**kwargs)

    def on_status_update(self, **kwargs):
        self._update_status(**kwargs)
        self._update_time(**kwargs)

    def update_on_add(self, user_media, old_value, new_value):
        self.setting.total_entries += 1
        self._update_specific(old_value=old_value, new_value=new_value)

    def update_on_rating(self, user_media, old_rating, new_rating):
        """ Update rating related statistics """

        if old_rating is None and new_rating is not None:
            self.setting.entries_rated += 1
            self.setting.sum_entries_rated += new_rating

        if old_rating is not None and new_rating is None:
            self.setting.entries_rated -= 1
            self.setting.sum_entries_rated -= old_rating

        if old_rating and new_rating:
            self.setting.sum_entries_rated += (new_rating - old_rating)

        # Recalculate average rating
        self.setting.average_rating = self.setting.sum_entries_rated / self.setting.entries_rated \
            if self.setting.entries_rated > 0 else None

    def update_on_redo(self, user_media, old_value, new_value):
        self.setting.total_redo += (new_value - old_value)
        self._update_specific()

    def _update_favorite(self, **kwargs):
        new_value = kwargs.get("new_value")
        if new_value is True:
            self.setting.entries_favorites += 1
        else:
            self.setting.entries_favorites -= 1

    def update_on_comment(self, user_media, old_value, new_value):
        if old_value is None and new_value is not None:
            self.setting.entries_commented += 1
        if old_value is not None and new_value is None:
            self.setting.entries_commented -= 1

    def _update_status(self, **kwargs):
        """ Update status distribution counts """

        old_status, new_status = kwargs.get("old_status"), kwargs.get("new_status")

        # Initialize `status_counts` if necessary
        if self.setting.status_counts == {}:
            self.setting.status_counts = {status: 0 for status in Status.by(self.GROUP)}

        if old_status:
            self.setting.status_counts[old_status] -= 1
        if new_status:
            self.setting.status_counts[new_status] += 1

        # Necessary, complex JSON type not tracked by SQLAlchemy
        flag_modified(self.setting, "status_counts")

    @abstractmethod
    def _update_time(self, **kwargs):
        pass

    @abstractmethod
    def update_on_delete(self, user_media, old_value, new_value):
        pass

    @abstractmethod
    def _update_specific(self, **kwargs):
        pass

    def update_media_stats(self, user_media: db.Model, update_type: UpdateType, old_value: Any, new_value: Any):
        """ Central function to update all relevant stats """

        updates_map = {
            UpdateType.ADD: "update_on_add",
            UpdateType.TIME: "update_on_time",
            UpdateType.STATUS: "update_on_status",
            UpdateType.RATING: "update_on_rating",
            UpdateType.REDO: "update_on_redo",
            UpdateType.FAVORITE: "update_on_favorite",
            UpdateType.COMMENT: "update_on_comment",
            UpdateType.DELETE: "update_on_delete",
        }

        getattr(self, updates_map[update_type])(user_media, old_value, new_value)


class MoviesListStats(ListStatsManager):
    GROUP = MediaType.MOVIES

    def _update_time(self, **kwargs):
        old_value, new_value, user_media = kwargs.get("old_value"), kwargs.get("new_value"), kwargs.get("user_media")
        self.setting.time_spent += (new_value - old_value) * user_media.media.duration

    def update_on_delete(self, user_media, old_value, new_value):
        self.setting.total_entries -= 1
        self.update_on_status(None, user_media.status, None)
        self._update_time(user_media, user_media.total, 0)
        self.update_on_rating(None, user_media.rating, None)
        self.update_on_redo(None, user_media.redo, 0)
        self.update_on_favorite(None, None, False)
        self.update_on_comment(None, user_media.comment, None)
        self._update_specific()

    def _update_specific(self, **kwargs):
        """ Specific total for movies are the total watched with re-watched """
        old_value, new_value = kwargs.get("old_value", 0), kwargs.get("new_value", 0)
        old_redo, new_redo = kwargs.get("old_redo", 0), kwargs.get("new_redo", 0)
        self.setting.total_specific += (new_value - old_value) + (new_redo - old_redo)


class BooksListStats(ListStatsManager):
    GROUP = MediaType.BOOKS

    def _update_time(self, user_media, old_value, new_value):
        if not user_media:
            user_media = ModelsManager.get_unique_model(self.GROUP, ModelTypes.LIST)
        self.setting.time_spent += (new_value - old_value) * user_media.TIME_PER_PAGE

    def update_on_delete(self, user_media, old_value, new_value):
        self.setting.total_entries -= 1
        self.update_on_status(None, user_media.status, None)
        self.update_on_redo(None, user_media.redo, 0)
        self._update_time(user_media, user_media.playtime, 0)
        self.update_on_rating(None, user_media.rating, None)
        self.update_on_favorite(None, None, False)
        self.update_on_comment(None, user_media.comment, None)
        self._update_specific()

    def _update_specific(self, **kwargs):
        """ Total pages read for books """
        self.setting.total_specific += (kwargs["new_value"] - kwargs["old_value"])


class GamesListStats(ListStatsManager):
    GROUP = MediaType.GAMES

    def _update_time(self, user_media, old_value, new_value):
        self.setting.time_spent += (new_value - old_value)

    def update_on_delete(self, user_media, old_value, new_value):
        self.setting.total_entries -= 1
        self.update_on_status(None, user_media.status, None)
        self._update_time(user_media, user_media.playtime, 0)
        self.update_on_rating(None, user_media.rating, None)
        self.update_on_favorite(None, None, False)
        self.update_on_comment(None, user_media.comment, None)

    def _update_specific(self, **kwargs):
        """ No specific total for games """
        pass


class TvListStats(ListStatsManager):
    def _update_time(self, user_media, old_value, new_value):
        self.setting.time_spent += (new_value - old_value) * user_media.media.duration

    def update_on_delete(self, user_media, old_value, new_value):
        self.setting.total_entries -= 1
        self.update_on_status(None, user_media.status, None)
        self._update_time(user_media, user_media.total, 0)
        self.update_on_rating(None, user_media.rating, None)
        self.update_on_redo(None, user_media.redo, 0)
        self.update_on_favorite(None, None, False)
        self.update_on_comment(None, user_media.comment, None)
        self._update_specific()

    def _update_specific(self, **kwargs):
        """ Specific total is total watched episodes """


class SeriesListStats(TvListStats):
    GROUP = MediaType.SERIES


class AnimeListStats(TvListStats):
    GROUP = MediaType.ANIME
