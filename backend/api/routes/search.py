from flask import Blueprint, jsonify, abort, current_app
from backend.api.core.handlers import token_auth
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
        try:
            results = User.create_search_results(args["q"], args["page"])
        except Exception as e:
            current_app.logger.error(f"[ERROR] - Requesting the database: {e}")
            return abort(400)
        return jsonify(data=results), 200

    if args["selector"] == "TMDB":
        Api_data = TMDBApiManager()
    elif args["selector"] == "IGDB":
        Api_data = GamesApiManager()
    elif args["selector"] == "BOOKS":
        Api_data = BooksApiManager()
    else:
        return abort(400, "Selector not recognized")

    try:
        Api_data.search(args["q"], args["page"])
        results = Api_data.create_search_results()
    except Exception as e:
        current_app.logger.error(f"[ERROR] - Requesting the API ({Api_data.__class__.__name__}): {e}")
        return abort(400)

    return jsonify(data=results), 200
