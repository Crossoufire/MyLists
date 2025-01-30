"""
Add value in Achievement directly
Revision ID: a7d2ea836c42
Revises: 645d9faa0921
Create Date: 2025-01-20 10:11:59.859034
"""

from alembic import op
import sqlalchemy as sa


revision = "a7d2ea836c42"
down_revision = "645d9faa0921"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("achievement", schema=None) as batch_op:
        batch_op.add_column(sa.Column("value", sa.String(), nullable=True))


def downgrade():
    with op.batch_alter_table("achievement", schema=None) as batch_op:
        batch_op.drop_column("value")
