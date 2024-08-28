"""
Add platform to games
Revision ID: bf2b15633eaa
Revises: 4944f9d248e7
Create Date: 2024-08-26 22:23:09.454392
"""
from alembic import op
import sqlalchemy as sa


revision = "bf2b15633eaa"
down_revision = "4944f9d248e7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("platform", sa.VARCHAR(length=150), nullable=True))


def downgrade():
    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.drop_column("platform")
