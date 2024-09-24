from marshmallow import validates, ValidationError, validate

from backend.api import ma
from backend.api.core import current_user
from backend.api.models import User
from backend.api.schemas.core import EnumField
from backend.api.utils.enums import Privacy


class RegisterUserSchema(ma.Schema):
    username = ma.String(required=True, validate=validate.Length(min=3, max=15))
    email = ma.String(required=True, validate=validate.Email())
    password = ma.String(required=True, validate=validate.Length(min=8))
    callback = ma.String(required=True)

    @validates("username")
    def validate_username(self, value):
        if User.query.filter_by(username=value).first():
            raise ValidationError("The username is invalid.")

    @validates("email")
    def validate_email(self, value):
        if User.query.filter_by(email=value).first():
            raise ValidationError("The email is invalid.")


class HistorySchema(ma.Schema):
    search = ma.String(load_default="")
    page = ma.Integer(load_default=1)


class UpdateFollowSchema(ma.Schema):
    follow_id = ma.Integer(required=True)
    follow_status = ma.Bool(required=True)


class PasswordSchema(ma.Schema):
    current_password = ma.String(required=True)
    new_password = ma.String(required=True, validate=validate.Length(min=8))

    @validates("current_password")
    def validate_current_password(self, value):
        if not current_user.verify_password(value):
            raise ValidationError("The current password is incorrect.")


class ListSettingsSchema(ma.Schema):
    add_feeling = ma.Bool(load_default=None)
    add_anime = ma.Bool(load_default=None)
    add_games = ma.Bool(load_default=None)
    add_books = ma.Bool(load_default=None)
    grid_list_view = ma.Bool(load_default=None)


class GeneralSettingsSchema(ma.Schema):
    username = ma.String(required=False, validate=validate.Length(min=3, max=15))
    privacy = EnumField(Privacy, required=False)
    profile_image = ma.Raw(required=False)
    background_image = ma.Raw(required=False)

    @validates("username")
    def validate_username(self, value):
        if User.query.filter_by(username=value).first():
            raise ValidationError("The username is invalid.")
