"""
Add lists stats updates in UserMediaSettings
Revision ID: 645d9faa0921
Revises: 01569118e968
Create Date: 2024-12-31 12:48:09.490047
"""

from alembic import op
import sqlalchemy as sa


revision = "645d9faa0921"
down_revision = "01569118e968"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user_media_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("total_entries", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("total_redo", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("entries_rated", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("sum_entries_rated", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("entries_commented", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("entries_favorites", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("total_specific", sa.Integer(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("status_counts", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
        batch_op.add_column(sa.Column("average_rating", sa.Float(), nullable=True))


def downgrade():
    with op.batch_alter_table("user_media_settings", schema=None) as batch_op:
        batch_op.drop_column("average_rating")
        batch_op.drop_column("total_specific")
        batch_op.drop_column("status_counts")
        batch_op.drop_column("entries_favorites")
        batch_op.drop_column("entries_commented")
        batch_op.drop_column("sum_entries_rated")
        batch_op.drop_column("entries_rated")
        batch_op.drop_column("total_redo")
        batch_op.drop_column("total_entries")
