from flask import Blueprint, request, abort, jsonify, current_app
from werkzeug.http import dump_cookie
from backend.api import db
from backend.api.models.user import Notifications, Token, User, UserLastUpdate, followers
from backend.api.routes.handlers import token_auth, current_user
from backend.api.utils.enums import ModelTypes, RoleType
from backend.api.managers.ModelsManager import ModelsManager

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

    admin = User.query.filter_by(id=1).first()
    if not admin or not admin.verify_password(password):
        return abort(403, "You do not have the permission to access this page.")

    token = admin.generate_admin_token()
    db.session.add(token)
    Token.clean()
    db.session.commit()

    headers = {
        "Set-Cookie": dump_cookie(
            key="admin_token",
            value=token.admin_token,
            path="/api/admin",
            secure=True,
            httponly=True,
            samesite="none",
            max_age=current_app.config["ADMIN_TOKEN_MINUTES"] * 60,
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

    return jsonify(data=data), 200


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
        Token.query.filter_by(user_id=user_id).delete()
        User.query.filter_by(id=user_id).delete()

        db.session.query(followers).filter((followers.c.follower_id == user_id) |
                                           (followers.c.followed_id == user_id)).delete()

        UserLastUpdate.query.filter_by(user_id=user_id).delete()
        Notifications.query.filter_by(user_id=user_id).delete()

        models = ModelsManager.get_dict_models("all", ModelTypes.LIST)

        for model in models.values():
            model.query.filter_by(user_id=user_id).delete()

        db.session.commit()
        current_app.logger.info(f"The account [ID = {user_id}] has been successfully deleted.")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error trying to delete the account [ID = {user_id}]: {e}")
        return abort(500, "An error occurred. Please try again later.")

    return {"message": f"The account [ID = {user_id}] has been successfully deleted."}, 200
