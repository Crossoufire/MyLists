"""
Revision ID: 1020f7fe78a5
Revises: f933b1d35ca3
Create Date: 2024-06-28 15:25:00.708510
"""
from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic
revision = "1020f7fe78a5"
down_revision = "f933b1d35ca3"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("show_update_modal", sa.Boolean(), default=True))


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("show_update_modal")
