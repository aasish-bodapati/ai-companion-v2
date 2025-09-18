"""add_user_health_goals_and_info

Revision ID: add_health_goals_001
Revises: 487eac5fa7c9
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_health_goals_001'
down_revision = '487eac5fa7c9'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_health_goals table
    op.create_table('user_health_goals',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('current_weight_kg', sa.Float(), nullable=True),
        sa.Column('target_weight_kg', sa.Float(), nullable=True),
        sa.Column('current_body_fat_percent', sa.Float(), nullable=True),
        sa.Column('target_body_fat_percent', sa.Float(), nullable=True),
        sa.Column('current_muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('target_muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('daily_calorie_target', sa.Integer(), nullable=True),
        sa.Column('daily_protein_target_g', sa.Float(), nullable=True),
        sa.Column('daily_carbs_target_g', sa.Float(), nullable=True),
        sa.Column('daily_fat_target_g', sa.Float(), nullable=True),
        sa.Column('daily_fiber_target_g', sa.Float(), nullable=True),
        sa.Column('daily_water_target_ml', sa.Integer(), nullable=True),
        sa.Column('weekly_workout_target', sa.Integer(), nullable=True),
        sa.Column('daily_steps_target', sa.Integer(), nullable=True),
        sa.Column('weekly_cardio_minutes', sa.Integer(), nullable=True),
        sa.Column('weekly_strength_sessions', sa.Integer(), nullable=True),
        sa.Column('target_sleep_hours', sa.Float(), nullable=True),
        sa.Column('target_sleep_quality', sa.Integer(), nullable=True),
        sa.Column('target_blood_pressure_systolic', sa.Integer(), nullable=True),
        sa.Column('target_blood_pressure_diastolic', sa.Integer(), nullable=True),
        sa.Column('target_resting_heart_rate', sa.Integer(), nullable=True),
        sa.Column('stress_management_goal', sa.String(100), nullable=True),
        sa.Column('mood_tracking_goal', sa.String(100), nullable=True),
        sa.Column('habit_goals', sa.Text(), nullable=True),
        sa.Column('goal_priority', sa.String(20), nullable=True),
        sa.Column('timeline_weeks', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_health_goals_user_id'), 'user_health_goals', ['user_id'], unique=False)

    # Create user_health_profile table
    op.create_table('user_health_profile',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(10), nullable=True),
        sa.Column('activity_level', sa.String(20), nullable=True),
        sa.Column('current_weight_kg', sa.Float(), nullable=True),
        sa.Column('current_body_fat_percent', sa.Float(), nullable=True),
        sa.Column('current_muscle_mass_kg', sa.Float(), nullable=True),
        sa.Column('current_waist_circumference_cm', sa.Float(), nullable=True),
        sa.Column('current_hip_circumference_cm', sa.Float(), nullable=True),
        sa.Column('has_diabetes', sa.Boolean(), nullable=False, default=False),
        sa.Column('has_hypertension', sa.Boolean(), nullable=False, default=False),
        sa.Column('has_heart_condition', sa.Boolean(), nullable=False, default=False),
        sa.Column('other_conditions', sa.Text(), nullable=True),
        sa.Column('dietary_restrictions', sa.Text(), nullable=True),
        sa.Column('food_allergies', sa.Text(), nullable=True),
        sa.Column('preferred_cuisine', sa.String(50), nullable=True),
        sa.Column('preferred_workout_times', sa.String(50), nullable=True),
        sa.Column('preferred_workout_types', sa.Text(), nullable=True),
        sa.Column('gym_access', sa.Boolean(), nullable=False, default=False),
        sa.Column('home_equipment', sa.Text(), nullable=True),
        sa.Column('work_schedule', sa.String(50), nullable=True),
        sa.Column('sleep_schedule', sa.String(50), nullable=True),
        sa.Column('stress_level', sa.Integer(), nullable=True),
        sa.Column('motivation_level', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_health_profile_user_id'), 'user_health_profile', ['user_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_user_health_profile_user_id'), table_name='user_health_profile')
    op.drop_table('user_health_profile')
    op.drop_index(op.f('ix_user_health_goals_user_id'), table_name='user_health_goals')
    op.drop_table('user_health_goals')
