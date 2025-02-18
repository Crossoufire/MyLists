import secrets
from pathlib import Path
from typing import Union

from flask import current_app, request, jsonify, Blueprint, abort

from backend.api import db
from backend.api.core import token_auth, current_user
from backend.api.schemas.details import *
from backend.api.utils.decorators import body
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.utils.enums import MediaType, RoleType, ModelTypes, JobType
from backend.api.utils.functions import get, format_datetime, resize_and_save_image, fetch_cover


details_bp = Blueprint("api_details", __name__)
api_s_factory = ApiServiceFactory


@details_bp.route("/details/<mediatype:media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
def media_details(media_type: MediaType, media_id: Union[int, str]):
    """ Media Details and the user details """

    media_model, label_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.LABELS])

    external = request.args.get("external")
    filter_id = {"api_id": media_id} if external else {"id": media_id}
    media = media_model.query.filter_by(**filter_id).first()

    if external and not media:
        api_service = api_s_factory.create(media_type)
        media = api_service.save_media_to_db(api_id=media_id)
        db.session.commit()
    elif not media:
        return abort(404, description="Media not found")

    data = dict(
        media=media.to_dict(),
        similar_media=media.get_similar(),
        follows_data=media.in_follows_lists(),
        user_media=media.get_user_media_data(label_model),
    )

    return jsonify(data=data), 200


@details_bp.route("/details/edit/<mediatype:media_type>/<media_id>", methods=["GET"])
@token_auth.login_required(role=RoleType.MANAGER)
def get_details_edit(media_type: MediaType, media_id: int):
    """ Get the details of a media item to edit """

    media_model, genre_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.GENRE])

    media = media_model.query.filter_by(id=media_id).first_or_404()

    data = dict(
        fields=[(key, val) for key, val in media.to_dict().items() if key in media_model.form_only()],
        all_genres=genre_model.get_available_genres() if media_type == MediaType.BOOKS else None,
        genres=[genre.name for genre in media.genres] if media_type == MediaType.BOOKS else None,
    )

    if media_type == MediaType.BOOKS:
        authors_m = ModelsManager.get_unique_model(media_type, ModelTypes.AUTHORS)
        data["authors"] = ", ".join([a.name for a in authors_m.query.filter_by(media_id=media_id).all()]),

    return jsonify(data=data), 200


@details_bp.route("/details/<mediatype:media_type>/<jobtype:job>/<name>", methods=["GET"])
@token_auth.login_required
def job_details(media_type: MediaType, job: JobType, name: str):
    """
    Load associated media with <job> and <name>
    Available jobs:
        - `creator`: director (movies), tv creator (series/anime), developer (games), or author (books/manga)
        - `actor`: actors (series/anime/movies)
        - `platform`: tv network (series/anime)
        - `publisher`: publisher (manga)
    """

    media_model, list_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.LIST])
    all_media = media_model.get_associated_media(job, name)
    enriched_media = list_model.media_in_user_list(current_user.id, all_media)

    return jsonify(data=dict(data=enriched_media, total=len(enriched_media))), 200


@details_bp.route("/details/edit", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@body(MediaEditSchema)
def post_details_edit(data):
    """ Post new media details after edition """

    media_model, genre_model = data["models"]

    media = media_model.query.filter_by(id=data["media_id"]).first_or_404()

    # Suppress all non-allowed fields
    authorized_fields = media_model.form_only()
    updates = {key: val for (key, val) in data["payload"].items() if key in authorized_fields}

    # Check if image cover provided
    updates["image_cover"] = get(data["payload"], "image_cover")
    if not updates["image_cover"]:
        picture_fn = media.image_cover
    else:
        picture_fn = f"{secrets.token_hex(16)}.jpg"
        picture_path = Path(current_app.root_path, f"static/covers/{data['media_type']}_covers", picture_fn)
        try:
            image_data = fetch_cover(str(updates["image_cover"]))
            resize_and_save_image(image_data, str(picture_path))
        except:
            return abort(403, description="This cover could not be added. Try another one.")

    # Update media image cover
    updates["image_cover"] = picture_fn

    # Update media lock status
    media.lock_status = True

    # Update media genres for books
    if data["media_type"] == MediaType.BOOKS and bool(get(data["payload"], "genres")):
        genre_model.replace_genres(data["payload"]["genres"], data["media_id"])

    # Update media authors for books
    if data["media_type"] == MediaType.BOOKS and get(data["payload"], "authors"):
        authors_model = ModelsManager.get_unique_model(data["media_type"], ModelTypes.AUTHORS)
        authors_model.replace_authors(data["payload"]["authors"], data["media_id"])

    # Update media attributes
    for name, value in updates.items():
        if name in ("release_date", "last_air_date", "next_episode_to_air"):
            value = format_datetime(value)
        setattr(media, name, value)

    db.session.commit()

    return {}, 204


@details_bp.route("/details/refresh", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@body(RefreshMediaSchema)
def refresh_media(data):
    """ Refresh metadata of a media """

    media = data["models"].query.filter_by(id=data["media_id"]).first_or_404()
    api_service = api_s_factory.create(data["media_type"])
    api_service.update_media_to_db(api_id=media.api_id)
    current_app.logger.info(f"[INFO] - Refreshed {data['media_type'].value} with API ID: [{media.api_id}]")

    return {}, 204


@details_bp.route("/details/lock_media", methods=["POST"])
@token_auth.login_required(role=RoleType.MANAGER)
@body(LockMediaSchema)
def lock_media(data):
    """ Lock a media so the API does not update it anymore """

    media = data["models"].query.filter_by(id=data["media_id"]).first_or_404()

    media.lock_status = data["payload"]
    db.session.commit()
    current_app.logger.info(f"{data['media_type'].value} [ID {media.id}] successfully locked")

    return {}, 204
