"""empty message

Revision ID: cf6c48f1333a
Revises: 5284b9f07d10
Create Date: 2024-02-16 16:58:43.505934

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cf6c48f1333a'
down_revision = '5284b9f07d10'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("movies_prod")
    op.drop_table("redis_tasks")
    op.drop_table("personal_movies_list")

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("oauth_id")


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("oauth_id", sa.VARCHAR(length=50), nullable=True))

    op.create_table("redis_tasks",
    sa.Column('id', sa.VARCHAR(length=50), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=True),
    sa.Column('name', sa.VARCHAR(length=150), nullable=True),
    sa.Column('description', sa.VARCHAR(length=150), nullable=True),
    sa.Column('complete', sa.BOOLEAN(), nullable=True),
    sa.CheckConstraint('complete IN (0, 1)'),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('personal_movies_list',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('media_id', sa.INTEGER(), nullable=False),
    sa.Column('list_name', sa.VARCHAR(length=64), nullable=False),
    sa.ForeignKeyConstraint(['media_id'], ['movies.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('movies_prod',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('media_id', sa.INTEGER(), nullable=False),
    sa.Column('production_company', sa.VARCHAR(length=150), nullable=False),
    sa.ForeignKeyConstraint(['media_id'], ['anime.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
