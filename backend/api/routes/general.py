from sqlalchemy import func, case, and_, select
from flask import Blueprint, jsonify, request

from backend.api.core import current_user
from backend.api import cache, limiter, db
from backend.api.core.auth import token_auth
from backend.api.utils.enums import MediaType
from backend.api.utils.decorators import arguments
from backend.api.models import UserMediaSettings, User
from backend.api.schemas.general import HallOfFameSchema
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.services.stats.stats import MediaStatsService
from backend.api.utils.functions import global_limiter, make_cache_key


general = Blueprint("api_general", __name__)
api_s_factory = ApiServiceFactory()


@general.route("/current_trends", methods=["GET"])
@token_auth.login_required
@limiter.limit("10/second", key_func=global_limiter)
@cache.cached(timeout=3600)
def current_trends():
    """ Fetch the current WEEK trends for TV and Movies using the TMDB API. Function cached for an hour. """

    movies_api_service = api_s_factory.create(MediaType.MOVIES)
    movies_trends = movies_api_service.trending()

    tv_api_service = api_s_factory.create(MediaType.SERIES)
    tv_trends = tv_api_service.trending()

    return jsonify(data=dict(tv_trends=tv_trends, movies_trends=movies_trends)), 200


@general.route("/hall_of_fame", methods=["GET"])
@token_auth.login_required
@arguments(HallOfFameSchema)
def hall_of_fame(args):
    if args["sorting"] == "normalized":
        sorting = "total_rank"
    elif args["sorting"] == "profile":
        sorting = "total_rank_time"
    else:
        sorting = f"{args["sorting"]}_rank"

    def get_normalized_scores():
        max_queries = {}
        normalized_scores = {}
        for media_type in MediaType:
            max_queries[media_type] = (
                db.session.query(func.max(UserMediaSettings.time_spent))
                .filter(UserMediaSettings.active == True, UserMediaSettings.media_type == media_type)
                .scalar_subquery()
            )

            # noinspection PyTypeChecker
            normalized_scores[media_type] = case(
                (max_queries[media_type] == 0, 0),
                else_=func.sum(
                    case(
                        (and_(UserMediaSettings.active == True, UserMediaSettings.media_type == media_type),
                         UserMediaSettings.time_spent / max_queries[media_type]), else_=0
                    )
                ),
            ).label(f"{media_type}_score")

        return normalized_scores

    n_scores = get_normalized_scores()

    # Base query
    base_sub = (
        db.session.query(
            User.id,
            User.username,
            User.image_file,
            *n_scores.values(),
            sum(n_scores.values()).label("total_score"),
            func.sum(case((UserMediaSettings.active, UserMediaSettings.time_spent), else_=0)).label("total_time"),
        )
        .join(UserMediaSettings, User.id == UserMediaSettings.user_id)
        .group_by(User)
        .subquery()
    )

    all_users_ranked = (
        select(
            base_sub.c.id,
            base_sub.c.username,
            base_sub.c.image_file,
            base_sub.c.total_score,
            func.row_number().over(order_by=base_sub.c.total_score.desc()).label("total_rank"),
            *(
                func.row_number().over(order_by=getattr(base_sub.c, f"{media_type}_score").desc())
                .label(f"{media_type}_rank") for media_type in MediaType
            ),
            func.row_number().over(order_by=base_sub.c.total_time.desc()).label("total_rank_time"),
        ).cte("all_users_ranked")
    )

    if args["search"]:
        final_query = (
            db.session.query(all_users_ranked)
            .filter(func.lower(all_users_ranked.c.username).ilike(f"%{args['search'].lower()}%"))
            .order_by(getattr(all_users_ranked.c, sorting))
        )
    else:
        final_query = db.session.query(all_users_ranked).order_by(getattr(all_users_ranked.c, sorting))

    final_query = final_query.paginate(page=args["page"], per_page=10, error_out=True)

    # Extract user IDs from paginated ranked results
    user_ids = [user_row.id for user_row in final_query.items]

    # Fetch full User objects in one query
    users = User.query.filter(User.id.in_(user_ids)).all()
    user_dict = {user.id: user for user in users}

    media_type_counts = (
        db.session.query(
            UserMediaSettings.media_type,
            func.count(UserMediaSettings.user_id).label("active_users"),
        ).filter(UserMediaSettings.time_spent > 0)
        .group_by(UserMediaSettings.media_type)
        .all()
    )
    media_type_count_dict = {mt.media_type: mt.active_users for mt in media_type_counts}

    current_user_ranks = (
        db.session.query(
            all_users_ranked.c.total_rank,
            *(getattr(all_users_ranked.c, f"{media_type}_rank") for media_type in MediaType),
            all_users_ranked.c.total_rank_time,
        ).select_from(all_users_ranked)
        .filter(all_users_ranked.c.id == current_user.id)
        .first()
    )

    user_ranks = []
    for i, media_type in enumerate(MediaType, start=1):
        media_type_count = media_type_count_dict.get(media_type, 0)
        user_ranks.append(dict(
            media_type=media_type,
            rank=current_user_ranks[i],
            percent=(current_user_ranks[i] / media_type_count) * 100 if media_type_count else 100,
        ))

    items = []
    for row in final_query.items:
        user = user_dict.get(row.id).to_dict()
        user["rank"] = getattr(row, sorting)
        items.append(user)

    data = dict(
        items=items,
        page=final_query.page,
        pages=final_query.pages,
        total=final_query.total,
        user_ranks=user_ranks,
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
