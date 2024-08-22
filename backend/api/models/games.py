from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from flask import abort, current_app
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.core.handlers import current_user
from backend.api.models.abstracts import Media, MediaList, Genre, Platform, Labels
from backend.api.models.users import Notifications, User, UserMediaUpdate
from backend.api.utils.enums import MediaType, Status, ModelTypes, NotificationType, JobType


class Games(Media):
    GROUP: MediaType = MediaType.GAMES

    game_engine = db.Column(db.String)
    game_modes = db.Column(db.String)
    player_perspective = db.Column(db.String)
    collection_name = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    homepage = db.Column(db.String)
    hltb_main_time = db.Column(db.String)
    hltb_main_extra_time = db.Column(db.String)
    hltb_total_time = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("GamesGenre", back_populates="media", lazy="select")
    labels = db.relationship("GamesLabels", back_populates="media", lazy="dynamic")
    media_list = db.relationship("GamesList", back_populates="media", lazy="dynamic")
    platforms = db.relationship("GamesPlatforms", back_populates="media", lazy="select")
    companies = db.relationship("GamesCompanies", back_populates="media", lazy="select")

    def add_to_user(self, user_id: int, status: Status) -> Tuple[int, GamesList]:
        # noinspection PyArgumentList
        media_assoc = GamesList(
            user_id=user_id,
            media_id=self.id,
            status=status,
            playtime=0,
        )

        db.session.add(media_assoc)
        db.session.flush()

        return 0, media_assoc

    @classmethod
    def get_information(cls, job: JobType, name: str) -> List[Media]:
        if job != JobType.CREATOR:
            return abort(400)

        all_media = (
            cls.query.join(GamesCompanies, GamesCompanies.media_id == cls.id)
            .filter(GamesCompanies.name == name, GamesCompanies.job == "developer")
            .all()
        )

        media_assoc_with_user = (
            GamesList.query
            .filter(GamesList.user_id == current_user.id, GamesList.media_id.in_([media.id for media in all_media]))
            .all()
        )

        user_media_ids = [media.media_id for media in media_assoc_with_user]

        for media in all_media:
            if media.id in user_media_ids:
                media.in_list = True

        return all_media

    @classmethod
    def remove_non_list_media(cls):
        games_to_delete = (
            cls.query.outerjoin(GamesList, GamesList.media_id == cls.id)
            .filter(GamesList.media_id.is_(None)).all()
        )

        current_app.logger.info(f"Games to delete: {len(games_to_delete)}")
        games_ids = [game.id for game in games_to_delete]

        GamesPlatforms.query.filter(GamesPlatforms.media_id.in_(games_ids)).delete()
        GamesCompanies.query.filter(GamesCompanies.media_id.in_(games_ids)).delete()
        GamesGenre.query.filter(GamesGenre.media_id.in_(games_ids)).delete()
        UserMediaUpdate.query.filter(UserMediaUpdate.media_type == MediaType.GAMES,
                                     UserMediaUpdate.media_id.in_(games_ids)).delete()
        Notifications.query.filter(Notifications.media_type == cls.GROUP,
                                   Notifications.media_id.in_(games_ids)).delete()
        GamesLabels.query.filter(GamesLabels.media_id.in_(games_ids)).delete()
        cls.query.filter(cls.id.in_(games_ids)).delete()

        db.session.commit()
        current_app.logger.info(f"Games successfully deleted")

    @classmethod
    def create_new_release_notification(cls):
        query = (
            db.session.query(cls.id, GamesList.user_id, cls.release_date, cls.name)
            .join(GamesList, cls.id == GamesList.media_id)
            .filter(
                cls.release_date.is_not(None),
                cls.release_date > datetime.utcnow(),
                cls.release_date <= datetime.utcnow() + timedelta(days=cls.RELEASE_WINDOW),
            ).all()
        )

        for media_id, user_id, release_date, name in query:
            notification = (
                Notifications.query
                .filter_by(user_id=user_id, media_id=media_id, media_type=cls.GROUP).first()
            )

            if not notification:
                new_notification = Notifications(
                    user_id=user_id,
                    media_id=media_id,
                    media_type=cls.GROUP,
                    notif_type=NotificationType.MEDIA,
                    payload_json=json.dumps({"name": name, "release_date": release_date})
                )
                db.session.add(new_notification)
        db.session.commit()

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        """ Refresh a media using the updated data created with the ApiData class """

        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

    @staticmethod
    def editable_columns() -> List[str]:
        return ["name", "game_engine", "game_modes", "player_perspective", "release_date", "synopsis",
                "hltb_main_time", "hltb_main_extra_time", "hltb_total_time"]


class GamesList(MediaList):
    GROUP = MediaType.GAMES
    DEFAULT_SORTING = "Playtime +"
    DEFAULT_STATUS = Status.PLAYING

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    current_playtime = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="games_list", lazy="select")
    media = db.relationship("Games", back_populates="media_list", lazy="joined")

    def update_status(self, status: Status) -> int:
        self.status = status
        if status == Status.PLAN_TO_PLAY:
            self.current_playtime = 0
        return self.current_playtime

    def update_time_spent(self, user: User, old_value: int = 0, new_value: int = 0):
        setting = user.get_media_setting(self.GROUP)
        setting.time_spent += (new_value - old_value)

    @classmethod
    def get_specific_total(cls, user_id: int):
        return

    @classmethod
    def available_sorting(cls) -> Dict[str, ColumnElement]:
        sorting_dict = {
            "Title A-Z": Games.name.asc(),
            "Title Z-A": Games.name.desc(),
            "Release date +": Games.release_date.desc(),
            "Release date -": Games.release_date.asc(),
            "IGDB Rating +": Games.vote_average.desc(),
            "IGDB Rating -": Games.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Playtime +": cls.current_playtime.desc(),
            "Playtime -": cls.current_playtime.asc(),
        }
        return sorting_dict

    @classmethod
    def time_spent_calculation(cls) -> ColumnElement:
        return func.sum(cls.current_playtime)


class GamesGenre(Genre):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="genres", lazy="select")

    @staticmethod
    def available_genres() -> List[str]:
        return ["4X", "Action",  "Adventure", "Arcade", "Business", "Card Game", "Comedy", "Drama",
                "Educational", "Erotic", "Fantasy", "Fighting", "Hack and Slash", "Historical", "Horror", "Indie",
                "Kids", "MOBA", "Music", "Mystery", "Non-fiction", "Open world", "Party", "Pinball", "Platform",
                "Point-and-click", "Puzzle", "Quiz", "Racing", "Real Time Strategy (RTS)", "Role-playing (RPG)",
                "Romance", "Sandbox", "Science fiction", "Shooter", "Simulator", "Sport", "Stealth", "Strategy",
                "Survival", "Tactical", "Thriller", "Turn-based strategy (TBS)", "Visual Novel", "Warfare"]


class GamesPlatforms(Platform):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="platforms", lazy="select")


class GamesCompanies(db.Model):
    TYPE = ModelTypes.COMPANIES
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    name = db.Column(db.String)
    developer = db.Column(db.Boolean)
    publisher = db.Column(db.Boolean)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="companies", lazy="select")


class GamesLabels(Labels):
    GROUP = MediaType.GAMES

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="labels", lazy="select")
