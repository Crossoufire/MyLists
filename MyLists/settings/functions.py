"""
Classes and functions for the settings route
"""

import imghdr
import os
import secrets
from pathlib import Path
from flask import url_for
from flask_mail import Message
from MyLists import app, mail


def save_account_picture(form_picture, old_picture, profile=True):
    """ Save the account picture either profile or background """

    if imghdr.what(form_picture) == "gif" or imghdr.what(form_picture) == "jpeg" \
            or imghdr.what(form_picture) == "png" or imghdr.what(form_picture) == "tiff":

        # Get image in new var
        file = form_picture

        # Create random name
        random_hex = secrets.token_hex(8)

        # Split extension
        _, f_ext = os.path.splitext(form_picture.filename)

        # Create picture filename
        picture_fn = random_hex + f_ext

        if profile:
            file.save(os.path.join(app.root_path, "static/profile_pics", picture_fn))
        else:
            file.save(os.path.join(app.root_path, "static/background_pics", picture_fn))
    else:
        picture_fn = "default.jpg"
        app.logger.error(f"[SYSTEM] Invalid picture format: {imghdr.what(form_picture)}")

    try:
        if old_picture != "default.jpg":
            if profile:
                os.remove(os.path.join(app.root_path, "static/profile_pics", old_picture))
                app.logger.info(f"Settings updated: Removed the old picture: {old_picture}")
            else:
                os.remove(os.path.join(app.root_path, "static/background_pics", old_picture))
                app.logger.info(f'Settings updated: Removed the old background: {old_picture}')
    except:
        pass

    return picture_fn


def send_email_update_email(user):
    """ Send email to user to update its email adress """

    # Fetch token
    token = user.get_token()

    # Message to send
    msg = Message(subject="MyList - Email update request",
                  sender=app.config["MAIL_USERNAME"],
                  recipients=[user.transition_email],
                  bcc=[app.config["MAIL_USERNAME"]],
                  reply_to=app.config["MAIL_USERNAME"])

    # Get path and replace in template
    path = Path(app.root_path, "static/emails/email_update.html")
    email_template = open(path).read().replace("{1}", user.username)
    email_template = email_template.replace("{2}", url_for('email_update_token', token=token, _external=True))

    # Add mail to instance
    msg.html = email_template

    # Send mail
    mail.send(msg)
