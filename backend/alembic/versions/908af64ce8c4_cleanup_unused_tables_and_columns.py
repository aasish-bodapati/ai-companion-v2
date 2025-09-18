"""cleanup_unused_tables_and_columns

Revision ID: 908af64ce8c4
Revises: 2eb5dd9c02c2
Create Date: 2025-09-17 15:48:46.355824

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '908af64ce8c4'
down_revision = '2eb5dd9c02c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Clean up unused tables and columns to simplify the database schema.
    This migration removes empty tables and unused columns to make the database
    more maintainable and easier to understand.
    """
    
    # 1. Drop empty tables that are not being used
    empty_tables = [
        'memory_relationships',
        'memory_evolution', 
        'notes',
        'tasks',
        'reminders',
        'user_goals',
        'nutrition_logs',
        'mood_logs',
        'user_weight_logs'
    ]
    
    for table in empty_tables:
        op.drop_table(table)
    
    # 2. Simplify memory_nodes table by removing unused columns
    # Keep only: id, content, user_id, conversation_id, timestamp, created_via
    op.drop_column('memory_nodes', 'faiss_id')
    op.drop_column('memory_nodes', 'content_type')
    op.drop_column('memory_nodes', 'category')
    op.drop_column('memory_nodes', 'subcategory')
    op.drop_column('memory_nodes', 'effective_date')
    op.drop_column('memory_nodes', 'expiration_date')
    op.drop_column('memory_nodes', 'relevance_score')
    op.drop_column('memory_nodes', 'importance_score')
    op.drop_column('memory_nodes', 'confidence_score')
    op.drop_column('memory_nodes', 'emotional_valence')
    op.drop_column('memory_nodes', 'parent_memory_id')
    op.drop_column('memory_nodes', 'related_memory_ids')
    op.drop_column('memory_nodes', 'memory_metadata')
    op.drop_column('memory_nodes', 'tags')
    op.drop_column('memory_nodes', 'entities')
    op.drop_column('memory_nodes', 'access_count')
    op.drop_column('memory_nodes', 'last_accessed')
    op.drop_column('memory_nodes', 'privacy_level')
    op.drop_column('memory_nodes', 'is_core')
    
    # 3. Simplify memory_audit table by removing unused columns
    # Keep only: id, user_id, action, source, conversation_id, created_at
    op.drop_column('memory_audit', 'faiss_id')
    op.drop_column('memory_audit', 'message_id')
    op.drop_column('memory_audit', 'before_content')
    op.drop_column('memory_audit', 'after_content')
    op.drop_column('memory_audit', 'before_metadata')
    op.drop_column('memory_audit', 'after_metadata')
    op.drop_column('memory_audit', 'request_ip')
    op.drop_column('memory_audit', 'user_agent')
    
    # 4. Simplify fitness_logs by removing rarely used columns
    op.drop_column('fitness_logs', 'location')
    op.drop_column('fitness_logs', 'weather')
    
    # 5. Simplify user_health_profile by removing unused medical fields
    op.drop_column('user_health_profile', 'current_body_fat_percent')
    op.drop_column('user_health_profile', 'current_muscle_mass_kg')
    op.drop_column('user_health_profile', 'current_waist_circumference_cm')
    op.drop_column('user_health_profile', 'current_hip_circumference_cm')
    op.drop_column('user_health_profile', 'has_diabetes')
    op.drop_column('user_health_profile', 'has_hypertension')
    op.drop_column('user_health_profile', 'has_heart_condition')
    op.drop_column('user_health_profile', 'other_conditions')
    op.drop_column('user_health_profile', 'dietary_restrictions')
    op.drop_column('user_health_profile', 'food_allergies')
    op.drop_column('user_health_profile', 'preferred_cuisine')
    op.drop_column('user_health_profile', 'preferred_workout_times')
    op.drop_column('user_health_profile', 'preferred_workout_types')
    op.drop_column('user_health_profile', 'gym_access')
    op.drop_column('user_health_profile', 'home_equipment')
    op.drop_column('user_health_profile', 'work_schedule')
    op.drop_column('user_health_profile', 'sleep_schedule')
    op.drop_column('user_health_profile', 'stress_level')
    op.drop_column('user_health_profile', 'motivation_level')
    
    # 6. Simplify nutrition tables by removing unused macro tracking
    # Remove detailed macro tracking from nutrition_meal_plans
    op.drop_column('nutrition_meal_plans', 'daily_protein_g')
    op.drop_column('nutrition_meal_plans', 'daily_carbs_g')
    op.drop_column('nutrition_meal_plans', 'daily_fat_g')
    op.drop_column('nutrition_meal_plans', 'daily_fiber_g')
    op.drop_column('nutrition_meal_plans', 'daily_sugar_g')
    op.drop_column('nutrition_meal_plans', 'daily_sodium_mg')
    
    # Remove detailed macro tracking from nutrition_meals
    op.drop_column('nutrition_meals', 'target_protein_g')
    op.drop_column('nutrition_meals', 'target_carbs_g')
    op.drop_column('nutrition_meals', 'target_fat_g')
    op.drop_column('nutrition_meals', 'target_fiber_g')
    op.drop_column('nutrition_meals', 'target_sugar_g')
    op.drop_column('nutrition_meals', 'target_sodium_mg')
    op.drop_column('nutrition_meals', 'food_suggestions')
    
    # Remove detailed macro tracking from nutrition_meal_foods
    op.drop_column('nutrition_meal_foods', 'fiber_g')
    op.drop_column('nutrition_meal_foods', 'sugar_g')
    op.drop_column('nutrition_meal_foods', 'sodium_mg')
    
    # 7. Simplify nutrition_routines by removing unused macro targets
    op.drop_column('nutrition_routines', 'target_protein_g')
    op.drop_column('nutrition_routines', 'target_carbs_g')
    op.drop_column('nutrition_routines', 'target_fat_g')
    op.drop_column('nutrition_routines', 'target_fiber_g')
    op.drop_column('nutrition_routines', 'target_sugar_g')
    op.drop_column('nutrition_routines', 'target_sodium_mg')
    
    # 8. Simplify simple_routines by removing unused fields
    op.drop_column('simple_routines', 'workout_schedule')  # This is now in workout_days table
    op.drop_column('simple_routines', 'total_workouts_per_week')  # Can be calculated from workout_days
    
    # 9. Simplify onboarding_profiles by removing duplicate fields
    # Keep only essential fields, remove duplicates with user_health_profile
    op.drop_column('onboarding_profiles', 'age')
    op.drop_column('onboarding_profiles', 'gender')
    op.drop_column('onboarding_profiles', 'height_cm')
    op.drop_column('onboarding_profiles', 'current_weight_kg')
    op.drop_column('onboarding_profiles', 'activity_level')
    op.drop_column('onboarding_profiles', 'primary_goal')


def downgrade() -> None:
    """
    Rollback the cleanup migration.
    Note: This is a destructive migration and cannot be fully rolled back
    as we're dropping tables and columns. This is a placeholder for completeness.
    """
    # This migration is not easily reversible as we're dropping tables and columns
    # In a production environment, you would need to restore from backup
    # or recreate the dropped tables/columns manually
    pass
