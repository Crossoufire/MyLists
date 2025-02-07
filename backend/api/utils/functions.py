import os
import re
import secrets
from io import BytesIO
from urllib import request
from datetime import datetime, timezone
from typing import List, Any, Iterable, Tuple, Dict, Optional

from PIL import Image
from flask import current_app, abort
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from backend.api import MediaType


def make_cache_key():
    """
    Generate a cache key based on the endpoint and mt parameter.
    Returns keys in format:
    - `stats_global`
    - `stats_<username>`
    - `stats_global_<mt>`
    - `stats_<username>_<mt>`
    """

    from flask import request

    name = request.view_args.get("username", "global")
    media_type = request.args.get("mt", "").strip().lower()
    media_type = MediaType(media_type) if media_type else ""

    base_key = f"stats_{name}"
    if media_type:
        return f"{base_key}_{media_type}"

    return base_key


def get(state: Iterable, *path: Any, default: Any = None):
    """ Take an iterable and check if the path exists """

    try:
        for step in path:
            state = state[step]
    except (LookupError, TypeError):
        return default
    return state or default


def compute_level(total_time: float) -> float:
    if total_time < 0:
        raise Exception("Total time must be greater than 0")
    return (((400 + 80 * total_time) ** 0.5) - 20) / 40


def save_picture(form_picture: FileStorage, old_picture: str, profile: bool = True):
    """ Save an account picture """

    try:
        with Image.open(form_picture.stream) as image:
            if image.format.lower() not in ("gif", "jpeg", "jpg", "png", "webp", "tiff"):
                raise ValueError("Invalid image format")

            random_hex = secrets.token_hex(16)
            _, f_ext = os.path.splitext(secure_filename(form_picture.filename))
            picture_fn = random_hex + f_ext

            folder = "static/profile_pics" if profile else "static/background_pics"
            save_path = os.path.join(current_app.root_path, folder, picture_fn)

            image.save(save_path, save_all=True if image.format.lower() == "gif" else False)
    except (Exception, ValueError) as e:
        if isinstance(e, ValueError):
            return abort(500, description="Invalid image format")
        return abort(500, description="Failed to save image")

    if old_picture and old_picture != "default.jpg":
        old_path = os.path.join(current_app.root_path, folder, old_picture)
        if os.path.exists(old_path):
            os.remove(old_path)

    return picture_fn


def safe_div(a: float, b: float, percentage: bool = False):
    """ Safe division which returns 0 if division by 0 """

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
    """ Check if name is Latin using ISO-8859-1 """

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


def format_datetime_from_dict(date_dict: Dict[str, int]) -> Optional[datetime]:
    """ Format a date dictionary (like {'year': 2013, 'month': 4, 'day': 12}) into a datetime object """
    try:
        year = date_dict.get("year")
        month = date_dict.get("month", 1)
        day = date_dict.get("day", 1)
        if year is not None:
            return datetime(year, month, day)
    except:
        pass
    return None


def format_datetime(date: Optional[str | Dict[str, int]]) -> Optional[datetime]:
    """ Format to a universal datetime format or None if datetime not valid before saving to db """

    if not date:
        return None

    if isinstance(date, dict):
        return format_datetime_from_dict(date)

    # Try to parse ISO 8601 format directly
    try:
        return datetime.fromisoformat(date.replace("Z", "+00:00"))
    except ValueError:
        pass

    # Define other date patterns
    date_patterns = ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y"]
    for pattern in date_patterns:
        try:
            return datetime.strptime(date, pattern)
        except:
            pass

    try:
        return datetime.fromtimestamp(int(date))
    except:
        return None


def format_to_download_as_csv(media_dict: Dict) -> Dict:
    """ Format the media assoc data to be downloaded as CSV """

    # Flatten `rating` dict
    if "rating" in media_dict:
        rating = media_dict["rating"]
        media_dict["rating_value"] = rating["value"]
        media_dict["rating_type"] = rating["type"]
        del media_dict["rating"]

    # List of attributes to remove
    attributes_to_remove = ["media_cover", "all_status", "all_platforms", "eps_per_season"]

    # Remove unnecessary attributes
    for attr in attributes_to_remove:
        media_dict.pop(attr, None)

    return media_dict


def global_limiter() -> str:
    """ Create a global API limiter key """
    return "global"


def aware_utcnow():
    return datetime.now(timezone.utc)


def naive_utcnow():
    return aware_utcnow().replace(tzinfo=None)


def resize_and_save_image(input_path: Any, output_path: str, size: Tuple[int, int] = (300, 450)):
    with Image.open(input_path) as img:
        img = img.convert("RGB")
        img_resized = img.resize(size, resample=Image.Resampling.LANCZOS)
        img_resized.save(output_path, quality=90)


def fetch_cover(cover_url: Optional[str]) -> Optional[BytesIO]:
    """ Fetch image data from a URL and returns it as BytesIO object. """

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
        "Accept-Encoding": "none",
        "Accept-Language": "en-US,en;q=0.8",
        "Connection": "keep-alive",
    }

    try:
        req = request.Request(url=cover_url, headers=headers)
        with request.urlopen(req) as response:
            image_data = response.read()
        return BytesIO(image_data)
    except:
        return None
