from dataclasses import dataclass
from collections import defaultdict
from typing import Dict, List, Optional, Tuple, Any

from sqlalchemy import ColumnElement, select

from backend.api import db
from backend.api.models.user import User
from backend.api.core import current_user
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import Status, MediaType, ModelTypes, GamesPlatformsEnum


@dataclass
class QueryConfig:
    PER_PAGE: int = 25
    ALL_VALUE: str = "All"


@dataclass
class MediaModels:
    media: db.Model
    media_list: db.Model
    media_genre: db.Model
    media_label: db.Model
    media_actors: Optional[db.Model] = None
    media_network: Optional[db.Model] = None
    media_authors: Optional[db.Model] = None
    media_companies: Optional[db.Model] = None


class FilterBuilder:
    def __init__(self, models: MediaModels, args: Dict[str, Any]):
        self.args = args
        self.models = models
        self.media_type = self.models.media_list.GROUP
        self.langs_attrs = {
            MediaType.SERIES: "origin_country",
            MediaType.ANIME: "origin_country",
            MediaType.MOVIES: "original_language",
            MediaType.BOOKS: "language",
        }
        self.creators_attrs = {
            MediaType.SERIES: "created_by",
            MediaType.ANIME: "created_by",
        }
        self.directors_attrs = {
            MediaType.MOVIES: "director_name",
        }
        self.publishers_filter = {
            MediaType.MANGA: "publishers",
        }
        self.platforms_filter = {
            MediaType.GAMES: "platform",
        }

    def build_base_filter(self, attr: str, model_attr: Any) -> ColumnElement | bool:
        """ Base method for building simple filters """
        if QueryConfig.ALL_VALUE in self.args[attr]:
            self.args[attr] = []
            return True
        return model_attr.in_(self.args[attr])

    def get_search_filter(self) -> ColumnElement | bool:
        return self.models.media.name.ilike(f"%{self.args['search']}%") if self.args["search"] else True

    def get_status_filter(self) -> ColumnElement | bool:
        statuses = [Status(status) for status in self.args["status"]]
        if not statuses or Status.ALL in statuses:
            self.args["status"] = []
            return True
        return self.models.media_list.status.in_(statuses)

    def get_language_filter(self) -> ColumnElement | bool:
        if self.media_type not in self.langs_attrs.keys():
            self.args["langs"] = []
            return True
        return self.build_base_filter("langs", getattr(self.models.media, self.langs_attrs[self.media_type]))

    def get_common_filter(self, common_ids: List[int]) -> ColumnElement | bool:
        return self.models.media_list.media_id.notin_(common_ids) if self.args["hide_common"] else True

    def get_genres_filter(self) -> ColumnElement | bool:
        return self.build_base_filter("genres", self.models.media_genre.name)

    def get_labels_filter(self) -> ColumnElement | bool:
        return self.build_base_filter("labels", self.models.media_label.name)

    def get_favorite_filter(self) -> ColumnElement | bool:
        return self.models.media_list.favorite.is_(True) if self.args["favorite"] else True

    def get_comment_filter(self) -> ColumnElement | bool:
        return self.models.media_list.comment.is_not(None) if self.args["comment"] else True

    def get_creators_filter(self) -> ColumnElement | bool:
        if self.media_type not in self.creators_attrs.keys():
            return True
        if self.args["creators"] and QueryConfig.ALL_VALUE in self.args["creators"]:
            return True
        return getattr(self.models.media, self.creators_attrs[self.media_type]).ilike(f"%{' '.join(self.args['creators'])}%")

    def get_directors_filter(self) -> ColumnElement | bool:
        if self.media_type not in self.directors_attrs.keys():
            self.args["directors"] = []
            return True
        return self.build_base_filter("directors", getattr(self.models.media, self.directors_attrs[self.media_type]))

    def get_publishers_filter(self) -> ColumnElement | bool:
        if self.media_type not in self.publishers_filter.keys():
            self.args["publishers"] = []
            return True
        return self.build_base_filter("publishers", getattr(self.models.media, self.publishers_filter[self.media_type]))

    def get_actors_filters(self) -> ColumnElement | bool:
        return True if not self.models.media_actors else self.build_base_filter("actors", self.models.media_actors.name)

    def get_authors_filters(self) -> ColumnElement | bool:
        return True if not self.models.media_authors else self.build_base_filter("authors", self.models.media_authors.name)

    def get_companies_filters(self) -> ColumnElement | bool:
        return True if not self.models.media_companies else self.build_base_filter("companies", self.models.media_companies.name)

    def get_networks_filter(self) -> ColumnElement | bool:
        return True if not self.models.media_network else self.build_base_filter("networks", self.models.media_network.name)

    def get_platforms_filter(self) -> ColumnElement | bool:
        if self.media_type not in self.platforms_filter or self.args["platforms"][0] == QueryConfig.ALL_VALUE:
            return True
        platforms = [GamesPlatformsEnum(p) for p in self.args["platforms"]]
        return getattr(self.models.media_list, self.platforms_filter[self.media_type]).in_(platforms)

    def return_all_filters(self, common_ids: List[int]) -> List[ColumnElement | bool]:
        """ Return all filters for the query """

        return [
            self.get_search_filter(),
            self.get_status_filter(),
            self.get_language_filter(),
            self.get_common_filter(common_ids),
            self.get_genres_filter(),
            self.get_labels_filter(),
            self.get_favorite_filter(),
            self.get_comment_filter(),
            self.get_creators_filter(),
            self.get_directors_filter(),
            self.get_publishers_filter(),
            self.get_actors_filters(),
            self.get_authors_filters(),
            self.get_companies_filters(),
            self.get_networks_filter(),
            self.get_platforms_filter(),
        ]


class MediaListQuery:
    def __init__(self, user: User, media_type: MediaType, args: Dict):
        self.user = user
        self.media_type = media_type

        self.models = self._initialize_models()
        self.args = self._normalize_args(args)
        self.common_ids = self._get_common_ids()
        self.fb = FilterBuilder(self.models, self.args)
        self.all_sorting = self.models.media_list.get_available_sorting()

    def _normalize_args(self, args: Dict) -> Dict:
        """ Normalize and validate input arguments """

        normalized = args.copy()
        if not normalized.get("sorting"):
            normalized["sorting"] = self.models.media_list.DEFAULT_SORTING
        return normalized

    def _initialize_models(self) -> MediaModels:
        """ Initialize all required media models """

        models = ModelsManager.get_dict_models(self.media_type, "all")
        return MediaModels(
            media=models[ModelTypes.MEDIA],
            media_list=models[ModelTypes.LIST],
            media_genre=models[ModelTypes.GENRE],
            media_label=models[ModelTypes.LABELS],
            media_actors=models.get(ModelTypes.ACTORS),
            media_network=models.get(ModelTypes.NETWORK),
            media_authors=models.get(ModelTypes.AUTHORS),
            media_companies=models.get(ModelTypes.COMPANIES)
        )

    def _get_common_ids(self) -> List[int]:
        """ Get common media IDs between current user and target user """

        if not current_user or current_user.id == self.user.id:
            return []

        subq = (
            self.models.media_list.query.with_entities(self.models.media_list.media_id)
            .filter_by(user_id=current_user.id)
            .scalar_subquery()
        )

        common_ids = (
            self.models.media_list.query.with_entities(self.models.media_list.media_id)
            .filter(self.models.media_list.user_id == self.user.id, self.models.media_list.media_id.in_(subq))
            .all()
        )

        return [media_id[0] for media_id in common_ids]

    def _get_labels_for_media(self, media_ids: List[int]) -> Dict[int, List]:
        """ Get labels for given media IDs """

        if not current_user:
            return {}

        labels = (
            self.models.media_label.query
            .filter(self.models.media_label.media_id.in_(media_ids), self.models.media_label.user_id == current_user.id)
            .all()
        )

        grouped = defaultdict(list)
        for label in labels:
            grouped[label.media_id].append(label)

        return grouped

    def _process_items(self, items: List[db.Model]) -> List[Dict]:
        """ Process query results items and add additional data """

        results = []
        media_ids = [item.media_id for item in items]
        labels = self._get_labels_for_media(media_ids)

        for item in items:
            media_dict = item.to_dict()
            media_dict["labels"] = [label.name for label in labels.get(item.media_id, [])]
            media_dict["common"] = item.media_id in self.common_ids
            results.append(media_dict)

        return results

    def _apply_joins(self, query: select) -> select:
        """ Apply necessary joins based on filter conditions """

        join_models = [
            (self.models.media_genre, "genres"),
            (self.models.media_label, "labels"),
            (self.models.media_actors, "actors"),
            (self.models.media_authors, "authors"),
            (self.models.media_network, "networks"),
            (self.models.media_companies, "companies")
        ]

        for model, arg_name in join_models:
            if model and self.args[arg_name][0] != QueryConfig.ALL_VALUE:
                query = query.join(model, model.media_id == self.models.media.id)

        return query

    def _apply_filters(self, query: select) -> select:
        """ Apply all filters to the query """
        filters = self.fb.return_all_filters(self.common_ids)
        return query.filter(self.models.media_list.user_id == self.user.id, *filters)

    def _build_query(self) -> select:
        """ Build the main query with all joins and filters """

        query = db.session.query(self.models.media_list).join(self.models.media)
        query = self._apply_joins(query)
        query = self._apply_filters(query)
        query = query.order_by(self.all_sorting[self.args["sorting"]], self.models.media.name)

        return query

    def execute(self) -> Tuple[List[Dict], Dict]:
        """ Execute the query and return results with pagination """

        query = self._build_query()
        paginated = query.paginate(page=self.args["page"], per_page=QueryConfig.PER_PAGE, error_out=True)
        results = self._process_items(paginated.items)

        pagination = dict(
            all_status=Status.by(self.media_type),
            all_sorting=list(self.all_sorting.keys()),
            sorting=self.args["sorting"],
            page=self.args["page"],
            pages=paginated.pages,
            total=paginated.total,
        )

        return results, pagination
