from flask import jsonify, Blueprint
from backend.api import db, cache
from backend.api.routes.handlers import token_auth, current_user
from backend.api.data_managers.medialist_query_manager import MediaListQuery
from backend.api.utils.decorators import validate_media_type
from backend.api.utils.enums import MediaType
from backend.api.data_managers.stats_manager import BaseStats


lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<media_type>/<username>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_list(media_type: MediaType, username: str):

    user = current_user.check_autorization(username)
    current_user.set_view_count(user, media_type)
    media_data, filters, current_filters, pagination = MediaListQuery(user, media_type).return_results()
    db.session.commit()

    data = dict(
        user_data=user.to_dict(),
        media_type=media_type.value,
        media_data=media_data,
        pagination=pagination,
        filters=filters,
        current_filters=current_filters,
    )

    return jsonify(data=data), 200


@lists_bp.route("/stats/<media_type>/<username>", methods=["GET"])
@cache.cached(timeout=3600)
@token_auth.login_required
@validate_media_type
def stats_page(media_type: MediaType, username: str):

    user = current_user.check_autorization(username)
    stats_class = BaseStats.get_stats_class(media_type)
    stats = stats_class(user).create_stats()

    return jsonify(data=stats), 200
