import os

from dotenv import load_dotenv


load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))


def as_bool(value: str) -> bool:
    if value:
        return value.lower() in ["true", "yes", "on", "1", "t", "y"]
    return False


class Config:
    DEBUG = False
    TESTING = False
    CREATE_APP_LOGGER = True
    CREATE_MAIL_HANDLER = True
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
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024

    # Email options
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "localhost")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or "25")
    MAIL_USE_TLS = as_bool(os.environ.get("MAIL_USE_TLS") or "True")
    MAIL_USE_SSL = as_bool(os.environ.get("MAIL_USE_SSL") or "False")

    # API keys
    THEMOVIEDB_API_KEY = os.environ.get("THEMOVIEDB_API_KEY")
    GOOGLE_BOOKS_API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY")
    CLIENT_IGDB = os.environ.get("CLIENT_IGDB")
    SECRET_IGDB = os.environ.get("SECRET_IGDB")
    IGDB_API_KEY = os.environ.get("IGDB_API_KEY")

    # Flask-Caching
    CACHE_TYPE = os.environ.get("CACHE_TYPE") or "RedisCache"
    CACHE_REDIS_HOST = os.environ.get("CACHE_REDIS_HOST") or "localhost"
    CACHE_REDIS_PORT = int(os.environ.get("CACHE_REDIS_PORT") or "6379")
    CACHE_REDIS_DB = int(os.environ.get("CACHE_REDIS_DB") or "0")
    CACHE_KEY_PREFIX = os.environ.get("CACHE_KEY_PREFIX") or "mylists_cache_"

    # Flask-Limiter
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI") or "redis://localhost:6379/0"
    RATELIMIT_KEY_PREFIX = os.environ.get("RATELIMIT_KEY_PREFIX") or "mylists_limiter_"

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
    CREATE_APP_LOGGER = True
    CREATE_MAIL_HANDLER = False
    USER_ACTIVE_PER_DEFAULT = False
    CACHE_TYPE = "SimpleCache"
    RATELIMIT_STORAGE_URI = "memory://"
    ACCESS_TOKEN_MINUTES = int("15")


class TestConfig(Config):
    TESTING = True
    RATELIMIT_ENABLED = False
    CREATE_APP_LOGGER = False
    CREATE_MAIL_HANDLER = False
    USER_ACTIVE_PER_DEFAULT = True
    CACHE_TYPE = "SimpleCache"
    SERVER_NAME = "localhost:5000"
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
    env = os.getenv("FLASK_ENV")
    if env == "production":
        return Config
    elif env == "testing":
        return TestConfig
    return DevConfig
