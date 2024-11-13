from importlib import import_module
from pathlib import Path


def register_cli_commands():
    """ Register all CLI commands with the Flask application. """

    commands_path = Path(__file__).parent

    # Dynamically import all command modules
    for command_file in commands_path.glob("*_commands.py"):
        module_name = f"backend.cli.commands.{command_file.stem}"
        import_module(module_name)
