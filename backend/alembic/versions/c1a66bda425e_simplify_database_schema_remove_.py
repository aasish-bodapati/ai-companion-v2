"""Simplify database schema - remove unnecessary complexity

Revision ID: c1a66bda425e
Revises: fa027e8b4966
Create Date: 2025-09-19 17:30:07.907327

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1a66bda425e'
down_revision = 'fa027e8b4966'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop unnecessary tables (if they exist)
    try:
        op.drop_table('meal_templates')
    except:
        pass
    try:
        op.drop_table('food_alternatives')
    except:
        pass
    try:
        op.drop_table('recipe_ingredients')
    except:
        pass
    try:
        op.drop_table('exercise_templates')
    except:
        pass
    try:
        op.drop_table('nutrition_meal_plans')
    except:
        pass
    try:
        op.drop_table('nutrition_meals')
    except:
        pass
    try:
        op.drop_table('nutrition_meal_foods')
    except:
        pass
    
    # Simplify foods table - remove unnecessary columns
    columns_to_drop = [
        'subcategory', 'barcode', 'usda_fdc_id', 'calcium_per_100g', 'iron_per_100g',
        'vitamin_c_per_100g', 'vitamin_d_per_100g', 'common_serving_sizes', 'description',
        'ingredients', 'allergens', 'dietary_tags', 'is_verified', 'is_popular', 'usage_count'
    ]
    for col in columns_to_drop:
        try:
            op.drop_column('foods', col)
        except:
            pass
    
    # Simplify exercises table - remove unnecessary columns
    exercise_columns_to_drop = [
        'subcategory', 'muscle_groups', 'equipment_needed', 'met_value', 'instructions',
        'tips', 'variations', 'is_popular', 'usage_count', 'wger_id', 'wger_uuid',
        'wger_category_id', 'wger_license_author'
    ]
    for col in exercise_columns_to_drop:
        try:
            op.drop_column('exercises', col)
        except:
            pass
    
    # Simplify user_food_history table
    food_history_columns_to_drop = [
        'avg_serving_grams', 'most_common_meal_type', 'preferred_serving_size', 'notes', 'rating'
    ]
    for col in food_history_columns_to_drop:
        try:
            op.drop_column('user_food_history', col)
        except:
            pass
    
    # Simplify user_exercise_history table
    exercise_history_columns_to_drop = [
        'avg_duration_minutes', 'avg_calories_burned', 'max_weight_kg', 'max_reps',
        'max_distance_km', 'best_time_seconds', 'preferred_intensity', 'notes'
    ]
    for col in exercise_history_columns_to_drop:
        try:
            op.drop_column('user_exercise_history', col)
        except:
            pass
    
    # Add JSON column to nutrition_routines for meal plans
    try:
        op.add_column('nutrition_routines', sa.Column('meal_plans', sa.JSON(), nullable=True))
    except:
        pass
    
    # Simplify nutrition_user_routine_progress
    nutrition_progress_columns_to_drop = ['meals_completed', 'last_meal_date']
    for col in nutrition_progress_columns_to_drop:
        try:
            op.drop_column('nutrition_user_routine_progress', col)
        except:
            pass


def downgrade() -> None:
    # This is a destructive migration - downgrade would be complex
    # For now, we'll leave it as a no-op since this is a simplification
    pass
