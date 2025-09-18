"""add logging tables

Revision ID: add_logging_tables
Revises: 487eac5fa7c9
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_logging_tables'
down_revision = '487eac5fa7c9'
branch_labels = None
depends_on = None


def upgrade():
    # Create fitness_logs table
    op.create_table('fitness_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('activity_name', sa.String(100), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('intensity', sa.String(20), nullable=True),
        sa.Column('calories_burned', sa.Integer(), nullable=True),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('sets', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('location', sa.String(100), nullable=True),
        sa.Column('weather', sa.String(50), nullable=True),
        sa.Column('activity_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fitness_logs_user_id'), 'fitness_logs', ['user_id'], unique=False)

    # Create nutrition_logs table
    op.create_table('nutrition_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('meal_type', sa.String(20), nullable=False),
        sa.Column('meal_name', sa.String(100), nullable=True),
        sa.Column('total_calories', sa.Integer(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=True),
        sa.Column('carbs_g', sa.Float(), nullable=True),
        sa.Column('fat_g', sa.Float(), nullable=True),
        sa.Column('fiber_g', sa.Float(), nullable=True),
        sa.Column('sugar_g', sa.Float(), nullable=True),
        sa.Column('sodium_mg', sa.Float(), nullable=True),
        sa.Column('food_items', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('mood_before', sa.String(20), nullable=True),
        sa.Column('mood_after', sa.String(20), nullable=True),
        sa.Column('meal_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nutrition_logs_user_id'), 'nutrition_logs', ['user_id'], unique=False)

    # Create mood_logs table
    op.create_table('mood_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('mood_rating', sa.Integer(), nullable=False),
        sa.Column('energy_level', sa.Integer(), nullable=True),
        sa.Column('stress_level', sa.Integer(), nullable=True),
        sa.Column('sleep_quality', sa.Integer(), nullable=True),
        sa.Column('sleep_hours', sa.Float(), nullable=True),
        sa.Column('water_intake_ml', sa.Integer(), nullable=True),
        sa.Column('steps_count', sa.Integer(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('activities', sa.Text(), nullable=True),
        sa.Column('log_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mood_logs_user_id'), 'mood_logs', ['user_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_mood_logs_user_id'), table_name='mood_logs')
    op.drop_table('mood_logs')
    op.drop_index(op.f('ix_nutrition_logs_user_id'), table_name='nutrition_logs')
    op.drop_table('nutrition_logs')
    op.drop_index(op.f('ix_fitness_logs_user_id'), table_name='fitness_logs')
    op.drop_table('fitness_logs')
