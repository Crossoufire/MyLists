"""
Renamed all `rewatched` column to `redo`
Revision ID: 901a1f2c7f35
Revises: eb715189ac06
Create Date: 2024-08-24 11:34:27.650870
"""
from alembic import op


revision = "901a1f2c7f35"
down_revision = "eb715189ac06"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("series_list") as batch_op:
        batch_op.alter_column("rewatched", new_column_name="redo")

    with op.batch_alter_table("anime_list") as batch_op:
        batch_op.alter_column("rewatched", new_column_name="redo")

    with op.batch_alter_table("movies_list") as batch_op:
        batch_op.alter_column("rewatched", new_column_name="redo")

    with op.batch_alter_table("books_list") as batch_op:
        batch_op.alter_column("rewatched", new_column_name="redo")


def downgrade():
    with op.batch_alter_table("series_list") as batch_op:
        batch_op.alter_column("redo", new_column_name="rewatched")

    with op.batch_alter_table("anime_list") as batch_op:
        batch_op.alter_column("redo", new_column_name="rewatched")

    with op.batch_alter_table("movies_list") as batch_op:
        batch_op.alter_column("redo", new_column_name="rewatched")

    with op.batch_alter_table("books_list") as batch_op:
        batch_op.alter_column("redo", new_column_name="rewatched")
