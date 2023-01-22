"""
Utils functions and classes uses in different blueprints
"""

import re
from datetime import datetime
from enum import Enum
from typing import List, Dict
import pykakasi
import pytz
from MyLists import db


class MediaType(Enum):
    """ Media Type enumeration """

    SERIES = "series"
    ANIME = 'anime'
    MOVIES = 'movies'
    GAMES = 'games'
    BOOKS = 'books'


def latin_alphabet(original_name: str) -> str:
    """ Check if the original name is Latin """

    try:
        original_name.encode('iso-8859-1')
        return original_name
    except UnicodeEncodeError:
        try:
            kks = pykakasi.kakasi()
            kks.setMode("H", "a")
            kks.setMode("K", "a")
            kks.setMode("J", "a")
            kks.setMode("s", True)
            try:
                conv = kks.getConverter().do(original_name).split('.')
            except:
                conv = kks.getConverter().do(original_name).split()
            cap_parts = [p.capitalize() for p in conv]
            cap_message = " ".join(cap_parts)
            return cap_message
        except:
            return original_name


def change_air_format(date_: str, tv: bool = False, games: bool = False, books: bool = False) -> str:
    """ Change the date format and retun a string """

    if tv:
        try:
            return datetime.strptime(date_, '%Y-%m-%d').strftime("%b %Y")
        except:
            return "Unknown"
    if games:
        try:
            return datetime.utcfromtimestamp(int(date_)).strftime("%d %b %Y")
        except:
            return "Unknown"
    if books:
        try:
            return re.findall(re.compile("\d{4}"), date_)[0]
        except:
            return "Unknown"

    try:
        return datetime.strptime(date_, "%Y-%m-%d").strftime("%d %b %Y")
    except:
        return "Unknown"


def get_subclasses(cls: db.Model):
    """ Get all subclasses of a class """

    subclasses = set()
    for subclass in cls.__subclasses__():
        subclasses.add(subclass)
        subclasses.update(get_subclasses(subclass))

    return subclasses


def clean_text(raw_html: str) -> str:
    """ Clean HTML text """

    try:
        cleanr = re.compile("<.*?>")
        cleantext = re.sub(cleanr, "", raw_html)
    except:
        cleantext = "Unknown"

    return cleantext


def class_registry(cls: db.Model) -> Dict:
    """ Dynamically gets class registry of sqlalchemy from specified model """

    try:
        return cls._sa_registry._class_registry
    except:
        return cls._decl_class_registry


def get_models_group(media_type: Enum) -> List[db.Model]:
    """ Get SQL model from group """

    _ = []
    registry = class_registry(db.Model)
    for cls in registry.values():
        try:
            if issubclass(cls, db.Model):
                if media_type == cls.GROUP:
                    _.append(cls)
        except:
            pass

    return _


def get_models_type(model_type: str) -> List[db.Model]:
    """ Get the model type (List, Media, User, ...) """

    _ = []
    registry = class_registry(db.Model)
    for cls in registry.values():
        try:
            if issubclass(cls, db.Model):
                if model_type == cls.TYPE:
                    _.append(cls)
        except:
            pass

    return _


def shape_to_dict_updates(last_update: List[db.Model]) -> List[Dict]:
    """ Tranform SQL object of last media updates to List[Dict] """

    update = []
    for element in last_update:
        element_data = {}

        # Page update
        try:
            if element.old_page >= 0 and element.new_page >= 0:
                element_data["update"] = [f"p. {int(element.old_page)}", f"p. {int(element.new_page)}"]
        except:
            pass

        # Playtime update
        try:
            if element.old_playtime >= 0 and element.new_playtime >= 0:
                element_data["update"] = [f"{int(element.old_playtime/60)} h", f"{int(element.new_playtime/60)} h"]
        except:
            pass

        # Season or episode update
        if not element.old_status and not element.new_status:
            element_data["update"] = [f"S{element.old_season:02d}.E{element.old_episode:02d}",
                                      f"S{element.new_season:02d}.E{element.new_episode:02d}"]

        # Category update
        elif element.old_status and element.new_status:
            element_data["update"] = [f"{element.old_status.value}", f"{element.new_status.value}"]

        # Newly added media
        elif not element.old_status and element.new_status:
            element_data["update"] = ["{}".format(element.new_status.value)]

        # Update date and add media name
        element_data["date"] = element.date.replace(tzinfo=pytz.UTC).isoformat()
        element_data["media_name"] = element.media_name
        element_data["media_id"] = element.media_id

        if element.media_type == MediaType.SERIES:
            element_data["category"] = "series"
            element_data["icon-color"] = "fas fa-tv text-series"
            element_data["border"] = "#216e7d"
        if element.media_type == MediaType.ANIME:
            element_data["category"] = "anime"
            element_data["icon-color"] = "fas fa-torii-gate text-anime"
            element_data["border"] = "#945141"
        elif element.media_type == MediaType.MOVIES:
            element_data["category"] = "movies"
            element_data["icon-color"] = "fas fa-film text-movies"
            element_data["border"] = "#8c7821"
        elif element.media_type == MediaType.BOOKS:
            element_data["category"] = "books"
            element_data["icon-color"] = "fas fa-book text-books"
            element_data["border"] = "#5d4683"
        elif element.media_type == MediaType.GAMES:
            element_data["category"] = "games"
            element_data["icon-color"] = "fas fa-gamepad text-games"
            element_data["border"] = "#196219"

        update.append(element_data)

    return update


class dotdict(dict):
    """ dictionary attributes accessed with dot.notation """

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__

