from typing import Tuple, Dict
from sqlalchemy import func, text
from backend.api import db
from backend.api.models.user_models import User
from backend.api.utils.enums import MediaType, Status, ModelTypes
from backend.api.utils.functions import get_models_group


class GlobalStats:
    """ Calculate all the global stats for MyLists """

    LIMIT: int = 10

    def __init__(self):
        self.tv_media_type = [MediaType.SERIES, MediaType.ANIME]
        self.tmdb_media_type = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES]
        self.models = None

    def get_top_media(self) -> Dict:
        """ Get the top media in all the users list (Series, Anime, Movies, Games, and Books) """

        results = {}
        models = get_models_group("all", ModelTypes.LIST)
        for model_list in models.values():
            query = (
                db.session.query(model_list, func.count(model_list.media_id).label("count"))
                .filter(model_list.status != Status.DROPPED)
                .group_by(model_list.media_id).order_by(text("count desc"))
                .limit(self.LIMIT).all()
            )

            results[model_list.GROUP.value] = [{"info": media.media.name, "quantity": count} for media, count in query]

        return results

    def get_top_genres(self) -> Dict:
        """ Get the top genres in all the users list (Series, Anime, Movies, Games, and Books) """

        results = {}
        models = get_models_group("all", [ModelTypes.GENRE, ModelTypes.LIST])
        for media_type, mt in models.items():
            query = (
                db.session.query(mt[ModelTypes.GENRE].genre, func.count(mt[ModelTypes.GENRE].genre).label("count"))
                .join(mt[ModelTypes.LIST], mt[ModelTypes.GENRE].media_id == mt[ModelTypes.LIST].media_id)
                .filter(mt[ModelTypes.GENRE].genre != "Unknown")
                .group_by(mt[ModelTypes.GENRE].genre)
                .order_by(text("count desc"))
                .limit(self.LIMIT).all()
            )

            results[media_type.value] = [{"info": genre, "quantity": count} for genre, count in query]

        return results

    def get_top_actors(self) -> Dict:
        """ Get the top actors in all users list (for Series, Anime, Movies) """

        results = {}
        models = get_models_group(self.tmdb_media_type, [ModelTypes.ACTORS, ModelTypes.LIST])
        for media_type, mt in models.items():
            query = (
                db.session.query(mt[ModelTypes.ACTORS].name, func.count(mt[ModelTypes.ACTORS].name).label("count"))
                .join(mt[ModelTypes.LIST], mt[ModelTypes.ACTORS].media_id == mt[ModelTypes.LIST].media_id)
                .filter(mt[ModelTypes.ACTORS].name != "Unknown")
                .group_by(mt[ModelTypes.ACTORS].name)
                .order_by(text("count desc"))
                .limit(self.LIMIT).all()
            )

            results[media_type.value] = [{"info": actor, "quantity": count} for actor, count in query]

        return results

    def get_top_dropped(self) -> Dict:
        """ Get the top dropped media in all users list (for Series and Anime) """

        results = {}
        models = get_models_group(self.tv_media_type, [ModelTypes.MEDIA, ModelTypes.LIST])
        for media_type, mt in models.items():
            query = (
                db.session.query(mt[ModelTypes.MEDIA].name,
                                 func.count(mt[ModelTypes.LIST].media_id == mt[ModelTypes.MEDIA].id).label("count"))
                .join(mt[ModelTypes.LIST], mt[ModelTypes.LIST].media_id == mt[ModelTypes.MEDIA].id)
                .filter(mt[ModelTypes.LIST].status == Status.DROPPED)
                .group_by(mt[ModelTypes.LIST].media_id)
                .order_by(text("count desc"))
                .limit(self.LIMIT).all()
            )

            results[media_type.value] = [{"info": dropped, "quantity": count} for dropped, count in query]

        return results

    def get_total_eps_seasons(self) -> Dict:
        """ Get the total episodes in all users list (Series and Anime) """

        results = {}
        models = get_models_group(self.tv_media_type, ModelTypes.LIST)
        for model in models:
            query = db.session.query(func.sum(model.current_season), func.sum(model.total)).all()
            results[model.GROUP.value] = [{"seasons": seas, "episodes": ep} for seas, ep in query]

        return results

    def get_top_directors(self) -> Dict:
        """ Get the top directors in all users list for Movies """

        media_m, list_m = get_models_group(MediaType.MOVIES, [ModelTypes.MEDIA, ModelTypes.LIST])
        query = (
            db.session.query(media_m.director_name, func.count(media_m.director_name).label("count"))
            .join(list_m, media_m.id == list_m.media_id)
            .group_by(media_m.director_name)
            .filter(media_m.director_name != "Unknown")
            .order_by(text("count desc"))
            .limit(self.LIMIT).all()
        )

        return {media_m.GROUP.value: [{"info": director, "quantity": count} for director, count in query]}

    def get_top_developers(self) -> Dict:
        """ Get the top developers in all users list for Games """

        comp_m, list_m = get_models_group(MediaType.GAMES, [ModelTypes.COMPANIES, ModelTypes.LIST])
        query = (
            db.session.query(comp_m.name, func.count(comp_m.name).label("count"))
            .join(list_m, comp_m.media_id == list_m.media_id)
            .filter(comp_m.name != "Unknown", comp_m.developer == True)
            .group_by(comp_m.name)
            .order_by(text("count desc"))
            .limit(self.LIMIT).all()
        )

        return {list_m.GROUP.value: [{"info": dev, "quantity": count} for dev, count in query]}

    def get_top_authors(self) -> Dict:
        """ Get the top authors for Books in all users list """

        author_m, list_m = get_models_group(MediaType.BOOKS, [ModelTypes.AUTHORS, ModelTypes.LIST])
        query = (
            db.session.query(author_m.name, func.count(author_m.name).label("count"))
            .join(list_m, author_m.media_id == list_m.media_id)
            .filter(author_m.name != "Unknown")
            .group_by(author_m.name)
            .order_by(text("count desc"))
            .limit(self.LIMIT).all()
        )

        return {list_m.GROUP.value: [{"info": author, "quantity": count} for author, count in query]}

    @staticmethod
    def get_total_time_spent() -> Dict:
        """ Get the total time spent [minutes] by all the users for all the media and return a dict """

        query = (
            db.session.query(func.sum(User.time_spent_series), func.sum(User.time_spent_anime),
                             func.sum(User.time_spent_movies), func.sum(User.time_spent_books),
                             func.sum(User.time_spent_games))
            .filter(User.id != 1, User.active == True).first()
        )

        total_time_spent = [0 if not total else total for total in query]

        results = dict(
            total=sum(total_time_spent),
            series=total_time_spent[0] // 60,
            anime=total_time_spent[1] // 60,
            movies=total_time_spent[2] // 60,
            books=total_time_spent[3] // 60,
            games=total_time_spent[4] // 60,
        )

        return results

    @staticmethod
    def get_nb_media_and_users() -> Tuple[int, Dict[str, int]]:
        """ Get total number of media and users in MyLists """

        nb_users = (db.session.execute(db.select(func.count(User.id)).filter(User.id != 1, User.active == True))
                    .scalar_one())

        nb_media = {}
        models = get_models_group("all", ModelTypes.MEDIA)
        for model in models.values():
            nb_media[model.GROUP.value] = db.session.execute(db.select(func.count(model.id))).scalar_one()

        return nb_users, nb_media

    @staticmethod
    def get_total_movies() -> Dict:
        """ Get total movies in all users list """
        model = get_models_group(MediaType.MOVIES, ModelTypes.MEDIA)
        return {model.GROUP.value: db.session.query(model).count() or 0}

    @staticmethod
    def get_total_book_pages() -> Dict:
        """ Get total books pages in all users list """

        model = get_models_group(MediaType.BOOKS, ModelTypes.LIST)
        return db.session.query(func.sum(model.actual_page)).first()[0] or 0
