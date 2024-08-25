"""
Removed `Unknown` from all possible columns in every table
Revision ID: 33fe8a587fd4
Revises: 6ab177da5250
Create Date: 2024-08-25 12:09:31.931488
"""
from typing import List
from alembic import op
import sqlalchemy as sa


revision = "33fe8a587fd4"
down_revision = "6ab177da5250"
branch_labels = None
depends_on = None


def update_fields_with_value(connection, table, fields_to_update: List[str], values_to_replace: List[str]):
    for field in fields_to_update:
        update_stmt = sa.update(table).where(
            getattr(table.c, field).in_(values_to_replace)
        ).values({field: None})
        connection.execute(update_stmt)


def delete_rows_with_value(connection, table, field: str, values_to_delete: List[str]):
    delete_stmt = sa.delete(table).where(getattr(table.c, field).in_(values_to_delete))
    connection.execute(delete_stmt)


def migrate_media_type(connection, table, fields_to_update: List[str], field_to_delete=None):
    values_to_replace = ["Unknown", "Undefined", "Not defined.", "No networks found", "Unknow", "-"]
    if field_to_delete:
        delete_rows_with_value(connection, table, field_to_delete, values_to_replace)
    else:
        update_fields_with_value(connection, table, fields_to_update, values_to_replace)


def upgrade():
    connection = op.get_bind()
    metadata = sa.MetaData()

    # Series MediaType
    series = sa.Table("series", metadata, autoload_with=connection)
    series_network = sa.Table("series_network", metadata, autoload_with=connection)
    migrate_media_type(connection, series, ["homepage", "created_by", "origin_country", "synopsis"])
    migrate_media_type(connection, series_network, [], field_to_delete="network")

    with op.batch_alter_table("series", schema=None) as batch_op:
        batch_op.drop_column("in_production")
        batch_op.alter_column("status", new_column_name="prod_status")

    with op.batch_alter_table("series_network", schema=None) as batch_op:
        batch_op.alter_column("network", new_column_name="name")

    # Anime MediaType
    anime = sa.Table("anime", metadata, autoload_with=connection)
    anime_network = sa.Table("anime_network", metadata, autoload_with=connection)
    migrate_media_type(connection, anime, ["homepage", "created_by", "origin_country", "synopsis"])
    migrate_media_type(connection, anime_network, [], field_to_delete="network")

    with op.batch_alter_table("anime", schema=None) as batch_op:
        batch_op.drop_column("in_production")
        batch_op.alter_column("status", new_column_name="prod_status")

    with op.batch_alter_table("anime_network", schema=None) as batch_op:
        batch_op.alter_column("network", new_column_name="name")

    # Movies MediaType
    movies = sa.Table("movies", metadata, autoload_with=connection)
    migrate_media_type(connection, movies, ["homepage", "director_name", "synopsis", "tagline"])

    # Books MediaType
    books = sa.Table("books", metadata, autoload_with=connection)
    migrate_media_type(connection, books, ["synopsis"])

    # Games MediaType
    games = sa.Table("games", metadata, autoload_with=connection)
    games_companies = sa.Table("games_companies", metadata, autoload_with=connection)
    games_platforms = sa.Table("games_platforms", metadata, autoload_with=connection)
    migrate_media_type(connection, games, ["collection_name", "game_engine", "game_modes", "player_perspective"])
    migrate_media_type(connection, games_companies, [], field_to_delete="name")
    migrate_media_type(connection, games_platforms, [], field_to_delete="name")

    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.drop_column("storyline")


def downgrade():
    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.add_column(sa.Column("storyline", sa.TEXT(), nullable=True))

    with op.batch_alter_table("series", schema=None) as batch_op:
        batch_op.add_column(sa.Column("in_production", sa.Boolean(), nullable=True))
        batch_op.alter_column("prod_status", new_column_name="status")

    with op.batch_alter_table("series_network", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="network")

    with op.batch_alter_table("anime", schema=None) as batch_op:
        batch_op.add_column(sa.Column("in_production", sa.Boolean(), nullable=True))
        batch_op.alter_column("prod_status", new_column_name="status")

    with op.batch_alter_table("anime_network", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="network")
