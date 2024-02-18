from __future__ import annotations
from http import HTTPStatus
from typing import Tuple, Dict
from flask import abort
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from sqlalchemy import select
from werkzeug.exceptions import Forbidden, Unauthorized
from werkzeug.local import LocalProxy
from backend.api import db

basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth()

# Local proxy to make <current_user> available everywhere
current_user = LocalProxy(lambda: token_auth.current_user())


@basic_auth.verify_password
def verify_password(username: str, password: str) -> User:
    """ Verify the user's username and password on login and return the <user> object if successful """

    user = db.session.scalar(select(User).where(User.username == username))

    if user.password == "" or user.password is None:
        return abort(401)

    if user and user.verify_password(password):
        return user


@basic_auth.error_handler
def basic_auth_error(status: int = HTTPStatus.UNAUTHORIZED) -> Tuple[Dict, int, Dict]:
    """ Error handler when the entered credentials are wrong """

    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code, {"WWW-Authenticate": "Form"}


@token_auth.verify_token
def verify_token(access_token: str) -> str | None:
    """ Verify the user's <token> for each <@token_auth.login_required> routes """
    return User.verify_access_token(access_token) if access_token else None


@token_auth.error_handler
def token_auth_error(status: int = 401) -> Tuple[Dict, int]:
    """ Error handler when the <access token> of the user is expired """

    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code


# Avoid circular imports
from backend.api.models.user_models import User
