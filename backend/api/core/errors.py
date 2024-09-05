import traceback
from flask import Blueprint, current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException, InternalServerError
from backend.api.schemas.core import ApiValidationError

errors = Blueprint("errors_api", __name__)


def log_http_exception(error: HTTPException):
    if current_app.testing:
        return

    # In dev or prod: no 401/404 errors logged
    if error.code == 404 or error.code == 401:
        return

    # Add error to logger and send mail to maintainer (prod only)
    current_app.logger.error(traceback.format_exc())


@errors.app_errorhandler(HTTPException)
def http_error(error: HTTPException, message: str = None):
    log_http_exception(error)

    data = dict(
        code=error.code,
        message=error.name,
        description=message if message else error.description,
    )

    return data, error.code


@errors.app_errorhandler(IntegrityError)
def sqlalchemy_integrity_error(error):
    current_app.logger.error(traceback.format_exc())

    data = dict(
        code=400,
        message="Database integrity error",
        description=str(error.orig),
    )

    return data, 400


# noinspection PyUnusedLocal
@errors.app_errorhandler(SQLAlchemyError)
def sqlalchemy_error(error):
    current_app.logger.error(traceback.format_exc())

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500


@errors.app_errorhandler(ApiValidationError)
def validation_error(error):
    data = dict(
        code=error.status_code,
        message="Validation Error",
        description="The server found one or more errors in the information that you sent",
        errors=error.messages)

    return data, error.status_code


# noinspection PyUnusedLocal
@errors.app_errorhandler(Exception)
def other_exceptions(error):
    current_app.logger.error(traceback.format_exc())

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500
