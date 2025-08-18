"""add personalization_enabled to conversations

Revision ID: 8b92a2e8a3e5
Revises: 487eac5fa7c9
Create Date: 2025-08-10 23:42:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8b92a2e8a3e5"
down_revision = "487eac5fa7c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column with server default true to backfill existing rows
    op.add_column(
        "conversations",
        sa.Column(
            "personalization_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("conversations", "personalization_enabled")
