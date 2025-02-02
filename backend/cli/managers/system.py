import dotenv
from sqlalchemy import text
from flask import jsonify, current_app

from backend.api import cache, db, MediaType
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.services.stats.stats import MediaStatsService
from backend.cli.managers._base import CLIBaseManager, with_console_status


class CLISystemManager(CLIBaseManager):
    @with_console_status("Updating global stats...")
    def update_global_stats(self):
        """ Cache key names format taken from `backend.api.utils.functions.make_cache_key` """

        stats_service = MediaStatsService()
        for media_type in MediaType:
            # noinspection PyTypeChecker
            stats = stats_service.get_stats(media_type=media_type)
            stats["rating_system"] = "score"
            data = dict(stats=stats, settings=[{"media_type": m} for m in list(MediaType)])
            cache.set(f"stats_global_{media_type}", jsonify(data=data), timeout=86400)
            self.log_info(f"`stats_global_{media_type}` key successfully updated")

        stats = stats_service.get_stats(media_type=None)
        stats["rating_system"] = "score"
        data = dict(stats=stats, settings=[{"media_type": m} for m in list(MediaType)])
        cache.set("stats_global", jsonify(data=data), timeout=86400)
        self.log_info("`stats_global` key successfully updated")
        self.log_success("Global Stats successfully updated :)")

    @with_console_status("Updating IGDB token...")
    def update_igdb_token(self):
        with current_app.app_context():
            api_service = ApiServiceFactory.create(MediaType.GAMES)
            new_igdb_token = api_service.update_api_token(current_app.config["IGDB_API_KEY"])
            if new_igdb_token is None:
                self.log_error("IGDB API token could not be updated.")
                return
            dotenv_file = dotenv.find_dotenv()
            dotenv.set_key(dotenv_file, "IGDB_API_KEY", new_igdb_token)

        self.log_success("IGDB API token successfully updated")

    @with_console_status("Analyzing SQLite database...")
    def analyze_sqlite_db(self):
        db.session.execute(text("ANALYZE"))
        self.log_success("ANALYZE operation successfully completed")

    @with_console_status("Vacuuming SQLite database...")
    def vacuum_sqlite_db(self):
        db.session.execute(text("VACUUM"))
        self.log_success("VACUUM operation successfully completed")

    def caching(self):
        cache_extension = current_app.extensions.get("cache", {})
        if not cache_extension:
            self.log_error("Flask-caching was not found in the current app.")
            return

        table = self.create_table("Flask-Caching Configuration", ["Configuration Key", "Value"])

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

        self.print_table(table)
