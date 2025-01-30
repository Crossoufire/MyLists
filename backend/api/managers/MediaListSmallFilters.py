from typing import Optional, Dict, List

from sqlalchemy import ColumnElement, func

from backend.api.models import User
from backend.api import MediaType, db
from backend.api.utils.enums import ModelTypes
from backend.api.managers.ModelsManager import ModelsManager


class MediaListSmallFilters:
    """ Return 'small' filters: genres, labels, and languages/country: all in one go, instead of a search system
    with `ListFiltersManager """

    def __init__(self, user: User, media_type: MediaType):
        self.user = user
        self.media_type = media_type
        self._initialize_media_models()
        self.langs_attrs = {
            MediaType.SERIES: "origin_country",
            MediaType.ANIME: "origin_country",
            MediaType.MOVIES: "original_language",
            MediaType.BOOKS: "language",
        }

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_genre = media_models[ModelTypes.GENRE]
        self.media_label = media_models[ModelTypes.LABELS]
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)

    def _get_lang_attr(self) -> Optional[ColumnElement]:
        if self.media_type not in self.langs_attrs.keys():
            return None
        return getattr(self.media, self.langs_attrs[self.media_type])

    def return_filters(self) -> Dict[str, List[str]]:
        language_attr = self._get_lang_attr()

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
