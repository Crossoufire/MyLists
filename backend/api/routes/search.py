from flask import Blueprint, request, jsonify, abort, current_app
from backend.api.core.handlers import token_auth
from backend.api.managers.ApiManager import TMDBApiManager, GamesApiManager, BooksApiManager
from backend.api.models.user import User

search_bp = Blueprint("api_search", __name__)


@search_bp.route("/autocomplete", methods=["GET"])
@token_auth.login_required
def autocomplete():
    """ Autocomplete search route for media searching """

    search = request.args.get("q")
    selector = request.args.get("selector")
    page = request.args.get("page", 1, type=int)

    if selector == "users":
        try:
            results = User.create_search_results(search, page=page)
        except Exception as e:
            current_app.logger.error(f"[ERROR] - Requesting the database: {e}")
            return abort(400)
        return jsonify(data=results), 200

    if selector == "TMDB":
        Api_data = TMDBApiManager()
    elif selector == "IGDB":
        Api_data = GamesApiManager()
    elif selector == "BOOKS":
        Api_data = BooksApiManager()
    else:
        return abort(400, "Selector not recognized")

    try:
        Api_data.search(search, page)
        results = Api_data.create_search_results()
    except Exception as e:
        current_app.logger.error(f"[ERROR] - Requesting the API ({Api_data.__class__.__name__}): {e}")
        return abort(400)

    return jsonify(data=results), 200
