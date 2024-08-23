"""
Removed the now unused `Ranks` table
Revision ID: 944f43310de7
Revises: d0f961b49991
Create Date: 2024-08-23 12:40:51.931601
"""
from alembic import op
import sqlalchemy as sa


revision = "944f43310de7"
down_revision = "d0f961b49991"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("ranks")


def downgrade():
    op.create_table(
        "ranks",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("level", sa.INTEGER(), nullable=False),
        sa.Column("image_id", sa.VARCHAR(length=50), nullable=False),
        sa.Column("name", sa.VARCHAR(length=50), nullable=False),
        sa.Column("type", sa.VARCHAR(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
