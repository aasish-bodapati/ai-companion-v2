"""merge_heads

Revision ID: d0c1bbc3ef2e
Revises: add_logging_tables, add_health_goals_001
Create Date: 2025-09-12 19:39:48.480704

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd0c1bbc3ef2e'
down_revision = ('add_logging_tables', 'add_health_goals_001')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
