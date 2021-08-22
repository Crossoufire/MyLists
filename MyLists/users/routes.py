import json
from MyLists import app, db
from flask_login import login_required, current_user
from flask import Blueprint, request, render_template
from MyLists.users.functions import get_all_media_info
from MyLists.models import User, Ranks, Frames, Notifications, RoleType, get_models_type

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

    # Get the data for each media and statistics
    media_dict = get_all_media_info(user)

    # Commit the changes
    db.session.commit()

    return render_template('account.html', title=user.username+"'s account", user=user, frame=user_frame_info,
                           user_updates=user_updates, follows_updates=follows_updates, media_data=media_dict)


@bp.route("/hall_of_fame", methods=['GET', 'POST'])
@login_required
def hall_of_fame():
    all_users = current_user.followed.all()
    all_users.append(current_user)
    models_type = get_models_type('List')

    all_users_data = []
    for user in all_users:
        user_data = {}
        frame = user.get_frame_info()

        user_data["id"] = user.id
        user_data["name"] = user.username
        user_data["profile"] = user.image_file
        user_data["knowledge_frame"] = frame
        user_data["add_books"] = user.add_books
        user_data["add_games"] = user.add_games

        user_data["current_user"] = False
        if user.id == current_user.id:
            user_data["current_user"] = True

        for model in models_type:
            user_data[f"{model.__name__.replace('List', '').lower()}_data"], _ = model.get_media_levels_and_time(user)

        all_users_data.append(user_data)

    return render_template("hall_of_fame.html", title='Hall of Fame', all_data=all_users_data)


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
