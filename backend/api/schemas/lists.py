from marshmallow import validates, ValidationError
from marshmallow_oneofschema import OneOfSchema
from backend.api import ma
from backend.api.models import SeriesList, AnimeList, MoviesList, BooksList, GamesList
from backend.api.schemas.core import MyEnum
from backend.api.schemas.media import create_list_schema
from backend.api.schemas.user import UserMediaUpdateSchema, UserSchema
from backend.api.utils.enums import Status, MediaType


class ListFiltersSchema(ma.Schema):
    genres = ma.List(ma.String())
    labels = ma.List(ma.String())
    actors = ma.List(ma.String())
    authors = ma.List(ma.String())
    companies = ma.List(ma.String())
    platforms = ma.List(ma.String())


class ListQuerySchema(ma.Schema):
    page = ma.Integer(load_default=1)
    search = ma.String(load_default=None)
    sorting = ma.String(load_default=None)
    common = ma.Boolean(load_default=True)
    comment = ma.Boolean(load_default=False)
    favorite = ma.Boolean(load_default=False)
    lang = ma.List(ma.String, load_default=["All"])
    status = ma.List(ma.String, load_default=["All"])
    genres = ma.List(ma.String, load_default=["All"])
    labels = ma.List(ma.String, load_default=["All"])
    actors = ma.List(ma.String, load_default=["All"])
    authors = ma.List(ma.String, load_default=["All"])
    directors = ma.List(ma.String, load_default=["All"])
    platforms = ma.List(ma.String, load_default=["All"])
    companies = ma.List(ma.String, load_default=["All"])


class ListPaginationSchema(ma.Schema):
    all_status = ma.List(MyEnum(Status))
    all_sorting = ma.List(ma.String)
    page = ma.Integer()
    pages = ma.Integer()
    total = ma.Integer()


class UserListSchema(ma.Schema):
    user_data = ma.Nested(UserSchema)
    pagination = ma.Nested(ListPaginationSchema)


class UserSeriesListSchema(UserListSchema):
    class Meta:
        title = "Series"

    media_data = ma.List(ma.Nested(create_list_schema(SeriesList, with_cover=True)))


class UserAnimeListSchema(UserListSchema):
    class Meta:
        title = "Anime"

    media_data = ma.List(ma.Nested(create_list_schema(AnimeList, with_cover=True)))


class UserMoviesListSchema(UserListSchema):
    class Meta:
        title = "Movies"

    media_data = ma.List(ma.Nested(create_list_schema(MoviesList, with_cover=True)))


class UserBooksListSchema(UserListSchema):
    class Meta:
        title = "Books"

    media_data = ma.List(ma.Nested(create_list_schema(BooksList, with_cover=True)))


class UserGamesListSchema(UserListSchema):
    class Meta:
        title = "Games"

    media_data = ma.List(ma.Nested(create_list_schema(GamesList, with_cover=True)))


class UserListOneOfSchema(OneOfSchema):
    type_schemas = {
        MediaType.SERIES: UserSeriesListSchema,
        MediaType.ANIME: UserAnimeListSchema,
        MediaType.MOVIES: UserMoviesListSchema,
        MediaType.BOOKS: UserBooksListSchema,
        MediaType.GAMES: UserGamesListSchema,
    }

    def get_obj_type(self, obj):
        for mt in MediaType:
            for media_list in [SeriesList, AnimeList, MoviesList, BooksList, GamesList]:
                if isinstance(obj["media_data"], media_list):
                    return mt


class UpcomingItemSchema(ma.Schema):
    media_id = ma.Integer()
    media_name = ma.String()
    media_cover = ma.String()
    season_to_air = ma.Integer()
    episode_to_air = ma.Integer()
    release_date = ma.String()


class UpcomingReleasesSchema(ma.Schema):
    media_type = MyEnum(MediaType)
    items = ma.List(ma.Nested(UpcomingItemSchema))


class UpdateFavoriteSchema(ma.Schema):
    payload = ma.Boolean(required=True)
    media_id = ma.Integer(required=True)


class UpdateStatusSchema(ma.Schema):
    payload = MyEnum(Status, required=True)
    media_id = ma.Integer(required=True)


class UpdateRatingSchema(ma.Schema):
    payload = ma.Float(allow_none=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value is not None and (value < 0 or value > 10):
            raise ValidationError("Rating needs to be between 0 and 10")


class UpdateRedoSchema(ma.Schema):
    payload = ma.Integer(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 0 or value > 10:
            raise ValidationError("Re-read/re-watched needs to be between 0 and 10")


class UpdateCommentSchema(ma.Schema):
    payload = ma.String(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if len(value) > 2000:
            raise ValidationError("This comment is too large. The limit is 2000 characters.")


class UpdatePlaytimeSchema(ma.Schema):
    class Meta:
        ordered = True

    payload = ma.Integer(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 0 or value > 10000:
            raise ValidationError("Playtime needs to be comprise between 0 and 10000 hours.")


class UpdateSeasonSchema(ma.Schema):
    class Meta:
        ordered = True

    payload = ma.Integer(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 1:
            raise ValidationError("Invalid season")


class UpdateEpisodeSchema(ma.Schema):
    class Meta:
        ordered = True

    payload = ma.Integer(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 1:
            raise ValidationError("Invalid episode")


class UpdatePageSchema(ma.Schema):
    class Meta:
        ordered = True

    payload = ma.Integer(required=True)
    media_id = ma.Integer(required=True)

    @validates("payload")
    def validate_payload(self, value):
        if value < 0:
            raise ValidationError("Invalid page")


""" --- MEDIALIST SCHEMAS ------------------------------------------------------------------------------ """


class SimpleNameSchema(ma.Schema):
    name = ma.String(dump_only=True)


class MediaListStatsSchema(ma.Schema):
    is_current = ma.Boolean()
    stats = ma.List(ma.Dict(keys=ma.String(), values=ma.String()))
    users = ma.List(ma.String())


class BodyAddToListSchema(ma.Schema):
    media_id = ma.String(required=True)
    payload = MyEnum(Status)


class RemoveFromListSchema(ma.Schema):
    media_id = ma.Integer(required=True)


class MediaLabelSchema(ma.Schema):
    already_in = ma.List(ma.String())
    available = ma.List(ma.String())


class RenameLabelSchema(ma.Schema):
    old_name = ma.String(required=True)
    new_name = ma.String(required=True)


class AddLabelToMediaSchema(ma.Schema):
    payload = ma.String(required=True)
    media_id = ma.Integer(required=True)


class DeleteLabelSchema(ma.Schema):
    name = ma.String(required=True)


class MediaListFiltersSchema(ma.Schema):
    class Meta:
        ordered = True

    genres = ma.List(ma.String())
    labels = ma.List(ma.String())
    entities = ma.List(ma.String())
    platforms = ma.List(ma.String())


class AddToListReturnSchema(ma.Schema):
    history = ma.List(ma.Nested(UserMediaUpdateSchema))


class AddToSeriesListReturnSchema(AddToListReturnSchema):
    class Meta:
        title = "Series"

    media_assoc = ma.Nested(create_list_schema(SeriesList))


class AddToAnimeListReturnSchema(AddToListReturnSchema):
    class Meta:
        title = "Anime"

    media_assoc = ma.Nested(create_list_schema(AnimeList))


class AddToMoviesListReturnSchema(AddToListReturnSchema):
    class Meta:
        title = "Movies"

    media_assoc = ma.Nested(create_list_schema(MoviesList))


class AddToBooksListReturnSchema(AddToListReturnSchema):
    class Meta:
        title = "Books"

    media_assoc = ma.Nested(create_list_schema(BooksList))


class AddToGamesListReturnSchema(AddToListReturnSchema):
    class Meta:
        title = "Games"

    media_assoc = ma.Nested(create_list_schema(GamesList))


class AddToListOneOfSchema(OneOfSchema):
    type_schemas = {
        MediaType.SERIES: AddToSeriesListReturnSchema,
        MediaType.ANIME: AddToAnimeListReturnSchema,
        MediaType.MOVIES: AddToMoviesListReturnSchema,
        MediaType.BOOKS: AddToBooksListReturnSchema,
        MediaType.GAMES: AddToGamesListReturnSchema,
    }

    def get_obj_type(self, obj):
        for mt in MediaType:
            for media_list in [SeriesList, AnimeList, MoviesList, BooksList, GamesList]:
                if isinstance(obj["media_assoc"], media_list):
                    return mt
