"""add_activity_level_to_user_health_profile

Revision ID: 9c2439f722a1
Revises: e92d1b5dc214
Create Date: 2025-09-22 03:07:53.624868

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c2439f722a1'
down_revision = 'e92d1b5dc214'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add activity_level column to user_health_profile table
    op.add_column('user_health_profile', sa.Column('activity_level', sa.String(20), nullable=True))


def downgrade() -> None:
    # Remove activity_level column from user_health_profile table
    op.drop_column('user_health_profile', 'activity_level')
