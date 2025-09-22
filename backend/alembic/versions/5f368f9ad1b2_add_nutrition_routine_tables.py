"""add_nutrition_routine_tables

Revision ID: 5f368f9ad1b2
Revises: 9c2439f722a1
Create Date: 2025-09-22 06:43:07.045907

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5f368f9ad1b2'
down_revision = '9c2439f722a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create nutrition_routines table
    op.create_table('nutrition_routines',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('difficulty', sa.VARCHAR(length=20), nullable=False),
        sa.Column('duration_weeks', sa.INTEGER(), nullable=False),
        sa.Column('target_calories', sa.INTEGER(), nullable=False),
        sa.Column('is_template', sa.BOOLEAN(), nullable=True),
        sa.Column('created_by_user_id', sa.INTEGER(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], name='nutrition_routines_created_by_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='nutrition_routines_pkey')
    )
    
    # Create nutrition_user_routine_progress table
    op.create_table('nutrition_user_routine_progress',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('routine_id', sa.INTEGER(), nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('is_active', sa.BOOLEAN(), nullable=True),
        sa.Column('started_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('completed_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('days_completed', sa.INTEGER(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['routine_id'], ['nutrition_routines.id'], name='nutrition_user_routine_progress_routine_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='nutrition_user_routine_progress_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='nutrition_user_routine_progress_pkey')
    )


def downgrade() -> None:
    op.drop_table('nutrition_user_routine_progress')
    op.drop_table('nutrition_routines')
