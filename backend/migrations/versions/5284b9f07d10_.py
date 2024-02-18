"""empty message

Revision ID: 5284b9f07d10
Revises: 76eb9a9c4f2b
Create Date: 2024-02-16 15:26:26.770305

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5284b9f07d10'
down_revision = '76eb9a9c4f2b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("password", existing_type=sa.VARCHAR(length=60), nullable=True)


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("password", existing_type=sa.VARCHAR(length=60), nullable=False)
