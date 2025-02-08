import os
import sys
import logging
from typing import Type
from logging.handlers import SMTPHandler, RotatingFileHandler

import flask
from flask import Flask
from redis import Redis
from flask_cors import CORS
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_limiter import Limiter
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_limiter.util import get_remote_address

from backend.cli.commands import register_cli_commands
from backend.api.utils.enums import RoleType, MediaType
from backend.config import Config, get_config, default_db_uri, basedir
from backend.api.utils.converters import MediaTypeConverter, JobTypeConverter


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


def import_blueprints(app: Flask):
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
        app.register_blueprint(blueprint, url_prefix="/api")


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


def setup_app_and_db(app: Flask):
    """ On app starts: create tables and change pragmas. """

    from sqlalchemy import event

    # Ensure `instance` folder exists if default db location used
    if app.config["SQLALCHEMY_DATABASE_URI"] == default_db_uri:
        instance_folder = os.path.join(basedir, "instance")
        os.makedirs(instance_folder, exist_ok=True)

    # Add media type covers folder if not exists
    covers_dir = os.path.join(basedir, "api", "static", "covers")
    for media_type in MediaType:
        covers_folder = os.path.join(covers_dir, f"{media_type}_covers")
        os.makedirs(covers_folder, exist_ok=True)

    # Create all tables
    db.create_all()

    def configure_sqlite(dbapi_connection, _connection_record):
        """ Configure SQLite database PRAGMA """

        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=DELETE")
        cursor.execute("PRAGMA synchronous=FULL")
        cursor.close()

    event.listen(db.engine, "connect", configure_sqlite)


def init_media_services():
    """ Init all media services """

    import inspect
    from backend.api.services import initializer
    from backend.api.services.initializer import MediaConfig

    media_configs = [
        obj for _, obj in inspect.getmembers(initializer)
        if (inspect.isclass(obj) and issubclass(obj, MediaConfig) and obj != MediaConfig)
    ]
    for config_class in media_configs:
        config_class()


def refresh_database():
    """ On app starts execute refreshing functions """

    from backend.cli.managers.media import CLIMediaManager
    from backend.cli.managers.system import CLISystemManager
    from backend.cli.managers.achievements import CLIAchievementManager

    CLIMediaManager.compute_all_time_spent()
    CLIMediaManager.compute_all_users_stats()
    CLIAchievementManager().calculate_achievements(code_names="all", user_ids="all")
    CLISystemManager().update_global_stats()


def create_app(config_class: Type[Config] = None) -> Flask:
    app = Flask(__name__, static_url_path="/api/static")

    if config_class is None:
        config_class = get_config()

    app.url_map.strict_slashes = False
    app.config.from_object(config_class)
    app.url_map.converters["jobtype"] = JobTypeConverter
    app.url_map.converters["mediatype"] = MediaTypeConverter

    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    with app.app_context():
        register_cli_commands()
        setup_app_and_db(app)
        import_blueprints(app)
        init_media_services()

        if app.config["CREATE_FILE_LOGGER"] and not sys.stdin.isatty():
            create_file_handler(app.logger, app.root_path)

        if app.config["CREATE_MAIL_HANDLER"]:
            create_mail_handler(app.logger, app.config)

        if not sys.stdin.isatty() and not app.debug:
            refresh_database()

        return app
