"""
Delete unused admin user in database
Revision ID: 4c2246941f44
Revises: 33fe8a587fd4
Create Date: 2024-08-25 16:31:28.020515
"""
from alembic import op
import sqlalchemy as sa


revision = "4c2246941f44"
down_revision = "33fe8a587fd4"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    metadata = sa.MetaData()

    user_table = sa.Table("user", metadata, autoload_with=connection)
    ums_table = sa.Table("user_media_settings", metadata, autoload_with=connection)

    admin_user_id = connection.execute(sa.select(user_table.c.id).where(user_table.c.username == "admin")).scalar()
    # noinspection PyTypeChecker
    connection.execute(ums_table.delete().where(ums_table.c.user_id == admin_user_id))
    # noinspection PyTypeChecker
    connection.execute(user_table.delete().where(user_table.c.id == admin_user_id))


def downgrade():
    pass
