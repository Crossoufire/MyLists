"""
Utils functions and classes uses in different blueprints
"""

import re
from datetime import datetime
import pykakasi


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


