"""add workout and nutrition plans

Revision ID: d75c51aff09c
Revises: 87cb36ffda0a
Create Date: 2025-08-18 10:50:38.335113

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd75c51aff09c'
down_revision = '87cb36ffda0a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create workout_plans table
    op.create_table(
        'workout_plans',
        sa.Column('id', sa.VARCHAR(length=36), nullable=False),
        sa.Column('user_id', sa.VARCHAR(length=36), nullable=False),
        sa.Column('title', sa.VARCHAR(length=255), nullable=False),
        sa.Column('summary_md', sa.TEXT(), nullable=False),
        sa.Column('structured', sa.TEXT(), nullable=True),
        sa.Column('status', sa.VARCHAR(length=20), nullable=False, server_default=sa.text("'active'")),
        sa.Column('source', sa.VARCHAR(length=30), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name='workout_plans_pkey')
    )
    op.create_index('ix_workout_plans_user_id', 'workout_plans', ['user_id'], unique=False)
    op.create_index('ix_workout_plans_status', 'workout_plans', ['status'], unique=False)

    # Create nutrition_plans table
    op.create_table(
        'nutrition_plans',
        sa.Column('id', sa.VARCHAR(length=36), nullable=False),
        sa.Column('user_id', sa.VARCHAR(length=36), nullable=False),
        sa.Column('title', sa.VARCHAR(length=255), nullable=False),
        sa.Column('summary_md', sa.TEXT(), nullable=False),
        sa.Column('structured', sa.TEXT(), nullable=True),
        sa.Column('status', sa.VARCHAR(length=20), nullable=False, server_default=sa.text("'active'")),
        sa.Column('source', sa.VARCHAR(length=30), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name='nutrition_plans_pkey')
    )
    op.create_index('ix_nutrition_plans_user_id', 'nutrition_plans', ['user_id'], unique=False)
    op.create_index('ix_nutrition_plans_status', 'nutrition_plans', ['status'], unique=False)


def downgrade() -> None:
    # Drop indexes and tables for nutrition_plans and workout_plans only
    op.drop_index('ix_nutrition_plans_status', table_name='nutrition_plans')
    op.drop_index('ix_nutrition_plans_user_id', table_name='nutrition_plans')
    op.drop_table('nutrition_plans')

    op.drop_index('ix_workout_plans_status', table_name='workout_plans')
    op.drop_index('ix_workout_plans_user_id', table_name='workout_plans')
    op.drop_table('workout_plans')
