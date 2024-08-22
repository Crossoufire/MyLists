"""
For MyLists v2
Revision ID: 4456ca37e365
Revises: 5fbd256eee4f
Create Date: 2024-08-21 17:11:33.188952
"""
from alembic import op
import sqlalchemy as sa


revision = "4456ca37e365"
down_revision = "5fbd256eee4f"
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table("series_network", "series_platform")
    op.rename_table("anime_episodes_per_season", "anime_eps_per_season")
    op.rename_table("series_episodes_per_season", "series_eps_per_season")
    op.rename_table("anime_network", "anime_platform")

    op.drop_table("my_lists_stats")
    op.drop_table("ranks")
    op.drop_table("frames")

    with op.batch_alter_table("token", schema=None) as batch_op:
        batch_op.drop_column("admin_token")
        batch_op.drop_column("admin_expiration")

    with op.batch_alter_table("anime_eps_per_season", schema=None) as batch_op:
        batch_op.alter_column("episodes", nullable=False, new_column_name="episode")

    with op.batch_alter_table("series_eps_per_season", schema=None) as batch_op:
        batch_op.alter_column("episodes", nullable=False, new_column_name="episode")

    with op.batch_alter_table("series_platform", schema=None) as batch_op:
        batch_op.alter_column("network", nullable=False, new_column_name="name")

    with op.batch_alter_table("anime_platform", schema=None) as batch_op:
        batch_op.alter_column("network", nullable=False, new_column_name="name")

    with op.batch_alter_table("anime", schema=None) as batch_op:
        batch_op.alter_column("origin_country", nullable=True, new_column_name="language")
        batch_op.alter_column("status", nullable=True, new_column_name="prod_status")
        batch_op.alter_column("first_air_date", nullable=True, new_column_name="release_date")
        batch_op.drop_column("in_production")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("total_seasons", nullable=True)
        batch_op.alter_column("lock_status", nullable=False, default=0)

    with op.batch_alter_table("anime_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", nullable=False, new_column_name="name")
        batch_op.drop_column("genre_id")

    with op.batch_alter_table("anime_labels", schema=None) as batch_op:
        batch_op.alter_column("label", nullable=False, new_column_name="name")

    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.alter_column("last_episode_watched", nullable=True, new_column_name="current_episode")
        batch_op.alter_column("rewatched", nullable=False, new_column_name="redo")

    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.add_column(sa.Column("last_api_update", sa.DateTime(), nullable=True))
        batch_op.alter_column("release_date", nullable=True)
        batch_op.alter_column("pages", nullable=True)
        batch_op.alter_column("language", nullable=True)
        batch_op.alter_column("api_id", nullable=False)
        batch_op.alter_column("lock_status", nullable=False, default=0)

    with op.batch_alter_table("books_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", nullable=False, new_column_name="name")

    with op.batch_alter_table("books_labels", schema=None) as batch_op:
        batch_op.alter_column("label", nullable=False, new_column_name="name")

    with op.batch_alter_table("books_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.alter_column("actual_page", nullable=True, new_column_name="current_page")
        batch_op.alter_column("rewatched", nullable=False, new_column_name="redo")

    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.alter_column("IGDB_url", nullable=True, new_column_name="homepage")
        batch_op.alter_column("hltb_main_and_extra_time", nullable=True, new_column_name="hltb_main_extra_time")
        batch_op.alter_column("hltb_total_complete_time", nullable=True, new_column_name="hltb_total_time")
        batch_op.alter_column("release_date", type_=sa.DateTime(), nullable=True)
        batch_op.drop_column("storyline")
        batch_op.alter_column("api_id", nullable=False)
        batch_op.alter_column("lock_status", nullable=False, default=0)

    with op.batch_alter_table("games_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", nullable=False, new_column_name="name")

    with op.batch_alter_table("games_labels", schema=None) as batch_op:
        batch_op.alter_column("label", nullable=False, new_column_name="name")

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.alter_column("playtime", nullable=True, new_column_name="current_playtime")

    with op.batch_alter_table("movies", schema=None) as batch_op:
        batch_op.alter_column("director_name", nullable=True, new_column_name="director")
        batch_op.alter_column("original_language", nullable=True, new_column_name="language")
        batch_op.drop_column("released")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("lock_status", nullable=False, default=0)

    with op.batch_alter_table("movies_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", nullable=False, new_column_name="name")

    with op.batch_alter_table('movies_labels', schema=None) as batch_op:
        batch_op.alter_column("label", nullable=False, new_column_name="name")

    with op.batch_alter_table('movies_list', schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.alter_column("rewatched", nullable=False, new_column_name="redo")

    with op.batch_alter_table("series", schema=None) as batch_op:
        batch_op.alter_column("origin_country", nullable=True, new_column_name="language")
        batch_op.alter_column("status", nullable=True, new_column_name="prod_status")
        batch_op.alter_column("first_air_date", nullable=True, new_column_name="release_date")
        batch_op.drop_column("in_production")
        batch_op.alter_column("original_name", nullable=True)
        batch_op.alter_column("total_seasons", nullable=True)
        batch_op.alter_column("lock_status", nullable=False, default=0)

    with op.batch_alter_table("series_genre", schema=None) as batch_op:
        batch_op.alter_column("genre", nullable=False, new_column_name="name")

    with op.batch_alter_table("series_labels", schema=None) as batch_op:
        batch_op.alter_column("label", nullable=False, new_column_name="name")

    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.alter_column("rewatched", nullable=False, new_column_name="redo")
        batch_op.alter_column("last_episode_watched", nullable=True, new_column_name="current_episode")

    with op.batch_alter_table("token", schema=None) as batch_op:
        batch_op.drop_column("admin_token")
        batch_op.drop_column("admin_expiration")

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("password", nullable=True, new_column_name="password_hash")
        batch_op.add_column(sa.Column("rating_system",
                                      sa.Enum("SCORE", "FEELING", name="ratingsystem"),
                                      default="SCORE", nullable=False))
        batch_op.add_column(sa.Column("privacy",
                                      sa.Enum("PUBLIC", "NORMAL", "PRIVATE", name="privacytype"),
                                      default="NORMAL", nullable=False))


def downgrade():
    """ No downgrade possible """
    pass
