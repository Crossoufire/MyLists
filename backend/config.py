import os
from dotenv import load_dotenv

load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))


def as_bool(value: str) -> bool:
    if value:
        return value.lower() in ["true", "yes", "on", "1"]
    return False


class Config:
    # Debug options
    DEBUG = False
    TESTING = False
    USER_ACTIVE_PER_DEFAULT = False

    # Database option
    SQLALCHEMY_DATABASE_URI = (
            os.environ.get("MYLISTS_DATABASE_URI") or
            f"sqlite:///{os.path.join(basedir + '/instance', 'site.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security options
    SECRET_KEY = os.environ.get("SECRET_KEY", "top-secret!")
    ACCESS_TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_MINUTES") or "15")
    REFRESH_TOKEN_DAYS = int(os.environ.get("REFRESH_TOKEN_DAYS") or "7")
    RESET_TOKEN_MINUTES = int(os.environ.get("RESET_TOKEN_MINUTES") or "15")
    ADMIN_TOKEN_MINUTES = int(os.environ.get("ADMIN_TOKEN_MINUTES") or "5")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024

    # Email options
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "localhost")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or "25")
    MAIL_USE_TLS = as_bool(os.environ.get("MAIL_USE_TLS"))
    MAIL_USE_SSL = as_bool(os.environ.get("MAIL_USE_SSL"))
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

    # API keys
    THEMOVIEDB_API_KEY = os.environ.get("THEMOVIEDB_API_KEY") or None
    GOOGLE_BOOKS_API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY") or None
    CLIENT_IGDB = os.environ.get("CLIENT_IGDB") or None
    SECRET_IGDB = os.environ.get("SECRET_IGDB") or None
    IGDB_API_KEY = os.environ.get("IGDB_API_KEY") or None

    # Caching
    CACHE_TYPE = os.environ.get("CACHE_TYPE") or "FileSystemCache"
    CACHE_DIR = os.environ.get("CACHE_DIR") or os.path.join(basedir, "instance/cache")
    CACHE_THRESHOLD = os.environ.get("CACHE_THRESHOLD") or 100000

    # OAuth2
    OAUTH2_PROVIDERS = {
        # https://console.cloud.google.com/
        "google": {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "authorize_url": "https://accounts.google.com/o/oauth2/auth",
            "access_token_url": "https://accounts.google.com/o/oauth2/token",
            "scopes": ["https://www.googleapis.com/auth/userinfo.email"],
            "get_user": {
                "url": "https://www.googleapis.com/oauth2/v3/userinfo",
                "email": lambda json: json["email"],
            },
        },
        # https://github.com/settings/developers
        "github": {
            "client_id": os.environ.get("GITHUB_CLIENT_ID"),
            "client_secret": os.environ.get("GITHUB_CLIENT_SECRET"),
            "authorize_url": "https://github.com/login/oauth/authorize",
            "access_token_url": "https://github.com/login/oauth/access_token",
            "scopes": ["user:email"],
            "get_user": {
                "url": "https://api.github.com/user/emails",
                "email": lambda json: json[0]["email"],
            },
        },
    }


class DevConfig(Config):
    DEBUG = True
    ACCESS_TOKEN_MINUTES = int("99999999")
    USER_ACTIVE_PER_DEFAULT = False


class ProdConfig(Config):
    pass


class TestConfig(Config):
    TESTING = True

    # Set for using url_for in tests
    SERVER_NAME = "localhost:5000"

    CACHE_TYPE = "SimpleCache"
    USER_ACTIVE_PER_DEFAULT = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    OAUTH2_PROVIDERS = {
        "foo": {
            "client_id": "foo-id",
            "client_secret": "foo-secret",
            "authorize_url": "https://foo.com/login",
            "access_token_url": "https://foo.com/token",
            "get_user": {
                "url": "https://foo.com/current",
                "email": lambda json: json["email"],
            },
            "scopes": ["user", "email"],
        },
    }


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        return ProdConfig
    return DevConfig
