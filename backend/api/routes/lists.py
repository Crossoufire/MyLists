from typing import Any, Dict
from flask import current_app
from flask import request, jsonify, Blueprint, abort
from backend.api import db
from backend.api.routes.auth import token_auth, current_user
from backend.api.classes.Medialist_query import MediaListQuery
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import get_models_group

lists_bp = Blueprint("api_lists", __name__)


@lists_bp.route("/list/<media_type>/<username>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_list(media_type: MediaType, username: str):
    """ Media list endpoint (Series, Anime, Movies, Games, and Books) """

    if current_user:
        user = current_user.check_autorization(username)

        # Add a view on media list to profile
        current_user.set_view_count(user, media_type)
    else:
        from backend.api.models.user_models import User
        user = User.query.filter_by(username=username).first()
        if not user:
            return abort(404)

    # Resolve media query
    media_data, pagination = MediaListQuery(user, media_type).return_results()

    # Commit changes
    db.session.commit()

    data = dict(
        user_data=user.to_dict(),
        media_data=media_data,
        pagination=pagination,
        media_type=media_type.value,
    )

    return jsonify(data=data)


@lists_bp.route("/media_in_label/<media_type>/<username>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_in_label(media_type: MediaType, username: str):
    try:
        label = request.args.get("label")
    except:
        return abort(400, "Sorry, the label was not found.")

    # Check if <user> has access
    user = current_user.check_autorization(username)

    # Get models using <media_type>
    labels_model = get_models_group(media_type, types=ModelTypes.LABELS)

    # Fetch data from database
    media_data = labels_model.query.filter(labels_model.user_id == user.id, labels_model.label == label).all()

    return jsonify(data=[media.to_dict() for media in media_data])


@lists_bp.route("/add_media_to_label", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def add_media_to_label(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Create a new label for the current user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(400)

    new_label = models[ModelTypes.LABELS](user_id=current_user.id, media_id=media_id, label=payload)

    # Commit changes
    db.session.add(new_label)
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] added a {media_type.value} [ID {media_id}] to "
                            f"its label: {payload}.")

    return {}, 204


@lists_bp.route("/remove_label_from_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def remove_label_from_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Remove a label associated with a media of the current user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(400)

    models[ModelTypes.LABELS].query.filter(models[ModelTypes.LABELS].user_id == current_user.id,
                                           models[ModelTypes.LABELS].media_id == media_id,
                                           models[ModelTypes.LABELS].label == payload).delete()

    # Commit changes
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] removed a {media_type.value} ID [{media_id}] from its "
                            f"label list: {payload}.")

    return {}, 204


@lists_bp.route("/delete_label", methods=["POST"])
@token_auth.login_required
def delete_label():
    """ Remove the label """

    # Parse JSON data
    try:
        json_data = request.get_json()
        media_type = MediaType(json_data["media_type"])
        label = json_data["label"]
    except:
        return abort(400)

    labels_model = get_models_group(media_type, types=ModelTypes.LABELS)
    labels_model.query.filter(labels_model.user_id == current_user.id, labels_model.label == label).delete()

    # Commit changes
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] deleted this label: {label} ({media_type.value})")

    return {"message": "Label successfully deleted."}, 200


@lists_bp.route("/rename_label", methods=["POST"])
@token_auth.login_required
def rename_label():
    """ Rename the label """

    # Parse JSON data
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

    # Commit changes
    db.session.commit()

    current_app.logger.info(f"User [{current_user.id}] rename the label: {old_label} ({media_type.value}) "
                            f"to {new_label}")

    return {"message": "Label name successfully updated."}, 200