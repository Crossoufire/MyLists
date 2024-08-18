from typing import Dict, List, Type
from sqlalchemy import asc, func, or_
from sqlalchemy.orm import aliased
from backend.api import db
from backend.api.utils.functions import safe_div


class MediaListMixin:
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


class SearchableMixin:
    @classmethod
    def search(cls, query, search_term: str):
        search_columns = getattr(cls, "__searchable__", [])
        relationship_fields = getattr(cls, "__searchable_rs__", {})

        filters = []

        for column in search_columns:
            filters.append(getattr(cls, column).ilike(f"%{search_term}%"))

        for relationship, config in relationship_fields.items():
            related_model = SearchableMixin.get_model_from_str(config["model"])
            related_fields = config["fields"]

            related_alias = aliased(related_model)
            for field in related_fields:
                filters.append(getattr(related_alias, field).ilike(f'%{search_term}%'))

            query = query.join(related_alias, getattr(cls, relationship))

        return query.filter(or_(*filters))

    @staticmethod
    def get_model_from_str(model_reference: Type[db.Model] | str) -> Type[db.Model]:
        if isinstance(model_reference, str):
            return db.Model._sa_registry._class_registry.get(model_reference)
        return model_reference
