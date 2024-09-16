"""
Added notification_type column - retroactive update
Revision ID: 72965b4f8731
Revises: 9232307117e4
Create Date: 2024-08-24 15:22:00.664735
"""
from alembic import op
import sqlalchemy as sa


revision = "72965b4f8731"
down_revision = "9232307117e4"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            "notification_type",
            sa.Enum("TV", "MEDIA", "FOLLOW", name="notificationtype"),
            nullable=True)
        )
        batch_op.alter_column("payload_json", new_column_name="payload")
        batch_op.alter_column(
            "media_type",
            type_=sa.Enum("SERIES", "ANIME", "MOVIES", "BOOKS", "GAMES", name="mediatype"),
            nullable=True
        )

    # Retro-update notifications
    connection = op.get_bind()
    metadata = sa.MetaData()

    notifications = sa.Table("notifications", metadata, autoload_with=connection)

    results = connection.execute(sa.select(notifications)).fetchall()
    for row in results:
        update_values = {}
        if not row.media_type:
            update_values["notification_type"] = "FOLLOW"
        elif row.media_type == "serieslist":
            update_values["media_type"] = "SERIES"
            update_values["notification_type"] = "TV"
        elif row.media_type == "animelist":
            update_values["media_type"] = "ANIME"
            update_values["notification_type"] = "TV"
        elif row.media_type == "movieslist":
            update_values["media_type"] = "MOVIES"
            update_values["notification_type"] = "MEDIA"
        elif row.media_type == "gameslist":
            update_values["media_type"] = "GAMES"
            update_values["notification_type"] = "MEDIA"

        if update_values:
            # noinspection PyTypeChecker
            connection.execute(notifications.update().where(notifications.c.id == row.id).values(**update_values))


def downgrade():
    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.alter_column("payload", new_column_name="payload_json")
        batch_op.drop_column("notification_type")
