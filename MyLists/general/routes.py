from datetime import datetime
from flask import Blueprint, url_for
from flask import render_template, flash, request, abort
from flask_login import login_required, current_user
from MyLists import db, bcrypt, app
from MyLists.API_data import ApiSeries, ApiMovies
from MyLists.general.trending_data import TrendingData
from MyLists.models import User, RoleType, MyListsStats, Frames, Badges, Ranks, compute_media_time_spent, \
    get_models_type
from MyLists.scheduled_tasks import update_Mylists_stats, update_IGDB_API

bp = Blueprint('general', __name__)


@bp.before_app_first_request
def create_first_data():
    db.create_all()
    if User.query.filter_by(id='1').first() is None:
        admin1 = User(username='admin',
                      email='admin@admin.com',
                      password=bcrypt.generate_password_hash("password").decode('utf-8'),
                      active=True,
                      private=True,
                      registered_on=datetime.utcnow(),
                      activated_on=datetime.utcnow(),
                      role=RoleType.ADMIN)
        manager1 = User(username='manager',
                        email='manager@manager.com',
                        password=bcrypt.generate_password_hash("password").decode('utf-8'),
                        active=True,
                        registered_on=datetime.utcnow(),
                        activated_on=datetime.utcnow(),
                        role=RoleType.MANAGER)
        user1 = User(username='user',
                     email='user@user.com',
                     password=bcrypt.generate_password_hash("password").decode('utf-8'),
                     active=True,
                     registered_on=datetime.utcnow(),
                     activated_on=datetime.utcnow())
        update_Mylists_stats()
        # update_IGDB_API()
        db.session.add(admin1)
        db.session.add(manager1)
        db.session.add(user1)
        Frames.add_frames_to_db()
        Badges.add_badges_to_db()
        Ranks.add_ranks_to_db()
    Frames.refresh_db_frames()
    Badges.refresh_db_badges()
    Ranks.refresh_db_ranks()

    compute_media_time_spent()
    db.session.commit()


@bp.route("/admin", methods=['GET'])
@login_required
def admin():
    if current_user.role != RoleType.ADMIN:
        abort(403)

    return render_template('admin/index.html')


@bp.route("/mylists_stats", methods=['GET'])
@login_required
def mylists_stats():
    all_stats = MyListsStats.get_all_stats()

    def display_time(minutes):
        intervals = (('Years', 525600), ('Months', 43200), ('Days', 1440), ('Hours', 60))
        result = []
        for name, count in intervals:
            value = minutes//count
            if value:
                minutes -= value*count
                if value == 1:
                    name = name.rstrip('S')
                result.append("{} {}".format(int(value), name))
        return ' '.join(result)

    all_stats['total_time']['total'] = display_time(all_stats['total_time']['total'])

    return render_template("mylists_stats.html", title='MyLists stats', all_stats=all_stats)


@bp.route("/hall_of_fame", methods=['GET', 'POST'])
@login_required
def hall_of_fame():
    all_users = User.query.filter(User.active == True, User.id != 1).all()
    models_type = get_models_type('List')

    all_levels = []
    for user in all_users:
        knowledge_level, frame_level = user.get_kn_frame_level()

        user.knowledge_level = knowledge_level
        user.frame_image = url_for('static', filename=f'img/icon_frames/new/border_{frame_level:02d}')
        user.current_user = True if user.id == current_user.id else False

        for model in models_type:
            model_name = f"{model.__name__.replace('List', '').lower()}_data"
            media_level, media_percentage, _ = model.get_only_levels_and_time(user)
            setattr(user, model_name, media_level)
            all_levels.append(media_level)

    query_ranks = Ranks.query.filter(Ranks.level.in_(all_levels), Ranks.type == 'media_rank\n').all()
    last_rank = Ranks.query.filter(Ranks.level == 149, Ranks.type == 'media_rank\n').first()
    for user in all_users:
        for model in models_type:
            model_name = f"{model.__name__.replace('List', '').lower()}_data"
            media_level = getattr(user, model_name)
            for rank in query_ranks:
                if rank.level == media_level:
                    setattr(user, model_name, rank)
                    setattr(user, f'{model_name}_level', media_level)
                    break
                elif media_level > 149:
                    setattr(user, model_name, last_rank)
                    setattr(user, f'{model_name}_level', media_level)
                    break

    all_users = sorted(all_users, key=lambda d: d.knowledge_level, reverse=True)

    return render_template("hall_of_fame.html", title='Hall of Fame', all_data=all_users)


@bp.route("/current_trends", methods=['GET'])
@login_required
def current_trends():
    try:
        series_info = ApiSeries().get_trending()
    except Exception as e:
        series_info = {'results': []}
        app.logger.error('[ERROR] - Getting the Series trending info: {}.'.format(e))
        flash('The current TV trends from TMDb are not available right now.', 'warning')

    try:
        movies_info = ApiMovies().get_trending()
    except Exception as e:
        movies_info = {'results': []}
        app.logger.error('[ERROR] - Getting the movies trending info: {}.'.format(e))
        flash('The current movies trends from TMDb are not available right now.', 'warning')

    series_results = TrendingData(series_info).get_trending_series()
    movies_results = TrendingData(movies_info).get_trending_movies()

    template = 'current_trends_pc.html'
    platform = str(request.user_agent.platform)
    if platform == "iphone" or platform == "android" or not platform or platform == 'None':
        template = 'current_trends_mobile.html'

    return render_template(template, title="Current trends", series_trends=series_results, movies_trends=movies_results)


@bp.route("/privacy_policy", methods=['GET'])
def privacy_policy():
    return render_template('privacy_policy.html', title='Privacy policy')


@bp.route("/about", methods=['GET'])
def about():
    return render_template('about.html', title='About')
