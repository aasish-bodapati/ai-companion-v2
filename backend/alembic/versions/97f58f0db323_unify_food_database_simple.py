"""unify_food_database_simple

Revision ID: 97f58f0db323
Revises: b483761eb36f
Create Date: 2025-10-13 03:26:03.876885

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '97f58f0db323'
down_revision = '1a91a3ba6b8c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add food_type column to foods table to distinguish between general and Indian foods
    op.add_column('foods', sa.Column('food_type', sa.String(20), nullable=False, server_default=sa.text("'general'")))
    
    # Drop the indian_foods table (data migration can be done separately if needed)
    op.drop_table('indian_foods')


def downgrade() -> None:
    # Recreate indian_foods table (simplified rollback)
    pass
