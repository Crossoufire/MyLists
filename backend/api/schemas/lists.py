from backend.api import ma
from backend.api.schemas.core import SplitStringList


class MediaListSchema(ma.Schema):
    page = ma.Integer(load_default=1)
    search = ma.String(load_default=None)
    comment = ma.Boolean(load_default=False)
    favorite = ma.Boolean(load_default=False)
    sorting = ma.String(load_default=None, data_key="sort")
    hide_common = ma.Boolean(load_default=False, data_key="common")
    langs = SplitStringList(ma.String(), load_default=["All"])
    status = SplitStringList(ma.String(), load_default=["All"])
    genres = SplitStringList(ma.String(), load_default=["All"])
    labels = SplitStringList(ma.String(), load_default=["All"])
    actors = SplitStringList(ma.String(), load_default=["All"])
    authors = SplitStringList(ma.String(), load_default=["All"])
    creators = SplitStringList(ma.String(), load_default=["All"])
    directors = SplitStringList(ma.String(), load_default=["All"])
    platforms = SplitStringList(ma.String(), load_default=["All"])
    companies = SplitStringList(ma.String(), load_default=["All"])
    networks = SplitStringList(ma.String(), load_default=["All"])


class MediaListSearchSchema(ma.Schema):
    q = ma.String(load_default="")
    job = ma.String(load_default="")
