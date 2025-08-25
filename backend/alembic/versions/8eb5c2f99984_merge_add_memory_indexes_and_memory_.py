"""Merge add_memory_indexes and memory_enabled heads

Revision ID: 8eb5c2f99984
Revises: add_memory_indexes, e3c1b2a4d5f7
Create Date: 2025-08-20 21:53:22.609554

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8eb5c2f99984'
down_revision = ('add_memory_indexes', 'e3c1b2a4d5f7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
