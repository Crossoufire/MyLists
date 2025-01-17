from flask import jsonify, Blueprint, abort, request

from backend.api import db, cache
from backend.api.schemas.lists import *
from backend.api.models.user import User
from backend.api.utils.enums import MediaType
from backend.api.core import token_auth, current_user
from backend.api.utils.decorators import arguments, check_authorization
from backend.api.calculators.stats.stats import MediaStatsService
from backend.api.managers.ListQueryManager import ListQueryManager, ListFiltersManager, SmallListFiltersManager
from backend.api.utils.functions import make_cache_key


lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required(optional=True)
@check_authorization
@arguments(MediaListSchema)
def media_list(user: User, args, media_type: MediaType):
    """ Fetch the list of media for a user """

    if not user.get_media_setting(media_type).active:
        return abort(404, description="MediaType not activated")

    if current_user:
        current_user.set_view_count(user, media_type)

    media_data, pagination = ListQueryManager(user, media_type, args).return_results()
    db.session.commit()

    data = dict(
        user_data=user.to_dict(),
        media_type=media_type.value,
        media_data=media_data,
        pagination=pagination,
    )

    return jsonify(data=data), 200


@lists_bp.route("/list/filters/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required(optional=True)
@check_authorization
def media_list_filters(user: User, media_type: MediaType):
    """ Fetch the list of filters for a user """

    if not user.get_media_setting(media_type).active:
        return abort(404, description="MediaType not activated")

    filters = SmallListFiltersManager(user, media_type).return_filters()

    return jsonify(data=filters), 200


@lists_bp.route("/list/search/filters/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required(optional=True)
@check_authorization
@arguments(MediaListSearchSchema)
def media_list_search_filters(user: User, args, media_type: MediaType):
    """ Fetch the list of search filters for a user """

    filters = ListFiltersManager(user, media_type, args).return_filters()

    return jsonify(data=filters), 200


@lists_bp.route("/stats/<username>", methods=["GET"])
@token_auth.login_required(optional=True)
@check_authorization
@cache.cached(timeout=3600, key_prefix=make_cache_key)
def stats_page(user: User):
    """ Fetch the stats page for a user """

    try:
        media_type = MediaType(request.args.get("mt"))
    except:
        media_type = None

    stats = MediaStatsService().get_stats(user, media_type)
    stats["rating_system"] = user.rating_system

    data = dict(
        stats=stats,
        settings=[setting.to_dict() for setting in user.settings if setting.active],
    )

    return jsonify(data=data), 200
