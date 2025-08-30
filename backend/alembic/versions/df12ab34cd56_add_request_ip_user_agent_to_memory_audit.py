"""add request_ip and user_agent to memory_audit

Revision ID: df12ab34cd56
Revises: ba21edb389c5
Create Date: 2025-08-25 23:05:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "df12ab34cd56"
down_revision = "ba21edb389c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("memory_audit") as batch_op:
        batch_op.add_column(sa.Column("request_ip", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("user_agent", sa.String(length=256), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("memory_audit") as batch_op:
        batch_op.drop_column("user_agent")
        batch_op.drop_column("request_ip")
