import os
import sys
import logging
from typing import Type
from logging.handlers import SMTPHandler, RotatingFileHandler

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


def create_file_handler(app: Flask):
    """ Create a RotatingFileHandler """

    import socket
    import platform

    log_file_path = os.path.join(os.path.dirname(app.root_path), "logs", "mylists.log")
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    env = os.getenv("FLASK_ENV", "production").lower() or "production"

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    app.logger.info(
        f"MyLists starting up... "
        f"[ENV: {env}, DEBUG: {app.debug}, Python: {platform.python_version()}, Host: {socket.gethostname()}]"
    )


def create_mail_handler(app: Flask):
    """ Create a TLS only mail handler set on ERRORS added to the app logger """

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


def setup_app_and_db(app: Flask):
    """
    On app starts:
    - Create `instance` folder if default db location used
    - Add media type covers folder if they don't exist
    - Create all the tables
    - Set up the pragmas for SQLite
    - Initialize the media services
    - Refresh and update the database (only in production)
    """

    import inspect
    from sqlalchemy import text
    from backend.api.services import initializer
    from backend.cli.managers.media import CLIMediaManager
    from backend.api.services.initializer import MediaConfig
    from backend.cli.managers.system import CLISystemManager
    from backend.cli.managers.achievements import CLIAchievementManager

    # Ensure `instance` folder exists if default db location used
    if app.config["SQLALCHEMY_DATABASE_URI"] == default_db_uri:
        instance_folder = os.path.join(basedir, "instance")
        os.makedirs(instance_folder, exist_ok=True)

    # Add media type covers folder if not exists
    covers_dir = os.path.join(basedir, "api", "static", "covers")
    for media_type in MediaType:
        covers_folder = os.path.join(covers_dir, f"{media_type}_covers")
        os.makedirs(covers_folder, exist_ok=True)

    # Configure SQLite database PRAGMA
    engine = db.session.get_bind()
    with engine.connect() as conn:
        pragmas_values = [app.config["SQLITE_JOURNAL_MODE"], app.config["SQLITE_SYNCHRONOUS"]]
        pragmas_to_check = ["journal_mode", "synchronous"]
        for pn, pv in zip(pragmas_to_check, pragmas_values):
            conn.execute(text(f"PRAGMA {pn}={pv}"))
            value = conn.execute(text(f"PRAGMA {pn}")).scalar()
            if app.config["CREATE_FILE_LOGGER"]:
                app.logger.info(f"SQLITE PRAGMA {pn.upper()}: {value.upper() if isinstance(value, str) else value}")

    # Create all tables
    db.create_all()

    # Initialize all media services
    media_configs = [
        obj for _, obj in inspect.getmembers(initializer)
        if (inspect.isclass(obj) and issubclass(obj, MediaConfig) and obj != MediaConfig)
    ]
    for config_class in media_configs:
        config_class()

    # Refresh database on app starts but not when using CLI or in dev mode
    if not sys.stdin.isatty() and not app.debug:
        CLIMediaManager.compute_all_time_spent()
        CLIMediaManager.compute_all_users_stats()
        CLIAchievementManager().calculate_achievements(code_names="all", user_ids="all")
        CLISystemManager().update_global_stats()


def create_app(config_class: Type[Config] = None) -> Flask:
    app = Flask(__name__, static_url_path="/api/static")

    # Configure app
    app.url_map.strict_slashes = False
    app.config.from_object(config_class or get_config())
    app.url_map.converters["jobtype"] = JobTypeConverter
    app.url_map.converters["mediatype"] = MediaTypeConverter

    # Initialize extensions
    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    # Setup app and db
    with app.app_context():
        # No logs in terminal when using CLI
        if app.config["CREATE_FILE_LOGGER"] and not sys.stdin.isatty():
            create_file_handler(app)

        if app.config["CREATE_MAIL_HANDLER"]:
            create_mail_handler(app)

        register_cli_commands()
        setup_app_and_db(app)
        import_blueprints(app)

    return app
