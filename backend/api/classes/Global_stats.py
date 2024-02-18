from typing import Tuple, Dict
from sqlalchemy import func, text
from backend.api import db
from backend.api.models.books_models import Books, BooksList, BooksGenre, BooksAuthors
from backend.api.models.games_models import Games, GamesList, GamesGenre, GamesCompanies
from backend.api.models.movies_models import Movies, MoviesActors, MoviesGenre, MoviesList
from backend.api.models.tv_models import (Series, Anime, SeriesList, SeriesGenre, AnimeList, AnimeGenre, AnimeActors,
                                          SeriesActors, SeriesEpisodesPerSeason, AnimeEpisodesPerSeason)
from backend.api.models.user_models import User
from backend.api.utils.enums import MediaType, RoleType, Status


class GlobalStats:
    """ Get all the global stats for MyLists """

    def __init__(self):
        self.all_list_type = MediaType
        self.tv_list_type = [MediaType.SERIES, MediaType.ANIME]
        self.tmdb_list_type = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES]

        self.media = None
        self.media_genre = None
        self.media_actors = None
        self.media_eps = None
        self.media_list = None
        self.media_authors = None
        self.media_comp = None

    @staticmethod
    def get_nb_media_and_users() -> Tuple[int, Dict]:
        """ Get total number of media and users in MyLists """

        # Queries
        nb_users = User.query.filter(User.role != RoleType.ADMIN, User.active == True).count()

        nb_media = {
            "series": Series.query.count(),
            "anime": Anime.query.count(),
            "movies": Movies.query.count(),
            "books": Books.query.count(),
            "games": Games.query.count()
        }

        return nb_users, nb_media

    def get_query_data(self, media_type: MediaType):
        """ Form a first part of the query depending on the <list_type> """

        if media_type == MediaType.SERIES:
            self.media = Series
            self.media_list = SeriesList
            self.media_genre = SeriesGenre
            self.media_actors = SeriesActors
            self.media_eps = SeriesEpisodesPerSeason

        if media_type == MediaType.ANIME:
            self.media = Anime
            self.media_list = AnimeList
            self.media_genre = AnimeGenre
            self.media_actors = AnimeActors
            self.media_eps = AnimeEpisodesPerSeason

        if media_type == MediaType.MOVIES:
            self.media = Movies
            self.media_list = MoviesList
            self.media_genre = MoviesGenre
            self.media_actors = MoviesActors

        if media_type == MediaType.BOOKS:
            self.media = Books
            self.media_list = BooksList
            self.media_genre = BooksGenre
            self.media_authors = BooksAuthors

        if media_type == MediaType.GAMES:
            self.media = Games
            self.media_list = GamesList
            self.media_genre = GamesGenre
            self.media_comp = GamesCompanies

    def get_top_media(self) -> Dict:
        """ Get the top media in all the users list (Series, Anime, Movies, Games, and Books) """

        results = {}
        for list_type in self.all_list_type:
            self.get_query_data(list_type)

            # Create query for each <list_type>
            query = (db.session.query(self.media_list, func.count(self.media_list.media_id).label("count"))
                     .filter(self.media_list.status != Status.DROPPED)
                     .group_by(self.media_list.media_id).order_by(text("count desc"))
                     .limit(5).all())

            # Append results
            results[list_type.value] = [{"info": m.media.name, "quantity": c} for m, c in query]

        return results

    def get_top_genres(self) -> Dict:
        """ Get the top genres in all the users list (Series, Anime, Movies, Games, and Books) """

        results = {}
        for list_type in self.all_list_type:
            self.get_query_data(list_type)

            # Create query for each <list_type>
            query = (db.session.query(self.media_genre.genre, func.count(self.media_genre.genre).label("count"))
                     .join(self.media_list, self.media_genre.media_id == self.media_list.media_id)
                     .filter(self.media_genre.genre != "Unknown")
                     .group_by(self.media_genre.genre)
                     .order_by(text("count desc")).limit(5).all())

            # Append results
            results[list_type.value] = [{"info": genre, "quantity": count} for genre, count in query]

        return results

    def get_top_actors(self) -> Dict:
        """ Get the top actors in all users list (for Series, Anime, Movies) """

        results = {}
        for list_type in self.tmdb_list_type:
            self.get_query_data(list_type)

            # Create query for each <list_type>
            query = (db.session.query(self.media_actors.name, func.count(self.media_actors.name).label("count"))
                     .join(self.media_list, self.media_actors.media_id == self.media_list.media_id)
                     .filter(self.media_actors.name != "Unknown")
                     .group_by(self.media_actors.name)
                     .order_by(text("count desc")).limit(5).all())

            # Append results
            results[list_type.value] = [{"info": actor, "quantity": count} for actor, count in query]

        return results

    def get_top_dropped(self) -> Dict:
        """ Get the top dropped media in all users list (for Series and Anime) """

        results = {}
        for list_type in self.tv_list_type:
            self.get_query_data(list_type)

            query = (db.session.query(self.media.name, func.count(self.media_list.media_id == self.media.id).label("count"))
                     .join(self.media_list, self.media_list.media_id == self.media.id)
                     .filter(self.media_list.status == Status.DROPPED)
                     .group_by(self.media_list.media_id)
                     .order_by(text("count desc")).limit(5).all())

            results[list_type.value] = [{"info": dropped, "quantity": count} for dropped, count in query]

        return results

    def get_total_eps_seasons(self) -> Dict:
        """ Get the total episodes in all users list (Series and Anime) """

        results = {}
        for list_type in self.tv_list_type:
            self.get_query_data(list_type)

            query = db.session.query(func.sum(self.media_list.current_season), func.sum(self.media_list.total)).all()

            results[list_type.value] = [{"seasons": season, "episodes": episode} for season, episode in query]

        return results

    def get_top_directors(self) -> Dict:
        """ Get the top directors in all users list for Movies """

        results = {}
        self.get_query_data(MediaType.MOVIES)

        query = db.session.query(self.media.director_name, func.count(self.media.director_name).label("count")) \
            .join(self.media_list, self.media.id == self.media_list.media_id) \
            .group_by(self.media.director_name).filter(self.media.director_name != "Unknown") \
            .order_by(text("count desc")).limit(5).all()

        results["movies"] = [{"info": director, "quantity": count} for director, count in query]

        return results

    def get_top_developers(self) -> Dict:
        """ Get the top developers in all users list for Games """

        results = {}
        self.get_query_data(MediaType.GAMES)

        query = (db.session.query(self.media_comp.name, func.count(self.media_comp.name).label("count"))
                 .join(self.media_list, self.media_comp.media_id == self.media_list.media_id)
                 .group_by(self.media_comp.name)
                 .filter(self.media_comp.name != "Unknown", self.media_comp.developer == True)
                 .order_by(text("count desc")).limit(5).all())

        results["games"] = [{"info": dev, "quantity": count} for dev, count in query]

        return results

    def get_top_authors(self) -> Dict:
        """ Get the top authors for Books in all users list """

        results = {}
        self.get_query_data(MediaType.BOOKS)

        # Create query for each <list_type>
        query = (db.session.query(self.media_authors.name, func.count(self.media_authors.name).label("count"))
                 .join(self.media_list, self.media_authors.media_id == self.media_list.media_id)
                 .group_by(self.media_authors.name).filter(self.media_authors.name != "Unknown")
                 .order_by(text("count desc")).limit(5).all())

        results["books"] = [{"info": author, "quantity": count} for author, count in query]

        return results

    def get_total_movies(self) -> Dict:
        """ Get total movies in all users list """

        self.get_query_data(MediaType.MOVIES)
        return {"movies": db.session.query(self.media).count() or 0}

    def get_total_book_pages(self) -> Dict:
        """ Get total books pages in all users list """

        self.get_query_data(MediaType.BOOKS)
        return db.session.query(func.sum(self.media_list.actual_page)).first()[0] or 0
