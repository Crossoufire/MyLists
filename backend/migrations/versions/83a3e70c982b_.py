"""
Add author to book model, remove books_authors table
Revision ID: 83a3e70c982b
Revises: 7db72e6e7814
Create Date: 2024-09-25 18:37:59.781042
"""
from alembic import op
import sqlalchemy as sa


revision = "83a3e70c982b"
down_revision = "7db72e6e7814"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.add_column(sa.Column("authors", sa.String(), nullable=True))

    connection = op.get_bind()
    metadata = sa.MetaData()

    books_table = sa.Table("books", metadata, autoload_with=connection)
    books_authors_table = sa.Table("books_authors", metadata, autoload_with=connection)

    results = connection.execute(sa.select(books_authors_table)).fetchall()

    books_authors_dict = {}
    for row in results:
        book_id = row.media_id
        author_name = row.name
        if book_id not in books_authors_dict:
            books_authors_dict[book_id] = []
        books_authors_dict[book_id].append(author_name)

    for book_id, authors in books_authors_dict.items():
        authors_string = ", ".join(authors)
        # noinspection PyTypeChecker
        connection.execute(books_table.update().where(books_table.c.id == book_id).values(authors=authors_string))

    op.drop_table("books_authors")


def downgrade():
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.drop_column("authors")
