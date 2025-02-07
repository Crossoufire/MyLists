from enum import EnumMeta
from typing import List, Literal, Dict, Tuple, Type

from backend.api import db
from backend.api.utils.enums import MediaType, ModelTypes


class ModelsManager:
    """ Fetch specific models using MediaType and ModelTypes as discriminator """

    ListMeTs = List[MediaType] | MediaType
    ListMoTs = List[ModelTypes] | ModelTypes
    TypeMediaType = List[MediaType] | Literal["all"] | MediaType
    TypeModelType = List[ModelTypes] | Literal["all"] | ModelTypes
    ReturnModelGroup = Dict[ModelTypes, db.Model] | Dict[MediaType, db.Model] | Dict[MediaType, Dict[ModelTypes, db.Model]]

    _model_cache: Dict[Tuple[MediaType, ModelTypes], Type[db.Model]] = {}
    _media_type_cache: Dict[MediaType, List[Type[db.Model]]] = {}
    _model_type_cache: Dict[ModelTypes, List[Type[db.Model]]] = {}

    @staticmethod
    def _get_registry():
        try:
            # SQLAlchemy > 1.3
            return list(db.Model._sa_registry._class_registry.values())
        except AttributeError:
            try:
                # SQLAlchemy <= 1.3
                return list(db.Model._decl_class_registry.values())
            except AttributeError:
                raise AttributeError(
                    "Neither '_sa_registry._class_registry' nor '_decl_class_registry' exists. "
                    "Please check your SQLAlchemy version."
                )

    @classmethod
    def _initialize_caches(cls):
        if cls._model_cache:
            return

        for model in cls._get_registry():
            try:
                if issubclass(model, db.Model) and hasattr(model, "GROUP") and hasattr(model, "TYPE"):
                    cls._model_cache[(model.GROUP, model.TYPE)] = model

                    if model.GROUP not in cls._media_type_cache:
                        cls._media_type_cache[model.GROUP] = []
                    cls._media_type_cache[model.GROUP].append(model)

                    if model.TYPE not in cls._model_type_cache:
                        cls._model_type_cache[model.TYPE] = []
                    cls._model_type_cache[model.TYPE].append(model)
            except (AttributeError, TypeError):
                pass

    @classmethod
    def get_unique_model(cls, media_type: MediaType | str, model_type: ModelTypes) -> Type[db.Model]:
        cls._initialize_caches()
        return cls._model_cache.get((media_type, model_type))

    @classmethod
    def get_lists_models(cls, media_types: ListMeTs, model_types: ListMoTs) -> List[Type[db.Model]]:
        cls._initialize_caches()

        if (isinstance(media_types, EnumMeta) or isinstance(media_types, MediaType)) and isinstance(model_types, ModelTypes):
            raise Exception("At least one argument needs to be a list")

        if isinstance(media_types, list) and isinstance(model_types, list):
            raise Exception("Both arguments can't be lists")

        if isinstance(media_types, MediaType):
            models = [model for model in cls._media_type_cache[media_types] if model.TYPE in model_types]
            return sorted(models, key=lambda x: model_types.index(x.TYPE) if x.TYPE in model_types else float("inf"))

        models = [model for model in cls._model_type_cache[model_types] if model.GROUP in media_types]
        return sorted(models, key=lambda x: media_types.index(x.GROUP) if x.GROUP in media_types else float("inf"))

    @classmethod
    def get_dict_models(cls, media_type: TypeMediaType, types: TypeModelType) -> ReturnModelGroup:
        cls._initialize_caches()

        models_dict = {}
        if media_type == "all" and isinstance(types, ModelTypes):
            return {model.GROUP: model for model in cls._model_type_cache[types]}
        elif media_type == "all" and isinstance(types, list):
            for type_ in types:
                for model in cls._model_type_cache[type_]:
                    if model.GROUP not in models_dict:
                        models_dict[model.GROUP] = {}
                    models_dict[model.GROUP][model.TYPE] = model
            return models_dict
        elif isinstance(media_type, MediaType) and types == "all":
            return {model.TYPE: model for model in cls._media_type_cache[media_type]}
        elif isinstance(media_type, list) and isinstance(types, list):
            for mt in media_type:
                for model in cls._media_type_cache[mt]:
                    if model.TYPE in types:
                        if model.GROUP not in models_dict:
                            models_dict[model.GROUP] = {}
                        models_dict[model.GROUP][model.TYPE] = model
            return models_dict

        raise Exception(f"Unknown type or model type")
