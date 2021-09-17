from MyLists import db
from flask import request
from flask_wtf import FlaskForm
from flask_wtf.file import DataRequired
from wtforms_alchemy import model_form_factory
from wtforms import StringField, SubmitField, TextAreaField, SelectMultipleField


BaseModelForm = model_form_factory(FlaskForm)


class ModelForm(BaseModelForm):
    def get_session(self):
        return db.session


class GenreForm(FlaskForm):
    genres = SelectMultipleField('Genres',
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


class CoverForm(FlaskForm):
    image_cover = StringField('Insert an img URL')


class MediaComment(FlaskForm):
    comment = TextAreaField('Comment')
    submit = SubmitField('Submit')


class SearchForm(FlaskForm):
    q = StringField('Search...', validators=[DataRequired()])

    def __init__(self, *args, **kwargs):
        if 'formdata' not in kwargs:
            kwargs['formdata'] = request.args
        if 'csrf_enabled' not in kwargs:
            kwargs['csrf_enabled'] = False
        super(SearchForm, self).__init__(*args, **kwargs)

