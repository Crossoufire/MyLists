import click
from sqlalchemy import or_
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from backend.api import db
from backend.cli.managers.media import CLIMediaManager
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import (UserAchievement, User, Token, followers, UserMediaSettings, UserMediaUpdate, Notifications,
                                MediadleStats, UserMediadleProgress)


media_cli = click.Group("media", help="Media management commands")
current_app.cli.add_command(media_cli)


@media_cli.command()
def remove_media():
    """ Remove all non-associated media. """
    CLIMediaManager.remove_all_non_list_media()


@media_cli.command()
def bulk_refresh():
    """ Mediadata Bulk Refresh. """
    CLIMediaManager.bulk_all_media_refresh()


@media_cli.command()
def remove_covers():
    """ Remove old covers. """
    CLIMediaManager.remove_all_old_media_covers()


@media_cli.command()
def add_notifications():
    """ Update notifications. """
    CLIMediaManager.add_all_media_notifications()


@media_cli.command()
def movies_locking():
    """ Lock old movies. """
    CLIMediaManager.movies_automatic_locking()


@media_cli.command()
def compute_media_time():
    """ Compute time spent. """
    CLIMediaManager.compute_all_time_spent()


@media_cli.command()
def compute_users_stats():
    """ Compute users lists stats. """
    CLIMediaManager.compute_all_users_stats()


@media_cli.command("cleanup")
@click.option("-d", "--dry-run", is_flag=True, help="Show what would be deleted without actually deleting")
def cleanup_orphans(dry_run: bool):
    """ Remove orphaned records that have no associated User. """
    print(f"{"DRY RUN: " if dry_run else ""}Starting orphaned records cleanup")

    try:
        users = db.session.query(User.id).all()
        user_ids = [u[0] for u in users]

        # Define models to clean up with their corresponding messages
        model_cleanup = [
            (Token, "tokens"),
            (Notifications, "notifications"),
            (UserMediaUpdate, "user media updates"),
            (UserMediaSettings, "user media settings"),
            (MediadleStats, "mediadle stats"),
            (UserMediadleProgress, "user mediadle progress"),
            (UserAchievement, "user achievements"),
        ]

        # Clean up standard models
        for model, name in model_cleanup:
            try:
                orphans = model.query.filter(model.user_id.not_in(user_ids)).all()
                print(f"Found {len(orphans)} orphan {name}")
                if not dry_run:
                    for orphan in orphans:
                        db.session.delete(orphan)
                    db.session.commit()
                    print(f"Deleted {len(orphans)} orphan {name}")
            except SQLAlchemyError as e:
                print(f"Error cleaning up {name}: {str(e)}")
                db.session.rollback()

        # Clean up followers (special case due to association table)
        try:
            orphan_followers = db.session.query(followers).filter(or_(
                followers.c.follower_id.not_in(user_ids),
                followers.c.followed_id.not_in(user_ids),
            )).all()
            print(f"Found {len(orphan_followers)} orphan followers")

            if not dry_run:
                db.session.query(followers).filter(or_(
                    followers.c.follower_id.not_in(user_ids),
                    followers.c.followed_id.not_in(user_ids),
                )).delete(synchronize_session=False)
                db.session.commit()
                print(f"Deleted {len(orphan_followers)} orphan followers")
        except SQLAlchemyError as e:
            print(f"Error cleaning up followers: {str(e)}")
            db.session.rollback()

        # Clean up media models
        try:
            for model in ModelsManager.get_dict_models("all", ModelTypes.LIST).values():
                orphans = model.query.filter(model.user_id.not_in(user_ids)).all()
                print(f"Found {len(orphans)} media {model.GROUP} orphans in the database")
                if not dry_run:
                    for orphan in orphans:
                        db.session.delete(orphan)
                    db.session.commit()
                    print(f"Deleted {len(orphans)} media {model.GROUP} orphans from the database")
        except SQLAlchemyError as e:
            print(f"Error cleaning up media models: {str(e)}")
            db.session.rollback()

        # Clean up label models
        try:
            for model in ModelsManager.get_dict_models("all", ModelTypes.LABELS).values():
                orphans = model.query.filter(model.user_id.not_in(user_ids)).all()
                print(f"Found {len(orphans)} label {model.GROUP} orphans in the database")
                if not dry_run:
                    for orphan in orphans:
                        db.session.delete(orphan)
                    db.session.commit()
                    print(f"Deleted {len(orphans)} label {model.GROUP} orphans from the database")
        except SQLAlchemyError as e:
            print(f"Error cleaning up label models: {str(e)}")
            db.session.rollback()

        print(f"{"DRY RUN: " if dry_run else ""}Cleanup completed{"!" if not dry_run else " (no changes made)"}")

    except Exception as e:
        print(f"Cleanup failed: {str(e)}")
        db.session.rollback()
        raise


@media_cli.command()
def add_manga_settings():
    """ Add manga settings to all users. """

    users = User.query.all()
    for user in users:
        if not user.get_media_setting(MediaType.MANGA):
            new_user_media_settings = UserMediaSettings(
                user_id=user.id,
                media_type=MediaType.MANGA,
                active=False,
            )
            db.session.add(new_user_media_settings)
            print(f"Added manga settings to user [ID {user.id}]")
    db.session.commit()
