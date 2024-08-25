import os
import re
import secrets
from datetime import datetime, timezone
from typing import List, Any, Iterable, Tuple
from PIL import Image
from flask import current_app, abort
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename


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
        raise Exception("Total time must be greater than 0")
    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def save_picture(form_picture: FileStorage, old_picture: str, profile: bool = True):
    """ Save an account picture """

    try:
        image = Image.open(form_picture)
        if image.format.lower() not in ("gif", "jpeg", "jpg", "png", "webp", "tiff"):
            return abort(400, "Invalid picture format")

        random_hex = secrets.token_hex(16)
        _, f_ext = os.path.splitext(secure_filename(form_picture.filename))
        picture_fn = random_hex + f_ext

        if profile:
            save_path = os.path.join(current_app.root_path, "static/profile_pics", picture_fn)
        else:
            save_path = os.path.join(current_app.root_path, "static/background_pics", picture_fn)

        image.save(save_path)
        image.close()

        if old_picture and old_picture != "default.jpg":
            try:
                old_path = os.path.join(
                    current_app.root_path,
                    "static/profile_pics" if profile else "static/background_pics", old_picture
                )
                if os.path.exists(old_path):
                    os.remove(old_path)
            except Exception as e:
                current_app.logger.error(f"Error trying to remove an old picture: {str(e)}")

        return picture_fn

    except:
        return abort(400, f"An error occurred saving the picture")


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
    try:
        cleaner = re.compile("<.*?>")
        cleantext = re.sub(cleaner, "", raw_html)
        if not cleantext:
            cleantext = ""
        return cleantext
    except:
        return ""


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


def reorder_seas_eps(eps_watched: int, list_of_episodes: List[int]) -> Tuple[int, int, int]:
    """ Reorder the seasons and episodes. If eps_watched > sum(list_of_episodes) => last episode and last season """

    if eps_watched > sum(list_of_episodes):
        return list_of_episodes[-1], len(list_of_episodes), sum(list_of_episodes)

    count = 0
    for seas, eps in enumerate(list_of_episodes, start=1):
        count += eps
        if count >= eps_watched:
            last_episode = int(eps - (count - eps_watched))
            return last_episode, seas, eps_watched


def format_datetime(date) -> datetime | None:
    """ Format to a universal datetime format or None if datetime not valid before saving to db """

    date_patterns = ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d", "%Y"]
    for pattern in date_patterns:
        try:
            return datetime.strptime(date, pattern)
        except:
            pass

    try:
        return datetime.fromtimestamp(int(date))
    except:
        return None


def resize_and_save_image(input_path: Any, output_path: str, size: Tuple[int, int] = (300, 450)):
    with Image.open(input_path) as img:
        img_resized = img.resize(size, resample=Image.Resampling.LANCZOS)
        img_resized.save(output_path, quality=90)
