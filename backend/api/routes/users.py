import json
from datetime import datetime
from typing import Dict
import pytz
from flask import Blueprint, request, jsonify, abort, current_app
from flask_bcrypt import generate_password_hash

from backend.api import db
from backend.api.routes.auth import token_auth, current_user
from backend.api.routes.email import send_email
from backend.api.models.user_models import (Notifications, UserLastUpdate, User, Token, followers)
from backend.api.utils.enums import RoleType, ModelTypes
from backend.api.utils.functions import save_picture, get_models_type

users = Blueprint("api_users", __name__)


@users.route("/register_user", methods=["POST"])
def register_user():
    """ Register a new user """

    try:
        data = request.get_json()
    except:
        return abort(400)

    # Necessary register fields
    fields = ("username", "email", "password", "callback")

    if not all(f in data for f in fields):
        return abort(400, f"Not all fields included: {', '.join(fields)}")

    if User.query.filter_by(username=data["username"]).first():
        return abort(401, {"username": "Invalid Username"})

    if User.query.filter_by(email=data["email"]).first():
        return abort(401, {"email": "Invalid email"})

    # Create <new_user>
    new_user = User(
        username=data["username"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        registered_on=datetime.utcnow(),
        private=False,
    )

    # Add and commit
    db.session.add(new_user)
    db.session.commit()

    # Send email to <new_user>
    try:
        send_email(
            user=new_user,
            subject="Register account",
            template="register",
            callback=data["callback"]
        )
    except Exception as e:
        current_app.logger.error(f"ERROR sending an email to account [{new_user.id}]: {e}")
        return abort(400, "An error occurred while sending your register email. Please try again later")

    return {"message": "Your account has been created. Check your email address to activate your account."}, 200


@users.route("/current_user", methods=["GET"])
@token_auth.login_required
def get_current_user() -> Dict:
    """ Return the logged current user """
    return current_user.to_dict()


@users.route("/profile/<username>", methods=["GET"])
@token_auth.login_required
def profile(username: str):
    """ Get all the user info necessary for its profile """

    if current_user:
        user = current_user.check_autorization(username)

        # Update <user> profile view count
        if current_user.role != RoleType.ADMIN and user.id != current_user.id:
            user.profile_views += 1

        is_following = current_user.is_following(user)
    else:
        user = User.query.filter_by(username=username).first()
        if not user:
            return abort(404)
        user.profile_views += 1
        is_following = False

    # Get <user> last updates
    user_updates = user.get_last_updates(limit_=6)

    # Get <follows> last updates
    follows_updates = user.get_follows_updates(limit_=10)

    # Get List Levels of user
    list_levels = user.get_list_levels()

    # Get summary statistics
    media_global = user.get_global_media_stats()

    # Get media details
    list_models = [ml for ml in get_models_type(ModelTypes.LIST) if getattr(user, f"add_{ml.GROUP.value.lower()}", None)
                   is None or getattr(user, f"add_{ml.GROUP.value.lower()}")]
    media_data = [user.get_one_media_details(ml.GROUP) for ml in list_models]

    # Commit changes
    db.session.commit()

    # Create <profile_data> dict
    data = dict(
        user_data=user.to_dict(),
        user_updates=user_updates,
        follows=[follow.to_dict() for follow in user.followed.limit(8).all()],
        follows_updates=follows_updates,
        is_following=is_following,
        list_levels=list_levels,
        media_global=media_global,
        media_data=media_data,
    )

    return jsonify(data=data)


@users.route("/profile/<username>/followers", methods=["GET"])
@token_auth.login_required
def profile_followers(username: str):
    """ Fetch all the followers of the user """

    if current_user:
        user = current_user.check_autorization(username)
    else:
        user = User.query.filter_by(username=username).first()
        if not user:
            return abort(404)

    data = dict(
        user_data=user.to_dict(),
        follows=[follow.to_dict() for follow in user.followers.all()],
    )

    return jsonify(data=data)


@users.route("/profile/<username>/follows", methods=["GET"])
@token_auth.login_required
def profile_follows(username: str):
    """ Fetch all the follows of the user """

    if current_user:
        user = current_user.check_autorization(username)
    else:
        user = User.query.filter_by(username=username).first()
        if not user:
            return abort(404)

    data = dict(
        user_data=user.to_dict(),
        follows=[follow.to_dict() for follow in user.followed.all()],
    )

    return jsonify(data=data)


@users.route("/profile/<username>/history", methods=["GET"])
@token_auth.login_required
def history(username: str):
    """ Fetch all history for each media for the user """

    if current_user:
        user = current_user.check_autorization(username)
    else:
        user = User.query.filter_by(username=username).first()
        if not user:
            return abort(404)

    # Fetch request args
    search = request.args.get("search", "")
    page = request.args.get("page", 1, type=int)

    # Paginate query
    history_query = (user.last_updates.filter(UserLastUpdate.media_name.ilike(f"%{search}%"))
                     .paginate(page=page, per_page=25, error_out=True))

    data = dict(
        history=[hist_item.to_dict() for hist_item in history_query.items],
        active_page=history_query.page,
        pages=history_query.pages,
        total=history_query.total,
    )

    return jsonify(data=data)


@users.route("/update_follow", methods=["POST"])
@token_auth.login_required
def update_follow():
    """ Update the follow status of a user """

    try:
        json_data = request.get_json()
        follow_id = int(json_data["follow_id"])
        follow_status = bool(json_data["follow_status"])
    except:
        return abort(400)

    # Check if <follow> exist in <User> table
    user = User.query.filter_by(id=follow_id).first()
    if not user or user.id == current_user.id:
        return abort(400)

    # Check follow status
    if follow_status:
        # Add follow to current_user
        current_user.add_follow(user)

        # Notify followed user
        payload = {
            "username": current_user.username,
            "message": f"{current_user.username} is following you"
        }

        # Add notification and commit changes
        db.session.add(Notifications(user_id=user.id, payload_json=json.dumps(payload)))
        db.session.commit()

        # Log info
        current_app.logger.info(f"[{current_user.id}] Follow the account with ID {follow_id}")
    else:
        # Remove follow
        current_user.remove_follow(user)
        db.session.commit()

        # Log info
        current_app.logger.info(f"[{current_user.id}] Unfollowed the account with ID {follow_id}")

    return {}, 204


@users.route("/update_settings", methods=["GET", "POST"])
@token_auth.login_required
def update_settings():
    """ Edit current user information """

    # Get form data
    data = request.form
    message = "Settings successfully updated."

    # Check username info
    new_username = data.get("username")
    if new_username:
        if new_username != current_user.username:
            if len(new_username) < 3:
                return abort(400, {"username": "The username is too short (3 min)."})
            if len(new_username) > 14:
                return abort(400, {"username": "The username is too long (14 max)."})
            check_username = User.query.filter_by(username=new_username).first()
            if check_username:
                return abort(400, {"username": "The selected username is already in use"})

            # Change username
            current_user.username = new_username

    # Change profile image
    profile_image = request.files.get("profile_image")
    if profile_image:
        old_picture = current_user.image_file
        current_user.image_file = save_picture(profile_image, old_picture)
        current_app.logger.info(f"[{current_user.id}] Old picture = {old_picture}. New picture = {current_user.image_file}")

    # Change background image
    back_image = request.files.get("background_image")
    if back_image:
        old_picture = current_user.background_image
        current_user.background_image = save_picture(back_image, old_picture, profile=False)
        current_app.logger.info(f"[{current_user.id}] Old picture = {old_picture}. New = {current_user.background_image}")

    # Activate/Deactivate Feeling/Score
    rating = data.get("add_feeling")
    if rating:
        current_user.add_feeling = False if rating == "false" else True

    # Activate/Deactivate AnimeList
    animelist = data.get("add_anime")
    if animelist:
        current_user.add_anime = False if animelist == "false" else True

    # Activate/Deactivate GamesList
    gameslist = data.get("add_games")
    if gameslist:
        current_user.add_games = False if gameslist == "false" else True

    # Activate/Deactivate BooksList
    bookslist = data.get("add_books")
    if bookslist:
        current_user.add_books = False if bookslist == "false" else True

    # Check password info
    new_password = data.get("new_password")
    current_password = data.get("current_password")
    if new_password:
        if new_password and (not current_password or not current_user.verify_password(current_password)):
            return abort(400, {"current_password": "Your current password is incorrect"})
        if len(new_password) < 8:
            return abort(400, {"new_password": "Your new password is too short (8 min)"})

        # Change password
        current_user.password = generate_password_hash(new_password)

    # Commit all changes
    db.session.commit()

    # Return updated user and message
    data = dict(
        updated_user=current_user.to_dict(),
        message=message,
    )

    return data


@users.route("/notifications", methods=["GET"])
@token_auth.login_required
def notifications():
    """ Fetch the current user's notifications """

    # Change last time <current_user> looked at notifications
    current_user.last_notif_read_time = datetime.utcnow()

    # Commit changes
    db.session.commit()

    # Get current user last notifications
    notifs = current_user.get_last_notifications(limit_=8)

    results = [{
        "media_id": notif.media_id,
        "media": notif.media_type.replace("list", "") if notif.media_type else None,
        "timestamp": notif.timestamp.replace(tzinfo=pytz.UTC).isoformat(),
        "payload": json.loads(notif.payload_json),
    } for notif in notifs]

    return jsonify(data=results)


@users.route("/notifications/count", methods=["GET"])
@token_auth.login_required
def count_notifs():
    """ Fetch the current user's notifications """
    return jsonify(data=current_user.count_notifications()), 200


@users.route("/delete_account", methods=["POST"])
@token_auth.login_required
def delete_account():
    """ Endpoint allowing the user to remove its account """

    try:
        # Delete all tokens associated with user
        Token.query.filter_by(user_id=current_user.id).delete()

        # Delete user
        User.query.filter_by(id=current_user.id).delete()

        # Remove all entries where user is a follower or followed
        db.session.query(followers).filter((followers.c.follower_id == current_user.id) |
                                           (followers.c.followed_id == current_user.id)).delete()

        # Delete user's last update information
        UserLastUpdate.query.filter_by(user_id=current_user.id).delete()

        # Delete all user's notifications
        Notifications.query.filter_by(user_id=current_user.id).delete()

        # Delete all media list associated with user
        models_list = get_models_type(ModelTypes.LIST)
        for model in models_list:
            model.query.filter_by(user_id=current_user.id).delete()

        # Delete all media labels associated with user
        models_labels = get_models_type(ModelTypes.LABELS)
        for model in models_labels:
            model.query.filter_by(user_id=current_user.id).delete()

        db.session.commit()

        return {"message": "Your account has been successfully deleted."}, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error trying to delete account [ID = {current_user.id}]: {e}")
        return abort(500, "Sorry, an error occurred. Please try again later.")