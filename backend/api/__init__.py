import logging
from logging.handlers import SMTPHandler, RotatingFileHandler
import os
from typing import Type
import sys

import flask
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from redis import Redis

from backend.api.utils.converters import MediaTypeConverter, JobTypeConverter
from backend.api.utils.enums import RoleType
from backend.cli.commands import register_cli_commands
from backend.config import Config, get_config


# Load globally accessible plugins
mail = Mail()
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cors = CORS()
ma = Marshmallow()
cache = Cache()
redis = Redis(socket_timeout=15, socket_connect_timeout=15)
limiter = Limiter(key_func=get_remote_address, default_limits=["5/second"])


def import_blueprints(register_bp):
    from backend.api.routes.tokens import tokens as tokens_bp
    from backend.api.routes.users import users as users_bp
    from backend.api.routes.media import media_bp as media_bp
    from backend.api.routes.search import search_bp as search_bp
    from backend.api.routes.general import general as general_bp
    from backend.api.core.errors import errors as errors_bp
    from backend.api.routes.details import details_bp as details_bp
    from backend.api.routes.lists import lists_bp as lists_bp
    from backend.api.routes.labels import labels_bp as labels_bp
    from backend.api.routes.mediadle import mediadle_bp as mediadle_bp

    api_blueprints = [tokens_bp, users_bp, media_bp, search_bp, general_bp, errors_bp, details_bp,
                      lists_bp, labels_bp, mediadle_bp]
    for blueprint in api_blueprints:
        register_bp(blueprint, url_prefix="/api")


def create_file_handler(logger: logging.Logger, root_path: str):
    """ Create a File Handler depending on the environment and config """

    log_file_path = os.path.join(os.path.dirname(root_path), "logs", "mylists.log")
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    logger.addHandler(handler)
    logger.info("MyLists is starting up...")


def create_mail_handler(logger: logging.Logger, config: flask.Config):
    """ Create a TLS only mail handler for the app logger which send email when errors occurs """

    mail_handler = SMTPHandler(
        mailhost=(config["MAIL_SERVER"], config["MAIL_PORT"]),
        fromaddr=config["MAIL_USERNAME"],
        toaddrs=config["MAIL_USERNAME"],
        subject="MyLists - Exceptions occurred",
        credentials=(config["MAIL_USERNAME"], config["MAIL_PASSWORD"]),
        secure=(),
    )

    mail_handler.setLevel(logging.ERROR)
    logger.addHandler(mail_handler)


def create_db_and_setup_pragma():
    """ On app starts: create tables and change pragmas. """

    from sqlalchemy import event

    db.create_all()

    def configure_sqlite(dbapi_connection, connection_record):
        """ Configure SQLite database to use WAL mode and NORMAL synchronous mode. """

        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=DELETE")
        cursor.execute("PRAGMA synchronous=FULL")
        cursor.close()

    event.listen(db.engine, "connect", configure_sqlite)


def refresh_database():
    """ On app starts execute refreshing functions. """

    from backend.cli.managers.media_manager import CLIMediaManager
    from backend.cli.managers.system_manager import CLISystemManager

    CLIMediaManager.compute_all_time_spent()
    CLISystemManager().update_global_stats()


def create_app(config_class: Type[Config] = None) -> Flask:
    app = Flask(__name__, static_url_path="/api/static")

    if config_class is None:
        config_class = get_config()

    app.config.from_object(config_class)
    app.url_map.strict_slashes = False
    app.url_map.converters["mediatype"] = MediaTypeConverter
    app.url_map.converters["jobtype"] = JobTypeConverter

    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=[
        "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4173", "http://127.0.0.1:4173",
    ])

    with app.app_context():
        register_cli_commands()
        create_db_and_setup_pragma()
        import_blueprints(app.register_blueprint)

        if app.config["CREATE_FILE_LOGGER"] and not sys.stdin.isatty():
            create_file_handler(app.logger, app.root_path)

        if app.config["CREATE_MAIL_HANDLER"]:
            create_mail_handler(app.logger, app.config)

        if not sys.stdin.isatty() and not app.debug:
            refresh_database()

        return app
