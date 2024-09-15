import json

from flask import Blueprint, request, jsonify, abort, current_app
from flask_bcrypt import generate_password_hash

from backend.api import db
from backend.api.core import current_user, token_auth
from backend.api.core.email import send_email
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models.user import Notifications, User, Token, followers, UserMediaUpdate, UserMediaSettings
from backend.api.schemas.users import HistorySchema, UpdateFollowSchema, RegisterUserSchema, \
    PasswordSchema, ListSettingsSchema, GeneralSettingsSchema
from backend.api.utils.decorators import arguments, body
from backend.api.utils.enums import ModelTypes, NotificationType, MediaType
from backend.api.utils.functions import format_to_download_as_csv, save_picture


users = Blueprint("api_users", __name__)


@users.route("/register_user", methods=["POST"])
@body(RegisterUserSchema)
def register_user(data):
    new_user = User.register_new_user(
        username=data["username"],
        email=data["email"],
        password=data["password"],
    )

    try:
        send_email(
            to=new_user.email,
            username=new_user.username,
            subject="Register account",
            template="register",
            callback=data["callback"],
            token=new_user.generate_jwt_token(),
        )
    except:
        return abort(500, description="Failed to send registration email")

    return {}, 204


@users.route("/current_user", methods=["GET"])
@token_auth.login_required
def get_current_user():
    return current_user.to_dict(), 200


@users.route("/profile/<username>", methods=["GET"])
@token_auth.login_required
def profile(username: str):
    user = current_user.check_autorization(username)
    active_media_types = [setting.media_type for setting in user.settings if setting.active]

    if current_user.id != user.id:
        user.profile_views += 1

    user_updates = user.get_last_updates(limit=6)
    follows_updates = user.get_follows_updates(limit=10)
    list_levels = user.get_list_levels()
    media_global = user.get_global_media_stats()
    models = ModelsManager.get_lists_models(active_media_types, ModelTypes.LIST)
    media_data = [user.get_one_media_details(model.GROUP) for model in models]

    db.session.commit()

    data = dict(
        user_data=user.to_dict(),
        user_updates=user_updates,
        follows=user.get_follows(limit=8),
        follows_updates=follows_updates,
        is_following=current_user.is_following(user),
        list_levels=list_levels,
        media_global=media_global,
        media_data=media_data,
    )

    return jsonify(data=data), 200


@users.route("/profile/<username>/followers", methods=["GET"])
@token_auth.login_required
def profile_followers(username: str):
    """ Fetch all the followers of the user """

    user = current_user.check_autorization(username)

    data = dict(
        user_data=user.to_dict(),
        follows=[follow.to_dict() for follow in user.followers.all()],
    )

    return jsonify(data=data), 200


@users.route("/profile/<username>/follows", methods=["GET"])
@token_auth.login_required
def profile_follows(username: str):
    """ Fetch all the follows of the user """

    user = current_user.check_autorization(username)

    data = dict(
        user_data=user.to_dict(),
        follows=[follow.to_dict() for follow in user.followed.all()],
    )

    return jsonify(data=data), 200


@users.route("/profile/<username>/history", methods=["GET"])
@token_auth.login_required
@arguments(HistorySchema)
def history(args, username: str):
    """ Fetch all history for each media for the user """

    user = current_user.check_autorization(username)

    history_query = (
        user.updates.filter(UserMediaUpdate.media_name.ilike(f"%{args['search']}%"))
        .paginate(page=args["page"], per_page=25)
    )

    data = dict(
        items=[item.to_dict() for item in history_query.items],
        page=history_query.page,
        pages=history_query.pages,
        total=history_query.total,
    )

    return jsonify(data=data), 200


@users.route("/update_modal", methods=["POST"])
@token_auth.login_required
def update_modal():
    """ Hide the Update Modal in /profile """
    current_user.show_update_modal = False
    db.session.commit()
    return {}, 204


@users.route("/update_follow", methods=["POST"])
@token_auth.login_required
@body(UpdateFollowSchema)
def update_follow(data):
    """ Update the follow status of a user """

    user = User.query.filter_by(id=data["follow_id"]).first_or_404()
    if user.id == current_user.id:
        return abort(400, description="You cannot follow yourself")

    if data["follow_status"]:
        current_user.add_follow(user)

        payload = dict(username=current_user.username, message=f"{current_user.username} is following you")
        new_notification = Notifications(
            user_id=user.id,
            notification_type=NotificationType.FOLLOW,
            payload=json.dumps(payload),
        )
        db.session.add(new_notification)
        db.session.commit()
        current_app.logger.info(f"[{current_user.id}] Follow the account with ID {data['follow_id']}")
    else:
        current_user.remove_follow(user)
        db.session.commit()
        current_app.logger.info(f"[{current_user.id}] Unfollowed the account with ID {data['follow_id']}")

    return {}, 204


@users.route("/notifications", methods=["GET"])
@token_auth.login_required
def notifications():
    return jsonify(data=current_user.get_last_notifications(limit=8)), 200


@users.route("/notifications/count", methods=["GET"])
@token_auth.login_required
def count_notifs():
    return jsonify(data=current_user.count_notifications()), 200


@users.route("/settings/general", methods=["POST"])
@token_auth.login_required
@body(GeneralSettingsSchema, location="form")
def settings_general(data):
    """ Edit the general current user information """

    if data.get("username"):
        current_user.username = data["username"]

    profile_image = request.files.get("profile_image")
    if profile_image:
        old_pict = current_user.image_file
        current_user.image_file = save_picture(profile_image, old_pict)

    back_image = request.files.get("background_image")
    if back_image:
        old_pict = current_user.background_image
        current_user.background_image = save_picture(back_image, old_pict, profile=False)

    db.session.commit()

    return jsonify(data=current_user.to_dict()), 200


@users.route("/settings/medialist", methods=["POST"])
@token_auth.login_required
@body(ListSettingsSchema)
def settings_medialist(data):
    """ Edit the medialist current user information """

    if data["add_feeling"] is not None:
        current_user.add_feeling = data["add_feeling"]

    if data["grid_list_view"] is not None:
        current_user.grid_list_view = data["grid_list_view"]

    for media_type in [MediaType.ANIME, MediaType.GAMES, MediaType.BOOKS]:
        setting_key = f"add_{media_type.value.lower()}"
        if data[setting_key] is not None:
            setting = current_user.get_media_setting(media_type)
            setting.active = data[setting_key]

    db.session.commit()

    return jsonify(data=current_user.to_dict()), 200


@users.route("/settings/password", methods=["POST"])
@token_auth.login_required
@body(PasswordSchema)
def settings_password(data):
    """ Edit the password of the current user """
    current_user.password = generate_password_hash(data["new_password"])
    db.session.commit()
    return {}, 204


@users.route("/settings/delete_account", methods=["POST"])
@token_auth.login_required
def settings_delete():
    """ Endpoint allowing the user to delete its account """

    try:
        Token.query.filter_by(user_id=current_user.id).delete()
        User.query.filter_by(id=current_user.id).delete()

        db.session.query(followers).filter(
            (followers.c.follower_id == current_user.id) | (followers.c.followed_id == current_user.id)
        ).delete()

        UserMediaUpdate.query.filter_by(user_id=current_user.id).delete()
        Notifications.query.filter_by(user_id=current_user.id).delete()
        UserMediaSettings.query.filter_by(user_id=current_user.id).delete()

        models = ModelsManager.get_dict_models("all", ModelTypes.LIST)
        for model in models.values():
            model.query.filter_by(user_id=current_user.id).delete()

        models_labels = ModelsManager.get_dict_models("all", ModelTypes.LABELS)
        for model in models_labels.values():
            model.query.filter_by(user_id=current_user.id).delete()

        db.session.commit()
        current_app.logger.info(f"The account [ID = {current_user.id}] has been successfully deleted")
        return {}, 204
    except:
        db.session.rollback()
        return abort(500, description="Failed to delete account")


@users.route("/settings/download/<mediatype:media_type>", methods=["GET"])
@token_auth.login_required
def download_medialist(media_type: MediaType):
    """ Download the selected medialist data """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)
    media_data = list_model.query.filter_by(user_id=current_user.id).all()

    return jsonify(data=[format_to_download_as_csv(media.to_dict()) for media in media_data]), 200
