import secrets
from pathlib import Path
from typing import Any, Dict
from urllib.request import urlretrieve
from PIL import Image
from PIL.Image import Resampling
from flask import current_app
from flask import request, jsonify, Blueprint, abort
from backend.api import db
from backend.api.managers.api_data_manager import ApiData
from backend.api.routes.handlers import token_auth, current_user
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, RoleType, ModelTypes
from backend.api.utils.functions import get, ModelsFetcher


details_bp = Blueprint("api_details", __name__)


@details_bp.route("/details/<media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def media_details(media_type: MediaType, media_id: int):
    """ Media Details and the user details """

    media_model, label_model = ModelsFetcher.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.LABELS])

    external_arg = request.args.get("external")
    filter_id = {"api_id": media_id} if external_arg else {"id": media_id}
    media = media_model.query.filter_by(**filter_id).first()

    if external_arg and not media:
        API_class = ApiData.get_API_class(media_type)
        media = API_class(API_id=media_id).save_media_to_db()
        db.session.commit()
    elif not media:
        return abort(404, "The media could not be found.")

    data = dict(
        media=media.to_dict(),
        similar_media=media.get_similar_media(),
        user_data=media.get_user_list_info(label_model),
        follows_data=media.in_follows_lists(),
    )

    return jsonify(data=data), 200


@details_bp.route("/details/form/<media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def get_details_form(media_type: MediaType, media_id: int):
    if current_user.role == RoleType.USER:
        return abort(403, "You are not authorized. Please contact an admin.")

    media_model, genre_model = ModelsFetcher.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.GENRE])

    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "The media does not exists")

    data = {
        "fields": [(key, val) for (key, val) in media.to_dict().items() if key in media_model.form_only()],
        "all_genres": genre_model.get_available_genres() if media_type == MediaType.BOOKS else None,
        "genres": [genre.genre for genre in media.genres] if media_type == MediaType.BOOKS else None,
    }

    return jsonify(data=data), 200


@details_bp.route("/details/form", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def post_details_form(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Post new media details after edition """

    payload = {} if payload is None else payload

    if current_user.role == RoleType.USER:
        return abort(403, "You are not authorized")

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
            img = Image.open(str(picture_path))
            img = img.resize((300, 450), Resampling.LANCZOS)
            img.save(str(picture_path), quality=90)
        except Exception as e:
            current_app.logger.error(f"[ERROR] - occurred updating media cover with ID [{media.id}]: {e}")
            return abort(403, "Not allowed to upload this media cover")

    updates["image_cover"] = picture_fn
    media.lock_status = True

    if media_type == MediaType.BOOKS and bool(get(payload, "genres")):
        models[ModelTypes.GENRE].replace_genres(payload["genres"], media_id)

    for name, value in updates.items():
        setattr(media, name, value)

    db.session.commit()

    return {}, 204


@details_bp.route("/details/<media_type>/<job>/<info>", methods=["GET"])
@token_auth.login_required
@validate_media_type
def job_details(media_type: MediaType, job: str, info: str):
    """
    Load all the media associated with the <job> and the <info>
    job can be:
        - `creator`: director (movies), tv creator (series/anime), developer (games), or author (books)
        - `actor`: actors (series/anime/movies)
        - `network`: tv network (series/anime)
    """

    media_model = ModelsFetcher.get_unique_model(media_type, ModelTypes.MEDIA)
    media_data = media_model.get_information(job, info)

    for media in media_data:
        media.update(media_id=media.pop("id"), media_name=media.pop("name"))

    data = dict(
        data=media_data,
        total=len(media_data),
    )

    return jsonify(data=data), 200


# noinspection PyUnusedLocal
@details_bp.route("/details/refresh", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def refresh_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Refresh the details of a unique <media> if the user role is at least <manager> """

    if current_user.role == RoleType.USER:
        return abort(401, "Unauthorized to refresh this media")

    api_model = ApiData.get_API_class(media_type)

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if media is None:
        return abort(404)

    try:
        refreshed_data = api_model(API_id=media.api_id).get_refreshed_media_data()
        media.refresh_element_data(media.api_id, refreshed_data)
        current_app.logger.info(f"[INFO] - Refreshed the {media_type.value} with API ID: [{media.api_id}]")
    except Exception as e:
        current_app.logger.error(f"[ERROR] - While refreshing {media_type.value} with API ID: [{media.api_id}]: {e}")
        return abort(400, "An error occurred trying to refresh the media")

    return {}, 204


@details_bp.route("/details/lock_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(bool)
def lock_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Lock a media so the API does not update it anymore """

    if current_user.role == RoleType.USER:
        return abort(401, "Unauthorized to refresh this media")

    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if not media:
        return abort(400)

    media.lock_status = payload
    db.session.commit()
    current_app.logger.info(f"{media_type} [ID {media_id}] successfully locked.")

    return {}, 204
