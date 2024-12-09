from flask import current_app, jsonify, Blueprint, abort

from backend.api import db
from backend.api.schemas.media import *
from backend.api.utils.decorators import body
from backend.api.models.user import UserMediaUpdate
from backend.api.core import token_auth, current_user
from backend.api.utils.enums import MediaType, Status, ModelTypes, UpdateType


media_bp = Blueprint("api_media", __name__)


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

    new_status = data["payload"]
    if new_status is None:
        new_status = list_model.DEFAULT_STATUS.value

    media = media_model.query.filter_by(id=data["media_id"]).first_or_404()
    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if media_assoc:
        return abort(400, description="Media already in your list")

    total_watched = media.add_to_user(new_status, current_user.id)
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type'].value} added [ID {data['media_id']}] with "
                            f"status: {new_status}")

    UserMediaUpdate.set_new_update(media, UpdateType.STATUS, None, new_status)

    # Compute new time spent (re-query necessary!)
    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    media_assoc.update_time_spent(new_value=total_watched)

    db.session.commit()

    return jsonify(data=media.get_user_media_info(label_model)), 200


@media_bp.route("/delete_media", methods=["POST"])
@token_auth.login_required
@body(DeleteMediaSchema)
def delete_media(data):
    """ Delete a media association from the user """

    list_model, label_model = data["models"]

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    old_total = media_assoc.total if data["media_type"] != MediaType.GAMES else media_assoc.playtime
    media_assoc.update_time_spent(old_value=old_total, new_value=0)

    db.session.delete(media_assoc)
    label_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).delete()
    UserMediaUpdate.query.filter_by(
        user_id=current_user.id,
        media_id=data["media_id"],
        media_type=media_assoc.GROUP
    ).delete()

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type']} [ID {data['media_id']}] removed.")

    return {}, 204


@media_bp.route("/update_favorite", methods=["POST"])
@token_auth.login_required
@body(UpdateFavoriteSchema)
def update_favorite(data):
    """ Add or remove the media as favorite for the current user """

    media = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    media.favorite = data["payload"]
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] [{data['media_type']}], ID [{data['media_id']}] "
                            f"changed favorite: {data['payload']}")

    return {}, 204


@media_bp.route("/update_status", methods=["POST"])
@token_auth.login_required
@body(UpdateStatusSchema)
def update_status(data):
    """ Update the media status of a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    old_total = media_assoc.total if data["media_type"] != MediaType.GAMES else media_assoc.playtime
    old_status = media_assoc.status
    new_total = media_assoc.update_status(data["payload"])

    UserMediaUpdate.set_new_update(media_assoc.media, UpdateType.STATUS, old_status, data["payload"])
    media_assoc.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type']}'s category [ID {data['media_id']}] "
                            f"changed to {data['payload']}")

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

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()
    media_assoc.rating = rating

    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] [{data['media_type'].value}] ID {data['media_id']} rating updated to {rating}")

    return {}, 204


@media_bp.route("/update_redo", methods=["POST"])
@token_auth.login_required
@body(UpdateRedoSchema)
def update_redo(data):
    """ Update the media re-read/re-watched value for a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if media_assoc.status != Status.COMPLETED:
        return abort(400, description="Media is not `Completed`")

    old_redo = media_assoc.redo
    old_total = media_assoc.total
    new_total = media_assoc.update_total(data["payload"])

    media_assoc.update_time_spent(old_value=old_total, new_value=new_total)
    UserMediaUpdate.set_new_update(media_assoc.media, UpdateType.REDO, old_redo, data["payload"])

    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] Media ID {data['media_id']} [{data['media_type'].value}] "
                            f"redo {data['payload']}x times")

    return {}, 204


@media_bp.route("/update_comment", methods=["POST"])
@token_auth.login_required
@body(UpdateCommentSchema)
def update_comment(data):
    """ Update the media comment for a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    media_assoc.comment = data["payload"]
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] updated a comment on {data['media_type']} with ID"
                            f"[{data['media_id']}]")

    return {}, 204


@media_bp.route("/update_playtime", methods=["POST"])
@token_auth.login_required
@body(UpdatePlaytimeSchema)
def update_playtime(data):
    """ Update playtime of an updated game from a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    UserMediaUpdate.set_new_update(media_assoc.media, UpdateType.PLAYTIME, media_assoc.playtime, data["payload"])
    media_assoc.update_time_spent(old_value=media_assoc.playtime, new_value=data["payload"])
    media_assoc.playtime = data["payload"]
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] {data['media_type'].value} {data['media_id']} playtime updated to"
                            f" {data['payload']} min")

    return {}, 204


@media_bp.route("/update_platform", methods=["POST"])
@token_auth.login_required
@body(UpdatePlatformSchema)
def update_platform(data):
    """ Update platform the user played on """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()
    media_assoc.platform = data["payload"]
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] Games ID {data['media_id']} Platform updated to {data['payload']}")

    return {}, 204


@media_bp.route("/update_season", methods=["POST"])
@token_auth.login_required
@body(UpdateSeasonSchema)
def update_season(data):
    """ Update the season of an updated anime or series for the user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > media_assoc.media.eps_per_season[-1].season:
        return abort(400, description="Invalid season")

    old_season = media_assoc.current_season
    old_eps = media_assoc.last_episode_watched
    old_total = media_assoc.total

    new_watched = sum(media_assoc.media.eps_seasons_list[:data["payload"] - 1]) + 1
    media_assoc.current_season = data["payload"]
    media_assoc.last_episode_watched = 1
    new_total = new_watched + (media_assoc.redo * sum(media_assoc.media.eps_seasons_list))
    media_assoc.total = new_total

    UserMediaUpdate.set_new_update(
        media_assoc.media,
        UpdateType.TV,
        (old_season, old_eps),
        (data["payload"], 1),
    )
    media_assoc.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type'].value} [ID {data['media_id']}] new season ="
                            f" {data['payload']}")

    return {}, 204


@media_bp.route("/update_episode", methods=["POST"])
@token_auth.login_required
@body(UpdateEpisodeSchema)
def update_episode(data):
    """ Update the episode of an updated anime or series from a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > media_assoc.media.eps_per_season[media_assoc.current_season - 1].episodes:
        return abort(400, description="Invalid episode")

    old_season = media_assoc.current_season
    old_episode = media_assoc.last_episode_watched
    old_total = media_assoc.total
    new_watched = sum(media_assoc.media.eps_seasons_list[:old_season - 1]) + data["payload"]
    new_total = new_watched + (media_assoc.redo * sum(media_assoc.media.eps_seasons_list))

    media_assoc.last_episode_watched = data["payload"]
    media_assoc.total = new_total

    UserMediaUpdate.set_new_update(
        media_assoc.media,
        UpdateType.TV,
        (old_season, old_episode),
        (old_season, data["payload"]),
    )
    media_assoc.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type'].value} [ID {data['media_id']}] new "
                            f"episode = {data['payload']}")

    return {}, 204


@media_bp.route("/update_page", methods=["POST"])
@token_auth.login_required
@body(UpdatePageSchema)
def update_page(data):
    """ Update the page read of an updated book from a user """

    media_assoc = data["models"].query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first_or_404()

    if data["payload"] > int(media_assoc.media.pages):
        return abort(400, description="Invalid page")

    old_page = media_assoc.actual_page
    old_total = media_assoc.total

    media_assoc.actual_page = data["payload"]
    new_total = data["payload"] + (media_assoc.redo * media_assoc.media.pages)
    media_assoc.total = new_total

    UserMediaUpdate.set_new_update(media_assoc.media, UpdateType.PAGE, old_page, data["payload"])
    media_assoc.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {data['media_type'].value} [ID {data['media_id']}] page "
                            f"updated to {data['payload']}")

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

    current_app.logger.info(f"[User {current_user.id}] {len(data['update_ids'])} updates successfully deleted")

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
