import secrets
from pathlib import Path
from typing import Any, Dict
from urllib.request import urlretrieve
from PIL import Image
from PIL.Image import Resampling
from flask import current_app
from flask import request, jsonify, Blueprint, abort
from backend.api import db
from backend.api.routes.auth import token_auth, current_user
from backend.api.classes.API_data import ApiData
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, RoleType, ModelTypes
from backend.api.utils.functions import get_models_group

details_bp = Blueprint("api_details", __name__)


@details_bp.route("/details/<media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_details(media_type: MediaType, media_id: int):
    """ Return the details of a media as well as the user details concerning this media """

    media_model, label_model = get_models_group(media_type, types=[ModelTypes.MEDIA, ModelTypes.LABELS])
    search_arg = request.args.get("search")

    if search_arg:
        media = media_model.query.filter_by(api_id=media_id).first()
        if not media:
            API_class = ApiData.get_API_class(media_type)
            try:
                media = API_class(API_id=media_id).save_media_to_db()
                db.session.commit()
            except Exception as e:
                current_app.logger.error(f"Error trying to add ({media_type.value}) ID [{media_id}] to DB: {e}")
                return abort(400, "Sorry, an error occurred loading the media info. Please try again later.")
    else:
        # Check <media> in database
        media = media_model.query.filter_by(id=media_id).first()
        if not media:
            return abort(404, "The media could not be found.")

    data = dict(
        media=media.to_dict(),
        user_data=media.get_user_list_info(label_model),
        follows_data=media.in_follows_lists(),
        redirect=True if search_arg else False,
    )

    return jsonify(data=data)


@details_bp.route("/details/form/<media_type>/<media_id>", methods=["GET", "POST"])
@token_auth.login_required
@validate_media_type
def media_details_form(media_type: MediaType, media_id: int):
    """ Post new media details after edition """

    status = 200
    data = {"message": "Media data successfully updated"}

    # Only <admin> and <managers> can access
    if current_user.role == RoleType.USER:
        return abort(403, "You are not authorized")

    # Get models using <media_type>
    media_model, genre_model = get_models_group(media_type, types=[ModelTypes.MEDIA, ModelTypes.GENRE])

    # Get <media> and check if exists
    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(400, "This media does not exists")

    # Accepted form fields
    forms_fields = media_model.form_only()

    if request.method == "GET":
        data = {
            "fields": [(k, v) for k, v in media.to_dict().items() if k in forms_fields],
            "genres": genre_model.get_available_genres() if media_type == MediaType.BOOKS else None,
        }

        return jsonify(data=data)

    # Lock media
    media.lock_status = True

    # Get <data> from JSON
    try:
        data = request.get_json()
    except:
        return abort(400)

    # Add genres if BOOKS
    if media_type == MediaType.BOOKS and (len(data.get("genres", []) or [])) != 0:
        genre_model.replace_genres(data["genres"], media.id)

    # Suppress all non-allowed fields
    try:
        updates = {k: v for (k, v) in data.items() if k in forms_fields}
        updates["image_cover"] = request.get_json().get("image_cover", "") or ""
    except:
        return abort(400)

    # Check media cover update
    if updates["image_cover"] == "":
        picture_fn = media.image_cover
    else:
        picture_fn = f"{secrets.token_hex(8)}.jpg"
        picture_path = Path(current_app.root_path, f"static/covers/{media_type.value}_covers", picture_fn)
        try:
            urlretrieve(f"{updates['image_cover']}", f"{picture_path}")
            img = Image.open(f"{picture_path}")
            img = img.resize((300, 450), Resampling.LANCZOS)
            img.save(f"{picture_path}", quality=90)
        except Exception as e:
            current_app.logger.error(f"[ERROR] - occurred when updating the media cover with ID [{media.id}]: {e}")
            picture_fn = media.image_cover
            data = {"description": "Not allowed to copy this media cover"}
            status = 403

    updates["image_cover"] = picture_fn

    # Set new attributes
    for name, value in updates.items():
        setattr(media, name, value)

    # Commit changes
    db.session.commit()

    return data, status


@details_bp.route("/details/<media_type>/<job>/<info>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def information(media_type: MediaType, job: str, info: str):
    """ Get information on media (director, tv creator, tv network, actor, developer, or author) """

    media_model = get_models_group(media_type, types=ModelTypes.MEDIA)

    # Get data associated to information
    media_data = media_model.get_information(job, info)

    data = dict(
        data=media_data,
        total=len(media_data),
    )

    return jsonify(data=data)


# noinspection PyUnusedLocal
@details_bp.route("/details/refresh", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def refresh_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Refresh the details of a unique <media> if the user role is at least <manager> """

    if current_user.role == RoleType.USER:
        return abort(401, "You are not authorized to refresh media.")

    api_model = ApiData.get_API_class(media_type)

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if media is None:
        return abort(400, "This media does not exist on the database.")

    try:
        refreshed_data = api_model(API_id=media.api_id).update_media_data()
        media.refresh_element_data(media.api_id, refreshed_data)
        current_app.logger.info(f"[INFO] - Refreshed the {media_type.value} with API ID = [{media.api_id}]")
        return {}, 204
    except Exception as e:
        current_app.logger.error(f"[ERROR] - While refreshing {media_type.value} with API ID = [{media.api_id}]: {e}")

    return abort(400, "An error occurred trying to refresh the media.")


@details_bp.route("/details/lock_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(bool)
def lock_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Lock a media so the API does not update it anymore """

    # Check user > user role
    if current_user.role == RoleType.USER:
        return abort(400)

    # Check if media exists
    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if not media:
        return abort(400)

    # Lock media
    media.lock_status = payload

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"{media_type} [ID {media_id}] successfully locked.")

    return {}, 204