from typing import List

import click
from flask import current_app

from backend.api.utils.enums import Privacy
from backend.cli.managers.user import CLIUserManager, CLIUserDemoManager


user_manager = CLIUserManager()
user_cli = click.Group("user", help="User management commands")
current_app.cli.add_command(user_cli)


@user_cli.command()
def create_demo():
    """ Create a new demo account. """
    demo_manager = CLIUserDemoManager()
    demo_manager.create_account()


@user_cli.command()
@click.argument("username_or_id")
@click.argument("privacy", type=click.Choice([setting.value for setting in Privacy]))
def change_privacy(username_or_id: str | int, privacy: str):
    """ Change user privacy. """
    try:
        username_or_id = int(username_or_id)
    except ValueError:
        pass
    user_manager.change_privacy_setting(username_or_id, privacy)


@user_cli.command()
@click.option("--days", "-d", default=1, type=int, help="Days since last seen")
def active_users(days: int):
    """ Show active users. """
    user_manager.check_active_users(days=days)


@user_cli.command()
@click.argument("privacy", type=click.Choice([setting.value for setting in Privacy]))
def check_privacy(privacy: str):
    """ Check privacy settings """
    user_manager.check_privacy_settings(privacy)


@user_cli.command()
@click.argument("username_or_id")
@click.argument("active", type=bool)
def toggle_account(username_or_id: str | int, active: bool):
    """ Toggle user account """
    try:
        username_or_id = int(username_or_id)
    except ValueError:
        pass
    user_manager.toggle_account_active(username_or_id, active)


@user_cli.command()
@click.argument("usernames", nargs=-1)
def check_users(usernames: List[str]):
    """ Check specific users last seen. """
    user_manager.check_users_last_seen(usernames=list(usernames))


@user_cli.command()
@click.option("--days", "-d", default=7, type=int, help="Days before deletion")
def delete_users(days: int):
    """ Delete non-activated users. """
    user_manager.delete_non_activated_users(days=days)


@user_cli.command()
@click.argument("active", type=bool, default=True)
def toggle_features(active: bool):
    """ Toggle features for users. """
    user_manager.toggle_new_features_flag(active)


@user_cli.command()
def cum_users():
    """ Cumulative user count over time. """
    user_manager.get_user_over_time()
