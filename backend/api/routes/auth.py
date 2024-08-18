from __future__ import annotations
import secrets
from datetime import datetime
from typing import Tuple, Dict
from urllib.parse import urlencode
import requests
from flask import Blueprint, request, abort, url_for, current_app, session
from werkzeug.http import dump_cookie
from backend.api import db
from backend.api.core.emails import send_email
from backend.api.core.handlers import current_user, basic_auth, token_auth
from backend.api.models.users import Token, User
from backend.api.schemas.auth import *
from backend.api.schemas.core import EmptySchema
from backend.api.schemas.user import UserSchema
from backend.my_apifairy import body, response, other_responses, authenticate, arguments

auth = Blueprint("auth", __name__)


def token_response(token: Token) -> Tuple[Dict, int, Dict]:
    headers = {
        "Set-Cookie": dump_cookie(
            key="refresh_token",
            value=token.refresh_token,
            path=url_for("auth.create_token"),
            secure=True,
            httponly=True,
            samesite="none",
            max_age=current_app.config["REFRESH_TOKEN_DAYS"] * 24 * 60 * 60,
        ),
    }
    return {"access_token": token.access_token}, 200, headers


@auth.route("/auth/signup", methods=["POST"])
@body(UserSchema)
@response(EmptySchema, 204, description="User successfully registered")
@other_responses({400: "Error trying to send the email"})
def signup(data):
    """ Signup """

    callback = data["callback"]
    del data["callback"]

    # noinspection PyArgumentList
    new_user = User(
        **data,
        active=current_app.config["USER_ACTIVE_PER_DEFAULT"],
    )
    db.session.add(new_user)
    db.session.commit()

    try:
        send_email(
            to=new_user.email,
            username=new_user.username,
            subject="Register account",
            template="register",
            callback=callback,
            token=new_user.generate_jwt_token(),
        )
    except:
        return abort(400, "Error trying to send the email. Please try again later")

    return {}


@auth.route("/auth/tokens", methods=["POST"])
@authenticate(basic_auth)
@response(TokenSchema)
@other_responses({401: "Invalid username or password", 403: "Account not activated"})
def create_token():
    """
    Create Token
    Return the `access token` in the request body and the `refresh token` as a hardened cookie.
    """

    if not current_user.active:
        return abort(403, "Your account is not activated, please check your email")

    token = current_user.generate_auth_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    return token_response(token)


@auth.route("/auth/tokens", methods=["PUT"])
@body(TokenSchema)
@response(TokenSchema, description="Newly issued access and refresh token")
@other_responses({401: "Invalid access or refresh token"})
def refresh_token(data):
    """
    Refresh Token
    The `refresh token` must be passed as a cookie. The `access token` must be passed in the request body.
    \n The `refresh token` is returned as a hardened cookie.
    """

    access_token = data["access_token"]
    refresh_token = request.cookies.get("refresh_token")
    if not access_token or not refresh_token:
        return abort(401, "Invalid access or refresh token")

    token = User.verify_refresh_token(refresh_token, access_token)
    if not token:
        return abort(401, "Invalid access or refresh token")

    token.expire()
    new_token_ = token.user.generate_auth_token()
    db.session.add_all([token, new_token_])
    db.session.commit()

    return token_response(new_token_)


@auth.route("/auth/logout", methods=["DELETE"])
@authenticate(token_auth)
@response(EmptySchema, 204, description="Token is now revoked")
@other_responses({401: "Invalid access token"})
def logout():
    """ Logout """

    access_token = request.headers["Authorization"].split()[1]
    token = Token.query.filter_by(access_token=access_token).first()
    if not token:
        return abort(401, "Invalid access token")

    token.expire()
    db.session.commit()

    return {}


@auth.route("/auth/password-reset", methods=["POST"])
@body(PasswordResetRequestSchema)
@response(EmptySchema, 204, description="Password reset email sent")
@other_responses({400: "Email error or invalid email", 403: "Account not activated"})
def request_password_reset(data):
    """ Request Password Reset """

    user = User.query.filter_by(email=data["email"]).first()
    if not user:
        return abort(400, "This email is invalid")
    if not user.active:
        return abort(403, "This account is not activated. Please check your email address.")

    try:
        send_email(
            to=user.email,
            username=user.username,
            subject="Password Reset Request",
            template="password_reset",
            callback=data["callback"],
            token=user.generate_jwt_token(),
        )
    except Exception:
        return abort(400, "An error occurred while sending the password reset email. Please try again later.")

    return {}


@auth.route("/auth/password-reset/confirm", methods=["POST"])
@body(PasswordResetSchema)
@response(EmptySchema, 204, description="Password successfully reset")
@other_responses({400: "Invalid or expired token"})
def reset_password(data):
    """ Reset Password """

    user = User.verify_jwt_token(data.get("token"))
    if not user or not user.active:
        return abort(400, "Invalid or expired token")

    user.password = data["new_password"]
    db.session.commit()

    return {}


@auth.route("/auth/device-token", methods=["POST"])
@body(RegisterValidateSchema)
@response(EmptySchema, 204, description="Account successfully validated")
@other_responses({400: "Invalid or expired token"})
def register_device_token(data):
    """ Validate Account """

    user = User.verify_jwt_token(data.get("token"))
    if not user or user.active:
        return abort(400, "Invalid or expired token")

    user.active = True
    user.activated_on = datetime.utcnow()
    db.session.commit()

    return {}


@auth.route("/auth/oauth2/<provider>", methods=["GET"])
@arguments(OAuth2ProviderSchema)
@response(OAuthReturnSchema, 200, description="Return the redirect URL to OAuth2 provider")
@other_responses({404: "Unknown OAuth2 provider"})
def oauth_authorize(args, provider: str):
    """ OAuth Authorize """

    provider_data = current_app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        return abort(404, "Unknown OAuth2 provider")

    # Generate random string for state parameter
    session["oauth2_state"] = secrets.token_urlsafe(32)

    # Create query string with all OAuth2 parameters
    qs = urlencode({
        "client_id": provider_data["client_id"],
        "redirect_uri": args["callback"],
        "scope": " ".join(provider_data["scopes"]),
        "state": session["oauth2_state"],
        "response_type": "code",
    })

    return {"redirect_url": f"{provider_data['authorize_url']}?{qs}"}


@auth.route("/auth/oauth2/<provider>", methods=["POST"])
@body(OAuth2Schema)
@response(TokenSchema)
@other_responses({401: "Invalid code or state", 404: "Unknown OAuth2 provider"})
def oauth_create_token(data, provider: str):
    """
    OAuth Create Token
    The `refresh token` is directly returned as a hardened cookie.
    """

    provider_data = current_app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        return abort(404, "Unknown OAuth2 provider")

    # Check state parameter matches created one in authorization request
    if data["state"] != session.get("oauth2_state"):
        return abort(401, "Invalid code or state")

    # Exchange authorization code for <access_token>
    response = requests.post(provider_data["access_token_url"], data={
        "client_id": provider_data["client_id"],
        "client_secret": provider_data["client_secret"],
        "code": data["code"],
        "grant_type": "authorization_code",
        "redirect_uri": data["callback"],
    }, headers={"Accept": "application/json"})

    if response.status_code != 200:
        return abort(401, "Invalid code or state")

    oauth2_token = response.json().get("access_token")
    if not oauth2_token:
        return abort(401, "Invalid code or state")

    # Use <access_token> to get user email address
    response = requests.get(provider_data["get_user"]["url"], headers={
        "Authorization": f"Bearer {oauth2_token}",
        "Accept": "application/json",
    })

    if response.status_code != 200:
        return abort(401, "Invalid code or state")

    # Get email from provider
    email = provider_data["get_user"]["email"](response.json())

    # Find or create new user in db
    user = User.query.filter_by(email=email).first()
    if not user:
        # noinspection PyArgumentList
        user = User(
            username=email.split("@")[0],
            email=email,
            active=True,
            activated_on=datetime.utcnow(),
            registered_on=datetime.utcnow(),
        )
        db.session.add(user)

    token = user.generate_auth_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    return token_response(token)
