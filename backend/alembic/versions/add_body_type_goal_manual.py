"""add body_type_goal to onboarding_profiles

Revision ID: add_body_type_goal_manual
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_body_type_goal_manual'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add body_type_goal column to onboarding_profiles table
    op.add_column('onboarding_profiles', sa.Column('body_type_goal', sa.String(50), nullable=True))


def downgrade():
    # Remove body_type_goal column from onboarding_profiles table
    op.drop_column('onboarding_profiles', 'body_type_goal')

