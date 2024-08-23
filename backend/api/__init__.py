import logging
import os
from logging.handlers import SMTPHandler, RotatingFileHandler
from typing import Type
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_cors import CORS
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from backend.api.utils.enums import RoleType
from backend.config import Config, get_config


# Load globally accessible plugins
mail = Mail()
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cache = Cache()
cors = CORS()


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


def create_app_logger(app: Flask):
    log_file_path = os.path.join(os.path.dirname(app.root_path), "logs", "mylists.log")

    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
    if not os.path.exists(log_file_path):
        with open(log_file_path, "a"):
            pass

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.logger.info("MyLists is starting up...")


def create_mail_handler(app: Flask):
    """ Create a TLS only mail handler associated with the app logger: send email when errors occurs """

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


def init_stats_and_time_spent():
    from backend.cli.tasks import compute_media_time_spent, update_Mylists_stats
    compute_media_time_spent()
    update_Mylists_stats()


def create_app(config_class: Type[Config] = None) -> Flask:
    app = Flask(__name__, static_url_path="/api/static")

    if config_class is None:
        config_class = get_config()

    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    with app.app_context():
        import_blueprints(app)

        db.create_all()

        if not app.debug and not app.testing:
            create_app_logger(app)
            create_mail_handler(app)
            init_stats_and_time_spent()

        from backend.cli.commands import create_cli_commands
        create_cli_commands()

        return app
