"""Improve schema phase 2 - Migrate data to new structure

Revision ID: improve_schema_phase2
Revises: improve_schema_phase1
Create Date: 2024-01-15 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'improve_schema_phase2'
down_revision = 'improve_schema_phase1'
branch_labels = None
depends_on = None


def upgrade():
    # Migrate data from old health_goals to new structure
    import uuid
    connection = op.get_bind()
    
    # Get all existing health goals
    result = connection.execute(text("""
        SELECT user_id, goal_priority, timeline_weeks, is_active, created_at, updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
    """))
    
    # Migrate core health goals one by one
    for row in result:
        connection.execute(text("""
            INSERT INTO user_health_goals_new (id, user_id, goal_priority, timeline_weeks, is_active, created_at, updated_at)
            VALUES (:id, :user_id, :goal_priority, :timeline_weeks, :is_active, :created_at, :updated_at)
        """), {
            "id": str(uuid.uuid4()),
            "user_id": row.user_id,
            "goal_priority": row.goal_priority or 'general_health',
            "timeline_weeks": row.timeline_weeks or 12,
            "is_active": row.is_active if row.is_active is not None else True,
            "created_at": row.created_at,
            "updated_at": row.updated_at
        })
    
    # Migrate weight goals
    connection.execute(text("""
        INSERT INTO user_weight_goals (id, user_id, current_weight_kg, target_weight_kg, 
                                     current_body_fat_percent, target_body_fat_percent,
                                     current_muscle_mass_kg, target_muscle_mass_kg, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            user_id,
            current_weight_kg,
            target_weight_kg,
            current_body_fat_percent,
            target_body_fat_percent,
            current_muscle_mass_kg,
            target_muscle_mass_kg,
            created_at,
            updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (current_weight_kg IS NOT NULL OR target_weight_kg IS NOT NULL 
             OR current_body_fat_percent IS NOT NULL OR target_body_fat_percent IS NOT NULL
             OR current_muscle_mass_kg IS NOT NULL OR target_muscle_mass_kg IS NOT NULL)
    """))
    
    # Migrate nutrition goals
    connection.execute(text("""
        INSERT INTO user_nutrition_goals (id, user_id, daily_calorie_target, daily_protein_target_g,
                                        daily_carbs_target_g, daily_fat_target_g, daily_fiber_target_g,
                                        daily_water_target_ml, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            user_id,
            daily_calorie_target,
            daily_protein_target_g,
            daily_carbs_target_g,
            daily_fat_target_g,
            daily_fiber_target_g,
            daily_water_target_ml,
            created_at,
            updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (daily_calorie_target IS NOT NULL OR daily_protein_target_g IS NOT NULL 
             OR daily_carbs_target_g IS NOT NULL OR daily_fat_target_g IS NOT NULL
             OR daily_fiber_target_g IS NOT NULL OR daily_water_target_ml IS NOT NULL)
    """))
    
    # Migrate fitness goals
    connection.execute(text("""
        INSERT INTO user_fitness_goals (id, user_id, weekly_workout_target, daily_steps_target,
                                      weekly_cardio_minutes, weekly_strength_sessions, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            user_id,
            weekly_workout_target,
            daily_steps_target,
            weekly_cardio_minutes,
            weekly_strength_sessions,
            created_at,
            updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (weekly_workout_target IS NOT NULL OR daily_steps_target IS NOT NULL 
             OR weekly_cardio_minutes IS NOT NULL OR weekly_strength_sessions IS NOT NULL)
    """))
    
    # Migrate weight data from mood_logs to user_weight_logs
    connection.execute(text("""
        INSERT INTO user_weight_logs (id, user_id, weight_kg, log_date, created_at)
        SELECT 
            gen_random_uuid(),
            user_id,
            weight_kg,
            log_date,
            created_at
        FROM mood_logs
        WHERE user_id IS NOT NULL AND weight_kg IS NOT NULL
    """))
    
    # Add category_id column to routine_workouts
    op.add_column('routine_workouts', sa.Column('category_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_routine_workouts_category', 'routine_workouts', 'workout_categories', ['category_id'], ['id'], ondelete='SET NULL')
    op.create_index('idx_routine_workouts_category', 'routine_workouts', ['category_id'], unique=False)
    
    # Assign default categories to existing routine workouts
    connection.execute(text("""
        UPDATE routine_workouts 
        SET category_id = (
            SELECT id FROM workout_categories 
            WHERE name = CASE 
                WHEN activity_type IN ('running', 'walking', 'cycling', 'swimming', 'cardio') THEN 'Cardio'
                WHEN activity_type IN ('weightlifting', 'strength_training') THEN 'Strength'
                WHEN activity_type IN ('yoga', 'pilates', 'flexibility', 'stretching') THEN 'Flexibility'
                WHEN activity_type IN ('sports', 'dancing', 'hiking') THEN 'Sports'
                ELSE 'Recovery'
            END
            LIMIT 1
        )
        WHERE category_id IS NULL
    """))


def downgrade():
    # Remove category_id column from routine_workouts
    op.drop_index('idx_routine_workouts_category', table_name='routine_workouts')
    op.drop_constraint('fk_routine_workouts_category', 'routine_workouts', type_='foreignkey')
    op.drop_column('routine_workouts', 'category_id')
    
    # Clear migrated data
    connection = op.get_bind()
    connection.execute(text("DELETE FROM user_fitness_goals"))
    connection.execute(text("DELETE FROM user_nutrition_goals"))
    connection.execute(text("DELETE FROM user_weight_goals"))
    connection.execute(text("DELETE FROM user_health_goals_new"))
    connection.execute(text("DELETE FROM user_weight_logs"))
