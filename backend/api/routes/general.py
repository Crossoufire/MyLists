from operator import and_

from sqlalchemy import case, desc, func
from flask import Blueprint, jsonify, request

from backend.api import cache, db, limiter
from backend.api.core.auth import token_auth
from backend.api.utils.enums import MediaType
from backend.api.utils.decorators import arguments
from backend.api.utils.functions import global_limiter, make_cache_key
from backend.api.schemas.general import HallOfFameSchema
from backend.api.models.user import User, UserMediaSettings
from backend.api.calculators.stats.stats import MediaStatsService
from backend.api.managers.ApiManager import MoviesApiManager, SeriesApiManager


general = Blueprint("api_general", __name__)


@general.route("/current_trends", methods=["GET"])
@token_auth.login_required
@limiter.limit("10/second", key_func=global_limiter)
@cache.cached(timeout=3600)
def current_trends():
    """ Fetch the current WEEK trends for TV and Movies using the TMDB API. Function cached for an hour. """
    tv_trends = SeriesApiManager().fetch_and_format_trending()
    movies_trends = MoviesApiManager().fetch_and_format_trending()
    return jsonify(data=dict(tv_trends=tv_trends, movies_trends=movies_trends)), 200


@general.route("/hall_of_fame", methods=["GET"])
@token_auth.login_required
@arguments(HallOfFameSchema)
def hall_of_fame(args):
    if args["sorting"] == "profile":
        ranking = (
            db.session.query(
                UserMediaSettings.user_id,
                func.sum(case((UserMediaSettings.active, UserMediaSettings.time_spent), else_=0)).label("time_spent")
            ).group_by(UserMediaSettings.user_id)
            .order_by(desc("time_spent")).subquery()
        )
    else:
        ranking = (
            db.session.query(
                UserMediaSettings.user_id,
                func.sum(case((
                    and_(UserMediaSettings.media_type == MediaType(args["sorting"]), UserMediaSettings.active),
                    UserMediaSettings.time_spent), else_=0)
                ).label("time_spent")
            ).group_by(UserMediaSettings.user_id)
            .order_by(desc("time_spent")).subquery()
        )

    ranked_users = (
        db.session.query(User.id, func.rank().over(order_by=ranking.c.time_spent.desc()).label("rank"))
        .outerjoin(ranking, User.id == ranking.c.user_id).cte()
    )

    users_data = (
        User.query.with_entities(User, ranked_users.c.rank)
        .outerjoin(ranked_users, User.id == ranked_users.c.id)
        .filter(User.active.is_(True), User.username.ilike(f"%{args['search']}%"))
        .order_by(ranked_users.c.rank)
        .paginate(page=args["page"], per_page=10, error_out=True)
    )

    users = [{**user.to_dict(), "rank": rank} for user, rank in users_data]

    data = dict(
        items=users,
        page=users_data.page,
        pages=users_data.pages,
        total=users_data.total,
    )

    return jsonify(data=data), 200


@general.route("/mylists_stats", methods=["GET"])
@token_auth.login_required
@cache.cached(timeout=86400, key_prefix=make_cache_key)
def mylists_stats():
    """ Global MyLists stats. Updated every day at 3:00 AM UTC+1 """

    try:
        media_type = MediaType(request.args.get("mt"))
    except:
        media_type = None

    stats = MediaStatsService().get_stats(media_type=media_type)
    stats["rating_system"] = "score"
    data = dict(
        stats=stats,
        settings=[{"media_type": m} for m in list(MediaType)],
    )

    return jsonify(data=data), 200
