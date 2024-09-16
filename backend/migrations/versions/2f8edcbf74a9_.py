"""
Refactored UserLastUpdate table as UserMediaUpdate
Revision ID: 2f8edcbf74a9
Revises: 72965b4f8731
Create Date: 2024-08-24 17:07:07.876586
"""
import json

from alembic import op
import sqlalchemy as sa


revision = "2f8edcbf74a9"
down_revision = "72965b4f8731"
branch_labels = None
depends_on = None


def format_status(status: str | None):
    if status is None:
        return None
    return status.lower().title().replace("_", " ").replace(" To ", " to ")


def upgrade():
    connection = op.get_bind()
    metadata = sa.MetaData()

    user_last_update = sa.Table("user_last_update", metadata, autoload_with=connection)
    user_media_update = sa.Table("user_media_update", metadata, autoload_with=connection)

    results = connection.execute(sa.select(user_last_update)).fetchall()
    for row in results:
        try:
            update_values = dict(
                user_id=row.user_id,
                media_id=row.media_id,
                media_name=row.media_name,
                media_type=row.media_type,
                timestamp=row.date,
            )

            if row.old_status is not None or row.new_status is not None:
                update_values["update_type"] = "STATUS"
                update_values["payload"] = json.dumps(dict(
                    old_value=format_status(row.old_status),
                    new_value=format_status(row.new_status),
                ))

            if row.old_season is not None or row.new_season is not None:
                update_values["update_type"] = "TV"
                update_values["payload"] = json.dumps(dict(
                    old_value=(int(row.old_season), int(row.old_episode)),
                    new_value=(int(row.new_season), int(row.new_episode)),
                ))

            if row.old_playtime is not None or row.new_playtime is not None:
                update_values["update_type"] = "PLAYTIME"
                update_values["payload"] = json.dumps(dict(
                    old_value=row.old_playtime,
                    new_value=row.new_playtime,
                ))

            if row.old_page is not None or row.new_page is not None:
                update_values["update_type"] = "PAGE"
                update_values["payload"] = json.dumps(dict(
                    old_value=row.old_page,
                    new_value=row.new_page,
                ))

            if row.old_redo is not None or row.new_redo is not None:
                update_values["update_type"] = "REDO"
                update_values["payload"] = json.dumps(dict(
                    old_value=row.old_redo,
                    new_value=row.new_redo,
                ))
        except Exception as e:
            print(row.media_name, row.media_type, row.user_id, e)
            continue

        connection.execute(user_media_update.insert().values(**update_values))

    op.drop_table("user_last_update")


def downgrade():
    op.create_table(
        "user_last_update",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("user_id", sa.INTEGER(), nullable=False),
        sa.Column("media_name", sa.VARCHAR(length=50), nullable=False),
        sa.Column("media_type", sa.VARCHAR(length=6), nullable=False),
        sa.Column("old_status", sa.VARCHAR(length=19), nullable=True),
        sa.Column("new_status", sa.VARCHAR(length=19), nullable=True),
        sa.Column("old_season", sa.INTEGER(), nullable=True),
        sa.Column("new_season", sa.INTEGER(), nullable=True),
        sa.Column("old_episode", sa.INTEGER(), nullable=True),
        sa.Column("new_episode", sa.INTEGER(), nullable=True),
        sa.Column("date", sa.DATETIME(), nullable=False),
        sa.Column("media_id", sa.INTEGER(), nullable=True),
        sa.Column("old_playtime", sa.INTEGER(), nullable=True),
        sa.Column("new_playtime", sa.INTEGER(), nullable=True),
        sa.Column("old_page", sa.INTEGER(), nullable=True),
        sa.Column("new_page", sa.INTEGER(), nullable=True),
        sa.Column("old_redo", sa.INTEGER(), nullable=True),
        sa.Column("new_redo", sa.INTEGER(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.drop_table("user_media_update")
