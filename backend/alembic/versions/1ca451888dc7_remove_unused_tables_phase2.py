"""remove_unused_tables_phase2

Revision ID: 1ca451888dc7
Revises: b5dd987d3a0e
Create Date: 2025-10-13 03:16:32.051535

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1ca451888dc7'
down_revision = 'b5dd987d3a0e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove unused and redundant tables (only those that exist)
    op.drop_table('body_type_goals')
    op.drop_table('exercise_logging_categories')
    # Note: workout_categories, routine_exercises_v2, workout_logs_v2 don't exist


def downgrade() -> None:
    # Recreate the dropped tables (if needed for rollback)
    # Note: This is a simplified rollback - in production you'd want full table definitions
    pass
