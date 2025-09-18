"""merge routine tables

Revision ID: f93ea5c97069
Revises: add_routine_tables, d0c1bbc3ef2e
Create Date: 2025-09-14 18:10:03.799108

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f93ea5c97069'
down_revision = ('add_routine_tables', 'd0c1bbc3ef2e')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
