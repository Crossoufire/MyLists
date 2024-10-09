from flask import jsonify, Blueprint, abort

from backend.api import db, cache
from backend.api.models.user import User
from backend.api.core import token_auth, current_user
from backend.api.managers.ListQueryManager import ListQueryManager, ListFiltersManager, SmallListFiltersManager
from backend.api.schemas.lists import *
from backend.api.utils.decorators import arguments, check_authorization
from backend.api.utils.enums import MediaType
from backend.api.managers.StatsManager import StatsManager


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


@lists_bp.route("/stats/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required(optional=True)
@check_authorization
@cache.cached(timeout=3600)
def stats_page(user: User, media_type: MediaType):
    """ Fetch the stats page for a user """

    stats_manager = StatsManager.get_subclass(media_type)
    stats = stats_manager(user).create_stats()

    data = dict(
        stats=stats,
        is_feeling=user.add_feeling,
        is_current=(user.id == current_user.id) if current_user else False,
        users=[{"label": user.username, "value": user.username} for user in User.query.filter(User.active.is_(True)).all()]
    )

    return jsonify(data=data), 200
