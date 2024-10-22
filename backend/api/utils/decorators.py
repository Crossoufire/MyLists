import inspect
import time
from functools import wraps
from typing import Callable

from flask import abort

from backend.api.core import current_user
from backend.api.models import User
from backend.api.schemas.core import FlaskParser
from backend.api.utils.enums import Privacy


use_args = FlaskParser().use_args


def timer(func: Callable | int = None, stack_size: int = 1):
    """ Return the approximate time a function takes (with stack) """

    def decorator(f: Callable):
        @wraps(f)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = f(*args, **kwargs)
            end_time = time.time()

            stack_info = []
            for frame in inspect.stack()[1:stack_size + 1]:
                function_name = frame.function
                if "self" in frame.frame.f_locals:
                    function_name = f"{frame.frame.f_locals["self"].__class__.__name__}.{function_name}"
                stack_info.append(function_name)
            stack_info.reverse()

            current_func_name = f.__name__
            if hasattr(f, "__self__"):
                current_func_name = f"{f.__self__.__class__.__name__}.{current_func_name}"

            display_name = " - ".join(stack_info + [current_func_name])
            print(f"[{display_name}] - Elapsed time: {int((end_time - start_time) * 1000)} ms")

            return result

        return wrapper

    if callable(func):
        return decorator(func)

    if func:
        stack_size = func

    return decorator


def arguments(schema, location="query", **kwargs):
    if isinstance(schema, type):
        schema = schema()

    def decorator(f):
        arg_name = f"{location}_{schema.__class__.__name__}_args"

        @wraps(f)
        def _f(*args, **kwargs):
            location_args = kwargs.pop(arg_name, {})
            return f(*args, location_args, **kwargs)

        return use_args(schema, location=location, arg_name=arg_name, **kwargs)(_f)

    return decorator


def body(schema, location="json", **kwargs):
    if isinstance(schema, type):
        schema = schema()

    def decorator(f):
        arg_name = f'{location}_{schema.__class__.__name__}_args'

        @wraps(f)
        def _f(*args, **kwargs):
            location_args = kwargs.pop(arg_name, {})
            return f(*args, location_args, **kwargs)

        return use_args(schema, location=location, arg_name=arg_name, **kwargs)(_f)

    return decorator


def check_authorization(f: Callable):
    """ Check if non-authenticated user can access the route depending on the user's privacy setting """

    @wraps(f)
    def wrapper(*args, **kwargs):
        user = User.query.filter_by(username=kwargs["username"]).first_or_404()

        if not current_user and user.privacy != Privacy.PUBLIC:
            return abort(403, description="You are not authorized to access this resource")

        # Pop username from kwargs
        kwargs.pop("username")

        return f(*args, user, **kwargs)

    return wrapper
