from typing import Tuple, Dict, List

from flask import abort, request
from sqlalchemy import asc, or_, ColumnElement
from werkzeug.exceptions import HTTPException

from backend.api import db
from backend.api.models.user_models import User
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import Status, MediaType, ModelTypes
from backend.api.utils.functions import get, ModelsFetcher


class MediaListQuery:
    PER_PAGE: int = 25

    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()

        # Requests Args
        self.search = request.args.get("search")
        self.page = int(request.args.get("page", 1))
        self.lang = get(request.args, "lang", default="All").split(",")
        self.status = get(request.args, "status", default="All").split(",")
        self.genres = get(request.args, "genres", default="All").split(",")
        self.labels = get(request.args, "labels", default="All").split(",")
        self.sorting = get(request.args, "sort", default=self.media_list.DEFAULT_SORTING)
        self.favorite = request.args.get("favorite", "false").lower() == "true"
        self.common = request.args.get("common", "true").lower() == "true"
        self.comment = request.args.get("comment", "false").lower() == "true"

        # Pre-defined attributes
        self.total_media = 0
        self.common_ids = []
        if current_user.id != self.user.id:
            self.total_media = self._calculate_total_media()
            self.common_ids = self._calculate_common_ids()

        self.results = []
        self.pages = 0
        self.total = 0

        # All Filters/Sort
        self.all_genres = self.media_genre.get_available_genres()
        self.all_status = self.media_list.Status.to_list()
        self.all_labels = self.media_label.get_user_labels(self.user.id)
        self.all_sorting = self.media_list.get_available_sorting(self.user.add_feeling)

    def _initialize_media_models(self):
        media_models = ModelsFetcher.get_dict_models(self.media_type, "all")

        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]
        self.media_mores = media_models

    @property
    def status_filter(self) -> ColumnElement | HTTPException | bool:
        try:
            statuses = [Status(status) for status in self.status]
            if Status.ALL in statuses or not statuses:
                self.status = []
                return True
            return self.media_list.status.in_(statuses)
        except:
            return abort(400)

    @property
    def sorting_filter(self) -> ColumnElement | HTTPException:
        try:
            sort_filter = self.all_sorting[self.sorting]
        except KeyError:
            return abort(400, "This sorting is undefined")
        return sort_filter

    @property
    def lang_filter(self) -> ColumnElement | bool:
        if "All" in self.lang or self.media_type != MediaType.MOVIES:
            self.lang = []
            return True
        return self.media.original_language.in_(self.lang)

    @property
    def common_filter(self) -> ColumnElement | bool:
        return self.media_list.media_id.notin_(self.common_ids) if not self.common else True

    @property
    def genres_filter(self) -> ColumnElement | bool:
        if "All" in self.genres:
            self.genres = []
            return True
        return self.media_genre.genre.in_(self.genres)

    @property
    def labels_filter(self) -> ColumnElement | bool:
        if "All" in self.labels:
            self.labels = []
            return True
        return self.media_label.label.in_(self.labels)

    @property
    def favorite_filter(self) -> ColumnElement | bool:
        return self.media_list.favorite.is_(True) if self.favorite else True

    @property
    def comment_filter(self) -> ColumnElement | bool:
        return self.media_list.comment.isnot(None) if self.comment else True

    def _calculate_total_media(self) -> int:
        return db.session.query(self.media_list.media_id).filter(self.media_list.user_id == self.user.id).count()

    def _calculate_common_ids(self) -> List:
        sub_query = (db.session.query(self.media_list.media_id).filter(self.media_list.user_id == current_user.id)
                     .subquery())
        common_ids_query = (
            db.session.query(self.media_list.media_id)
            .filter(self.media_list.user_id == self.user.id, self.media_list.media_id.in_(sub_query))
            .all()
        )
        return [id_tuple[0] for id_tuple in common_ids_query]

    def _create_current_filters(self) -> List[Dict]:
        current_filters = []

        if self.status:
            current_filters.append({"type": "status", "values": self.status})
        if self.genres:
            current_filters.append({"type": "genres", "values": self.genres})
        if self.lang:
            current_filters.append({"type": "lang", "values": self.lang})
        if self.labels:
            current_filters.append({"type": "labels", "values": self.labels})
        if self.search:
            current_filters.append({"type": "search", "values": [f"search: {self.search}"]})
        if self.favorite:
            current_filters.append({"type": "favorite", "values": ["Favorites"]})
        if self.comment:
            current_filters.append({"type": "comment", "values": ["Comments"]})
        if not self.common:
            current_filters.append({"type": "common", "values": ["No Commons"]})

        return current_filters

    def _search_query(self):
        base_query = (
            db.session.query(self.media_list)
            .outerjoin(self.media, self.media.id == self.media_list.media_id)
            .outerjoin(self.media_genre, self.media_genre.media_id == self.media.id)
            .outerjoin(self.media_label, self.media_label.media_id == self.media.id)
        )

        for table, condition in self.media_list.additional_search_joins():
            base_query = base_query.outerjoin(table, condition)

        base_query = base_query.filter(
            self.media_list.user_id == self.user.id,
            or_(*self.media_list.additional_search_filters(self.search)),
            self.favorite_filter,
            self.genres_filter,
            self.lang_filter,
            self.common_filter,
            self.labels_filter,
            self.status_filter,
            )

        paginate_results = (
            base_query.distinct(self.media_label.label).group_by(self.media.id)
            .order_by(self.sorting_filter, asc(self.media.name))
            .paginate(page=int(self.page), per_page=self.PER_PAGE, error_out=True)
        )

        self.total = paginate_results.total
        self.pages = paginate_results.pages
        self.results = [media.to_dict() for media in paginate_results.items]

    def _items_query(self):
        outerjoin_to_add = []

        if self.genres and self.genres[0] != "All":
            outerjoin_to_add.append([self.media_genre, self.media_genre.media_id == self.media_list.media_id])
        if self.labels and self.labels[0] != "All":
            outerjoin_to_add.append([self.media_label, self.media_label.media_id == self.media_list.media_id])

        base_query = (
            db.session.query(self.media_list)
            .outerjoin(self.media, self.media.id == self.media_list.media_id)
        )

        for table, condition in outerjoin_to_add:
            base_query = base_query.outerjoin(table, condition)

        base_query = (
            base_query.filter(
                self.media_list.user_id == self.user.id,
                self.favorite_filter,
                self.genres_filter,
                self.lang_filter,
                self.common_filter,
                self.labels_filter,
                self.status_filter,
                self.comment_filter,
            )
            .group_by(self.media_list.media_id).order_by(self.sorting_filter, asc(self.media.name))
            .paginate(page=int(self.page), per_page=self.PER_PAGE, error_out=True)
        )

        self.total = base_query.total
        self.pages = base_query.pages
        self.results = [media.to_dict() for media in base_query.items]

    def return_results(self) -> Tuple[Dict, Dict, List, Dict]:
        if self.search:
            self._search_query()
        else:
            self._items_query()

        media_data = dict(
            media_list=self.results,
            total_media=self.total_media,
            common_ids=self.common_ids,
        )

        current_filters = self._create_current_filters()

        filters = dict(
            page=self.page,
            lang=self.lang,
            sort=self.sorting,
            search=self.search,
            status=self.status,
            genres=self.genres,
            labels=self.labels,
            comment=self.comment,
            common=self.common,
            favorite=self.favorite,
        )

        pagination = dict(
            all_labels=self.all_labels,
            all_status=self.all_status,
            all_genres=self.all_genres,
            all_sorting=list(self.all_sorting.keys()),
            page=self.page,
            pages=self.pages,
            total=self.total,
        )

        return media_data, filters, current_filters, pagination
