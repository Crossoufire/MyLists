from __future__ import annotations
import json
from marshmallow import validate
from backend.api import ma
from backend.api.utils.enums import MediaType, Status


paginated_schema_cache = {}


class MyEnum(ma.Enum):
    # def _deserialize(self, value, attr, data, **kwargs):
    #     return self.enum(value)

    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, self.enum):
            return value.value
        return super()._serialize(value, attr, obj, **kwargs)


class JSON(ma.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if value:
            try:
                return json.loads(value)
            except ValueError:
                return None
        return None


class EmptySchema(ma.Schema):
    pass


class PaginationSchema(ma.Schema):
    page = ma.Integer(load_default=1)
    per_page = ma.Integer(load_default=25)
    total = ma.Integer(dump_only=True)
    pages = ma.Integer(dump_only=True)


class SearchPaginationSchema(PaginationSchema):
    search = ma.String(load_only=True)


class HoFPaginationSchema(SearchPaginationSchema):
    sorting = ma.String(
        load_only=True,
        load_default="profile",
        validate=validate.OneOf(["profile"] + [media_type.value for media_type in MediaType])
    )


def PCollection(schema: ma.Schema, p_schema=PaginationSchema):
    if schema in paginated_schema_cache:
        return paginated_schema_cache[schema]

    class PaginatedSchema(ma.Schema):
        pagination = ma.Nested(p_schema)
        data = ma.List(ma.Nested(schema))

    PaginatedSchema.__name__ = f"Paginated{schema.__class__.__name__}"
    paginated_schema_cache[schema] = PaginatedSchema

    return PaginatedSchema


def create_list_schema(media_list_model, with_cover: bool = False):
    if with_cover:
        class ListDetailsSchema(ma.SQLAlchemyAutoSchema):
            class Meta:
                model = media_list_model

            media_name = ma.String(attribute="media.name")
            media_cover = ma.String(attribute="media.media_cover")
            status = MyEnum(Status)
            all_status = ma.List(MyEnum(Status))
    else:
        class ListDetailsSchema(ma.SQLAlchemyAutoSchema):
            class Meta:
                model = media_list_model

            all_status = ma.List(MyEnum(Status))
            status = MyEnum(Status)

    return ListDetailsSchema
