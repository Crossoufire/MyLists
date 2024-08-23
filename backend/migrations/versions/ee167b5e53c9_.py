"""
Removed admin tokens system
Revision ID: ee167b5e53c9
Revises: 944f43310de7
Create Date: 2024-08-23 13:14:42.103112
"""
from alembic import op
import sqlalchemy as sa


revision = "ee167b5e53c9"
down_revision = "944f43310de7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("token", schema=None) as batch_op:
        batch_op.drop_column("admin_token")
        batch_op.drop_column("admin_expiration")


def downgrade():
    with op.batch_alter_table("token", schema=None) as batch_op:
        batch_op.add_column(sa.Column("admin_expiration", sa.DATETIME(), nullable=True))
        batch_op.add_column(sa.Column("admin_token", sa.VARCHAR(length=64), nullable=True))
