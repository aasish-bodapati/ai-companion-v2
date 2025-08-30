"""add memory_enabled to users

Revision ID: e3c1b2a4d5f7
Revises: d75c51aff09c
Create Date: 2025-08-20 15:30:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e3c1b2a4d5f7"
down_revision = "d75c51aff09c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("memory_enabled", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "memory_enabled")
