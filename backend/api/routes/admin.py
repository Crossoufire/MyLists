from flask import Blueprint, request, abort, jsonify, current_app
from werkzeug.http import dump_cookie
from backend.api import db
from backend.api.models.user_models import Notifications, Token, User, UserLastUpdate, followers
from backend.api.routes.handlers import token_auth, current_user
from backend.api.utils.enums import ModelTypes, RoleType
from backend.api.utils.functions import get_models_type

admin_bp = Blueprint("api_admin", __name__)


@admin_bp.route("/admin/auth", methods=["POST"])
@token_auth.login_required
def admin_auth():
    """ Create a short-lived admin token """

    if current_user.role == "user":
        return abort(404)

    try:
        json_data = request.get_json()
        password = json_data["password"]
    except:
        return abort(404)

    # Check admin account in database
    admin = User.query.filter_by(id=1).first()
    if not admin or not admin.verify_password(password):
        return abort(403, "You do not have the permission to access this page.")

    # Generate admin <token>
    token = admin.generate_admin_token()

    # Add admin token to db
    db.session.add(token)

    # Clean Token table from old tokens
    Token.clean()

    # Commit changes
    db.session.commit()

    headers = {
        "Set-Cookie": dump_cookie(
            key="admin_token",
            value=token.admin_token,
            path="/api/admin",
            secure=True,
            httponly=True,
            samesite="none",
        ),
    }

    return {}, 204, headers


@admin_bp.route("/admin/dashboard", methods=["GET"])
@token_auth.login_required
def dashboard():
    """ Admin dashboard """

    if current_user.role == "user":
        return abort(404)

    try:
        admin_token = request.cookies["admin_token"]
    except:
        return abort(400)

    authorization = User.verify_admin_token(admin_token)
    if not authorization:
        return abort(403, "You do not have the permission to access this page.")

    data = [{
        "username": user.username,
        "role": user.role,
        "id": user.id,
        "level": user.profile_level,
        "notif": user.last_notif_read_time
    } for user in User.query.filter(User.id != 1).all()]

    return jsonify(data=data)


@admin_bp.route("/admin/update_role", methods=["POST"])
@token_auth.login_required
def update_role():
    """ Change the role of a user """

    try:
        admin_token = request.cookies["admin_token"]
        json_data = request.get_json()
        user_id = json_data["user_id"]
        new_role = json_data["payload"]
    except:
        return abort(400)

    authorization = User.verify_admin_token(admin_token)
    if not authorization:
        return abort(403, "You do not have the permission to access this page.")

    user = User.query.filter_by(id=user_id).get_or_404()
    user.role = RoleType(new_role)
    db.session.commit()

    return {"message": f"New role for user {user.username} is: {user.role}"}, 200


@admin_bp.route("/admin/delete_account", methods=["POST"])
@token_auth.login_required
def delete_account():
    """ Delete a user account """

    try:
        admin_token = request.cookies["admin_token"]
        json_data = request.get_json()
        user_id = json_data["user_id"]
    except:
        return abort(400)

    authorization = User.verify_admin_token(admin_token)
    if not authorization:
        return abort(403, "You do not have the permission to access this page.")

    try:
        # Delete all tokens associated with user
        Token.query.filter_by(user_id=user_id).delete()

        # Delete user
        User.query.filter_by(id=user_id).delete()

        # Remove all entries where user is a follower or followed
        db.session.query(followers).filter((followers.c.follower_id == user_id) | (followers.c.followed_id == user_id)).delete()

        # Delete user's last update information
        UserLastUpdate.query.filter_by(user_id=user_id).delete()

        # Delete all user's notifications
        Notifications.query.filter_by(user_id=user_id).delete()

        # Get all LIST models
        models_list = get_models_type(ModelTypes.LIST)

        # Delete all media entries associated with user
        for model in models_list:
            model.query.filter_by(user_id=user_id).delete()

        db.session.commit()
        current_app.logger.info(f"The account [ID = {user_id}] has been successfully deleted.")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error trying to delete the account [ID = {user_id}]: {e}")
        return abort(500, "An error occurred. Please try again later.")

    return {"message": f"The account [ID = {user_id}] has been successfully deleted."}, 200
