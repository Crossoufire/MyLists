from backend.api import ma


class MediaGuessSchema(ma.Schema):
    guess = ma.String(required=True)


class MediadleSuggestionsSchema(ma.Schema):
    q = ma.String(required=True)
