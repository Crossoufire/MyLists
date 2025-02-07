from __future__ import annotations

from typing import Optional

from flask import abort

from backend.api import RoleType
from backend.api.core import basic_auth, token_auth


@basic_auth.verify_password
def verify_password(username: str, password: str) -> User:
    user = User.query.filter_by(username=username).first()

    if not user or not user.verify_password(password):
        return abort(401, description="Invalid username or password")

    return user


@token_auth.get_user_roles
def get_user_roles(user: User) -> RoleType:
    return user.role


@token_auth.verify_token
def verify_token(access_token: str) -> Optional[User]:
    return User.verify_access_token(access_token) if access_token else None


from backend.api.models.user import User
