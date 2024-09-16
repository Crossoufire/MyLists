"""
Removed `MyListsStats` model - uses a cache instead
Revision ID: eb715189ac06
Revises: 2f65ab4f138c
Create Date: 2024-08-23 23:14:16.579542
"""
from alembic import op
import sqlalchemy as sa


revision = "eb715189ac06"
down_revision = "2f65ab4f138c"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('my_lists_stats')


def downgrade():
    op.create_table(
        "my_lists_stats",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("total_time", sa.TEXT(), nullable=True),
        sa.Column("top_media", sa.TEXT(), nullable=True),
        sa.Column("top_genres", sa.TEXT(), nullable=True),
        sa.Column("top_actors", sa.TEXT(), nullable=True),
        sa.Column("top_directors", sa.TEXT(), nullable=True),
        sa.Column("top_dropped", sa.TEXT(), nullable=True),
        sa.Column("total_episodes", sa.TEXT(), nullable=True),
        sa.Column("total_seasons", sa.TEXT(), nullable=True),
        sa.Column("total_movies", sa.TEXT(), nullable=True),
        sa.Column("timestamp", sa.DATETIME(), nullable=True),
        sa.Column("nb_users", sa.INTEGER(), nullable=True),
        sa.Column("nb_media", sa.TEXT(), nullable=True),
        sa.Column("top_authors", sa.TEXT(), nullable=True),
        sa.Column("top_developers", sa.TEXT(), nullable=True),
        sa.Column("total_pages", sa.INTEGER(), nullable=True),
        sa.Column("top_rated_actors", sa.TEXT(), nullable=True),
        sa.Column("top_rated_directors", sa.TEXT(), nullable=True),
        sa.Column("top_rated_developers", sa.TEXT(), nullable=True),
        sa.PrimaryKeyConstraint("id")
    )
