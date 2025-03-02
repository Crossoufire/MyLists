import json
import traceback
from http import HTTPStatus
from typing import Tuple, Dict

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from flask import Blueprint, current_app, has_request_context, request
from werkzeug.exceptions import InternalServerError, HTTPException, Unauthorized, Forbidden

from backend.api import db
from backend.api.utils.functions import naive_utcnow
from backend.api.schemas.core import ApiValidationError
from backend.api.core import token_auth, basic_auth, current_user


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

    # Rollback session transaction if integrity error occurs
    if isinstance(error, IntegrityError) or isinstance(error, SQLAlchemyError):
        db.session.rollback()

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
                user_id=current_user.id if current_user else None,
                user_username=current_user.username if current_user else None,
                timestamp=f"{naive_utcnow().strftime('%d-%b-%Y %H:%M:%S')} UTC",
            ))

            try:
                del error_context["headers"]["Cookie"]
                del error_context["headers"]["Authorization"]
            except:
                current_app.logger.warning(f"Failed to delete cookie and authorization headers: {error_context}")
                pass

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
