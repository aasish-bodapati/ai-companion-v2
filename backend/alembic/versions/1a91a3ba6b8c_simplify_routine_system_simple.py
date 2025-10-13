"""simplify_routine_system_simple

Revision ID: 1a91a3ba6b8c
Revises: 8f32df23465e
Create Date: 2025-10-13 03:22:18.468035

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a91a3ba6b8c'
down_revision = '1ca451888dc7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create simplified routines table
    op.create_table('routines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('routine_type', sa.String(50), nullable=False),  # 'workout', 'nutrition'
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        # JSON data for flexible routine structure
        sa.Column('workout_days', sa.JSON(), nullable=True),  # Array of workout day objects
        sa.Column('exercises', sa.JSON(), nullable=True),     # Array of exercise objects
        sa.Column('nutrition_plan', sa.JSON(), nullable=True), # Nutrition routine data
        sa.Column('progress_data', sa.JSON(), nullable=True),  # User progress tracking
        
        # Common fields
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for better performance
    op.create_index('ix_routines_user_id', 'routines', ['user_id'])
    op.create_index('ix_routines_routine_type', 'routines', ['routine_type'])
    op.create_index('ix_routines_is_active', 'routines', ['is_active'])
    op.create_index('ix_routines_user_type_active', 'routines', ['user_id', 'routine_type', 'is_active'])
    
    # Temporarily set active_routine_id to NULL to avoid foreign key issues
    op.execute("UPDATE users SET active_routine_id = NULL WHERE active_routine_id IS NOT NULL")
    
    # Drop foreign key constraint
    op.drop_constraint('fk_users_active_routine_id', 'users', type_='foreignkey')
    
    # Drop the old routine tables
    op.drop_table('simple_user_routine_progress')
    op.drop_table('routine_exercises')
    op.drop_table('routine_workout_days')
    op.drop_table('simple_routines')
    
    # Recreate foreign key constraint to new routines table
    op.create_foreign_key('fk_users_active_routine_id', 'users', 'routines', ['active_routine_id'], ['id'])


def downgrade() -> None:
    # Recreate the old routine tables (simplified rollback)
    pass
