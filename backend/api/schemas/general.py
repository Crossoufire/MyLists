from marshmallow import validate

from backend.api import ma, MediaType


class HallOfFameSchema(ma.Schema):
    page = ma.Integer(load_default=1)
    search = ma.String(load_default="")
    sorting = ma.String(load_default="normalized", metadata={
        "validate": validate.OneOf(["normalized", "profile"] + [mt.value for mt in MediaType])
    })
