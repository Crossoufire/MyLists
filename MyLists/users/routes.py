"""
User routes
"""

import json
from flask import Blueprint, request, render_template
from flask_login import login_required, current_user
from MyLists import app, db
from MyLists.models import User, Ranks, Frames, Notifications, RoleType
from MyLists.users.functions import get_all_media_info


bp = Blueprint('users', __name__)


@bp.route('/account/<username>', methods=['GET', 'POST'])
@login_required
def account(username: str):
    """ Main user page/route for the user """

    # Check if user can see other user
    user = current_user.check_autorization(username)

    # Get user frame info
    user_frame_info = user.get_frame_info()

    if request.form.get("all_follows"):
        follows = user.followed.all()
        return render_template("users/account_all_follows.html", title="Follows", user=user, frame=user_frame_info,
                               follows=follows)
    elif request.form.get("all_followers"):
        followers = user.followers.all()
        return render_template("users/account_all_follows.html", title="Followers", user=user, frame=user_frame_info,
                               followers=True, follows=followers)
    elif request.form.get("all_history"):
        media_updates = user.get_last_updates(limit_=-1)
        return render_template("users/account_all_history.html", title="History", user=user, frame=user_frame_info,
                               media_updates=media_updates)

    # Update account view count
    if current_user.role != RoleType.ADMIN and user.id != current_user.id:
        user.profile_views += 1

    # Get user last updates
    user_updates = user.get_last_updates(limit_=7)

    # Get follows last updates
    follows_updates = user.get_follows_updates(limit_=11)

    # Get each media data and global statistics
    media_data, media_global = get_all_media_info(user)

    # Commit changes
    db.session.commit()

    return render_template('users/account.html', title=user.username + "'s account", user=user, frame=user_frame_info,
                           user_updates=user_updates, follows_updates=follows_updates, media_data=media_data,
                           media_global=media_global)


@bp.route("/level_grade_data", methods=['GET'])
@login_required
def level_grade_data():
    """ Show level grade data """

    ranks = Ranks.get_levels()
    return render_template('users/level_grade_data.html', title='Level grade data', data=ranks)


@bp.route("/knowledge_frame_data", methods=['GET'])
@login_required
def knowledge_frame_data():
    """ Show frames around user profile """

    ranks = Frames.query.all()
    return render_template('users/knowledge_grade_data.html', title='Knowledge frame data', data=ranks)


# --- AJAX Methods ---------------------------------------------------------------------------------------------


@bp.route("/follow_status", methods=['POST'])
@login_required
def follow_status():
    """ Get the follow status for a user """

    try:
        json_data = request.get_json()
        follow_id = int(json_data["follow_id"])
        follow_condition = bool(json_data["follow_status"])
    except:
        return "", 400

    # Check if <follow> exist in <User> table
    user = User.query.filter_by(id=follow_id).first()
    if not user:
        return "", 400

    # Check follow status
    if follow_condition:
        # Add follow to current_user
        current_user.add_follow(user)

        # Notify followed user
        payload = {"username": current_user.username,
                   "message": "{current_user.username} is following you."}

        # Log info
        app.logger.info("[{current_user.id}] Follow the account with ID {follow_id}")
    else:
        # Remove follow
        current_user.remove_follow(user)

        # Notify unfollowed user
        payload = {"username": current_user.username,
                   "message": f"{current_user.username} stopped following you."}

        # Log info
        app.logger.info(f"[{current_user.id}] Unfollowed the account with ID {follow_id}")

    # Send notification
    notif = Notifications(user_id=user.id, payload_json=json.dumps(payload))
    db.session.add(notif)

    # Commit changes
    db.session.commit()

    return "", 204
