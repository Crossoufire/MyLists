import json
import secrets
from datetime import datetime
from pathlib import Path
from urllib.request import urlretrieve
import pytz
from PIL import Image
from flask import Blueprint, url_for, request, abort, render_template, flash, jsonify, redirect, session
from flask_login import login_required, current_user
from sqlalchemy import func
from wtforms import StringField, SelectMultipleField
from MyLists import db, app
from MyLists.API_data import ApiData, TMDBMixin, ApiGames, ApiBooks
from MyLists.main.forms import MediaComment, SearchForm, ModelForm
from MyLists.models import ListType, Status, RoleType, MediaType, User, get_media_query, UserLastUpdate, \
    get_models_group, get_next_airing, Books, BooksList, BooksGenre, change_air_format

bp = Blueprint('main', __name__)


def books():
    import pandas as pd

    df = pd.read_csv('D:/Bureau/table_1_try.csv')
    for index, row in df.iterrows():
        Api_data = ApiBooks()
        a = row['Titre'] + ' + ' + row['Auteur']
        media_id = Api_data.search(a.strip())
        if media_id:
            media = Books.query.filter_by(id=media_id).first()
            new_watched = media.add_media_to_user(Status.COMPLETED)
            db.session.commit()
            UserLastUpdate.set_last_update(media=media, media_type=ListType.BOOKS, new_status=Status.COMPLETED)
            in_list = BooksList.query.filter_by(user_id=current_user.id, media_id=media_id).first()
            in_list.compute_new_time_spent(new_data=new_watched)
            db.session.commit()
            print(a, media.name)
            print('done')
        else:
            print('failed')


@bp.route("/<media_list>/<user_name>/", methods=['GET', 'POST'])
@bp.route("/<media_list>/<user_name>/<category>/", methods=['GET', 'POST'])
@bp.route("/<media_list>/<user_name>/<category>/genre/<genre>/by/<sorting>/page/<page_val>", methods=['GET', 'POST'])
@login_required
def mymedialist(media_list, user_name, category=None, genre='All', sorting=None, page_val=1):
    # Check if <media_list> is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return abort(400)

    # books()

    # Check if <user> can see <media_list>
    user = current_user.check_autorization(user_name)

    # Add <views_count> to the profile
    current_user.add_view_count(user, list_type)

    # Initialize the search form
    search_form = SearchForm()

    # Get the query if it exists
    q = request.args.get('q')

    # Get the sorting
    if sorting is None:
        sorting = models[1].default_sorting()

    # Get the category
    if category is None:
        category = models[1].default_category()

    # Get the template
    html_template = models[1].html_template()

    # Get the corresponding data depending on the selected category
    if category != 'Stats':
        # media_data = MediaListQuery(models, user.id, category, genre, sorting, page_val, q)
        category, media_data = get_media_query(user.id, list_type, category, genre, sorting, page_val, q)
    else:
        media_data = models[1].get_more_stats(user)

    # Commit the changes
    db.session.commit()

    return render_template(html_template, title="{}'s {}".format(user_name, media_list), user=user, search_q=q,
                           media_list=media_list, search_form=search_form, category=category, genre=genre,
                           sorting=sorting, page=page_val, data=media_data)


@bp.route("/persons/<media_type>/<job>/<person>", methods=['GET', 'POST'])
@login_required
def persons(media_type, job, person):
    # Check if <media_type> is valid
    try:
        models = get_models_group(MediaType(media_type))
    except ValueError:
        return abort(400)

    data = models[0].get_persons(job, person)

    return render_template('persons.html', title=person, person=person, data=data)


@bp.route("/comment/<media_type>/<media_id>", methods=['GET', 'POST'])
@login_required
def write_comment(media_type, media_id):
    # Check if <media_type> is valid
    try:
        models = get_models_group(MediaType(media_type))
    except ValueError:
        return abort(400)

    # Check if the <media> is in the current user's list
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return abort(400)

    form = MediaComment()
    if request.method == 'GET':
        form.comment.data = media.comment
        session['back_url'] = request.referrer or '/'
    if form.validate_on_submit():
        comment = form.comment.data
        media.comment = comment

        db.session.commit()
        app.logger.info(f"[{current_user.id}] added a comment on {media_type} with ID [{media_id}]")

        if not comment or comment == '':
            flash('Your comment has been removed/is empty.', 'warning')
        else:
            flash('Your comment has been added/modified.', 'success')

        return redirect(session['back_url'])

    return render_template('medialist_comment.html', title='Add comment', form=form, media_name=media.media.name)


@bp.route('/media_sheet/<media_type>/<media_id>', methods=['GET', 'POST'])
@login_required
def media_sheet(media_type, media_id):
    # Check if <media_type> is valid
    try:
        media_type = MediaType(media_type)
        models = get_models_group(media_type)
    except ValueError:
        abort(400)

    if media_type == MediaType.SERIES:
        list_type = ListType.SERIES
    if media_type == MediaType.ANIME:
        list_type = ListType.ANIME
    elif media_type == MediaType.MOVIES:
        list_type = ListType.MOVIES
    elif media_type == MediaType.BOOKS:
        list_type = ListType.BOOKS
    elif media_type == MediaType.GAMES:
        list_type = ListType.GAMES

    # Check if <media_id> came from an API
    from_api = request.args.get('search')

    # Check <media> in local DB
    search = {'id': media_id}
    if from_api:
        search = {'api_id': media_id}
    media = models[0].query.filter_by(**search).first()

    # If not <media> and <api_id>: Add <media> to DB, else abort.
    if not media:
        if from_api:
            API_model = ApiData.get_API_model(media_type)
            try:
                media = API_model(API_id=media_id).save_media_to_db()
                db.session.commit()
            except Exception as e:
                flash('Sorry, a problem occured trying to load the media info. Please try again later.', 'warning')
                app.logger.error('[ERROR] - Occured trying to add media ({}) ID [{}] to DB: {}'
                                 .format(list_type.value, media_id, e))
                location = request.referrer or '/'
                return redirect(location)
        else:
            abort(400)

    # If <media> and <api_id>: redirect for URL with media.id instead of media.api_id
    if media and from_api:
        return redirect(url_for('main.media_sheet', media_type=media_type.value, media_id=media.id))

    # Get the list info of the user on this media
    list_info = media.get_user_list_info()

    # Get the HTML template
    template = models[0].media_sheet_template()

    return render_template(template, title=media.name, media=media, list_info=list_info, media_list=list_type.value)


@bp.route("/media_sheet_form/<media_type>/<media_id>", methods=['GET', 'POST'])
@login_required
def media_sheet_form(media_type, media_id):
    if current_user.role == RoleType.USER:
        abort(403)

    # Check if <media_type> is valid
    try:
        models = get_models_group(MediaType(media_type))
    except ValueError:
        return abort(400)

    # Get the media and check if it exists
    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        flash("The media does not exist.", 'warning')
        return redirect(request.referrer or '/')

    # Class which converts the attributs of a <SQLAlchemy_model> to a <FlaskForm>
    class Form(ModelForm):
        class Meta:
            csrf = False
            model = models[0]
            only = models[0].form_only()
        image_cover = StringField('insert an img URL')

        # If the media is a book also display a genre attr
        if media_type == 'Books':
            genre_attr = SelectMultipleField('Genres',
                                             choices=[('Action & Adventure', 'Action & Adventure'),
                                         ('Biography', 'Biography'), ('Chick lit', 'Chick lit'),
                                         ('Children', 'Children'), ('Classic', 'Classic'), ('Crime', 'Crime'),
                                         ('Drama', 'Drama'), ('Dystopian', 'Dystopian'), ('Fantastic', 'Fantastic'),
                                         ('Fantasy', 'Fantasy'), ('History', 'History'), ('Humor', 'Humor'),
                                         ('Horror', 'Horror'), ('Mystery', 'Mystery'), ('Paranormal', 'Paranormal'),
                                         ('Philosophy', 'Philosophy'), ('Poetry', 'Poetry'), ('Romance', 'Romance'),
                                         ('Science', 'Science'), ('Science-Fiction', 'Science-Fiction'),
                                         ('Short story', 'Short story'), ('Suspense', 'Suspense'),
                                         ('Thriller', 'Thriller'), ('Western', 'Western'),
                                         ('Young adult', 'Young adult')])

    # Populate the form with the model data except for the <image_cover>
    form = Form(obj=media)
    if request.method == 'GET':
        form.image_cover.data = None

    genres = None
    if media_type == 'Books':
        genres = db.session.query(func.group_concat(BooksGenre.genre.distinct())) \
            .filter(BooksGenre.media_id == media_id).first()

    if form.is_submitted():
        if form.image_cover.data == "":
            picture_fn = media.image_cover
        else:
            picture_fn = secrets.token_hex(8) + '.jpg'
            picture_path = Path(app.root_path, f"static/covers/{media_type.lower()}_covers", picture_fn)
            try:
                urlretrieve(f"{form.image_cover.data}", f"{picture_path}")
                img = Image.open(f"{picture_path}")
                img = img.resize((300, 450), Image.ANTIALIAS)
                img.save(f"{picture_path}", quality=90)
            except Exception as e:
                app.logger.error(f"[SYSTEM] - Error occured updating media cover: {e}")
                flash(str(e), 'warning')
                picture_fn = media.image_cover
        form.image_cover.data = picture_fn
        form.populate_obj(media)
        db.session.add(media)
        db.session.commit()

        # If media_type is Books check the genre form.
        if media_type == 'Books':
            if form.genre_attr.data:
                try:
                    BooksGenre.query.filter(BooksGenre.media_id == media_id).delete()
                    for genre in form.genre_attr.data[:5]:
                        adding = BooksGenre(genre=genre, media_id=media_id)
                        db.session.add(adding)
                    db.session.commit()
                    flash('Data successfully updated.', 'success')
                except:
                    db.session.rollback()
                    flash('Error while updating the genres.', 'warning')

        return redirect(url_for('main.media_sheet', media_type=media_type, media_id=media_id))

    return render_template('media_sheet_form.html', title='Media Form', form=form, genres=genres, media_type=media_type)


@bp.route("/your_next_airing", methods=['GET', 'POST'])
@login_required
def your_next_airing():
    next_series_airing = get_next_airing(ListType.SERIES)
    next_anime_airing = get_next_airing(ListType.ANIME)
    next_movies_airing = get_next_airing(ListType.MOVIES)

    series_dates = []
    for series in next_series_airing:
        series_dates.append(change_air_format(series[0].next_episode_to_air))

    anime_dates = []
    for anime in next_anime_airing:
        anime_dates.append(change_air_format(anime[0].next_episode_to_air))

    movies_dates = []
    for movies in next_movies_airing:
        movies_dates.append(change_air_format(movies[0].release_date))

    return render_template('your_next_airing.html', title='Your next airing', airing_series=next_series_airing,
                           series_dates=series_dates, airing_anime=next_anime_airing, anime_dates=anime_dates,
                           airing_movies=next_movies_airing, movies_dates=movies_dates)


@bp.route('/search_media', methods=['GET', 'POST'])
@login_required
def search_media():
    search = request.args.get('search')
    media_select = request.args.get('media_select')
    page = request.args.get('page', 1)

    if media_select == "TMDB":
        try:
            Api_data = TMDBMixin()
            Api_data.search(search, page=page)
            media_results, total_results, total_pages = Api_data.get_search_list()
        except Exception as e:
            app.logger.error(f"[SYSTEM] - Error requesting the TMDb API: {str(e)}")
            flash('Sorry, an error occured, the TMDb API is unreachable for now.', 'warning')
            return redirect(request.referrer or '/')
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
                                         User.role != RoleType.ADMIN, User.active == True).paginate(page, 10,
                                                                                                    error_out=True)
        media_results = []
        for user in users_search.items:
            user_data = {'name': user.username,
                         'poster_path': '/static/profile_pics/' + user.image_file,
                         'register': datetime.strftime(user.registered_on, '%d %b %Y'),
                         'media': 'User',
                         'level': user.get_frame_info()}
            media_results.append(user_data)
            total_pages = users_search.pages
            total_results = users_search.total
    else:
        return redirect(request.referrer or '/')

    if len(media_results) == 0:
        flash('Sorry, no results found for your query.', 'warning')
        return redirect(request.referrer or '/')

    return render_template("media_search.html", title="Search", results=media_results, media_select=media_select,
                           tot_res=total_results, search=search, page=page, tot_pages=total_pages)


@bp.route('/graph_test', methods=['GET', 'POST'])
@login_required
def test_graph_date():
    series_data = UserLastUpdate.query.filter_by(user_id=3, media_type=ListType.SERIES)\
        .group_by(UserLastUpdate.date).all()

    all_dates = {}
    for d in series_data:
        try:
            date = d.date.strftime('%b-%Y')
            if d.new_status == Status.COMPLETED:
                if all_dates.get('{}'.format(date)) is not None:
                    all_dates['{}'.format(date)] += 1
                else:
                    all_dates['{}'.format(date)] = 1
        except:
            pass

    series_labels = ", ".join([k for k in all_dates.keys()])
    series_data = ", ".join([str(k) for k in all_dates.values()])

    anime_data = UserLastUpdate.query.filter_by(user_id=3, media_type=ListType.ANIME) \
        .group_by(UserLastUpdate.date).all()

    all_dates = {}
    for d in anime_data:
        try:
            date = d.date.strftime('%b-%Y')
            if d.new_status == Status.COMPLETED:
                if all_dates.get('{}'.format(date)) is not None:
                    all_dates['{}'.format(date)] += 1
                else:
                    all_dates['{}'.format(date)] = 1
        except:
            pass

    anime_labels = ", ".join([k for k in all_dates.keys()])
    anime_data = ", ".join([str(k) for k in all_dates.values()])

    movies_data = UserLastUpdate.query.filter_by(user_id=3, media_type=ListType.MOVIES)\
        .group_by(UserLastUpdate.date).all()

    all_dates = {}
    for d in movies_data:
        try:
            date = d.date.strftime('%b-%Y')
            if d.new_status == Status.COMPLETED:
                if all_dates.get('{}'.format(date)) is not None:
                    all_dates['{}'.format(date)] += 1
                else:
                    all_dates['{}'.format(date)] = 1
        except:
            pass

    movies_labels = ", ".join([k for k in all_dates.keys()])
    movies_data = ", ".join([str(k) for k in all_dates.values()])

    games_data = UserLastUpdate.query.filter_by(user_id=3, media_type=ListType.GAMES)\
        .group_by(UserLastUpdate.date).all()

    all_dates = {}
    for d in games_data:
        try:
            date = d.date.strftime('%b-%Y')
            if d.new_status == Status.COMPLETED:
                if all_dates.get('{}'.format(date)) is not None:
                    all_dates['{}'.format(date)] += 1
                else:
                    all_dates['{}'.format(date)] = 1
        except:
            pass

    games_labels = ", ".join([k for k in all_dates.keys()])
    games_data = ", ".join([str(k) for k in all_dates.values()])

    return render_template('graph_test.html', title='Graph_test', series_labels=series_labels, series_data=series_data,
                           anime_labels=anime_labels, anime_data=anime_data, games_labels=games_labels,
                           games_data=games_data, movies_labels=movies_labels, movies_data=movies_data)


# --- AJAX Methods -----------------------------------------------------------------------------------------------


@bp.route('/update_season', methods=['POST'])
@login_required
def update_season():
    try:
        json_data = request.get_json()
        new_season = int(json_data['season']) + 1
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except:
        return '', 400

    # Check if the <media> exists in <media_list>
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Check if the season number is between 1 and <last_season>
    if 1 > new_season or new_season > media.media.eps_per_season[-1].season:
        return '', 400

    # Get the old data
    old_season = media.current_season
    old_episode = media.last_episode_watched
    old_total = media.total

    # Set the new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:new_season-1]]) + 1
    media.current_season = new_season
    media.last_episode_watched = 1
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] - [{media_list}] - [ID {media_id}] season updated to {new_season}")

    # Set the last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=list_type, old_season=old_season,
                                   new_season=new_season, new_episode=1, old_episode=old_episode)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit the changes
    db.session.commit()

    return '', 204


@bp.route('/update_episode', methods=['POST'])
@login_required
def update_episode():
    try:
        json_data = request.get_json()
        new_episode = int(json_data['episode']) + 1
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check if the media exists
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Check if the episode number is between 1 and <last_episode>
    if 1 > new_episode or new_episode > media.media.eps_per_season[media.current_season - 1].episodes:
        return '', 400

    # Get the old data
    old_season = media.current_season
    old_episode = media.last_episode_watched
    old_total = media.total

    # Set the new data
    new_watched = sum([x.episodes for x in media.media.eps_per_season[:old_season-1]]) + new_episode
    media.last_episode_watched = new_episode
    new_total = new_watched + (media.rewatched * media.media.total_episodes)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] {list_type} [ID {media_id}] episode updated to {new_episode}")

    # Set the last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=list_type, old_season=old_season,
                                   new_season=old_season, old_episode=old_episode, new_episode=new_episode)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit the changes
    db.session.commit()

    return '', 204


@bp.route('/update_page', methods=['POST'])
@login_required
def update_page():
    try:
        json_data = request.get_json()
        new_page = int(json_data['page'])
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check if the media exists
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Check if the page number is between 0 and max(pages)
    if new_page > int(media.media.pages) or new_page < 0:
        return "'The page value can't be below 0 or greater than the max pages.", 400

    # Get the old data
    old_page = media.actual_page
    old_total = media.total

    # Set the new data
    media.actual_page = new_page
    new_total = new_page + (media.rewatched * media.media.pages)
    media.total = new_total
    app.logger.info(f"[User {current_user.id}] {list_type} [ID {media_id}] page updated to {new_page}")

    # Set the last updates
    # UserLastUpdate.set_last_update(media=media.media, media_type=list_type)

    # Compute new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit the changes
    db.session.commit()

    return '', 204


@bp.route('/update_playtime', methods=['POST'])
@login_required
def update_playtime():
    try:
        json_data = request.get_json()
        new_playtime = int(json_data['playtime'])*60    # To get minutes
        media_id = int(json_data['media_id'])
        media_list = json_data['media_type']
    except:
        return '', 400

    if new_playtime < 0:
        return '', 400

    # Check if <media_list> exist and valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Set the last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=list_type, old_playtime=media.playtime,
                                   new_playtime=new_playtime)

    # Compute the new time spent
    media.compute_new_time_spent(new_data=new_playtime)

    # Update new playtime
    media.playtime = new_playtime

    # Commit the changes
    db.session.commit()
    app.logger.info(f"[{current_user.id}] Games ID {media_id} playtime updated to {new_playtime}")

    return '', 204


@bp.route('/update_category', methods=['POST'])
@login_required
def update_category():
    try:
        json_data = request.get_json()
        media_new_cat = json_data['status']
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except:
        return '', 400

    # Check the <status> parameter
    try:
        new_status = Status(media_new_cat)
    except:
        return '', 400

    # Get the media
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Change the <status> and get the data to compute <last_updates> and <new_time_spent>
    try:
        old_total = media.total
    except:
        old_total = media.playtime
    old_status = media.status
    new_total = media.category_changes(new_status)

    # Set the last updates
    UserLastUpdate.set_last_update(media=media.media, media_type=list_type, old_status=old_status,
                                   new_status=new_status)

    # Compute the new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit the session
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {list_type}'s category [ID {media_id}] changed to {new_status}")

    return '', 204


@bp.route('/update_score', methods=['POST'])
@login_required
def update_score():
    try:
        json_data = request.get_json()
        new_score = json_data['score']
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check that <new_score> is '---' or between [0-10]
    try:
        if 0 > float(new_score) or float(new_score) > 10:
            return '', 400
    except:
        new_score = -1

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Set the new data
    media.score = new_score
    app.logger.info(f"[{current_user.id}] Series ID {media_id} score updated to {new_score}")

    # Commit the changes
    db.session.commit()

    return '', 204


@bp.route('/update_feeling', methods=['POST'])
@login_required
def update_feeling():
    try:
        json_data = request.get_json()
        new_feeling = json_data['feeling']
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <media_list> exist and valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check that <new_feeling> is null or between 1 and 4
    try:
        if 0 > int(new_feeling) or int(new_feeling) > 5:
            return '', 400
    except:
        new_feeling = None

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Set the new data
    media.feeling = new_feeling
    app.logger.info(f"[{current_user.id}] Media ID {media_id} feeling updated to {new_feeling}")

    # Commit the changes
    db.session.commit()

    return '', 204


@bp.route('/update_rewatch', methods=['POST'])
@login_required
def update_rewatch():
    try:
        json_data = request.get_json()
        new_rewatch = int(json_data['rewatch'])
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if the <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check that <new_rewatch> is between [0-10]
    if 0 > new_rewatch > 10:
        return '', 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media or media.status != Status.COMPLETED:
        return '', 400

    # Update rewatch and total data watched
    old_total = media.total
    new_total = media.update_total_watched(new_rewatch)

    # Compute the new time spent
    media.compute_new_time_spent(old_data=old_total, new_data=new_total)

    # Commit the changes
    db.session.commit()
    app.logger.info('[{}] Media ID {} rewatched {}x times'.format(current_user.id, media_id, new_rewatch))

    return '', 204


@bp.route('/add_favorite', methods=['POST'])
@login_required
def add_favorite():
    try:
        json_data = request.get_json()
        media_id = int(json_data['element_id'])
        media_list = json_data['element_type']
        favorite = bool(json_data['favorite'])
    except:
        return '', 400

    # Check if the <media_list> exist and is valid
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except ValueError:
        return '', 400

    # Check if the <media_id> is in the current user's list
    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    # Add <favorite> and commit the changes
    media.favorite = favorite
    db.session.commit()

    return '', 204


@bp.route('/add_element', methods=['POST'])
@login_required
def add_element():
    try:
        json_data = request.get_json()
        media_id = json_data['element_id']
        media_list = json_data['element_type']
        media_cat = json_data['element_cat']
    except:
        return '', 400

    # Check <media_list>
    try:
        list_type = ListType(media_list)
        models = get_models_group(list_type)
    except:
        return '', 400

    # Check <status> parameter
    try:
        new_status = Status(media_cat)
    except:
        return '', 400

    # Check that the <media> is not in the user's list
    in_list = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if in_list:
        return '', 400

    # Check if <media> exists
    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        return '', 400

    # Add the media to the user
    new_watched = media.add_media_to_user(new_status)

    # Commit the changes
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {list_type} Added [ID {media_id}] in the category: {new_status}")

    # Set the last update
    UserLastUpdate.set_last_update(media=media, media_type=list_type, new_status=new_status)

    # Compute new time spent
    in_list = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    in_list.compute_new_time_spent(new_data=new_watched)

    # Commit the last updates and the new time spent changes
    db.session.commit()

    return '', 204


@bp.route('/delete_element', methods=['POST'])
@login_required
def delete_element():
    try:
        json_data = request.get_json()
        media_id = int(json_data['delete'])
        media_list = json_data['element_type']
    except:
        return '', 400

    # Check if <list_type> exist and is valid
    try:
        models = get_models_group(ListType(media_list))
    except:
        return '', 400

    media = models[1].query.filter_by(user_id=current_user.id, media_id=media_id).first()
    if not media:
        return '', 400

    try:
        old_total = media.total
    except:
        old_total = media.playtime

    media.compute_new_time_spent(old_data=old_total, new_data=0)

    # Delete the media from the user's list
    db.session.delete(media)
    db.session.commit()
    app.logger.info(f"[User {current_user.id}] {media_list} [ID {media_id}] successfully removed.")

    return '', 204


@bp.route('/lock_media', methods=['POST'])
@login_required
def lock_media():
    try:
        json_data = request.get_json()
        media_id = json_data['element_id']
        media_list = json_data['element_type']
        lock_status = bool(json_data['lock_status'])
    except:
        return '', 400

    # Check if the user is admin or manager
    if current_user.role == RoleType.USER:
        return '', 403

    # Check if <list_type> exist and is valid
    try:
        models = get_models_group(ListType(media_list))
    except:
        return '', 400

    media = models[0].query.filter_by(id=media_id).first()
    if not media:
        return '', 400

    media.lock_status = lock_status
    db.session.commit()
    app.logger.info(f"{media_list} [ID {media_id}] successfully locked.")

    return '', 204


@bp.route('/autocomplete', methods=['GET'])
@login_required
def autocomplete():
    search = request.args.get('q')
    media_select = request.args.get('media_select')

    if media_select == 'TMDB':
        try:
            Api_data = TMDBMixin()
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

        # query = Books.query.filter(Books.name.like(f"%{search}%")).all()
        # media_results = []
        # for b in query:
        #     try:
        #         date = datetime.strftime(datetime.strptime(b.release_date, '%m/%d/%y'), '%d %b %Y')
        #     except:
        #         date = b.release_date
        #     media_results.append({'api_id': b.id,
        #                           'display_name': b.name,
        #                           'image_cover': '/static/covers/books_covers/' + b.image_cover,
        #                           'date': date,
        #                           'category': 'Books',
        #                           'type': 'Books'})
    elif media_select == 'users':
        media_results = User.get_autocomplete_list(search)
    else:
        return request.referrer or '/'

    if len(media_results) == 0:
        return jsonify(search_results=[{'nb_results': 0, 'category': None}]), 200

    media_results = sorted(media_results, key=lambda i: i['category'])

    return jsonify(search_results=media_results), 200


@bp.route('/read_notifications', methods=['GET'])
@login_required
def read_notifications():
    # Change the last time the <current_user> looked at the notifications and commit the changes
    current_user.last_notif_read_time = datetime.utcnow()
    db.session.commit()

    # Get the user's notfications
    notifications = current_user.get_notifications()

    results = []
    if notifications:
        for info in notifications:
            timestamp = info.timestamp.replace(tzinfo=pytz.UTC).isoformat()
            results.append({'media_type': info.media_type,
                            'media_id': info.media_id,
                            'timestamp': timestamp,
                            'payload': json.loads(info.payload_json)})

    return jsonify(results=results), 200
