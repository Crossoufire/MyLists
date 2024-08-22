from marshmallow_oneofschema import OneOfSchema
from backend.api import ma
from backend.api.models.books import Books, BooksList
from backend.api.models.games import Games, GamesList
from backend.api.models.movies import Movies, MoviesList
from backend.api.models.tv import Series, Anime, SeriesList, AnimeList
from backend.api.schemas.core import create_list_schema, MyEnum
from backend.api.schemas.user import UserMediaUpdateSchema
from backend.api.utils.enums import MediaType, RatingSystem


class SimpleNameSchema(ma.Schema):
    name = ma.String()


class MediaDetailsSchema(ma.Schema):
    external = ma.Boolean(load_default=False)


class JobMediaSchema(ma.Schema):
    media_id = ma.Integer(attribute="id")
    media_name = ma.String(attribute="name")
    media_cover = ma.String()
    in_list = ma.Boolean()


class MediaFormSchema(ma.Schema):
    fields = ma.List(ma.Tuple((ma.String(), ma.String())))
    media_genres = ma.List(ma.String())
    applied_genres = ma.List(ma.Nested(SimpleNameSchema))


class MediaFormPostSchema(ma.Schema):
    media_id = ma.Integer()
    fields = ma.List(ma.Dict(keys=ma.String(), values=ma.String()))


class RefreshMediaSchema(ma.Schema):
    media_id = ma.Integer()
    payload = ma.String(allow_none=True)


class LockMediaSchema(ma.Schema):
    media_id = ma.Integer()
    payload = ma.Boolean()


""" ------------------------------------------------------------------------------------------------ """


class EpsPerSeasonSchema(ma.Schema):
    season = ma.Integer()
    episode = ma.Integer()


class CompanySchema(SimpleNameSchema):
    is_developer = ma.Boolean()


class SimilarMediaSchema(ma.Schema):
    media_id = ma.Integer(attribute="id")
    media_name = ma.String(attribute="name")
    media_cover = ma.String()


class LabelMediaSchema(ma.Schema):
    already_in = ma.List(ma.String())
    available = ma.List(ma.String())


# ---------------------------------------


class SeriesDetailsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Series

    media_cover = ma.String(attribute="media_cover")

    eps_seasons = ma.List(ma.Nested(EpsPerSeasonSchema))
    platforms = ma.List(ma.Nested(SimpleNameSchema))
    actors = ma.List(ma.Nested(SimpleNameSchema))
    genres = ma.List(ma.Nested(SimpleNameSchema))


class AnimeDetailsSchema(SeriesDetailsSchema):
    class Meta:
        model = Anime


class MoviesDetailsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Movies

    actors = ma.List(ma.Nested(SimpleNameSchema))
    genres = ma.List(ma.Nested(SimpleNameSchema))


class GamesDetailsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Games

    platforms = ma.List(ma.Nested(SimpleNameSchema))
    genres = ma.List(ma.Nested(SimpleNameSchema))
    companies = ma.List(ma.Nested(CompanySchema))


class BooksDetailsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Books

    authors = ma.List(ma.Nested(SimpleNameSchema))
    genres = ma.List(ma.Nested(SimpleNameSchema))


# ---------------------------------------


class FollowsDetailsSchema(ma.Schema):
    username = ma.String()
    profile_cover = ma.String()
    rating_system = MyEnum(RatingSystem)


class FollowsSeriesDetailsSchema(FollowsDetailsSchema):
    media_assoc = ma.Nested(create_list_schema(SeriesList))


class FollowsAnimeDetailsSchema(FollowsDetailsSchema):
    media_assoc = ma.Nested(create_list_schema(AnimeList))


class FollowsMoviesDetailsSchema(FollowsDetailsSchema):
    media_assoc = ma.Nested(create_list_schema(MoviesList))


class FollowsGamesDetailsSchema(FollowsDetailsSchema):
    media_assoc = ma.Nested(create_list_schema(GamesList))


class FollowsBooksDetailsSchema(FollowsDetailsSchema):
    media_assoc = ma.Nested(create_list_schema(BooksList))


# ---------------------------------------


class UserDataSchema(ma.Schema):
    history = ma.List(ma.Nested(UserMediaUpdateSchema))
    labels = ma.Nested(LabelMediaSchema)


class UserAnimeDataSchema(UserDataSchema):
    media_assoc = ma.Nested(create_list_schema(AnimeList))


class UserSeriesDataSchema(UserDataSchema):
    media_assoc = ma.Nested(create_list_schema(SeriesList))


class UserMoviesDataSchema(UserDataSchema):
    media_assoc = ma.Nested(create_list_schema(MoviesList))


class UserGamesDataSchema(UserDataSchema):
    media_assoc = ma.Nested(create_list_schema(GamesList))


class UserBooksDataSchema(UserDataSchema):
    media_assoc = ma.Nested(create_list_schema(BooksList))


# ---------------------------------------


class DetailsResponseSchema(ma.Schema):
    similar_media = ma.List(ma.Nested(SimilarMediaSchema))


class SeriesDetailsResponseSchema(DetailsResponseSchema):
    class Meta:
        title = "Series Details"

    media = ma.Nested(SeriesDetailsSchema)
    user_data = ma.Nested(UserSeriesDataSchema)
    follows_data = ma.List(ma.Nested(FollowsSeriesDetailsSchema))


class AnimeDetailsResponseSchema(DetailsResponseSchema):
    class Meta:
        title = "Anime Details"

    media = ma.Nested(AnimeDetailsSchema)
    user_data = ma.Nested(UserAnimeDataSchema)
    follows_data = ma.List(ma.Nested(FollowsAnimeDetailsSchema))


class MoviesDetailsResponseSchema(DetailsResponseSchema):
    class Meta:
        title = "Movies Details"

    media = ma.Nested(MoviesDetailsSchema)
    user_data = ma.Nested(UserMoviesDataSchema)
    follows_data = ma.List(ma.Nested(FollowsMoviesDetailsSchema))


class BooksDetailsResponseSchema(DetailsResponseSchema):
    class Meta:
        title = "Books Details"

    media = ma.Nested(BooksDetailsSchema)
    user_data = ma.Nested(UserBooksDataSchema)
    follows_data = ma.List(ma.Nested(FollowsBooksDetailsSchema))


class GamesDetailsResponseSchema(DetailsResponseSchema):
    class Meta:
        title = "Games Details"

    media = ma.Nested(GamesDetailsSchema)
    user_data = ma.Nested(UserGamesDataSchema)
    follows_data = ma.List(ma.Nested(FollowsGamesDetailsSchema))


# ---------------------------------------


class MediaDetailsOneOfSchema(OneOfSchema):
    type_schemas = {
        MediaType.SERIES: SeriesDetailsResponseSchema,
        MediaType.ANIME: AnimeDetailsResponseSchema,
        MediaType.MOVIES: MoviesDetailsResponseSchema,
        MediaType.BOOKS: BooksDetailsResponseSchema,
        MediaType.GAMES: GamesDetailsResponseSchema,
    }

    def get_obj_type(self, obj):
        for mt in MediaType:
            for media in [Series, Anime, Movies, Books, Games]:
                if isinstance(obj["media"], media):
                    return mt
