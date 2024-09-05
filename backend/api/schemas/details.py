from marshmallow import post_load
from backend.api import ma
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.schemas.core import EnumField
from backend.api.utils.enums import ModelTypes, MediaType


class MediaEditSchema(ma.Schema):
    media_id = ma.Integer(required=True)
    payload = ma.Dict(load_default={})
    media_type = EnumField(MediaType, required=True)

    @post_load
    def add_models(self, data, **kwargs):
        data["models"] = ModelsManager.get_lists_models(data["media_type"], [ModelTypes.MEDIA, ModelTypes.GENRE])
        return data


class RefreshMediaSchema(ma.Schema):
    media_id = ma.Integer(required=True)
    media_type = EnumField(MediaType, required=True)

    @post_load
    def add_models(self, data, **kwargs):
        data["models"] = ModelsManager.get_unique_model(data["media_type"], ModelTypes.MEDIA)
        return data


class LockMediaSchema(ma.Schema):
    media_id = ma.Integer(required=True)
    media_type = EnumField(MediaType, required=True)

    @post_load
    def add_models(self, data, **kwargs):
        data["models"] = ModelsManager.get_unique_model(data["media_type"], ModelTypes.MEDIA)
        return data
