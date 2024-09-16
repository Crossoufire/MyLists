from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from werkzeug.local import LocalProxy


basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth()

# Local proxy: make <current_user> available globally
current_user = LocalProxy(lambda: token_auth.current_user())
