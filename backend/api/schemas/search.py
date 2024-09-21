from backend.api import ma


class SearchSchema(ma.Schema):
    q = ma.String(required=True)
    page = ma.Int(load_default=1)
