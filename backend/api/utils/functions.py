import imghdr
import os
import re
import secrets
from datetime import datetime, timezone
from typing import Dict, List, Any, Iterable, Literal
from flask import current_app, abort
from backend.api import db
from backend.api.utils.enums import ModelTypes, MediaType


TypeMediaType = MediaType | List[MediaType] | Literal["all"]
TypeModelType = ModelTypes | List[ModelTypes] | Literal["all"]
ReturnModelGroup = (db.Model | List[db.Model] | Dict[ModelTypes, db.Model] | Dict[MediaType, db.Model]
                    | Dict[MediaType, Dict[ModelTypes, db.Model]])


def get(state: Iterable, *path: Any, default: Any = None):
    """ Take an iterable and check if the path exists """

    try:
        for step in path:
            state = state[step]
    except LookupError:
        return default

    return state or default


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


def get_models_group(media_type: TypeMediaType, types: TypeModelType) -> ReturnModelGroup:
    """ Retrieve SQLAlchemy model(s) using the <GROUP> attribute and/or the <TYPE> attribute """

    registry = get_class_registry(db.Model).values()

    # Check <media_type> is "all" and <types> is "all"
    if media_type == "all" and types == "all":
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model):
                    models_dict[model.GROUP][model.TYPE] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    # Check <media_type> is "all" and <types> is ModelTypes
    if media_type == "all" and isinstance(types, ModelTypes):
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model) and types == model.TYPE:
                    models_dict[model.GROUP] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    # Check <media_type> is "all" and <types> is ModelTypes list
    if media_type == "all" and isinstance(types, list):
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.TYPES in types:
                    models_dict[model.GROUP][model.TYPE] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    # Check <media_type> is MediaType and <types> is "all"
    if isinstance(media_type, MediaType) and types == "all":
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model) and media_type == model.GROUP:
                    models_dict[model.TYPE] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    # Check <media_type> is MediaType and <types> is ModelTypes
    if isinstance(media_type, MediaType) and isinstance(types, ModelTypes):
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.GROUP == media_type and model.TYPE == types:
                    return model
            except (AttributeError, TypeError):
                pass

    # Check <media_type> is MediaType and <types> is ModelTypes list
    if isinstance(media_type, MediaType) and isinstance(types, list):
        models_list = []
        order = {t: idx for (idx, t) in enumerate(types)}
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.GROUP == media_type and model.TYPE in types:
                    models_list.append(model)
            except (AttributeError, TypeError):
                pass
        return sorted(models_list, key=lambda x: order.get(x.TYPE, float("inf")))

    # Check <media_type> is list and <types> is "all"
    if isinstance(media_type, list) and types == "all":
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.GROUP in media_type:
                    models_dict[model.GROUP][model.TYPE] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    # Check <media_type> is MediaType list and <types> is ModelTypes
    if isinstance(media_type, list) and isinstance(types, ModelTypes):
        models_list = []
        order = {t: idx for (idx, t) in enumerate(media_type)}
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.GROUP in media_type and types == model.TYPE:
                    models_list.append(model)
            except (AttributeError, TypeError):
                pass
        return sorted(models_list, key=lambda x: order.get(x.GROUP, float("inf")))

    # Check <media_type> is MediaType list and <types> is ModelTypes list
    if isinstance(media_type, list) and isinstance(types, list):
        models_dict = {}
        for model in registry:
            try:
                if issubclass(model, db.Model) and model.GROUP in media_type and model.TYPE in types:
                    models_dict[model.GROUP][model.TYPE] = model
            except (AttributeError, TypeError):
                pass
        return models_dict

    raise Exception(f"Unknown type or model type {media_type}")


def get_level(total_time: float) -> float:
    """ Function that returns the level based on time spent in [minutes] """

    if total_time < 0:
        current_app.logger.error("the total time given to the 'total_time' function is negative!")
        raise Exception("Total time must be greater than 0")

    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def get_media_level(user: db.Model, media_type: MediaType) -> int:
    """ Fetch the time spent in [min] and return the level of media for a user """

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
    """ Change the date format and return a formatted string """

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


def safe_div(a, b, percentage=False):
    """ Safe div when necessary + do the percentage """

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
    """ Check if the <original_name> is Latin, if so return <True> else <False> """

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

    return f"{round(value, 0)} {suffixes[exp]}$"


def display_time(minutes: int) -> str:
    """ Better display time in the MyLists <Stats> page """

    # Create datetime object for minutes
    dt = datetime.fromtimestamp(minutes * 60, timezone.utc)

    # Extract years, months, days, and hours
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
