"""empty message

Revision ID: f933b1d35ca3
Revises: fc25748c85ff
Create Date: 2024-04-17 15:13:49.587278

"""
import sqlalchemy as sa
from alembic import op

revision = "f933b1d35ca3"
down_revision = "fc25748c85ff"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("badges")


def downgrade():
    op.create_table(
        "badges",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("threshold", sa.INTEGER(), nullable=False),
        sa.Column("image_id", sa.VARCHAR(length=100), nullable=False),
        sa.Column("title", sa.VARCHAR(length=100), nullable=False),
        sa.Column("type", sa.VARCHAR(length=100), nullable=False),
        sa.Column("genres_id", sa.VARCHAR(length=100), nullable=True),
        sa.PrimaryKeyConstraint("id")
    )
