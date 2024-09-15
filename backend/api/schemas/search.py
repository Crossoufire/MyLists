from marshmallow import validate

from backend.api import ma


class SearchSchema(ma.Schema):
    q = ma.String(required=True)
    selector = ma.String(required=True, validate=validate.OneOf(["users", "TMDB", "IGDB", "BOOKS"]))
    page = ma.Int(load_default=1)
