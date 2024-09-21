from __future__ import annotations

import secrets
from datetime import datetime
from urllib.parse import urlencode

import requests
from flask import Blueprint, request, abort, url_for, current_app, session, jsonify
from flask_bcrypt import generate_password_hash
from werkzeug.http import dump_cookie

from backend.api import db
from backend.api.core import basic_auth, current_user, token_auth
from backend.api.core.email import send_email
from backend.api.models.user import Token, User
from backend.api.schemas.tokens import *
from backend.api.utils.decorators import body, arguments


tokens = Blueprint("api_tokens", __name__)


def token_response(token: Token):
    headers = {
        "Set-Cookie": dump_cookie(
            key="refresh_token",
            value=token.refresh_token,
            path=url_for("api_tokens.new_token"),
            secure=True,
            httponly=True,
            samesite="none",
            max_age=current_app.config["REFRESH_TOKEN_DAYS"] * 24 * 60 * 60,
        ),
    }
    return {"access_token": token.access_token}, 200, headers


@tokens.route("/tokens", methods=["POST"])
@basic_auth.login_required
def new_token():
    """ Create an <access token> and a <refresh token>. The <refresh token> is returned as a hardened cookie """

    if not current_user.active:
        return abort(403, description="Account not activated, please check your email address.")

    token = current_user.generate_auth_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    return token_response(token)


@tokens.route("/tokens", methods=["PUT"])
@body(TokenSchema)
def refresh(data):
    """
    Refresh an `access token`.
    The client needs to pass the `refresh token` in a cookie.
    The `access token` must be passed in the request body.
    """
    access_token = data["access_token"]
    refresh_token = request.cookies.get("refresh_token")
    if not access_token or not refresh_token:
        return abort(401, description="Invalid access or refresh token")

    token = User.verify_refresh_token(refresh_token, access_token)
    if not token:
        return abort(401, description="Invalid access or refresh token")

    token.expire()
    new_token_ = token.user.generate_auth_token()
    db.session.add_all([token, new_token_])
    db.session.commit()

    return token_response(new_token_)


@tokens.route("/tokens", methods=["DELETE"])
@token_auth.login_required
def revoke_token():
    """ Revoke an access token = logout """

    access_token = request.headers["Authorization"].split()[1]

    token = Token.query.filter_by(access_token=access_token).first()
    if not token:
        return abort(401, description="Invalid access token")

    token.expire()
    db.session.commit()

    return {}, 204


@tokens.route("/tokens/reset_password_token", methods=["POST"])
@body(PasswordResetRequestSchema)
def reset_password_token(data):
    user = User.query.filter_by(email=data["email"]).first()

    try:
        send_email(
            to=user.email,
            username=user.username,
            subject="Password Reset Request",
            template="password_reset",
            callback=data["callback"],
            token=user.generate_jwt_token(),
        )
    except:
        return abort(500, description="Failed to send password reset email")

    return {}, 204


@tokens.route("/tokens/reset_password", methods=["POST"])
@body(PasswordResetSchema)
def reset_password(data):
    user = User.verify_jwt_token(data["token"])
    if not user:
        return abort(400, description="Invalid token")
    if not user.active:
        return abort(401, description="Account not activated, please check your email address.")

    user.password = generate_password_hash(data["new_password"])
    db.session.commit()
    current_app.logger.info(f"[INFO] - User ID [{user.id}] Password changed.")

    return {}, 204


@tokens.route("/tokens/register_token", methods=["POST"])
@body(RegisterTokenSchema)
def register_token(data):
    """ Check the register token to validate a new user account """

    user = User.verify_jwt_token(data["token"])
    if not user:
        return abort(400, description="Invalid token")

    user.active = True
    user.activated_on = datetime.utcnow()

    db.session.commit()
    current_app.logger.info(f"[INFO] - [{user.id}] Account activated.")

    return {}, 204


@tokens.route("/tokens/oauth2/<provider>", methods=["GET"])
@arguments(OAuth2SchemaProvider)
def oauth2_authorize(args, provider: str):
    """ Initiate the OAuth2 authentication with a third-party provider """

    provider_data = current_app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        return abort(404, description="OAuth2 provider not found")

    # Generate random string for state parameter
    session["oauth2_state"] = secrets.token_urlsafe(32)

    # Create query string with all OAuth2 parameters
    qs = urlencode(dict(
        client_id=provider_data["client_id"],
        redirect_uri=args["callback"],
        scope=" ".join(provider_data["scopes"]),
        state=session["oauth2_state"],
        response_type="code",
    ))

    data = {"redirect_url": f"{provider_data['authorize_url']}?{qs}"}

    return jsonify(data=data), 200


@tokens.route("/tokens/oauth2/<provider>", methods=["POST"])
@body(OAuth2Schema)
def oauth2_new(data, provider: str):
    """
    Create a new `access_token` and `refresh_token` with OAuth2 authentication.
    The `refresh_token` is returned as a hardened cookie.
    """

    provider_data = current_app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        return abort(404, description="OAuth2 provider not found")

    # Check state parameter matches created one in authorization request
    if data["state"] != session.get("oauth2_state"):
        return abort(401, description="Invalid code or state")

    # Exchange authorization code for <access_token>
    response = requests.post(provider_data["access_token_url"], data={
        "client_id": provider_data["client_id"],
        "client_secret": provider_data["client_secret"],
        "code": data["code"],
        "grant_type": "authorization_code",
        "redirect_uri": data["callback"],
    }, headers={"Accept": "application/json"})

    if response.status_code != 200:
        return abort(401, description="Invalid code or state")

    oauth2_token = response.json().get("access_token")
    if not oauth2_token:
        return abort(401, description="Invalid code or state")

    # Use <access_token> to get user email address
    response = requests.get(provider_data["get_user"]["url"], headers={
        "Authorization": f"Bearer {oauth2_token}",
        "Accept": "application/json",
    })

    if response.status_code != 200:
        return abort(401, description="Invalid code or state")

    # Get email from provider
    email = provider_data["get_user"]["email"](response.json())

    # Find or create new user in db
    user = User.query.filter_by(email=email).first()
    if not user:
        unique_username = User.generate_unique_username(email)
        user = User.register_new_user(
            username=unique_username,
            email=email,
            active=True,
            activated_on=datetime.utcnow(),
        )

    token = user.generate_auth_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    return token_response(token)
