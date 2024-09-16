"""
Added choice between grid and table view
Revision ID: d32d1456796e
Revises: bf2b15633eaa
Create Date: 2024-09-06 11:05:14.843102
"""
from alembic import op
import sqlalchemy as sa


revision = "d32d1456796e"
down_revision = "bf2b15633eaa"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("grid_list_view", sa.Boolean(), nullable=False,
                                      server_default=sa.text("1")))


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("grid_list_view")
