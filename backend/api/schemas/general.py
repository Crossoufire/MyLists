from backend.api import ma
from backend.api.schemas.core import MyEnum, JSON
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
    user = ma.Nested(UserSchema(
        only=["id", "username", "profile_cover", "profile_border", "profile_level", "settings"]
    ))
    rank = ma.Integer()


class GlobalStatsSchema(ma.Schema):
    nb_users = ma.Integer()
    nb_media = JSON()
    total_pages = ma.Integer()
    total_episodes = JSON()
    total_seasons = JSON()
    total_time = JSON()
    top_media = JSON()
    top_genres = JSON()
    top_actors = JSON()
    top_directors = JSON()
    top_dropped = JSON()
    total_movies = JSON()
    top_authors = JSON()
    top_developers = JSON()
