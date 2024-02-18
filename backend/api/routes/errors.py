import traceback
from flask import Blueprint, current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException, InternalServerError

errors = Blueprint("errors_api", __name__)


@errors.app_errorhandler(HTTPException)
def http_error(error, message: str = None):
    """ Catch and handle all HTTP errors (400, 404, 403, etc...) """

    # Log exception traceback
    if current_app.debug and error.code == 404:
        pass
    else:
        current_app.logger.error(traceback.format_exc())

    data = dict(
        code=error.code,
        message=error.name,
        description=message if message else error.description,
    )

    return data, error.code


@errors.app_errorhandler(IntegrityError)
def sqlalchemy_integrity_error(error):
    """ Catch and handle all database integrity errors """

    # Log exception traceback
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
    """ Catch and handle specific SQLAlchemy errors """

    # Log exception traceback
    current_app.logger.error(traceback.format_exc())

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500


# noinspection PyUnusedLocal
@errors.app_errorhandler(Exception)
def other_exceptions(error):
    """ Catch and handle all the remaining exceptions errors """

    # Log exception traceback
    current_app.logger.error(traceback.format_exc())

    data = dict(
        code=InternalServerError.code,
        message=InternalServerError().name,
        description=InternalServerError.description,
    )

    return data, 500