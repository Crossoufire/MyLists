from flask import Blueprint, jsonify, request, url_for, current_app, abort
from sqlalchemy import desc, func
from backend.api import cache, db
from backend.api.managers.ApiManager import SeriesApiManager, MoviesApiManager
from backend.api.managers.GlobalStatsManager import GlobalStats
from backend.api.models.user import User
from backend.api.core.handlers import token_auth
from backend.api.utils.enums import RoleType
from backend.api.utils.functions import compute_level

general = Blueprint("api_general", __name__)


@general.route("/current_trends", methods=["GET"])
@cache.cached(timeout=3600)
@token_auth.login_required
def current_trends():
    """ Fetch the current * WEEK * trends for TV and Movies using the TMDB API. Function cached for an hour. """

    error = False
    tv_trends, movies_trends = [], []

    try:
        tv_trends = SeriesApiManager().get_and_format_trending()
        movies_trends = MoviesApiManager().get_and_format_trending()
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
    page = request.args.get("page", 1, type=int)
    search = request.args.get("search", type=str)
    sorting = request.args.get("sorting", "profile", type=str)

    ranking = User.profile_level.desc() if sorting == "profile" else desc(getattr(User, f"time_spent_{sorting}"))

    ranked_users = db.session.query(User, func.rank().over(order_by=ranking).label("rank")).cte()

    users_data = (
        db.session.query(User)
        .with_entities(User, ranked_users.c.rank)
        .join(ranked_users, User.id == ranked_users.c.id)
        .filter(User.username.ilike(f"%{search}%"), User.role != RoleType.ADMIN, User.active.is_(True))
        .paginate(page=page, per_page=10, error_out=True)
    )

    users_serialized = []
    for user, rank_value in users_data:
        user_dict = user.to_dict()
        user_dict["rank"] = rank_value
        for media_type in user.activated_media_type():
            time_in_minutes = getattr(user, f"time_spent_{media_type.value}")
            media_level = int(f"{compute_level(time_in_minutes):.2f}".split(".")[0])
            user_dict[f"{media_type.value}_level"] = media_level

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
@cache.cached(timeout=86400, key_prefix="mylists-stats")
def mylists_stats():
    """ Global MyLists stats. Actualized every day at 3:00 AM UTC+1 """
    return jsonify(data=GlobalStats().compute_global_stats()), 200


@general.route("/levels/profile_borders", methods=["GET"])
def profile_borders():
    data = []
    num_borders = 40

    for i in range(1, num_borders + 1):
        image_id = f"border_{i}.png"
        data.append({
            "level": i,
            "image": url_for("static", filename=f"img/profile_borders/{image_id}")
        })

    return jsonify(data=data), 200
