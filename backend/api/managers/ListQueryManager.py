from collections import defaultdict
from typing import Tuple, Dict, List, Any, Optional

from flask import abort
from sqlalchemy import ColumnElement, func, select

from backend.api import db
from backend.api.models.user import User
from backend.api.core import current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import Status, MediaType, ModelTypes, GamesPlatformsEnum


class ListQueryManager:
    PER_PAGE: int = 25
    ALL_VALUE: str = "All"

    def __init__(self, user: User, media_type: MediaType, args: Dict):
        self.user = user
        self.args = args
        self.media_type = media_type

        self._initialize_media_models()

        if self.args["sorting"] is None:
            self.args["sorting"] = self.media_list.DEFAULT_SORTING

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
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]

        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_network = media_models.get(ModelTypes.NETWORK)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    def _create_filter(self, attr: str, model_attr: Any) -> ColumnElement | bool:
        if self.ALL_VALUE in self.args[attr]:
            self.args[attr] = []
            return True
        return model_attr.in_(self.args[attr])

    @property
    def search_filter(self) -> ColumnElement | bool:
        return self.media.name.ilike(f"%{self.args['search']}%") if self.args["search"] else True

    @property
    def sorting_filter(self) -> ColumnElement:
        return self.all_sorting[self.args["sorting"]]

    @property
    def status_filter(self) -> ColumnElement | bool:
        statuses = [Status(status) for status in self.args["status"]]
        if Status.ALL in statuses or not statuses:
            self.args["status"] = []
            return True
        return self.media_list.status.in_(statuses)

    @property
    def langs_filter(self) -> ColumnElement | bool:
        if self.media_type == MediaType.MOVIES:
            attr = "original_language"
        elif self.media_type == MediaType.BOOKS:
            attr = "language"
        elif self.media_type == MediaType.SERIES or self.media_type == MediaType.ANIME:
            attr = "origin_country"
        else:
            self.args["langs"] = []
            return True
        return self._create_filter("langs", getattr(self.media, attr))

    @property
    def common_filter(self) -> ColumnElement | bool:
        return self.media_list.media_id.notin_(self.common_ids) if self.args["hide_common"] else True

    @property
    def genres_filter(self) -> ColumnElement | bool:
        return self._create_filter("genres", self.media_genre.name)

    @property
    def labels_filter(self) -> ColumnElement | bool:
        return self._create_filter("labels", self.media_label.name)

    @property
    def favorite_filter(self) -> ColumnElement | bool:
        return self.media_list.favorite.is_(True) if self.args["favorite"] else True

    @property
    def comment_filter(self) -> ColumnElement | bool:
        return self.media_list.comment.is_not(None) if self.args["comment"] else True

    @property
    def creators_filter(self) -> ColumnElement | bool:
        if self.media_type not in (MediaType.SERIES, MediaType.ANIME):
            return True
        if self.ALL_VALUE in self.args["creators"]:
            return True
        return self.media.created_by.ilike(f"%{' '.join(self.args['creators'])}%")

    @property
    def directors_filter(self) -> ColumnElement | bool:
        if self.media_type != MediaType.MOVIES:
            self.args["directors"] = []
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
    def networks_filter(self) -> ColumnElement | bool:
        return True if not self.media_network else self._create_filter("networks", self.media_network.name)

    @property
    def platforms_filter(self) -> ColumnElement | bool:
        if self.media_type != MediaType.GAMES or self.args["platforms"][0] == self.ALL_VALUE:
            return True
        platforms = [GamesPlatformsEnum(plat) for plat in self.args["platforms"]]
        if not platforms:
            return True
        return self.media_list.platform.in_(platforms)

    def _calculate_common_ids(self) -> List[int]:
        subq = (
            self.media_list.query.with_entities(self.media_list.media_id)
            .filter_by(user_id=current_user.id).scalar_subquery()
        )
        common_ids_query = (
            self.media_list.query.with_entities(self.media_list.media_id)
            .filter(self.media_list.user_id == self.user.id, self.media_list.media_id.in_(subq))
            .all()
        )
        return [media_id[0] for media_id in common_ids_query]

    def _apply_joins(self, query) -> select:
        joins = [
            (self.media_genre, "genres"),
            (self.media_label, "labels"),
            (self.media_actors, "actors"),
            (self.media_authors, "authors"),
            (self.media_network, "networks"),
            (self.media_companies, "companies"),
        ]

        for model, value in joins:
            if model and self.args[value][0] != self.ALL_VALUE:
                query = query.join(model, model.media_id == self.media.id)

        return query

    def _apply_filters(self, query) -> select:
        return query.filter(
            self.media_list.user_id == self.user.id,
            self.langs_filter,
            self.favorite_filter,
            self.common_filter,
            self.status_filter,
            self.comment_filter,
            self.genres_filter,
            self.labels_filter,
            self.actors_filter,
            self.authors_filter,
            self.creators_filter,
            self.directors_filter,
            self.platforms_filter,
            self.networks_filter,
            self.companies_filter,
            self.search_filter,
        )

    def _execute_query(self):
        base_query = db.session.query(self.media_list).join(self.media)
        query = self._apply_joins(base_query)
        query = self._apply_filters(query)
        query = query.order_by(self.sorting_filter, self.media.name)
        paginated_query = query.paginate(page=int(self.args["page"]), per_page=self.PER_PAGE, error_out=True)

        self.total = paginated_query.total
        self.pages = paginated_query.pages

        results_ids = [result.media_id for result in paginated_query.items]

        grouped_labels = {}
        if current_user:
            all_labels = (
                self.media_label.query
                .filter(self.media_label.media_id.in_(results_ids), self.media_label.user_id == current_user.id)
                .all()
            )

            grouped_labels = defaultdict(list)
            for media_label in all_labels:
                grouped_labels[media_label.media_id].append(media_label)

        for result in paginated_query.items:
            media_assoc = result.to_dict()
            media_assoc["labels"] = [label.name for label in grouped_labels.get(result.media_id, [])]
            media_assoc["common"] = result.media_id in self.common_ids
            self.results.append(media_assoc)

    def return_results(self) -> Tuple[List[Dict], Dict]:
        self._execute_query()

        pagination = dict(
            all_status=self.all_status,
            all_sorting=list(self.all_sorting.keys()),
            sorting=self.args["sorting"],
            page=self.args["page"],
            pages=self.pages,
            total=self.total,
        )

        return self.results, pagination


class SmallListFiltersManager:
    """ Return small filters: genres, labels, and languages/country: all in one go """

    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)

    def _get_language_attribute(self) -> Optional[ColumnElement]:
        if self.media_type == MediaType.MOVIES:
            return self.media.original_language
        elif self.media_type == MediaType.BOOKS:
            return self.media.language
        elif self.media_type == MediaType.SERIES or self.media_type == MediaType.ANIME:
            return self.media.origin_country
        return None

    def return_filters(self) -> Dict[str, List[str]]:
        language_attr = self._get_language_attribute()

        attrs = [func.group_concat(func.distinct(self.media_genre.name)).label("genres")]
        if language_attr:
            attrs.append(func.group_concat(func.distinct(language_attr)).label("langs"))

        results = (
            db.session.query(*attrs).select_from(self.media_list).join(self.media)
            .outerjoin(self.media.genres).filter(self.media_list.user_id == self.user.id)
            .first()
        )

        labels_results = (
            self.media_label.query.with_entities(self.media_label.name.distinct())
            .filter(self.media_label.user_id == self.user.id)
            .all()
        )

        platforms_results = []
        if self.media_type == MediaType.GAMES:
            platforms_results = (
                self.media_list.query.with_entities(self.media_list.platform.distinct())
                .filter(self.media_list.user_id == self.user.id, self.media_list.platform.is_not(None))
                .all()
            )
            platforms_results = [plat[0].value for plat in platforms_results] if platforms_results else []

        langs = results.langs.split(",") if getattr(results, "langs", None) else []

        data = dict(
            labels=[label[0] for label in labels_results] or [],
            genres=results.genres.split(",") if results.genres else [],
            langs=list(set([x.strip() for x in langs])),
            platforms=platforms_results,
        )

        return data


class ListFiltersManager:
    """ Return one search filter from: actors, authors, director, creator, companies, platforms, networks """

    def __init__(self, user: User, media_type: MediaType, args: Dict):
        self.user = user
        self.args = args
        self.media_type = media_type
        self._initialize_media_models()

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)
        self.media_network = media_models.get(ModelTypes.NETWORK)

    def _actors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_actors.name).join(self.media.actors)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_actors.name).filter(self.media_actors.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [actor[0] for actor in query]

    def _authors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_authors.name).join(self.media.authors)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_authors.name).filter(self.media_authors.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [author[0] for author in query]

    def _directors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media.director_name).join(self.media_list)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media.director_name).filter(self.media.director_name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [director[0] for director in query]

    def _companies_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_companies.name).join(self.media.companies)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_companies.name).filter(self.media_companies.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [company[0] for company in query]

    def _creators_filters(self) -> List[str]:
        query = (
            db.session.query(self.media.created_by).join(self.media_list)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media.created_by).filter(self.media.created_by.ilike(f"%{self.args['q']}%"))
            .all()
        )

        creators = []
        for (creator_string,) in query:
            creators.extend(creator.strip() for creator in creator_string.split(",") if creator.strip())

        return creators

    def _networks_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_network.name).join(self.media.networks)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_network.name).filter(self.media_network.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [network[0] for network in query]

    def return_filters(self) -> List[str]:
        filters_job_map = {
            "actors": self._actors_filters,
            "authors": self._authors_filters,
            "companies": self._companies_filters,
            "creators": self._creators_filters,
            "networks": self._networks_filters,
            "directors": self._directors_filters,
        }

        try:
            return filters_job_map[self.args["job"]]()
        except:
            return abort(400, description="Filter not recognized")
