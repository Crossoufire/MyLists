"""
General routes
"""

from datetime import datetime
from flask import Blueprint
from flask import render_template, flash, request, abort
from flask_login import login_required, current_user
from sqlalchemy import true
from MyLists import db, bcrypt, app
from MyLists.API_data import ApiSeries, ApiMovies
from MyLists.general.functions import get_similar, create_cosine_similarity, TrendingData, display_time
from MyLists.models import User, RoleType, MyListsStats, Frames, Badges, Ranks, get_models_type
from flask import url_for
from MyLists.scheduled_tasks import compute_media_time_spent


bp = Blueprint('general', __name__)


@bp.before_app_first_request
def create_first_data():
    """ Create all the db tables the first time and add the first data to the database """

    # Ceate all tables
    db.create_all()

    # Create user admin, manager and simple user if admin does not exists
    if User.query.filter_by(id='1').first() is None:
        # noinspection PyArgumentList
        admin1 = User(username='admin',
                      email='admin@admin.com',
                      password=bcrypt.generate_password_hash("password").decode('utf-8'),
                      active=True,
                      private=True,
                      registered_on=datetime.utcnow(),
                      activated_on=datetime.utcnow(),
                      role=RoleType.ADMIN)
        # noinspection PyArgumentList
        manager1 = User(username='manager',
                        email='manager@manager.com',
                        password=bcrypt.generate_password_hash("password").decode('utf-8'),
                        active=True,
                        registered_on=datetime.utcnow(),
                        activated_on=datetime.utcnow(),
                        role=RoleType.MANAGER)
        # noinspection PyArgumentList
        user1 = User(username='user',
                     email='user@user.com',
                     password=bcrypt.generate_password_hash("password").decode('utf-8'),
                     active=True,
                     registered_on=datetime.utcnow(),
                     activated_on=datetime.utcnow())

        db.session.add(admin1)
        db.session.add(manager1)
        db.session.add(user1)

        # update_Mylists_stats()
        # update_IGDB_API()
        Frames.add_frames_to_db()
        Badges.add_badges_to_db()
        Ranks.add_ranks_to_db()

    # Refresh frames, badges, ranks and compute total time spent for each user
    Frames.refresh_db_frames()
    Badges.refresh_db_badges()
    Ranks.refresh_db_ranks()
    compute_media_time_spent()

    # Commit changes
    db.session.commit()


@bp.route("/admin", methods=["GET"])
@login_required
def admin():
    """ Admin route """

    # Check if current role is ADMIN
    if current_user.role != RoleType.ADMIN:
        return abort(403)

    return render_template('admin/index.html')


@bp.route("/mylists_stats", methods=["GET"])
@login_required
def mylists_stats():
    """ Get global MyLists stats. Actualized every day at 3AM """

    # Get dict with all data from SQL model
    all_stats = MyListsStats.get_all_stats()

    # Change total time to formated string for display
    all_stats["total_time"]["total"] = display_time(all_stats["total_time"]["total"])

    return render_template("mylists_stats.html", title='MyLists stats', all_stats=all_stats)


@bp.route("/hall_of_fame", methods=["GET", "POST"])
@login_required
def hall_of_fame():
    """ Display the HoF routes for all users """

    # Get all users
    all_users = User.query.filter(User.active == true, User.id != 1).all()

    # Get SQL models
    models_type = get_models_type("List")

    all_levels = []
    for user in all_users:
        # Get levels
        knowledge_level, frame_level = user.get_kn_frame_level()

        # Add attributes to user object
        user.knowledge_level = knowledge_level
        user.frame_image = url_for('static', filename=f'img/icon_frames/new/border_{frame_level:02d}')
        user.current_user = True if user.id == current_user.id else False

        for model in models_type:
            model_name = f"{model.__name__.replace('List', '').lower()}_data"
            media_level, media_percentage, _ = model.get_only_levels_and_time(user)
            setattr(user, model_name, media_level)
            all_levels.append(media_level)

    # Query ranks
    query_ranks = Ranks.query.filter(Ranks.level.in_(all_levels), Ranks.type == 'media_rank\n').all()
    last_rank = Ranks.query.filter(Ranks.level == 149, Ranks.type == 'media_rank\n').first()

    # For each user again add media_level as attribute to user object
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

    # Sort users per knowledge_level
    all_users = sorted(all_users, key=lambda d: d.knowledge_level, reverse=True)

    return render_template("hall_of_fame.html", title='Hall of Fame', all_data=all_users)


@bp.route("/current_trends", methods=["GET"])
@login_required
def current_trends():
    """ Get the current trends for Series and Movies using TMDB API """

    try:
        series_info = ApiSeries().get_trending()
    except Exception as e:
        series_info = {"results": []}
        app.logger.error(f"[ERROR] - Getting the Series trending info: {e}")
        flash("The TV trends from TMDB are not available right now", "warning")

    try:
        movies_info = ApiMovies().get_trending()
    except Exception as e:
        movies_info = {"results": []}
        app.logger.error(f"[ERROR] - Getting the movies trending info: {e}")
        flash("'The movies trends from TMDB are not available right now.", "warning")

    series_trends = TrendingData(series_info).format_trending_series()
    movies_trends = TrendingData(movies_info).format_trending_movies()

    # Base template
    template = "current_trends_pc.html"

    # Change template depending on platform
    platform = request.headers.get("User-Agent")
    if any(s in platform for s in ("iphone", "android", "None", "iPhone", 'Android')):
        template = 'current_trends_mobile.html'

    return render_template(template, title="Trends", series_trends=series_trends, movies_trends=movies_trends)


@bp.route("/similar_movies", methods=['GET'])
@login_required
def similar_movies():
    """ Movies recommendations route """

    # Get movie title
    title = request.args.get("title")

    # Create cosine similarity
    cosine_sim, indices_series = create_cosine_similarity()

    # Get similar movies
    sim_movies, movie = get_similar(title, cosine_sim, indices_series)

    if len(sim_movies) == 0 and movie is None:
        flash(f"No movies found with the title: {title}", "warning")

    return render_template("similar_movies.html", title="Similar movies", sim_movies=sim_movies,
                           s_movie=movie, mov_title=title)


@bp.route("/privacy_policy", methods=['GET'])
def privacy_policy():
    """ Privacy policy of the website """

    return render_template('privacy_policy.html', title='Privacy policy')


@bp.route("/about", methods=['GET'])
def about():
    """ About this website """

    return render_template('about.html', title='About')
