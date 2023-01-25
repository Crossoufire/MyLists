"""
Scheduled tasks functions and classes
"""

import json
import logging
import os
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import List, Tuple, Dict, Iterable
import dotenv
import requests
from sqlalchemy import and_, desc, func, text, null
from MyLists import app, db
from MyLists.API_data import ApiData, ApiMovies, ApiTV
from MyLists.models import Series, SeriesList, SeriesActors, SeriesGenre, SeriesNetwork, SeriesEpisodesPerSeason, \
    UserLastUpdate, Notifications, Status, Movies, MoviesList, MoviesActors, MoviesGenre, MyListsStats, Games, \
    GamesList, GamesGenre, GamesPlatforms, GamesCompanies, Books, BooksList, BooksGenre, BooksAuthors, Anime, \
    AnimeList, AnimeActors, AnimeGenre, AnimeNetwork, AnimeEpisodesPerSeason, User, RoleType
from MyLists.utils import get_models_type, MediaType


def remove_non_list_media():
    """ Remove all medianot present in a User list from DB and HDD """

    app.logger.info("###################################################################")
    app.logger.info("[SYSTEM] - Starting automatic media remover")

    # Series remover
    series = db.session.query(Series, SeriesList).outerjoin(SeriesList, SeriesList.media_id == Series.id).all()
    to_delete, count = [], 0
    for media in series:
        if not media[1]:
            to_delete.append(media[0].id)
    for del_id in to_delete:
        Series.query.filter_by(id=del_id).delete()
        SeriesActors.query.filter_by(media_id=del_id).delete()
        SeriesGenre.query.filter_by(media_id=del_id).delete()
        SeriesNetwork.query.filter_by(media_id=del_id).delete()
        SeriesEpisodesPerSeason.query.filter_by(media_id=del_id).delete()
        UserLastUpdate.query.filter_by(media_type=MediaType.SERIES, media_id=del_id).delete()
        Notifications.query.filter_by(media_type="serieslist", media_id=del_id).delete()
        count += 1
        app.logger.info(f"Removed series with ID: [{del_id}]")
    app.logger.info(f"Total series removed: {count}")

    # Anime remover
    anime = db.session.query(Anime, AnimeList).outerjoin(AnimeList, AnimeList.media_id == Anime.id).all()
    to_delete, count = [], 0
    for media in anime:
        if not media[1]:
            to_delete.append(media[0].id)
    for del_id in to_delete:
        Anime.query.filter_by(id=del_id).delete()
        AnimeActors.query.filter_by(media_id=del_id).delete()
        AnimeGenre.query.filter_by(media_id=del_id).delete()
        AnimeNetwork.query.filter_by(media_id=del_id).delete()
        AnimeEpisodesPerSeason.query.filter_by(media_id=del_id).delete()
        UserLastUpdate.query.filter_by(media_type=MediaType.ANIME, media_id=del_id).delete()
        Notifications.query.filter_by(media_type='animelist', media_id=del_id).delete()
        count += 1
        app.logger.info(f"Removed anime with ID: [{del_id}]")
    app.logger.info(f"Total anime removed: {count}")

    # Movies remover
    movies = db.session.query(Movies, MoviesList).outerjoin(MoviesList, MoviesList.media_id == Movies.id).all()
    to_delete, count = [], 0
    for media in movies:
        if not media[1]:
            to_delete.append(media[0].id)
    for del_id in to_delete:
        Movies.query.filter_by(id=del_id).delete()
        MoviesActors.query.filter_by(media_id=del_id).delete()
        MoviesGenre.query.filter_by(media_id=del_id).delete()
        UserLastUpdate.query.filter_by(media_type=MediaType.MOVIES, media_id=del_id).delete()
        Notifications.query.filter_by(media_type='movieslist', media_id=del_id).delete()
        count += 1
        app.logger.info(f"Removed movie with ID: [{del_id}]")
    app.logger.info(f"Total movies removed: {count}")

    # Books remover
    books = db.session.query(Books, BooksList).outerjoin(BooksList, BooksList.media_id == Books.id).all()
    to_delete, count = [], 0
    for media in books:
        if not media[1]:
            to_delete.append(media[0].id)
    for del_id in to_delete:
        Books.query.filter_by(id=del_id).delete()
        BooksAuthors.query.filter_by(media_id=del_id).delete()
        BooksGenre.query.filter_by(media_id=del_id).delete()
        UserLastUpdate.query.filter_by(media_type=MediaType.BOOKS, media_id=del_id).delete()
        Notifications.query.filter_by(media_type="bookslist", media_id=del_id).delete()
        count += 1
        app.logger.info(f"Removed book with ID: [{del_id}]")
    app.logger.info(f"Total books removed: {count}")

    # Games remover
    games = db.session.query(Games, GamesList).outerjoin(GamesList, GamesList.media_id == Games.id).all()
    to_delete, count = [], 0
    for media in games:
        if not media[1]:
            to_delete.append(media[0].id)
    for del_id in to_delete:
        Games.query.filter_by(id=del_id).delete()
        GamesPlatforms.query.filter_by(media_id=del_id).delete()
        GamesCompanies.query.filter_by(media_id=del_id).delete()
        GamesGenre.query.filter_by(media_id=del_id).delete()
        UserLastUpdate.query.filter_by(media_type=MediaType.GAMES, media_id=del_id).delete()
        Notifications.query.filter_by(media_type="gameslist", media_id=del_id).delete()
        count += 1
        app.logger.info(f"Removed game with ID: [{del_id}]")
    app.logger.info(f"Total games removed: {count}")

    db.session.commit()
    app.logger.info("[SYSTEM] - Finished Automatic media remover")
    app.logger.info("###################################################################")


def remove_old_covers():
    """ Remove old covers on HDD if not present in DB """

    app.logger.info("###################################################################")
    app.logger.info("[SYSTEM] - Starting automatic covers remover")

    # --- Series old cover remover ----------------
    series = Series.query.all()
    path_series_covers = Path(app.root_path, "static/covers/series_covers/")

    images_in_db = []
    for media in series:
        images_in_db.append(media.image_cover)

    images_saved = []
    for file in os.listdir(path_series_covers):
        images_saved.append(file)

    count = 0
    for image in images_saved:
        if image not in images_in_db and image != "default.jpg":
            os.remove(f"{path_series_covers}/{image}")
            app.logger.info(f"Removed old series cover with name: {image}")
            count += 1
    app.logger.info(f"Total old series covers deleted: {count}")

    # --- Anime old cover remover ----------------
    anime = Anime.query.all()
    path_anime_covers = Path(app.root_path, "static/covers/anime_covers/")

    images_in_db = []
    for media in anime:
        images_in_db.append(media.image_cover)

    images_saved = []
    for file in os.listdir(path_anime_covers):
        images_saved.append(file)

    count = 0
    for image in images_saved:
        print(image)
        if image not in images_in_db and image != 'default.jpg':
            os.remove(f'{path_anime_covers}/{image}')
            app.logger.info('Removed old anime cover with name: {}'.format(image))
            count += 1
    app.logger.info(f'Total old anime covers deleted: {count}')

    # --- Movies old cover remover ----------------
    movies = Movies.query.all()
    path_movies_covers = Path(app.root_path, 'static/covers/movies_covers/')

    images_in_db = []
    for movie in movies:
        images_in_db.append(movie.image_cover)

    images_saved = []
    for file in os.listdir(path_movies_covers):
        images_saved.append(file)

    count = 0
    for image in images_saved:
        if image not in images_in_db and image != 'default.jpg':
            os.remove(f'{path_movies_covers}/{image}')
            app.logger.info('Removed old movie cover with name: {}'.format(image))
            count += 1
    app.logger.info(f'Total old movies covers deleted: {count}')

    # --- Books old cover remover ----------------
    books = Books.query.all()
    path_books_covers = Path(app.root_path, "static/covers/books_covers/")

    images_in_db = []
    for book in books:
        images_in_db.append(book.image_cover)

    images_saved = []
    for file in os.listdir(path_books_covers):
        images_saved.append(file)

    count = 0
    for image in images_saved:
        if image not in images_in_db and image != "default.jpg":
            os.remove(f'{path_books_covers}/{image}')
            app.logger.info(f'Removed old book cover with name: {image}')
            count += 1
    app.logger.info(f'Total old books covers deleted: {count}')

    # --- Games old cover remover ----------------
    games = Games.query.all()
    path_games_covers = Path(app.root_path, 'static/covers/games_covers/')

    images_in_db = []
    for game in games:
        images_in_db.append(game.image_cover)

    images_saved = []
    for file in os.listdir(path_games_covers):
        images_saved.append(file)

    count = 0
    for image in images_saved:
        if image not in images_in_db and image != 'default.jpg':
            os.remove(f'{path_games_covers}/{image}')
            app.logger.info(f'Removed old game cover with name: {image}')
            count += 1
    app.logger.info(f'Total old game covers deleted: {count}')

    app.logger.info('[SYSTEM] - Finished automatic covers remover')
    app.logger.info('###################################################################')


def refresh_element_data(api_id: int, media_type: Enum):
    """ Refresh a media using appropriate API """

    ApiModel = ApiData.get_API_class(media_type)
    data = ApiModel(API_id=api_id).update_media_data()

    # Update main details for each media
    if media_type == MediaType.SERIES:
        Series.query.filter_by(api_id=api_id).update(data["media_data"])
    elif media_type == MediaType.ANIME:
        Anime.query.filter_by(api_id=api_id).update(data["media_data"])
    elif media_type == MediaType.MOVIES:
        Movies.query.filter_by(api_id=api_id).update(data["media_data"])
    elif media_type == MediaType.GAMES:
        Games.query.filter_by(api_id=api_id).update(data["media_data"])

    # Commit changes
    db.session.commit()

    # Check episodes/seasons
    if media_type in (MediaType.SERIES, MediaType.ANIME):
        if media_type == MediaType.SERIES:
            media = Series.query.filter_by(api_id=api_id).first()
            old_seas_eps = [n.episodes for n in SeriesEpisodesPerSeason.query.filter_by(media_id=media.id).all()]
        elif media_type == MediaType.ANIME:
            media = Anime.query.filter_by(api_id=api_id).first()
            old_seas_eps = [n.episodes for n in AnimeEpisodesPerSeason.query.filter_by(media_id=media.id).all()]
        else:
            return False

        new_seas_eps = [d['episodes'] for d in data['seasons_data']]

        if new_seas_eps != old_seas_eps:
            if media_type == MediaType.SERIES:
                users_list = SeriesList.query.filter_by(media_id=media.id).all()

                for user in users_list:
                    episodes_watched = user.total

                    count = 0
                    for i in range(0, len(data['seasons_data'])):
                        count += data['seasons_data'][i]['episodes']
                        if count == episodes_watched:
                            user.last_episode_watched = data['seasons_data'][i]['episodes']
                            user.current_season = data['seasons_data'][i]['season']
                            break
                        elif count > episodes_watched:
                            user.last_episode_watched = data['seasons_data'][i]['episodes']-(count-episodes_watched)
                            user.current_season = data['seasons_data'][i]['season']
                            break
                        elif count < episodes_watched:
                            try:
                                data['seasons_data'][i+1]['season']
                            except IndexError:
                                user.last_episode_watched = data['seasons_data'][i]['episodes']
                                user.current_season = data['seasons_data'][i]['season']
                                break

                SeriesEpisodesPerSeason.query.filter_by(media_id=media.id).delete()
                db.session.commit()

                for seas in data['seasons_data']:
                    season = SeriesEpisodesPerSeason(media_id=media.id, season=seas['season'],
                                                     episodes=seas['episodes'])
                    db.session.add(season)
                db.session.commit()
            elif media_type == MediaType.ANIME:
                users_list = AnimeList.query.filter_by(media_id=media.id).all()

                for user in users_list:
                    episodes_watched = user.total

                    count = 0
                    for i in range(0, len(data['seasons_data'])):
                        count += data['seasons_data'][i]['episodes']
                        if count == episodes_watched:
                            user.last_episode_watched = data['seasons_data'][i]['episodes']
                            user.current_season = data['seasons_data'][i]['season']
                            break
                        elif count > episodes_watched:
                            user.last_episode_watched = data['seasons_data'][i]['episodes']-(count-episodes_watched)
                            user.current_season = data['seasons_data'][i]['season']
                            break
                        elif count < episodes_watched:
                            try:
                                data['seasons_data'][i+1]['season']
                            except IndexError:
                                user.last_episode_watched = data['seasons_data'][i]['episodes']
                                user.current_season = data['seasons_data'][i]['season']
                                break

                AnimeEpisodesPerSeason.query.filter_by(media_id=media.id).delete()
                db.session.commit()

                for seas in data['seasons_data']:
                    season = AnimeEpisodesPerSeason(media_id=media.id, season=seas['season'], episodes=seas['episodes'])
                    db.session.add(season)
                db.session.commit()

    return True


def automatic_media_refresh():
    """ Automtically refresh media using appropriate API """

    app.logger.info("###################################################################")
    app.logger.info("[SYSTEM] - Starting automatic media refresh")

    # Fetch all data
    all_series_api_id = [m.api_id for m in Series.query.filter(Series.lock_status != True)]
    all_anime_api_id = [m.api_id for m in Anime.query.filter(Anime.lock_status != True)]
    all_movies_api_id = [m.api_id for m in Movies.query.filter(Movies.lock_status != True)]

    all_games = Games.query.all()
    all_games_api_id = []
    for game in all_games:
        try:
            if datetime.utcfromtimestamp(int(game.release_date)) > datetime.now():
                all_games_api_id.append(game.api_id)
        except:
            all_games_api_id.append(game.api_id)

    # Fetch from API all changed <TV_show> ID
    try:
        all_id_tv_changes = ApiTV().get_changed_data()
    except Exception as e:
        app.logger.error(f"[ERROR] - Requesting the changed data from TMDB API: {e}")
        return

    # Fetch from API all changed <Movies> ID
    try:
        all_id_movies_changes = ApiMovies().get_changed_data()
    except Exception as e:
        app.logger.error(f"[ERROR] - Requesting the changed data from (movies) TMDB API: {e}")
        return

    # Refresh Series
    for element in all_id_tv_changes['results']:
        if element['id'] in all_series_api_id:
            try:
                refresh_element_data(element['id'], MediaType.SERIES)
                app.logger.info(f'[INFO] - Refreshed Series with TMDB ID: [{element["id"]}]')
            except Exception as e:
                app.logger.info(f'[ERROR] - While refreshing series: {e} - ID = {element["id"]}')

    # Refresh Anime
    for element in all_id_tv_changes["results"]:
        if element["id"] in all_anime_api_id:
            try:
                refresh_element_data(element["id"], MediaType.ANIME)
                app.logger.info(f'[INFO] - Refreshed Anime with TMDB ID: [{element["id"]}]')
            except Exception as e:
                app.logger.info(f'[ERROR] - While refreshing anime: {e} - ID = {element["id"]}')

    # Refresh movies
    for element in all_id_movies_changes["results"]:
        if element["id"] in all_movies_api_id:
            try:
                refresh_element_data(element["id"], MediaType.MOVIES)
                app.logger.info(f"[INFO] - Refreshed Movie with TMDB ID: [{element['id']}]")
            except Exception as e:
                app.logger.info(f"'[ERROR] - While refreshing movies: {e} - ID = {element['id']}'")

    # Refresh games
    for api_id in all_games_api_id:
        try:
            refresh_element_data(api_id, MediaType.GAMES)
            app.logger.info(f"[INFO] - Refreshed Game with IGDB ID: [{api_id}]")
        except Exception as e:
            app.logger.info(f"[ERROR] - While refreshing games: {e} - ID = {api_id}")

    app.logger.info('[SYSTEM] - Automatic refresh completed')
    app.logger.info('###################################################################')


def new_releasing_series():
    """ Check for new releasing series (TMDB API) """

    app.logger.info("###################################################################")
    app.logger.info("[SYSTEM] - Start adding the new releasing series")

    all_series = Series.query.filter(Series.next_episode_to_air != null).all()
    media_id = []
    for series in all_series:
        try:
            diff = (datetime.utcnow() - datetime.strptime(series.next_episode_to_air, '%Y-%m-%d')).total_seconds()

            # Check if series next episode is releasing in one week or less
            if diff < 0 and abs(diff / (3600 * 24)) <= 7:
                media_id.append(series.id)
        except:
            pass

    series_in_ptw = db.session.query(Series, SeriesList) \
        .join(SeriesList, SeriesList.media_id == Series.id) \
        .filter(SeriesList.media_id.in_(media_id), and_(SeriesList.status != Status.RANDOM,
                                                        SeriesList.status != Status.DROPPED)).all()

    for info in series_in_ptw:
        series = Notifications.query.filter_by(user_id=info[1].user_id, media_type="serieslist", media_id=info[0].id) \
            .order_by(desc(Notifications.timestamp)).first()

        if series:
            payload_series = json.loads(series.payload_json)
            if int(payload_series['season']) < int(info[0].season_to_air):
                pass
            elif int(payload_series['season']) == int(info[0].season_to_air):
                if int(payload_series['episode']) < int(info[0].episode_to_air):
                    pass
                else:
                    continue
            else:
                continue

        release_date = datetime.strptime(info[0].next_episode_to_air, '%Y-%m-%d').strftime("%b %d %Y")
        payload = {'name': info[0].name,
                   'release_date': release_date,
                   'season': '{:02d}'.format(info[0].season_to_air),
                   'episode': '{:02d}'.format(info[0].episode_to_air)}

        data = Notifications(user_id=info[1].user_id,
                             media_type="serieslist",
                             media_id=info[0].id,
                             payload_json=json.dumps(payload))
        db.session.add(data)

    db.session.commit()
    app.logger.info("[SYSTEM] - Finish adding the new releasing series")
    app.logger.info("###################################################################")


def new_releasing_anime():
    """ Check for new anime release (TMDB API) """

    app.logger.info('###################################################################')
    app.logger.info('[SYSTEM] - Start adding the new releasing anime')

    all_anime = Anime.query.filter(Anime.next_episode_to_air != null).all()
    media_id = []
    for anime in all_anime:
        try:
            diff = (datetime.utcnow() - datetime.strptime(anime.next_episode_to_air, '%Y-%m-%d')).total_seconds()

            # Check if anime next episode is releasing in one week or less
            if diff < 0 and abs(diff / (3600 * 24)) <= 7:
                media_id.append(anime.id)
        except:
            pass

    anime_in_ptw = db.session.query(Anime, AnimeList).join(AnimeList, AnimeList.media_id == Anime.id) \
        .filter(AnimeList.media_id.in_(media_id), and_(AnimeList.status != Status.RANDOM,
                                                       AnimeList.status != Status.DROPPED)).all()

    for info in anime_in_ptw:
        anime = Notifications.query.filter_by(user_id=info[1].user_id, media_type='animelist', media_id=info[0].id) \
            .order_by(desc(Notifications.timestamp)).first()

        if anime:
            payload_anime = json.loads(anime.payload_json)
            if int(payload_anime['season']) < int(info[0].season_to_air):
                pass
            elif int(payload_anime['season']) == int(info[0].season_to_air):
                if int(payload_anime['episode']) < int(info[0].episode_to_air):
                    pass
                else:
                    continue
            else:
                continue

        release_date = datetime.strptime(info[0].next_episode_to_air, '%Y-%m-%d').strftime("%b %d %Y")
        payload = {'name': info[0].name,
                   'release_date': release_date,
                   'season': '{:02d}'.format(info[0].season_to_air),
                   'episode': '{:02d}'.format(info[0].episode_to_air)}

        data = Notifications(user_id=info[1].user_id, media_type='animelist', media_id=info[0].id,
                             payload_json=json.dumps(payload))
        db.session.add(data)

    db.session.commit()
    app.logger.info('[SYSTEM] - Finish adding the new releasing anime')
    app.logger.info('###################################################################')


def new_releasing_movies():
    """ Check for new movies release (TMDB API) """

    app.logger.info('###################################################################')
    app.logger.info('[SYSTEM] - Start adding the new releasing movies')

    all_movies = Movies.query.all()
    media_id = []
    for movie in all_movies:
        try:
            diff = (datetime.utcnow() - datetime.strptime(movie.release_date, '%Y-%m-%d')).total_seconds()

            # Check if movie released in one week or less
            if diff < 0 and abs(diff / (3600 * 24)) <= 7:
                media_id.append(movie.id)
        except:
            pass

    movies_in_ptw = db.session.query(Movies, MoviesList) \
        .join(MoviesList, MoviesList.media_id == Movies.id) \
        .filter(MoviesList.media_id.in_(media_id), MoviesList.status == Status.PLAN_TO_WATCH).all()

    for info in movies_in_ptw:
        if not bool(Notifications.query.filter_by(user_id=info[1].user_id, media_type='movieslist',
                                                  media_id=info[0].id).first()):
            release_date = datetime.strptime(info[0].release_date, '%Y-%m-%d').strftime("%b %d %Y")
            payload = {'name': info[0].name,
                       'release_date': release_date}

            data = Notifications(user_id=info[1].user_id,
                                 media_type='movieslist',
                                 media_id=info[0].id,
                                 payload_json=json.dumps(payload))
            db.session.add(data)

    db.session.commit()
    app.logger.info('[SYSTEM] - Finish adding the new releasing movies')
    app.logger.info('###################################################################')


def new_releasing_games():
    """ Check for new games release (IGDB API) """

    app.logger.info('###################################################################')
    app.logger.info('[SYSTEM] - Start adding the new releasing games')

    all_games = Games.query.all()
    media_id = []
    for game in all_games:
        try:
            diff = (datetime.utcnow() - datetime.utcfromtimestamp(int(game.release_date))).total_seconds()

            # Check if game release in one week or less
            if diff < 0 and abs(diff/(3600*24)) <= 7:
                media_id.append(game.id)
        except:
            pass

    games_in_ptp = db.session.query(Games, GamesList) \
        .join(GamesList, GamesList.media_id == Games.id) \
        .filter(GamesList.media_id.in_(media_id), GamesList.status == Status.PLAN_TO_PLAY).all()

    for info in games_in_ptp:
        if not bool(Notifications.query.filter_by(user_id=info[1].user_id, media_type='gameslist',
                                                  media_id=info[0].id).first()):
            release_date = datetime.utcfromtimestamp(int(info[0].release_date)).strftime("%b %d %Y")
            payload = {'name': info[0].name,
                       'release_date': release_date}

            data = Notifications(user_id=info[1].user_id, media_type='gameslist', media_id=info[0].id,
                                 payload_json=json.dumps(payload))
            db.session.add(data)

    db.session.commit()
    app.logger.info('[SYSTEM] - Finish adding the new releasing games')
    app.logger.info('###################################################################')


def automatic_movies_locking():
    """ Automatically lock movies that are old enough - about 5 months old """

    app.logger.info('###################################################################')
    app.logger.info('[SYSTEM] - Starting automatic movies locking')

    all_movies = Movies.query.filter(Movies.lock_status != True).all()
    count_locked = 0
    count_not_locked = 0

    # About 5 months
    now_date = (datetime.utcnow() - timedelta(minutes=225000))

    for movie in all_movies:
        try:
            release_date = datetime.strptime(movie.release_date, '%Y-%m-%d')
            if release_date < now_date and movie.image_cover != 'default.jpg':
                movie.lock_status = True
                count_locked += 1
            else:
                movie.lock_status = False
                count_not_locked += 1
        except:
            movie.lock_status = False
            count_not_locked += 1

    db.session.commit()
    app.logger.info('Number of movies locked: {}'.format(count_locked))
    app.logger.info('Number of movies not locked: {}'.format(count_not_locked))
    app.logger.info('[SYSTEM] - Finished automatic movies locking')
    app.logger.info('###################################################################')


def update_IGDB_API():
    """ Update the IGDB token """

    app.logger.info('###################################################################')
    app.logger.info('[SYSTEM] - Recovering new IGDB API key')

    try:
        r = requests.post(f"https://id.twitch.tv/oauth2/token?client_id={app.config['CLIENT_IGDB']}&"
                          f"client_secret={app.config['SECRET_IGDB']}&grant_type=client_credentials")
        response = json.loads(r.text)

        # Fetch new IGDB API KEY/TOKEN
        new_IGDB_token = response['access_token']

        # Get <.env> file and load it
        dotenv_file = dotenv.find_dotenv()
        dotenv.load_dotenv(dotenv_file)

        # Set new IGDB API KEY to environment
        os.environ['IGDB_API_KEY'] = f'{new_IGDB_token}'

        # Set new IGDB API KEY to app config
        app.config['IGDB_API_KEY'] = f'{new_IGDB_token}'

        # Write new IGDB API KEY to <.env> file
        dotenv.set_key(dotenv_file, "IGDB_API_KEY", f"{new_IGDB_token}")
    except Exception as e:
        app.logger.error(f"[ERROR] - While updating the IGDB API key: {e}")

    app.logger.info('[SYSTEM] - Finished getting new IGDB API key')
    app.logger.info('###################################################################')


def update_Mylists_stats():
    """ Update the MyLists global stats automatically """

    # Get global stats
    stats = GlobalStats()

    def create_dict(data: List) -> Dict:
        """ Create dictionary from list """

        series_list, anime_list, movies_list, books_list, games_list = [], [], [], [], []
        for i in range(5):
            try:
                series_list.append({"info": data[0][i][0], "quantity": data[0][i][2]})
            except:
                series_list.append({"info": "-", "quantity": "-"})
            try:
                anime_list.append({"info": data[1][i][0], "quantity": data[1][i][2]})
            except:
                anime_list.append({"info": "-", "quantity": "-"})
            try:
                movies_list.append({"info": data[2][i][0], "quantity": data[2][i][2]})
            except:
                movies_list.append({"info": "-", "quantity": "-"})
            try:
                books_list.append({"info": data[3][i][0], "quantity": data[3][i][2]})
            except:
                books_list.append({"info": "-", "quantity": "-"})
            try:
                games_list.append({"info": data[4][i][0], "quantity": data[4][i][2]})
            except:
                games_list.append({"info": "-", "quantity": "-"})

        return {"series": series_list, "anime": anime_list, "movies": movies_list, "books": books_list,
                "games": games_list}

    times_spent = stats.get_total_time_spent()
    total_time = {"total": sum(times_spent), "series": int(times_spent[0]/60),
                  "anime": int(times_spent[1]/60), "movies": int(times_spent[2]/60),
                  "books": int(times_spent[3]/60), "games": int(times_spent[4]/60)}

    top_media = stats.get_top_media()
    most_present_media = create_dict(top_media)

    media_genres = stats.get_top_genres()
    most_genres_media = create_dict(media_genres)

    media_actors = stats.get_top_actors()
    most_actors_media = create_dict(media_actors)

    media_authors = stats.get_top_authors()
    most_authors_media = create_dict(media_authors)

    media_developers = stats.get_top_developers()
    most_developers_media = create_dict(media_developers)

    media_directors = stats.get_top_directors()
    most_directors_media = create_dict(media_directors)

    media_dropped = stats.get_top_dropped()
    top_dropped_media = create_dict(media_dropped)

    total_media_eps_seas = stats.get_total_eps_seasons()
    total_seasons_media = {"series": total_media_eps_seas[0][0][1], "anime": total_media_eps_seas[1][0][1]}
    total_episodes_media = {"series": total_media_eps_seas[0][0][0], "anime": total_media_eps_seas[1][0][0]}

    total_pages = stats.get_total_book_pages()

    total_movies = stats.get_total_movies()
    total_movies_dict = {"movies": total_movies}

    nb_media, nb_users = stats.get_nb_media_and_users()

    stats = MyListsStats(nb_users=nb_users, nb_media=json.dumps(nb_media),
                         total_time=json.dumps(total_time), top_media=json.dumps(most_present_media),
                         top_genres=json.dumps(most_genres_media), top_actors=json.dumps(most_actors_media),
                         top_directors=json.dumps(most_directors_media), top_dropped=json.dumps(top_dropped_media),
                         total_episodes=json.dumps(total_episodes_media), total_seasons=json.dumps(total_seasons_media),
                         total_movies=json.dumps(total_movies_dict), top_authors=json.dumps(most_authors_media),
                         top_developers=json.dumps(most_developers_media), total_pages=total_pages)
    db.session.add(stats)

    # Commit changes
    db.session.commit()


def compute_media_time_spent():
    """ Compute the total time watched/played/read for each media for each user """

    all_media = get_models_type("Media")
    all_media_list = get_models_type("List")

    for media, media_list in zip(all_media, all_media_list):
        if media_list in (SeriesList, AnimeList, MoviesList):
            query = db.session.query(User, media.duration, media_list.total,
                                     func.sum(media.duration * media_list.total))\
                .join(media, media.id == media_list.media_id) \
                .join(User, User.id == media_list.user_id) \
                .group_by(media_list.user_id).all()
        elif media_list == GamesList:
            query = db.session.query(User, media_list.playtime, media_list.score, func.sum(media_list.playtime)) \
                .join(media, media.id == media_list.media_id) \
                .join(User, User.id == media_list.user_id) \
                .group_by(media_list.user_id).all()
        elif media_list == BooksList:
            query = db.session.query(User, media_list.total, media_list.score,
                                     func.sum(BooksList.TIME_PER_PAGE * media_list.total)) \
                .join(media, media.id == media_list.media_id) \
                .join(User, User.id == media_list.user_id) \
                .group_by(media_list.user_id).all()
        else:
            return

        for q in query:
            setattr(q[0], f"time_spent_{media.__class__.__name__.lower()}", q[3])


class GlobalStats:
    """ Get all the global stats for MyLists """

    def __init__(self):
        self.tv_list_type = [MediaType.SERIES, MediaType.ANIME]
        self.tmdb_list_type = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES]

        self.all_list_type = MediaType

        self.media = None
        self.media_genre = None
        self.media_actors = None
        self.media_eps = None
        self.media_list = None
        self.media_authors = None
        self.media_comp = None

    @classmethod
    def get_total_time_spent(cls) -> List[int]:
        """ Get total time spent (min) by all users for all media """

        times_spent = db.session.query(func.sum(User.time_spent_series), func.sum(User.time_spent_anime),
                                       func.sum(User.time_spent_movies), func.sum(User.time_spent_books),
                                       func.sum(User.time_spent_games)) \
            .filter(User.role != RoleType.ADMIN, User.active == True).all()

        times_spent = [0 if not v else v for v in times_spent[0]]

        return times_spent

    @staticmethod
    def get_nb_media_and_users() -> Tuple[Dict, int]:
        """ Get total number of media and users in MyLists """

        # Queries
        nb_users = User.query.filter(User.role != RoleType.ADMIN, User.active == True).count()
        nb_series = Series.query.count()
        nb_anime = Anime.query.count()
        nb_movies = Movies.query.count()
        nb_books = Books.query.count()
        nb_games = Games.query.count()

        nb_media = {"series": nb_series,
                    "anime": nb_anime,
                    "movies": nb_movies,
                    "books": nb_books,
                    "games": nb_games}

        return nb_media, nb_users

    def get_query_data(self, media_type: Enum):
        """ Form a first part of the query depending on the <list_type> """

        # Get SQL models using <eval> and <media_type> enum
        self.media = eval(media_type.value.capitalize())
        self.media_list = eval(media_type.value.capitalize()+"List")
        self.media_genre = eval(media_type.value.capitalize()+"Genre")

        # Add other SQL models depending on <list_type>
        if media_type in (MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES):
            self.media_actors = eval(media_type.value.capitalize()+"Actors")
        if media_type in (MediaType.SERIES, MediaType.ANIME):
            self.media_eps = eval(media_type.value.capitalize()+"EpisodesPerSeason")
        if media_type == MediaType.BOOKS:
            self.media_authors = eval(media_type.value.capitalize()+"Authors")
        if media_type == MediaType.GAMES:
            self.media_comp = eval(media_type.value.capitalize()+"Companies")

    def get_top_media(self) -> List[Iterable]:
        """ Get the top media in all users list (for Series, Anime, Movies, Games and Books) """

        queries = []
        for list_type in self.all_list_type:
            # Populate attributes with appropriate SQL models
            self.get_query_data(list_type)

            # Create query for each <list_type>
            query = db.session.query(self.media.name, self.media_list,
                                     func.count(self.media_list.media_id == self.media.id).label("count"))\
                .join(self.media_list, self.media_list.media_id == self.media.id)\
                .group_by(self.media_list.media_id).order_by(text("count desc")).limit(5).all()

            # Append results
            queries.append(query)

        return queries

    def get_top_genres(self) -> List[Iterable]:
        """ Get the top genres in all users list (for Series, Anime, Movies, Games and Books) """

        queries = []
        for list_type in self.all_list_type:
            # Populate attributes with appropriate SQL models
            self.get_query_data(list_type)

            # Create query for each <list_type>
            query = db.session.query(self.media_genre.genre, self.media_list,
                                     func.count(self.media_genre.genre).label('count'))\
                .join(self.media_genre, self.media_genre.media_id == self.media_list.media_id)\
                .group_by(self.media_genre.genre).order_by(text('count desc')).limit(5).all()

            # Append results
            queries.append(query)

        return queries

    def get_top_actors(self) -> List[Iterable]:
        """ Get the top actors in all users list (for Series, Anime, Movies) """

        queries = []
        for list_type in self.tmdb_list_type:
            # Populate attributes with appropriate SQL models
            self.get_query_data(list_type)

            # Create query
            query = db.session.query(self.media_actors.name, self.media_list,
                                     func.count(self.media_actors.name).label('count'))\
                .join(self.media_actors, self.media_actors.media_id == self.media_list.media_id)\
                .order_by(text('count desc')).limit(5).all()

            # Append to list
            queries.append(query)

        return queries

    def get_top_dropped(self) -> List[Iterable]:
        """ Get the top dropped media in all users list (for Series and Anime) """

        queries = []
        for list_type in self.tv_list_type:
            # Populate attributes with appropriate SQL models
            self.get_query_data(list_type)

            # Create query
            query = db.session.query(self.media.name, self.media_list,
                                     func.count(self.media_list.media_id == self.media.id).label('count'))\
                .join(self.media_list, self.media_list.media_id == self.media.id)\
                .filter(self.media_list.status == Status.DROPPED)\
                .group_by(self.media_list.media_id)\
                .order_by(text('count desc')).limit(5).all()

            # Append to list
            queries.append(query)

        return queries

    def get_total_eps_seasons(self) -> List:
        """ Get the total episodes in all users list (for Series and Anime) """

        queries = []
        for list_type in self.tv_list_type:
            # Populate attributes with appropriate SQL models
            self.get_query_data(list_type)

            # Create query
            query = db.session.query(func.sum(self.media_list.total), func.sum(self.media_list.current_season)).all()

            # Append to list
            queries.append(query)

        return queries

    def get_top_directors(self) -> List:
        """ Get the top directors in all users list for Movies """

        # Populate attributes with appropriate SQL models
        self.get_query_data(MediaType.MOVIES)

        # Create query
        query = db.session.query(self.media.director_name, self.media_list,
                                 func.count(self.media.director_name).label('count')) \
            .join(self.media, self.media.id == self.media_list.media_id) \
            .group_by(self.media.director_name).filter(self.media.director_name != 'Unknown')\
            .order_by(text('count desc')).limit(5).all()

        return [[], [], query, [], []]

    def get_top_developers(self) -> List:
        """ Get the top developers in all users list for Games """

        # Populate attributes with appropriate SQL models
        self.get_query_data(MediaType.GAMES)

        # Create query
        query = db.session.query(self.media_comp.name, self.media_list,
                                 func.count(self.media_comp.name).label('count'))\
            .join(self.media_comp, self.media_comp.media_id == self.media_list.media_id) \
            .group_by(self.media_comp.name) \
            .filter(self.media_comp.name != 'Unknown', self.media_comp.developer == True) \
            .order_by(text('count desc')).limit(5).all()

        return [[], [], [], [], query]

    def get_top_authors(self) -> List:
        """ Get the top authors for Books in all users list """

        # Populate attributes with appropriate SQL models
        self.get_query_data(MediaType.BOOKS)

        # Create query
        query = db.session.query(self.media_authors.name, self.media_list,
                                 func.count(self.media_authors.name).label('count'))\
            .join(self.media_authors, self.media_authors.media_id == self.media_list.media_id)\
            .group_by(self.media_authors.name).filter(self.media_authors.name != 'Unknown')\
            .order_by(text('count desc')).limit(5).all()

        return [[], [], [], query, []]

    def get_total_movies(self) -> int:
        """ Get total movies in all users list """

        # Populate attributes with appropriate SQL models
        self.get_query_data(MediaType.MOVIES)

        # Create query
        total_movies = db.session.query(self.media).count()

        return total_movies

    def get_total_book_pages(self) -> int:
        """ Get total books pages in all users list """

        # Populate attributes with appropriate SQL models
        self.get_query_data(MediaType.BOOKS)

        # Create query
        query = db.session.query(func.sum(self.media_list.actual_page)).all()

        try:
            data = query[0][0]
        except:
            data = 0

        return data


# ---------------------------------------------------------------------------------------------------------------


def register(app):
    """ Register the command for the Flask CLI """

    @app.cli.command()
    def scheduled_task():
        """ Run all the necessary scheduled jobs """

        # Set logger to INFO
        app.logger.setLevel(logging.INFO)

        remove_non_list_media()
        remove_old_covers()

        automatic_media_refresh()

        new_releasing_movies()
        new_releasing_series()
        new_releasing_anime()
        new_releasing_games()

        automatic_movies_locking()

        app.logger.info("[SYSTEM] - Starting to compute the total time spent for each user")
        compute_media_time_spent()
        app.logger.info("###################################################################")
        app.logger.info("[SYSTEM] - Finished computing the total time spent for each user")

        update_Mylists_stats()

    @app.cli.command()
    def update_igdb_key():
        """ Update the IGDB API key """

        # Set logger to INFO
        app.logger.setLevel(logging.INFO)

        update_IGDB_API()
