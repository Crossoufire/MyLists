import base64
import io
import os

from PIL import Image
from flask import Blueprint, jsonify, abort, current_app

from backend.api import db
from backend.api.core import token_auth, current_user
from backend.api.models import Movies
from backend.api.models.mediadle import DailyGame, UserGameProgress, GameStats
from backend.api.schemas.mediadle import MediaGuessSchema, GameSuggestionsSchema
from backend.api.utils.decorators import body, arguments
from backend.api.utils.enums import MediaType
from backend.api.utils.functions import naive_utcnow


game_bp = Blueprint("game", __name__)


@game_bp.route("/daily-game", methods=["GET"])
@token_auth.login_required
def get_daily_game():
    today = naive_utcnow().date()
    daily_game = DailyGame.query.filter_by(game_date=today).first()
    if not daily_game:
        daily_game = DailyGame.create_game(today=today)

    user_progress = UserGameProgress.query.filter_by(user_id=current_user.id, daily_game_id=daily_game.id).first()
    if not user_progress:
        user_progress = UserGameProgress.create_progress(user_id=current_user.id, daily_game_id=daily_game.id)

    selected_movie = Movies.query.get(daily_game.media_id)
    pixelation_level = min(daily_game.pixelation_levels, user_progress.attempts + 1)

    stats = GameStats.query.filter_by(user_id=current_user.id).first()

    data = dict(
        game_id=daily_game.id,
        media_id=daily_game.media_id,
        attempts=user_progress.attempts,
        completed=user_progress.completed,
        succeeded=user_progress.succeeded,
        max_attempts=daily_game.pixelation_levels,
        pixelated_cover=pixelate_image(selected_movie.media_cover, pixelation_level),
        non_pixelated_cover=selected_movie.media_cover if user_progress.completed else None,
        stats=stats.to_dict() if stats else None,
    )

    return jsonify(data=data), 200


@game_bp.route("/daily-game/guess", methods=["POST"])
@token_auth.login_required
@body(MediaGuessSchema)
def make_guess(data):
    daily_game = DailyGame.query.filter_by(game_date=naive_utcnow().date()).first()
    if not daily_game:
        return abort(404, description="No game available")

    progress = UserGameProgress.query.filter_by(user_id=current_user.id, daily_game_id=daily_game.id).first()
    if progress.completed:
        return abort(400, description="Game already completed")
    progress.attempts += 1

    selected_movie = Movies.query.get(daily_game.media_id)
    correct = selected_movie.name.lower().strip() == data["guess"].lower().strip()
    if correct or progress.attempts >= daily_game.pixelation_levels:
        progress.completed = True
        progress.succeeded = correct
        progress.completion_time = naive_utcnow()

        stats = GameStats.query.filter_by(user_id=current_user.id, media_type=MediaType.MOVIES).first()
        if not stats:
            stats = GameStats.create_stats(user_id=current_user.id, media_type=MediaType.MOVIES)

        stats.total_played += 1
        if correct:
            stats.total_won += 1
            stats.streak += 1
            stats.best_streak = max(stats.streak, stats.best_streak)
        else:
            stats.streak = 0

        stats.average_attempts = ((stats.average_attempts * (stats.total_played - 1) + progress.attempts) / stats.total_played)

    db.session.commit()

    data = dict(
        correct=correct,
        attempts=progress.attempts,
        completed=progress.completed,
        max_attempts=daily_game.pixelation_levels,
    )

    return jsonify(data=data), 200


@game_bp.route("/daily-game/suggestions", methods=["GET"])
@token_auth.login_required
@arguments(GameSuggestionsSchema)
def get_suggestions(args):
    if len(args["q"]) < 2:
        return jsonify(data=[]), 200
    suggestions = Movies.query.filter(Movies.name.ilike(f"%{args['q']}%")).with_entities(Movies.name).limit(20).all()
    return jsonify(data=[s.name for s in suggestions]), 200


@game_bp.route("/game-stats", methods=["GET"])
def get_stats():
    stats = GameStats.query.filter_by(user_id=current_user.id, media_type=MediaType.MOVIES).first()

    data = dict(total_won=0, current_streak=0, best_streak=0, total_played=0, average_attempts=0, win_rate=0)
    if stats:
        data = dict(
            total_won=stats.total_won,
            current_streak=stats.streak,
            best_streak=stats.best_streak,
            total_played=stats.total_played,
            average_attempts=round(stats.average_attempts, 1),
            win_rate=round(stats.total_won / stats.total_played * 100, 1) if stats.total_played > 0 else 0,
        )

    return jsonify(data=data), 200


def pixelate_image(image_data: str, level: int):
    """ Pixelate image based on level (1-5, with 1 being most pixelated) """

    img = Image.open(f"{os.path.dirname(current_app.root_path)}/{image_data}")

    # Higher number means lower pixelation
    scale_factors = {5: 6, 4: 7, 3: 8, 2: 10, 1: 12}

    # Calculate pixelation factor based on level
    factor = scale_factors.get(level, 20)
    size = img.size
    small = img.resize((size[0] // factor, size[1] // factor), Image.Resampling.NEAREST)
    result = small.resize(size, Image.Resampling.NEAREST)

    # Convert back to base64
    buffer = io.BytesIO()
    result.save(buffer, format="PNG")

    return base64.b64encode(buffer.getvalue()).decode()
