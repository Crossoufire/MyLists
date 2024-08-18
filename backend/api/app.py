import logging
import os
from logging.handlers import SMTPHandler, RotatingFileHandler
from typing import Type
from flask import Flask, render_template, redirect, url_for, current_app
from flask_admin import Admin
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_cors import CORS
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from backend.api.core.admin import init_crud_admin
from backend.api.core.middleware import LoggingMiddleware
from backend.config import Config, get_config
from backend.my_apifairy import APIFairy


# Load globally accessible plugins
mail = Mail()
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cache = Cache()
cors = CORS()
fairy = APIFairy()
ma = Marshmallow()
admin = Admin(name="MyLists Admin Panel", template_mode="bootstrap4")


def import_blueprints(app: Flask):
    from backend.api.routes.auth import auth as auth_bp
    from backend.api.routes.user import user as user_bp
    from backend.api.routes.media import media as media_bp
    from backend.api.routes.search import search as search_bp
    from backend.api.routes.general import general as general_bp
    from backend.api.core.errors import errors as errors_bp
    from backend.api.routes.lists import lists as lists_bp

    api_blueprints = [auth_bp, user_bp, media_bp, search_bp, general_bp, errors_bp, lists_bp]

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
    """ Create a mail handler (TLS only) associated with the app logger. Send email when errors occurs """

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


def init_api_fairy_routes(app: Flask):
    @app.route("/")
    def index():
        return redirect(url_for("apifairy_docs"))

    @app.route("/docs")
    def apifairy_docs():
        return render_template(
            "elements.html",
            title=current_app.config["APIFAIRY_TITLE"],
            version=current_app.config["APIFAIRY_VERSION"],
        )


def create_app(config_class: Type[Config] = None) -> Flask:
    app = Flask(__name__)
    app.wsgi_app = LoggingMiddleware(app.wsgi_app)

    if config_class is None:
        config_class = get_config()

    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    mail.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    cache.init_app(app)
    ma.init_app(app)
    fairy.init_app(app)
    admin.init_app(app)
    migrate.init_app(app, db, compare_type=False, render_as_batch=True)
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    with app.app_context():
        import_blueprints(app)

        db.create_all()

        if not app.debug and not app.testing:
            init_crud_admin(admin)
            create_app_logger(app)
            create_mail_handler(app)

        init_api_fairy_routes(app)

        from backend.cli.commands import init_cli_commands
        init_cli_commands()

        return app
