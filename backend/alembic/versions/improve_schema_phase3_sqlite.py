"""Improve schema phase 3 - Cleanup and finalize (SQLite compatible)

Revision ID: improve_schema_phase3_sqlite
Revises: improve_schema_phase2_sqlite
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'improve_schema_phase3_sqlite'
down_revision = 'improve_schema_phase2_sqlite'
branch_labels = None
depends_on = None


def upgrade():
    # Check if user_health_goals_old already exists
    from sqlalchemy import text
    connection = op.get_bind()
    result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='user_health_goals_old'"))
    
    if not result.fetchone():
        # Rename new tables to replace old ones
        op.rename_table('user_health_goals', 'user_health_goals_old')
        op.rename_table('user_health_goals_new', 'user_health_goals')
    
    # SQLite doesn't support adding constraints to existing tables
    # The constraints are already defined in the SQLAlchemy models
    # and will be enforced at the application level
    pass


def downgrade():
    # Rename tables back
    op.rename_table('user_health_goals', 'user_health_goals_new')
    op.rename_table('user_health_goals_old', 'user_health_goals')
