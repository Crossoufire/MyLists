"""empty message

Revision ID: dbbd39c24c79
Revises: cf6c48f1333a
Create Date: 2024-03-10 14:29:28.179980

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dbbd39c24c79'
down_revision = 'cf6c48f1333a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('anime', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_api_update', sa.DateTime()))
        batch_op.drop_column('last_update')

    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_api_update', sa.DateTime()))

    with op.batch_alter_table('movies', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_api_update', sa.DateTime()))

    with op.batch_alter_table('series', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_api_update', sa.DateTime()))
        batch_op.drop_column('last_update')


def downgrade():
    with op.batch_alter_table('series', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_update', sa.DATETIME()))
        batch_op.drop_column('last_api_update')

    with op.batch_alter_table('movies', schema=None) as batch_op:
        batch_op.drop_column('last_api_update')

    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.drop_column('last_api_update')

    with op.batch_alter_table('anime', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_update', sa.DATETIME()))
        batch_op.drop_column('last_api_update')
