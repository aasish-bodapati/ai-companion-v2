"""Add incognito_mode to conversations

Revision ID: d0f332ef437e
Revises: f76bbf264c03
Create Date: 2025-09-02 08:33:33.505137

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd0f332ef437e'
down_revision = 'f76bbf264c03'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add incognito_mode column to conversations table
    op.add_column('conversations', sa.Column('incognito_mode', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove incognito_mode column from conversations table
    op.drop_column('conversations', 'incognito_mode')
