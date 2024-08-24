"""
Remove `Unknown` actors names in `*_actors` table
Revision ID: 572cda2d1bd4
Revises: 10680aa3e5a3
Create Date: 2024-08-24 12:58:43.365890
"""
from alembic import op
import sqlalchemy as sa


revision = "572cda2d1bd4"
down_revision = "10680aa3e5a3"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    metadata = sa.MetaData()

    series_actors = sa.Table("series_actors", metadata, autoload_with=connection)
    anime_actors = sa.Table("anime_actors", metadata, autoload_with=connection)
    movies_actors = sa.Table("movies_actors", metadata, autoload_with=connection)

    tables = [series_actors, anime_actors, movies_actors]
    for table in tables:
        select_stmt = sa.select(table)
        results = connection.execute(select_stmt).fetchall()
        for row in results:
            if row.name in ("Unknown", "No actors found", "Unknow"):
                # noinspection PyTypeChecker
                delete_stmt = table.delete().where(table.c.id == row.id)
                connection.execute(delete_stmt)


def downgrade():
    pass
