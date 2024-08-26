"""
Removed deprecated `collection_name` field from Games model
Revision ID: 4944f9d248e7
Revises: 4c2246941f44
Create Date: 2024-08-26 21:34:56.525173
"""
from alembic import op
import sqlalchemy as sa


revision = "4944f9d248e7"
down_revision = "4c2246941f44"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.drop_column("collection_name")

    connection = op.get_bind()
    metadata = sa.MetaData()

    series_list = sa.Table("series_list", metadata, autoload_with=connection)
    anime_list = sa.Table("anime_list", metadata, autoload_with=connection)
    tables = [series_list, anime_list]
    for table in tables:
        query = sa.select(table).where(table.c.status.in_(["PLAN_TO_WATCH", "RANDOM"]))
        results = connection.execute(query).fetchall()
        for row in results:
            # noinspection PyTypeChecker
            update_stmt = (
                sa.update(table).where(table.c.id == row.id).values(
                    total=0,
                    last_episode_watched=0,
                    current_season=1
                )
            )
            connection.execute(update_stmt)

    media_lists = ["series_list", "anime_list", "movies_list", "games_list", "books_list"]
    for media_list in media_lists:
        raw_sql = sa.text(f"""
            SELECT list_id, name, user_id, row_num
            FROM (
                SELECT
                    B.id AS list_id,
                    A.name,
                    B.user_id,
                    ROW_NUMBER() OVER (PARTITION BY A.id, A.name, B.user_id ORDER BY B.id) AS row_num
                FROM {media_list.replace("_list", "")} AS A
                JOIN {media_list} AS B ON A.id = B.media_id
            )
            WHERE row_num > 1
            ORDER BY 2;
        """)

        data = connection.execute(raw_sql).fetchall()
        ids_to_delete = [data[0] for data in data]
        print(f"{media_list} IDs to delete: {len(ids_to_delete)}")

        placeholders = ", ".join([":id_" + str(i) for i in range(len(ids_to_delete))])
        delete_sql = sa.text(f""" DELETE FROM {media_list} WHERE id IN ({placeholders}) """)
        connection.execute(delete_sql, {"id_" + str(i): id_ for (i, id_) in enumerate(ids_to_delete)})


def downgrade():
    with op.batch_alter_table("games", schema=None) as batch_op:
        batch_op.add_column(sa.Column("collection_name", sa.TEXT(), nullable=True))
