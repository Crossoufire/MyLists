"""
Add search selector setting
Revision ID: 99b5ce2d1e0f
Revises: 7db72e6e7814
Create Date: 2024-11-27 15:33:45.992149
"""

from alembic import op
import sqlalchemy as sa


revision = "99b5ce2d1e0f"
down_revision = "7db72e6e7814"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            "search_selector",
            sa.Enum("TMDB", "BOOKS", "IGDB", "USERS", name="searchselector"),
            server_default="TMDB",
            nullable=False)
        )


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("search_selector")
