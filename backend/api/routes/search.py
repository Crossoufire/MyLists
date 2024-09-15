from flask import Blueprint, jsonify

from backend.api.core.auth import token_auth
from backend.api.managers.ApiManager import TMDBApiManager, GamesApiManager, BooksApiManager
from backend.api.models.user import User
from backend.api.schemas.search import SearchSchema
from backend.api.utils.decorators import arguments


search_bp = Blueprint("api_search", __name__)


@search_bp.route("/autocomplete", methods=["GET"])
@token_auth.login_required
@arguments(SearchSchema)
def autocomplete(args):
    """ Autocomplete search route for media searching """

    if args["selector"] == "users":
        results = User.create_search_results(args["q"], args["page"])
        return jsonify(data=results), 200

    if args["selector"] == "TMDB":
        api_manager = TMDBApiManager()
    elif args["selector"] == "IGDB":
        api_manager = GamesApiManager()
    else:
        api_manager = BooksApiManager()

    api_manager.search(args["q"], args["page"])
    results = api_manager.create_search_results()
    results["page"] = args["page"]

    return jsonify(data=results), 200
