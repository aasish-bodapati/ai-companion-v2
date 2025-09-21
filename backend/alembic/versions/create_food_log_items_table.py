"""Create food_log_items table for better nutrition tracking

Revision ID: create_food_log_items
Revises: improve_schema_phase3_sqlite
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_food_log_items'
down_revision = 'improve_schema_phase3_sqlite'
branch_labels = None
depends_on = None


def upgrade():
    # Create food_log_items table
    op.create_table('food_log_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('nutrition_log_id', sa.String(36), sa.ForeignKey('nutrition_logs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('food_id', sa.String(36), sa.ForeignKey('foods.id', ondelete='CASCADE'), nullable=True),
        sa.Column('food_name', sa.String(300), nullable=False),
        sa.Column('quantity_grams', sa.Float, nullable=False),
        sa.Column('calories', sa.Float, nullable=True),
        sa.Column('protein_g', sa.Float, nullable=True),
        sa.Column('carbs_g', sa.Float, nullable=True),
        sa.Column('fat_g', sa.Float, nullable=True),
        sa.Column('fiber_g', sa.Float, nullable=True),
        sa.Column('sugar_g', sa.Float, nullable=True),
        sa.Column('sodium_mg', sa.Float, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create indexes for better performance
    op.create_index('idx_food_log_items_nutrition_log_id', 'food_log_items', ['nutrition_log_id'])
    op.create_index('idx_food_log_items_food_id', 'food_log_items', ['food_id'])
    op.create_index('idx_food_log_items_created_at', 'food_log_items', ['created_at'])
    
    # Add constraints
    op.create_check_constraint('ck_food_log_items_quantity_positive', 'food_log_items', 'quantity_grams > 0')
    op.create_check_constraint('ck_food_log_items_calories_positive', 'food_log_items', 'calories >= 0')


def downgrade():
    op.drop_table('food_log_items')
