from datetime import datetime
from http import HTTPStatus
import json
import traceback
from typing import Tuple, Dict

from flask import Blueprint, current_app, has_request_context, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import InternalServerError, HTTPException, Unauthorized, Forbidden

from backend.api.core import token_auth, basic_auth, current_user
from backend.api.schemas.core import ApiValidationError


errors = Blueprint("errors_api", __name__)


def should_log_error(error: Exception):
    IGNORED_HTTP_ERROR_CODES = [401, 403, 404]

    if isinstance(error, HTTPException):
        if error.description == "Invalid image format":
            return False
        if error.code in IGNORED_HTTP_ERROR_CODES:
            return False

    return True


def log_error(error: Exception):
    if current_app.testing:
        return

    if should_log_error(error):
        error_context = dict(
            error_message=str(error),
            error_type=type(error).__name__,
        )

        if isinstance(error, HTTPException):
            error_context.update(dict(
                error_code=error.code,
                error_description=error.description,
            ))

        if has_request_context():
            error_context.update(dict(
                url=request.url,
                method=request.method,
                headers=dict(request.headers),
                body=request.get_data(as_text=True),
                user_id=current_user.id if current_user else None,
                user_username=current_user.username if current_user else None,
                timestamp=f"{datetime.utcnow().strftime('%d-%b-%Y %H:%M:%S')} UTC",
            ))

        current_app.logger.error(
            f" ### ERROR BEGIN ----------------------------------------------------------\n"
            f"{json.dumps(error_context, indent=4, default=str)}\n"
            "---- TRACEBACK ----\n"
            f"{traceback.format_exc()}"
            f" ### ERROR END ------------------------------------------------------------\n"
        )


@basic_auth.error_handler
def basic_auth_error(status: int = HTTPStatus.UNAUTHORIZED) -> Tuple[Dict, int, Dict]:
    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code, {"WWW-Authenticate": "Form"}


@token_auth.error_handler
def token_auth_error(status: int = HTTPStatus.UNAUTHORIZED) -> Tuple[Dict, int]:
    error = (Forbidden if status == HTTPStatus.FORBIDDEN else Unauthorized)()

    response = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return response, error.code


@errors.app_errorhandler(HTTPException)
def http_error(error: HTTPException):
    log_error(error)

    data = dict(
        code=error.code,
        message=error.name,
        description=error.description,
    )

    return data, error.code


@errors.app_errorhandler(IntegrityError)
def sqlalchemy_integrity_error(error: IntegrityError):
    log_error(error)

    data = dict(
        code=400,
        message="Database integrity error",
        description=str(error.orig),
    )

    return data, 400


@errors.app_errorhandler(SQLAlchemyError)
def sqlalchemy_error(error: SQLAlchemyError):
    log_error(error)

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500


@errors.app_errorhandler(ApiValidationError)
def validation_error(error: ApiValidationError):
    log_error(error)

    data = dict(
        code=error.status_code,
        message="Validation Error",
        description="The server found one or more errors in the information that you sent",
        errors=error.messages,
    )

    return data, error.status_code


@errors.app_errorhandler(Exception)
def other_exceptions(error: Exception):
    log_error(error)

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500
