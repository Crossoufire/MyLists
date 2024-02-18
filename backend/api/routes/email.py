from threading import Thread
from flask_mail import Message
from pathlib import Path
from backend.api import mail, db
from flask import current_app, Flask


def _send_async_email(app: Flask, user: db.Model, subject: str, template: str, callback: str):
    """ Send an email using a new thread to not block the main thread """

    with app.app_context():
        # Create token
        token = user.generate_jwt_token()

        # Get template HTML and replaces values
        path = Path(current_app.root_path, f"static/emails/{template}.html")
        email_template = open(path).read().replace("{1}", user.username)
        email_template = email_template.replace("{2}", f"<a href='{callback}/?token={token}'>click here</a>")

        # Create message object and send
        msg = Message(
            subject=f"MyLists - {subject}",
            sender=current_app.config["MAIL_USERNAME"],
            recipients=[user.email],
            html=email_template,
            bcc=[current_app.config["MAIL_USERNAME"]],
            reply_to=current_app.config["MAIL_USERNAME"],
        )

        mail.send(msg)


def send_email(user: db.Model, subject: str, template: str, callback: str):
    """ Create thread to send asynchronously the email """

    # noinspection PyUnresolvedReferences,PyProtectedMember
    app = current_app._get_current_object()
    thread = Thread(target=_send_async_email, args=(app, user, subject, template, callback))
    thread.start()

    return thread
