"""
new redo for anime/series
Revision ID: 5e244bee6884
Revises: a7d2ea836c42
Create Date: 2025-02-11 22:41:33.113093
"""

from alembic import op
import sqlalchemy as sa


revision = "5e244bee6884"
down_revision = "a7d2ea836c42"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column('redo2', sa.JSON(), nullable=False, server_default=sa.text("'[]'")))

    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column('redo2', sa.JSON(), nullable=False, server_default=sa.text("'[]'")))

    connection = op.get_bind()
    metadata = sa.MetaData()

    anime_list = sa.Table("anime_list", metadata, autoload_with=connection)
    series_list = sa.Table("series_list", metadata, autoload_with=connection)
    anime_eps_per_season = sa.Table("anime_episodes_per_season", metadata, autoload_with=connection)
    series_eps_per_season = sa.Table("series_episodes_per_season", metadata, autoload_with=connection)

    anime_results = connection.execute(
        sa.select(anime_list.c.id, anime_list.c.redo, anime_list.c.current_season, anime_list.c.media_id)
    ).fetchall()

    for row in anime_results:
        # noinspection PyTypeChecker
        seasons_count = connection.execute(
            sa.select(sa.func.count())
            .select_from(anime_eps_per_season)
            .where(anime_eps_per_season.c.media_id == row.media_id)
        ).scalar()

        if seasons_count:
            if row.redo:
                redo2 = ([row.redo] * row.current_season + [0] * (seasons_count - row.current_season))
            else:
                redo2 = [0] * seasons_count

            # noinspection PyTypeChecker
            connection.execute(anime_list.update().where(anime_list.c.id == row.id).values(redo2=redo2))
        else:
            print(f"No seasons ???? {row}")

    series_results = connection.execute(
        sa.select(series_list.c.id, series_list.c.redo, series_list.c.current_season, series_list.c.media_id)
    ).fetchall()

    for row in series_results:
        # noinspection PyTypeChecker
        seasons_count = connection.execute(
            sa.select(sa.func.count())
            .select_from(series_eps_per_season)
            .where(series_eps_per_season.c.media_id == row.media_id)
        ).scalar()

        if seasons_count:
            if row.redo:
                redo2 = ([row.redo] * row.current_season + [0] * (seasons_count - row.current_season))
            else:
                redo2 = [0] * seasons_count

            # noinspection PyTypeChecker
            connection.execute(series_list.update().where(series_list.c.id == row.id).values(redo2=redo2))
        else:
            print(f"No seasons ???? {row}")


def downgrade():
    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.drop_column('redo2')

    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.drop_column('redo2')
