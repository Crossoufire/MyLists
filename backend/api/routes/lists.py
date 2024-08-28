from flask import jsonify, Blueprint, abort, request
from backend.api import db, cache
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.user import User
from backend.api.core import token_auth, current_user
from backend.api.managers.ListQueryManager import ListQueryManager, ListFiltersManager
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.managers.StatsManager import StatsManager


lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required
def media_list(media_type: MediaType, username: str):
    user = current_user.check_autorization(username)

    if not user.get_media_setting(media_type).active:
        return abort(404)

    current_user.set_view_count(user, media_type)
    media_data, pagination = ListQueryManager(user, media_type).return_results()
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
    filters = ListFiltersManager(user, media_type).return_filters()
    return jsonify(data=filters), 200


@lists_bp.route("/list/search/filters/<mediatype:media_type>/<username>", methods=["GET"])
@token_auth.login_required
def search_filters(media_type: MediaType, username: str):
    user = current_user.check_autorization(username)

    search = request.args.get("q")
    job = request.args.get("job")

    media_model, media_list, media_actors = ModelsManager.get_lists_models(
        media_type,
        [ModelTypes.MEDIA, ModelTypes.LIST, ModelTypes.ACTORS]
    )

    query = (
        db.session.query(media_model.director_name)
        .join(media_list).filter(media_list.user_id == user.id)
        .group_by(media_model.director_name).filter(media_model.director_name.ilike(f"%{search}%"))
        .all()
    )

    # query = (
    #     db.session.query(media_actors.name).join(media_model.actors)
    #     .join(media_list).filter(media_list.user_id == user.id)
    #     .group_by(media_actors.name).filter(media_actors.name.ilike(f"%{search}%"))
    #     .all()
    # )

    return jsonify(data=[data[0] for data in query]), 200


@lists_bp.route("/stats/<mediatype:media_type>/<username>", methods=["GET"])
@cache.cached(timeout=3600)
@token_auth.login_required
def stats_page(media_type: MediaType, username: str):

    user = current_user.check_autorization(username)
    stats_manager = StatsManager.get_subclass(media_type)
    stats = stats_manager(user).create_stats()

    data = dict(
        is_current=(user.id == current_user.id),
        stats=stats,
        users=[{
            "label": user.username,
            "value": user.username,
        } for user in User.query.filter(User.active.is_(True)).all()]
    )

    return jsonify(data=data), 200
