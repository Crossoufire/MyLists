from apifairy import authenticate, arguments, response, other_responses
from flask import Blueprint, abort
from backend.api.core.handlers import token_auth
from backend.api.managers.ApiManager import TMDBApiManager, GamesApiManager, BooksApiManager
from backend.api.models.users import User
from backend.api.schemas.search import *

search = Blueprint("search", __name__)


@search.route("/search/media", methods=["GET"])
@authenticate(token_auth)
@arguments(SearchSchema)
@response(ResultsSearchSchema, 200, description="Return the TMDB media search results")
@other_responses({400: "Error searching the TMDB API"})
def get_media_search(args):
    """ TMDB Media Search """

    try:
        api_manager = TMDBApiManager()
        api_manager.search(args["query"], args["page"])
        results = api_manager.format_search_results()
    except:
        return abort(400, "Error searching the TMDB API. Please try again later.")

    return results


@search.route("/search/games", methods=["GET"])
@authenticate(token_auth)
@arguments(SearchSchema)
@response(ResultsSearchSchema, 200, description="Return the IGDB games search results")
@other_responses({400: "Error searching the IGDB API"})
def get_games_search(args):
    """ IGDB Games Search """

    try:
        api_manager = GamesApiManager()
        api_manager.search(args["query"], args["page"])
        results = api_manager.format_search_results()
    except Exception:
        return abort(400, "Error searching the IGDB API. Please try again later.")

    return results


@search.route("/search/books", methods=["GET"])
@authenticate(token_auth)
@arguments(SearchSchema)
@response(ResultsSearchSchema, 200, description="Return the Google books search results")
@other_responses({400: "Error searching the Google Books API"})
def get_books_search(args):
    """ Google Books Search """

    try:
        api_manager = BooksApiManager()
        api_manager.search(args["query"], args["page"])
        results = api_manager.format_search_results()
    except Exception:
        return abort(400, "Error searching the Google Books API. Please try again later.")

    return results


@search.route("/search/users", methods=["GET"])
@authenticate(token_auth)
@arguments(SearchSchema)
@response(ResultsUserSearchSchema, 200, description="Return the users search results")
@other_responses({400: "Error searching the MyLists Database"})
def get_users_search(args):
    """ User Search """

    try:
        users = (
            User.query.filter(User.username.ilike(f"%{args['query']}%"), User.active == True)
            .paginate(page=args["page"], per_page=8, error_out=True)
        )
        users_list = [dict(
            name=user.username,
            image_cover=user.profile_image,
            date=user.registered_on.strftime("%d %b %Y"),
            media_type="User"
        ) for user in users.items]
    except Exception:
        return abort(400, "Error searching the MyLists Database. Please try again later.")

    return dict(items=users_list, total=users.total, pages=users.pages)
