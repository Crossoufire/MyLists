"""
Adding UserMediaSettings table
Revision ID: 6ab177da5250
Revises: 2f8edcbf74a9
Create Date: 2024-08-24 18:57:39.633059
"""
import sqlalchemy as sa
from alembic import op
from backend.api.utils.enums import MediaType


revision = "6ab177da5250"
down_revision = "2f8edcbf74a9"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    metadata = sa.MetaData()

    user = sa.Table("user", metadata, autoload_with=connection)
    user_media_settings = sa.Table("user_media_settings", metadata, autoload_with=connection)

    results = connection.execute(sa.select(user)).fetchall()
    for row in results:
        for media_type in MediaType:
            time_spent_col = f"time_spent_{media_type.value}"
            views_col = f"{media_type.value}_views"
            active_col = f"add_{media_type.value}"
            media_settings = dict(
                user_id=row.id,
                media_type=media_type.value.upper(),
                views=getattr(row, views_col),
                active=getattr(row, active_col, True),
                time_spent=getattr(row, time_spent_col)
            )
            connection.execute(user_media_settings.insert().values(**media_settings))

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("time_spent_series")
        batch_op.drop_column("time_spent_anime")
        batch_op.drop_column("time_spent_movies")
        batch_op.drop_column("time_spent_games")
        batch_op.drop_column("time_spent_books")

        batch_op.drop_column("series_views")
        batch_op.drop_column("anime_views")
        batch_op.drop_column("movies_views")
        batch_op.drop_column("games_views")
        batch_op.drop_column("books_views")

        batch_op.drop_column("add_anime")
        batch_op.drop_column("add_books")
        batch_op.drop_column("add_games")


def downgrade():
    op.drop_table("user_media_settings")

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("time_spent_series", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("time_spent_anime", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("time_spent_movies", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("time_spent_games", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("time_spent_books", sa.INTEGER(), nullable=False, default=0))

        batch_op.add_column(sa.Column("series_views", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("anime_views", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("movies_views", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("games_views", sa.INTEGER(), nullable=False, default=0))
        batch_op.add_column(sa.Column("books_views", sa.INTEGER(), nullable=False, default=0))

        batch_op.add_column(sa.Column("add_anime", sa.BOOLEAN(), nullable=False, default=False))
        batch_op.add_column(sa.Column("add_books", sa.BOOLEAN(), nullable=False, default=False))
        batch_op.add_column(sa.Column("add_games", sa.BOOLEAN(), nullable=False, default=False))
