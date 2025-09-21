"""cleanup_schema_remove_unused_columns_and_tables

Revision ID: e27d5b9806ce
Revises: 299ada1b0f8c
Create Date: 2025-09-20 20:26:23.963532

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e27d5b9806ce'
down_revision = '299ada1b0f8c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove unused columns and tables to simplify schema for fitness and nutrition logging."""
    
    # 1. Remove unused columns from users table
    op.drop_column('users', 'memory_enabled')
    
    # 2. Simplify onboarding_profiles table - remove most fields
    op.drop_column('onboarding_profiles', 'user_prompt')
    op.drop_column('onboarding_profiles', 'processed_summary')
    op.drop_column('onboarding_profiles', 'memory_chunks')
    op.drop_column('onboarding_profiles', 'structured_data')
    op.drop_column('onboarding_profiles', 'daily_schedule')
    op.drop_column('onboarding_profiles', 'schedule_preferences')
    op.drop_column('onboarding_profiles', 'fitness_goals')
    op.drop_column('onboarding_profiles', 'nutrition_goals')
    op.drop_column('onboarding_profiles', 'dietary_preferences')
    op.drop_column('onboarding_profiles', 'communication_style')
    op.drop_column('onboarding_profiles', 'additional_preferences')
    
    # 3. Remove unused columns from exercises table
    op.drop_column('exercises', 'category')
    op.drop_column('exercises', 'muscle_groups')
    op.drop_column('exercises', 'equipment_needed')
    
    # 4. Remove unused columns from fitness_logs table
    op.drop_column('fitness_logs', 'intensity')
    
    # 5. Remove unused columns from nutrition_logs table
    op.drop_column('nutrition_logs', 'mood_before')
    op.drop_column('nutrition_logs', 'mood_after')
    
    # 6. Remove unused columns from mood_logs table
    op.drop_column('mood_logs', 'water_intake_ml')
    op.drop_column('mood_logs', 'steps_count')
    op.drop_column('mood_logs', 'weight_kg')
    
    # 7. Remove unused columns from simple_routines table
    op.drop_column('simple_routines', 'tags')
    
    # 8. Remove unused columns from nutrition_routines table
    op.drop_column('nutrition_routines', 'meal_plans')
    
    # 9. Drop unused tables (Advanced Exercise System V2) - only if they exist
    try:
        op.drop_table('exercise_types')
    except:
        pass  # Table doesn't exist, skip
    
    try:
        op.drop_table('routine_exercises_v2')
    except:
        pass  # Table doesn't exist, skip
        
    try:
        op.drop_table('workout_logs_v2')
    except:
        pass  # Table doesn't exist, skip
    
    # 10. Drop unused goal tables - only if they exist
    try:
        op.drop_table('user_health_goals')
    except:
        pass  # Table doesn't exist, skip
        
    try:
        op.drop_table('user_goals')
    except:
        pass  # Table doesn't exist, skip


def downgrade() -> None:
    """Restore removed columns and tables (not recommended for production)."""
    
    # Note: This downgrade is complex and may not work perfectly
    # It's better to restore from backup if needed
    
    # Add back memory_enabled to users
    op.add_column('users', sa.Column('memory_enabled', sa.Boolean(), nullable=True))
    
    # Add back onboarding fields (simplified)
    op.add_column('onboarding_profiles', sa.Column('user_prompt', sa.Text(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('processed_summary', sa.Text(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('memory_chunks', sa.JSON(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('structured_data', sa.JSON(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('daily_schedule', sa.String(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('schedule_preferences', sa.Text(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('fitness_goals', sa.String(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('nutrition_goals', sa.String(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('dietary_preferences', sa.Text(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('communication_style', sa.String(), nullable=True))
    op.add_column('onboarding_profiles', sa.Column('additional_preferences', sa.Text(), nullable=True))
    
    # Add back exercise fields
    op.add_column('exercises', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('exercises', sa.Column('muscle_groups', sa.JSON(), nullable=True))
    op.add_column('exercises', sa.Column('equipment_needed', sa.JSON(), nullable=True))
    
    # Add back fitness_logs fields
    op.add_column('fitness_logs', sa.Column('intensity', sa.String(20), nullable=True))
    
    # Add back nutrition_logs fields
    op.add_column('nutrition_logs', sa.Column('mood_before', sa.String(20), nullable=True))
    op.add_column('nutrition_logs', sa.Column('mood_after', sa.String(20), nullable=True))
    
    # Add back mood_logs fields
    op.add_column('mood_logs', sa.Column('water_intake_ml', sa.Integer(), nullable=True))
    op.add_column('mood_logs', sa.Column('steps_count', sa.Integer(), nullable=True))
    op.add_column('mood_logs', sa.Column('weight_kg', sa.Float(), nullable=True))
    
    # Add back simple_routines fields
    op.add_column('simple_routines', sa.Column('tags', sa.JSON(), nullable=True))
    
    # Add back nutrition_routines fields
    op.add_column('nutrition_routines', sa.Column('meal_plans', sa.JSON(), nullable=True))
    
    # Note: Dropped tables would need to be recreated with full schema
    # This is complex and not recommended for production use
