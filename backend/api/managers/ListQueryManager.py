from typing import Tuple, Dict, List, Any
from flask import abort
from flask_sqlalchemy.query import Query
from sqlalchemy import ColumnElement, func
from backend.api import db
from backend.api.models.users import User
from backend.api.core.handlers import current_user
from backend.api.utils.enums import Status, MediaType, ModelTypes
from backend.api.utils.functions import ModelsFetcher


class ListQueryManager:
    PER_PAGE: int = 25
    ALL_VALUE: str = "All"

    def __init__(self, user: User, media_type: MediaType, args: Dict):
        self.user = user
        self.media_type = media_type
        self.args = args

        self._initialize_media_models()

        self.results = []
        self.pages = 0
        self.total = 0

        self.common_ids = []
        if current_user and (current_user.id != self.user.id):
            self.common_ids = self._calculate_common_ids()

        self.all_sorting = self.media_list.available_sorting()

    def _initialize_media_models(self):
        media_models = ModelsFetcher.get_dict_models(self.media_type, "all")

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

    @property
    def sorting_order(self) -> ColumnElement:
        self.args["sorting"] = self.args["sorting"] or self.media_list.DEFAULT_SORTING
        try:
            return self.all_sorting[self.args["sorting"]]
        except KeyError:
            raise Exception

    @property
    def status_filter(self) -> ColumnElement | bool:
        try:
            statuses = [Status(status) for status in self.args["status"]]
            if Status.ALL in statuses or not statuses:
                self.args["status"] = []
                return True
            return self.media_list.status.in_(statuses)
        except:
            raise Exception

    @property
    def lang_filter(self) -> ColumnElement | bool:
        if not getattr(self.media, "language", None):
            return True
        return self._create_filter("lang", self.media.language)

    @property
    def common_filter(self) -> ColumnElement | bool:
        return self.media_list.media_id.notin_(self.common_ids) if not self.args["common"] else True

    @property
    def genres_filter(self) -> ColumnElement | bool:
        return self._create_filter("genres", self.media_genre.name)

    @property
    def actors_filter(self) -> ColumnElement | bool:
        if not self.media_actors:
            return True
        return self._create_filter("actors", self.media_actors.name)

    @property
    def directors_filter(self) -> ColumnElement | bool:
        if not getattr(self.media, "director", None):
            return True
        return self._create_filter("directors", self.media.director)

    @property
    def authors_filter(self) -> ColumnElement | bool:
        if not self.media_authors:
            return True
        return self._create_filter("authors", self.media_authors.name)

    @property
    def companies_filter(self) -> ColumnElement | bool:
        if not self.media_companies:
            return True
        return self._create_filter("companies", self.media_companies.name)

    @property
    def platforms_filter(self) -> ColumnElement | bool:
        if not self.media_platform:
            return True
        return self._create_filter("platforms", self.media_platform.name)

    @property
    def labels_filter(self) -> ColumnElement | bool:
        return self._create_filter("labels", self.media_label.name)

    @property
    def favorite_filter(self) -> ColumnElement | bool:
        return self.media_list.favorite.is_(True) if self.args["favorite"] else True

    @property
    def comment_filter(self) -> ColumnElement | bool:
        return self.media_list.comment.isnot(None) if self.args["comment"] else True

    @property
    def search_filter(self) -> ColumnElement | bool:
        if self.args["search"]:
            return self.media.name.ilike(f"%{self.args['search']}%")
        return True

    def _create_filter(self, attr: str, model_attr: Any) -> ColumnElement | bool:
        if self.ALL_VALUE in self.args[attr]:
            self.args[attr] = []
            return True
        return model_attr.in_(self.args[attr])

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
        if self.args["genres"][0] != self.ALL_VALUE:
            query = query.join(self.media_genre, self.media.id == self.media_genre.media_id)
        if self.args["labels"][0] != self.ALL_VALUE:
            query = query.join(self.media_label, self.media.id == self.media_label.media_id)

        # Check if media type has related model and join if needed
        if self.args["actors"][0] != self.ALL_VALUE and self.media_actors:
            query = query.join(self.media_actors, self.media.id == self.media_actors.media_id)
        if self.args["authors"][0] != self.ALL_VALUE and self.media_authors:
            query = query.join(self.media_authors, self.media.id == self.media_authors.media_id)
        if self.args["platforms"][0] != self.ALL_VALUE and self.media_platform:
            query = query.join(self.media_platform, self.media.id == self.media_platform.media_id)
        if self.args["companies"][0] != self.ALL_VALUE and self.media_companies:
            query = query.join(self.media_companies, self.media.id == self.media_companies.media_id)

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
        query = query.order_by(self.sorting_order, self.media.name)
        paginated_query = query.paginate(page=self.args["page"], per_page=self.PER_PAGE, error_out=True)

        self.total = paginated_query.total
        self.pages = paginated_query.pages
        self.results = paginated_query.items

    def return_results(self) -> Tuple[Dict, Dict]:
        try:
            self._execute_query()
        except:
            abort(400, "Invalid query")

        media_data = dict(
            results=self.results,
            common_ids=self.common_ids,
        )

        pagination = dict(
            all_status=Status.by(self.media_type),
            all_sorting=self.all_sorting.keys(),
            sorting=self.args["sorting"],
            page=self.args["page"],
            pages=self.pages,
            total=self.total,
        )

        return media_data, pagination


class ListFiltersManager:
    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsFetcher.get_dict_models(self.media_type, "all")

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
            db.session.query(self.media_genre.name).join(self.media, self.media.genres)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_genre.name).order_by(func.count(self.media_genre.name).desc())
            .limit(10).all()
        )

        return [genre[0] for genre in query]

    def _labels_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_label.name).join(self.media.labels)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_label.name).order_by(func.count(self.media_label.name).desc())
            .limit(10).all()
        )

        return [label[0] for label in query]

    def _actors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_actors.name).join(self.media, self.media_actors.media_id)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_actors.name).order_by(func.count(self.media_actors.name).desc())
            .limit(10).all()
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
            actors=self._actors_filters() if self.media_actors() else [],
            authors=self._authors_filters() if self.media_authors() else [],
            companies=self._companies_filters() if self.media_companies() else [],
            platforms=self._platforms_filters() if self.media_platform() else [],
        )
        return filters