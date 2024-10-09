import click
from flask import current_app

from backend.cli.commands.user_commands import delete_users
from backend.cli.managers.system_manager import CLISystemManager
from backend.cli.commands.media_commands import (remove_media, remove_covers, bulk_refresh, add_notifications, movies_locking,
                                                 compute_media_time)


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
@click.pass_context
def scheduled_tasks(ctx):
    """ Run daily scheduled tasks. """

    ctx.forward(delete_users)

    ctx.forward(remove_media)
    ctx.forward(remove_covers)
    ctx.forward(bulk_refresh)
    ctx.forward(add_notifications)
    ctx.forward(movies_locking)
    ctx.forward(compute_media_time)

    ctx.forward(update_stats)
    ctx.forward(vacuum_db)
    ctx.forward(analyze_db)
