from marshmallow import validate
from backend.api import ma


class HallOfFameSchema(ma.Schema):
    page = ma.Integer(load_default=1)
    search = ma.String(load_default="")
    sorting = ma.String(load_default="profile", metadata={
        "validate": validate.OneOf(["profile", "series", "anime", "movies", "games", "books"])
    })
