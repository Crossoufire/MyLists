from typing import List

import click
from flask import current_app

from backend.cli.managers.ach_manager import CLIAchievementManager


achievement_manager = CLIAchievementManager()
ach_cli = click.Group("ach", help="Achievement management commands")
current_app.cli.add_command(ach_cli)


@ach_cli.command()
def seed():
    """ Seed and calculate achievements. """
    achievement_manager.seed_achievements()


@ach_cli.command()
@click.argument("code_name")
@click.option("--name", "-n", type=str, help="Updated name")
@click.option("--description", "-d", type=str, help="Updated description")
def update_def(code_name: str, name: str = None, description: str = None):
    """ Update an achievement def. """
    achievement_manager.update_achievement_definition(code_name, name, description)


@ach_cli.command()
@click.argument("code_name")
@click.argument("tier")
@click.argument("criteria")
def update_tier(code_name: str, tier: str, criteria: str):
    """ Update the tier of an achievement and recalculate. """
    achievement_manager.update_tier_achievement(code_name, tier, criteria)


@ach_cli.command()
@click.option("--code_names", "-c", multiple=True, help="List of code names")
@click.option("--user_ids", "-u", multiple=True, help="List of user ids")
def calculate(code_names: List[str] | str = None, user_ids: List[int] | int = None):
    """ Calculates the achievements. """
    achievement_manager.calculate_achievements(code_names, user_ids)


@ach_cli.command()
@click.option("--media_type", "-m", help="show only selected media type code names")
def code_names(media_type: str):
    """ List the code names. """
    achievement_manager.get_code_names(media_type)
