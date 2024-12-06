from marshmallow import validate, validates, ValidationError

from backend.api import ma


class TokenSchema(ma.Schema):
    access_token = ma.String(required=True)
    refresh_token = ma.String(load_default=None)


class PasswordResetRequestSchema(ma.Schema):
    email = ma.String(required=True, validate=[validate.Length(max=120), validate.Email()])
    callback = ma.String(required=True)

    @validates("email")
    def validate_email(self, value):
        from backend.api.models import User

        user = User.query.filter_by(email=value).first()
        if not user or not user.active:
            raise ValidationError("Invalid email or account not activated.")


class RegisterTokenSchema(ma.Schema):
    token = ma.String(required=True)


class PasswordResetSchema(ma.Schema):
    token = ma.String(required=True)
    new_password = ma.String(required=True, validate=validate.Length(min=8))


class OAuth2SchemaProvider(ma.Schema):
    callback = ma.String(required=True)


class OAuth2Schema(ma.Schema):
    code = ma.String(required=True)
    state = ma.String(required=True)
    callback = ma.String(required=True)
