from threading import Thread
from flask_mail import Message
from pathlib import Path
from backend.api import mail
from flask import current_app, Flask


def _send_async_email(app: Flask, to: str, username: str, subject: str, template: str, callback: str, token: str):
    """ Send an email using a new thread to not block the main thread """

    with app.app_context():
        path = Path(current_app.root_path, f"static/emails/{template}.html")
        with open(path) as fp:
            email_template = fp.read().replace("{1}", username)
            email_template = email_template.replace("{2}", f"<a href='{callback}/?token={token}'>click here</a>")

        msg = Message(
            subject=f"MyLists - {subject}",
            sender=current_app.config["MAIL_USERNAME"],
            recipients=[to],
            html=email_template,
            bcc=[current_app.config["MAIL_USERNAME"]],
            reply_to=current_app.config["MAIL_USERNAME"],
        )
        mail.send(msg)


def send_email(to: str, username: str, subject: str, template: str, callback: str, token: str):
    """ Create thread to send asynchronously the email """

    # noinspection PyProtectedMember,PyUnresolvedReferences
    app = current_app._get_current_object()
    thread = Thread(target=_send_async_email, args=(app, to, username, subject, template, callback, token))
    thread.start()

    return thread
