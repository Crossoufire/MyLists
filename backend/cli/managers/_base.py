from functools import wraps
import sys

from flask import current_app
from rich.console import Console
from rich.table import Table
from rich.text import Text


console = Console()


def with_console_status(message="Working..."):
    """ Wrapper adding a loading spinner and message to console output """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with console.status(message):
                return func(*args, **kwargs)

        return wrapper

    return decorator


class CLIBaseManager:
    def __init__(self):
        self.is_terminal = sys.stdin.isatty()
        self.console = console

    @staticmethod
    def _log_table(rich_table: Table):
        """ Generate an ascii formatted presentation of a Rich table. Removes any column styling """

        with console.capture() as capture:
            console.print(rich_table)
        return Text.from_ansi(capture.get())

    @staticmethod
    def create_table(title: str, columns: list) -> Table:
        table = Table(title=title)
        for column in columns:
            table.add_column(column)
        return table

    def print_table(self, table: Table):
        if self.is_terminal:
            console.print(table)
        else:
            current_app.logger.info(f"\n{self._log_table(table)}")

    def log_success(self, message: str):
        if self.is_terminal:
            console.print(f"[green]✓[/green] {message}")
        else:
            current_app.logger.info(f"SUCCESS: {message}")

    def log_info(self, message: str):
        if self.is_terminal:
            console.print(f"[blue]i[/blue] {message}")
        else:
            current_app.logger.info(message)

    def log_error(self, message: str):
        if self.is_terminal:
            console.print(f"[red]✗[/red] {message}")
        else:
            current_app.logger.error(message)

    def log_warning(self, message: str):
        if self.is_terminal:
            console.print(f"[yellow]![/yellow] {message}")
        else:
            current_app.logger.warning(message)

    def log_debug(self, message: str):
        if self.is_terminal:
            console.print(f"[magenta]DEBUG[/magenta] {message}")
        else:
            current_app.logger.debug(message)
