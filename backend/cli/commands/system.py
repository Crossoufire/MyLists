import click
from flask import current_app

from backend.api.utils.enums import MediaType
from backend.cli.managers.media import CLIMediaManager
from backend.cli.managers.system import CLISystemManager
from backend.cli.managers.user import CLIUserManager


system_manager = CLISystemManager()
system_cli = click.Group("system", help="System management commands")
current_app.cli.add_command(system_cli)


@system_cli.command()
def analyze_db():
    """ Run ANALYZE on SQLite. """
    system_manager.analyze_sqlite_db()


@system_cli.command()
def vacuum_db():
    """ Run VACUUM on SQLite. """
    system_manager.vacuum_sqlite_db()


@system_cli.command()
def update_stats():
    """ Update MyLists stats. """
    system_manager.update_global_stats()


@system_cli.command()
def update_igdb():
    """ Update IGDB Token. """
    system_manager.update_igdb_token()


@current_app.cli.command()
def caching():
    """ Flask-Caching configuration """
    system_manager.caching()


@system_cli.command()
def scheduled_tasks():
    """ Run daily scheduled tasks. """

    user_manager = CLIUserManager()
    user_manager.delete_non_activated_users()

    CLIMediaManager.remove_all_non_list_media()
    CLIMediaManager.remove_all_old_media_covers()
    CLIMediaManager.bulk_all_media_refresh()
    CLIMediaManager.add_all_media_notifications()

    media_manager = CLIMediaManager.get_manager(MediaType.MOVIES)
    media_manager().automatic_locking()

    CLIMediaManager.compute_all_time_spent()
    CLIMediaManager.compute_all_users_stats()

    system_manager.update_global_stats()
    system_manager.vacuum_sqlite_db()
    system_manager.vacuum_sqlite_db()
