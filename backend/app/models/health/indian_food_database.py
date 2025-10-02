"""
Indian Food Database Model
Stores comprehensive nutrition data from INDB (Indian Food Composition Database)
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, Index
from sqlalchemy.sql import func
from app.db.base_class import Base


class IndianFood(Base):
    """Indian Food Database - stores comprehensive nutrition data from INDB"""
    
    __tablename__ = "indian_foods"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    food_code = Column(String(20), nullable=False, unique=True, index=True)
    food_name = Column(String(200), nullable=False, index=True)
    primary_source = Column(String(50), nullable=True)
    
    # Energy values
    energy_kj = Column(Float, nullable=True)
    energy_kcal = Column(Float, nullable=True)
    
    # Macronutrients (per 100g)
    carb_g = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    free_sugar_g = Column(Float, nullable=True)
    fibre_g = Column(Float, nullable=True)
    
    # Fatty acids (per 100g)
    sfa_mg = Column(Float, nullable=True)  # Saturated fatty acids
    mufa_mg = Column(Float, nullable=True)  # Monounsaturated fatty acids
    pufa_mg = Column(Float, nullable=True)  # Polyunsaturated fatty acids
    cholesterol_mg = Column(Float, nullable=True)
    
    # Minerals (per 100g)
    calcium_mg = Column(Float, nullable=True)
    phosphorus_mg = Column(Float, nullable=True)
    magnesium_mg = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    potassium_mg = Column(Float, nullable=True)
    iron_mg = Column(Float, nullable=True)
    copper_mg = Column(Float, nullable=True)
    selenium_ug = Column(Float, nullable=True)
    chromium_mg = Column(Float, nullable=True)
    manganese_mg = Column(Float, nullable=True)
    molybdenum_mg = Column(Float, nullable=True)
    zinc_mg = Column(Float, nullable=True)
    
    # Vitamins (per 100g)
    vita_ug = Column(Float, nullable=True)  # Vitamin A
    vite_mg = Column(Float, nullable=True)  # Vitamin E
    vitd2_ug = Column(Float, nullable=True)  # Vitamin D2
    vitd3_ug = Column(Float, nullable=True)  # Vitamin D3
    vitk1_ug = Column(Float, nullable=True)  # Vitamin K1
    vitk2_ug = Column(Float, nullable=True)  # Vitamin K2
    folate_ug = Column(Float, nullable=True)  # Folate
    vitb1_mg = Column(Float, nullable=True)  # Thiamine
    vitb2_mg = Column(Float, nullable=True)  # Riboflavin
    vitb3_mg = Column(Float, nullable=True)  # Niacin
    vitb5_mg = Column(Float, nullable=True)  # Pantothenic acid
    vitb6_mg = Column(Float, nullable=True)  # Pyridoxine
    vitb7_ug = Column(Float, nullable=True)  # Biotin
    vitb9_ug = Column(Float, nullable=True)  # Folic acid
    vitc_mg = Column(Float, nullable=True)  # Vitamin C
    carotenoids_ug = Column(Float, nullable=True)
    
    # Serving information
    servings_unit = Column(String(50), nullable=True)
    unit_serving_energy_kj = Column(Float, nullable=True)
    unit_serving_energy_kcal = Column(Float, nullable=True)
    unit_serving_carb_g = Column(Float, nullable=True)
    unit_serving_protein_g = Column(Float, nullable=True)
    unit_serving_fat_g = Column(Float, nullable=True)
    unit_serving_freesugar_g = Column(Float, nullable=True)
    unit_serving_fibre_g = Column(Float, nullable=True)
    unit_serving_sfa_mg = Column(Float, nullable=True)
    unit_serving_mufa_mg = Column(Float, nullable=True)
    unit_serving_pufa_mg = Column(Float, nullable=True)
    unit_serving_cholesterol_mg = Column(Float, nullable=True)
    unit_serving_calcium_mg = Column(Float, nullable=True)
    unit_serving_phosphorus_mg = Column(Float, nullable=True)
    unit_serving_magnesium_mg = Column(Float, nullable=True)
    unit_serving_sodium_mg = Column(Float, nullable=True)
    unit_serving_potassium_mg = Column(Float, nullable=True)
    unit_serving_iron_mg = Column(Float, nullable=True)
    unit_serving_copper_mg = Column(Float, nullable=True)
    unit_serving_selenium_ug = Column(Float, nullable=True)
    unit_serving_chromium_mg = Column(Float, nullable=True)
    unit_serving_manganese_mg = Column(Float, nullable=True)
    unit_serving_molybdenum_mg = Column(Float, nullable=True)
    unit_serving_zinc_mg = Column(Float, nullable=True)
    unit_serving_vita_ug = Column(Float, nullable=True)
    unit_serving_vite_mg = Column(Float, nullable=True)
    unit_serving_vitd2_ug = Column(Float, nullable=True)
    unit_serving_vitd3_ug = Column(Float, nullable=True)
    unit_serving_vitk1_ug = Column(Float, nullable=True)
    unit_serving_vitk2_ug = Column(Float, nullable=True)
    unit_serving_folate_ug = Column(Float, nullable=True)
    unit_serving_vitb1_mg = Column(Float, nullable=True)
    unit_serving_vitb2_mg = Column(Float, nullable=True)
    unit_serving_vitb3_mg = Column(Float, nullable=True)
    unit_serving_vitb5_mg = Column(Float, nullable=True)
    unit_serving_vitb6_mg = Column(Float, nullable=True)
    unit_serving_vitb7_ug = Column(Float, nullable=True)
    unit_serving_vitb9_ug = Column(Float, nullable=True)
    unit_serving_vitc_mg = Column(Float, nullable=True)
    unit_serving_carotenoids_ug = Column(Float, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Indexes for better search performance
    __table_args__ = (
        Index('idx_food_name_search', 'food_name'),
        Index('idx_food_code_lookup', 'food_code'),
        Index('idx_energy_calories', 'energy_kcal'),
    )
    
    def __repr__(self):
        return f"<IndianFood(id={self.id}, code='{self.food_code}', name='{self.food_name}')>"
    
    def get_nutrition_per_100g(self) -> dict:
        """Get nutrition data per 100g"""
        return {
            "energy_kcal": self.energy_kcal or 0,
            "protein_g": self.protein_g or 0,
            "carbs_g": self.carb_g or 0,
            "fat_g": self.fat_g or 0,
            "fiber_g": self.fibre_g or 0,
            "sugar_g": self.free_sugar_g or 0,
            "sodium_mg": self.sodium_mg or 0,
            "calcium_mg": self.calcium_mg or 0,
            "iron_mg": self.iron_mg or 0,
            "vitc_mg": self.vitc_mg or 0,
        }
    
    def get_serving_nutrition(self, serving_qty: float = 1.0) -> dict:
        """Get nutrition data for a specific serving quantity"""
        # Check if we have unit_serving_* data available
        has_serving_data = any([
            self.unit_serving_energy_kcal is not None,
            self.unit_serving_protein_g is not None,
            self.unit_serving_carb_g is not None,
            self.unit_serving_fat_g is not None
        ])
        
        if has_serving_data:
            # Use serving-specific data if available (regardless of servings_unit)
            multiplier = serving_qty
            return {
                "energy_kcal": round((self.unit_serving_energy_kcal or 0) * multiplier, 2),
                "protein_g": round((self.unit_serving_protein_g or 0) * multiplier, 2),
                "carbs_g": round((self.unit_serving_carb_g or 0) * multiplier, 2),
                "fat_g": round((self.unit_serving_fat_g or 0) * multiplier, 2),
                "fiber_g": round((self.unit_serving_fibre_g or 0) * multiplier, 2),
                "sugar_g": round((self.unit_serving_freesugar_g or 0) * multiplier, 2),
                "sodium_mg": round((self.unit_serving_sodium_mg or 0) * multiplier, 2),
                "calcium_mg": round((self.unit_serving_calcium_mg or 0) * multiplier, 2),
                "iron_mg": round((self.unit_serving_iron_mg or 0) * multiplier, 2),
                "vitc_mg": round((self.unit_serving_vitc_mg or 0) * multiplier, 2),
            }
        else:
            # Fallback to per 100g calculation
            multiplier = serving_qty / 100.0
            base_nutrition = self.get_nutrition_per_100g()
            return {k: round(v * multiplier, 2) for k, v in base_nutrition.items()}
