"""empty message

Revision ID: 016cd5a831db
Revises: 9794d5c787a4
Create Date: 2023-12-21 13:29:15.923872

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016cd5a831db'
down_revision = '9794d5c787a4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('token', schema=None) as batch_op:
        batch_op.add_column(sa.Column('admin_token', sa.String(length=64)))
        batch_op.add_column(sa.Column('admin_expiration', sa.DateTime()))


def downgrade():
    with op.batch_alter_table('token', schema=None) as batch_op:
        batch_op.drop_column('admin_expiration')
        batch_op.drop_column('admin_token')
