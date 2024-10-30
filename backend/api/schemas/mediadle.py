from backend.api import ma


class MediaGuessSchema(ma.Schema):
    guess = ma.String(required=True)


class GameSuggestionsSchema(ma.Schema):
    q = ma.String(required=True)
