from __future__ import annotations
from http import HTTPStatus
from typing import Tuple, Dict
from flask import abort
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from werkzeug.exceptions import Forbidden, Unauthorized
from werkzeug.local import LocalProxy
from backend.api.utils.enums import RoleType


basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth()

# Local proxy: make <current_user> available globally
current_user = LocalProxy(lambda: token_auth.current_user())


@token_auth.get_user_roles
def get_user_role(user: User) -> RoleType:
    return user.role


@basic_auth.verify_password
def verify_password(username: str, password: str) -> User:
    """ Verify username and password on login and return a <user> object if successful """

    user = User.query.filter_by(username=username).first()
    if user and user.verify_password(password):
        return user

    return abort(401)


@basic_auth.error_handler
def basic_auth_error(status: int = HTTPStatus.UNAUTHORIZED) -> Tuple[Dict, int, Dict]:
    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code, {"WWW-Authenticate": "Form"}


@token_auth.verify_token
def verify_token(access_token: str) -> str | None:
    return User.verify_access_token(access_token) if access_token else None


@token_auth.error_handler
def token_auth_error(status: int = HTTPStatus.UNAUTHORIZED) -> Tuple[Dict, int]:
    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code


from backend.api.models.users import User
