"""add timezone to users

Revision ID: add_timezone_to_users
Revises: cc0ece2c2dde
Create Date: 2025-09-29 09:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_timezone_to_users'
down_revision = 'cc0ece2c2dde'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add timezone column to users table
    op.add_column('users', sa.Column('timezone', sa.String(50), nullable=True, default='UTC'))


def downgrade() -> None:
    # Remove timezone column from users table
    op.drop_column('users', 'timezone')
