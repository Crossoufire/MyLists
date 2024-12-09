from marshmallow import post_load, validates, ValidationError

from backend.api import ma
from backend.api.schemas.core import EnumField
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.utils.enums import MediaType, ModelTypes, Status, GamesPlatformsEnum


class BaseMediaSchema(ma.Schema):
    media_id = ma.Integer(required=True)
    media_type = EnumField(MediaType, required=True)
    payload = ma.Raw(required=False)

    # noinspection PyUnusedLocal
    @post_load
    def add_models(self, data, **kwargs):
        model_types = self.get_model_types()
        if isinstance(model_types, list):
            data["models"] = ModelsManager.get_lists_models(data["media_type"], model_types)
        else:
            data["models"] = ModelsManager.get_unique_model(data["media_type"], model_types)
        return data

    def get_model_types(self):
        raise NotImplementedError("Subclasses must implement this method")


class AddMediaSchema(BaseMediaSchema):
    payload = EnumField(Status, load_default=None)

    def get_model_types(self):
        return [ModelTypes.MEDIA, ModelTypes.LIST, ModelTypes.LABELS]


class DeleteMediaSchema(BaseMediaSchema):
    def get_model_types(self):
        return [ModelTypes.LIST, ModelTypes.LABELS]


class UpdateFavoriteSchema(BaseMediaSchema):
    payload = ma.Boolean(required=True)

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateStatusSchema(BaseMediaSchema):
    payload = EnumField(Status, required=True)

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateRatingSchema(BaseMediaSchema):
    payload = ma.Float(load_default=None)

    @validates("payload")
    def validate_payload(self, value):
        if value is not None and (value < 0 or value > 10):
            raise ValidationError("Rating needs to be between 0 and 10")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateRedoSchema(BaseMediaSchema):
    payload = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 0 or value > 10:
            raise ValidationError("Re-read/re-watched needs to be between 0 and 10")

    @validates("media_type")
    def validate_media_type(self, value):
        if value == MediaType.GAMES:
            raise ValidationError("Games are not supported")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateCommentSchema(BaseMediaSchema):
    payload = ma.String(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if len(value) > 2000:
            raise ValidationError("Comment too large. The limit is 2000 characters.")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdatePlaytimeSchema(BaseMediaSchema):
    payload = ma.Integer(required=True)

    @validates("media_type")
    def validate_media_type(self, value):
        if value != MediaType.GAMES:
            raise ValidationError("Only Games are supported")

    @validates("payload")
    def validate_payload(self, value):
        if value < 0 or value > 600000:
            raise ValidationError("Playtime needs to be between 0 and 10000 hours.")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdatePlatformSchema(BaseMediaSchema):
    payload = EnumField(GamesPlatformsEnum, load_default=None)

    @validates("media_type")
    def validate_media_type(self, value):
        if value != MediaType.GAMES:
            raise ValidationError("Only Games are supported")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateSeasonSchema(BaseMediaSchema):
    payload = ma.Integer(required=True)

    @validates("media_type")
    def validate_media_type(self, value):
        if value not in (MediaType.ANIME, MediaType.SERIES):
            raise ValidationError("Only Anime and Series are supported")

    @validates("payload")
    def validate_payload(self, value):
        if value < 1:
            raise ValidationError("Invalid season")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdateEpisodeSchema(BaseMediaSchema):
    payload = ma.Integer(required=True)

    @validates("media_type")
    def validate_media_type(self, value):
        if value not in (MediaType.ANIME, MediaType.SERIES):
            raise ValidationError("Only Anime and Series are supported")

    @validates("payload")
    def validate_payload(self, value):
        if value < 1:
            raise ValidationError("Invalid episode")

    def get_model_types(self):
        return ModelTypes.LIST


class UpdatePageSchema(BaseMediaSchema):
    payload = ma.Integer(required=True)

    @validates("media_type")
    def validate_media_type(self, value):
        if value != MediaType.BOOKS:
            raise ValidationError("Only Books are supported")

    @validates("payload")
    def validate_payload(self, value):
        if value < 0:
            raise ValidationError("Invalid page")

    def get_model_types(self):
        return ModelTypes.LIST


class DeleteUpdatesSchema(ma.Schema):
    update_ids = ma.List(ma.Integer(), required=True)
    return_data = ma.Boolean(load_default=False)
