"""
Added privacy enum settings to the user model
Revision ID: 7db72e6e7814
Revises: d32d1456796e
Create Date: 2024-09-23 18:40:54.549404
"""
from alembic import op
import sqlalchemy as sa


revision = "7db72e6e7814"
down_revision = "d32d1456796e"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            "privacy",
            sa.Enum("PUBLIC", "RESTRICTED", "PRIVATE", name="privacy"),
            nullable=False,
            server_default="RESTRICTED",
        ))
        batch_op.drop_column("private")


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("private", sa.BOOLEAN(), nullable=False))
        batch_op.drop_column("privacy")
