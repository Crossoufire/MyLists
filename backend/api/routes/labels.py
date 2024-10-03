from flask import Blueprint, jsonify, abort, current_app

from backend.api import db
from backend.api.core import token_auth, current_user
from backend.api.schemas.labels import *
from backend.api.utils.decorators import body
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager


labels_bp = Blueprint("api_labels", __name__)


@labels_bp.route("/all_labels/<mediatype:media_type>", methods=["GET"])
@token_auth.login_required
def all_labels(media_type: MediaType):
    """ Get all the labels associated with a user and a media type """

    label_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
    labels = label_model.query.with_entities(label_model.name).filter_by(user_id=current_user.id).distinct().all()

    return jsonify(data=[label[0] for label in labels]), 200


@labels_bp.route("/add_media_to_label", methods=["POST"])
@token_auth.login_required
@body(AddLabelToMediaSchema)
def add_media_to_label(data):
    """ Add a label to a media associated with the user """

    list_model, label_model = data["models"]
    user_media = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if label_model.query.filter_by(user_id=current_user.id, media_id=user_media.media_id, name=data["payload"]).first():
        return abort(400, description="This label is already associated with this media")

    db.session.add(label_model(user_id=current_user.id, media_id=data["media_id"], name=data["payload"]))
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] added {data['media_type']} [ID {data['media_id']}] to "
                            f"label: {data['payload']}.")

    return {}, 204


@labels_bp.route("/remove_label_from_media", methods=["POST"])
@token_auth.login_required
@body(RemoveLabelFromMediaSchema)
def remove_label_from_media(data):
    """ Remove a user's label associated with a media """

    data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"], name=data["payload"]).delete()
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] removed {data['media_type']} ID [{data['media_id']}] from its "
                            f"label list: {data['payload']}.")

    return {}, 204


@labels_bp.route("/rename_label", methods=["POST"])
@token_auth.login_required
@body(RenameLabelSchema)
def rename_label(data):
    """ Renames a user's label """

    if data["models"].query.filter_by(user_id=current_user.id, name=data["new_label_name"]).first():
        return abort(400, description="This label already exists")

    labels = data["models"].query.filter_by(user_id=current_user.id, name=data["old_label_name"]).all()
    for label in labels:
        label.name = data["new_label_name"]

    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] rename the label: {data['old_label_name']} "
                            f"({data['media_type']}) to {data['new_label_name']}")

    return {}, 204


@labels_bp.route("/delete_label", methods=["POST"])
@token_auth.login_required
@body(DeleteLabelSchema)
def delete_label(data):
    """ Delete a user's label """

    data["models"].query.filter_by(user_id=current_user.id, name=data["name"]).delete()
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] deleted the label: {data['name']} ({data['media_type']})")

    return {}, 204
