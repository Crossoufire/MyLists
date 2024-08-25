import secrets
from pathlib import Path
from typing import Any, Dict
from urllib.request import urlretrieve
from flask import current_app
from flask import request, jsonify, Blueprint, abort
from backend.api import db
from backend.api.managers.ApiManager import ApiManager
from backend.api.core import token_auth
from backend.api.utils.decorators import validate_json_data
from backend.api.utils.enums import MediaType, RoleType, ModelTypes, JobType
from backend.api.utils.functions import get, format_datetime, resize_and_save_image
from backend.api.managers.ModelsManager import ModelsManager

details_bp = Blueprint("api_details", __name__)


@details_bp.route("/details/<mediatype:media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
def media_details(media_type: MediaType, media_id: int | str):
    """ Media Details and the user details """

    media_model, label_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.LABELS])

    external = request.args.get("external")
    filter_id = {"api_id": media_id} if external else {"id": media_id}
    media = media_model.query.filter_by(**filter_id).first()

    if external and not media:
        api_manager = ApiManager.get_subclass(media_type)
        media = api_manager(api_id=media_id).save_media_to_db()
        db.session.commit()
    elif not media:
        return abort(404, "Media not found")

    data = dict(
        media=media.to_dict(),
        similar_media=media.get_similar(),
        user_data=media.get_user_list_info(label_model),
        follows_data=media.in_follows_lists(),
    )

    return jsonify(data=data), 200


@details_bp.route("/details/form/<mediatype:media_type>/<media_id>", methods=["GET"])
@token_auth.login_required(role=RoleType.MANAGER)
def get_details_form(media_type: MediaType, media_id: int):
    media_model, genre_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.GENRE])

    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "Media not found")

    data = {
        "fields": [(key, val) for key, val in media.to_dict().items() if key in media_model.form_only()],
        "all_genres": genre_model.get_available_genres() if media_type == MediaType.BOOKS else None,
        "genres": [genre.name for genre in media.genres] if media_type == MediaType.BOOKS else None,
    }

    return jsonify(data=data), 200


@details_bp.route("/details/form", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@validate_json_data()
def post_details_form(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Post new media details after edition """

    payload = {} if payload is None else payload

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "This media does not exists")

    # Suppress all non-allowed fields
    form_authorized = models[ModelTypes.MEDIA].form_only()
    updates = {key: val for (key, val) in payload.items() if key in form_authorized}
    updates["image_cover"] = get(payload, "image_cover")

    if not updates["image_cover"]:
        picture_fn = media.image_cover
    else:
        picture_fn = f"{secrets.token_hex(12)}.jpg"
        picture_path = Path(current_app.root_path, f"static/covers/{media_type.value}_covers", picture_fn)
        try:
            urlretrieve(str(updates["image_cover"]), str(picture_path))
            resize_and_save_image(str(picture_path), str(picture_path))
        except Exception as e:
            current_app.logger.error(f"[ERROR] - occurred updating media cover with ID [{media.id}]: {e}")
            return abort(403, "Not allowed to upload this media cover")

    updates["image_cover"] = picture_fn
    media.lock_status = True

    if media_type == MediaType.BOOKS and bool(get(payload, "genres")):
        models[ModelTypes.GENRE].replace_genres(payload["genres"], media_id)

    for name, value in updates.items():
        if name in ("release_date", "last_air_date", "next_episode_to_air"):
            value = format_datetime(value)
        setattr(media, name, value)

    db.session.commit()

    return {}, 204


@details_bp.route("/details/<mediatype:media_type>/<jobtype:job>/<name>", methods=["GET"])
@token_auth.login_required
def job_details(media_type: MediaType, job: JobType, name: str):
    """
    Load associated media with <job> and <name>
    Available jobs:
        - `creator`: director (movies), tv creator (series/anime), developer (games), or author (books)
        - `actor`: actors (series/anime/movies)
        - `platform`: tv network (series/anime)
    """

    media_model = ModelsManager.get_unique_model(media_type, ModelTypes.MEDIA)
    all_media = media_model.get_associated_media(job, name)

    # Rename <id> and <name> keys to <media_id> and <media_name> for consistency in frontend
    for media in all_media:
        media.update(media_id=media.pop("id"), media_name=media.pop("name"))

    return jsonify(data=dict(data=all_media, total=len(all_media))), 200


# noinspection PyUnusedLocal
@details_bp.route("/details/refresh", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@validate_json_data()
def refresh_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    api_manager = ApiManager.get_subclass(media_type)

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if media is None:
        return abort(404, "Media not found")

    try:
        refreshed_data = api_manager(api_id=media.api_id).get_refreshed_media_data()
        media.refresh_element_data(media.api_id, refreshed_data)
        current_app.logger.info(f"[INFO] - Refreshed the {media_type.value} with API ID: [{media.api_id}]")
    except Exception as e:
        current_app.logger.error(f"[ERROR] - While refreshing {media_type.value} with API ID: [{media.api_id}]: {e}")
        return abort(400, "An error occurred trying to refresh the media")

    return {}, 204


@details_bp.route("/details/lock_media", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@validate_json_data(bool)
def lock_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Lock a media so the API does not update it anymore """

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "Media not found")

    media.lock_status = payload
    db.session.commit()
    current_app.logger.info(f"{media_type} [ID {media_id}] successfully locked.")

    return {}, 204
