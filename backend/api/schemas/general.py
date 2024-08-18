from backend.api import ma
from backend.api.schemas.core import MyEnum
from backend.api.schemas.user import UserSchema
from backend.api.utils.enums import MediaType


class TMDBItemSchema(ma.Schema):
    api_id = ma.Integer()
    overview = ma.String()
    image_cover = ma.String()
    poster_path = ma.String()
    display_name = ma.String()
    release_date = ma.String()
    media_type = MyEnum(MediaType)


class TMDBTrendsSchema(ma.Schema):
    tv_trends = ma.List(ma.Nested(TMDBItemSchema))
    movies_trends = ma.List(ma.Nested(TMDBItemSchema))


class HallOfFameSchema(ma.Schema):
    user = ma.Nested(UserSchema)
    rank = ma.Integer()


class GlobalStatsSchema(ma.Schema):
    data = ma.Dict(keys=ma.String(), values=ma.String())
