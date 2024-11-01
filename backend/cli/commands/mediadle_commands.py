import click
from flask import current_app

from backend.api import db
from backend.api.models import DailyMediadle, UserMediadleProgress, MediadleStats


mediadle = click.Group("mediadle", help="Mediadle management commands")
current_app.cli.add_command(mediadle)


@mediadle.command()
def reset():
    """ Reset the mediadle game """

    DailyMediadle.query.delete()
    UserMediadleProgress.query.delete()
    MediadleStats.query.delete()

    db.session.commit()
    click.echo("Mediadle game successfully reset.")
