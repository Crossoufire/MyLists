from __future__ import annotations
import json
from datetime import datetime
from enum import Enum
from typing import Dict, List
from flask import abort, current_app
from sqlalchemy import text, func
from backend.api import db
from backend.api.routes.auth import current_user
from backend.api.models.user_models import User, UserLastUpdate, Notifications
from backend.api.models.utils_models import MediaMixin, MediaListMixin, MediaLabelMixin
from backend.api.utils.enums import MediaType, Status, ExtendedEnum, ModelTypes
from backend.api.utils.functions import change_air_format


class Games(MediaMixin, db.Model):
    """ Games SQL model """

    TYPE = ModelTypes.MEDIA
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    image_cover = db.Column(db.String(100), nullable=False)
    collection_name = db.Column(db.String(50))
    game_engine = db.Column(db.String(50))
    game_modes = db.Column(db.String(200))
    player_perspective = db.Column(db.String(50))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Float)
    release_date = db.Column(db.String(30))
    storyline = db.Column(db.Text)
    synopsis = db.Column(db.Text)
    IGDB_url = db.Column(db.String(200))
    hltb_main_time = db.Column(db.String(20))
    hltb_main_and_extra_time = db.Column(db.String(20))
    hltb_total_complete_time = db.Column(db.String(20))
    api_id = db.Column(db.Integer, nullable=False)
    lock_status = db.Column(db.Boolean, default=1)

    genres = db.relationship("GamesGenre", backref="games", lazy=True)
    platforms_rl = db.relationship("GamesPlatforms", backref="games", lazy=True)
    companies = db.relationship("GamesCompanies", backref="games", lazy=True)
    list_info = db.relationship("GamesList", back_populates="media", lazy="dynamic")

    """ --- Properties ------------------------------------------------------------ """
    @property
    def formated_date(self):
        """ return the formatted release date """
        return change_air_format(self.release_date, games=True)

    @property
    def developers(self) -> List:
        """ Return the developers as a list of str """
        return [comp.name for comp in self.companies if comp.developer]

    @property
    def publishers(self) -> List:
        """ Return all the publishers of a game """
        return [comp.name for comp in self.companies if comp.publisher]

    @property
    def platforms(self) -> List:
        """ Return all the platforms """
        return [r.name for r in self.platforms_rl]

    def to_dict(self, coming_next: bool = False) -> Dict:
        """ Serialization of the games class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        if coming_next:
            media_dict["media_cover"] = self.media_cover
            media_dict["date"] = change_air_format(self.release_date)
            return media_dict

        media_dict["media_cover"] = self.media_cover
        media_dict["formated_date"] = self.formated_date
        media_dict["developers"] = self.developers
        media_dict["platforms"] = self.platforms
        media_dict["publishers"] = self.publishers
        media_dict["genres"] = self.genres_list
        media_dict["similar_media"] = self.get_similar_genres()

        return media_dict

    def add_media_to_user(self, new_status: Enum, user_id: int) -> int:
        """ Add a new game to the current user, and return the current playtime """

        # noinspection PyArgumentList
        user_list = GamesList(
            user_id=user_id,
            media_id=self.id,
            status=new_status,
            completion=False,
            playtime=0,
        )

        db.session.add(user_list)

        return 0

    @classmethod
    def get_information(cls, job: str, info: str) -> List[Dict]:
        """ From the creator get all the other games """

        if job == "creator":
            query = (cls.query.join(GamesCompanies, GamesCompanies.media_id == cls.id)
                     .filter(GamesCompanies.name == info, GamesCompanies.developer == True).all())
        else:
            return abort(400)

        return [q.to_dict(coming_next=True) for q in query]

    @classmethod
    def remove_non_list_media(cls):
        """ Remove all games that are not present in a User list from the database and the disk """

        try:
            # Games remover
            games_to_delete = (cls.query.outerjoin(GamesList, GamesList.media_id == cls.id)
                               .filter(GamesList.media_id.is_(None)).all())

            count_ = 0
            for game in games_to_delete:
                GamesPlatforms.query.filter_by(media_id=game.id).delete()
                GamesCompanies.query.filter_by(media_id=game.id).delete()
                GamesGenre.query.filter_by(media_id=game.id).delete()
                UserLastUpdate.query.filter_by(media_type=MediaType.GAMES, media_id=game.id).delete()
                Notifications.query.filter_by(media_type="gameslist", media_id=game.id).delete()
                GamesLabels.query.filter_by(media_id=game.id).delete()
                Games.query.filter_by(id=game.id).delete()

                count_ += 1
                current_app.logger.info(f"Removed game with ID: [{game.id}]")

            current_app.logger.info(f"Total games removed: {count_}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error occurred while removing games and related records: {str(e)}")

    @classmethod
    def get_new_releasing_media(cls):
        """ Check for the new releasing games in a week or less from the IGDB API """

        try:
            raw_sql = text(""" SELECT games.id, games_list.user_id, games.release_date, games.name 
            FROM games JOIN games_list ON games.id = games_list.media_id
            WHERE datetime(games.release_date, 'unixepoch') IS NOT NULL 
            AND datetime(games.release_date, 'unixepoch') > datetime('now')
            AND datetime(games.release_date, 'unixepoch') <= datetime('now', '+7 days') 
            AND games_list.status != 'PLAN TO PLAY'; """)

            query = db.session.execute(raw_sql).all()

            for info in query:
                notif = Notifications.seek(info[1], "gameslist", info[0])

                if notif is None:
                    release_date = datetime.utcfromtimestamp(int(info[2])).strftime("%b %d %Y")

                    # noinspection PyArgumentList
                    new_notification = Notifications(
                        user_id=info[1],
                        media_type="gameslist",
                        media_id=info[0],
                        payload_json=json.dumps({"name": info[3], "release_date": release_date})
                    )
                    db.session.add(new_notification)

            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Error occurred while checking for new releasing game: {e}")
            db.session.rollback()

    @classmethod
    def refresh_element_data(cls, api_id: int, new_data: Dict):
        """ Refresh a media using the new_data from ApiData """

        # Update main details and commit changes
        cls.query.filter_by(api_id=api_id).update(new_data["media_data"])
        db.session.commit()

    @staticmethod
    def form_only() -> List[str]:
        """ Return the allowed fields for a form """
        return ["name", "collection_name", "game_engine", "game_modes", "player_perspective", "release_date",
                "synopsis", "hltb_main_time", "hltb_main_and_extra_time", "hltb_total_complete_time"]


class GamesList(MediaListMixin, db.Model):
    """ Games list SQL model """

    TYPE = ModelTypes.LIST
    GROUP = MediaType.GAMES
    DEFAULT_SORTING = "Playtime +"
    DEFAULT_STATUS = Status.PLAYING

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    status = db.Column(db.Enum(Status), nullable=False)
    completion = db.Column(db.Boolean)
    playtime = db.Column(db.Integer)
    favorite = db.Column(db.Boolean)
    feeling = db.Column(db.String(30))
    score = db.Column(db.Float)
    comment = db.Column(db.Text)
    completion_date = db.Column(db.DateTime)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", back_populates="list_info", lazy=False)

    class Status(ExtendedEnum):
        """ New status class for easiness """

        PLAYING = "Playing"
        COMPLETED = "Completed"
        MULTIPLAYER = "Multiplayer"
        ENDLESS = "Endless"
        DROPPED = "Dropped"
        PLAN_TO_PLAY = "Plan to Play"

    def to_dict(self) -> Dict:
        """ Serialization of the gameslist class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name
        media_dict["all_status"] = self.Status.to_list()

        return media_dict

    def update_status(self, new_status: Enum) -> int:
        """ Change the status of the game for the current user """

        self.status = new_status

        if new_status == Status.COMPLETED:
            self.completion_date = datetime.today()
        elif new_status == Status.PLAN_TO_PLAY:
            self.playtime = 0

        return self.playtime

    @classmethod
    def get_specific_total(cls, user_id: int):
        """ No specific total for the games """
        return

    @classmethod
    def get_media_stats(cls, user: User) -> List[Dict]:
        """ Get more stats associated with games """

        subquery = (db.session.query(cls.media_id)
                    .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_PLAY).subquery())

        playtime = db.session.scalars(db.select(cls.playtime)
                                      .filter(cls.user_id == user.id, cls.status != Status.PLAN_TO_PLAY)).all()
        playtime_bins = [0, 300, 600, 1200, 2400, 4200, 6000, 30000, 60000, 600000]
        binning = [sum(1 for play in playtime if playtime_bins[i] <= play < playtime_bins[i + 1]) for i in
                   range(len(playtime_bins) - 1)]

        release_dates = (db.session.query(((func.strftime('%Y', func.datetime(Games.release_date, 'unixepoch')) // 5) * 5).label("release"),
                                          func.count().label("count"))
                         .join(subquery, (Games.id == subquery.c.media_id) & (Games.release_date.isnot(None)))
                         .group_by("release").order_by("release").all())

        top_genres = (db.session.query(GamesGenre.genre, func.count(GamesGenre.genre).label("count"))
                      .join(subquery, (GamesGenre.media_id == subquery.c.media_id) & (GamesGenre.genre != "Unknown"))
                      .group_by(GamesGenre.genre).order_by(text("count desc")).limit(10).all())

        top_dev = (db.session.query(GamesCompanies.name, func.count(GamesCompanies.name).label("count"))
                   .join(subquery, (GamesCompanies.media_id == subquery.c.media_id) & (GamesCompanies.name != "Unknown")
                         & (GamesCompanies.developer == True))
                   .group_by(GamesCompanies.name).order_by(text("count desc")).limit(10).all())

        top_platforms = (db.session.query(GamesPlatforms.name, func.count(GamesPlatforms.name).label("count"))
                         .join(subquery, (GamesPlatforms.media_id == subquery.c.media_id) & (GamesPlatforms.name != "Unknown"))
                         .group_by(GamesPlatforms.name).order_by(text("count desc")).limit(10).all())

        top_perspectives = (db.session.query(Games.player_perspective, func.count(Games.player_perspective).label("count"))
                            .join(subquery, (Games.id == subquery.c.media_id) & (Games.player_perspective != "Unknown"))
                            .group_by(Games.player_perspective).order_by(text("count desc")).limit(5).all())

        stats = [
            {"name": "Playtime", "values": list(zip(playtime_bins[:-1], binning))},
            {"name": "Releases date", "values": [(release, count_) for release, count_ in release_dates]},
            {"name": "Genres", "values": [(genre, count_) for genre, count_ in top_genres]},
            {"name": "Developers", "values": [(dev, count_) for dev, count_ in top_dev]},
            {"name": "Platforms", "values": [(plat, count_) for plat, count_ in top_platforms]},
            {"name": "Perspectives", "values": [(pers, count_) for pers, count_ in top_perspectives]},
        ]

        return stats

    @staticmethod
    def update_time_spent(old_value: int = 0, new_value: int = 0):
        """ Computed new time for the user """

        old_time = current_user.time_spent_games
        current_user.time_spent_games = old_time + (new_value - old_value)

    @classmethod
    def get_available_sorting(cls, is_feeling: bool) -> Dict:
        """ Return the available sorting for games """

        sorting_dict = {
            "Title A-Z": Games.name.asc(),
            "Title Z-A": Games.name.desc(),
            "Release date +": Games.release_date.desc(),
            "Release date -": Games.release_date.asc(),
            "Score IGDB +": Games.vote_average.desc(),
            "Score IGDB -": Games.vote_average.asc(),
            "Playtime +": cls.playtime.desc(),
            "Playtime -": cls.playtime.asc(),
            "Comments": cls.comment.desc(),
            "Score +": cls.feeling.desc() if is_feeling else cls.score.desc(),
            "Score -": cls.feeling.asc() if is_feeling else cls.score.asc(),
        }

        return sorting_dict

    @classmethod
    def total_user_time_def(cls):
        return func.sum(cls.playtime)


class GamesGenre(db.Model):
    """ Games genres SQL model """

    TYPE = ModelTypes.GENRE
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    genre = db.Column(db.String(100), nullable=False)

    @staticmethod
    def get_available_genres() -> List:
        """ Return the available genres for the games """
        return ["All", "4X", "Action",  "Adventure", "Arcade", "Business", "Card Game", "Comedy", "Drama",
                "Educational", "Erotic", "Fantasy", "Fighting","Hack and Slash", "Historical", "Horror", "Indie",
                "Kids", "MOBA", "Music", "Mystery", "Non-fiction", "Open world", "Party", "Pinball", "Platform",
                "Point-and-click", "Puzzle", "Quiz", "Racing", "Real Time Strategy (RTS)", "Role-playing (RPG)",
                "Romance", "Sandbox", "Science fiction", "Shooter", "Simulator", "Sport", "Stealth", "Strategy",
                "Survival", "Tactical", "Thriller", "Turn-based strategy (TBS)", "Visual Novel", "Warfare"]


class GamesPlatforms(db.Model):
    """ Games platforms SQL model """

    TYPE = ModelTypes.PLATFORMS
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(150))


class GamesCompanies(db.Model):
    """ Games companies SQL model """

    TYPE = ModelTypes.COMPANIES
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    name = db.Column(db.String(100))
    publisher = db.Column(db.Boolean)
    developer = db.Column(db.Boolean)


class GamesLabels(MediaLabelMixin, db.Model):
    """ GamesLabels SQL model """

    TYPE = ModelTypes.LABELS
    GROUP = MediaType.GAMES

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    label = db.Column(db.String(64), nullable=False)

    # --- Relationships -----------------------------------------------------------
    media = db.relationship("Games", lazy=False)

    def to_dict(self) -> Dict:
        """ Serialization of the GamesLabels class """

        media_dict = {}
        if hasattr(self, "__table__"):
            media_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        # Add more info
        media_dict["media_cover"] = self.media.media_cover
        media_dict["media_name"] = self.media.name

        return media_dict