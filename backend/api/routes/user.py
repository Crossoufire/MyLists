import json
from datetime import datetime
from flask import Blueprint, request, abort, g
from backend.api import db
from backend.api.core.handlers import token_auth
from backend.api.schemas.core import SearchPaginationSchema, EmptySchema
from backend.api.schemas.user import *
from backend.api.utils.decorators import check_privacy_access, paginated_response
from backend.api.utils.enums import NotificationType, MediaType, ModelTypes
from backend.api.utils.functions import save_picture, ModelsFetcher
from backend.my_apifairy import response, authenticate, other_responses, body

user = Blueprint("user", __name__)


@user.route("/user/me", methods=["GET"])
@authenticate(token_auth)
@response(UserSchema, 200, description="Return user data")
def me():
    """ Get Current User """
    return current_user


@user.route("/user/profile/<username>", methods=["GET"])
@authenticate(token_auth, optional=True)
@check_privacy_access
@response(ProfileSchema, 200, description="Return the profile data")
@other_responses({404: "User not found", 401: "Authentication required", 403: "Unauthorized"})
def get_profile():
    """ Get User Profile """

    user = g.requested_user

    profile_data = dict(
        user_data=user,
        follows=user.get_follows(limit_=8),
        is_following=False if not current_user else current_user.is_following(user),
        user_updates=UserMediaUpdate.get_last_updates(user.id, 6),
        follows_updates=UserMediaUpdate.get_last_updates(user.id, 10, True),
        media_data=pm.get_user_media_data(),
    )

    return profile_data


@user.route("/user/<username>/followers", methods=["GET"])
@authenticate(token_auth, optional=True)
@check_privacy_access
@response(FollowsSchema(many=True), 200, description="List of the user's followers")
@other_responses({404: "User not found", 401: "Authentication required", 403: "Unauthorized"})
def get_followers():
    """ Get User Followers """
    return g.requested_user.followers.all()


@user.route("/user/<username>/following", methods=["GET"])
@authenticate(token_auth, optional=True)
@check_privacy_access
@response(FollowsSchema(many=True), 200, description="List of the user's follows")
@other_responses({404: "User not found", 401: "Authentication required", 403: "Unauthorized"})
def get_following():
    """ Get User Follows """
    return g.requested_user.followed.all()


@user.route("/user/<username>/media-history", methods=["GET"])
@authenticate(token_auth, optional=True)
@check_privacy_access
@paginated_response(UserMediaUpdateSchema, model=UserMediaUpdate, p_schema=SearchPaginationSchema)
def get_media_history():
    """ Get User History """
    return g.requested_user.updates


@user.route("/user/modal-preference", methods=["POST"])
@authenticate(token_auth)
@response(EmptySchema, 204, description="Hide the Update Modal until the next update")
def update_modal_preference():
    """ Hide Current User Update Modal """
    current_user.show_update_modal = False
    db.session.commit()
    return {}


@user.route("/user/follow", methods=["POST"])
@authenticate(token_auth)
@body(UpdateFollowSchema)
@response(EmptySchema, 204, description="Follow status successfully updated")
@other_responses({404: "User not found"})
def toggle_follow(data):
    """ Update Current User Follow Status """

    user = User.query.filter_by(id=data["follow_id"]).first()
    if not user or user.id == current_user.id:
        return abort(404, "User not found")

    if data["status"] is True:
        current_user.add_follow(user)

        new_notification = Notifications(
            user_id=user.id,
            notif_type=NotificationType.FOLLOW,
            notif_data=json.dumps({
                "username": current_user.username,
                "message": f"{current_user.username} is following you",
            }),
        )
        db.session.add(new_notification)
    else:
        current_user.remove_follow(user)

    db.session.commit()

    return {}


@user.route("/user/notifications", methods=["GET"])
@authenticate(token_auth)
@response(NotificationSchema(many=True), 200, description="Return the user's last notifications")
def get_notifications():
    """ Get Current User Notifications """
    current_user.last_notif_read_time = datetime.utcnow()
    db.session.commit()
    return current_user.notifications.limit(8).all()


@user.route("/user/notifications/unread-count", methods=["GET"])
@authenticate(token_auth)
@response(CountNotificationSchema, 200, description="Return the user's new notifications count")
def get_notification_count():
    """ Count Current User Unread Notifications """
    last_notif_read_time = current_user.last_notif_read_time or datetime(1970, 1, 1)
    return current_user.notifications.filter(Notifications.timestamp > last_notif_read_time).count()


@user.route("/user/settings/general", methods=["PUT"])
@authenticate(token_auth)
@response(UserSchema, 200, description="User settings successfully updated")
def update_general_settings():
    """ Edit Current User Data """

    data = request.form

    new_username = data.get("username")
    if new_username:
        if new_username != current_user.username:
            if len(new_username) < 3:
                return abort(400, "The username is too short (3 min)")
            if len(new_username) > 15:
                return abort(400, "The username is too long (15 max)")
            if User.query.filter_by(username=new_username).first():
                return abort(400, "This username is not available")
            current_user.username = new_username

    profile_image = request.files.get("profile_image")
    if profile_image:
        old_picture = current_user.image_file
        current_user.image_file = save_picture(profile_image, old_picture)

    back_image = request.files.get("background_image")
    if back_image:
        old_picture = current_user.background_image
        current_user.background_image = save_picture(back_image, old_picture, profile=False)

    db.session.commit()

    return current_user, 200


@user.route("/user/settings/medialist", methods=["PUT"])
@authenticate(token_auth)
@body(UpdateMediaListUserSchema)
@response(UserSchema, 200, description="User medialist settings successfully updated")
def update_medialist_settings(data):
    """ Edit Current User Active Medialist """

    current_user.rating_system = data["rating_system"]

    for setting in current_user.settings:
        if setting.media_type == MediaType.ANIME:
            setting.active = data["anime_list"]
        elif setting.media_type == MediaType.GAMES:
            setting.active = data["games_list"]
        elif setting.media_type == MediaType.BOOKS:
            setting.active = data["books_list"]

    db.session.commit()

    return current_user


@user.route("/user/settings/password", methods=["PUT"])
@authenticate(token_auth)
@body(UpdatePasswordUserSchema)
@response(EmptySchema, 204, description="User password successfully updated")
def change_password(data):
    """ Change Current User Password """
    current_user.password = data["new_password"]
    db.session.commit()
    return {}


@user.route("/user/delete", methods=["DELETE"])
@authenticate(token_auth)
@response(EmptySchema, 204, description="Account successfully deleted")
@other_responses({500: "Error trying to delete account"})
def delete_account():
    """ Delete Current User Account """

    from backend.api.models import Token
    from backend.api.models import followers

    try:

        Token.query.filter_by(user_id=current_user.id).delete()
        User.query.filter_by(id=current_user.id).delete()

        db.session.query(followers).filter(
            (followers.c.follower_id == current_user.id) | (followers.c.followed_id == current_user.id)
        ).delete()

        UserMediaUpdate.query.filter_by(user_id=current_user.id).delete()
        Notifications.query.filter_by(user_id=current_user.id).delete()

        models = ModelsFetcher.get_dict_models("all", ModelTypes.LIST)
        for model in models.values():
            model.query.filter_by(user_id=current_user.id).delete()

        models_labels = ModelsFetcher.get_dict_models("all", ModelTypes.LABELS)
        for model in models_labels.values():
            model.query.filter_by(user_id=current_user.id).delete()

        db.session.commit()
        return {}
    except:
        db.session.rollback()
        return abort(500, "Sorry, an unexpected error occurred. Please try again later.")
