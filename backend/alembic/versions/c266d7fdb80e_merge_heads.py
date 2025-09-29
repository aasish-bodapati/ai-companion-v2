"""merge_heads

Revision ID: c266d7fdb80e
Revises: add_body_type_goal_manual, d195e79a2830
Create Date: 2025-09-29 22:35:05.131529

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c266d7fdb80e'
down_revision = ('add_body_type_goal_manual', 'd195e79a2830')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
