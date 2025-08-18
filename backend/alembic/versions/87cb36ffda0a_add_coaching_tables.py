"""add coaching tables

Revision ID: 87cb36ffda0a
Revises: b7c3e9d1f0ab
Create Date: 2025-08-17 21:00:52.603382

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '87cb36ffda0a'
down_revision = 'b7c3e9d1f0ab'
branch_labels = None
depends_on = None


def _index_if_not_exists(bind, index_name: str, table: str, cols: str):
    # Postgres-specific IF NOT EXISTS for indexes; quote identifiers like column name "when"
    cols_sql = ', '.join([f'"{c.strip()}"' for c in cols.split(',') if c.strip()])
    bind.execute(sa.text(
        f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({cols_sql})"
    ))


def upgrade() -> None:
    # Create coaching-related tables only. Do NOT touch existing core tables.
    bind = op.get_bind()
    insp = sa.inspect(bind)
    # goals
    if not insp.has_table('goals'):
        op.create_table(
            'goals',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'active'")),
            sa.Column('target_date', sa.String(length=10), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('metrics', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_goals_user_id', 'goals', 'user_id')
    _index_if_not_exists(bind, 'ix_goals_category', 'goals', 'category')
    _index_if_not_exists(bind, 'ix_goals_status', 'goals', 'status')

    # routines
    if not insp.has_table('routines'):
        op.create_table(
            'routines',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('schedule', sa.Text(), nullable=False),
            sa.Column('goal_id', sa.String(length=36), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_routines_user_id', 'routines', 'user_id')
    _index_if_not_exists(bind, 'ix_routines_category', 'routines', 'category')
    _index_if_not_exists(bind, 'ix_routines_goal_id', 'routines', 'goal_id')

    # workout_logs
    if not insp.has_table('workout_logs'):
        op.create_table(
            'workout_logs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('when', sa.DateTime(timezone=True), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('duration_min', sa.Integer(), nullable=True),
            sa.Column('distance_km', sa.Float(), nullable=True),
            sa.Column('intensity', sa.String(length=20), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_workout_logs_user_id', 'workout_logs', 'user_id')
    _index_if_not_exists(bind, 'ix_workout_logs_when', 'workout_logs', 'when')

    # meal_logs
    if not insp.has_table('meal_logs'):
        op.create_table(
            'meal_logs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('when', sa.DateTime(timezone=True), nullable=False),
            sa.Column('items', sa.Text(), nullable=False),
            sa.Column('est_protein_g', sa.Integer(), nullable=True),
            sa.Column('est_kcal', sa.Integer(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_meal_logs_user_id', 'meal_logs', 'user_id')
    _index_if_not_exists(bind, 'ix_meal_logs_when', 'meal_logs', 'when')

    # hydration_logs
    if not insp.has_table('hydration_logs'):
        op.create_table(
            'hydration_logs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('when', sa.DateTime(timezone=True), nullable=False),
            sa.Column('amount_ml', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_hydration_logs_user_id', 'hydration_logs', 'user_id')
    _index_if_not_exists(bind, 'ix_hydration_logs_when', 'hydration_logs', 'when')

    # mood_logs
    if not insp.has_table('mood_logs'):
        op.create_table(
            'mood_logs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('when', sa.DateTime(timezone=True), nullable=False),
            sa.Column('val', sa.Integer(), nullable=False),
            sa.Column('scale', sa.Integer(), nullable=False, server_default=sa.text('5')),
            sa.Column('tags', sa.Text(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_mood_logs_user_id', 'mood_logs', 'user_id')
    _index_if_not_exists(bind, 'ix_mood_logs_when', 'mood_logs', 'when')

    # journal_entries
    if not insp.has_table('journal_entries'):
        op.create_table(
            'journal_entries',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('when', sa.DateTime(timezone=True), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=True),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('tags', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    _index_if_not_exists(bind, 'ix_journal_entries_user_id', 'journal_entries', 'user_id')
    _index_if_not_exists(bind, 'ix_journal_entries_when', 'journal_entries', 'when')


def downgrade() -> None:
    # Drop coaching-related tables (reverse of upgrade) safely if they exist
    bind = op.get_bind()
    for idx in (
        'ix_journal_entries_when',
        'ix_journal_entries_user_id',
        'ix_mood_logs_when',
        'ix_mood_logs_user_id',
        'ix_hydration_logs_when',
        'ix_hydration_logs_user_id',
        'ix_meal_logs_when',
        'ix_meal_logs_user_id',
        'ix_workout_logs_when',
        'ix_workout_logs_user_id',
        'ix_routines_goal_id',
        'ix_routines_category',
        'ix_routines_user_id',
        'ix_goals_status',
        'ix_goals_category',
        'ix_goals_user_id',
    ):
        bind.execute(sa.text(f'DROP INDEX IF EXISTS {idx}'))

    # Then drop tables if they exist
    for tbl in (
        'journal_entries',
        'mood_logs',
        'hydration_logs',
        'meal_logs',
        'workout_logs',
        'routines',
        'goals',
    ):
        bind.execute(sa.text(f'DROP TABLE IF EXISTS {tbl}'))

    # All objects already dropped via IF EXISTS above
