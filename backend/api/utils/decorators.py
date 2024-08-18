import time
from functools import wraps
from typing import Callable
from apifairy import arguments, response
from flask import abort, request, g
from sqlalchemy import desc
from backend.api import ma
from backend.api.models.users import User
from backend.api.core.handlers import current_user
from backend.api.schemas.core import PCollection, PaginationSchema
from backend.api.utils.enums import PrivacyType


def timer(f: Callable):
    @wraps(f)
    def wrapper(*args, **kwargs):

        start_time = time.time()
        result = f(*args, **kwargs)
        end_time = time.time()

        print(f"[{f.__name__}] - Elapsed time: {int((end_time - start_time) * 1000)} ms")

        return result
    return wrapper


def check_privacy_access(f: Callable):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = kwargs.get("username") or request.view_args.get("username")

        # TODO: Change the Private part so that a user can still see the header of the profile so he can ask
        #  to follows the user (which needs to accept). Because for now if the user is not following the user and
        #  the user is private it abort (403) the request.

        requested_user = User.query.filter_by(username=username).first()
        if not requested_user:
            return abort(404, "User not found")

        if current_user and current_user.id == requested_user.id:
            g.requested_user = requested_user
            return f(*args, **kwargs)

        if requested_user.privacy == PrivacyType.PUBLIC:
            pass
        elif current_user is None:
            return abort(401, "Authentication required")
        elif requested_user.privacy == PrivacyType.PRIVATE and not current_user.is_following(requested_user):
            return abort(403, "Unauthorized")

        requested_user.profile_views += 1
        g.requested_user = requested_user

        return f(*args, **kwargs)

    return wrapper


def paginated_response(schema: ma.Schema, max_: int = 100, order_dir: str = "desc",
                       order_by=None, model=None, p_schema=PaginationSchema, hof: bool = False):
    def inner(f):
        @wraps(f)
        @arguments(p_schema)
        def paginator(*args, **kwargs):
            args = list(args)
            pagination = args.pop(-1)

            page = pagination.get("page", 1)
            per_page = pagination.get("per_page", 25)
            search = pagination.get("search")

            select_query = f(*args, **kwargs)

            if search:
                select_query = model.search(select_query, search)

            if order_by is not None:
                if isinstance(order_by, str) and model:
                    o = desc(getattr(model, order_by)) if order_dir == "desc" else order_by
                elif isinstance(order_by, str) and not model:
                    raise Exception("The <model> kwarg is required when using a string for <order_by>")
                else:
                    o = desc(order_by) if order_dir == "desc" else order_by
                select_query = select_query.order_by(o)

            query = select_query.paginate(page=page, per_page=per_page, max_per_page=max_)

            data = query.items
            if hof:
                data = [{"user": user, "rank": rank} for user, rank in query.items]

            return {
                "data": data,
                "pagination": {
                    "page": query.page,
                    "per_page": query.per_page,
                    "total": query.total,
                    "pages": query.pages,
                }
            }

        # Wrap with response decorators
        pagination = response(PCollection(schema, p_schema))(paginator)

        return pagination

    return inner
