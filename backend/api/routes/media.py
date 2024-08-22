import secrets
from pathlib import Path
from urllib.request import urlretrieve
from PIL import Image
from PIL.Image import Resampling
from flask import Blueprint, abort, current_app
from backend.api import db
from backend.api.core.handlers import token_auth, current_user
from backend.api.managers.ApiManager import BaseApiManager
from backend.api.models.users import UserMediaUpdate
from backend.api.schemas.core import EmptySchema
from backend.api.schemas.media import *
from backend.api.utils.enums import MediaType, RoleType, ModelTypes, JobType, Status
from backend.api.utils.functions import get
from backend.api.managers.ModelsManager import ModelsManager
from backend.my_apifairy import authenticate, arguments, response, other_responses, body

media = Blueprint("media", __name__)


@media.route("/media/<media_type>/<media_id>", methods=["GET"])
@authenticate(token_auth)
@arguments(MediaDetailsSchema)
@response(MediaDetailsOneOfSchema, 200, description="Return media details")
@other_responses({404: "Media not found"})
def get_media_details(args, media_type: MediaType, media_id: int | str):
    """
    Media Details
    If the `external` parameter is set to `True`, the media will be checked using the `api_id` field.
    \n If the media is not found, it will be added to the database from the corresponding API.
    """

    media_model, label_model, list_model = (
        ModelsManager.get_lists_models(
            MediaType(media_type),
            [ModelTypes.MEDIA, ModelTypes.LABELS, ModelTypes.LIST]
        )
    )

    filter_id = {"api_id": media_id} if args["external"] else {"id": media_id}
    media = media_model.query.filter_by(**filter_id).first()

    if args["external"] and not media:
        api_manager = BaseApiManager.get_subclass(media_type)
        media = api_manager(api_id=media_id).save_media_to_db()
        db.session.commit()
    elif not media:
        return abort(404, "Media not found")

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=media.id).first()
    user_data = {}
    if media_assoc:
        media_assoc.all_status = Status.by(media_type)
        user_data = dict(
            media_assoc=media_assoc,
            history=UserMediaUpdate.get_history(current_user.id, media.id, media_type),
            labels=label_model.get_user_media_labels(current_user.id, media.id),
        )

    data = dict(
        media=media,
        similar_media=media.get_similar(limit=12),
        user_data=user_data,
        follows_data=media.in_follows_lists(),
    )

    return data


@media.route("/media/<media_type>/<media_id>/form", methods=["GET"])
@authenticate(token_auth, role=[RoleType.MANAGER, RoleType.ADMIN])
@response(MediaFormSchema, 200, description="Return the media form")
@other_responses({404: "Media not found", 403: "Unauthorized"})
def get_media_form(media_type: MediaType, media_id: int):
    """ Media form """

    media_model, genre_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.GENRE])

    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "Media not found")

    media_dict = {c.name: getattr(media, c.name) for c in media.__table__.columns}

    data = dict(
        fields=[(k, v) for k, v in media_dict if k in media_model.editable_columns()],
        media_genres=genre_model.available_genres(),
        applied_genres=media.genres,
    )

    return data


@media.route("/media/<media_type>/form", methods=["POST"])
@authenticate(token_auth, role=[RoleType.MANAGER, RoleType.ADMIN])
@body(MediaFormPostSchema)
@response(EmptySchema, 204, description="Media metadata updated")
@other_responses({404: "Media not found", 403: "Unauthorized"})
def submit_media_form(data, media_type: MediaType):
    """ Update Media details """

    media_model, genre_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.GENRE])

    media = media_model.query.filter_by(id=data["media_id"]).first()
    if not media:
        return abort(404, "Media not found")

    updates = {k: v for k, v in data["fields"].items() if k in media.editable_columns()}
    updates["image_cover"] = get(data["fields"], "image_cover")

    if not updates["image_cover"]:
        picture_fn = media.image_cover
    else:
        picture_fn = f"{secrets.token_hex(16)}.jpg"
        picture_path = Path(current_app.root_path, f"static/covers/{media_type.value}_covers", picture_fn)
        try:
            urlretrieve(str(updates["image_cover"]), str(picture_path))
            img = Image.open(str(picture_path))
            img = img.resize((300, 450), Resampling.LANCZOS)
            img.save(str(picture_path), quality=90)
        except:
            return abort(403, "Unauthorized")

    updates["image_cover"] = picture_fn
    media.lock_status = True

    if media.media_type == MediaType.BOOKS and bool(get(data["fields"], "genres")):
        genre_model.replace_genres(data["genres"], data["media_id"])

    for name, value in updates.items():
        setattr(media, name, value)

    db.session.commit()

    return {}


@media.route("/media/<media_type>/<job>/<name>", methods=["GET"])
@authenticate(token_auth)
@response(JobMediaSchema(many=True), 200, description="Return associated media")
@other_responses({404: "Media not found"})
def get_job_details(media_type: MediaType, job: JobType, name: str):
    """
    Media associated with job
    - `creator`: director (movies), tv creator (series/anime), developer (games), or author (books)
    - `actor`: actors (series/anime/movies)
    - `platform`: tv platform (series/anime) or game platform (games)
    """

    media_model = ModelsManager.get_unique_model(media_type, ModelTypes.MEDIA)
    all_media = media_model.get_information(job, name)

    return all_media


@media.route("/media/<media_type>/refresh", methods=["POST"])
@authenticate(token_auth, role=[RoleType.MANAGER, RoleType.ADMIN])
@body(RefreshMediaSchema)
@response(EmptySchema, 204, description="Media metadata updated")
@other_responses({404: "Media not found", 403: "Unauthorized", 400: "Error Refreshing Media"})
def refresh_media_data(data, media_type: MediaType):
    """ Refresh media details """

    media_model = ModelsManager.get_unique_model(MediaType(media_type), ModelTypes.MEDIA)

    media = media_model.query.filter_by(id=data["media_id"]).first()
    if media is None:
        return abort(404, "Media not found")

    try:
        api_manager = BaseApiManager.get_subclass(media_type)
        refreshed_data = api_manager(api_id=media.api_id).get_refreshed_media_data()
        media.refresh_element_data(media.api_id, refreshed_data)
    except:
        return abort(400, "Error Refreshing Media")

    return {}


@media.route("/media/<media_type>/lock", methods=["POST"])
@authenticate(token_auth, role=[RoleType.MANAGER, RoleType.ADMIN])
@body(LockMediaSchema)
@response(EmptySchema, 204, description="Media is now locked")
@other_responses({404: "Media not found", 403: "Unauthorized"})
def lock_media_edit(data, media_type: MediaType):
    """ Lock media details """

    media_model = ModelsManager.get_unique_model(media_type, ModelTypes.MEDIA)

    media = media_model.query.filter_by(id=data["media_id"]).first()
    if not media:
        return abort(404, "Media not found")

    media.lock_status = data["payload"]
    db.session.commit()

    return {}
