"""Improve schema phase 2 - Migrate data to new structure (SQLite compatible)

Revision ID: improve_schema_phase2_sqlite
Revises: improve_schema_phase1
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import uuid

# revision identifiers, used by Alembic.
revision = 'improve_schema_phase2_sqlite'
down_revision = 'improve_schema_phase1'
branch_labels = None
depends_on = None


def upgrade():
    # Migrate data from old health_goals to new structure
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
    weight_result = connection.execute(text("""
        SELECT user_id, current_weight_kg, target_weight_kg, current_body_fat_percent, 
               target_body_fat_percent, current_muscle_mass_kg, target_muscle_mass_kg, 
               created_at, updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (current_weight_kg IS NOT NULL OR target_weight_kg IS NOT NULL 
             OR current_body_fat_percent IS NOT NULL OR target_body_fat_percent IS NOT NULL
             OR current_muscle_mass_kg IS NOT NULL OR target_muscle_mass_kg IS NOT NULL)
    """))
    
    for row in weight_result:
        connection.execute(text("""
            INSERT INTO user_weight_goals (id, user_id, current_weight_kg, target_weight_kg, 
                                         current_body_fat_percent, target_body_fat_percent,
                                         current_muscle_mass_kg, target_muscle_mass_kg, created_at, updated_at)
            VALUES (:id, :user_id, :current_weight_kg, :target_weight_kg, :current_body_fat_percent, 
                    :target_body_fat_percent, :current_muscle_mass_kg, :target_muscle_mass_kg, 
                    :created_at, :updated_at)
        """), {
            "id": str(uuid.uuid4()),
            "user_id": row.user_id,
            "current_weight_kg": row.current_weight_kg,
            "target_weight_kg": row.target_weight_kg,
            "current_body_fat_percent": row.current_body_fat_percent,
            "target_body_fat_percent": row.target_body_fat_percent,
            "current_muscle_mass_kg": row.current_muscle_mass_kg,
            "target_muscle_mass_kg": row.target_muscle_mass_kg,
            "created_at": row.created_at,
            "updated_at": row.updated_at
        })
    
    # Migrate nutrition goals
    nutrition_result = connection.execute(text("""
        SELECT user_id, daily_calorie_target, daily_protein_target_g, daily_carbs_target_g,
               daily_fat_target_g, daily_fiber_target_g, daily_water_target_ml, 
               created_at, updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (daily_calorie_target IS NOT NULL OR daily_protein_target_g IS NOT NULL 
             OR daily_carbs_target_g IS NOT NULL OR daily_fat_target_g IS NOT NULL
             OR daily_fiber_target_g IS NOT NULL OR daily_water_target_ml IS NOT NULL)
    """))
    
    for row in nutrition_result:
        connection.execute(text("""
            INSERT INTO user_nutrition_goals (id, user_id, daily_calorie_target, daily_protein_target_g,
                                            daily_carbs_target_g, daily_fat_target_g, daily_fiber_target_g,
                                            daily_water_target_ml, created_at, updated_at)
            VALUES (:id, :user_id, :daily_calorie_target, :daily_protein_target_g, :daily_carbs_target_g,
                    :daily_fat_target_g, :daily_fiber_target_g, :daily_water_target_ml, :created_at, :updated_at)
        """), {
            "id": str(uuid.uuid4()),
            "user_id": row.user_id,
            "daily_calorie_target": row.daily_calorie_target,
            "daily_protein_target_g": row.daily_protein_target_g,
            "daily_carbs_target_g": row.daily_carbs_target_g,
            "daily_fat_target_g": row.daily_fat_target_g,
            "daily_fiber_target_g": row.daily_fiber_target_g,
            "daily_water_target_ml": row.daily_water_target_ml,
            "created_at": row.created_at,
            "updated_at": row.updated_at
        })
    
    # Migrate fitness goals
    fitness_result = connection.execute(text("""
        SELECT user_id, weekly_workout_target, daily_steps_target, weekly_cardio_minutes,
               weekly_strength_sessions, created_at, updated_at
        FROM user_health_goals
        WHERE user_id IS NOT NULL
        AND (weekly_workout_target IS NOT NULL OR daily_steps_target IS NOT NULL 
             OR weekly_cardio_minutes IS NOT NULL OR weekly_strength_sessions IS NOT NULL)
    """))
    
    for row in fitness_result:
        connection.execute(text("""
            INSERT INTO user_fitness_goals (id, user_id, weekly_workout_target, daily_steps_target,
                                          weekly_cardio_minutes, weekly_strength_sessions, created_at, updated_at)
            VALUES (:id, :user_id, :weekly_workout_target, :daily_steps_target, :weekly_cardio_minutes,
                    :weekly_strength_sessions, :created_at, :updated_at)
        """), {
            "id": str(uuid.uuid4()),
            "user_id": row.user_id,
            "weekly_workout_target": row.weekly_workout_target,
            "daily_steps_target": row.daily_steps_target,
            "weekly_cardio_minutes": row.weekly_cardio_minutes,
            "weekly_strength_sessions": row.weekly_strength_sessions,
            "created_at": row.created_at,
            "updated_at": row.updated_at
        })


def downgrade():
    # Remove migrated data
    op.execute("DELETE FROM user_fitness_goals")
    op.execute("DELETE FROM user_nutrition_goals")
    op.execute("DELETE FROM user_weight_goals")
    op.execute("DELETE FROM user_health_goals_new")
