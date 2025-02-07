from typing import Dict

from flask import Blueprint, jsonify

from backend.api.models.user import User
from backend.api import limiter, MediaType
from backend.api.core.security import token_auth
from backend.api.utils.decorators import arguments
from backend.api.schemas.search import SearchSchema
from backend.api.utils.functions import global_limiter
from backend.api.services.api.service import ApiService
from backend.api.services.api.factory import ApiServiceFactory


search_bp = Blueprint("api_search", __name__)
api_s_factory = ApiServiceFactory


def process_api_search(api_service: ApiService, args: Dict):
    """ Processes the search results """
    results = api_service.search(args["q"], args["page"])
    results["page"] = args["page"]
    return jsonify(data=results), 200


@search_bp.route("/search/users", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
def search_users(args):
    """ Autocomplete search route for users """
    results = User.search(args["q"], args["page"])
    return jsonify(data=results), 200


@search_bp.route("/search/tmdb", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("40/second", key_func=global_limiter)
def search_tmdb(args):
    """ Autocomplete search route for TMDB (MediaType.SERIES, MediaType.ANIME, MediaType.MOVIE) """
    api_service = api_s_factory.create(MediaType.SERIES)
    return process_api_search(api_service, args)


@search_bp.route("/search/igdb", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("4/second", key_func=global_limiter)
def search_igdb(args):
    """ Autocomplete search route for IGDB """
    api_service = api_s_factory.create(MediaType.GAMES)
    return process_api_search(api_service, args)


@search_bp.route("/search/books", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("5/second", key_func=global_limiter)
def search_books(args):
    """ Autocomplete search route for books """
    api_service = api_s_factory.create(MediaType.BOOKS)
    return process_api_search(api_service, args)


@search_bp.route("/search/manga", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
@limiter.limit("3/second;60/minute", key_func=global_limiter)
def search_manga(args):
    """ Autocomplete search route for manga """
    api_service = api_s_factory.create(MediaType.MANGA)
    return process_api_search(api_service, args)
