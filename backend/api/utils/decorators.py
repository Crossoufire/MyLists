import time
from functools import wraps
from typing import Callable, Any
from flask import abort, request
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.schemas.core import FlaskParser
from backend.api.utils.enums import MediaType


use_args = FlaskParser().use_args


def validate_json_data(type_: Any = None):
    """ Decorator which checks JSON data before accessing route. Add endpoint type before creating decorator """

    def decorator(f: Callable):
        @wraps(f)
        def wrapper():
            try:
                json_data = request.get_json()
                media_id = int(json_data["media_id"])
                media_type = json_data["media_type"]

                # Handle payload with optional type conversion
                payload = type_(json_data["payload"]) if type_ else json_data.get("payload", None) or None
                if type_ == bool and json_data["payload"] is not None and not isinstance(json_data["payload"], bool):
                    return abort(400, "Error trying to parse the json data")
            except:
                return abort(400, "Error trying to parse the json data")

            try:
                media_type = MediaType(media_type)
                models = ModelsManager.get_dict_models(media_type, "all")
            except ValueError:
                return abort(400, "The <media_type> key is not valid.")

            return f(media_type, media_id, payload, models)

        return wrapper

    return decorator


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


def body(schema, location="json", media_type=None, **kwargs):
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
