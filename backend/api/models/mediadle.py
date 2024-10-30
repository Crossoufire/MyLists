from __future__ import annotations

from datetime import datetime
from typing import Dict

from sqlalchemy import func

from backend.api import db
from backend.api.models import Movies
from backend.api.utils.enums import MediaType


class DailyGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_type = db.Column(db.Enum(MediaType), nullable=False)
    media_id = db.Column(db.Integer, nullable=False)
    game_date = db.Column(db.Date, nullable=False, unique=True)
    pixelation_levels = db.Column(db.Integer, default=5)

    # --- relationships -----------------------------------------------------------
    user_progress = db.relationship("UserGameProgress", back_populates="daily_game", lazy="select")

    @classmethod
    def create_game(cls, today: datetime) -> DailyGame:
        """ Select a random movie that hasn't been used recently """

        used_movies = (
            cls.query.filter_by(media_type=MediaType.MOVIES)
            .order_by(DailyGame.game_date.desc())
            .with_entities(DailyGame.media_id)
            .limit(100).all()
        )
        used_movie_ids = [m.media_id for m in used_movies]

        available_movie = Movies.query.filter(Movies.id.not_in(used_movie_ids)).order_by(func.random()).first()
        daily_game = cls(media_type=MediaType.MOVIES, media_id=available_movie.id, game_date=today)

        db.session.add(daily_game)
        db.session.commit()

        return daily_game


class UserGameProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    daily_game_id = db.Column(db.Integer, db.ForeignKey("daily_game.id"), nullable=False)
    attempts = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    succeeded = db.Column(db.Boolean, default=False)
    completion_time = db.Column(db.DateTime)

    # --- relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="game_progress", lazy="select")
    daily_game = db.relationship("DailyGame", back_populates="user_progress", lazy="select")

    @classmethod
    def create_progress(cls, user_id: int, daily_game_id: int) -> UserGameProgress:
        """ Create a new user game progress """

        user_progress = cls(user_id=user_id, daily_game_id=daily_game_id)
        db.session.add(user_progress)
        db.session.commit()

        return user_progress


class GameStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_type = db.Column(db.Enum(MediaType), nullable=False)
    total_played = db.Column(db.Integer, default=0)
    total_won = db.Column(db.Integer, default=0)
    average_attempts = db.Column(db.Float, default=0)
    streak = db.Column(db.Integer, default=0)
    best_streak = db.Column(db.Integer, default=0)

    # --- relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="game_stats", lazy="select")

    def to_dict(self) -> Dict:
        return dict(
            total_won=self.total_won,
            current_streak=self.streak,
            best_streak=self.best_streak,
            total_played=self.total_played,
            average_attempts=round(self.average_attempts, 1),
            win_rate=round(self.total_won / self.total_played * 100, 1) if self.total_played > 0 else 0,
        )

    @classmethod
    def create_stats(cls, user_id: int, media_type: MediaType) -> GameStats:
        """ Create a new game stats """

        stats = cls(user_id=user_id, media_type=media_type)
        db.session.add(stats)
        db.session.commit()

        return stats
