import json
from flask import Blueprint, request, render_template
from flask_login import login_required, current_user
from MyLists import app, db
from MyLists.models import User, Ranks, Frames, Notifications, RoleType, get_models_type
from MyLists.users.functions import get_all_media_info

bp = Blueprint('users', __name__)


@bp.route('/account/<user_name>', methods=['GET', 'POST'])
@login_required
def account(user_name):
    # Check if the user can see the <media_list>
    user = current_user.check_autorization(user_name)

    # Get the user frame info
    user_frame_info = user.get_frame_info()

    if request.form.get('all_follows'):
        follows = user.followed.all()
        return render_template('account_all_follows.html', title='Follows', user=user, frame=user_frame_info,
                               follows=follows)
    elif request.form.get('all_followers'):
        followers = user.followers.all()
        return render_template('account_all_follows.html', title='Followers', user=user, frame=user_frame_info,
                               followers=True, follows=followers)
    elif request.form.get('all_history'):
        media_updates = user.get_last_updates(all_=True)
        return render_template('account_all_history.html', title='History', user=user, frame=user_frame_info,
                               media_updates=media_updates)

    # Update the account view count
    if current_user.role != RoleType.ADMIN and user.id != current_user.id:
        user.profile_views += 1

    # Get the user's last updates
    user_updates = user.get_last_updates(all_=False)

    # Get follows' last updates
    follows_updates = user.get_follows_updates()

    # Get the data for each media and global statistics
    media_data, media_global = get_all_media_info(user)

    # Commit the changes
    db.session.commit()

    return render_template('account.html', title=user.username+"'s account", user=user, frame=user_frame_info,
                           user_updates=user_updates, follows_updates=follows_updates, media_data=media_data,
                           media_global=media_global)


@bp.route("/level_grade_data", methods=['GET'])
@login_required
def level_grade_data():
    ranks = Ranks.get_levels()
    return render_template('level_grade_data.html', title='Level grade data', data=ranks)


@bp.route("/knowledge_frame_data", methods=['GET'])
@login_required
def knowledge_frame_data():
    ranks = Frames.query.all()
    return render_template('knowledge_grade_data.html', title='Knowledge frame data', data=ranks)


# --- AJAX Methods ---------------------------------------------------------------------------------------------


@bp.route("/follow_status", methods=['POST'])
@login_required
def follow_status():
    try:
        json_data = request.get_json()
        follow_id = int(json_data['follow_id'])
        follow_condition = bool(json_data['follow_status'])
    except:
        return '', 400

    # Check if <follow> exist in <User> table
    user = User.query.filter_by(id=follow_id).first()
    if not user:
        return '', 400

    # Check the follow's status
    if follow_condition:
        current_user.add_follow(user)

        # Notify the followed user
        payload = {'username': current_user.username,
                   'message': '{} is following you.'.format(current_user.username)}
        app.logger.info('[{}] Follow the account with ID {}'.format(current_user.id, follow_id))
    else:
        # Remove the follow
        current_user.remove_follow(user)

        # Notify the followed user
        payload = {'username': current_user.username,
                   'message': '{} stopped following you.'.format(current_user.username)}
        app.logger.info('[{}] Unfollowed the account with ID {} '.format(current_user.id, follow_id))

    notif = Notifications(user_id=user.id, payload_json=json.dumps(payload))
    db.session.add(notif)
    db.session.commit()

    return '', 204
