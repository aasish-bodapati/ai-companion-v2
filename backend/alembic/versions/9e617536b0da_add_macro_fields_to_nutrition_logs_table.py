"""Add macro fields to nutrition_logs table

Revision ID: 9e617536b0da
Revises: add_water_logs_manual
Create Date: 2025-09-26 18:13:40.654091

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9e617536b0da'
down_revision = 'add_water_logs_manual'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add macro fields to nutrition_logs table
    op.add_column('nutrition_logs', sa.Column('protein_g', sa.Float(), nullable=True))
    op.add_column('nutrition_logs', sa.Column('carbs_g', sa.Float(), nullable=True))
    op.add_column('nutrition_logs', sa.Column('fat_g', sa.Float(), nullable=True))


def downgrade() -> None:
    # Remove macro fields from nutrition_logs table
    op.drop_column('nutrition_logs', 'fat_g')
    op.drop_column('nutrition_logs', 'carbs_g')
    op.drop_column('nutrition_logs', 'protein_g')
