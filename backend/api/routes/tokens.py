from __future__ import annotations
import secrets
from datetime import datetime
from typing import Tuple, Dict
from urllib.parse import urlencode
import requests
from flask import Blueprint, request, abort, url_for, current_app, session
from flask_bcrypt import generate_password_hash
from werkzeug.http import dump_cookie
from backend.api import db
from backend.api.core.handlers import basic_auth, current_user
from backend.api.core.email import send_email
from backend.api.models.user import Token, User


tokens = Blueprint("api_tokens", __name__)


def token_response(token: Token) -> Tuple[Dict, int, Dict]:
    """ Generate the token response and send it to the user """

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
        return abort(403, "Your account is not activated, please check your email")

    token = current_user.generate_auth_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    return token_response(token)


@tokens.route("/tokens", methods=["PUT"])
def refresh():
    """ Refresh an <access token>. The client needs to pass the <refresh token> in a <refresh_token> cookie.
    The <access token> must be passed in the request body """

    access_token = request.get_json().get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    if not access_token or not refresh_token:
        return abort(401)

    token = User.verify_refresh_token(refresh_token, access_token)
    if token is None:
        return abort(401)

    token.expire()
    new_token_ = token.user.generate_auth_token()
    db.session.add_all([token, new_token_])
    db.session.commit()

    return token_response(new_token_)


@tokens.route("/tokens", methods=["DELETE"])
def revoke_token():
    """ Revoke an access token = logout """

    access_token = request.headers["Authorization"].split()[1]

    token = Token.query.filter_by(access_token=access_token).first()
    if not token:
        return abort(401)

    token.expire()
    db.session.commit()

    return {}, 204


@tokens.route("/tokens/reset_password_token", methods=["POST"])
def reset_password_token():
    try:
        data = request.get_json()
    except:
        return abort(400)

    # Necessary fields
    fields = ("email", "callback")
    if not all(f in data for f in fields):
        return abort(400)

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
    except Exception as e:
        current_app.logger.error(f"ERROR sending an email to account [{user.id}]: {e}")
        return abort(400, "An error occurred while sending the password reset email. Please try again later.")

    return {}, 204


@tokens.route("/tokens/reset_password", methods=["POST"])
def reset_password():
    """ Check password token and change user password """

    try:
        data = request.get_json()
    except:
        return abort(400)

    user = User.verify_jwt_token(data["token"])
    if not user or not user.active:
        return abort(400, "This is an invalid or an expired token.")

    user.password = generate_password_hash(data.get("new_password"))
    db.session.commit()
    current_app.logger.info(f"[INFO] - [{user.id}] Password changed.")

    return {}, 204


@tokens.route("/tokens/register_token", methods=["POST"])
def register_token():
    """ Check the register token to validate a new user account """

    try:
        token = request.get_json()["token"]
    except:
        return abort(400, "The provided token is invalid or expired")

    user = User.verify_jwt_token(token)
    if not user or user.active:
        return abort(400, "The provided token is invalid or expired")

    user.active = True
    user.activated_on = datetime.utcnow()

    db.session.commit()
    current_app.logger.info(f"[INFO] - [{user.id}] Account activated.")

    return {}, 204


@tokens.route("/tokens/oauth2/<provider>", methods=["GET"])
def oauth2_authorize(provider: str):
    """ Initiate the OAuth2 authentication with a third-party provider """

    callback = request.args.get("callback")
    if not callback:
        return abort(400)

    provider_data = current_app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        return abort(404, "Unknown OAuth2 provider")

    # Generate random string for state parameter
    session["oauth2_state"] = secrets.token_urlsafe(32)

    # Create query string with all OAuth2 parameters
    qs = urlencode({
        "client_id": provider_data["client_id"],
        "redirect_uri": callback,
        "scope": " ".join(provider_data["scopes"]),
        "state": session["oauth2_state"],
        "response_type": "code",
    })

    return {"redirect_url": f"{provider_data['authorize_url']}?{qs}"}, 200


@tokens.route("/tokens/oauth2/<provider>", methods=["POST"])
def oauth2_new(provider: str):
    """ Create a new <access_token> and <refresh_token> with OAuth2 authentication. The <refresh_token> is returned in
    the body of the request or as a hardened cookie, depending on configuration. A cookie should be used when the
    client is running in an insecure environment such as a web browser, and cannot adequately protect the refresh
    token against unauthorized access.
    """

    try:
        data = request.get_json()
    except:
        return abort(400)

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

    # Find or create new user in database depending on email
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(
            email=email,
            username=email.split("@")[0],
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
