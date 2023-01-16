"""
Flask_forms models for auth routes
"""

from MyLists.models import User
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, EqualTo, Length, Email, ValidationError


class RegistrationForm(FlaskForm):
    """ Registration """

    register_username = StringField("Username", validators=[DataRequired(), Length(min=3, max=15)])
    register_email = StringField("Email", validators=[DataRequired(), Email()])
    register_password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])
    register_confirm_password = PasswordField("Confirm Password",
                                              validators=[DataRequired(), EqualTo("register_password")])
    register_submit = SubmitField("Register")

    # noinspection PyMethodMayBeStatic
    def validate_register_username(self, field):
        """ validate the username to be registered """

        user = User.query.filter_by(username=field.data).first()
        if user:
            raise ValidationError("This username is already taken. Please choose another one.")

    # noinspection PyMethodMayBeStatic
    def validate_register_email(self, field):
        """ Validate registerer email """

        user = User.query.filter_by(email=field.data).first()
        if user:
            raise ValidationError("This email already exist.")


class LoginForm(FlaskForm):
    """ Login Form """

    login_username = StringField('Username', validators=[DataRequired()])
    login_password = PasswordField('Password', validators=[DataRequired()])
    login_remember = BooleanField('Remember me')
    login_submit = SubmitField('Login')


class ResetPasswordRequestForm(FlaskForm):
    """ Reset Password Request Form """

    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Request password reset')

    # noinspection PyMethodMayBeStatic
    def validate_email(self, email):
        """ Validate email after reset password """

        user = User.query.filter_by(email=email.data).first()
        if not user:
            raise ValidationError('There is no account with this email.')


class ResetPasswordForm(FlaskForm):
    """ Reset Password Form """

    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Reset password')
