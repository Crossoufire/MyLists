from marshmallow import validate
from backend.api import ma


class TokenSchema(ma.Schema):
    class Meta:
        ordered = True

    access_token = ma.String(required=True)


class PasswordResetRequestSchema(ma.Schema):
    class Meta:
        ordered = True

    email = ma.String(required=True, validate=[validate.Length(max=120), validate.Email()])
    callback = ma.String(required=True)


class PasswordResetSchema(ma.Schema):
    class Meta:
        ordered = True

    token = ma.String(required=True)
    new_password = ma.String(required=True, validate=validate.Length(min=8, max=50))


class RegisterValidateSchema(ma.Schema):
    class Meta:
        ordered = True

    token = ma.String(required=True)


class OAuth2ProviderSchema(ma.Schema):
    class Meta:
        ordered = True

    callback = ma.String(required=True)


class OAuth2Schema(OAuth2ProviderSchema):
    code = ma.String(required=True)
    state = ma.String(required=True)


class OAuthReturnSchema(ma.Schema):
    redirect_url = ma.String(required=True)
