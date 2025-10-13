"""simplify_user_model_phase5

Revision ID: dcec4a05b40a
Revises: 97f58f0db323
Create Date: 2025-10-13 03:27:43.395221

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dcec4a05b40a'
down_revision = '97f58f0db323'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add JSON fields to users table for consolidated user data
    op.add_column('users', sa.Column('health_profile', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('onboarding_data', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('goals', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('preferences', sa.JSON(), nullable=True))
    
    # Migrate data from user_health_profile to users.health_profile
    op.execute("""
        UPDATE users 
        SET health_profile = json_build_object(
            'height_cm', uhp.height_cm,
            'age', uhp.age,
            'gender', uhp.gender,
            'current_weight_kg', uhp.current_weight_kg,
            'activity_level', uhp.activity_level,
            'smm_kg', uhp.smm_kg,
            'body_fat_percentage', uhp.body_fat_percentage,
            'workout_days_per_week', uhp.workout_days_per_week,
            'ffm_kg', uhp.ffm_kg
        )
        FROM user_health_profile uhp
        WHERE users.id = uhp.user_id
    """)
    
    # Migrate data from onboarding_profiles to users.onboarding_data
    op.execute("""
        UPDATE users 
        SET onboarding_data = json_build_object(
            'completed', op.completed,
            'body_type_goal', op.body_type_goal
        )
        FROM onboarding_profiles op
        WHERE users.id = op.user_id
    """)
    
    # Migrate data from user_goals to users.goals (simplified approach)
    op.execute("""
        UPDATE users 
        SET goals = json_build_object(
            'goals', COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', ug.id,
                        'title', ug.title,
                        'description', ug.description,
                        'category', ug.category,
                        'status', ug.status,
                        'priority', ug.priority,
                        'target_date', ug.target_date,
                        'created_at', ug.created_at
                    )
                )
                FROM user_goals ug
                WHERE ug.user_id = users.id),
                '[]'::json
            )
        )
    """)
    
    # Drop the old user-related tables
    op.drop_table('user_health_profile')
    op.drop_table('onboarding_profiles')
    op.drop_table('user_goals')
    op.drop_table('nutrition_user_routine_progress')


def downgrade() -> None:
    # Recreate the old user tables (simplified rollback)
    pass
