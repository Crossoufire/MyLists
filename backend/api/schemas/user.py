from marshmallow import validates, ValidationError, validate
from backend.api import ma
from backend.api.core.handlers import current_user
from backend.api.models.users import (User, UserMediaUpdate, Notifications, PrivacyType, RoleType, RatingSystem,
                                      UserMediaSettings)
from backend.api.schemas.core import MyEnum


class UserMediaSettingsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = UserMediaSettings


class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User

    id = ma.auto_field(dump_only=True)
    username = ma.String(required=True, validate=validate.Length(min=3, max=15))
    email = ma.auto_field(load_only=True, required=True, validate=[validate.Email(), validate.Length(max=120)])
    password = ma.String(load_only=True, required=True, validate=validate.Length(min=8))
    activated_on = ma.auto_field(dump_only=True)
    profile_cover = ma.String(dump_only=True)
    back_cover = ma.String(dump_only=True)
    profile_border = ma.String(dump_only=True)
    privacy = MyEnum(PrivacyType, dump_only=True)
    role = MyEnum(RoleType, dump_only=True)
    rating_system = MyEnum(RatingSystem, dump_only=True)
    last_notif_read_time = ma.auto_field(dump_only=True)
    show_update_modal = ma.Boolean(dump_only=True)
    profile_views = ma.Integer(dump_only=True)
    settings = ma.List(ma.Nested(UserMediaSettingsSchema), dump_only=True)

    profile_level = ma.Integer(dump_only=True)
    callback = ma.String(load_only=True, required=True)

    @validates("username")
    def validate_username(self, new_username: str):
        old_username = current_user.username if current_user else None
        if new_username != old_username and User.query.filter_by(username=new_username).first():
            raise ValidationError("Please use a different username")

    @validates("email")
    def validate_email(self, new_email: str):
        old_email = current_user.email if current_user else None
        if new_email != old_email and User.query.filter_by(email=new_email).first():
            raise ValidationError("Please use a different email")


class UserMediaUpdateSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = UserMediaUpdate

    username = ma.String(attribute="user.username")


class NotificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notifications

    notif_data = ma.String()


class FollowsSchema(ma.Schema):
    username = ma.String()
    profile_cover = ma.String()


class UpdateFollowSchema(ma.Schema):
    follow_id = ma.Integer()
    status = ma.Boolean()


class CountNotificationSchema(ma.Schema):
    count = ma.Integer()


class UpdateMediaListUserSchema(ma.Schema):
    rating_system = MyEnum(RatingSystem)
    anime_list = ma.Boolean()
    games_list = ma.Boolean()
    books_list = ma.Boolean()


class UpdatePasswordUserSchema(ma.Schema):
    old_password = ma.String(required=True, validate=validate.Length(min=8))
    new_password = ma.String(required=True, validate=validate.Length(min=8))

    @validates("old_password")
    def validate_old_password(self, old_password: str):
        if not current_user.verify_password(old_password):
            raise ValidationError("Password is incorrect")


""" --- PROFILE SCHEMAS -------------------------------------------------------------------------------- """


class ProfileFollowsSchema(ma.Schema):
    total = ma.Integer()
    follows = ma.List(ma.Nested(FollowsSchema))


class FavoritesSchema(ma.Schema):
    media_id = ma.Integer()
    media_name = ma.String()
    media_cover = ma.String()


class RatingDataSchema(ma.Schema):
    media_rating = ma.Integer()
    percent_rating = ma.Float()
    mean_rating = ma.Float()


class FavoritesDataSchema(ma.Schema):
    total_favorites = ma.Integer()
    favorites = ma.List(ma.Nested(FavoritesSchema))


class StatusCountSchema(ma.Schema):
    status = ma.String()
    count = ma.Integer()
    percent = ma.Float()


class MediaStatusCountSchema(ma.Schema):
    total_media = ma.Integer()
    no_data = ma.Boolean()
    status_count = ma.List(ma.Nested(StatusCountSchema))


class SpecificMediaDataSchema(ma.Schema):
    media_type = ma.String()
    level = ma.Float()
    specific_total = ma.Integer()
    rating_count = ma.List(ma.Integer())
    time_hours = ma.Float()
    time_days = ma.Float()
    labels = ma.List(ma.String())
    status_count = ma.Nested(MediaStatusCountSchema)
    favorites = ma.Nested(FavoritesDataSchema)
    rating = ma.Nested(RatingDataSchema)


class GlobalMediaDataSchema(ma.Schema):
    total_hours = ma.Float()
    total_days = ma.Float()
    time_per_media = ma.List(ma.Tuple((ma.Float(), ma.String())))
    total_media = ma.Integer()
    total_scored = ma.Float()
    percent_scored = ma.Float()
    mean_score = ma.Float()
    count_per_rating = ma.List(ma.Dict(keys=ma.String(), values=ma.Integer()))


class ProfileMediaDataSchema(ma.Schema):
    global_data = ma.Nested(GlobalMediaDataSchema)
    media_data = ma.List(ma.Nested(SpecificMediaDataSchema))


class ProfileSchema(ma.Schema):
    user_data = ma.Nested(UserSchema)
    user_updates = ma.List(ma.Nested(UserMediaUpdateSchema))
    follows_updates = ma.List(ma.Nested(UserMediaUpdateSchema))
    follows = ma.Nested(ProfileFollowsSchema)
    is_following = ma.Boolean()
    media_data = ma.Nested(ProfileMediaDataSchema)
