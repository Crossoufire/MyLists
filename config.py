import os
from dotenv import load_dotenv
import ast


basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(dotenv_path=os.path.join(basedir, '.env'))


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI') or 'sqlite:///site.db'

    MAIL_SERVER             = os.environ.get('MAIL_SERVER') or None
    MAIL_USERNAME           = os.environ.get('MAIL_USERNAME') or None
    MAIL_PASSWORD           = os.environ.get('MAIL_PASSWORD') or None
    MAIL_USE_SSL            = ast.literal_eval(os.environ.get('MAIL_USE_SSL')) or True
    MAIL_USE_TLS            = ast.literal_eval(os.environ.get('MAIL_USE_TLS')) or False
    MAIL_PORT               = int(os.environ.get('MAIL_PORT')) or 25

    THEMOVIEDB_API_KEY      = os.environ.get('THEMOVIEDB_API_KEY') or None
    GOOGLE_BOOKS_API_KEY    = os.environ.get('GOOGLE_BOOKS_API_KEY') or None
    CLIENT_IGDB             = os.environ.get('CLIENT_IGDB') or None
    SECRET_IGDB             = os.environ.get('SECRET_IGDB') or None
    IGDB_API_KEY            = os.environ.get('IGDB_API_KEY') or None

    SECRET_KEY              = os.environ.get('SECRET_KEY') or 'lets-go-guys'
    ENV                     = os.environ.get('ENV') or 'development'
    SESSION_COOKIE_NAME     = os.environ.get('SESSION_COOKIE_NAME') or 'MyLists'
    SESSION_COOKIE_HTTPONLY = ast.literal_eval(os.environ.get('SESSION_COOKIE_HTTPONLY')) or True
    SESSION_COOKIE_SECURE   = ast.literal_eval(os.environ.get('SESSION_COOKIE_SECURE')) or False
    TESTING                 = ast.literal_eval(os.environ.get('TESTING')) or True

    # CLIENT_MAL            = ast.literal_eval(os.environ.get('CLIENT_MAL')) or None  # Not used yet
    # SECRET_MAL            = ast.literal_eval(os.environ.get('SECRET_MAL')) or None  # Not used yet

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 8*1024*1024
    FLASK_ADMIN_SWATCH = 'cyborg'

    def __init__(self):
        if self.ENV == 'Production':
            print('** You are using: Production mode')
        if self.SQLALCHEMY_DATABASE_URI is None:
            print('**!** Careful: No url given to a database')
        if self.MAIL_SERVER is None or self.MAIL_PASSWORD is None or self.MAIL_USERNAME is None:
            print('**!** Careful: Mail badly configured')
        if self.THEMOVIEDB_API_KEY is None:
            print('**!** Careful: TMDB api key not set')
        if self.GOOGLE_BOOKS_API_KEY is None:
            print('**!** Careful: Google api key not set')
        if self.CLIENT_IGDB is None or self.SECRET_IGDB is None or self.IGDB_API_KEY is None:
            print('**!** Careful: IGDB api badly configured')
