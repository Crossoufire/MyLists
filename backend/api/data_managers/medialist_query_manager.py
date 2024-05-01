from typing import Tuple, Dict, List
from flask import abort, request
from sqlalchemy import asc, or_, ColumnElement
from werkzeug.exceptions import HTTPException
from backend.api import db
from backend.api.models.user_models import User
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import Status, MediaType, ModelTypes
from backend.api.utils.functions import get_models_group


class MediaListQuery:
    """ Main class that handles different query types """

    PER_PAGE: int = 36

    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()

        # Request parameters
        self.search = request.args.get("search")
        self.sorting = request.args.get("sorting", self.media_list.DEFAULT_SORTING)
        self.status = request.args.get("status", self.media_list.DEFAULT_STATUS)
        self.show_common = request.args.get("showCommon", "true", type=str)
        self.label_name = request.args.get("label_name", type=str)
        self.genre = request.args.get("genre", "All", type=str)
        self.lang = request.args.get("lang", "All", type=str)
        self.page = request.args.get("page", 1, type=int)

        self.total_media = 0
        self.common_ids = []
        if current_user.id != self.user.id:
            self.total_media = self._calculate_total_media()
            self.common_ids = self._calculate_common_ids()

        # Pre-defined attributes
        self.labels = []
        self.results = []
        self.graph_data = []
        self.media_in_label = []
        self.pages = 0
        self.total = 0
        self.title = None

        # Pagination
        self.all_status = self.media_list.Status.to_list(extra=True)
        self.all_genres = self.media_genre.get_available_genres()
        self.all_sorting = self.media_list.get_available_sorting(self.user.add_feeling)

    def _initialize_media_models(self):
        """ Initialize media models """

        media_models = get_models_group(self.media_type, "all")

        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]
        self.media_mores = media_models

    @property
    def status_filter(self) -> ColumnElement | HTTPException | bool:
        """ Get the status filter from the query """

        try:
            status = Status(self.status)
            status_filter = True
            if status not in (Status.FAVORITE, Status.SEARCH, Status.ALL):
                status_filter = (self.media_list.status == status)
            elif status == Status.FAVORITE:
                status_filter = (self.media_list.favorite == True)
        except ValueError:
            return abort(404)

        return status_filter

    @property
    def sorting_filter(self) -> ColumnElement | HTTPException:
        """ Get the sorting possibilities and sort the query """

        try:
            sort_filter = self.all_sorting[self.sorting]
        except KeyError:
            return abort(400, "This sorting is undefined")

        return sort_filter

    @property
    def lang_filter(self) -> ColumnElement | bool:
        """ Get the lang filter from the query """
        if self.media_type == MediaType.MOVIES:
            return self.media.original_language.like(self.lang) if self.lang != "All" else True
        return True

    @property
    def common_filter(self) -> ColumnElement | bool:
        """ Get the common ids between the current user and the other list """
        return self.media_list.media_id.notin_(self.common_ids) if self.show_common == "false" else True

    def _calculate_total_media(self) -> int:
        """ Calculate total number of media in the list """
        return db.session.query(self.media_list.media_id).filter(self.media_list.user_id == self.user.id).count()

    def _calculate_common_ids(self) -> List:
        """ Calculate the common ids between the current user and the other list """

        sub_query = (
            db.session.query(self.media_list.media_id)
            .filter(self.media_list.user_id == current_user.id)
            .subquery()
        )

        common_ids_query = (
            db.session.query(self.media_list.media_id)
            .filter(self.media_list.user_id == self.user.id, self.media_list.media_id.in_(sub_query))
            .all()
        )

        return [id_tuple[0] for id_tuple in common_ids_query]

    def _search_query(self):
        """ Create the search query """

        base_query = (
            db.session.query(self.media_list)
            .outerjoin(self.media, self.media.id == self.media_list.media_id)
            .outerjoin(self.media_genre, self.media_genre.media_id == self.media.id)
        )

        for table, condition in self.media_list.additional_search_joins():
            base_query = base_query.outerjoin(table, condition)

        base_query = base_query.filter(
            self.media_list.user_id == self.user.id,
            self.media_genre.genre.like(self.genre) if self.genre != "All" else True,
            or_(*self.media_list.additional_search_filters(self.search)),
            self.lang_filter,
            self.common_filter,
            )

        paginate_results = (
            base_query.group_by(self.media.id)
            .order_by(self.sorting_filter, asc(self.media.name))
            .paginate(page=int(self.page), per_page=self.PER_PAGE, error_out=True)
        )

        self.total = paginate_results.total
        self.pages = paginate_results.pages
        self.title = f"Search for: {self.search}"
        self.results = [media.to_dict() for media in paginate_results.items]

    def _items_query(self):
        """ Get the <media_list> items for a specified <user> """

        paginate_results = (
            db.session.query(self.media_list)
            .outerjoin(self.media, self.media.id == self.media_list.media_id)
            .outerjoin(self.media_genre, self.media_genre.media_id == self.media.id)
            .filter(
                self.media_list.user_id == self.user.id,
                self.media_genre.genre.like(self.genre) if self.genre != "All" else True,
                self.status_filter,
                self.lang_filter,
                self.common_filter,
                )
            .group_by(self.media.id).order_by(self.sorting_filter, asc(self.media.name))
            .paginate(page=int(self.page), per_page=self.PER_PAGE, error_out=True)
        )

        self.total = paginate_results.total
        self.pages = paginate_results.pages
        self.results = [media.to_dict() for media in paginate_results.items]

    def _items_labels(self):
        if self.label_name:
            media_data = (
                db.session.query(self.media_label)
                .filter(self.media_label.user_id == self.user.id, self.media_label.label == self.label_name)
                .order_by(self.media_label.label)
                .all()
            )

            self.media_in_label = [media.to_dict() for media in media_data]
            self.total = len(self.media_in_label)
            self.title = self.label_name
        else:
            media_data = self.media_label.query.filter(self.media_label.user_id == self.user.id).all()
            self.labels = sorted(list(set(media.label for media in media_data)))
            self.total = len(self.labels)

    def return_results(self) -> Tuple[Dict, Dict]:
        if self.status == Status.SEARCH:
            self._search_query()
        elif self.status == Status.LABELS:
            self._items_labels()
        else:
            self._items_query()

        media_data = dict(
            media_list=self.results,
            total_media=self.total_media,
            common_ids=self.common_ids,
            labels=self.labels,
            labels_media=self.media_in_label,
        )

        pagination = dict(
            search=self.search,
            sorting=self.sorting,
            status=self.status,
            genre=self.genre,
            lang=self.lang,
            page=self.page,
            pages=self.pages,
            total=self.total,
            title=self.title,
            all_status=self.all_status,
            all_genres=self.all_genres,
            all_sorting=list(self.all_sorting.keys()),
        )

        return media_data, pagination
