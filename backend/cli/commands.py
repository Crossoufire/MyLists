import click
from backend.cli.tasks import *


def create_cli_commands():
    """ Register the commands to the Flask CLI """

    @current_app.cli.command()
    def analyze_db():
        """ Perform ANALYZE on SQLite db """
        db.session.execute(text("ANALYZE"))
        click.echo("ANALYZE operation completed successfully")

    @current_app.cli.command()
    def vacuum_db():
        """ Perform VACUUM on SQLite db """
        db.session.execute(text("ANALYZE"))
        click.echo("VACUUM operation completed successfully")

    @current_app.cli.command()
    @click.argument("days", type=int, default=180)
    def active_users(days: int):
        """ Count the number of active users """
        get_active_users(days=days)

    @current_app.cli.command()
    def corrections():
        """ Diverse sets of corrections to apply """
        correct_random_and_ptw_data()
        correct_medialist_duplicates()

    @current_app.cli.command()
    @click.argument("value", type=bool, default=True)
    def update_modal(value: bool):
        """ Reactivate the update modal for all Users """
        reactivate_update_modal(value)

    @current_app.cli.command()
    def remove_media():
        """ Remove all media not present in User list from database and disk """
        remove_non_list_media()

    @current_app.cli.command()
    def auto_refresh():
        """ Automatically refresh the media using the appropriate API """
        automatic_media_refresh()

    @current_app.cli.command()
    def remove_covers():
        """ Remove all the old covers on disk if they are not present anymore in the database """
        remove_all_old_covers()

    @current_app.cli.command()
    def add_notifications():
        """ Update notifications """
        add_media_related_notifications()

    @current_app.cli.command()
    def movies_locking():
        """ Automatically lock the movies that are more than about 6 months old """
        automatic_movies_locking()

    @current_app.cli.command()
    def compute_media_time():
        """ Compute the total time watched/played/read for each media type for each user. """
        compute_media_time_spent()

    @current_app.cli.command()
    def update_stats():
        """ Update the MyLists global stats """
        update_Mylists_stats()

    @current_app.cli.command()
    def update_igdb_key():
        """ Update the IGDB API Token - Server needs to restart to take effect. """
        update_igdb_api_token()

    @current_app.cli.command()
    def scheduled_tasks():
        """ Run all the necessary scheduled jobs """
        remove_non_list_media()
        remove_all_old_covers()
        automatic_media_refresh()
        add_media_related_notifications()
        automatic_movies_locking()
        compute_media_time_spent()
        update_Mylists_stats()
        vacuum_db()
        analyze_db()
