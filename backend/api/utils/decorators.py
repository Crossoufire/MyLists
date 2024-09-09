import time
from functools import wraps
from typing import Callable

from backend.api.schemas.core import FlaskParser


use_args = FlaskParser().use_args


def timer(f: Callable):
    """ Return the approximate time a function takes """

    @wraps(f)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = f(*args, **kwargs)
        end_time = time.time()
        print(f"[{f.__name__}] - Elapsed time: {int((end_time - start_time) * 1000)} ms")
        return result

    return wrapper


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
