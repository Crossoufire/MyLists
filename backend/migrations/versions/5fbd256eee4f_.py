"""
Removed `completion_date` column from all lists
Revision ID: 5fbd256eee4f
Revises: 1020f7fe78a5
Create Date: 2024-06-30 16:33:45.245156
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5fbd256eee4f"
down_revision = "1020f7fe78a5"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.drop_column("completion_date")

    with op.batch_alter_table("books_list", schema=None) as batch_op:
        batch_op.drop_column("completion_date")

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.drop_column("completion_date")

    with op.batch_alter_table("movies_list", schema=None) as batch_op:
        batch_op.drop_column("completion_date")

    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.drop_column("completion_date")

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.drop_column("completion")


def downgrade():
    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion_date", sa.DATETIME(), nullable=True))

    with op.batch_alter_table("movies_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion_date", sa.DATETIME(), nullable=True))

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion_date", sa.DATETIME(), nullable=True))

    with op.batch_alter_table("books_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion_date", sa.DATETIME(), nullable=True))

    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion_date", sa.DATETIME(), nullable=True))

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("completion", sa.Boolean()))
