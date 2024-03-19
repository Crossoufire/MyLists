from flask import Blueprint, jsonify, request, url_for, current_app
from sqlalchemy import desc, select
from backend.api import cache, db
from backend.api.classes.API_data import ApiSeries, ApiMovies
from backend.api.routes.handlers import token_auth
from backend.api.models.user_models import User
from backend.api.models.utils_models import Ranks, MyListsStats, Frames
from backend.api.utils.functions import get_models_type, get_media_level_and_time, display_time
from backend.api.utils.enums import RoleType, ModelTypes

general = Blueprint("api_general", __name__)


@cache.cached(timeout=3600)
@general.route("/current_trends", methods=["GET"])
@token_auth.login_required
def current_trends():
    """ Fetch the current * WEEK * trends for TV and Movies using the TMDB API """

    tv_trends, movies_trends = [], []

    try:
        tv_trends = ApiSeries().get_and_format_trending()
    except Exception as e:
        current_app.logger.error(f"[ERROR] - Fetching the trending TV data: {e}")

    try:
        movies_trends = ApiMovies().get_and_format_trending()
    except Exception as e:
        current_app.logger.error(f"[ERROR] - Fetching the trending Movies data: {e}")

    data = dict(
        tv_trends=tv_trends,
        movies_trends=movies_trends,
    )

    return jsonify(data=data)


@general.route("/hall_of_fame", methods=["GET"])
@token_auth.login_required
def hall_of_fame():
    """ Hall of Fame information for all users """

    # TODO: One day, find a better way because: ca dégoute.

    # Fetch page in "GET"
    search = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    sorting = request.args.get("sorting", "profile", type=str)

    # noinspection PyTypeChecker
    order_sort = desc(User.profile_level) if sorting == "profile" else desc(getattr(User, f"time_spent_{sorting}"))

    # Rank users according to <profile_level>
    # noinspection PyTypeChecker
    users_ranked = (db.session.scalars(select(User.username).where(User.active, User.role != RoleType.ADMIN)
                                       .order_by(order_sort)).all())

    # Query users
    # noinspection PyTypeChecker
    users = (User.query.filter(User.active, User.role != RoleType.ADMIN, User.username.ilike(f"%{search}%"))
             .order_by(order_sort).paginate(page=page, per_page=10, error_out=True))

    # Get SQL models
    models_type = get_models_type(ModelTypes.LIST)

    all_levels, users_serialized = [], []
    for user in users.items:
        user_dict = user.to_dict()
        user_dict["rank"] = users_ranked.index(user.username) + 1
        for model in models_type:
            media_level = get_media_level_and_time(user, model.GROUP.value, only_level=True)
            user_dict[f"{model.GROUP.value}_level"] = media_level
            all_levels.append(media_level)
        users_serialized.append(user_dict)

    # Query media levels
    ranks = Ranks.query.filter(Ranks.level.in_(all_levels), Ranks.type == "media_rank\n").all()
    last_rank = Ranks.query.filter_by(level=149, type="media_rank\n").first()

    # For each user (serialized) again add <media_level> as attribute to <user> object
    for user in users_serialized:
        for model in models_type:
            media_level = user[f"{model.GROUP.value}_level"]
            if media_level > 149:
                user[f"{model.GROUP.value}_image"] = last_rank.image
                continue
            for rank in ranks:
                if rank.level == media_level:
                    user[f"{model.GROUP.value}_image"] = rank.image
                    break

    data = dict(
        users=users_serialized,
        page=users.page,
        pages=users.pages,
        total=users.total,
    )

    return jsonify(data=data)


@general.route("/mylists_stats", methods=["GET"])
@token_auth.login_required
def mylists_stats():
    """ Get global MyLists stats. Actualized every day at 3:00 AM UTC+1 """

    # Get dict with all data from model
    data = MyListsStats.get_all_stats()

    # Change total time to formatted string for display
    data["total_time"]["total"] = display_time(data["total_time"]["total"])

    return jsonify(data=data)


@general.route("/levels/media_levels", methods=["GET"])
def media_levels():
    """ Fetch all the media levels """

    data = []
    for rank in Ranks.query.filter_by(type="media_rank\n").all():
        data.append({
            "level": rank.level,
            "image": url_for("static", filename=f"/img/media_levels/{rank.image_id}.png"),
            "name": rank.name,
        })

    return jsonify(data=data)


@general.route("/levels/profile_borders", methods=["GET"])
def profile_borders():
    """ Fetch all the profile borders """

    data = []
    for border in Frames.query.all():
        prefix, numeric_part = border.image_id.split("_")
        image_id = f"{prefix}_{int(numeric_part):d}"
        data.append(dict(
            level=border.level,
            image=url_for("static", filename=f"/img/profile_borders/{image_id}.png")
        ))

    return jsonify(data=data)


@general.route("/changelog", methods=["GET"])
def changelog():
    """ Fetch the changelog """

    import os

    changelog_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../CHANGELOG.md"))

    with open(changelog_path) as fp:
        data = fp.read()

    return jsonify(data=data), 200, {"Content-Type": "text/markdown"}
