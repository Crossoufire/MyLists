from __future__ import annotations

import os

from dotenv import load_dotenv


load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))
default_db_uri = f"sqlite:///{os.path.join(basedir, 'instance', 'site.db')}"


def as_bool(value: str) -> bool:
    if value:
        return value.lower() in ["true", "yes", "on", "1", "t", "y"]
    return False


class Config:
    # Flask options
    DEBUG = False
    TESTING = False

    # Handlers options
    CREATE_FILE_LOGGER = True
    CREATE_MAIL_HANDLER = True

    # SQLite options
    SQLITE_JOURNAL_MODE = "WAL"
    SQLITE_SYNCHRONOUS = "NORMAL"

    # Database options
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"timeout": 20}}
    SQLALCHEMY_DATABASE_URI = (os.environ.get("MYLISTS_DATABASE_URI") or default_db_uri)

    # Security options
    USER_ACTIVE_PER_DEFAULT = False
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024
    SECRET_KEY = os.environ.get("SECRET_KEY", "top-secret!")
    REFRESH_TOKEN_DAYS = int(os.environ.get("REFRESH_TOKEN_DAYS") or "7")
    RESET_TOKEN_MINUTES = int(os.environ.get("RESET_TOKEN_MINUTES") or "15")
    ACCESS_TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_MINUTES") or "15")

    # Admin e-mail options
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or "25")
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "localhost")
    MAIL_USE_TLS = as_bool(os.environ.get("MAIL_USE_TLS") or "True")
    MAIL_USE_SSL = as_bool(os.environ.get("MAIL_USE_SSL") or "False")

    # Media API keys
    CLIENT_IGDB = os.environ.get("CLIENT_IGDB")
    SECRET_IGDB = os.environ.get("SECRET_IGDB")
    IGDB_API_KEY = os.environ.get("IGDB_API_KEY")
    THEMOVIEDB_API_KEY = os.environ.get("THEMOVIEDB_API_KEY")
    GOOGLE_BOOKS_API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY")

    # Flask-Caching
    CACHE_TYPE = os.environ.get("CACHE_TYPE") or "RedisCache"
    CACHE_REDIS_DB = int(os.environ.get("CACHE_REDIS_DB") or "0")
    CACHE_REDIS_HOST = os.environ.get("CACHE_REDIS_HOST") or "localhost"
    CACHE_REDIS_PORT = int(os.environ.get("CACHE_REDIS_PORT") or "6379")
    CACHE_KEY_PREFIX = os.environ.get("CACHE_KEY_PREFIX") or "mylists_cache_"

    # Flask-Limiter
    RATELIMIT_KEY_PREFIX = os.environ.get("RATELIMIT_KEY_PREFIX") or "mylists_limiter_"
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI") or "redis://localhost:6379/0"

    # Demo Profile options
    DEMO_EMAIL = "demo@demo.com"
    DEMO_USERNAME = "DemoProfile"
    DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD") or "demo-password"

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
    # Flask options
    DEBUG = True
    TESTING = False

    # Handlers options
    CREATE_FILE_LOGGER = False
    CREATE_MAIL_HANDLER = False

    # SQLite options
    SQLITE_JOURNAL_MODE = "DELETE"
    SQLITE_SYNCHRONOUS = "FULL"

    # Security options
    USER_ACTIVE_PER_DEFAULT = False
    ACCESS_TOKEN_MINUTES = int("15")

    # Flask-Caching
    CACHE_TYPE = "SimpleCache"

    # Flask-Limiter
    RATELIMIT_STORAGE_URI = "memory://"


class TestConfig(Config):
    # Flask options
    DEBUG = False
    TESTING = True
    SERVER_NAME = "localhost:5000"

    # Handlers options
    CREATE_FILE_LOGGER = False
    CREATE_MAIL_HANDLER = False

    # Database options
    SQLALCHEMY_DATABASE_URI = "sqlite://"

    # Security options
    USER_ACTIVE_PER_DEFAULT = True

    # Flask-Caching
    CACHE_TYPE = "SimpleCache"

    # Flask-Limiter
    RATELIMIT_ENABLED = False

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
    """ Get the config class based on the FLASK_ENV environment variable or default to Config (production) """

    env = os.getenv("FLASK_ENV", "production").lower()
    if env == "development":
        return DevConfig
    elif env == "testing":
        return TestConfig

    return Config
