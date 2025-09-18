"""Improve schema phase 3 - Cleanup and finalize

Revision ID: improve_schema_phase3
Revises: improve_schema_phase2
Create Date: 2024-01-15 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'improve_schema_phase3'
down_revision = 'improve_schema_phase2_sqlite'
branch_labels = None
depends_on = None


def upgrade():
    # Rename new tables to replace old ones
    op.rename_table('user_health_goals', 'user_health_goals_old')
    op.rename_table('user_health_goals_new', 'user_health_goals')
    
    # Add constraints to new tables
    op.create_check_constraint('ck_user_health_goals_priority', 'user_health_goals', 
                              "goal_priority IN ('weight_loss', 'muscle_gain', 'maintenance', 'general_health', 'performance', 'rehabilitation')")
    op.create_check_constraint('ck_user_health_goals_timeline', 'user_health_goals', 
                              'timeline_weeks >= 1 AND timeline_weeks <= 104')
    
    op.create_check_constraint('ck_user_weight_goals_current_weight', 'user_weight_goals', 
                              'current_weight_kg >= 0 AND current_weight_kg <= 500')
    op.create_check_constraint('ck_user_weight_goals_target_weight', 'user_weight_goals', 
                              'target_weight_kg >= 0 AND target_weight_kg <= 500')
    op.create_check_constraint('ck_user_weight_goals_body_fat', 'user_weight_goals', 
                              'current_body_fat_percent >= 0 AND current_body_fat_percent <= 100')
    op.create_check_constraint('ck_user_weight_goals_target_body_fat', 'user_weight_goals', 
                              'target_body_fat_percent >= 0 AND target_body_fat_percent <= 100')
    op.create_check_constraint('ck_user_weight_goals_muscle_mass', 'user_weight_goals', 
                              'current_muscle_mass_kg >= 0 AND current_muscle_mass_kg <= 200')
    op.create_check_constraint('ck_user_weight_goals_target_muscle_mass', 'user_weight_goals', 
                              'target_muscle_mass_kg >= 0 AND target_muscle_mass_kg <= 200')
    
    op.create_check_constraint('ck_user_nutrition_goals_calories', 'user_nutrition_goals', 
                              'daily_calorie_target >= 500 AND daily_calorie_target <= 10000')
    op.create_check_constraint('ck_user_nutrition_goals_protein', 'user_nutrition_goals', 
                              'daily_protein_target_g >= 0 AND daily_protein_target_g <= 500')
    op.create_check_constraint('ck_user_nutrition_goals_carbs', 'user_nutrition_goals', 
                              'daily_carbs_target_g >= 0 AND daily_carbs_target_g <= 1000')
    op.create_check_constraint('ck_user_nutrition_goals_fat', 'user_nutrition_goals', 
                              'daily_fat_target_g >= 0 AND daily_fat_target_g <= 500')
    op.create_check_constraint('ck_user_nutrition_goals_fiber', 'user_nutrition_goals', 
                              'daily_fiber_target_g >= 0 AND daily_fiber_target_g <= 100')
    op.create_check_constraint('ck_user_nutrition_goals_water', 'user_nutrition_goals', 
                              'daily_water_target_ml >= 0 AND daily_water_target_ml <= 10000')
    
    op.create_check_constraint('ck_user_fitness_goals_workouts', 'user_fitness_goals', 
                              'weekly_workout_target >= 0 AND weekly_workout_target <= 14')
    op.create_check_constraint('ck_user_fitness_goals_steps', 'user_fitness_goals', 
                              'daily_steps_target >= 0 AND daily_steps_target <= 50000')
    op.create_check_constraint('ck_user_fitness_goals_cardio', 'user_fitness_goals', 
                              'weekly_cardio_minutes >= 0 AND weekly_cardio_minutes <= 2000')
    op.create_check_constraint('ck_user_fitness_goals_strength', 'user_fitness_goals', 
                              'weekly_strength_sessions >= 0 AND weekly_strength_sessions <= 10')
    
    op.create_check_constraint('ck_user_weight_logs_weight', 'user_weight_logs', 
                              'weight_kg >= 0 AND weight_kg <= 500')
    op.create_check_constraint('ck_user_weight_logs_body_fat', 'user_weight_logs', 
                              'body_fat_percent >= 0 AND body_fat_percent <= 100')
    op.create_check_constraint('ck_user_weight_logs_muscle_mass', 'user_weight_logs', 
                              'muscle_mass_kg >= 0 AND muscle_mass_kg <= 200')
    op.create_check_constraint('ck_user_weight_logs_waist', 'user_weight_logs', 
                              'waist_circumference_cm >= 0 AND waist_circumference_cm <= 200')
    op.create_check_constraint('ck_user_weight_logs_hip', 'user_weight_logs', 
                              'hip_circumference_cm >= 0 AND hip_circumference_cm <= 200')
    
    # Add constraints to existing tables
    op.create_check_constraint('ck_fitness_logs_duration', 'fitness_logs', 
                              'duration_minutes > 0 AND duration_minutes <= 1440')
    op.create_check_constraint('ck_fitness_logs_intensity', 'fitness_logs', 
                              "intensity IN ('low', 'medium', 'high')")
    op.create_check_constraint('ck_fitness_logs_calories', 'fitness_logs', 
                              'calories_burned >= 0')
    op.create_check_constraint('ck_fitness_logs_distance', 'fitness_logs', 
                              'distance_km >= 0')
    op.create_check_constraint('ck_fitness_logs_weight', 'fitness_logs', 
                              'weight_kg >= 0')
    op.create_check_constraint('ck_fitness_logs_reps', 'fitness_logs', 
                              'reps >= 0')
    op.create_check_constraint('ck_fitness_logs_sets', 'fitness_logs', 
                              'sets >= 0')
    
    op.create_check_constraint('ck_nutrition_logs_meal_type', 'nutrition_logs', 
                              "meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')")
    op.create_check_constraint('ck_nutrition_logs_calories', 'nutrition_logs', 
                              'total_calories >= 0')
    op.create_check_constraint('ck_nutrition_logs_protein', 'nutrition_logs', 
                              'protein_g >= 0')
    op.create_check_constraint('ck_nutrition_logs_carbs', 'nutrition_logs', 
                              'carbs_g >= 0')
    op.create_check_constraint('ck_nutrition_logs_fat', 'nutrition_logs', 
                              'fat_g >= 0')
    op.create_check_constraint('ck_nutrition_logs_fiber', 'nutrition_logs', 
                              'fiber_g >= 0')
    op.create_check_constraint('ck_nutrition_logs_sugar', 'nutrition_logs', 
                              'sugar_g >= 0')
    op.create_check_constraint('ck_nutrition_logs_sodium', 'nutrition_logs', 
                              'sodium_mg >= 0')
    
    op.create_check_constraint('ck_mood_logs_rating', 'mood_logs', 
                              'mood_rating >= 1 AND mood_rating <= 10')
    op.create_check_constraint('ck_mood_logs_energy', 'mood_logs', 
                              'energy_level >= 1 AND energy_level <= 10')
    op.create_check_constraint('ck_mood_logs_stress', 'mood_logs', 
                              'stress_level >= 1 AND stress_level <= 10')
    op.create_check_constraint('ck_mood_logs_sleep_quality', 'mood_logs', 
                              'sleep_quality >= 1 AND sleep_quality <= 10')
    op.create_check_constraint('ck_mood_logs_sleep_hours', 'mood_logs', 
                              'sleep_hours >= 0 AND sleep_hours <= 24')
    op.create_check_constraint('ck_mood_logs_water', 'mood_logs', 
                              'water_intake_ml >= 0')
    op.create_check_constraint('ck_mood_logs_steps', 'mood_logs', 
                              'steps_count >= 0')
    op.create_check_constraint('ck_mood_logs_weight', 'mood_logs', 
                              'weight_kg >= 0')
    
    op.create_check_constraint('ck_routines_difficulty', 'routines', 
                              "difficulty IN ('beginner', 'intermediate', 'advanced')")
    op.create_check_constraint('ck_routines_duration', 'routines', 
                              'duration_weeks > 0')
    
    op.create_check_constraint('ck_routine_workouts_day', 'routine_workouts', 
                              "day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
    op.create_check_constraint('ck_routine_workouts_duration', 'routine_workouts', 
                              'duration_minutes > 0')
    op.create_check_constraint('ck_routine_workouts_intensity', 'routine_workouts', 
                              "intensity IN ('low', 'medium', 'high')")
    op.create_check_constraint('ck_routine_workouts_calories', 'routine_workouts', 
                              'calories_burned >= 0')
    
    op.create_check_constraint('ck_user_routine_progress_week', 'user_routine_progress', 
                              'current_week > 0')
    op.create_check_constraint('ck_user_routine_progress_weeks_completed', 'user_routine_progress', 
                              'total_weeks_completed >= 0')
    op.create_check_constraint('ck_user_routine_progress_workouts_week', 'user_routine_progress', 
                              'workouts_completed_this_week >= 0')
    op.create_check_constraint('ck_user_routine_progress_workouts_total', 'user_routine_progress', 
                              'total_workouts_completed >= 0')
    
    op.create_check_constraint('ck_user_routine_workout_logs_week', 'user_routine_workout_logs', 
                              'week_number > 0')
    op.create_check_constraint('ck_user_routine_workout_logs_duration', 'user_routine_workout_logs', 
                              'actual_duration_minutes > 0')
    op.create_check_constraint('ck_user_routine_workout_logs_calories', 'user_routine_workout_logs', 
                              'actual_calories_burned >= 0')
    op.create_check_constraint('ck_user_routine_workout_logs_weight', 'user_routine_workout_logs', 
                              'actual_weight_kg >= 0')
    op.create_check_constraint('ck_user_routine_workout_logs_reps', 'user_routine_workout_logs', 
                              'actual_reps >= 0')
    op.create_check_constraint('ck_user_routine_workout_logs_sets', 'user_routine_workout_logs', 
                              'actual_sets >= 0')


def downgrade():
    # Remove constraints
    op.drop_constraint('ck_user_routine_workout_logs_sets', 'user_routine_workout_logs', type_='check')
    op.drop_constraint('ck_user_routine_workout_logs_reps', 'user_routine_workout_logs', type_='check')
    op.drop_constraint('ck_user_routine_workout_logs_weight', 'user_routine_workout_logs', type_='check')
    op.drop_constraint('ck_user_routine_workout_logs_calories', 'user_routine_workout_logs', type_='check')
    op.drop_constraint('ck_user_routine_workout_logs_duration', 'user_routine_workout_logs', type_='check')
    op.drop_constraint('ck_user_routine_workout_logs_week', 'user_routine_workout_logs', type_='check')
    
    op.drop_constraint('ck_user_routine_progress_workouts_total', 'user_routine_progress', type_='check')
    op.drop_constraint('ck_user_routine_progress_workouts_week', 'user_routine_progress', type_='check')
    op.drop_constraint('ck_user_routine_progress_weeks_completed', 'user_routine_progress', type_='check')
    op.drop_constraint('ck_user_routine_progress_week', 'user_routine_progress', type_='check')
    
    op.drop_constraint('ck_routine_workouts_calories', 'routine_workouts', type_='check')
    op.drop_constraint('ck_routine_workouts_intensity', 'routine_workouts', type_='check')
    op.drop_constraint('ck_routine_workouts_duration', 'routine_workouts', type_='check')
    op.drop_constraint('ck_routine_workouts_day', 'routine_workouts', type_='check')
    
    op.drop_constraint('ck_routines_duration', 'routines', type_='check')
    op.drop_constraint('ck_routines_difficulty', 'routines', type_='check')
    
    op.drop_constraint('ck_mood_logs_weight', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_steps', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_water', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_sleep_hours', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_sleep_quality', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_stress', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_energy', 'mood_logs', type_='check')
    op.drop_constraint('ck_mood_logs_rating', 'mood_logs', type_='check')
    
    op.drop_constraint('ck_nutrition_logs_sodium', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_sugar', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_fiber', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_fat', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_carbs', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_protein', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_calories', 'nutrition_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_meal_type', 'nutrition_logs', type_='check')
    
    op.drop_constraint('ck_fitness_logs_sets', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_reps', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_weight', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_distance', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_calories', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_intensity', 'fitness_logs', type_='check')
    op.drop_constraint('ck_fitness_logs_duration', 'fitness_logs', type_='check')
    
    op.drop_constraint('ck_user_weight_logs_hip', 'user_weight_logs', type_='check')
    op.drop_constraint('ck_user_weight_logs_waist', 'user_weight_logs', type_='check')
    op.drop_constraint('ck_user_weight_logs_muscle_mass', 'user_weight_logs', type_='check')
    op.drop_constraint('ck_user_weight_logs_body_fat', 'user_weight_logs', type_='check')
    op.drop_constraint('ck_user_weight_logs_weight', 'user_weight_logs', type_='check')
    
    op.drop_constraint('ck_user_fitness_goals_strength', 'user_fitness_goals', type_='check')
    op.drop_constraint('ck_user_fitness_goals_cardio', 'user_fitness_goals', type_='check')
    op.drop_constraint('ck_user_fitness_goals_steps', 'user_fitness_goals', type_='check')
    op.drop_constraint('ck_user_fitness_goals_workouts', 'user_fitness_goals', type_='check')
    
    op.drop_constraint('ck_user_nutrition_goals_water', 'user_nutrition_goals', type_='check')
    op.drop_constraint('ck_user_nutrition_goals_fiber', 'user_nutrition_goals', type_='check')
    op.drop_constraint('ck_user_nutrition_goals_fat', 'user_nutrition_goals', type_='check')
    op.drop_constraint('ck_user_nutrition_goals_carbs', 'user_nutrition_goals', type_='check')
    op.drop_constraint('ck_user_nutrition_goals_protein', 'user_nutrition_goals', type_='check')
    op.drop_constraint('ck_user_nutrition_goals_calories', 'user_nutrition_goals', type_='check')
    
    op.drop_constraint('ck_user_weight_goals_target_muscle_mass', 'user_weight_goals', type_='check')
    op.drop_constraint('ck_user_weight_goals_muscle_mass', 'user_weight_goals', type_='check')
    op.drop_constraint('ck_user_weight_goals_target_body_fat', 'user_weight_goals', type_='check')
    op.drop_constraint('ck_user_weight_goals_body_fat', 'user_weight_goals', type_='check')
    op.drop_constraint('ck_user_weight_goals_target_weight', 'user_weight_goals', type_='check')
    op.drop_constraint('ck_user_weight_goals_current_weight', 'user_weight_goals', type_='check')
    
    op.drop_constraint('ck_user_health_goals_timeline', 'user_health_goals', type_='check')
    op.drop_constraint('ck_user_health_goals_priority', 'user_health_goals', type_='check')
    
    # Restore old table
    op.rename_table('user_health_goals', 'user_health_goals_new')
    op.rename_table('user_health_goals_old', 'user_health_goals')
