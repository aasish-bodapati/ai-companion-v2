"""add_created_by_to_body_type_goals

Revision ID: add_created_by_column
Revises: add_body_type_goals_manual
Create Date: 2025-09-30 00:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_created_by_column'
down_revision = 'add_body_type_goals_manual'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add created_by column to body_type_goals table
    op.add_column('body_type_goals', sa.Column('created_by', sa.String(), nullable=False, server_default='system'))
    
    # Update existing records to have created_by = 'system'
    op.execute("UPDATE body_type_goals SET created_by = 'system' WHERE created_by IS NULL")


def downgrade() -> None:
    op.drop_column('body_type_goals', 'created_by')
