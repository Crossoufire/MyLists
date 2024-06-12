import imghdr
import os
import re
import secrets
from datetime import datetime, timezone
from typing import Dict, List, Any, Iterable, Literal
from flask import current_app, abort
from backend.api import db
from backend.api.utils.enums import ModelTypes, MediaType


def get_class_registry(cls: db.Model) -> Dict:
    """ Dynamically gets class registry of SQLAlchemy from specified model """

    try:
        # SQLAlchemy > 1.3
        # noinspection PyProtectedMember
        return cls._sa_registry._class_registry
    except:
        try:
            # SQLAlchemy <= 1.3
            return cls._decl_class_registry
        except:
            raise AttributeError("Neither '_sa_registry._class_registry' nor '_decl_class_registry' exists. "
                                 "Please check your SQLAlchemy version.")


class ModelsFetcher:
    TypeMediaType = List[MediaType] | Literal["all"] | MediaType
    TypeModelType = List[ModelTypes] | Literal["all"] | ModelTypes
    ReturnModelGroup = (Dict[ModelTypes, db.Model] | Dict[MediaType, db.Model] |
                        Dict[MediaType, Dict[ModelTypes, db.Model]])

    @staticmethod
    def _get_registry():
        return get_class_registry(db.Model).values()

    @classmethod
    def get_unique_model(cls, media_type: MediaType, model_type: ModelTypes) -> db.Model:
        for model in cls._get_registry():
            try:
                if issubclass(model, db.Model) and model.GROUP == media_type and model.TYPE == model_type:
                    return model
            except (AttributeError, TypeError):
                pass

    @classmethod
    def get_lists_models(cls, media_types: List | MediaType, model_types: List | ModelTypes) -> List[db.Model]:
        if isinstance(media_types, MediaType) and isinstance(model_types, ModelTypes):
            raise Exception("At least one argument needs to be a list")

        if isinstance(media_types, list) and isinstance(model_types, list):
            raise Exception("Both arguments can't be a list")

        models_list = []
        order = {}

        if isinstance(media_types, MediaType):
            order = {model_type: idx for idx, model_type in enumerate(model_types)}
            for model in cls._get_registry():
                try:
                    if issubclass(model, db.Model) and model.GROUP == media_types and model.TYPE in model_types:
                        models_list.append(model)
                except (AttributeError, TypeError):
                    pass
            return sorted(models_list, key=lambda x: order.get(x.TYPE, float("inf")))

        order = {media_type: idx for idx, media_type in enumerate(media_types)}
        for model in cls._get_registry():
            try:
                if issubclass(model, db.Model) and model.GROUP in media_types and model.TYPE == model_types:
                    models_list.append(model)
            except (AttributeError, TypeError):
                pass

        return sorted(models_list, key=lambda x: order.get(x.GROUP, float("inf")))

    @classmethod
    def get_dict_models(cls, media_type: TypeMediaType, types: TypeModelType) -> ReturnModelGroup:
        models_dict = {}

        if media_type == "all" and isinstance(types, ModelTypes):
            for model in cls._get_registry():
                try:
                    if issubclass(model, db.Model) and types == model.TYPE:
                        models_dict[model.GROUP] = model
                except (AttributeError, TypeError):
                    pass
            return models_dict
        elif media_type == "all" and isinstance(types, list):
            for model in cls._get_registry():
                try:
                    if issubclass(model, db.Model) and model.TYPE in types:
                        if model.GROUP not in models_dict:
                            models_dict[model.GROUP] = {}
                        models_dict[model.GROUP][model.TYPE] = model
                except (AttributeError, TypeError):
                    pass
            return models_dict
        elif isinstance(media_type, MediaType) and types == "all":
            for model in cls._get_registry():
                try:
                    if issubclass(model, db.Model) and media_type == model.GROUP:
                        models_dict[model.TYPE] = model
                except (AttributeError, TypeError):
                    pass
            return models_dict
        elif isinstance(media_type, list) and isinstance(types, list):
            for model in cls._get_registry():
                try:
                    if issubclass(model, db.Model) and model.GROUP in media_type and model.TYPE in types:
                        if model.GROUP not in models_dict:
                            models_dict[model.GROUP] = {}
                        models_dict[model.GROUP][model.TYPE] = model
                except (AttributeError, TypeError):
                    pass
            return models_dict

        raise Exception(f"Unknown type or model type")


def get(state: Iterable, *path: Any, default: Any = None):
    """ Take an iterable and check if the path exists """
    try:
        for step in path:
            state = state[step]
    except LookupError:
        return default
    return state or default


def get_level(total_time: float) -> float:
    """ Returns the level based on time spent in [minutes] """

    if total_time < 0:
        current_app.logger.error("the total time given to the 'total_time' function is negative!")
        raise Exception("Total time must be greater than 0")

    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def get_media_level(user: db.Model, media_type: MediaType) -> int:
    """ Fetch the time spent in [minutes] and return the level of media for a user """
    time_min = getattr(user, f"time_spent_{media_type.value}")
    return int(f"{get_level(time_min):.2f}".split(".")[0])


def save_picture(form_picture, old_picture: str, profile: bool = True):
    """ Save the account picture either profile or background """

    if imghdr.what(form_picture) not in ("gif", "jpeg", "jpg", "png", "webp", "tiff"):
        current_app.logger.error(f"[SYSTEM] Invalid picture format: {imghdr.what(form_picture)}")
        return abort(400, "Invalid picture format")

    file = form_picture
    random_hex = secrets.token_hex(10)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext

    if profile:
        file.save(os.path.join(current_app.root_path, "static/profile_pics", picture_fn))
    else:
        file.save(os.path.join(current_app.root_path, "static/background_pics", picture_fn))

    try:
        if old_picture != "default.jpg":
            if profile:
                os.remove(os.path.join(current_app.root_path, "static/profile_pics", old_picture))
                current_app.logger.info(f"Settings updated: Removed old picture: {old_picture}")
            else:
                os.remove(os.path.join(current_app.root_path, "static/background_pics", old_picture))
                current_app.logger.info(f"Settings updated: Removed old background: {old_picture}")
    except:
        current_app.logger.error(f"Error trying to remove an old picture: {old_picture}")

    return picture_fn


def change_air_format(date_: str, tv: bool = False, games: bool = False, books: bool = False) -> str:
    try:
        if tv:
            return datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
        elif games:
            return datetime.fromtimestamp(int(date_), timezone.utc).strftime("%d %b %Y")
        elif books:
            try:
                return re.findall(re.compile("\d{4}"), date_)[0]
            except:
                return "N/A"
        else:
            return datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
    except (ValueError, TypeError):
        return "N/A"


def safe_div(a: float, b: float, percentage: bool = False):
    try:
        if b == 0:
            return 0
        result = a / b
        if percentage:
            return result * 100
        return result
    except:
        return 0


def is_latin(original_name: str) -> bool:
    """ Check if name is Latin using iso-8859-1, if so return <True> else <False> """

    try:
        original_name.encode("iso-8859-1")
        return True
    except UnicodeEncodeError:
        return False


def clean_html_text(raw_html: str) -> str:
    """ Mostly clean an HTML text (not perfect) """

    cleaner = re.compile("<.*?>")
    cleantext = re.sub(cleaner, "", raw_html)
    if not cleantext:
        cleantext = "Unknown"
    return cleantext


def int_to_money(value: int):
    suffixes = ["", "K", "M", "B"]

    if value < 1000:
        return f"{value} $"

    exp = 0
    while value >= 1000 and exp < len(suffixes) - 1:
        value /= 1000
        exp += 1

    return f"{int(value)} {suffixes[exp]}$"


def display_time(minutes: int) -> str:
    """ Display time in the MyLists <Stats> page """

    dt = datetime.fromtimestamp(minutes * 60, timezone.utc)
    years = dt.year - 1970
    months = dt.month - 1
    days = dt.day - 1
    hours = dt.hour

    time_components = []
    if years > 0:
        time_components.append(f"{years} years")
    if months > 0:
        time_components.append(f"{months} months")
    if days > 0:
        time_components.append(f"{days} days")
    # noinspection PyChainedComparisons
    if years <= 0 and months <= 0 and days <= 0 and hours > 0:
        time_components.append(f"{hours} hours")
    elif hours > 0:
        time_components.append(f"and {hours} hours")

    if not time_components:
        return "0 hours"

    return ", ".join(time_components)
