"""
Remove non-nullable release date for `Books` and correct dates
Revision ID: b2f7f73e21e1
Revises: ee167b5e53c9
Create Date: 2024-08-23 14:48:23.036121
"""
from alembic import op
import sqlalchemy as sa

revision = "b2f7f73e21e1"
down_revision = "ee167b5e53c9"
branch_labels = None
depends_on = None


def upgrade():
    from backend.api.utils.functions import format_datetime

    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.alter_column("release_date", nullable=True)

    connection = op.get_bind()
    metadata = sa.MetaData()

    series = sa.Table("series", metadata, autoload_with=connection)
    anime = sa.Table("anime", metadata, autoload_with=connection)
    movies = sa.Table("movies", metadata, autoload_with=connection)
    books = sa.Table("books", metadata, autoload_with=connection)
    games = sa.Table("games", metadata, autoload_with=connection)

    tables = [series, anime, movies, books, games]
    columns = ["release_date", "next_episode_to_air", "last_air_date", "first_air_date"]

    for table in tables:
        select_stmt = sa.select(table)
        results = connection.execute(select_stmt).fetchall()

        for row in results:
            values_to_update = {}

            for column in columns:
                if column in table.c and getattr(row, column):
                    formatted_value = format_datetime(getattr(row, column))
                    values_to_update[column] = formatted_value

            if values_to_update:
                # noinspection PyTypeChecker
                update_stmt = table.update().where(table.c.id == row.id).values(**values_to_update)
                connection.execute(update_stmt)


def downgrade():
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.alter_column("lock_status", nullable=True)
