"""add_indian_food_table_only

Revision ID: b1b4ae50e428
Revises: f14c1081ec81
Create Date: 2025-09-30 22:54:57.836110

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1b4ae50e428'
down_revision = 'b12c8f443d35'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create Indian foods table
    op.create_table('indian_foods',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('food_code', sa.String(length=20), nullable=False),
        sa.Column('food_name', sa.String(length=200), nullable=False),
        sa.Column('primary_source', sa.String(length=50), nullable=True),
        
        # Energy values
        sa.Column('energy_kj', sa.Float(), nullable=True),
        sa.Column('energy_kcal', sa.Float(), nullable=True),
        
        # Macronutrients (per 100g)
        sa.Column('carb_g', sa.Float(), nullable=True),
        sa.Column('protein_g', sa.Float(), nullable=True),
        sa.Column('fat_g', sa.Float(), nullable=True),
        sa.Column('free_sugar_g', sa.Float(), nullable=True),
        sa.Column('fibre_g', sa.Float(), nullable=True),
        
        # Fatty acids (per 100g)
        sa.Column('sfa_mg', sa.Float(), nullable=True),
        sa.Column('mufa_mg', sa.Float(), nullable=True),
        sa.Column('pufa_mg', sa.Float(), nullable=True),
        sa.Column('cholesterol_mg', sa.Float(), nullable=True),
        
        # Minerals (per 100g)
        sa.Column('calcium_mg', sa.Float(), nullable=True),
        sa.Column('phosphorus_mg', sa.Float(), nullable=True),
        sa.Column('magnesium_mg', sa.Float(), nullable=True),
        sa.Column('sodium_mg', sa.Float(), nullable=True),
        sa.Column('potassium_mg', sa.Float(), nullable=True),
        sa.Column('iron_mg', sa.Float(), nullable=True),
        sa.Column('copper_mg', sa.Float(), nullable=True),
        sa.Column('selenium_ug', sa.Float(), nullable=True),
        sa.Column('chromium_mg', sa.Float(), nullable=True),
        sa.Column('manganese_mg', sa.Float(), nullable=True),
        sa.Column('molybdenum_mg', sa.Float(), nullable=True),
        sa.Column('zinc_mg', sa.Float(), nullable=True),
        
        # Vitamins (per 100g)
        sa.Column('vita_ug', sa.Float(), nullable=True),
        sa.Column('vite_mg', sa.Float(), nullable=True),
        sa.Column('vitd2_ug', sa.Float(), nullable=True),
        sa.Column('vitd3_ug', sa.Float(), nullable=True),
        sa.Column('vitk1_ug', sa.Float(), nullable=True),
        sa.Column('vitk2_ug', sa.Float(), nullable=True),
        sa.Column('folate_ug', sa.Float(), nullable=True),
        sa.Column('vitb1_mg', sa.Float(), nullable=True),
        sa.Column('vitb2_mg', sa.Float(), nullable=True),
        sa.Column('vitb3_mg', sa.Float(), nullable=True),
        sa.Column('vitb5_mg', sa.Float(), nullable=True),
        sa.Column('vitb6_mg', sa.Float(), nullable=True),
        sa.Column('vitb7_ug', sa.Float(), nullable=True),
        sa.Column('vitb9_ug', sa.Float(), nullable=True),
        sa.Column('vitc_mg', sa.Float(), nullable=True),
        sa.Column('carotenoids_ug', sa.Float(), nullable=True),
        
        # Serving information
        sa.Column('servings_unit', sa.String(length=50), nullable=True),
        sa.Column('unit_serving_energy_kj', sa.Float(), nullable=True),
        sa.Column('unit_serving_energy_kcal', sa.Float(), nullable=True),
        sa.Column('unit_serving_carb_g', sa.Float(), nullable=True),
        sa.Column('unit_serving_protein_g', sa.Float(), nullable=True),
        sa.Column('unit_serving_fat_g', sa.Float(), nullable=True),
        sa.Column('unit_serving_freesugar_g', sa.Float(), nullable=True),
        sa.Column('unit_serving_fibre_g', sa.Float(), nullable=True),
        sa.Column('unit_serving_sfa_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_mufa_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_pufa_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_cholesterol_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_calcium_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_phosphorus_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_magnesium_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_sodium_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_potassium_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_iron_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_copper_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_selenium_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_chromium_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_manganese_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_molybdenum_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_zinc_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vita_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vite_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitd2_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitd3_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitk1_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitk2_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_folate_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb1_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb2_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb3_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb5_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb6_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb7_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitb9_ug', sa.Float(), nullable=True),
        sa.Column('unit_serving_vitc_mg', sa.Float(), nullable=True),
        sa.Column('unit_serving_carotenoids_ug', sa.Float(), nullable=True),
        
        # Metadata
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('food_code')
    )
    
    # Create indexes for better search performance
    op.create_index('idx_food_name_search', 'indian_foods', ['food_name'])
    op.create_index('idx_food_code_lookup', 'indian_foods', ['food_code'])
    op.create_index('idx_energy_calories', 'indian_foods', ['energy_kcal'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_energy_calories', table_name='indian_foods')
    op.drop_index('idx_food_code_lookup', table_name='indian_foods')
    op.drop_index('idx_food_name_search', table_name='indian_foods')
    
    # Drop table
    op.drop_table('indian_foods')
