from flask import Blueprint, jsonify

from backend.api import limiter
from backend.api.core.auth import token_auth
from backend.api.managers.ApiManager import TMDBApiManager, GamesApiManager, BooksApiManager
from backend.api.models.user import User
from backend.api.schemas.search import SearchSchema
from backend.api.utils.decorators import arguments
from backend.api.utils.functions import global_limiter


search_bp = Blueprint("api_search", __name__)


def process_api_search(api_manager, args):
    api_manager.search(args["q"], args["page"])
    results = api_manager.create_search_results()
    results["page"] = args["page"]
    return jsonify(data=results), 200


@search_bp.route("/search/users", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
def search_users(args):
    """ Autocomplete search route for users """
    results = User.create_search_results(args["q"], args["page"])
    return jsonify(data=results), 200


@search_bp.route("/search/tmdb", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("40/second", key_func=global_limiter)
def search_tmdb(args):
    """ Autocomplete search route for TMDB """
    api_manager = TMDBApiManager()
    return process_api_search(api_manager, args)


@search_bp.route("/search/igdb", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("4/second", key_func=global_limiter)
def search_igdb(args):
    """ Autocomplete search route for IGDB """
    api_manager = GamesApiManager()
    return process_api_search(api_manager, args)


@search_bp.route("/search/books", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("5/second", key_func=global_limiter)
def search_books(args):
    """ Autocomplete search route for books """
    api_manager = BooksApiManager()
    return process_api_search(api_manager, args)
