from typing import Any, Dict
from flask import current_app
from flask import jsonify, Blueprint, abort
from backend.api import db
from backend.api.core import token_auth, current_user
from backend.api.models.user import UserLastUpdate
from backend.api.utils.decorators import validate_json_data
from backend.api.utils.enums import MediaType, Status, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager

media_bp = Blueprint("api_media", __name__)


@media_bp.route("/coming_next", methods=["GET"])
@token_auth.login_required
def coming_next():
    models_list = ModelsManager.get_lists_models(current_user.activated_media_type(), ModelTypes.LIST)
    try:
        # Remove <BooksList> because no coming next possible
        from backend.api.models.books import BooksList
        models_list.remove(BooksList)
    except:
        pass

    data = [{"media_type": model.GROUP.value, "items": model.get_coming_next()} for model in models_list]

    return jsonify(data=data), 200


@media_bp.route("/add_media", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def add_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Add a <media> to the <current_user> and return the newly added information """

    media_model, list_model = models[ModelTypes.MEDIA], models[ModelTypes.LIST]
    new_status = payload
    if new_status is None:
        new_status = list_model.DEFAULT_STATUS.value

    try:
        new_status = Status(new_status)
    except:
        return abort(400, "The status is not recognized")

    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(400, "The media does not exists")

    in_list = list_model.query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if in_list:
        return abort(400, "The media is already present in your list")

    total_watched = media.add_media_to_user(new_status, current_user.id)
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} added [ID {media_id}] with "
                            f"status: {new_status}")

    UserLastUpdate.set_new_update(media=media, update_type="status", old_value=None, new_value=new_status)

    # Compute new time spent (re-query necessary!)
    in_list = list_model.query.filter_by(user_id=current_user.id, media_id=media_id).first()
    in_list.update_time_spent(new_value=total_watched)

    db.session.commit()

    user_data = media.get_user_list_info(models[ModelTypes.LABELS])

    return jsonify(data=user_data), 200


# noinspection PyUnusedLocal
@media_bp.route("/delete_media", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def delete_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Delete a media from the user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400, "This media is not present in your list")

    # <Games> model do not have <total>
    old_total = media.total if media_type != MediaType.GAMES else media.playtime
    media.update_time_spent(old_value=old_total, new_value=0)

    db.session.delete(media)
    models[ModelTypes.LABELS].query.filter_by(user_id=current_user.id, media_id=media_id).delete()
    UserLastUpdate.query.filter_by(user_id=current_user.id, media_id=media_id, media_type=media.GROUP).delete()

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type} [ID {media_id}] successfully removed.")

    return {}, 204


@media_bp.route("/update_favorite", methods=["POST"])
@token_auth.login_required
@validate_json_data(bool)
def update_favorite(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Add or remove the media as favorite for the current user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(404, "The media could not be found")

    media.favorite = bool(payload)
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] [{media_type}], ID [{media_id}] changed favorite: {payload}")

    return {}, 204


@media_bp.route("/update_status", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_status(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media status of a user """

    try:
        new_status = Status(payload)
    except:
        return abort(400)

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(404, "The media could not be found")

    old_total = media.total if media_type != MediaType.GAMES else media.playtime
    old_status = media.status
    new_total = media.update_status(new_status)

    UserLastUpdate.set_new_update(media.media, "status", old_status, new_status)
    media.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type}'s category [ID {media_id}] changed to {new_status}")

    return {}, 204


@media_bp.route("/update_rating", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_rating(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media rating (<score> or <feeling>) entered by a user """

    try:
        payload = float(payload)
        if current_user.add_feeling:
            payload = int(payload)
    except:
        payload = None

    if payload:
        if current_user.add_feeling:
            if payload > 5 or payload < 0:
                return abort(400, "Feeling needs to be between 0 and 5")
        else:
            if payload > 10 or payload < 0:
                return abort(400, "Score needs to be between 0 and 10")

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(404, "The media could not be found")

    if current_user.add_feeling:
        media.feeling = payload
    else:
        media.score = payload

    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] [{media_type.value}] ID {media_id} "
                            f"{'feeling' if current_user.add_feeling else 'score'} updated to {payload}")

    return {}, 204


@media_bp.route("/update_redo", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_redo(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media re-read/re-watched value for a user """

    new_redo = payload

    if media_type == MediaType.GAMES:
        return abort(400, "This value cannot be set for games")

    if new_redo < 0 or new_redo > 10:
        return abort(400, "This value should to be between 0 and 10 included")

    media_list = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media_list:
        return abort(400, "This media is not present in your list")

    if media_list.status != Status.COMPLETED:
        return abort(400, "To update this value the media needs to be completed first")

    old_redo = media_list.redo
    old_total = media_list.total
    new_total = media_list.update_total(new_redo)

    media_list.update_time_spent(old_value=old_total, new_value=new_total)

    UserLastUpdate.set_new_update(media_list.media, "redo", old_redo, new_redo)

    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] Media ID {media_id} [{media_type.value}] redo {new_redo}x times")

    return {}, 204


@media_bp.route("/update_comment", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_comment(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media comment for a user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(404, "The media could not be found")

    if len(payload) > 2000:
        return abort(400, "This comment is too large. The limit is 2000 characters.")

    media.comment = payload
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] updated a comment on {media_type} with ID [{media_id}]")

    return {}, 204


@media_bp.route("/update_playtime", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_playtime(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update playtime of an updated game from a user """

    if media_type != MediaType.GAMES:
        return abort(400, "This value can only be set for games")

    if payload < 0 or payload > 10000:
        return abort(400, "Playtime needs to be comprise between 0 and 10000 hours.")

    # From [hours] to [min]
    new_playtime = payload * 60

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(404, "The media could not be found")

    UserLastUpdate.set_new_update(media.media, "playtime", media.playtime, new_playtime)
    media.update_time_spent(old_value=media.playtime, new_value=new_playtime)

    media.playtime = new_playtime
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] {media_type.value} ID {media_id} playtime updated to {new_playtime}")

    return {}, 204


@media_bp.route("/update_season", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_season(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the season of an updated anime or series for the user """

    new_season = payload

    media_user = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media_user:
        return abort(404, "The media could not be found")

    if 1 > new_season or new_season > media_user.media.eps_per_season[-1].season:
        return abort(400)

    old_season = media_user.current_season
    old_eps = media_user.last_episode_watched
    old_total = media_user.total

    new_watched = sum(media_user.media.eps_per_season_list[:new_season - 1]) + 1
    media_user.current_season = new_season
    media_user.last_episode_watched = 1
    new_total = new_watched + (media_user.redo * sum(media_user.media.eps_per_season_list))
    media_user.total = new_total

    UserLastUpdate.set_new_update(media_user.media, "season", old_season, new_season, old_episode=old_eps,
                                  new_episode=1)
    media_user.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] new season = {new_season}")

    return {}, 204


@media_bp.route("/update_episode", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_episode(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the episode of an updated anime or series from a user """

    new_eps = payload

    media_user = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media_user:
        return abort(404, "The media could not be found")

    if 1 > new_eps or new_eps > media_user.media.eps_per_season[media_user.current_season - 1].episodes:
        return abort(400)

    old_season = media_user.current_season
    old_episode = media_user.last_episode_watched
    old_total = media_user.total
    new_watched = sum(media_user.media.eps_per_season_list[:old_season - 1]) + new_eps
    new_total = new_watched + (media_user.redo * sum(media_user.media.eps_per_season_list))

    media_user.last_episode_watched = new_eps
    media_user.total = new_total

    UserLastUpdate.set_new_update(media_user.media, "episode", old_episode, new_eps, old_season=old_season)
    media_user.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] new episode = {new_eps}")

    return {}, 204


@media_bp.route("/update_page", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_page(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the page read of an updated book from a user """

    new_page = payload

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(404, "The media could not be found")

    if new_page > int(media.media.pages) or new_page < 0:
        return abort(400, "Invalid page value. Please provide a valid page number.")

    old_page = media.actual_page
    old_total = media.total

    media.actual_page = new_page
    new_total = new_page + (media.redo * media.media.pages)
    media.total = new_total

    UserLastUpdate.set_new_update(media.media, "page", old_page, new_page)
    media.update_time_spent(old_value=old_total, new_value=new_total)

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] page updated to {new_page}")

    return {}, 204
