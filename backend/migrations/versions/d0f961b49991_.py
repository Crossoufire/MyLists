"""
Removed the unused `Frames` table
Revision ID: d0f961b49991
Revises: 5fbd256eee4f
Create Date: 2024-08-23 12:07:51.812903
"""
from alembic import op
import sqlalchemy as sa


revision = "d0f961b49991"
down_revision = "5fbd256eee4f"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("frames")


def downgrade():
    op.create_table(
        "frames",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("level", sa.INTEGER(), nullable=False),
        sa.Column("image_id", sa.VARCHAR(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
