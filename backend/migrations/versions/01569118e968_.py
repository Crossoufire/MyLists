"""
Consolidate score/feeling to single column rating
Revision ID: 01569118e968
Revises: 99b5ce2d1e0f
Create Date: 2024-12-07 13:57:29.380638
"""
from alembic import op
import sqlalchemy as sa


revision = "01569118e968"
down_revision = "99b5ce2d1e0f"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))

    with op.batch_alter_table("books_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))

    with op.batch_alter_table("movies_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))

    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            "rating_system",
            sa.Enum("SCORE", "FEELING", name="ratingsystem"),
            server_default="SCORE",
            nullable=False,
        ))

    connection = op.get_bind()
    metadata = sa.MetaData()

    user_table = sa.Table("user", metadata, autoload_with=connection)
    connection.execute(
        user_table.update()
        .where(user_table.c.add_feeling.is_(True))
        .values(rating_system="FEELING")
    )

    def migrate_table_ratings(table_name: str):
        media_list_table = sa.Table(table_name, metadata, autoload_with=connection)

        connection.execute(
            media_list_table.update()
            .where(
                sa.and_(
                    media_list_table.c.user_id == user_table.c.id,
                    user_table.c.rating_system == "SCORE",
                )
            )
            .values(rating=media_list_table.c.score)
        )

        connection.execute(
            media_list_table.update()
            .where(
                sa.and_(
                    media_list_table.c.user_id == user_table.c.id,
                    user_table.c.rating_system == "FEELING",
                )
            )
            .values(rating=media_list_table.c.feeling * 2)
        )

    for media_list_table in ["series_list", "anime_list", "movies_list", "games_list", "books_list"]:
        migrate_table_ratings(media_list_table)

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("add_feeling")

    for media_list_table in ["series_list", "anime_list", "movies_list", "games_list", "books_list"]:
        with op.batch_alter_table(media_list_table, schema=None) as batch_op:
            batch_op.drop_column("score")
            batch_op.drop_column("feeling")


def downgrade():
    with op.batch_alter_table("series_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("feeling", sa.Float(), nullable=True))
        batch_op.drop_column("rating")

    with op.batch_alter_table("anime_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("feeling", sa.Float(), nullable=True))
        batch_op.drop_column("rating")

    with op.batch_alter_table("movies_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("feeling", sa.Float(), nullable=True))
        batch_op.drop_column("rating")

    with op.batch_alter_table("books_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("feeling", sa.Float(), nullable=True))
        batch_op.drop_column("rating")

    with op.batch_alter_table("games_list", schema=None) as batch_op:
        batch_op.add_column(sa.Column("score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("feeling", sa.Float(), nullable=True))
        batch_op.drop_column("rating")

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("add_feeling", sa.Boolean(), nullable=True))
        batch_op.drop_column("rating_system")
