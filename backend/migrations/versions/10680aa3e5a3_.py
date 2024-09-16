"""
Renamed all `genre` columns to `name`. Removed all `Unknown` genres
Revision ID: 10680aa3e5a3
Revises: 901a1f2c7f35
Create Date: 2024-08-24 11:57:35.473365
"""
from alembic import op
import sqlalchemy as sa


revision = "10680aa3e5a3"
down_revision = "901a1f2c7f35"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("series_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", new_column_name="name")
        batch_op.drop_column("genre_id")

    with op.batch_alter_table("anime_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", new_column_name="name")
        batch_op.drop_column("genre_id")

    with op.batch_alter_table("movies_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", new_column_name="name")
        batch_op.drop_column("genre_id")

    with op.batch_alter_table("games_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", new_column_name="name")

    with op.batch_alter_table("books_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", new_column_name="name")

    connection = op.get_bind()
    metadata = sa.MetaData()

    series_genre = sa.Table("series_genre", metadata, autoload_with=connection)
    anime_genre = sa.Table("anime_genre", metadata, autoload_with=connection)
    movies_genre = sa.Table("movies_genre", metadata, autoload_with=connection)
    books_genre = sa.Table("books_genre", metadata, autoload_with=connection)
    games_genre = sa.Table("games_genre", metadata, autoload_with=connection)

    tables = [series_genre, anime_genre, movies_genre, books_genre, games_genre]
    for table in tables:
        select_stmt = sa.select(table)
        results = connection.execute(select_stmt).fetchall()
        for row in results:
            if row.name in ("Unknown", "No genres found", "Unknow"):
                # noinspection PyTypeChecker
                delete_stmt = table.delete().where(table.c.id == row.id)
                connection.execute(delete_stmt)


def downgrade():
    with op.batch_alter_table("series_genre", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="genre")
        batch_op.add_column(sa.Column("genre_id", sa.INTEGER(), nullable=False))

    with op.batch_alter_table("anime_genre", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="genre")
        batch_op.add_column(sa.Column("genre_id", sa.INTEGER(), nullable=False))

    with op.batch_alter_table("movies_genre", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="genre")
        batch_op.add_column(sa.Column("genre_id", sa.INTEGER(), nullable=False))

    with op.batch_alter_table("games_genre", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="genre")

    with op.batch_alter_table("books_genre", schema=None) as batch_op:
        batch_op.alter_column("name", new_column_name="genre")
