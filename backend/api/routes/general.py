from apifairy import authenticate, response
from flask import Blueprint, abort, request
from sqlalchemy import func, case, and_, desc
from backend.api.app import cache, db
from backend.api.core.handlers import token_auth
from backend.api.managers.ApiManager import SeriesApiManager, MoviesApiManager
from backend.api.managers.GlobalStatsManager import GlobalStats
from backend.api.models.users import User, UserMediaSettings
from backend.api.schemas.core import HoFPaginationSchema
from backend.api.schemas.general import *
from backend.api.utils.decorators import paginated_response

general = Blueprint("general", __name__)


@general.route("/general/trends", methods=["GET"])
@cache.cached(timeout=3600)
@authenticate(token_auth)
@response(TMDBTrendsSchema, 200, description="Fetch the week trends from TMDB")
def get_trends():
    """ TMDB week trends """

    try:
        tv_trends = SeriesApiManager().fetch_and_format_trending()
        movies_trends = MoviesApiManager().fetch_and_format_trending()
    except:
        return abort(400, "Can't fetch the trending TV/Movies for now. Please try again later")

    return dict(tv_trends=tv_trends, movies_trends=movies_trends)


@general.route("/general/hall-of-fame", methods=["GET"])
@authenticate(token_auth)
@paginated_response(HallOfFameSchema, model=User, p_schema=HoFPaginationSchema, hof=True, per_page_=10)
def get_hall_of_fame():
    """ Hall of Fame """

    sorting = request.args.get("sorting", "profile")

    if sorting == "profile":
        ranking = (
            db.session.query(
                UserMediaSettings.user_id,
                func.sum(case((UserMediaSettings.active, UserMediaSettings.time_spent), else_=0))
                .label("time_spent")
            ).group_by(UserMediaSettings.user_id)
            .order_by(desc("time_spent")).subquery()
        )
    else:
        ranking = (
            db.session.query(
                UserMediaSettings.user_id,
                func.sum(case((
                    and_(UserMediaSettings.media_type == sorting, UserMediaSettings.active),
                    UserMediaSettings.time_spent
                ), else_=0)).label("time_spent")
            ).group_by(UserMediaSettings.user_id)
            .order_by(desc("time_spent")).subquery()
        )

    ranked_users = (
        db.session.query(User.id, func.rank().over(order_by=ranking.c.time_spent.desc()).label("rank"))
        .join(ranking, User.id == ranking.c.user_id, isouter=True).cte()
    )

    users_data = (
        User.query.with_entities(User, ranked_users.c.rank)
        .join(ranked_users, User.id == ranked_users.c.id)
        .filter(User.active.is_(True))
    )

    return users_data


@general.route("/general/mylists-stats", methods=["GET"])
@authenticate(token_auth)
@response(GlobalStatsSchema, 200, description="Global MyLists stats")
# @cache.cached(timeout=86400, key_prefix="mylists-stats")
def get_mylist_stats():
    """
    Global MyLists stats
    Actualized every day at 3:00 AM UTC+1
    """
    # TODO: Create schema
    return GlobalStats().compute_global_stats(), 200
