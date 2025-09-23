"""merge_heads

Revision ID: 79bdb801f3be
Revises: 5f368f9ad1b2, ebb347c6e4cd
Create Date: 2025-09-22 23:34:44.271356

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '79bdb801f3be'
down_revision = ('5f368f9ad1b2', 'ebb347c6e4cd')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
