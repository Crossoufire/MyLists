from flask import Blueprint, jsonify, request, url_for, current_app, abort
from sqlalchemy import desc, func
from backend.api import cache, db
from backend.api.data_managers.api_data_manager import ApiSeries, ApiMovies
from backend.api.models.user_models import User
from backend.api.models.utils_models import Ranks, MyListsStats, Frames
from backend.api.routes.handlers import token_auth
from backend.api.utils.enums import RoleType
from backend.api.utils.functions import display_time, get_level

general = Blueprint("api_general", __name__)


@general.route("/current_trends", methods=["GET"])
@cache.cached(timeout=3600)
@token_auth.login_required
def current_trends():
    """ Fetch the current * WEEK * trends for TV and Movies using the TMDB API. Function cached for an hour. """

    error = False
    tv_trends, movies_trends = [], []

    try:
        tv_trends = ApiSeries().get_and_format_trending()
        movies_trends = ApiMovies().get_and_format_trending()
    except Exception as e:
        error = True
        current_app.logger.error(f"[ERROR] - Fetching the trending data: {e}")

    if error:
        return abort(400, "Can't fetch the trending data for now. Please try again later")

    data = dict(
        tv_trends=tv_trends,
        movies_trends=movies_trends,
    )

    return jsonify(data=data), 200


@general.route("/hall_of_fame", methods=["GET"])
@token_auth.login_required
def hall_of_fame():
    """ Hall of Fame information for all users """

    search_term = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    sorting = request.args.get("sorting", "profile", type=str)

    # noinspection PyTestUnpassedFixture
    ranking = User.profile_level.desc() if sorting == "profile" else desc(getattr(User, f"time_spent_{sorting}"))

    ranked_users = db.session.query(User, func.rank().over(order_by=ranking).label("rank")).cte()

    users_data = (
        db.session.query(User)
        .join(ranked_users, User.id == ranked_users.c.id)
        .with_entities(User, ranked_users.c.rank)
        .filter(User.username.ilike(f"%{search_term}%"), User.role != RoleType.ADMIN, User.active == True)
        .paginate(page=page, per_page=10, error_out=True)
    )

    all_grades = Ranks.query.all()

    users_serialized = []
    for user, rank_value in users_data:
        user_dict = user.to_dict()
        user_dict["rank"] = rank_value
        for media_type in user.activated_media_type():
            time_in_minutes = getattr(user, f"time_spent_{media_type.value}")
            media_level = int(f"{get_level(time_in_minutes):.2f}".split(".")[0])
            user_dict[f"{media_type.value}_level"] = media_level
            for grade in all_grades[::-1]:
                if media_level > 149 or media_level == grade.level:
                    user_dict[f"{media_type.value}_image"] = grade.image
                    break

        users_serialized.append(user_dict)

    data = dict(
        users=users_serialized,
        page=users_data.page,
        pages=users_data.pages,
        total=users_data.total,
    )

    return jsonify(data=data), 200


@general.route("/mylists_stats", methods=["GET"])
@token_auth.login_required
def mylists_stats():
    """ Get global MyLists stats. Actualized every day at 3:00 AM UTC+1 """

    data = MyListsStats.get_all_stats()
    data["total_time"]["total"] = display_time(data["total_time"]["total"])

    return jsonify(data=data), 200


@general.route("/levels/media_levels", methods=["GET"])
def media_levels():
    """ Fetch all the media levels """

    data = [{
        "level": rank.level,
        "image": url_for("static", filename=f"/img/media_levels/{rank.image_id}.png"),
        "name": rank.name,
    } for rank in Ranks.query.filter_by(type="media_rank\n").all()]

    return jsonify(data=data), 200


@general.route("/levels/profile_borders", methods=["GET"])
def profile_borders():
    """ Fetch all the profile borders """

    data = []
    for border in Frames.query.all():
        prefix, numeric_part = border.image_id.split("_")
        image_id = f"{prefix}_{int(numeric_part):d}"
        data.append({
            "level": border.level,
            "image": url_for("static", filename=f"/img/profile_borders/{image_id}.png"),
        })

    return jsonify(data=data), 200
