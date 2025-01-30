from typing import List, Optional

import click
from flask import current_app

from backend.cli.managers.achievements import CLIAchievementManager


achievement_manager = CLIAchievementManager()
ach_cli = click.Group("ach", help="Achievement management commands")
current_app.cli.add_command(ach_cli)


@ach_cli.command()
def seed():
    """ Seed and calculate achievements. """
    achievement_manager.seed_achievements()


@ach_cli.command()
def code_names():
    """ List all the code names. """
    achievement_manager.get_code_names()


@ach_cli.command()
@click.argument("code_name")
@click.option("--name", "-n", type=str, help="Updated name")
@click.option("--description", "-d", type=str, help="Updated description")
def update_def(code_name: str, name: Optional[str] = None, description: Optional[str] = None):
    """ Update an achievement def. """
    achievement_manager.update_achievement_definition(code_name, name, description)


@ach_cli.command()
@click.argument("code_name")
@click.argument("tier")
@click.argument("criteria")
def update_tier(code_name: str, tier: str, criteria: str):
    """ Update the tier of an achievement and recalculate. """
    achievement_manager.update_achievement_tier(code_name, tier, criteria)


@ach_cli.command()
@click.option("--code-names", "-c", multiple=True, help="List of achievement code names")
@click.option("--user-ids", "-u", multiple=True, type=int, help="List of user IDs")
@click.option("--all-users", "-a", is_flag=True, help="Calculate for all users")
@click.option("--active-users", "-t", is_flag=True, help="Calculate for users active in the last 24 hours")
def calculate(code_names: List[str], user_ids: List[int], all_users: bool, active_users: bool):
    """ Calculates achievements based on options. """

    if not code_names:
        code_names = "all"

    if not user_ids or active_users:
        user_ids = "active"

    if all_users:
        user_ids = "all"

    achievement_manager.calculate_achievements(code_names, user_ids)
