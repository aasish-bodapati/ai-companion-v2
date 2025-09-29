"""add_smm_bodyfat_workout_days_to_health_profile

Revision ID: 4bf38035fa6e
Revises: add_created_by_column
Create Date: 2025-09-30 01:07:23.909935

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4bf38035fa6e'
down_revision = 'add_created_by_column'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to user_health_profile table
    op.add_column('user_health_profile', sa.Column('smm_kg', sa.Float(), nullable=True))
    op.add_column('user_health_profile', sa.Column('body_fat_percentage', sa.Float(), nullable=True))
    op.add_column('user_health_profile', sa.Column('workout_days_per_week', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('user_health_profile', 'workout_days_per_week')
    op.drop_column('user_health_profile', 'body_fat_percentage')
    op.drop_column('user_health_profile', 'smm_kg')
