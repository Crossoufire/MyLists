"""
Homogenized date column names -> release_date
Revision ID: 2f65ab4f138c
Revises: ee167b5e53c9
Create Date: 2024-08-23 14:28:26.167721
"""
from alembic import op
import sqlalchemy as sa


revision = "2f65ab4f138c"
down_revision = "b2f7f73e21e1"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("anime", schema=None) as batch_op:
        batch_op.alter_column("first_air_date", nullable=True, new_column_name="release_date")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("total_seasons", nullable=True)
        batch_op.alter_column("api_id", type_=sa.String())

    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.add_column(sa.Column("last_api_update", sa.DateTime(), nullable=True))
        batch_op.alter_column("language", nullable=True)
        batch_op.alter_column("api_id", type_=sa.String())

    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.alter_column("api_id", type_=sa.String())

    with op.batch_alter_table("movies", schema=None) as batch_op:
        batch_op.drop_column("released")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("api_id", type_=sa.String())

    with op.batch_alter_table("series", schema=None) as batch_op:
        batch_op.alter_column("first_air_date", nullable=True, new_column_name="release_date")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("total_seasons", nullable=True)
        batch_op.alter_column("api_id", type_=sa.String())


def downgrade():
    with op.batch_alter_table("series", schema=None) as batch_op:
        batch_op.alter_column("release_date", nullable=True, type_=sa.String(), new_column_name="first_air_date")
        batch_op.alter_column("original_name", nullable=False)
        batch_op.alter_column("total_seasons", nullable=False)
        batch_op.alter_column("api_id", type_=sa.Integer())

    with op.batch_alter_table("movies", schema=None) as batch_op:
        batch_op.add_column(sa.Column("released", sa.String(), nullable=True))
        batch_op.alter_column("original_name", nullable=False)
        batch_op.alter_column("api_id", type_=sa.Integer())

    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.alter_column("release_date", nullable=True, type_=sa.Integer())
        batch_op.alter_column("api_id", type_=sa.Integer())

    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.drop_column("last_api_update")
        batch_op.alter_column("release_date", nullable=True, type_=sa.String())
        batch_op.alter_column("language", nullable=False)
        batch_op.alter_column("api_id", type_=sa.String())

    with op.batch_alter_table('anime', schema=None) as batch_op:
        batch_op.alter_column("release_date", nullable=True, type_=sa.String(), new_column_name="first_air_date")
        batch_op.alter_column("original_name", nullable=False)
        batch_op.alter_column("total_seasons", nullable=False)
        batch_op.alter_column("api_id", type_=sa.Integer())
