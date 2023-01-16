"""
Forms used in main routes
"""

from MyLists import db
from flask import request
from flask_wtf import FlaskForm
from flask_wtf.file import DataRequired
from wtforms_alchemy import model_form_factory
from wtforms import StringField, SubmitField, TextAreaField, SelectMultipleField


# Get base model from Factory
BaseModelForm = model_form_factory(FlaskForm)


class ModelForm(BaseModelForm):
    """ Form based on a SQL model """

    # noinspection PyMethodMayBeStatic
    def get_session(self):
        """ Get db session """

        return db.session


class GenreForm(FlaskForm):
    """ Genre form """

    # Create different genres
    genres = SelectMultipleField("Genres",
                                 choices=[('Action & Adventure', 'Action & Adventure'),
                                          ('Biography', 'Biography'),
                                          ('Chick lit', 'Chick lit'),
                                          ('Children', 'Children'),
                                          ('Classic', 'Classic'),
                                          ('Crime', 'Crime'),
                                          ('Drama', 'Drama'),
                                          ('Dystopian', 'Dystopian'),
                                          ('Essay', 'Essay'),
                                          ('Fantastic', 'Fantastic'),
                                          ('Fantasy', 'Fantasy'),
                                          ('History', 'History'),
                                          ('Humor', 'Humor'),
                                          ('Horror', 'Horror'),
                                          ('Literary Novel', 'Literary Novel'),
                                          ('Memoirs', 'Memoirs'),
                                          ('Mystery', 'Mystery'),
                                          ('Paranormal', 'Paranormal'),
                                          ('Philosophy', 'Philosophy'),
                                          ('Poetry', 'Poetry'),
                                          ('Romance', 'Romance'),
                                          ('Science', 'Science'),
                                          ('Science-Fiction', 'Science-Fiction'),
                                          ('Short story', 'Short story'),
                                          ('Suspense', 'Suspense'),
                                          ('Testimony', 'Testimony'),
                                          ('Thriller', 'Thriller'),
                                          ('Western', 'Western'),
                                          ('Young adult', 'Young adult')])


class CoverForm(FlaskForm):
    """ Get cover form"""

    image_cover = StringField('Insert an img URL')


class MediaComment(FlaskForm):
    """ Media comment """

    comment = TextAreaField('Comment')
    submit = SubmitField('Submit')


class SearchForm(FlaskForm):
    """ Search form """

    q = StringField("Search...", validators=[DataRequired()])

    def __init__(self, *args, **kwargs):
        if "formdata" not in kwargs:
            kwargs["formdata"] = request.args
        if "csrf_enabled" not in kwargs:
            kwargs["csrf_enabled"] = False
        super(SearchForm, self).__init__(*args, **kwargs)

