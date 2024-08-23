import json
from datetime import datetime
from typing import Dict
from sqlalchemy import or_
from backend.api import db


class SearchableMixin:
    @classmethod
    def search(cls, query, search_term: str):
        search_columns = getattr(cls, "__searchable__", [])

        filters = []
        for column in search_columns:
            filters.append(getattr(cls, column).ilike(f"%{search_term}%"))

        return query.filter(or_(*filters))


class MyListsStats(db.Model):
    GROUP = "Stats"

    id = db.Column(db.Integer, primary_key=True)

    nb_users = db.Column(db.Integer)
    nb_media = db.Column(db.Text)
    total_time = db.Column(db.Text)

    top_media = db.Column(db.Text)
    top_genres = db.Column(db.Text)
    top_actors = db.Column(db.Text)
    top_authors = db.Column(db.Text)
    top_directors = db.Column(db.Text)
    top_developers = db.Column(db.Text)
    top_dropped = db.Column(db.Text)
    top_rated_actors = db.Column(db.Text)
    top_rated_directors = db.Column(db.Text)
    top_rated_developers = db.Column(db.Text)

    total_episodes = db.Column(db.Text)
    total_seasons = db.Column(db.Text)
    total_movies = db.Column(db.Text)
    total_pages = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def get_all_stats(cls) -> Dict:
        all_stats = cls.query.order_by(cls.timestamp.desc()).first()

        mylists_data = {}
        for key, value in all_stats.__dict__.items():
            if key not in ("id", "timestamp", "_sa_instance_state"):
                if isinstance(value, str):
                    mylists_data[key] = json.loads(value)
                else:
                    mylists_data[key] = value

        return mylists_data
