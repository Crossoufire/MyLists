from typing import Tuple, Dict, List, Any
from flask import abort, request
from flask_sqlalchemy.query import Query
from sqlalchemy import ColumnElement, func
from backend.api import db
from backend.api.core import current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.user import User
from backend.api.utils.enums import Status, MediaType, ModelTypes
from backend.api.utils.functions import get


class ListQueryManager:
    PER_PAGE: int = 25
    ALL_VALUE: str = "All"

    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type

        self._initialize_media_models()

        self.search = request.args.get("search")
        self.page = int(request.args.get("page", 1))

        self.lang = get(request.args, "lang", default=self.ALL_VALUE).split(",")
        self.status = get(request.args, "status", default=self.ALL_VALUE).split(",")
        self.genres = get(request.args, "genres", default=self.ALL_VALUE).split(",")
        self.labels = get(request.args, "labels", default=self.ALL_VALUE).split(",")
        self.actors = get(request.args, "actors", default=self.ALL_VALUE).split(",")
        self.authors = get(request.args, "authors", default=self.ALL_VALUE).split(",")
        self.directors = get(request.args, "directors", default=self.ALL_VALUE).split(",")
        self.platforms = get(request.args, "platforms", default=self.ALL_VALUE).split(",")
        self.companies = get(request.args, "companies", default=self.ALL_VALUE).split(",")

        self.sorting = get(request.args, "sort", default=self.media_list.DEFAULT_SORTING)
        self.favorite = request.args.get("favorite", "false").lower() == "true"
        self.common = request.args.get("common", "true").lower() == "true"
        self.comment = request.args.get("comment", "false").lower() == "true"

        self.results = []
        self.pages = 0
        self.total = 0

        self.common_ids = []
        if current_user and (current_user.id != self.user.id):
            self.common_ids = self._calculate_common_ids()

        self.all_status = Status.by(self.media_type)
        self.all_sorting = self.media_list.get_available_sorting(self.user.add_feeling)

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")

        # Always exists
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]

        # Media type dependent
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    def _create_filter(self, attr: str, model_attr: Any) -> ColumnElement | bool:
        if self.ALL_VALUE in getattr(self, attr):
            setattr(self, attr, [])
            return True
        return model_attr.in_(getattr(self, attr))

    @property
    def search_filter(self) -> ColumnElement | bool:
        return self.media.name.ilike(f"%{self.search}%") if self.search else True

    @property
    def sorting_filter(self) -> ColumnElement:
        return self.all_sorting[self.sorting]

    @property
    def status_filter(self) -> ColumnElement | bool:
        statuses = [Status(status) for status in self.status]
        if Status.ALL in statuses or not statuses:
            self.status = []
            return True
        return self.media_list.status.in_(statuses)

    @property
    def lang_filter(self) -> ColumnElement | bool:
        if self.media_type != MediaType.MOVIES:
            self.lang = []
            return True
        return self._create_filter("lang", self.media.original_language)

    @property
    def common_filter(self) -> ColumnElement | bool:
        return self.media_list.media_id.notin_(self.common_ids) if not self.common else True

    @property
    def genres_filter(self) -> ColumnElement | bool:
        return self._create_filter("genres", self.media_genre.name)

    @property
    def labels_filter(self) -> ColumnElement | bool:
        return self._create_filter("labels", self.media_label.name)

    @property
    def favorite_filter(self) -> ColumnElement | bool:
        return self.media_list.favorite.is_(True) if self.favorite else True

    @property
    def comment_filter(self) -> ColumnElement | bool:
        return self.media_list.comment.is_not(None) if self.comment else True

    @property
    def directors_filter(self) -> ColumnElement | bool:
        if self.media_type != MediaType.MOVIES:
            return True
        return self._create_filter("directors", self.media.director_name)

    @property
    def actors_filter(self) -> ColumnElement | bool:
        return True if not self.media_actors else self._create_filter("actors", self.media_actors.name)

    @property
    def authors_filter(self) -> ColumnElement | bool:
        return True if not self.media_authors else self._create_filter("authors", self.media_authors.name)

    @property
    def companies_filter(self) -> ColumnElement | bool:
        return True if not self.media_companies else self._create_filter("companies", self.media_companies.name)

    @property
    def platforms_filter(self) -> ColumnElement | bool:
        return True if not self.media_platform else self._create_filter("platforms", self.media_platform.name)

    def _calculate_common_ids(self) -> List[int]:
        subq = (
            self.media_list.query.with_entities(self.media_list.media_id)
            .filter_by(user_id=current_user.id).subquery()
        )
        common_ids_query = (
            db.session.query(self.media_list.media_id)
            .filter(self.media_list.user_id == self.user.id, self.media_list.media_id.in_(subq))
            .all()
        )
        return [media_id[0] for media_id in common_ids_query]

    def _apply_joins(self, query) -> Query:
        joins = [
            (self.media_genre, "genres"),
            (self.media_label, "labels"),
            (self.media_actors, "actors"),
            (self.media_authors, "authors"),
            (self.media_platform, "platforms"),
            (self.media_companies, "companies"),
        ]

        for model, value in joins:
            if model and getattr(self, value)[0] != self.ALL_VALUE:
                query = query.join(model, model.media_id == self.media.id)

        return query

    def _apply_filters(self, query) -> Query:
        return query.filter(
            self.media_list.user_id == self.user.id,
            self.lang_filter,
            self.favorite_filter,
            self.common_filter,
            self.status_filter,
            self.comment_filter,
            self.genres_filter,
            self.labels_filter,
            self.actors_filter,
            self.authors_filter,
            self.directors_filter,
            self.platforms_filter,
            self.companies_filter,
            self.search_filter,
            )

    def _execute_query(self):
        base_query = db.session.query(self.media_list).join(self.media)
        query = self._apply_joins(base_query)
        query = self._apply_filters(query)
        query = query.order_by(self.sorting_filter, self.media.name)
        paginated_query = query.paginate(page=int(self.page), per_page=self.PER_PAGE, error_out=True)

        self.total = paginated_query.total
        self.pages = paginated_query.pages

        for result in paginated_query.items:
            media_assoc = result.to_dict()
            media_assoc["common"] = result.media_id in self.common_ids
            self.results.append(media_assoc)

    def return_results(self) -> Tuple[List[Dict], Dict]:
        try:
            self._execute_query()
        except:
            abort(400, "Invalid query")

        pagination = dict(
            all_status=self.all_status,
            all_sorting=list(self.all_sorting.keys()),
            sorting=self.sorting,
            page=self.page,
            pages=self.pages,
            total=self.total,
        )

        return self.results, pagination


class ListFiltersManager:
    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")

        # Always exists
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]

        # Media type dependent
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    def _genres_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_genre.name).join(self.media.genres)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_genre.name)
            .all()
        )
        return [genre[0] for genre in query]

    def _labels_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_label.name.distinct())
            .filter(self.media_label.user_id == self.user.id)
            .all()
        )
        return [label[0] for label in query]

    def _actors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_actors.name).join(self.media.actors)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_actors.name)
            .all()
        )
        return [actor[0] for actor in query]

    def _authors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_authors.name).join(self.media, self.media_authors.media_id)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_authors.name).order_by(func.count(self.media_authors.name).desc())
            .limit(10).all()
        )

        return [author[0] for author in query]

    def _companies_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_companies.name).join(self.media, self.media_companies.media_id)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_companies.name).order_by(func.count(self.media_companies.name).desc())
            .limit(10).all()
        )

        return [company[0] for company in query]

    def _platforms_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_platform.name).join(self.media, self.media_platform.media_id)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_platform.name).order_by(func.count(self.media_platform.name).desc())
            .limit(10).all()
        )

        return [platform[0] for platform in query]

    def return_filters(self):
        filters = dict(
            genres=self._genres_filters(),
            labels=self._labels_filters(),
            # actors=self._actors_filters() if self.media_actors() else [],
            # authors=self._authors_filters() if self.media_authors() else [],
            # companies=self._companies_filters() if self.media_companies() else [],
            # platforms=self._platforms_filters() if self.media_platform() else [],
        )
        return filters
