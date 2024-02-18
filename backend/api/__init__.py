import logging
import os
from logging.handlers import SMTPHandler, RotatingFileHandler
from flask import Flask
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_cors import CORS
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from backend.config import Config


# Globally accessible Flask modules
config = Config()
mail = Mail()
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cache = Cache()
cors = CORS()


def _import_blueprints(app: Flask):
    """ Import and register blueprints to the app """

    # Import API blueprints
    from backend.api.routes.tokens import tokens as api_tokens_bp
    from backend.api.routes.users import users as api_users_bp
    from backend.api.routes.media import media_bp as api_media_bp
    from backend.api.routes.search import search_bp as api_search_bp
    from backend.api.routes.general import general as api_general_bp
    from backend.api.routes.errors import errors as api_errors_bp
    from backend.api.routes.admin import admin_bp as api_admin_bp
    from backend.api.routes.details import details_bp as api_details_bp
    from backend.api.routes.lists import lists_bp as api_lists_bp

    # Blueprints list
    api_blueprints = [api_tokens_bp, api_users_bp, api_media_bp, api_search_bp, api_general_bp, api_errors_bp,
                      api_admin_bp, api_details_bp, api_lists_bp]

    # Register blueprints
    for blueprint in api_blueprints:
        app.register_blueprint(blueprint, url_prefix="/api")


def _create_app_logger(app: Flask):
    """ Create an app logger and an <SSL_SMTPHandler> class for sending errors to the admin """

    log_file_path = "MyLists/static/log/mylists.log"

    # Check if log file exists, if not, create it
    if not os.path.exists(log_file_path):
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        open(log_file_path, "w").close()

    handler = RotatingFileHandler(log_file_path, maxBytes=3000000, backupCount=15)
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s"))
    handler.setLevel(logging.INFO)

    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.logger.info("MyLists is starting up...")


def _create_mail_handler(app: Flask):
    """ Create a mail handler (TSL only) associated with the app logger, which send an email when an error occurs """

    mail_handler = SMTPHandler(
        mailhost=(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]),
        fromaddr=app.config["MAIL_USERNAME"],
        toaddrs=app.config["MAIL_USERNAME"],
        subject="MyLists - Exceptions occurred",
        credentials=(app.config["MAIL_USERNAME"], app.config["MAIL_PASSWORD"]),
        secure=(),
    )

    # Set logger level to <ERROR> only
    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)


# def _create_first_db_data():
#     """ Create all the db tables the first time and add the first data to the database """
#
#     from MyLists.models.user_models import User
#     from datetime import datetime
#     from MyLists.utils.scheduled_tasks import compute_media_time_spent
#     from MyLists.models.utils_models import Badges, Ranks
#
#     # Create all DB tables - does not update existing tables
#     db.create_all()
#
#     # Create an <admin>, a <manager> and a <user> if <admin> does not exist
#     if User.query.filter_by(id="1").first() is None:
#         admin1 = User(
#             username="admin",
#             email="admin@admin.com",
#             password=bcrypt.generate_password_hash("password").decode("utf-8"),
#             active=True,
#             private=True,
#             registered_on=datetime.utcnow(),
#             activated_on=datetime.utcnow(),
#             role=RoleType.ADMIN,
#         )
#         manager1 = User(
#             username="manager",
#             email="manager@manager.com",
#             password=bcrypt.generate_password_hash("password").decode("utf-8"),
#             active=True,
#             registered_on=datetime.utcnow(),
#             activated_on=datetime.utcnow(),
#             role=RoleType.MANAGER,
#         )
#         user1 = User(
#             username="user",
#             email="user@user.com",
#             password=bcrypt.generate_password_hash("password").decode("utf-8"),
#             active=True,
#             registered_on=datetime.utcnow(),
#             activated_on=datetime.utcnow(),
#         )
#
#         db.session.add_all([admin1, manager1, user1])
#
#         Badges.add_badges_to_db()
#         Ranks.add_ranks_to_db()
#
#     # Refresh badges, ranks and compute time spent for each user
#     Badges.refresh_db_badges()
#     Ranks.refresh_db_ranks()
#     compute_media_time_spent()
#
#     # Commit changes
#     db.session.commit()


def init_app() -> Flask:
    """ Initialize the core application """

    # Fetch Flask app name (.flaskenv) and check config from <.env> file
    app = Flask(__name__, static_url_path="/api/static")
    app.config.from_object(config)
    app.url_map.strict_slashes = False

    value = bcrypt.generate_password_hash("ze25zg746zgùgzùvz*ùz8v55LG%D£¨%£").decode("utf-8"),
    print(value)

    # Initialize modules
    mail.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    bcrypt.init_app(app)
    cache.init_app(app)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    with app.app_context():
        _import_blueprints(app)

        if app.debug is False:
            _create_app_logger(app)
            _create_mail_handler(app)

        from backend.api.utils.scheduled_tasks import add_cli_commands
        add_cli_commands()

        return app
