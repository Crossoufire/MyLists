"""empty message

Revision ID: fc25748c85ff
Revises: dbbd39c24c79
Create Date: 2024-03-27 19:43:52.322997

"""
from alembic import op
import sqlalchemy as sa


revision = "fc25748c85ff"
down_revision = "dbbd39c24c79"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("my_lists_stats", schema=None) as batch_op:
        batch_op.add_column(sa.Column("top_rated_actors", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("top_rated_directors", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("top_rated_developers", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("my_lists_stats", schema=None) as batch_op:
        batch_op.drop_column("top_rated_directors")
        batch_op.drop_column("top_rated_actors")
        batch_op.drop_column("top_rated_developers")
