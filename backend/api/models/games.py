from __future__ import annotations

from typing import Dict, List

from flask import abort
from sqlalchemy import func, ColumnElement

from backend.api import db
from backend.api.core import current_user
from backend.api.models.abstracts import Media, MediaList, Genres, Platforms, Labels
from backend.api.utils.enums import MediaType, Status, ModelTypes, JobType, GamesPlatformsEnum


class Games(Media):
    GROUP: MediaType = MediaType.GAMES

    game_engine = db.Column(db.String)
    game_modes = db.Column(db.String)
    player_perspective = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    IGDB_url = db.Column(db.String)
    hltb_main_time = db.Column(db.String)
    hltb_main_and_extra_time = db.Column(db.String)
    hltb_total_complete_time = db.Column(db.String)

    # --- Relationships -----------------------------------------------------------
    genres = db.relationship("GamesGenre", back_populates="media", lazy="select")
    labels = db.relationship("GamesLabels", back_populates="media", lazy="select")
    list_info = db.relationship("GamesList", back_populates="media", lazy="dynamic")
    companies = db.relationship("GamesCompanies", back_populates="media", lazy="select")
    platforms_rl = db.relationship("GamesPlatforms", back_populates="media", lazy="select")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_cover": self.media_cover,
            "developers": [comp.name for comp in self.companies if comp.developer],
            "publishers": [comp.name for comp in self.companies if comp.publisher],
            "platforms": [r.name for r in self.platforms_rl],
            "genres": self.genres_list,
        })

        return media_dict

    def add_to_user(self, new_status: Status, user_id: int) -> int:
        # noinspection PyArgumentList
        user_list = GamesList(
            user_id=user_id,
            media_id=self.id,
            status=new_status,
            playtime=0,
        )
        db.session.add(user_list)
        return 0

    @classmethod
    def get_associated_media(cls, job: JobType, name: str) -> List[Dict]:
        if job == JobType.CREATOR:
            query = (
                cls.query.join(GamesCompanies, GamesCompanies.media_id == cls.id)
                .filter(GamesCompanies.name == name, GamesCompanies.developer == True)
                .all()
            )
        else:
            return abort(404, description="JobType not found")

        media_in_user_list = (
            db.session.query(GamesList)
            .filter(GamesList.user_id == current_user.id, GamesList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "game_engine", "game_modes", "player_perspective", "release_date", "synopsis",
                "hltb_main_time", "hltb_main_and_extra_time", "hltb_total_complete_time"]


class GamesList(MediaList):
    GROUP = MediaType.GAMES
    DEFAULT_SORTING = "Playtime +"
    DEFAULT_STATUS = Status.PLAYING

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    platform = db.Column(db.Enum(GamesPlatformsEnum))
    playtime = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="games_list", lazy="select")
    media = db.relationship("Games", back_populates="list_info", lazy="joined")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        media_dict.update({
            "media_name": self.media.name,
            "media_cover": self.media.media_cover,
            "platform": self.platform if self.platform else None,
            "all_status": Status.by(self.GROUP),
            "all_platforms": list(GamesPlatformsEnum),
            "rating": {
                "type": self.user.rating_system,
                "value": self.rating,
            }
        })

        return media_dict

    def update_status(self, new_status: Status) -> int:
        self.status = new_status
        if new_status == Status.PLAN_TO_PLAY:
            self.playtime = 0

        return self.playtime

    @classmethod
    def get_specific_total(cls, user_id: int):
        return

    @classmethod
    def get_available_sorting(cls) -> Dict[str, ColumnElement]:
        sorting_dict = {
            "Title A-Z": Games.name.asc(),
            "Title Z-A": Games.name.desc(),
            "Release date +": Games.release_date.desc(),
            "Release date -": Games.release_date.asc(),
            "IGDB Rating +": Games.vote_average.desc(),
            "IGDB Rating -": Games.vote_average.asc(),
            "Rating +": cls.rating.desc(),
            "Rating -": cls.rating.asc(),
            "Playtime +": cls.playtime.desc(),
            "Playtime -": cls.playtime.asc(),
        }
        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.playtime)


class GamesGenre(Genres):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List:
        return ["4X", "Action", "Adventure", "Arcade", "Business", "Card Game", "Comedy", "Drama",
                "Educational", "Erotic", "Fantasy", "Fighting", "Hack and Slash", "Historical", "Horror", "Indie",
                "Kids", "MOBA", "Music", "Mystery", "Non-fiction", "Open world", "Party", "Pinball", "Platform",
                "Point-and-click", "Puzzle", "Quiz", "Racing", "Real Time Strategy (RTS)", "Role-playing (RPG)",
                "Romance", "Sandbox", "Science fiction", "Shooter", "Simulator", "Sport", "Stealth", "Strategy",
                "Survival", "Tactical", "Thriller", "Turn-based strategy (TBS)", "Visual Novel", "Warfare"]


class GamesPlatforms(Platforms):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="platforms_rl", lazy="select")


class GamesCompanies(db.Model):
    TYPE = ModelTypes.COMPANIES
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    name = db.Column(db.String)
    publisher = db.Column(db.Boolean)
    developer = db.Column(db.Boolean)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="companies", lazy="select")


class GamesLabels(Labels):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="labels", lazy="select")
