from flask import g
from werkzeug.local import LocalProxy
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth


basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth()

# Local proxy: make <current_user> available globally
current_user = LocalProxy(lambda: token_auth.current_user())


def set_current_user(user):
    """ Manually set the current user - useful for accessing `current_user` only functions """
    g.flask_httpauth_user = user
