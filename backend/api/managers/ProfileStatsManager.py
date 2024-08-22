from __future__ import annotations
from typing import List, Dict
from sqlalchemy import func
from backend.api import db
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.managers.StatsManager import StatsMeta
from backend.api.models.users import User
from backend.api.utils.enums import MediaType, ModelTypes, Status
from backend.api.utils.functions import compute_level, safe_div


class ProfileStatsManager(metaclass=StatsMeta):
    GROUP: MediaType = None

    def __init__(self, user: User):
        self.user = user
        self.media_stats = {}
        self._initialize_models()
        self.media_setting = self.user.get_media_setting(self.GROUP)

    def _initialize_models(self):
        self.media_models = ModelsManager.get_dict_models(self.GROUP, "all")

        self.media = self.media_models[ModelTypes.MEDIA]
        self.media_list = self.media_models[ModelTypes.LIST]
        self.media_genre = self.media_models[ModelTypes.GENRE]
        self.media_label = self.media_models[ModelTypes.LABELS]

    @classmethod
    def get_subclass(cls, media_type: MediaType):
        return cls.subclasses.get(media_type, cls)

    @staticmethod
    def compute_global_stats(media_stats: List[Dict]) -> Dict:
        """ Compute the user's global stats for the profile page """

        total_media = sum([stats["rating"]["total_media"] for stats in media_stats]) or 0
        total_rated = sum([stats["rating"]["total_rated"] for stats in media_stats]) or 0
        percent_rated = safe_div(total_rated, total_media, percentage=True)

        rating_sum = 0
        count_per_rating = [0] * 21
        for stats in media_stats:
            for index, count in enumerate(stats["rating_count"]):
                rating_sum += count * (index * 0.5)
                count_per_rating[index] += count
        avg_rating = safe_div(rating_sum, total_rated)

        global_stats = dict(
            total_time_spent=sum([stats["time_spent"] for stats in media_stats]),
            time_per_media=[(stats["time_spent"], stats["media_type"]) for stats in media_stats],
            total_media=total_media,
            total_rated=total_rated,
            percent_rated=percent_rated,
            avg_rating=avg_rating,
            count_per_rating=count_per_rating,
        )

        return global_stats

    def compute_media_stats(self) -> Dict:
        self.media_stats = dict(
            media_type=self.GROUP,
            level=compute_level(self.media_setting.time_spent),
            time_spent=self.media_setting.time_spent,
            specific_total=self.get_specific_total(),
            rating_count=self.get_media_count_per_rating(),
            labels=self.get_all_user_labels(),
            status_count=self.get_media_count_per_status(),
            favorites=self.get_favorites_media(limit=10),
            rating=self.get_media_rating(),
        )

        return self.media_stats

    def get_specific_total(self) -> int:
        """ Compute a specific aggregate value: either the total count of episodes for TV shows, the total watched
        count along with the number of rewatched movies for movies, or the total number of pages read for books.
        This behavior is overridden by the <GamesList> class, which doesn't possess an interesting specific aggregate
        value in its SQL table """
        raise NotImplementedError("Subclasses must implement this method.")

    def get_media_count_per_status(self) -> Dict:
        media_count = (
            db.session.query(self.media_list.status, func.count(self.media_list.status))
            .filter_by(user_id=self.user.id).group_by(self.media_list.status)
            .all()
        )

        status_count = {status.value: {"count": 0, "percent": 0} for status in Status.by(self.GROUP)}
        del status_count["All"]
        total_media = sum(count for _, count in media_count)
        no_data = (total_media == 0)

        # Update <status_count> dict with actual values from <media_count> query
        if media_count:
            media_dict = {
                status.value: {"count": count, "percent": safe_div(count, total_media, True)}
                for status, count in media_count
            }
            status_count.update(media_dict)

        status_list = [{"status": key, **val} for key, val in status_count.items()]

        return {"total_media": total_media, "no_data": no_data, "status_count": status_list}

    def get_media_count_per_rating(self) -> List[int]:
        media_count = (
            db.session.query(self.media_list.rating, func.count(self.media_list.rating))
            .filter(self.media_list.user_id == self.user.id, self.media_list.rating.is_not(None))
            .group_by(self.media_list.rating).order_by(self.media_list.rating)
            .all()
        )

        # Rating is from 0 to 10 by step of 0.5 so 21 values (feeling is 0, 2, 4, 6, 8, 10)
        result = [0] * 21
        for rating, count in media_count:
            result[int(rating * 2)] = count

        return result

    def get_media_rating(self) -> Dict:
        """ Get media average rating, percentage rated and qty of media rated """

        media_rating = (
            self.media_list.query.with_entities(
                func.count(self.media_list.rating).label("count_rating"),
                func.count(self.media_list.id).label("count_media"),
                func.sum(self.media_list.rating).label("sum_rating"),
            ).filter_by(user_id=self.user.id)
            .first()
        )

        percent_rating = safe_div(media_rating.count_rating, media_rating.count_media, percentage=True)
        mean_rating = safe_div(media_rating.sum_rating, media_rating.count_rating)

        data = dict(
            total_rated=media_rating.count_rating,
            percent_rating=percent_rating,
            mean_rating=mean_rating,
            total_media=media_rating.count_media,
        )

        return data

    def get_favorites_media(self, limit: int = 10) -> Dict:
        favorites_query = (
            self.media_list.query.filter_by(user_id=self.user.id, favorite=True)
            .order_by(func.random()).all()
        )

        favorites_list = [dict(
            media_id=favorite.media_id,
            media_name=favorite.media.name,
            media_cover=favorite.media.media_cover
        ) for favorite in favorites_query[:limit]]

        return {"favorites": favorites_list, "total_favorites": len(favorites_query)}

    def get_all_user_labels(self) -> List[str]:
        return self.media_label.get_user_labels(self.user.id)


class SeriesProfileStats(ProfileStatsManager):
    GROUP = MediaType.SERIES

    def __init__(self, user: User):
        super().__init__(user)

    def get_specific_total(self) -> int:
        return (
            db.session.query(func.sum(self.media_list.total))
            .filter(self.media_list.user_id == self.user.id).scalar()
        ) or 0


class AnimeProfileStats(ProfileStatsManager):
    GROUP = MediaType.ANIME

    def __init__(self, user: User):
        super().__init__(user)

    def get_specific_total(self) -> int:
        return (
            db.session.query(func.sum(self.media_list.total))
            .filter(self.media_list.user_id == self.user.id).scalar()
        ) or 0


class MoviesProfileStats(ProfileStatsManager):
    GROUP = MediaType.MOVIES

    def __init__(self, user: User):
        super().__init__(user)

    def get_specific_total(self) -> int:
        return (
            db.session.query(func.sum(self.media_list.total))
            .filter(self.media_list.user_id == self.user.id).scalar()
        ) or 0


class BooksProfileStats(ProfileStatsManager):
    GROUP = MediaType.BOOKS

    def __init__(self, user: User):
        super().__init__(user)

    def get_specific_total(self) -> int:
        return (
            db.session.query(func.sum(self.media_list.total))
            .filter(self.media_list.user_id == self.user.id).scalar()
        ) or 0


class GamesProfileStats(ProfileStatsManager):
    GROUP = MediaType.GAMES

    def __init__(self, user: User):
        super().__init__(user)

    def get_specific_total(self) -> int:
        return 0
