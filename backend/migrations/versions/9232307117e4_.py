"""
Renamed all `label` columns to `name`
Revision ID: 9232307117e4
Revises: 572cda2d1bd4
Create Date: 2024-08-24 13:18:21.283179
"""
from alembic import op


revision = "9232307117e4"
down_revision = "572cda2d1bd4"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("series_labels", schema=None) as batch_op:
        batch_op.alter_column("label", new_column_name="name")

    with op.batch_alter_table("anime_labels", schema=None) as batch_op:
        batch_op.alter_column("label", new_column_name="name")

    with op.batch_alter_table("movies_labels", schema=None) as batch_op:
        batch_op.alter_column("label", new_column_name="name")

    with op.batch_alter_table("games_labels", schema=None) as batch_op:
        batch_op.alter_column("label", new_column_name="name")

    with op.batch_alter_table("books_labels", schema=None) as batch_op:
        batch_op.alter_column("label", new_column_name="name")


def downgrade():
    with op.batch_alter_table("series_labels", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="label")

    with op.batch_alter_table("anime_labels", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="label")

    with op.batch_alter_table("movies_labels", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="label")

    with op.batch_alter_table("games_labels", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="label")

    with op.batch_alter_table("books_labels", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="label")
