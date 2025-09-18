"""Improve schema phase 1 - Create new tables and indexes

Revision ID: improve_schema_phase1
Revises: f93ea5c97069
Create Date: 2024-01-15 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'improve_schema_phase1'
down_revision = 'f93ea5c97069'
branch_labels = None
depends_on = None


def upgrade():
    # Create workout_categories table
    op.create_table('workout_categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_workout_categories_name', 'workout_categories', ['name'], unique=False)
    op.create_index('idx_workout_categories_active', 'workout_categories', ['is_active'], unique=False)

    # Insert default categories
    op.execute("""
        INSERT INTO workout_categories (id, name, description, is_active) VALUES
        ('550e8400-e29b-41d4-a716-446655440001', 'Cardio', 'Cardiovascular exercises', true),
        ('550e8400-e29b-41d4-a716-446655440002', 'Strength', 'Strength training exercises', true),
        ('550e8400-e29b-41d4-a716-446655440003', 'Flexibility', 'Stretching and flexibility exercises', true),
        ('550e8400-e29b-41d4-a716-446655440004', 'Sports', 'Sport-specific activities', true),
        ('550e8400-e29b-41d4-a716-446655440005', 'Recovery', 'Recovery and rehabilitation exercises', true)
    """)

    # Create user_weight_logs table
    op.create_table('user_weight_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.Column('body_fat_percent', sa.Float(), nullable=True),
        sa.Column('muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('waist_circumference_cm', sa.Float(), nullable=True),
        sa.Column('hip_circumference_cm', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('log_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_weight_logs_user_id', 'user_weight_logs', ['user_id'], unique=False)
    op.create_index('idx_user_weight_logs_user_date', 'user_weight_logs', ['user_id', 'log_date'], unique=False)
    op.create_index('idx_user_weight_logs_log_date', 'user_weight_logs', ['log_date'], unique=False)

    # Create new simplified health goals tables
    op.create_table('user_health_goals_new',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('goal_priority', sa.String(length=50), nullable=False),
        sa.Column('timeline_weeks', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_health_goals_user_id', 'user_health_goals_new', ['user_id'], unique=False)
    op.create_index('idx_user_health_goals_priority', 'user_health_goals_new', ['goal_priority'], unique=False)
    op.create_index('idx_user_health_goals_active', 'user_health_goals_new', ['is_active'], unique=False)

    op.create_table('user_weight_goals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('current_weight_kg', sa.Float(), nullable=True),
        sa.Column('target_weight_kg', sa.Float(), nullable=True),
        sa.Column('current_body_fat_percent', sa.Float(), nullable=True),
        sa.Column('target_body_fat_percent', sa.Float(), nullable=True),
        sa.Column('current_muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('target_muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_weight_goals_user_id', 'user_weight_goals', ['user_id'], unique=False)

    op.create_table('user_nutrition_goals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('daily_calorie_target', sa.Integer(), nullable=True),
        sa.Column('daily_protein_target_g', sa.Float(), nullable=True),
        sa.Column('daily_carbs_target_g', sa.Float(), nullable=True),
        sa.Column('daily_fat_target_g', sa.Float(), nullable=True),
        sa.Column('daily_fiber_target_g', sa.Float(), nullable=True),
        sa.Column('daily_water_target_ml', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_nutrition_goals_user_id', 'user_nutrition_goals', ['user_id'], unique=False)

    op.create_table('user_fitness_goals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('weekly_workout_target', sa.Integer(), nullable=True),
        sa.Column('daily_steps_target', sa.Integer(), nullable=True),
        sa.Column('weekly_cardio_minutes', sa.Integer(), nullable=True),
        sa.Column('weekly_strength_sessions', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_fitness_goals_user_id', 'user_fitness_goals', ['user_id'], unique=False)

    # Add new indexes to existing tables
    op.create_index('idx_fitness_logs_user_date', 'fitness_logs', ['user_id', 'activity_date'], unique=False)
    op.create_index('idx_fitness_logs_activity_type', 'fitness_logs', ['activity_type'], unique=False)
    op.create_index('idx_fitness_logs_activity_date', 'fitness_logs', ['activity_date'], unique=False)
    
    op.create_index('idx_nutrition_logs_user_date', 'nutrition_logs', ['user_id', 'meal_date'], unique=False)
    op.create_index('idx_nutrition_logs_meal_type', 'nutrition_logs', ['meal_type'], unique=False)
    op.create_index('idx_nutrition_logs_meal_date', 'nutrition_logs', ['meal_date'], unique=False)
    
    op.create_index('idx_mood_logs_user_date', 'mood_logs', ['user_id', 'log_date'], unique=False)
    op.create_index('idx_mood_logs_log_date', 'mood_logs', ['log_date'], unique=False)
    
    op.create_index('idx_routines_created_by', 'routines', ['created_by_user_id'], unique=False)
    op.create_index('idx_routines_template', 'routines', ['is_template'], unique=False)
    op.create_index('idx_routines_active', 'routines', ['is_active'], unique=False)
    op.create_index('idx_routines_difficulty', 'routines', ['difficulty'], unique=False)
    
    op.create_index('idx_routine_workouts_routine_day', 'routine_workouts', ['routine_id', 'day'], unique=False)
    op.create_index('idx_routine_workouts_activity_type', 'routine_workouts', ['activity_type'], unique=False)
    
    op.create_index('idx_user_routine_progress_user_active', 'user_routine_progress', ['user_id', 'is_active'], unique=False)
    op.create_index('idx_user_routine_progress_active', 'user_routine_progress', ['is_active'], unique=False)
    op.create_index('idx_user_routine_workout_logs_week', 'user_routine_workout_logs', ['user_id', 'routine_id', 'week_number'], unique=False)


def downgrade():
    # Remove new indexes
    op.drop_index('idx_user_routine_workout_logs_week', table_name='user_routine_workout_logs')
    op.drop_index('idx_user_routine_progress_active', table_name='user_routine_progress')
    op.drop_index('idx_user_routine_progress_user_active', table_name='user_routine_progress')
    op.drop_index('idx_routine_workouts_activity_type', table_name='routine_workouts')
    op.drop_index('idx_routine_workouts_routine_day', table_name='routine_workouts')
    op.drop_index('idx_routines_difficulty', table_name='routines')
    op.drop_index('idx_routines_active', table_name='routines')
    op.drop_index('idx_routines_template', table_name='routines')
    op.drop_index('idx_routines_created_by', table_name='routines')
    op.drop_index('idx_mood_logs_log_date', table_name='mood_logs')
    op.drop_index('idx_mood_logs_user_date', table_name='mood_logs')
    op.drop_index('idx_nutrition_logs_meal_date', table_name='nutrition_logs')
    op.drop_index('idx_nutrition_logs_meal_type', table_name='nutrition_logs')
    op.drop_index('idx_nutrition_logs_user_date', table_name='nutrition_logs')
    op.drop_index('idx_fitness_logs_activity_date', table_name='fitness_logs')
    op.drop_index('idx_fitness_logs_activity_type', table_name='fitness_logs')
    op.drop_index('idx_fitness_logs_user_date', table_name='fitness_logs')

    # Drop new tables
    op.drop_table('user_fitness_goals')
    op.drop_table('user_nutrition_goals')
    op.drop_table('user_weight_goals')
    op.drop_table('user_health_goals_new')
    op.drop_table('user_weight_logs')
    op.drop_table('workout_categories')
