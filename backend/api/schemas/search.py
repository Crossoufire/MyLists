from marshmallow import validate
from backend.api import ma
from backend.api.schemas.core import MyEnum
from backend.api.utils.enums import MediaType


class SearchSchema(ma.Schema):
    class Meta:
        ordered = True

    q = ma.String(required=True)
    page = ma.Integer(load_only=True, load_default=1)


class ItemSchema(ma.Schema):
    class Meta:
        ordered = True

    name = ma.String()
    image_cover = ma.String()
    media_type = MyEnum(MediaType)
    date = ma.String()
    api_id = ma.String()


class ResultsSearchSchema(SearchSchema):
    class Meta:
        ordered = True

    items = ma.List(ma.Nested(ItemSchema))
    total = ma.Integer()
    pages = ma.Integer()


class UserItemSchema(ItemSchema):
    class Meta:
        exclude = ("api_id",)

    media_type = ma.String(validate=validate.Equal("User"))


class ResultsUserSearchSchema(ResultsSearchSchema):
    class Meta:
        ordered = True

    items = ma.List(ma.Nested(UserItemSchema))
