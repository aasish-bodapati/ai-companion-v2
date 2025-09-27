"""add_food_items_column_to_nutrition_logs

Revision ID: f838227db4c2
Revises: 31da58e8b83e
Create Date: 2025-09-27 11:06:12.165207

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f838227db4c2'
down_revision = '31da58e8b83e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add food_items column to nutrition_logs table
    op.add_column('nutrition_logs', sa.Column('food_items', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove food_items column from nutrition_logs table
    op.drop_column('nutrition_logs', 'food_items')
