from typing import Any, Dict
from flask import current_app
from flask import request, jsonify, Blueprint, abort
from backend.api import db, cache
from backend.api.routes.handlers import token_auth, current_user
from backend.api.data_managers.medialist_query_manager import MediaListQuery
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import get_models_group
from backend.api.data_managers.stats_manager import BaseStats

lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<media_type>/<username>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_list(media_type: MediaType, username: str):
    """ Media list endpoint """

    user = current_user.check_autorization(username)
    current_user.set_view_count(user, media_type)
    media_data, pagination = MediaListQuery(user, media_type).return_results()
    db.session.commit()

    data = dict(
        user_data=user.to_dict(),
        media_data=media_data,
        pagination=pagination,
        media_type=media_type.value,
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


@lists_bp.route("/media_in_label/<media_type>/<username>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_in_label(media_type: MediaType, username: str):
    try:
        label = request.args.get("label")
    except:
        return abort(404, "This label was not found")

    user = current_user.check_autorization(username)
    labels_model = get_models_group(media_type, types=ModelTypes.LABELS)
    media_data = labels_model.query.filter(labels_model.user_id == user.id, labels_model.label == label).all()

    return jsonify(data=[media.to_dict() for media in media_data]), 200


@lists_bp.route("/add_media_to_label", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def add_media_to_label(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Create a new label for the current user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(404, "The media could not be found")

    new_label = models[ModelTypes.LABELS](
        user_id=current_user.id,
        media_id=media_id,
        label=payload,
    )

    db.session.add(new_label)
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] added {media_type.value} [ID {media_id}] to label: {payload}.")

    return {}, 204


@lists_bp.route("/remove_label_from_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def remove_label_from_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Remove a label associated with a media of the current user """

    list_model, label_model = models[ModelTypes.LIST], models[ModelTypes.LABELS]

    media = list_model.query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(404, "The media could not be found")

    label_model.query.filter(
        label_model.user_id == current_user.id,
        label_model.media_id == media_id,
        label_model.label == payload
    ).delete()

    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] removed {media_type.value} ID [{media_id}] from its "
                            f"label list: {payload}.")

    return {}, 204


@lists_bp.route("/delete_label", methods=["POST"])
@token_auth.login_required
def delete_label():
    """ Remove the label and remove the label on all the media having this label """

    try:
        json_data = request.get_json()
        media_type = MediaType(json_data["media_type"])
        label = json_data["label"]
    except:
        return abort(400)

    labels_model = get_models_group(media_type, types=ModelTypes.LABELS)
    labels_model.query.filter(labels_model.user_id == current_user.id, labels_model.label == label).delete()

    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] deleted this label: {label} ({media_type.value})")

    return {}, 204


@lists_bp.route("/rename_label", methods=["POST"])
@token_auth.login_required
def rename_label():
    """ Rename the label """

    try:
        json_data = request.get_json()
        media_type = MediaType(json_data["media_type"])
        old_label = json_data["old_label_name"]
        new_label = json_data["new_label_name"]
    except:
        return abort(400)

    labels_model = get_models_group(media_type, types=ModelTypes.LABELS)
    data = labels_model.query.filter(labels_model.user_id == current_user.id, labels_model.label == old_label).all()
    for d in data:
        d.label = new_label

    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] rename the label: {old_label} ({media_type.value}) "
                            f"to {new_label}")

    return {}, 204
