import os
import re
import secrets
from datetime import datetime, timezone
from io import BytesIO
from typing import List, Any, Iterable, Tuple
from PIL import Image
from flask import current_app, abort


def get(state: Iterable, *path: Any, default: Any = None):
    """ Take an iterable and check if the path exists """

    try:
        for step in path:
            state = state[step]
    except LookupError:
        return default

    return state or default


def compute_level(total_time: float) -> float:
    if total_time < 0:
        current_app.logger.error("total_time is negative!")
        raise Exception("Total time must be greater than 0")
    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def save_picture(form_picture, old_picture: str, profile: bool = True):
    """ Save an account picture """

    try:
        image = Image.open(BytesIO(form_picture))
        if image.format.lower() not in ("gif", "jpeg", "jpg", "png", "webp", "tiff"):
            return abort(400, "Invalid picture format")
    except:
        return abort(400, "Invalid picture format")

    file = form_picture
    random_hex = secrets.token_hex(10)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext

    if profile:
        file.save(os.path.join(current_app.root_path, "static/profile_pictures", picture_fn))
    else:
        file.save(os.path.join(current_app.root_path, "static/back_pictures", picture_fn))

    try:
        if old_picture != "default.jpg":
            if profile:
                os.remove(os.path.join(current_app.root_path, "static/profile_pictures", old_picture))
                current_app.logger.info(f"Settings updated: Removed old picture: {old_picture}")
            else:
                os.remove(os.path.join(current_app.root_path, "static/back_pictures", old_picture))
                current_app.logger.info(f"Settings updated: Removed old background: {old_picture}")
    except:
        current_app.logger.error(f"Error trying to remove an old picture: {old_picture}")

    return picture_fn


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
    """ Check if name is iso-8859-1 compliant """

    try:
        original_name.encode("iso-8859-1")
        return True
    except UnicodeEncodeError:
        return False


def clean_html_text(raw_html: str) -> str:
    """ Mostly clean an HTML text. Used for books synopsis. """

    cleaner = re.compile("<.*?>")
    cleantext = re.sub(cleaner, "", raw_html)
    if not cleantext:
        cleantext = "Unknown"
    return cleantext


def reorder_seas_eps(eps_watched: int, list_of_episodes: List[int]) -> Tuple[int, int, int]:
    """ Reorder seasons and episodes. If eps_watched > sum(list_of_episodes) => last episode and last season """

    if eps_watched > sum(list_of_episodes):
        return list_of_episodes[-1], len(list_of_episodes), sum(list_of_episodes)

    count = 0
    for seas, eps in enumerate(list_of_episodes, start=1):
        count += eps
        if count >= eps_watched:
            last_episode = int(eps - (count - eps_watched))
            return last_episode, seas, eps_watched


def change_air_format(date_: str, tv: bool = False, games: bool = False, books: bool = False) -> str:
    try:
        if tv:
            return datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
        elif games:
            return datetime.fromtimestamp(int(date_), timezone.utc).strftime("%d %b %Y")
        elif books:
            try:
                return re.findall(r"\d{4}", date_)[0]
            except:
                return "Undefined"
        else:
            return datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
    except (ValueError, TypeError):
        return "Undefined"


def format_datetime(data) -> datetime | None:
    """ Format to a universal datetime format or None if datetime not valid before saving to db """

    date_patterns = ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d", "%Y"]

    for pattern in date_patterns:
        try:
            return datetime.strptime(data, pattern)
        except:
            try:
                return datetime.fromtimestamp(int(data))
            except:
                return None
    return None
