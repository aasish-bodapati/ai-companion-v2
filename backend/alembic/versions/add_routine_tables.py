"""add routine tables

Revision ID: add_routine_tables
Revises: add_user_health_goals_and_info
Create Date: 2024-01-15 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_routine_tables'
down_revision = 'add_health_goals_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create routines table
    op.create_table('routines',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(20), nullable=False),
        sa.Column('duration_weeks', sa.Integer(), nullable=False, default=4),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('is_template', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_by_user_id', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routines_created_by_user_id'), 'routines', ['created_by_user_id'], unique=False)

    # Create routine_workouts table
    op.create_table('routine_workouts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('routine_id', sa.String(36), nullable=False),
        sa.Column('day', sa.String(20), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('activity_name', sa.String(100), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('intensity', sa.String(20), nullable=False),
        sa.Column('calories_burned', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('order_in_day', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['routine_id'], ['routines.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routine_workouts_routine_id'), 'routine_workouts', ['routine_id'], unique=False)

    # Create user_routine_progress table
    op.create_table('user_routine_progress',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('routine_id', sa.String(36), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_week', sa.Integer(), nullable=False, default=1),
        sa.Column('total_weeks_completed', sa.Integer(), nullable=False, default=0),
        sa.Column('workouts_completed_this_week', sa.Integer(), nullable=False, default=0),
        sa.Column('total_workouts_completed', sa.Integer(), nullable=False, default=0),
        sa.Column('last_workout_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_id'], ['routines.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_routine_progress_user_id'), 'user_routine_progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_routine_progress_routine_id'), 'user_routine_progress', ['routine_id'], unique=False)

    # Create user_routine_workout_logs table
    op.create_table('user_routine_workout_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('routine_id', sa.String(36), nullable=False),
        sa.Column('routine_workout_id', sa.String(36), nullable=False),
        sa.Column('fitness_log_id', sa.String(36), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.String(20), nullable=False),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('actual_calories_burned', sa.Integer(), nullable=True),
        sa.Column('actual_weight_kg', sa.Float(), nullable=True),
        sa.Column('actual_reps', sa.Integer(), nullable=True),
        sa.Column('actual_sets', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_id'], ['routines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_workout_id'], ['routine_workouts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fitness_log_id'], ['fitness_logs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_routine_workout_logs_user_id'), 'user_routine_workout_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_routine_workout_logs_routine_id'), 'user_routine_workout_logs', ['routine_id'], unique=False)
    op.create_index(op.f('ix_user_routine_workout_logs_routine_workout_id'), 'user_routine_workout_logs', ['routine_workout_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_user_routine_workout_logs_routine_workout_id'), table_name='user_routine_workout_logs')
    op.drop_index(op.f('ix_user_routine_workout_logs_routine_id'), table_name='user_routine_workout_logs')
    op.drop_index(op.f('ix_user_routine_workout_logs_user_id'), table_name='user_routine_workout_logs')
    op.drop_table('user_routine_workout_logs')
    op.drop_index(op.f('ix_user_routine_progress_routine_id'), table_name='user_routine_progress')
    op.drop_index(op.f('ix_user_routine_progress_user_id'), table_name='user_routine_progress')
    op.drop_table('user_routine_progress')
    op.drop_index(op.f('ix_routine_workouts_routine_id'), table_name='routine_workouts')
    op.drop_table('routine_workouts')
    op.drop_index(op.f('ix_routines_created_by_user_id'), table_name='routines')
    op.drop_table('routines')
