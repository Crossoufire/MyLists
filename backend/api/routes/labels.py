from typing import Any, Dict
from flask import Blueprint, jsonify, abort, current_app, request
from backend.api import db
from backend.api.routes.handlers import token_auth, current_user
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager

labels_bp = Blueprint("api_labels", __name__)


@labels_bp.route("/labels_for_media/<media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_in_label(media_type: MediaType, media_id: int):
    label_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
    data = label_model.get_user_media_labels(user_id=current_user.id, media_id=media_id)
    return jsonify(data=data), 200


@labels_bp.route("/add_media_to_label", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def add_media_to_label(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    list_model, label_model = models[ModelTypes.LIST], models[ModelTypes.LABELS]

    media = list_model.query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(404, "The media could not be found")

    label = label_model.query.filter_by(user_id=current_user.id, media_id=media_id, label=payload).first()
    if label:
        return abort(400, "This label is already associated with this media")

    db.session.add(label_model(user_id=current_user.id, media_id=media_id, label=payload))
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] added {media_type.value} [ID {media_id}] to label: {payload}.")

    return {}, 204


@labels_bp.route("/remove_label_from_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def remove_label_from_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    list_model, label_model = models[ModelTypes.LIST], models[ModelTypes.LABELS]

    label_model.query.filter_by(user_id=current_user.id, media_id=media_id, label=payload).delete()
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] removed {media_type.value} ID [{media_id}] from its "
                            f"label list: {payload}.")

    return {}, 204


@labels_bp.route("/rename_label", methods=["POST"])
@token_auth.login_required
def rename_label():
    try:
        json_data = request.get_json()
        media_type = MediaType(json_data["media_type"])
        old_label_name = json_data["old_label_name"]
        new_label_name = json_data["new_label_name"]
    except:
        return abort(400)

    labels_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
    label_name = labels_model.query.filter_by(user_id=current_user.id, label=new_label_name).first()
    if label_name:
        return abort(400, "The new label name already exists.")

    labels = labels_model.query.filter_by(user_id=current_user.id, label=old_label_name).all()
    for label in labels:
        label.label = new_label_name

    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] rename the label: {old_label_name} ({media_type.value}) "
                            f"to {new_label_name}")

    return {}, 204


@labels_bp.route("/delete_label", methods=["POST"])
@token_auth.login_required
def delete_label():
    try:
        json_data = request.get_json()
        media_type = MediaType(json_data["media_type"])
        label = json_data["label"]
    except:
        return abort(400)

    labels_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
    labels_model.query.filter_by(user_id=current_user.id, label=label).delete()
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] deleted the label: {label} ({media_type.value})")

    return {}, 204
