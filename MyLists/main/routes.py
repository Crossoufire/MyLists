"""
Main routes
"""

import json
import secrets
from datetime import datetime
from pathlib import Path
from urllib.request import urlretrieve
import pytz
from PIL import Image
from flask import Blueprint, url_for, request, abort, render_template, flash, jsonify, redirect, session
from flask_login import login_required, current_user
from sqlalchemy import func, desc, distinct
from wtforms import StringField, SelectMultipleField
from MyLists import db, app
from MyLists.API_data import ApiData, ApiTMDB, ApiGames, ApiBooks
from MyLists.main.forms import MediaComment, ModelForm, GenreForm, CoverForm, SearchForm
from MyLists.models import Status, RoleType, MediaType, User, get_media_query, UserLastUpdate, get_next_airing, \
    Books, BooksGenre, change_air_format
from MyLists.scheduled_tasks import refresh_element_data
from MyLists.utils import shape_to_dict_updates, get_models_group


bp = Blueprint('main', __name__)


@bp.route("/list/<media_type>/<username>/", methods=["GET", "POST"])
@login_required
def medialist(media_type: str, username: str):
    """ Media list route (Series, Anime, Movies, Games, and Books) """

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return abort(400)

    # Check if <user> has access
    user = current_user.check_autorization(username)

    # Add <views_count> to profile
    current_user.add_view_count(user, media_type)

    # Initialize search form
    search_form = SearchForm()

    # Fetch <GET> arguments
    search_q = request.args.get("q", None)
    sorting = request.args.get("sorting", models[1].default_sorting())
    category = request.args.get("category", models[1].default_category())
    genre = request.args.get("genre", "All")
    lang = request.args.get("lang", None)
    page = request.args.get("page", 1, type=int)

    # Get template
    template = models[1].html_template()

    # Get data depending on selected category
    if category == "Stats":
        media_data = models[1].get_more_stats(user)
    else:
        category, media_data = get_media_query(user, media_type, category, genre, sorting, page, search_q, lang)

    # Commit changes
    db.session.commit()

    # noinspection PyUnresolvedReferences
    return render_template(f"medialist/{template}", title=f"{username}'s {media_type.value} list", user=user,
                           search_q=search_q, media_type=media_type.value, search_form=search_form, lang=lang,
                           category=category, genre=genre, sorting=sorting, page=page, data=media_data)


@bp.route("/comment/<media_type>/<media_id>", methods=['GET', 'POST'])
@login_required
def write_comment(media_type: str, media_id: int):
    """ Add commentary to media """

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return abort(400)

    # Check if <media> is in <current_user> list
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if media is None:
        return abort(400)

    # Get media name
    media_name = media.media.name

    # Get comment form
    form = MediaComment()

    # Add commentary to page if already one
    if request.method == 'GET':
        form.comment.data = media.comment
        session["back_url"] = request.referrer or "/"

    # Validate form
    if form.validate_on_submit():
        comment = form.comment.data
        media.comment = comment

        # Commit changes
        db.session.commit()
        app.logger.info(f"[{current_user.id}] added a comment on {media_type} with ID [{media_id}]")

        if not comment or comment == '':
            flash("Your comment has been removed/is empty.", "warning")
        else:
            flash("Your comment has been added/modified.", "success")

        return redirect(session["back_url"])

    return render_template("medialist/medialist_comment.html", title="Add comment", form=form, media_name=media_name)


@bp.route("/persons/<media_type>/<job>/<person>", methods=['GET', 'POST'])
@login_required
def persons(media_type: str, job: str, person: str):
    """ Get a person (director or actor) """

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return abort(400)

    # Get data associated to person
    data = models[0].get_persons(job, person)

    return render_template('medialist/persons.html', title=person, person=person, data=data)


@bp.route('/details/<media_type>/<media_id>', methods=['GET', 'POST'])
@login_required
def media_details(media_type: str, media_id: int):
    """ Display media info and details """

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return abort(400)

    # Check if <media_id> come from API
    from_api = request.args.get("search")

    # Check if refresh button pushed
    refresh = request.args.get("refresh")
    if refresh and current_user.role != RoleType.USER:
        media = models[0].query.filter_by(id=media_id).first()
        if media is None:
            flash("Impossible to refresh the media data", "warning")
        response = refresh_element_data(media.api_id, media_type)
        if response:
            flash("Successfully updated the metadata of the media", "success")

    # Check <media> in local DB
    search = {"id": media_id}
    if from_api:
        search = {"api_id": media_id}
    media = models[0].query.filter_by(**search).first()

    # If not <media> and <api_id>: Add <media> to DB, else abort
    if not media:
        if from_api:
            API_class = ApiData.get_API_class(media_type)
            try:
                media = API_class(API_id=media_id).save_media_to_db()
                db.session.commit()
            except Exception as e:
                flash("Sorry, a problem occured trying to load the media info. Please try again later.", "warning")
                app.logger.error(f"[ERROR] - Occured trying to add media "
                                 f"({media_type.value}) ID [{media_id}] to DB: {e}")
                location = request.referrer or '/'
                return redirect(location)
        else:
            abort(400)

    # If <media> and <api_id>: redirect with media.id instead of media.api_id
    if media and from_api:
        return redirect(url_for("main.media_details", media_type=media_type.value, media_id=media.id))

    # Get user list info
    list_info = media.get_user_list_info()

    # Get media history for user
    media_updates = UserLastUpdate.query.filter(UserLastUpdate.user_id == current_user.id,
                                                UserLastUpdate.media_type == media_type,
                                                UserLastUpdate.media_id == media_id)\
        .order_by(desc(UserLastUpdate.date)).all()

    # noinspection PyProtectedMember
    history = shape_to_dict_updates(media_updates)

    # Get Genre form for books
    form = GenreForm()
    form_cover = CoverForm()
    genres = None
    if media_type == MediaType.BOOKS:
        genres = db.session.query(func.group_concat(distinct(BooksGenre.genre))) \
            .filter(BooksGenre.media_id == media_id).first()

    # If refresh, redirect to remove GET argument
    if refresh:
        return redirect(request.path, code=302)

    # Get HTML template
    template = models[0].media_details_template()

    # noinspection PyUnresolvedReferences
    return render_template(f"details/{template}", title=media.name, media=media, list_info=list_info, form=form,
                           genres=genres, media_type=media_type.value, form_cover=form_cover, media_updates=history)


@bp.route('/update_book_genres/<media_id>', methods=['POST'])
@login_required
def update_book_genres(media_id: int):
    """ Update the books genres """

    # Get form
    form = GenreForm()

    # Check if submitted
    if form.is_submitted():
        if form.genres.data:
            # Check genre is <Unknown> (= not set) otherwise abort
            book = BooksGenre.query.filter(BooksGenre.media_id == media_id).first()
            if book.genre != "Unknown":
                return abort(400)

            try:
                BooksGenre.query.filter(BooksGenre.media_id == media_id).delete()
                for genre in form.genres.data[:5]:
                    db.session.add(BooksGenre(genre=genre, media_id=media_id))
                db.session.commit()
                flash("Genre successfully updated", "success")
                app.logger.info(f"[SYSTEM] - Book ID [{media_id}]. Genres modified by [{current_user.id}]")
            except:
                db.session.rollback()
                flash("Error while updating the books genres", "warning")

    return redirect(url_for("main.media_details", media_type=MediaType.BOOKS.value, media_id=media_id))


@bp.route('/update_book_cover/<media_id>', methods=['POST'])
@login_required
def update_book_cover(media_id: int):
    """ Update the book cover """

    # Get form
    form = CoverForm()

    # Query book to be modified
    book = Books.query.filter(Books.id == media_id).first()

    # Check validation
    if form.validate_on_submit():
        picture_fn = secrets.token_hex(8) + ".jpg"
        picture_path = Path(app.root_path, f"static/covers/books_covers", picture_fn)
        try:
            urlretrieve(f"{form.image_cover.data}", f"{picture_path}")
            img = Image.open(f"{picture_path}")
            img = img.resize((300, 450), Image.ANTIALIAS)
            img.save(f"{picture_path}", quality=90)
        except Exception as e:
            app.logger.error(f"[SYSTEM] - Error occured updating media cover: {e}")
            flash(str(e), "warning")
            picture_fn = "default.jpg"
        book.image_cover = picture_fn

        db.session.add(book)

        # Commit changes
        db.session.commit()

    return redirect(url_for("main.media_details", media_type=MediaType.BOOKS.value, media_id=media_id))


@bp.route("/details/form/<media_type>/<media_id>", methods=['GET', 'POST'])
@login_required
def media_details_form(media_type: str, media_id: int):
    """ Form of the media details route """

    # Only admin and moderators can access
    if current_user.role == RoleType.USER:
        return abort(403)

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return abort(400)

    # Get media and check if exists
    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        flash("The media does not exist", 'warning')
        return redirect(request.referrer or "/")

    class Form(ModelForm):
        """ Class converts attributs of <SQLAlchemy_model> to <FlaskForm> """
        class Meta:
            """ Meta data for settings """
            csrf = False
            model = models[0]
            only = models[0].form_only()
        image_cover = StringField("insert an img URL")

        # If the media is a book also display a genre attr
        if media_type == 'Books':
            genre_attr = SelectMultipleField('Genres',
                                             choices=[('Action & Adventure', 'Action & Adventure'),
                                                      ('Biography', 'Biography'), ('Chick lit', 'Chick lit'),
                                                      ('Children', 'Children'), ('Classic', 'Classic'),
                                                      ('Crime', 'Crime'),
                                                      ('Drama', 'Drama'), ('Dystopian', 'Dystopian'),
                                                      ('Fantastic', 'Fantastic'),
                                                      ('Fantasy', 'Fantasy'), ('History', 'History'),
                                                      ('Humor', 'Humor'),
                                                      ('Horror', 'Horror'), ('Mystery', 'Mystery'),
                                                      ('Paranormal', 'Paranormal'),
                                                      ('Philosophy', 'Philosophy'), ('Poetry', 'Poetry'),
                                                      ('Romance', 'Romance'),
                                                      ('Science', 'Science'), ('Science-Fiction', 'Science-Fiction'),
                                                      ('Short story', 'Short story'), ('Suspense', 'Suspense'),
                                                      ('Thriller', 'Thriller'), ('Western', 'Western'),
                                                      ('Young adult', 'Young adult')])

    # Populate form with model data except for <image_cover>
    form = Form(obj=media)
    if request.method == "GET":
        form.image_cover.data = None

    genres = None
    if media_type == MediaType.BOOKS:
        genres = db.session.query(func.group_concat(distinct(BooksGenre.genre))) \
            .filter(BooksGenre.media_id == media_id).first()

    if form.is_submitted():
        if form.image_cover.data == "":
            picture_fn = media.image_cover
        else:
            picture_fn = secrets.token_hex(8) + ".jpg"
            picture_path = Path(app.root_path, f"static/covers/{media_type.value}_covers", picture_fn)
            try:
                urlretrieve(f"{form.image_cover.data}", f"{picture_path}")
                img = Image.open(f"{picture_path}")
                img = img.resize((300, 450), Image.ANTIALIAS)
                img.save(f"{picture_path}", quality=90)
            except Exception as e:
                app.logger.error(f"[SYSTEM] - Error occured updating media cover: {e}")
                flash(str(e), "warning")
                picture_fn = media.image_cover
        form.image_cover.data = picture_fn
        form.populate_obj(media)
        db.session.add(media)
        db.session.commit()

        # Check genre form for books
        if media_type == MediaType.BOOKS:
            if form.genre_attr.data:
                try:
                    BooksGenre.query.filter(BooksGenre.media_id == media_id).delete()
                    for genre in form.genre_attr.data[:5]:
                        adding = BooksGenre(genre=genre, media_id=media_id)
                        db.session.add(adding)
                    db.session.commit()
                    flash("Data successfully updated", "success")
                except:
                    db.session.rollback()
                    flash("Error while updating the genres", "warning")

        return redirect(url_for("main.media_details", media_type=media_type, media_id=media_id))

    return render_template("details/media_details_form.html", title='Media Form', form=form, genres=genres,
                           media_type=media_type)


@bp.route("/your_next_airing", methods=['GET', 'POST'])
@login_required
def your_next_airing():
    """ Get the next airing for series, anime, movies and games """

    next_series_airing = get_next_airing(MediaType.SERIES)
    next_anime_airing = get_next_airing(MediaType.ANIME)
    next_movies_airing = get_next_airing(MediaType.MOVIES)
    next_games_airing = get_next_airing(MediaType.GAMES)

    series_dates = []
    for series in next_series_airing:
        series_dates.append(change_air_format(series[0].next_episode_to_air))

    anime_dates = []
    for anime in next_anime_airing:
        anime_dates.append(change_air_format(anime[0].next_episode_to_air))

    movies_dates = []
    for movie in next_movies_airing:
        movies_dates.append(change_air_format(movie[0].release_date))

    games_dates = []
    for game in next_games_airing:
        games_dates.append(change_air_format(game.release_date, games=True))

    return render_template("medialist/your_next_airing.html", title="Next airing", airing_series=next_series_airing,
                           series_dates=series_dates, airing_anime=next_anime_airing, anime_dates=anime_dates,
                           airing_movies=next_movies_airing, movies_dates=movies_dates, airing_games=next_games_airing,
                           games_dates=games_dates)


@bp.route("/search_media", methods=['GET', 'POST'])
@login_required
def search_media():
    """ Search media from API and db """

    search = request.args.get("search", type=str)
    media_select = request.args.get("media_select", type=str)
    page = request.args.get("page", 1, type=int)

    if media_select == "TMDB":
        try:
            Api_data = ApiTMDB()
            Api_data.search(search, page=page)
            media_results, total_results, total_pages = Api_data.get_search_list()
        except Exception as e:
            app.logger.error(f"[SYSTEM] - Error requesting the TMDb API: {e}")
            flash("Sorry, an error occured, the TMDb API is unreachable for now", "warning")
            return redirect(request.referrer or "/")
    elif media_select == "IGDB":
        try:
            Api_data = ApiGames()
            Api_data.search(search, page=page)
            media_results, total_results, total_pages = Api_data.get_search_list()
        except Exception as e:
            app.logger.error(f"[SYSTEM] - Error requesting the IGDB API: {str(e)}")
            flash('Sorry, an error occured, the IGDB API is unreachable for now.', 'warning')
            return redirect(request.referrer or '/')
    elif media_select == "BOOKS":
        page = request.args.get('page', 0)
        try:
            Api_data = ApiBooks()
            Api_data.search(search, page=page)
            media_results, total_results, total_pages = Api_data.get_search_list()
        except Exception as e:
            app.logger.error(f"[SYSTEM] - Error requesting the GoogleBooks API: {str(e)}")
            flash('Sorry, an error occured, the GoogleBooks API is unreachable for now.', 'warning')
            return redirect(request.referrer or '/')
    elif media_select == "users":
        users_search = User.query.filter(User.username.like('%' + search + '%'),
                                         User.role != RoleType.ADMIN, User.active == True)\
            .paginate(page, 10, error_out=True)
        media_results = []
        for user in users_search.items:
            user_data = {"name": user.username,
                         "poster_path": '/static/profile_pics/' + user.image_file,
                         "register": datetime.strftime(user.registered_on, '%d %b %Y'),
                         "media": "User",
                         "level": user.get_frame_info()}
            media_results.append(user_data)
            total_pages = users_search.pages
            total_results = users_search.total
    else:
        return abort(400)

    if len(media_results) == 0:
        flash("Sorry, no results found for your query", "warning")
        return redirect(request.referrer or "/")

    # noinspection PyUnboundLocalVariable
    return render_template("medialist/media_search.html", title="Search", results=media_results, page=page,
                           media_select=media_select, tot_res=total_results, search=search, tot_pages=total_pages)


# --- AJAX Methods -----------------------------------------------------------------------------------------------


@bp.route('/update_season', methods=['POST'])
@login_required
def update_season():
    """ Update the season of an updated anime or series for the user """

    try:
        json_data = request.get_json()
        new_season = int(json_data["season"]) + 1
        media_id = int(json_data["element_id"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> exist and is valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except:
        return "", 400

    # Check if <media> exists
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Check if season number is between 1 and <last_season>
    if 1 > new_season or new_season > media.media.eps_per_season[-1].season:
        return "", 400

    # Get old data
    old_season = media.current_season
    old_episode = media.last_episode_watched
    old_total = media.total

    # Set new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:new_season-1]]) + 1
    media.current_season = new_season
    media.last_episode_watched = 1
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] - [{media_type}] - [ID {media_id}] season updated to {new_season}")

    # Set last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=media_type, old_season=old_season,
                                   new_season=new_season, new_episode=1, old_episode=old_episode)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/update_episode', methods=['POST'])
@login_required
def update_episode():
    """ Update the episode of an updated anime or series from a user """

    try:
        json_data = request.get_json()
        new_episode = int(json_data["episode"]) + 1
        media_id = int(json_data["element_id"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return "", 400

    # Check if media exists
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Check if episode number between 1 and <last_episode>
    if 1 > new_episode or new_episode > media.media.eps_per_season[media.current_season - 1].episodes:
        return "", 400

    # Get old data
    old_season = media.current_season
    old_episode = media.last_episode_watched
    old_total = media.total

    # Set new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:old_season-1]]) + new_episode
    media.last_episode_watched = new_episode
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] {media_type} [ID {media_id}] episode updated to {new_episode}")

    # Set last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=media_type, old_season=old_season,
                                   new_season=old_season, old_episode=old_episode, new_episode=new_episode)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/update_page', methods=['POST'])
@login_required
def update_page():
    """ Update the page read of an updated book from a user """

    try:
        json_data = request.get_json()
        new_page = int(json_data["page"])
        media_id = int(json_data["element_id"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return "", 400

    # Check if media exists
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Check if page number between 0 and max(pages)
    if new_page > int(media.media.pages) or new_page < 0:
        return "The number of pages cannot be below 0 or greater than the total pages.", 400

    # Get old data
    old_page = media.actual_page
    old_total = media.total

    # Set new data
    media.actual_page = new_page
    new_total = new_page + (media.rewatched * media.media.pages)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] {media_type} [ID {media_id}] page updated from {old_page} to {new_page}")

    # Set last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=media_type, old_page=old_page, new_page=new_page,
                                   old_status=media.status)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/update_playtime', methods=['POST'])
@login_required
def update_playtime():
    """ Update playtime of an updated game from a user """

    try:
        json_data = request.get_json()
        new_playtime = int(json_data["playtime"]) * 60
        media_id = int(json_data["media_id"])
        media_type = json_data["media_type"]
    except:
        return "", 400

    if new_playtime < 0:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return '', 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Set last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=media_type, old_playtime=media.playtime,
                                   new_playtime=new_playtime, old_status=media.status)

    # Compute new time spent
    media.compute_new_time_spent(new_data=new_playtime)

    # Update new playtime
    media.playtime = new_playtime

    # Commit changes
    db.session.commit()
    app.logger.info(f"[{current_user.id}] Games ID {media_id} playtime updated to {new_playtime}")

    return "", 204


@bp.route('/update_category', methods=['POST'])
@login_required
def update_category():
    """ Update the media category of a user """

    try:
        json_data = request.get_json()
        media_new_cat = json_data["status"]
        media_id = int(json_data["element_id"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except:
        return '', 400

    # Check <status> parameter
    try:
        new_status = Status(media_new_cat)
    except:
        return "", 400

    # Get media
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Change <status> and get data to compute <last_updates> and <new_time_spent>
    try:
        old_total = media.total
    except:
        old_total = media.playtime
    old_status = media.status
    new_total = media.category_changes(new_status)

    # Set last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=media_type, old_status=old_status,
                                   new_status=new_status, old_playtime=old_total, new_playtime=new_total)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit changes
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {media_type}'s category [ID {media_id}] changed to {new_status}")

    return "", 204


@bp.route('/update_score', methods=['POST'])
@login_required
def update_score():
    """ Update the media score entered by a user """

    try:
        json_data = request.get_json()
        new_score = json_data["score"]
        media_id = int(json_data["element_id"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return "", 400

    # Check <new_score> is '---' or between [0-10]
    try:
        if 0 > float(new_score) or float(new_score) > 10:
            return "", 400
    except:
        new_score = None

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Set new data
    media.score = new_score
    app.logger.info(f"[{current_user.id}] Series ID {media_id} score updated to {new_score}")

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/update_feeling', methods=['POST'])
@login_required
def update_feeling():
    """ Update feeling (instead of score) for a user """

    try:
        json_data = request.get_json()
        new_feeling = json_data['feeling']
        media_id = int(json_data['element_id'])
        media_type = json_data['element_type']
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return "", 400

    # Check <new_feeling> null or between 1 and 4
    try:
        if 0 > int(new_feeling) or int(new_feeling) > 5:
            return "", 400
    except:
        new_feeling = None

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Set new data
    media.feeling = new_feeling
    app.logger.info(f"[{current_user.id}] Media ID {media_id} feeling updated to {new_feeling}")

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/update_rewatch', methods=['POST'])
@login_required
def update_rewatch():
    """ Update the media rewatch value for a user """

    try:
        json_data = request.get_json()
        new_rewatch = int(json_data['rewatch'])
        media_id = int(json_data['element_id'])
        media_type = json_data['element_type']
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return '', 400

    # Check <new_rewatch> is between [0-10]
    if 0 > new_rewatch > 10:
        return "", 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media or media.status != Status.COMPLETED:
        return "", 400

    # Update rewatch and total data watched
    old_total = media.total
    new_total = media.update_total_watched(new_rewatch)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit changes
    db.session.commit()
    app.logger.info(f"[{current_user.id}] Media ID {media_id} rewatched {new_rewatch}x times")

    return "", 204


@bp.route('/add_favorite', methods=['POST'])
@login_required
def add_favorite():
    """ Add the media as favorite for the user """

    try:
        json_data = request.get_json()
        media_id = int(json_data["element_id"])
        favorite = bool(json_data["favorite"])
        media_type = json_data["element_type"]
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        return "", 400

    # Check if <media_id> in user list
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    # Add favorite
    media.favorite = favorite

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/add_element', methods=['POST'])
@login_required
def add_element():
    """ Add media to user """

    try:
        json_data = request.get_json()
        media_id = json_data['element_id']
        media_cat = json_data['element_cat']
        media_type = json_data['element_type']
    except:
        return "", 400

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except:
        return "", 400

    # Check <status> parameter
    try:
        new_status = Status(media_cat)
    except:
        return "", 400

    # Check <media> not in user list
    in_list = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if in_list:
        return "", 400

    # Check if <media> exists
    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        return "", 400

    # Add media to user
    new_watched = media.add_media_to_user(new_status)

    # Commit changes
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {media_type} Added [ID {media_id}] in the category: {new_status}")

    # Set last update
    UserLastUpdate.set_last_update(media=media, media_type=media_type, new_status=new_status)

    # Compute new time spent
    in_list = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    in_list.compute_new_time_spent(new_data=new_watched)

    # Commit changes
    db.session.commit()

    return "", 204


@bp.route('/delete_element', methods=['POST'])
@login_required
def delete_element():
    """ Delete a media of the user """

    try:
        json_data = request.get_json()
        media_id = int(json_data['delete'])
        media_type = json_data['element_type']
    except:
        return "", 400

    # Check if <list_type> exist and is valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except:
        return "", 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return "", 400

    try:
        old_total = media.total
    except:
        old_total = media.playtime

    media.compute_new_time_spent(old_data=old_total, new_data=0)

    # Delete media from user list
    db.session.delete(media)

    # Commit changes and log
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {media_type} [ID {media_id}] successfully removed")

    return "", 204


@bp.route('/lock_media', methods=['POST'])
@login_required
def lock_media():
    """ Lock a media so the API does not update it anymore """

    try:
        json_data = request.get_json()
        media_id = json_data['element_id']
        lock_status = bool(json_data['lock_status'])
        media_type = json_data['element_type']
    except:
        return "", 400

    # Check if user is admin or manager
    if current_user.role == RoleType.USER:
        return "", 403

    # Check if <media_type> valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except:
        return "", 400

    # Check if media exists
    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        return "", 400

    # Lock media
    media.lock_status = lock_status

    # Commit changes and log
    db.session.commit()
    app.logger.info(f"{media_type} [ID {media_id}] successfully locked.")

    return "", 204


@bp.route('/autocomplete', methods=['GET'])
@login_required
def autocomplete():
    """ Autocomplete search route for media searching """

    search = request.args.get('q')
    media_select = request.args.get('media_select')

    if media_select == 'TMDB':
        try:
            Api_data = ApiTMDB()
            Api_data.search(search)
            media_results = Api_data.get_autocomplete_list()
        except Exception as e:
            media_results = []
            app.logger.error(f"[ERROR] - Requesting the TMDB API: {e}")
    elif media_select == 'IGDB':
        try:
            Api_data = ApiGames()
            Api_data.search(search)
            media_results = Api_data.get_autocomplete_list()
        except Exception as e:
            media_results = []
            app.logger.error(f"[ERROR] - Requesting the IGDB API: {e}")
    elif media_select == 'BOOKS':
        try:
            Api_data = ApiBooks()
            Api_data.search(search)
            media_results = Api_data.get_autocomplete_list()
        except Exception as e:
            media_results = []
            app.logger.error(f"[SYSTEM] - Error requesting the GoogleBooks API: {e}")
    elif media_select == 'users':
        media_results = User.get_autocomplete_list(search)
    else:
        return request.referrer or '/'

    if len(media_results) == 0:
        return jsonify(search_results=[{'nb_results': 0, 'category': None}]), 200

    media_results = sorted(media_results, key=lambda i: i['category'])

    return jsonify(search_results=media_results), 200


@bp.route("/read_notifications", methods=['GET'])
@login_required
def read_notifications():
    """ Read user notification """

    # Change last time <current_user> looked at notifications
    current_user.last_notif_read_time = datetime.utcnow()

    # Commit changes
    db.session.commit()

    # Get user notfications
    notifications = current_user.get_notifications()

    results = []
    if notifications:
        for info in notifications:
            timestamp = info.timestamp.replace(tzinfo=pytz.UTC).isoformat()
            results.append(
                {"media_type": info.media_type,
                 "media_id": info.media_id,
                 "timestamp": timestamp,
                 "payload": json.loads(info.payload_json),
                 })

    return jsonify(results=results), 200


# Not used for now
# @bp.route('/update_completion_date', methods=['POST'])
# @login_required
# def update_completion_date():
#     try:
#         json_data = request.get_json()
#         media_id = int(json_data['element_id'])
#         media_type = json_data['element_type']
#         media_date = json_data['element_date']
#     except:
#         return '', 400
#
#     # Check if <media_type> exist and is valid
#     try:
#         media_type = MediaType(media_type)
#         models = get_models_group(media_type)
#     except:
#         return '', 400
#
#     # Get the media info
#     media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
#     if not media:
#         return '', 400
#
#     # Change the completion date only if the status' media is COMPLETED
#     if media.status == Status.COMPLETED:
#         media.completion_date = media_date
#
#     # Commit the session
#     db.session.commit()
#     app.logger.info(f"[User {current_user.id}] {list_type}'s completion date [ID {media_id}] changed.")
#
#     return '', 204
