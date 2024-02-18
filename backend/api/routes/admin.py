from flask import Blueprint, request, abort, jsonify, current_app
from werkzeug.http import dump_cookie
from backend.api import db
from backend.api.routes.auth import token_auth, current_user
from backend.api.utils.enums import ModelTypes

admin_bp = Blueprint("api_admin", __name__)


@admin_bp.route("/admin/auth", methods=["POST"])
@token_auth.login_required
def admin_auth():
    """ Create a very short-lived admin <token> """

    from backend.api.models.user_models import Token
    from backend.api.models.user_models import User

    if current_user.role == "user":
        return abort(404)

    json_data = request.get_json()
    admin = User.query.filter_by(id=1).first()
    if not admin.verify_password(json_data.get("password")):
        return abort(403, "You do not have the permission to access this page.")

    # Generate <admin token>
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
    from backend.api.models.user_models import User

    if current_user.role == "user":
        return abort(404)

    admin_token = request.cookies.get("admin_token")
    authorization = User.verify_elevated_token(admin_token)
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
    """ Endpoint allowing the admin to change the role of a user """

    from backend.api.models.user_models import User
    from backend.api.utils.enums import RoleType

    admin_token = request.cookies.get("admin_token")
    authorization = User.verify_elevated_token(admin_token)
    if not authorization:
        return abort(403, "You do not have the permission to access this page.")

    json_data = request.get_json()
    user_id = json_data["user_id"]
    new_role = json_data["payload"]

    user = User.query.filter_by(id=user_id).first()
    user.role = RoleType(new_role)

    db.session.commit()

    return {"message": f"New role for user {user.username} is: {user.role}"}, 200


@admin_bp.route("/admin/delete_account", methods=["POST"])
@token_auth.login_required
def delete_account():
    """ Endpoint allowing the admin to delete an account """

    from backend.api.models.user_models import User
    from backend.api.models.user_models import Token
    from backend.api.models.user_models import followers
    from backend.api.models.user_models import UserLastUpdate
    from backend.api.models.user_models import Notifications
    from backend.api.utils.functions import get_models_type

    admin_token = request.cookies.get("admin_token")
    authorization = User.verify_elevated_token(admin_token)
    if not authorization:
        return abort(403, "You do not have the permission to access this page.")

    json_data = request.get_json()
    user_id = json_data["user_id"]

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

        # Get all models types using <ModelTypes>
        models_list = get_models_type(ModelTypes.LIST)

        # Delete all media entries associated with user
        for model in models_list:
            model.query.filter_by(user_id=user_id).delete()

        db.session.commit()
        current_app.logger.info(f"The account [ID = {user_id}] has been successfully deleted.")
        return {"message": f"The account [ID = {user_id}] has been successfully deleted."}, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error trying to delete the account [ID = {user_id}]: {e}")
        return abort(500, "Sorry, an error occurred. Please try again later.")
