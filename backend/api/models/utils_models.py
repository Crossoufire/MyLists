import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from flask import url_for, current_app
from sqlalchemy import desc, asc, func
from backend.api import db
from backend.api.routes.handlers import current_user
from backend.api.utils.enums import Status, MediaType, ModelTypes
from backend.api.utils.functions import safe_div, change_air_format, ModelsFetcher

""" --- MIXIN MODELS ---------------------------------------------------------------------------------------- """


class MediaMixin:
    """ Media Mixin class for the SQLAlchemy classes: Series/Anime/Movies/Games/Books """

    GROUP = None
    SIMILAR_GENRES = 12

    id: int
    actors: List
    genres: List
    image_cover: str
    list_info: db.relationship

    @property
    def actors_list(self) -> List:
        """ Fetch the media actors """
        return [d.name for d in self.actors]

    @property
    def genres_list(self) -> List:
        """ Fetch the media genres """
        return [g.genre for g in self.genres[:5]]

    @property
    def networks(self) -> List:
        """ Fetch the media networks """
        return [n.network for n in self.networks]

    @property
    def media_cover(self) -> str:
        """ Get the media cover """
        return url_for("static", filename=f"covers/{self.GROUP.value}_covers/{self.image_cover}")

    def get_similar_media(self) -> List[Dict]:
        """ Get the similar genres compared to the media """

        media, media_genre = ModelsFetcher.get_lists_models(self.GROUP, [ModelTypes.MEDIA, ModelTypes.GENRE])

        if len(self.genres_list) == 0 or self.genres_list[0] == "Unknown":
            return []

        sim_genres = (
            db.session.query(media, func.count(func.distinct(media_genre.genre)).label("genre_c"))
            .join(media_genre, media.id == media_genre.media_id)
            .filter(media_genre.genre.in_(self.genres_list), media_genre.media_id != self.id)
            .group_by(media.id).having(func.count(func.distinct(media_genre.genre)) >= 1)
            .order_by(desc("genre_c")).limit(self.SIMILAR_GENRES).all()
        )

        return [{"media_id": m[0].id, "media_name": m[0].name, "media_cover": m[0].media_cover} for m in sim_genres]

    def in_follows_lists(self) -> List[Dict]:
        """ Verify whether the <media> is included in the list of users followed by the <current_user> """

        media_list = ModelsFetcher.get_unique_model(self.GROUP, ModelTypes.LIST)

        in_follows_lists = (
            db.session.query(User, media_list, followers)
            .join(User, User.id == followers.c.followed_id)
            .join(media_list, media_list.user_id == followers.c.followed_id)
            .filter(followers.c.follower_id == current_user.id, media_list.media_id == self.id)
            .all()
        )

        data = [{
            "username": follow[0].username,
            "profile_image": follow[0].profile_image,
            "add_feeling": follow[0].add_feeling,
            **follow[1].to_dict(),
        } for follow in in_follows_lists]

        return data

    def get_user_list_info(self, label_class: db.Model) -> Dict | bool:
        """ Retrieve if the <current_user> has the <media> in its <media_list> and <label_class> """

        media_list_q = self.list_info.filter_by(user_id=current_user.id).first()
        user_data = media_list_q.to_dict() if media_list_q is not None else False

        if user_data is not False:
            user_data.update({
                "username": current_user.username,
                "labels": label_class.get_user_media_labels(user_id=current_user.id, media_id=self.id),
                "history": UserLastUpdate.get_history(self.GROUP, self.id)
            })

        return user_data


class MediaListMixin:
    """ MediaListMixin SQLAlchemy model for: <SeriesList>, <AnimeList>, <MoviesList>, <GamesList>, and <BooksList> """

    GROUP = None

    # Define fields for PyCharm
    user_id: int
    media_id: int
    status: str
    total: int
    rewatched: int
    score: int | None | str
    feeling: int | None | str
    current_season: int
    last_episode_watched: int
    comment: str
    media: db.Model
    query: db.Model
    completion_date: datetime
    Status: Status

    def update_status(self, new_status: str) -> int:
        """ Change the status of the TV media (overwritten for other media) for the current user and return the
        new total """

        self.status = new_status
        new_total = self.total

        if new_status == Status.COMPLETED:
            self.current_season = len(self.media.eps_per_season)
            self.last_episode_watched = self.media.eps_per_season[-1].episodes
            self.total = self.media.total_episodes
            new_total = self.media.total_episodes
            self.completion_date = datetime.today()
        elif new_status in (Status.RANDOM, Status.PLAN_TO_WATCH):
            self.current_season = 1
            self.last_episode_watched = 0
            self.total = 0
            new_total = 0

        #  Reset rewatched value
        self.rewatched = 0

        return new_total

    @classmethod
    def get_media_count_per_status(cls, user_id: int) -> Dict:
        """ Get the media count for each allowed status and its total count """

        media_count = (db.session.query(cls.status, func.count(cls.status))
                       .filter_by(user_id=user_id).group_by(cls.status).all())

        # Create dict to store status count with default values
        status_count = {status.value: {"count": 0, "percent": 0} for status in cls.Status}

        # Calculate total media count
        total_media = sum(count for _, count in media_count)

        # Determine if no data available
        no_data = total_media == 0

        # Update <status_count> dict with actual values from <media_count> query
        if media_count:
            media_dict = {status.value: {"count": count, "percent": safe_div(count, total_media, True)}
                          for status, count in media_count}
            status_count.update(media_dict)

        # Convert <status_count> dict to list of dict
        status_list = [{"status": key, **val} for key, val in status_count.items()]

        # Return formatted response
        return {"total_media": total_media, "no_data": no_data, "status_count": status_list}

    @classmethod
    def get_media_count_per_rating(cls, user: db.Model) -> List:
        """ Get the media count per rating (score or feeling) """

        # Determine rating (score or feeling) and corresponding range
        rating = cls.feeling if user.add_feeling else cls.score
        range_ = list(range(6)) if user.add_feeling else [i * 0.5 for i in range(21)]

        # Query to get media count per rating for given <user_id>
        # noinspection PyComparisonWithNone
        media_count = (db.session.query(rating, func.count(rating))
                       .filter(cls.user_id == user.id, rating != None)
                       .group_by(rating).order_by(asc(rating)).all())

        # Create dict to store metric count with default values
        metric_counts = {str(val): 0 for val in range_}

        # Update <metric_counts> dict with actual values from <media_count> query
        new_metric = {str(val): count for val, count in media_count}
        metric_counts.update(new_metric)

        return list(metric_counts.values())

    @classmethod
    def get_media_rating(cls, user: db.Model) -> Dict:
        """ Get media average score, percentage scored and qty of media scored """

        # Determine rating (feeling or score) based on user preferences
        rating = cls.feeling if user.add_feeling else cls.score

        # Query to calculate media rating for given user_id
        media_ratings = db.session.query(func.count(rating), func.count(cls.media_id), func.sum(rating))\
            .filter(cls.user_id == user.id).all()

        # Calculate percentage scored and mean metric value
        count_rating, count_media, sum_rating = media_ratings[0]
        percent_rating = safe_div(count_rating, count_media, percentage=True)
        mean_metric = safe_div(sum_rating, count_rating)

        # Prepare and return result as dict
        return {"media_metric": count_rating, "percent_metric": percent_rating, "mean_metric": mean_metric}

    @classmethod
    def get_specific_total(cls, user_id: int) -> int:
        """ Retrieve a specific aggregate value: either the total count of episodes for TV shows, the total watched
        count along with the number of rewatched movies for movies, or the total number of pages read for books.
        This behavior is overridden by the <GamesList> class, which doesn't possess an interesting specific aggregate
        value in its SQL table """

        # Query to calculate specific total for given user_id
        return db.session.query(func.sum(cls.total)).filter(cls.user_id == user_id).scalar() or 0

    @classmethod
    def get_favorites_media(cls, user_id: int, limit: int = 10) -> Dict:
        """ Get the user's favorites media """

        favorites_query = cls.query.filter_by(user_id=user_id, favorite=True).order_by(func.random()).all()

        favorites_list = [{
            "media_name": favorite.media.name,
            "media_id": favorite.media_id,
            "media_cover": favorite.media.media_cover
        } for favorite in favorites_query[:limit]]

        return {"favorites": favorites_list, "total_favorites": len(favorites_query)}

    @classmethod
    def get_available_sorting(cls, is_feeling: bool) -> Dict:
        release_date = "first_air_date"
        if cls.GROUP == MediaType.MOVIES:
            release_date = "release_date"

        media = ModelsFetcher.get_unique_model(cls.GROUP, ModelTypes.MEDIA)

        sorting_dict = {
            "Title A-Z": media.name.asc(),
            "Title Z-A": media.name.desc(),
            "Release Date +": desc(getattr(media, release_date)),
            "Release Date -": asc(getattr(media, release_date)),
            "Score TMDB +": media.vote_average.desc(),
            "Score TMDB -": media.vote_average.asc(),
            "Comments": cls.comment.desc(),
            "Rating +": cls.feeling.desc() if is_feeling else cls.score.desc(),
            "Rating -": cls.feeling.asc() if is_feeling else cls.score.asc(),
            "Re-watched": cls.rewatched.desc(),
        }

        return sorting_dict

    @classmethod
    def get_coming_next(cls) -> List[Dict]:
        """ Fetch the next coming media for the current user. For Series/Anime/Movies. Overridden by Games.
        Not possible for Books """

        media = ModelsFetcher.get_unique_model(cls.GROUP, ModelTypes.MEDIA)

        media_date = "release_date"
        if cls.GROUP in (MediaType.SERIES, MediaType.ANIME):
            media_date = "next_episode_to_air"

        next_media = (
            db.session.query(media).join(cls, media.id == cls.media_id)
            .filter(getattr(media, media_date) > datetime.utcnow(), cls.user_id == current_user.id,
                    cls.status.notin_([Status.DROPPED, Status.RANDOM]))
            .order_by(getattr(media, media_date).asc()).all()
        )

        data = [{
            "media_id": media.id,
            "media_name": media.name,
            "media_cover": media.media_cover,
            "season_to_air": media.season_to_air if cls.GROUP != MediaType.MOVIES else None,
            "episode_to_air": media.episode_to_air if cls.GROUP != MediaType.MOVIES else None,
            "formatted_date": change_air_format(getattr(media, media_date)),
        } for media in next_media]

        return data


class MediaLabelMixin:
    label: str
    media_id: int
    user_id: int

    @classmethod
    def get_user_labels(cls, user_id: int) -> List[str]:
        q_all = db.session.query(cls.label.distinct()).filter_by(user_id=user_id).order_by(cls.label).all()
        return [label[0] for label in q_all]

    @classmethod
    def get_user_media_labels(cls, user_id: int, media_id: int) -> Dict:
        all_labels = set(cls.get_user_labels(user_id))
        q_in = db.session.query(cls.label).filter_by(user_id=user_id, media_id=media_id).order_by(cls.label).all()
        already_in = {label[0] for label in q_in}
        available = all_labels - already_in
        return dict(already_in=list(already_in), available=list(available))

    @classmethod
    def get_total_and_labels_names(cls, user_id: int, limit_: int = 10) -> Dict:
        all_labels = cls.get_user_labels(user_id)
        return {"count": len(all_labels), "names": all_labels[:limit_]}


""" --- OTHER MODELS ---------------------------------------------------------------------------------------- """


class Ranks(db.Model):
    """ Ranks SQL model """

    GROUP = "Other"

    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50))

    @property
    def image(self) -> str:
        return url_for("static", filename=f"img/media_levels/{self.image_id}.png")

    @classmethod
    def update_db_ranks(cls):
        """ Update/add ranks to the DB using a CSV file """

        list_all_ranks = []
        path = Path(current_app.root_path, "static/csv_data/media_levels.csv")
        with open(path) as fp:
            for line in fp:
                list_all_ranks.append(line.split(","))

        # Empty CSV file: nothing to update
        if not list_all_ranks:
            return

        # If no ranks exist in DB: add all from CSV else update
        if cls.query.count() == 0:
            db.session.add_all([cls(level=int(rk[0]), image_id=rk[1], name=rk[2]) for rk in list_all_ranks[1:]])
        else:
            ranks = cls.query.order_by(cls.id).all()

            # -1 is removing header
            for i in range(min(len(ranks), len(list_all_ranks) - 1)):
                ranks[i].level = int(list_all_ranks[i + 1][0])
                ranks[i].image_id = list_all_ranks[i + 1][1]
                ranks[i].name = list_all_ranks[i + 1][2]

            # If more ranks in CSV than DB: add remaining ones
            if len(list_all_ranks) > len(ranks) + 1:
                db.session.add_all([
                    cls(
                        level=int(rk[0]),
                        image_id=rk[1],
                        name=rk[2]
                    ) for rk in list_all_ranks[len(ranks) + 1:]
                ])

        # Commit changes
        db.session.commit()


class Frames(db.Model):
    """ Frames SQL model """

    GROUP = "Other"

    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.Integer, nullable=False)
    image_id = db.Column(db.String(50), nullable=False)

    @classmethod
    def update_db_frames(cls):
        """ Update the DB profile frames using CSV file """

        list_all_frames = []
        path = Path(current_app.root_path, "static/csv_data/profile_borders.csv")
        with open(path) as fp:
            for line in fp:
                list_all_frames.append(line.split(";"))

        # Empty CSV file: nothing to update
        if not list_all_frames:
            return

        # If no frames exist in DB: add all from CSV else update
        if cls.query.count() == 0:
            db.session.add_all([cls(level=int(frame[0]), image_id=frame[1]) for frame in list_all_frames[1:]])
        else:
            frames = cls.query.order_by(cls.id).all()

            # -1 is for header
            for i in range(min(len(frames), len(list_all_frames) - 1)):
                frames[i].level = int(list_all_frames[i + 1][0])
                frames[i].image_id = list_all_frames[i + 1][1]

            # If more frames in CSV than DB: add remaining ones
            if len(list_all_frames) > len(frames) + 1:
                db.session.add_all([
                    cls(
                        level=int(frame[0]),
                        image_id=frame[1]
                    ) for frame in list_all_frames[len(frames) + 1:]
                ])

        db.session.commit()


class MyListsStats(db.Model):
    """ Model to get all global stats for MyLists """

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
        """ Get all the stats from the SQL model """

        all_stats = cls.query.order_by(cls.timestamp.desc()).first()

        mylists_data = {}
        for key, value in all_stats.__dict__.items():
            if key not in ("id", "timestamp", "_sa_instance_state"):
                if isinstance(value, str):
                    mylists_data[key] = json.loads(value)
                else:
                    mylists_data[key] = value

        return mylists_data


# Avoid circular imports
from backend.api.models.user_models import User, followers, UserLastUpdate
