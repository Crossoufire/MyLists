"""empty message

Revision ID: 9794d5c787a4
Revises:
Create Date: 2023-12-13 17:16:56.582776

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '9794d5c787a4'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('movies', schema=None) as batch_op:
        batch_op.drop_column('collection_id')

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('biography')


def downgrade():
    pass
