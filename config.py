import os
from dotenv import load_dotenv


basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(dotenv_path=os.path.join(basedir, '.env'))


class Config(object):
    SECRET_KEY              = os.environ.get('SECRET_KEY') or 'lets-go-guys'
    ENV                     = os.environ.get('ENV')
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    MAIL_SERVER             = os.environ.get('MAIL_SERVER')
    MAIL_USERNAME           = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD           = os.environ.get('MAIL_PASSWORD')
    THEMOVIEDB_API_KEY      = os.environ.get('THEMOVIEDB_API_KEY')
    GOOGLE_BOOKS_API_KEY    = os.environ.get('GOOGLE_BOOKS_API_KEY')
    CLIENT_IGDB             = os.environ.get('CLIENT_IGDB')
    SECRET_IGDB             = os.environ.get('SECRET_IGDB')
    CLIENT_MAL              = os.environ.get('CLIENT_MAL') # Not used yet
    SECRET_MAL              = os.environ.get('SECRET_MAL') # Not used yet
    IGDB_API_KEY            = os.environ.get('IGDB_API_KEY')
    SESSION_COOKIE_SECURE   = bool(os.environ.get('SESSION_COOKIE_SECURE'))
    MAIL_USE_SSL            = bool(os.environ.get('MAIL_USE_SSL'))
    TESTING                 = bool(os.environ.get('TESTING'))
    MAIL_PORT               = int(os.environ.get('MAIL_PORT') or 25)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 8*1024*1024
    FLASK_ADMIN_SWATCH = 'cyborg'
    MAIL_USE_TLS = False

