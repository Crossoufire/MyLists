from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from flask import abort, current_app
from sqlalchemy import func, ColumnElement
from backend.api import db
from backend.api.models.abstracts import Media, MediaList, Genres, Platforms, Labels
from backend.api.core.handlers import current_user
from backend.api.models.user import UserLastUpdate, Notifications
from backend.api.models.mixins import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes


class Games(MediaMixin, Media):
    GROUP: MediaType = MediaType.GAMES

    collection_name = db.Column(db.String)
    game_engine = db.Column(db.String)
    game_modes = db.Column(db.String)
    player_perspective = db.Column(db.String)
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    storyline = db.Column(db.Text)
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

    def add_media_to_user(self, new_status: Status, user_id: int) -> int:
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
    def get_information(cls, job: str, info: str) -> List[Dict]:
        if job == "creator":
            query = (cls.query.join(GamesCompanies, GamesCompanies.media_id == cls.id)
                     .filter(GamesCompanies.name == info, GamesCompanies.developer == True).all())
        else:
            return abort(400)

        media_in_user_list = (
            db.session.query(GamesList)
            .filter(GamesList.user_id == current_user.id, GamesList.media_id.in_([media.id for media in query]))
            .all()
        )
        user_media_ids = [media.media_id for media in media_in_user_list]

        return [{**media.to_dict(), "in_list": media.id in user_media_ids} for media in query]

    @classmethod
    def remove_non_list_media(cls):
        try:
            games_to_delete = (
                cls.query.outerjoin(GamesList, GamesList.media_id == cls.id)
                .filter(GamesList.media_id.is_(None))
                .all()
            )

            current_app.logger.info(f"Games to delete: {len(games_to_delete)}")
            games_ids = [game.id for game in games_to_delete]

            GamesPlatforms.query.filter(GamesPlatforms.media_id.in_(games_ids)).delete()
            GamesCompanies.query.filter(GamesCompanies.media_id.in_(games_ids)).delete()
            GamesGenre.query.filter(GamesGenre.media_id.in_(games_ids)).delete()
            UserLastUpdate.query.filter(UserLastUpdate.media_type == MediaType.GAMES,
                                        UserLastUpdate.media_id.in_(games_ids)).delete()
            Notifications.query.filter(Notifications.media_type == "gameslist",
                                       Notifications.media_id.in_(games_ids)).delete()
            GamesLabels.query.filter(GamesLabels.media_id.in_(games_ids)).delete()
            cls.query.filter(cls.id.in_(games_ids)).delete()

            db.session.commit()

            current_app.logger.info(f"Games successfully deleted")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing games and related records: {str(e)}")

    @classmethod
    def get_new_releasing_media(cls):
        try:
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
                notif = Notifications.search(user_id, "gameslist", media_id)

                if notif is None:
                    new_notification = Notifications(
                        user_id=user_id,
                        media_id=media_id,
                        media_type="gameslist",
                        payload_json=json.dumps({"name": name, "release_date": release_date})
                    )
                    db.session.add(new_notification)

            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Error occurred checking for new releasing game: {e}")
            db.session.rollback()

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

    @staticmethod
    def form_only() -> List[str]:
        return ["name", "collection_name", "game_engine", "game_modes", "player_perspective", "release_date",
                "synopsis", "hltb_main_time", "hltb_main_and_extra_time", "hltb_total_complete_time"]


class GamesList(MediaListMixin, MediaList):
    GROUP = MediaType.GAMES
    DEFAULT_SORTING = "Playtime +"
    DEFAULT_STATUS = Status.PLAYING

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    playtime = db.Column(db.Integer)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="games_list", lazy="select")
    media = db.relationship("Games", back_populates="list_info", lazy="joined")

    class Status(ExtendedEnum):
        PLAYING = "Playing"
        COMPLETED = "Completed"
        MULTIPLAYER = "Multiplayer"
        ENDLESS = "Endless"
        DROPPED = "Dropped"
        PLAN_TO_PLAY = "Plan to Play"

    def to_dict(self) -> Dict:
        is_feeling = self.user.add_feeling

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        del media_dict["feeling"]
        del media_dict["score"]

        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name
        media_dict["all_status"] = self.Status.to_list()

        media_dict["rating"] = {
            "type": "feeling" if is_feeling else "score",
            "value": self.feeling if is_feeling else self.score
        }

        return media_dict

    def update_status(self, new_status: Status) -> int:
        self.status = new_status
        if new_status == Status.PLAN_TO_PLAY:
            self.playtime = 0

        return self.playtime

    @classmethod
    def get_specific_total(cls, user_id: int):
        return

    @staticmethod
    def update_time_spent(old_value: int = 0, new_value: int = 0):
        old_time = current_user.time_spent_games
        current_user.time_spent_games = old_time + (new_value - old_value)

    @classmethod
    def get_available_sorting(cls, is_feeling: bool) -> Dict[str, ColumnElement]:
        sorting_dict = {
            "Title A-Z": Games.name.asc(),
            "Title Z-A": Games.name.desc(),
            "Release date +": Games.release_date.desc(),
            "Release date -": Games.release_date.asc(),
            "Score IGDB +": Games.vote_average.desc(),
            "Score IGDB -": Games.vote_average.asc(),
            "Rating +": cls.feeling.desc() if is_feeling else cls.score.desc(),
            "Rating -": cls.feeling.asc() if is_feeling else cls.score.asc(),
            "Playtime +": cls.playtime.desc(),
            "Playtime -": cls.playtime.asc(),
            "Comments": cls.comment.desc(),
        }
        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.playtime)

    @classmethod
    def additional_search_joins(cls) -> List[Tuple]:
        return [(GamesPlatforms, GamesPlatforms.media_id == Games.id),
                (GamesCompanies, GamesCompanies.media_id == Games.id)]

    @classmethod
    def additional_search_filters(cls, search: str) -> List[ColumnElement]:
        return [Games.name.ilike(f"%{search}%"), GamesPlatforms.name.ilike(f"%{search}%"),
                GamesCompanies.name.ilike(f"%{search}%")]


class GamesGenre(Genres):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="genres", lazy="select")

    @staticmethod
    def get_available_genres() -> List:
        return ["4X", "Action",  "Adventure", "Arcade", "Business", "Card Game", "Comedy", "Drama",
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


class GamesLabels(MediaLabelMixin, Labels):
    GROUP = MediaType.GAMES

    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="labels", lazy="select")

    def to_dict(self) -> Dict:
        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict
