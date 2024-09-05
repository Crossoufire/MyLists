from marshmallow import validates, ValidationError, validate
from backend.api import ma
from backend.api.core import current_user


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
            raise ValidationError("Password is incorrect")
