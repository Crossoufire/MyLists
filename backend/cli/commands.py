import click
from sqlalchemy import text
from rich.table import Table
from rich.console import Console

from backend.api import db
from backend.cli.tasks import *


console = Console()


def register_cli_commands():
    """ Register commands to the Flask CLI """

    @current_app.cli.command()
    def caching():
        """ Display the current Flask-Caching configuration """

        cache_extension = current_app.extensions.get("cache", {})
        if not cache_extension:
            console.print("[bold red]Flask-caching was not found in the current app.[/bold red]")
            return

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Configuration Key", width=18)
        table.add_column("Value", style="bold")

        for cache_name, cache_instance in cache_extension.items():
            try:
                # Retrieve and display Redis cache client info if possible
                client_info = cache_instance._write_client.info().get("db0", {})
                for info_key, info_value in client_info.items():
                    formatted_key = f"[bold cyan]{info_key.upper()}[/bold cyan]"
                    if "avg_ttl" in info_key:
                        # Convert avg_ttl from [ms] to [h]
                        avg_ttl_hours = round(info_value / 3600000, 1)
                        formatted_key = f"[bold cyan]{info_key.upper()} (H)[/bold cyan]"
                        table.add_row(formatted_key, str(avg_ttl_hours))
                    else:
                        table.add_row(formatted_key, str(info_value))
            except:
                pass

        for config_key, config_value in current_app.config.items():
            if config_key.startswith("CACHE_"):
                table.add_row(config_key, str(config_value))

        console.print(table)

    @current_app.cli.command()
    def analyze_db():
        """ Run ANALYZE on SQLite. """
        db.session.execute(text("ANALYZE"))
        click.echo("ANALYZE operation completed successfully")

    @current_app.cli.command()
    def vacuum_db():
        """ Run VACUUM on SQLite. """
        db.session.execute(text("VACUUM"))
        click.echo("VACUUM operation completed successfully")

    @current_app.cli.command()
    @click.argument("days", type=int, default=180)
    def active_users(days: int):
        """ Count active users. """
        get_active_users(days=days)

    @current_app.cli.command()
    @click.argument("usernames", nargs=-1)
    def get_users(usernames: List[str]):
        """ Get users last seen. """
        get_users_last_seen(usernames=list(usernames))

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
    def bulk_refresh():
        """ Mediadata Bulk Refresh. """
        bulk_media_refresh()

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
    @click.argument("username", type=str)
    @click.argument("toggle", type=bool)
    def active_account(username: str, toggle: bool):
        """ Activate user account """
        activate_user_account(username, toggle)

    @current_app.cli.command()
    @click.pass_context
    def scheduled_tasks(ctx):
        """ Run scheduled tasks. """
        delete_non_activated_users()
        remove_non_list_media()
        remove_all_old_covers()
        bulk_media_refresh()
        add_media_related_notifications()
        automatic_movies_locking()
        compute_media_time_spent()
        update_Mylists_stats()
        ctx.forward(vacuum_db)
        ctx.forward(analyze_db)
