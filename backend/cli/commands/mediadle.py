import click
from flask import current_app

from backend.cli.managers.mediadle import CLIMediadleManager


mediadle_manager = CLIMediadleManager()
mediadle = click.Group("mediadle", help="Mediadle management commands")
current_app.cli.add_command(mediadle)


@mediadle.command()
def check():
    """ Check all users mediadle stats. """
    mediadle_manager.show_mediadle_stats()
