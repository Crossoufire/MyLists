from backend.api.models import MediadleStats
from backend.cli.managers._base import CLIBaseManager


class CLIMediadleManager(CLIBaseManager):
    def show_mediadle_stats(self):
        stats = MediadleStats.query.all()

        table = self.create_table(
            title="Moviedle Stats",
            columns=["Username", "Average Attempts", "Streak", "Best Streak", "Total Won", "Total Played"],
        )

        for stat in stats:
            try:
                table.add_row(
                    stat.user.username,
                    str(stat.average_attempts),
                    str(stat.streak),
                    str(stat.best_streak),
                    str(stat.total_won),
                    str(stat.total_played),
                )
            except:
                pass

        self.print_table(table)
