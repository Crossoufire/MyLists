import imghdr
import os
import re
import secrets
import datetime
from enum import Enum
from typing import Dict, List, Type, Any, Union
import pytz
from flask import current_app
from backend.api import db
from backend.api.utils.enums import ModelTypes, MediaType


def get_subclasses(cls: Type) -> Union[Type, Any]:
    """ Get all the subclasses of a class (used now for ApiData) """

    subclasses = set()
    for subclass in cls.__subclasses__():
        subclasses.add(subclass)
        subclasses.update(get_subclasses(subclass))

    return subclasses


def get_class_registry(cls: db.Model) -> Dict:
    """ Dynamically gets class registry of sqlalchemy from specified model """

    try:
        # noinspection PyProtectedMember
        return cls._sa_registry._class_registry
    except:
        return cls._decl_class_registry

def get_models_group(media_type: MediaType, types: ModelTypes | List[ModelTypes]) -> List[db.Model] | db.Model:
    """ Get the corresponding SQLAlchemy models from the <GROUP> value """

    if not isinstance(types, list):
        types = [types]

    selected_models = []
    registry = get_class_registry(db.Model)

    # Track order of types
    types_order = {type_: idx for (idx, type_) in enumerate(types)}

    for model in registry.values():
        try:
            if (issubclass(model, db.Model) and hasattr(model, "GROUP") and media_type == model.GROUP and
                    getattr(model, "TYPE") in types):
                selected_models.append(model)
        except:
            pass

    selected_models.sort(key=lambda x: types_order.get(getattr(x, "TYPE"), float("inf")))

    return selected_models if len(selected_models) > 1 else selected_models[0]


def get_all_models_group(media_type: Enum) -> Dict[ModelTypes, db.Model]:
    """ Get all the corresponding SQLAlchemy models from the <GROUP> value as a dict """

    models = {}
    registry = get_class_registry(db.Model)

    for model in registry.values():
        try:
            if issubclass(model, db.Model) and hasattr(model, "GROUP") and media_type == model.GROUP:
                models[model.TYPE] = model
        except:
            pass

    return models


def get_models_type(model_type: ModelTypes) -> List[db.Model]:
    """ Get the model type (List, Media, User, ...) """

    ORDER = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.BOOKS, MediaType.GAMES]

    models = []
    registry = get_class_registry(db.Model)
    for model in registry.values():
        try:
            if issubclass(model, db.Model) and hasattr(model, "TYPE") and model_type == model.TYPE:
                models.append(model)
        except:
            pass

    # Sort models based on ORDER
    models.sort(key=lambda x: ORDER.index(x.GROUP))

    return models


def get_level(total_time: float):
    """ Function that returns the level based on time in [minutes] """
    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def get_media_level_and_time(user: db.Model, media_type: str, only_level: bool = False) -> Union[int, Dict]:
    """ Fetch the time spent in min and level of media for a user """

    # To avoid circular import
    from backend.api.models.utils_models import Ranks

    # Fetch <time_spent> in minute
    time_min = getattr(user, f"time_spent_{media_type}")

    # Get <levels> and <level_percent>
    media_level_tmp = f"{get_level(time_min):.2f}"
    media_level = int(media_level_tmp.split(".")[0])
    media_level_percent = int(media_level_tmp.split(".")[1])

    if only_level:
        return media_level

    # Fetch associated rank
    rank = Ranks.query.filter_by(level=media_level if media_level < 150 else 149).first()

    data = dict(
        media_level=media_level,
        media_level_percent=media_level_percent,
        grade_image=rank.image,
        grade_title=rank.name,
    )

    return data


def save_picture(form_picture, old_picture: str, profile=True):
    """ Save the account picture either profile or background """

    if imghdr.what(form_picture) in ("gif", "jpeg", "jpg", "png", "webp", "tiff"):
        # Get image in new var
        file = form_picture

        # Create random name
        random_hex = secrets.token_hex(10)

        # Split extension
        _, f_ext = os.path.splitext(form_picture.filename)

        # Create picture filename
        picture_fn = random_hex + f_ext

        if profile:
            file.save(os.path.join(current_app.root_path, "static/profile_pics", picture_fn))
        else:
            file.save(os.path.join(current_app.root_path, "static/background_pics", picture_fn))
    else:
        picture_fn = "default.jpg"
        current_app.logger.error(f"[SYSTEM] Invalid picture format: {imghdr.what(form_picture)}")

    try:
        if old_picture != "default.jpg":
            if profile:
                os.remove(os.path.join(current_app.root_path, "static/profile_pics", old_picture))
                current_app.logger.info(f"Settings updated: Removed the old picture: {old_picture}")
            else:
                os.remove(os.path.join(current_app.root_path, "static/background_pics", old_picture))
                current_app.logger.info(f'Settings updated: Removed the old background: {old_picture}')
    except:
        pass

    return picture_fn


def change_air_format(date_: str, tv: bool = False, games: bool = False, books: bool = False) -> str:
    """ Change the date format and return a formatted string """

    try:
        if tv:
            return datetime.datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
        elif games:
            return datetime.datetime.fromtimestamp(int(date_), pytz.UTC).strftime("%d %b %Y")
        elif books:
            return re.findall(re.compile("\d{4}"), date_)[0]
        else:
            return datetime.datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
    except (ValueError, TypeError):
        return "N/A"


def safe_div(a, b, percentage=False):
    """ Safe div when necessary + do the percentage """

    try:
        if b == 0:
            return 0
        result = a/b
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
    """ Mostly clean an HTML text (not perfect), for the books synopsis from the Google books API """

    cleaner = re.compile("<.*?>")
    cleantext = re.sub(cleaner, "", raw_html)

    if not cleantext:
        cleantext = "Unknown"

    return cleantext


def display_time(minutes: int) -> str:
    """ Better display time in the MyLists <Stats> page """

    # Create datetime object for minutes
    dt = datetime.datetime.fromtimestamp(minutes * 60, pytz.UTC)

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
    if hours > 0:
        time_components.append(f"and {hours} hours")

    if not time_components:
        return "0 hours"

    return ", ".join(time_components)
