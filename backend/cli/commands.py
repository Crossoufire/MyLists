import click
from sqlalchemy import text
from backend.api import db
from backend.cli.tasks import *


def create_cli_commands():
    """ Register commands to the Flask CLI """

    @current_app.cli.command()
    def analyze_db():
        """ Run ANALYZE on SQLite. """
        db.session.execute(text("ANALYZE"))
        click.echo("ANALYZE operation completed successfully")

    @current_app.cli.command()
    def vacuum_db():
        """ Run VACUUM on SQLite. """
        db.session.execute(text("ANALYZE"))
        click.echo("VACUUM operation completed successfully")

    @current_app.cli.command()
    @click.argument("days", type=int, default=180)
    def active_users(days: int):
        """ Count active users. """
        get_active_users(days=days)

    @current_app.cli.command()
    @click.argument("days", type=int, default=7)
    def delete_users(days: int):
        """ Delete non-activated users. """
        delete_non_activated_users(days=days)

    @current_app.cli.command()
    @click.argument("value", type=bool, default=True)
    def update_modal(value: bool):
        """ Toggle update modal. """
        reactivate_update_modal(value)

    @current_app.cli.command()
    def remove_media():
        """ Remove un-associated media. """
        remove_non_list_media()

    @current_app.cli.command()
    def auto_refresh():
        """ Mediadata Auto-Refresh. """
        automatic_media_refresh()

    @current_app.cli.command()
    def remove_covers():
        """ Remove old covers. """
        remove_all_old_covers()

    @current_app.cli.command()
    def add_notifications():
        """ Update notifications. """
        add_media_related_notifications()

    @current_app.cli.command()
    def movies_locking():
        """ Lock old movies. """
        automatic_movies_locking()

    @current_app.cli.command()
    def compute_media_time():
        """ Compute time spent. """
        compute_media_time_spent()

    @current_app.cli.command()
    def update_stats():
        """ Update MyLists stats. """
        update_Mylists_stats()

    @current_app.cli.command()
    def update_igdb_key():
        """ Update IGDB Token. """
        update_igdb_api_token()

    @current_app.cli.command()
    def scheduled_tasks():
        """ Run scheduled tasks. """
        delete_non_activated_users()
        remove_non_list_media()
        remove_all_old_covers()
        automatic_media_refresh()
        add_media_related_notifications()
        automatic_movies_locking()
        compute_media_time_spent()
        update_Mylists_stats()
        vacuum_db()
        analyze_db()
