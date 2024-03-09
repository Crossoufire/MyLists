from typing import Any, Dict
from flask import current_app
from flask import jsonify, Blueprint, abort
from backend.api import db
from backend.api.routes.handlers import token_auth, current_user
from backend.api.models.user_models import UserLastUpdate, get_coming_next
from backend.api.utils.decorators import validate_json_data
from backend.api.utils.enums import MediaType, Status, ModelTypes

media_bp = Blueprint("api_media", __name__)


@media_bp.route("/coming_next", methods=["GET"])
@token_auth.login_required
def coming_next():
    """ For current_user, get their coming next dates for <series>, <anime>, <movies>, and <games> """

    data = [{
        "media_type": mt.value,
        "items": get_coming_next(mt)
    } for mt in MediaType if (
            (mt != MediaType.ANIME or current_user.add_anime)
            and (mt != MediaType.GAMES or current_user.add_games)
            and mt != MediaType.BOOKS)
    ]

    return jsonify(data=data)


@media_bp.route("/add_media", methods=["POST"])
@token_auth.login_required
@validate_json_data()
def add_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Add a <media> to the <current_user> and return the information """

    # Rename for clarity
    new_status = payload

    # Check if <new_status> was given
    if new_status is None:
        new_status = models[ModelTypes.LIST].DEFAULT_STATUS.value

    # Check <new_status> parameter
    try:
        new_status = Status(new_status)
    except:
        return abort(400, "The status is not recognized.")

    # Check media from MediaList table not in user list
    in_list = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if in_list:
        return abort(400, "The media is already present in your list.")

    # Check if <media> from Media table exists
    media = models[ModelTypes.MEDIA].query.filter_by(id=media_id).first()
    if not media:
        return abort(400, "The media does not exists.")

    # Add media to user
    new_watched = media.add_media_to_user(new_status, user_id=current_user.id)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} added [ID {media_id}] with status: {new_status}")

    # Set new update
    UserLastUpdate.set_new_update(media=media, update_type="status", old_value=None, new_value=new_status)

    # Compute new time spent (re-query necessary!)
    in_list = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    in_list.update_time_spent(new_value=new_watched)

    # Commit changes
    db.session.commit()

    # Return <current user> media info
    user_data = media.get_user_list_info(models[ModelTypes.LABELS])

    return jsonify(data=user_data)


# noinspection PyUnusedLocal
@media_bp.route("/delete_media", methods=["POST"])
@token_auth.login_required
@validate_json_data(type_=None)
def delete_media(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Delete a media from the user """

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # <Games> model don't have total
    try:
        old_total = media.total
    except:
        old_total = media.playtime

    # Update new time spent
    media.update_time_spent(old_value=old_total, new_value=0)

    # Delete media from user list
    db.session.delete(media)

    # Delete associated labels
    models[ModelTypes.LABELS].query.filter_by(user_id=current_user.id, media_id=media_id).delete()

    # Delete associated updates
    UserLastUpdate.query.filter_by(user_id=current_user.id, media_id=media_id, media_type=media.GROUP).delete()

    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type} [ID {media_id}] successfully removed.")

    return {}, 204


@media_bp.route("/update_favorite", methods=["POST"])
@token_auth.login_required
@validate_json_data(bool)
def update_favorite(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Add or remove the media as favorite for the current user """

    # Check if <media_id> in user list
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Add favorite
    media.favorite = payload

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] [{media_type}] with ID [{media_id}] changed favorite: {payload}")

    return {}, 204


@media_bp.route("/update_status", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_status(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media status of a user """

    # Check <status> parameter
    try:
        new_status = Status(payload)
    except:
        return abort(400)

    # Get media
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Change <status> and get data to compute <last_updates> and <new_time_spent>
    try:
        old_total = media.total
    except:
        old_total = media.playtime

    old_status = media.status
    new_total = media.update_status(new_status)

    # Set last updates
    UserLastUpdate.set_new_update(media.media, "status", old_status, new_status)

    # Compute new time spent
    media.update_time_spent(old_value=old_total, new_value=new_total)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type}'s category [ID {media_id}] changed to {new_status}")

    return {}, 204


@media_bp.route("/update_rating", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_rating(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media rating (either 'score' or 'feeling') entered by a user """

    # Get <metric_name>
    rating_name = "feeling" if current_user.add_feeling else "score"

    if rating_name == "score":
        # Check <payload> is '---' or between [0-10]
        try:
            if 0 > float(payload) or float(payload) > 10:
                return abort(400)
        except:
            payload = None
    elif rating_name == "feeling":
        # Check <payload> null or between 1 and 4
        try:
            if 0 > int(payload) or int(payload) > 5:
                return abort(400)
        except:
            payload = None
    else:
        return abort(400)

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Set new data
    if rating_name == "score":
        media.score = payload
    elif rating_name == "feeling":
        media.feeling = payload

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] [{media_type.value}] ID {media_id} score/feeling updated to {payload}")

    return {}, 204


@media_bp.route("/update_redo", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_redo(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media redo value for a user """

    # Clarity
    new_redo = payload

    # Check <new_redo> is between [0-10]
    if 0 > new_redo > 10:
        return abort(400, "You can't update this value higher than 10. For now ^^.")

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media or media.status != Status.COMPLETED:
        return abort(400, "To update this value the media needs to be completed first.")

    # Update redo and total data done
    old_redo = media.rewatched
    old_total = media.total
    new_total = media.update_total_watched(new_redo)

    # Compute new time spent
    media.update_time_spent(old_value=old_total, new_value=new_total)

    # Add update info
    UserLastUpdate.set_new_update(media.media, "redo", old_redo, new_redo)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] Media ID {media_id} [{media_type}] rewatched {new_redo}x times")

    return {}, 204


@media_bp.route("/update_comment", methods=["POST"])
@token_auth.login_required
@validate_json_data(str)
def update_comment(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the media comment for a user """

    # Check if <media> is <current_user> list
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(400)

    # Update comment
    media.comment = payload

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] updated a comment on {media_type} with ID [{media_id}]")

    return {}, 204


@media_bp.route("/update_playtime", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_playtime(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update playtime of an updated game from a user """

    # Get in minutes
    new_playtime = payload * 60

    # Check negative playtime
    if new_playtime < 0:
        return abort(400)

    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Set last updates
    UserLastUpdate.set_new_update(media.media, "playtime", media.playtime, new_playtime)

    # Compute new time spent
    media.update_time_spent(old_value=media.playtime, new_value=new_playtime)

    # Update new playtime
    media.playtime = new_playtime

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[{current_user.id}] {media_type.value} ID {media_id} playtime updated to {new_playtime}")

    return {}, 204


@media_bp.route("/update_season", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_season(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the season of an updated anime or series for the user """

    new_season = payload

    # Check if <media> exists
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Check if season number is between 1 and <last_season>
    if 1 > new_season or new_season > media.media.eps_per_season[-1].season:
        return abort(400)

    # Get old data
    old_season = media.current_season
    old_eps = media.last_episode_watched
    old_total = media.total

    # Set new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:new_season - 1]]) + 1
    media.current_season = new_season
    media.last_episode_watched = 1
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total

    # Set new update
    UserLastUpdate.set_new_update(media.media, "season", old_season, new_season, old_episode=old_eps, new_episode=1)

    # Compute new time spent
    media.update_time_spent(old_value=old_total, new_value=new_total)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] season updated to {new_season}")

    return {}, 204


@media_bp.route("/update_episode", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_episode(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the episode of an updated anime or series from a user """

    new_episode = payload

    # Check if media exists
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Check if episode number between 1 and <last_episode>
    if 1 > new_episode or new_episode > media.media.eps_per_season[media.current_season - 1].episodes:
        return abort(400)

    # Get old data
    old_season = media.current_season
    old_episode = media.last_episode_watched
    old_total = media.total

    # Set new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:old_season - 1]]) + new_episode
    media.last_episode_watched = new_episode
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total

    UserLastUpdate.set_new_update(media.media, "episode", old_episode, new_episode, old_season=old_season)

    # Compute new time spent
    media.update_time_spent(old_value=old_total, new_value=new_total)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] episode updated to {new_episode}")

    return {}, 204


@media_bp.route("/update_page", methods=["POST"])
@token_auth.login_required
@validate_json_data(int)
def update_page(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
    """ Update the page read of an updated book from a user """

    new_page = payload

    # Validate if media exists
    media = models[ModelTypes.LIST].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    # Validate page value
    if new_page > int(media.media.pages) or new_page < 0:
        return abort(400, "Invalid page value. Please provide a valid page number.")

    # Fetch old data
    old_page = media.actual_page
    old_total = media.total

    # Set new data
    media.actual_page = new_page
    new_total = new_page + (media.rewatched * media.media.pages)
    media.total = new_total

    UserLastUpdate.set_new_update(media.media, "page", old_page, new_page)

    # Compute new time spent
    media.update_time_spent(old_value=old_total, new_value=new_total)

    # Commit changes
    db.session.commit()
    current_app.logger.info(f"[User {current_user.id}] {media_type.value} [ID {media_id}] page updated to {new_page}")

    return {}, 204
