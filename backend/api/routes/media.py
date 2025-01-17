from flask import jsonify, Blueprint, abort

from backend.api import db
from backend.api.schemas.media import *
from backend.api.utils.decorators import body
from backend.api.models.user import UserMediaUpdate
from backend.api.core import token_auth, current_user
from backend.api.calculators.stats.delta import DeltaStatsService
from backend.api.utils.enums import MediaType, Status, ModelTypes, UpdateType


media_bp = Blueprint("api_media", __name__)
ds_service = DeltaStatsService()


@media_bp.route("/coming_next", methods=["GET"])
@token_auth.login_required
def coming_next():
    active_media_types = [
        setting.media_type for setting in current_user.settings
        if setting.active and setting.media_type != MediaType.BOOKS
    ]
    models_list = ModelsManager.get_lists_models(active_media_types, ModelTypes.LIST)

    data = [dict(
        media_type=model.GROUP.value,
        items=model.get_coming_next()
    ) for model in models_list]

    return jsonify(data=data), 200


@media_bp.route("/add_media", methods=["POST"])
@token_auth.login_required
@body(AddMediaSchema)
def add_media(data):
    """ Add `media` to the `current_user` and return the new media association data """

    media_model, list_model, label_model = data["models"]
    new_status = data["payload"] if data["payload"] else list_model.DEFAULT_STATUS

    media = media_model.query.get_or_404(data["media_id"])
    user_media = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if user_media:
        return abort(400, description="Media already in your list")

    new_value = media.add_to_user(new_status, current_user.id)
    UserMediaUpdate.set_new_update(media, UpdateType.STATUS, None, new_status)

    db.session.commit()

    # Get newly created user_media and update stats
    user_media = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()

    ds_calculator = ds_service.create(media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        new_value=new_value,
        new_status=new_status,
        new_entry=1,
    )

    db.session.commit()

    # Return new user_media data
    data = media.get_user_media_data(label_model)

    return jsonify(data=data), 200


@media_bp.route("/delete_media", methods=["POST"])
@token_auth.login_required
@body(DeleteMediaSchema)
def delete_media(data):
    """ Delete a media association from the user """

    list_model, label_model = data["models"]
    user_media = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    old_redo = user_media.redo if data["media_type"] != MediaType.GAMES else 0
    old_total = user_media.total if data["media_type"] != MediaType.GAMES else user_media.playtime

    # Update user list stats
    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_entry=1,
        old_value=old_total,
        old_redo=old_redo,
        old_rating=user_media.rating,
        old_status=user_media.status,
        old_comment=user_media.comment,
        favorite_value=user_media.favorite,
    )

    db.session.delete(user_media)

    label_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).delete()
    UserMediaUpdate.query.filter_by(user_id=current_user.id, media_id=data["media_id"], media_type=user_media.GROUP).delete()

    db.session.commit()

    return {}, 204


@media_bp.route("/update_favorite", methods=["POST"])
@token_auth.login_required
@body(UpdateFavoriteSchema)
def update_favorite(data):
    """ Add or remove the media as favorite for the current user """

    list_model = data["models"]
    user_media = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(user_media=user_media, favorite_value=data["payload"])

    user_media.favorite = data["payload"]
    db.session.commit()

    return {}, 204


@media_bp.route("/update_status", methods=["POST"])
@token_auth.login_required
@body(UpdateStatusSchema)
def update_status(data):
    """ Update the media status of a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    old_total = user_media.total if data["media_type"] != MediaType.GAMES else user_media.playtime
    old_redo = user_media.redo if data["media_type"] != MediaType.GAMES else 0
    old_status = user_media.status
    new_total = user_media.update_status(data["payload"])

    UserMediaUpdate.set_new_update(user_media.media, UpdateType.STATUS, old_status, data["payload"])

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_status=old_status,
        new_status=data["payload"],
        old_value=old_total,
        new_value=new_total,
        old_redo=old_redo,
        new_redo=0,
    )

    db.session.commit()

    return {}, 204


@media_bp.route("/update_rating", methods=["POST"])
@token_auth.login_required
@body(UpdateRatingSchema)
def update_rating(data):
    """ Update the media rating entered by a user """

    try:
        rating = float(data["payload"])
    except:
        rating = None

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(user_media=user_media, old_rating=user_media.rating, new_rating=rating)

    user_media.rating = rating
    db.session.commit()

    return {}, 204


@media_bp.route("/update_redo", methods=["POST"])
@token_auth.login_required
@body(UpdateRedoSchema)
def update_redo(data):
    """ Update the media re-read/re-watched value for a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if user_media.status != Status.COMPLETED:
        return abort(400, description="Media status is not `Completed`")

    old_redo = user_media.redo
    old_total = user_media.total
    new_total = user_media.update_total(data["payload"])

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_redo=old_redo,
        new_redo=data["payload"],
        old_value=old_total,
        new_value=new_total,
    )

    UserMediaUpdate.set_new_update(user_media.media, UpdateType.REDO, old_redo, data["payload"])
    db.session.commit()

    return {}, 204


@media_bp.route("/update_comment", methods=["POST"])
@token_auth.login_required
@body(UpdateCommentSchema)
def update_comment(data):
    """ Update the media comment for a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(user_media=user_media, old_comment=user_media.comment, new_comment=data["payload"])

    user_media.comment = data["payload"]
    db.session.commit()

    return {}, 204


@media_bp.route("/update_playtime", methods=["POST"])
@token_auth.login_required
@body(UpdatePlaytimeSchema)
def update_playtime(data):
    """ Update playtime of an updated game from a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()
    UserMediaUpdate.set_new_update(user_media.media, UpdateType.PLAYTIME, user_media.playtime, data["payload"])

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(user_media=user_media, old_value=user_media.playtime, new_value=data["payload"])

    user_media.playtime = data["payload"]
    db.session.commit()

    return {}, 204


@media_bp.route("/update_platform", methods=["POST"])
@token_auth.login_required
@body(UpdatePlatformSchema)
def update_platform(data):
    """ Update platform the user played on """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()
    media_assoc.platform = data["payload"]
    db.session.commit()

    return {}, 204


@media_bp.route("/update_season", methods=["POST"])
@token_auth.login_required
@body(UpdateSeasonSchema)
def update_season(data):
    """ Update the season of an updated anime or series for the user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > user_media.media.eps_per_season[-1].season:
        return abort(400, description="Invalid season")

    old_season = user_media.current_season
    old_eps = user_media.last_episode_watched
    old_total = user_media.total

    new_watched = sum(user_media.media.eps_seasons_list[:data["payload"] - 1]) + 1
    user_media.current_season = data["payload"]
    user_media.last_episode_watched = 1
    new_total = new_watched + (user_media.redo * sum(user_media.media.eps_seasons_list))
    user_media.total = new_total

    UserMediaUpdate.set_new_update(
        user_media.media,
        UpdateType.TV,
        (old_season, old_eps),
        (data["payload"], 1),
    )

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_value=old_total,
        new_value=new_total,
    )

    db.session.commit()

    return {}, 204


@media_bp.route("/update_episode", methods=["POST"])
@token_auth.login_required
@body(UpdateEpisodeSchema)
def update_episode(data):
    """ Update the episode of an updated anime or series from a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > user_media.media.eps_per_season[user_media.current_season - 1].episodes:
        return abort(400, description="Invalid episode")

    old_season = user_media.current_season
    old_episode = user_media.last_episode_watched
    old_total = user_media.total
    new_watched = sum(user_media.media.eps_seasons_list[:old_season - 1]) + data["payload"]
    new_total = new_watched + (user_media.redo * sum(user_media.media.eps_seasons_list))

    user_media.last_episode_watched = data["payload"]
    user_media.total = new_total

    UserMediaUpdate.set_new_update(
        user_media.media,
        UpdateType.TV,
        (old_season, old_episode),
        (old_season, data["payload"]),
    )

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_value=old_total,
        new_value=new_total,
    )

    db.session.commit()

    return {}, 204


@media_bp.route("/update_page", methods=["POST"])
@token_auth.login_required
@body(UpdatePageSchema)
def update_page(data):
    """ Update the page read of an updated book from a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > int(user_media.media.pages):
        return abort(400, description="Invalid page")

    old_page = user_media.actual_page
    old_total = user_media.total

    user_media.actual_page = data["payload"]
    new_total = data["payload"] + (user_media.redo * user_media.media.pages)
    user_media.total = new_total

    UserMediaUpdate.set_new_update(user_media.media, UpdateType.PAGE, old_page, data["payload"])

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_value=old_total,
        new_value=new_total,
    )

    db.session.commit()

    return {}, 204


@media_bp.route("/update_chapter", methods=["POST"])
@token_auth.login_required
@body(UpdateChapterSchema)
def update_chapter(data):
    """ Update the chapters read of an updated manga from a user """

    user_media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > int(user_media.media.chapters):
        return abort(400, description="Invalid chapter")

    old_chapter = user_media.current_chapter
    old_total = user_media.total

    user_media.current_chapter = data["payload"]
    new_total = data["payload"] + (user_media.redo * user_media.media.chapters)
    user_media.total = new_total

    UserMediaUpdate.set_new_update(user_media.media, UpdateType.CHAPTER, old_chapter, data["payload"])

    ds_calculator = ds_service.create(user_media.GROUP, current_user)
    ds_calculator.on_update(
        user_media=user_media,
        old_value=old_total,
        new_value=new_total,
    )

    db.session.commit()

    return {}, 204


@media_bp.route("/delete_updates", methods=["POST"])
@token_auth.login_required
@body(DeleteUpdatesSchema)
def delete_updates(data):
    """ Delete updates from the user """

    UserMediaUpdate.query.filter(
        UserMediaUpdate.id.in_(data["update_ids"]),
        UserMediaUpdate.user_id == current_user.id,
    ).delete()

    db.session.commit()

    if data["return_data"]:
        new_update_to_return = (
            UserMediaUpdate.query.filter_by(user_id=current_user.id)
            .order_by(UserMediaUpdate.timestamp.desc())
            .limit(7).all()
        )
        return jsonify(data=new_update_to_return[-1].to_dict() if new_update_to_return else None), 200

    return {}, 204


@media_bp.route("/history/<mediatype:media_type>/<media_id>", methods=["GET"])
@token_auth.login_required
def media_history(media_type: MediaType, media_id: int):
    """ Fetch the history of a media item """

    history = (
        UserMediaUpdate.query
        .filter(
            UserMediaUpdate.user_id == current_user.id,
            UserMediaUpdate.media_type == media_type,
            UserMediaUpdate.media_id == media_id
        ).order_by(UserMediaUpdate.timestamp.desc())
        .all()
    )

    return jsonify(data=[h.to_dict() for h in history]), 200
