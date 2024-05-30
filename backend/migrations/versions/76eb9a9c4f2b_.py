"""empty message

Revision ID: 76eb9a9c4f2b
Revises: e2813654671e
Create Date: 2024-01-10 00:16:48.281890

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '76eb9a9c4f2b'
down_revision = 'e2813654671e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user_last_update', schema=None) as batch_op:
        batch_op.add_column(sa.Column('old_redo', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('new_redo', sa.Integer(), nullable=True))


def downgrade():
    with op.batch_alter_table('user_last_update', schema=None) as batch_op:
        batch_op.drop_column('new_redo')
        batch_op.drop_column('old_redo')
