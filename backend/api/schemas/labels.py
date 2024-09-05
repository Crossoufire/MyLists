from marshmallow import post_load
from backend.api import ma
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.schemas.core import EnumField
from backend.api.utils.enums import MediaType, ModelTypes


class BaseLabelSchema(ma.Schema):
    media_type = EnumField(MediaType, required=True)

    @post_load
    def add_models(self, data, **kwargs):
        data["models"] = self.get_models(data["media_type"])
        return data

    def get_models(self, media_type):
        raise NotImplementedError("Subclasses must implement this method")


class AddLabelToMediaSchema(BaseLabelSchema):
    media_id = ma.Integer(required=True)
    payload = ma.String(required=True)

    def get_models(self, media_type):
        return ModelsManager.get_lists_models(media_type, [ModelTypes.LIST, ModelTypes.LABELS])


class RemoveLabelFromMediaSchema(BaseLabelSchema):
    media_id = ma.Integer(required=True)
    payload = ma.String(required=True)

    def get_models(self, media_type):
        return ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)


class RenameLabelSchema(BaseLabelSchema):
    old_label_name = ma.String(required=True)
    new_label_name = ma.String(required=True)

    def get_models(self, media_type):
        return ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)


class DeleteLabelSchema(BaseLabelSchema):
    name = ma.String(required=True)

    def get_models(self, media_type):
        return ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
