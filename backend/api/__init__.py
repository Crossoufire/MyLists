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
from backend.config import Config


mail = Mail()
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cache = Cache()
cors = CORS()


def _import_blueprints(app: Flask):
    """ Import and register the blueprints for the app """

    from backend.api.routes.tokens import tokens as api_tokens_bp
    from backend.api.routes.users import users as api_users_bp
    from backend.api.routes.media import media_bp as api_media_bp
    from backend.api.routes.search import search_bp as api_search_bp
    from backend.api.routes.general import general as api_general_bp
    from backend.api.routes.errors import errors as api_errors_bp
    from backend.api.routes.admin import admin_bp as api_admin_bp
    from backend.api.routes.details import details_bp as api_details_bp
    from backend.api.routes.lists import lists_bp as api_lists_bp
    from backend.api.routes.labels import labels_bp as api_labels_bp

    api_blueprints = [api_tokens_bp, api_users_bp, api_media_bp, api_search_bp, api_general_bp, api_errors_bp,
                      api_admin_bp, api_details_bp, api_lists_bp, api_labels_bp]

    for blueprint in api_blueprints:
        app.register_blueprint(blueprint, url_prefix="/api")


def _create_app_logger(app: Flask):
    """ Create an app logger registering the INFO, WARNING, and ERRORS for the app """

    log_file_path = f"{os.path.abspath(os.path.dirname(__file__))}/static/log/mylists.log"

    if not os.path.exists(log_file_path):
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        with open(log_file_path, "a"):
            pass

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.logger.info("MyLists is starting up...")


def _create_mail_handler(app: Flask):
    """ Create a mail handler (TLS only) associated with the app logger: send email when errors occurs """

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


def _create_first_db_data():
    """ Create all DB tables the first time and add the first data to the DB """

    from backend.api.models.user_models import User
    from backend.api.utils.scheduled_tasks import compute_media_time_spent
    from backend.api.models.utils_models import Ranks, Frames

    # Create all DB tables - does not update existing tables
    db.create_all()

    # Create an <admin> if no user in DB
    if User.query.filter_by(id=1).first() is None:
        admin = User(
            username="admin",
            email="admin@admin.com",
            password=bcrypt.generate_password_hash("password").decode("utf-8"),
            active=True,
            registered_on=datetime.utcnow(),
            activated_on=datetime.utcnow(),
            role=RoleType.ADMIN,
        )

        db.session.add(admin)
        db.session.commit()

    Ranks.update_db_ranks()
    Frames.update_db_frames()
    compute_media_time_spent()
    db.session.commit()


def create_app(config_class: Type[Config] = Config) -> Flask:
    app = Flask(__name__, static_url_path="/api/static")
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    with app.app_context():
        _import_blueprints(app)

        if not app.debug and not app.testing:
            _create_app_logger(app)
            _create_mail_handler(app)

        from backend.api.utils.scheduled_tasks import add_cli_commands
        add_cli_commands()

        return app


# Needed for import problems
from backend.api.models.books_models import *
from backend.api.models.games_models import *
from backend.api.models.movies_models import *
from backend.api.models.tv_models import *
from backend.api.models.user_models import *
from backend.api.models.utils_models import *
