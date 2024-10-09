import logging
from logging.handlers import SMTPHandler, RotatingFileHandler
import os
from typing import Type
import sys

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

    api_blueprints = [tokens_bp, users_bp, media_bp, search_bp, general_bp, errors_bp, details_bp, lists_bp, labels_bp]

    for blueprint in api_blueprints:
        app.register_blueprint(blueprint, url_prefix="/api")


def create_file_handler(app: Flask):
    """ Create a File Handler depending on the environment and config """

    # `sys.stdin.isatty()` check if app running in terminal (CLI)
    if not app.config["CREATE_FILE_LOGGER"] or sys.stdin.isatty():
        return

    log_file_path = os.path.join(os.path.dirname(app.root_path), "logs", "mylists.log")
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    app.logger.addHandler(handler)
    app.logger.info("MyLists is starting up...")


def create_mail_handler(app: Flask):
    """ Create a TLS only mail handler for the app logger which send email when errors occurs """

    if not app.config["CREATE_MAIL_HANDLER"]:
        return

    mail_handler = SMTPHandler(
        mailhost=(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]),
        fromaddr=app.config["MAIL_USERNAME"],
        toaddrs=app.config["MAIL_USERNAME"],
        subject="MyLists - Exceptions occurred",
        credentials=(app.config["MAIL_USERNAME"], app.config["MAIL_PASSWORD"]),
        secure=(),
    )

    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)


def refresh_database(app: Flask):
    """ In production: refresh global stats and time spent when app starts """

    # Pass when using Flask CLI
    if sys.stdin.isatty() or app.debug:
        return

    from backend.cli.managers.media_manager import CLIMediaManager
    CLIMediaManager.compute_all_time_spent()

    from backend.cli.managers.system_manager import CLISystemManager
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
        "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4173", "http://127.0.0.1:4173"
    ])

    with app.app_context():
        import_blueprints(app)

        db.create_all()

        create_file_handler(app)
        create_mail_handler(app)
        register_cli_commands(app)
        refresh_database(app)

        return app
