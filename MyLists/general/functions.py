"""
Functions and classes used in the General routes
"""

import datetime
from typing import Tuple, Dict, List
import numpy as np
import pandas as pd
import pytz
from flask import url_for
from pandas import Series
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder
from MyLists import db
from MyLists.models import Movies, MoviesGenre
from MyLists.utils import latin_alphabet, change_air_format


def display_time(minutes: int) -> str:
    """ Better display time in MyLists stat page """

    # Create datetime object for minutes
    dt = datetime.datetime.fromtimestamp(minutes * 60, pytz.UTC)

    # Extract years, months, days, and hours
    years = dt.year - 1970
    months = dt.month - 1
    days = dt.day - 1
    hours = dt.hour

    return f"{years} years, {months} months, {days} days, {hours} hours"


class TrendingData:
    """ Trending data class. Done in real time. """

    movie_tmdb_link = "https://www.themoviedb.org/movie"
    tmdb_cover_path = "http://image.tmdb.org/t/p/w300"
    tv_tmdb_link = "https://www.themoviedb.org/tv"

    def __init__(self, trending_data: Dict):
        self.trending_data = trending_data
        self.media_data = None
        self.result = None

    def _get_media_cover(self) -> str:
        """ Internal function to get media cover """

        # Get default cover
        media_cover = url_for("static", filename="covers/series_covers/default.jpg")

        poster_path = self.result.get('poster_path') or None
        if poster_path:
            media_cover = f"{self.tmdb_cover_path}{poster_path}"

        return media_cover

    def format_trending_series(self) -> List[Dict]:
        """ Format trending Series obtained from TMDB API """

        series_results = []
        for i, self.result in enumerate(self.trending_data["results"]):
            self.media_data = {"overview": self.result.get("overview", "Unknown") or "Unknown",
                               "release_date": self.result.get("first_air_date", "Unknown") or "Unknown",
                               "display_name": self.result.get("name", "Unknown") or "Unknown",
                               "api_id": self.result.get("id")}

            if latin_alphabet(self.result.get("original_name")):
                self.media_data["display_name"] = self.result.get('original_name')

            # Change the <first_air_date> format
            if self.media_data['release_date'] != 'Unknown':
                self.media_data['release_date'] = change_air_format(self.result.get("first_air_date"))

            self.media_data['poster_path'] = self._get_media_cover()
            self.media_data['tmdb_link'] = f"{self.tv_tmdb_link}/{self.result.get('id')}"
            self.media_data['media_type'] = "series"
            self.media_data['media'] = "Series"

            series_results.append(self.media_data)

            if i == 11:
                break

        return series_results

    def format_trending_movies(self) -> List[Dict]:
        """ Format trending Movies obtained from TMDB API """

        movies_results = []
        for i, self.result in enumerate(self.trending_data["results"]):
            self.media_data = {'overview': self.result.get('overview', 'Unknown') or 'Unknown',
                               'display_name': self.result.get('title', 'Unknown') or 'Unknown',
                               'release_date': self.result.get('release_date', 'Unknown') or 'Unknown',
                               'api_id': self.result.get('id')}

            if latin_alphabet(self.result.get('original_title')):
                self.media_data["display_name"] = self.result.get('original_title')

            # Change the <release_date> format
            if self.media_data["release_date"] != 'Unknown':
                self.media_data['release_date'] = change_air_format(self.result.get("release_date"))

            self.media_data['poster_path'] = self._get_media_cover()
            self.media_data['tmdb_link'] = f"{self.movie_tmdb_link}/{self.result.get('id')}"
            self.media_data['media_type'] = 'movies'
            self.media_data['media'] = 'Movies'

            movies_results.append(self.media_data)

            if i == 11:
                break

        return movies_results


""" --- ML TEST --------------------------------------------------------------------------------------------- """


def create_cosine_similarity() -> Tuple[np.ndarray, Series]:
    """ Create cosine similarity matrix based on synopsis """

    # Get dataframe using statement from SQL
    movies_df = pd.read_sql(db.session.query(Movies.id, Movies.synopsis, Movies.director_name).statement, db.engine)
    movies_genres_df = pd.read_sql(MoviesGenre.query.statement, db.engine)

    # Featurizers
    one_hot = OneHotEncoder()
    tfidf = TfidfVectorizer(strip_accents="unicode", lowercase=True, stop_words="english", max_features=200)

    # MoviesGenre pre-processing
    transformed_genres = one_hot.fit_transform(movies_genres_df["genre"].to_numpy().reshape(-1, 1))
    transformed_genres = pd.DataFrame(transformed_genres.toarray()).add_prefix("genre_")
    movies_genres_df = pd.concat([movies_genres_df, transformed_genres], axis=1)
    movies_genres_df = movies_genres_df.groupby(["media_id"])\
        .agg({f"genre_{i}": "sum" for i in range(0, len(transformed_genres.columns))})

    # Movies synopsis pre-processing
    tfidf_matrix = pd.DataFrame(tfidf.fit_transform(movies_df["synopsis"]).toarray())
    tfidf_matrix = tfidf_matrix.add_prefix("tfidf_")

    # Concatenate all data
    movies_genres_df = movies_genres_df.reset_index(drop=True)
    tfidf_matrix = tfidf_matrix.reset_index(drop=True)
    mega_concat = pd.concat([tfidf_matrix, movies_genres_df], axis=1)

    # Construct cosine similarity matrix
    cosine_sim = cosine_similarity(mega_concat, mega_concat)

    # Get indices in Series
    idx_series = pd.Series(movies_df.index, index=movies_df["id"])

    return cosine_sim, idx_series


def get_similar(title: str, cosine_sim: np.ndarray, indices_series: Series):
    """ Get movies recommendation given a title """

    # Get movie matching title
    movie = Movies.query.filter(Movies.name.ilike("%" + title + "%")).first()
    if movie is None:
        movie = Movies.query.filter(Movies.original_name.ilike("%" + title + "%")).first()

    if movie is None:
        return [], None

    # Get movie index that matches title
    idx = indices_series[movie.id]

    # Get pairwise similarity scores of all movies with that movie
    sim_scores = list(enumerate(cosine_sim[idx]))

    # Sort movies based on similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # Get scores of 10 most similar movies
    sim_scores = sim_scores[1:11]

    # Get movie indices from DataFrame
    df_indices = [i[0] for i in sim_scores]

    # Get corresponding movie ID
    movies_indices = indices_series[indices_series.isin(df_indices)].index

    # Get top 10 movies alike
    top_10_movies = Movies.query.filter(Movies.id.in_(movies_indices)).all()

    for i, mov in enumerate(top_10_movies):
        mov.cos_sim = sim_scores[i][1]

    return top_10_movies, movie