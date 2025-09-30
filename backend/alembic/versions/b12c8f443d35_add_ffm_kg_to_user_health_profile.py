"""add_ffm_kg_to_user_health_profile

Revision ID: b12c8f443d35
Revises: 4bf38035fa6e
Create Date: 2025-09-30 03:05:56.974205

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b12c8f443d35'
down_revision = '4bf38035fa6e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add ffm_kg column to user_health_profile table
    op.add_column('user_health_profile', sa.Column('ffm_kg', sa.Float(), nullable=True))


def downgrade() -> None:
    # Remove ffm_kg column from user_health_profile table
    op.drop_column('user_health_profile', 'ffm_kg')
