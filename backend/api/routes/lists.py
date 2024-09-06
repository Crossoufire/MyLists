from flask import jsonify, Blueprint, abort
from backend.api import db, cache
from backend.api.models.user import User
from backend.api.core import token_auth, current_user
from backend.api.managers.ListQueryManager import ListQueryManager, ListFiltersManager, SmallListFiltersManager
from backend.api.schemas.lists import *
from backend.api.utils.decorators import arguments
from backend.api.utils.enums import MediaType
from backend.api.managers.StatsManager import StatsManager


lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required
@arguments(MediaListSchema)
def media_list(args, media_type: MediaType, username: str):
    user = current_user.check_autorization(username)

    if not user.get_media_setting(media_type).active:
        return abort(404)

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
@token_auth.login_required
def media_list_filters(media_type: MediaType, username: str):
    user = current_user.check_autorization(username)
    filters = SmallListFiltersManager(user, media_type).return_filters()
    return jsonify(data=filters), 200


@lists_bp.route("/list/search/filters/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required
@arguments(MediaListSearchSchema)
def media_list_search_filters(args, media_type: MediaType, username: str):
    user = current_user.check_autorization(username)
    filters = ListFiltersManager(user, media_type, args).return_filters()
    return jsonify(data=filters), 200


@lists_bp.route("/stats/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required
@cache.cached(timeout=3600)
def stats_page(media_type: MediaType, username: str):

    user = current_user.check_autorization(username)
    stats_manager = StatsManager.get_subclass(media_type)
    stats = stats_manager(user).create_stats()

    data = dict(
        is_current=(user.id == current_user.id),
        stats=stats,
        users=[{"label": user.username, "value": user.username}
               for user in User.query.filter(User.active.is_(True)).all()]
    )

    return jsonify(data=data), 200
