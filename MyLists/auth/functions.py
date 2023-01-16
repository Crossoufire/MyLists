"""
Functions for the auth routes
"""

import functools
from flask import redirect
from flask_login import current_user
from pathlib import Path
from flask import url_for
from MyLists import app, mail, db
from flask_mail import Message


def check_if_auth(func):
    """ Decorator to check if user is authenticated """

    @functools.wraps(func)
    def wrapper_auth(*args, **kwargs):
        """ current user authentification check """

        if current_user.is_authenticated:
            return redirect(url_for('users.account', username=current_user.username))

        return func(*args, **kwargs)

    return wrapper_auth


def send_reset_email(user: db.Model):
    """ Send a reset password email to user """

    # Fetch token
    token = user.get_token()

    # Create message using <flask_mail>
    msg = Message(
        subject="MyLists - Password reset request",
        sender=app.config["MAIL_USERNAME"],
        recipients=[user.email],
        bcc=[app.config["MAIL_USERNAME"]],
        reply_to=app.config["MAIL_USERNAME"],
    )

    # Get template HTML and replaces values
    path = Path(app.root_path, "static/emails/password_reset.html")
    email_template = open(path).read().replace("{1}", user.username)
    email_template = email_template.replace("{2}", url_for("auth.reset_password_token", token=token, _external=True))

    # Add template to html attribute
    msg.html = email_template

    # Send email
    mail.send(msg)


def send_register_email(user: db.Model):
    """ Send a register email to user """

    # Fetch token
    token = user.get_token()

    # Create message using <flask_mail>
    msg = Message(
        subject="MyLists - Register request",
        sender=app.config["MAIL_USERNAME"],
        recipients=[user.email],
        bcc=[app.config["MAIL_USERNAME"]],
        reply_to=app.config["MAIL_USERNAME"],
    )

    # Get template HTML and replaces values
    path = Path(app.root_path, "static/emails/register.html")
    email_template = open(path).read().replace("{1}", user.username)
    email_template = email_template.replace("{2}", url_for("auth.register_account_token", token=token, _external=True))

    # Add template to html attribute
    msg.html = email_template

    # Send email
    mail.send(msg)
