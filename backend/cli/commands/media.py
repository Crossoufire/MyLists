import click
from flask import current_app

from backend.api.utils.enums import MediaType
from backend.cli.managers.media import CLIMediaManager


media_cli = click.Group("media", help="Media management commands")
current_app.cli.add_command(media_cli)


@media_cli.command()
def remove_media():
    """ Remove all non-associated media. """
    CLIMediaManager.remove_all_non_list_media()


@media_cli.command()
def bulk_refresh():
    """ Mediadata Bulk Refresh. """
    CLIMediaManager.bulk_all_media_refresh()


@media_cli.command()
def remove_covers():
    """ Remove old covers. """
    CLIMediaManager.remove_all_old_media_covers()


@media_cli.command()
def add_notifications():
    """ Update notifications. """
    CLIMediaManager.add_all_media_notifications()


@media_cli.command()
def movies_locking():
    """ Lock old movies. """
    media_manager = CLIMediaManager.get_manager(MediaType.MOVIES)
    media_manager().automatic_locking()


@media_cli.command()
def compute_media_time():
    """ Compute time spent. """
    CLIMediaManager.compute_all_time_spent()


@media_cli.command()
def compute_users_stats():
    """ Compute users lists stats. """
    CLIMediaManager.compute_all_users_stats()
