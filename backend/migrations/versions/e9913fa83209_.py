"""empty message

Revision ID: e9913fa83209
Revises: 016cd5a831db
Create Date: 2023-12-27 17:31:30.916113

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9913fa83209'
down_revision = '016cd5a831db'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('personal_movies_list',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('media_id', sa.Integer(), nullable=False),
    sa.Column('list_name', sa.String(length=64), nullable=False),
    sa.ForeignKeyConstraint(['media_id'], ['movies.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('personal_movies_list')
