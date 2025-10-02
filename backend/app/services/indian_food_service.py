"""
Indian Food Service
Manages Indian food database operations and nutrition calculations
"""

import csv
import os
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.health.indian_food_database import IndianFood
from app.core.config import settings


class IndianFoodService:
    """Service for managing Indian food database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def load_food_data_from_csv(self, csv_file_path: str) -> int:
        """Load food data from CSV file into database"""
        if not os.path.exists(csv_file_path):
            raise FileNotFoundError(f"CSV file not found: {csv_file_path}")
        
        loaded_count = 0
        skipped_count = 0
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                # Read all lines first
                lines = file.readlines()
                
                # Skip first line (all 1s) and use second line as header
                header_line = lines[1].strip()
                data_lines = lines[2:]  # Skip first two lines
                
                # Create reader with proper headers
                reader = csv.DictReader(data_lines, fieldnames=header_line.split(','))
                
                for row_num, row in enumerate(reader, 1):
                    try:
                            
                        # Check if food already exists
                        existing_food = self.db.query(IndianFood).filter(
                            IndianFood.food_code == row['food_code']
                        ).first()
                        
                        if existing_food:
                            skipped_count += 1
                            continue
                        
                        # Create new food entry
                        food = IndianFood(
                            food_code=row['food_code'],
                            food_name=row['food_name'],
                            primary_source=row.get('primarysource'),
                            
                            # Energy
                            energy_kj=self._safe_float(row.get('energy_kj')),
                            energy_kcal=self._safe_float(row.get('energy_kcal')),
                            
                            # Macronutrients
                            carb_g=self._safe_float(row.get('carb_g')),
                            protein_g=self._safe_float(row.get('protein_g')),
                            fat_g=self._safe_float(row.get('fat_g')),
                            free_sugar_g=self._safe_float(row.get('freesugar_g')),
                            fibre_g=self._safe_float(row.get('fibre_g')),
                            
                            # Fatty acids
                            sfa_mg=self._safe_float(row.get('sfa_mg')),
                            mufa_mg=self._safe_float(row.get('mufa_mg')),
                            pufa_mg=self._safe_float(row.get('pufa_mg')),
                            cholesterol_mg=self._safe_float(row.get('cholesterol_mg')),
                            
                            # Minerals
                            calcium_mg=self._safe_float(row.get('calcium_mg')),
                            phosphorus_mg=self._safe_float(row.get('phosphorus_mg')),
                            magnesium_mg=self._safe_float(row.get('magnesium_mg')),
                            sodium_mg=self._safe_float(row.get('sodium_mg')),
                            potassium_mg=self._safe_float(row.get('potassium_mg')),
                            iron_mg=self._safe_float(row.get('iron_mg')),
                            copper_mg=self._safe_float(row.get('copper_mg')),
                            selenium_ug=self._safe_float(row.get('selenium_ug')),
                            chromium_mg=self._safe_float(row.get('chromium_mg')),
                            manganese_mg=self._safe_float(row.get('manganese_mg')),
                            molybdenum_mg=self._safe_float(row.get('molybdenum_mg')),
                            zinc_mg=self._safe_float(row.get('zinc_mg')),
                            
                            # Vitamins
                            vita_ug=self._safe_float(row.get('vita_ug')),
                            vite_mg=self._safe_float(row.get('vite_mg')),
                            vitd2_ug=self._safe_float(row.get('vitd2_ug')),
                            vitd3_ug=self._safe_float(row.get('vitd3_ug')),
                            vitk1_ug=self._safe_float(row.get('vitk1_ug')),
                            vitk2_ug=self._safe_float(row.get('vitk2_ug')),
                            folate_ug=self._safe_float(row.get('folate_ug')),
                            vitb1_mg=self._safe_float(row.get('vitb1_mg')),
                            vitb2_mg=self._safe_float(row.get('vitb2_mg')),
                            vitb3_mg=self._safe_float(row.get('vitb3_mg')),
                            vitb5_mg=self._safe_float(row.get('vitb5_mg')),
                            vitb6_mg=self._safe_float(row.get('vitb6_mg')),
                            vitb7_ug=self._safe_float(row.get('vitb7_ug')),
                            vitb9_ug=self._safe_float(row.get('vitb9_ug')),
                            vitc_mg=self._safe_float(row.get('vitc_mg')),
                            carotenoids_ug=self._safe_float(row.get('carotenoids_ug')),
                            
                            # Serving information
                            servings_unit=row.get('servings_unit'),
                            unit_serving_energy_kj=self._safe_float(row.get('unit_serving_energy_kj')),
                            unit_serving_energy_kcal=self._safe_float(row.get('unit_serving_energy_kcal')),
                            unit_serving_carb_g=self._safe_float(row.get('unit_serving_carb_g')),
                            unit_serving_protein_g=self._safe_float(row.get('unit_serving_protein_g')),
                            unit_serving_fat_g=self._safe_float(row.get('unit_serving_fat_g')),
                            unit_serving_freesugar_g=self._safe_float(row.get('unit_serving_freesugar_g')),
                            unit_serving_fibre_g=self._safe_float(row.get('unit_serving_fibre_g')),
                            unit_serving_sfa_mg=self._safe_float(row.get('unit_serving_sfa_mg')),
                            unit_serving_mufa_mg=self._safe_float(row.get('unit_serving_mufa_mg')),
                            unit_serving_pufa_mg=self._safe_float(row.get('unit_serving_pufa_mg')),
                            unit_serving_cholesterol_mg=self._safe_float(row.get('unit_serving_cholesterol_mg')),
                            unit_serving_calcium_mg=self._safe_float(row.get('unit_serving_calcium_mg')),
                            unit_serving_phosphorus_mg=self._safe_float(row.get('unit_serving_phosphorus_mg')),
                            unit_serving_magnesium_mg=self._safe_float(row.get('unit_serving_magnesium_mg')),
                            unit_serving_sodium_mg=self._safe_float(row.get('unit_serving_sodium_mg')),
                            unit_serving_potassium_mg=self._safe_float(row.get('unit_serving_potassium_mg')),
                            unit_serving_iron_mg=self._safe_float(row.get('unit_serving_iron_mg')),
                            unit_serving_copper_mg=self._safe_float(row.get('unit_serving_copper_mg')),
                            unit_serving_selenium_ug=self._safe_float(row.get('unit_serving_selenium_ug')),
                            unit_serving_chromium_mg=self._safe_float(row.get('unit_serving_chromium_mg')),
                            unit_serving_manganese_mg=self._safe_float(row.get('unit_serving_manganese_mg')),
                            unit_serving_molybdenum_mg=self._safe_float(row.get('unit_serving_molybdenum_mg')),
                            unit_serving_zinc_mg=self._safe_float(row.get('unit_serving_zinc_mg')),
                            unit_serving_vita_ug=self._safe_float(row.get('unit_serving_vita_ug')),
                            unit_serving_vite_mg=self._safe_float(row.get('unit_serving_vite_mg')),
                            unit_serving_vitd2_ug=self._safe_float(row.get('unit_serving_vitd2_ug')),
                            unit_serving_vitd3_ug=self._safe_float(row.get('unit_serving_vitd3_ug')),
                            unit_serving_vitk1_ug=self._safe_float(row.get('unit_serving_vitk1_ug')),
                            unit_serving_vitk2_ug=self._safe_float(row.get('unit_serving_vitk2_ug')),
                            unit_serving_folate_ug=self._safe_float(row.get('unit_serving_folate_ug')),
                            unit_serving_vitb1_mg=self._safe_float(row.get('unit_serving_vitb1_mg')),
                            unit_serving_vitb2_mg=self._safe_float(row.get('unit_serving_vitb2_mg')),
                            unit_serving_vitb3_mg=self._safe_float(row.get('unit_serving_vitb3_mg')),
                            unit_serving_vitb5_mg=self._safe_float(row.get('unit_serving_vitb5_mg')),
                            unit_serving_vitb6_mg=self._safe_float(row.get('unit_serving_vitb6_mg')),
                            unit_serving_vitb7_ug=self._safe_float(row.get('unit_serving_vitb7_ug')),
                            unit_serving_vitb9_ug=self._safe_float(row.get('unit_serving_vitb9_ug')),
                            unit_serving_vitc_mg=self._safe_float(row.get('unit_serving_vitc_mg')),
                            unit_serving_carotenoids_ug=self._safe_float(row.get('unit_serving_carotenoids_ug')),
                        )
                        
                        self.db.add(food)
                        loaded_count += 1
                        
                        # Commit in batches of 100
                        if loaded_count % 100 == 0:
                            self.db.commit()
                            print(f"Loaded {loaded_count} foods...")
                            
                    except Exception as e:
                        print(f"Error processing row {row.get('food_code', 'unknown')}: {e}")
                        skipped_count += 1
                        continue
                
                # Final commit
                self.db.commit()
                
        except Exception as e:
            self.db.rollback()
            raise e
        
        return {
            "loaded": loaded_count,
            "skipped": skipped_count,
            "total_processed": loaded_count + skipped_count
        }
    
    def _safe_float(self, value: str) -> Optional[float]:
        """Safely convert string to float, returning None for invalid values"""
        if not value or value.strip() == '' or value == 'NA':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def search_foods(self, query: str, limit: int = 20) -> List[Dict]:
        """Search for Indian foods by name with relevance ranking"""
        search_term = f"%{query.lower()}%"
        exact_term = query.lower()
        starts_with_term = f"{query.lower()}%"
        
        # Use raw SQL to get proper ranking
        from sqlalchemy import text
        
        sql_query = text("""
            SELECT *,
                CASE 
                    WHEN LOWER(food_name) = :exact_term THEN 1
                    WHEN LOWER(food_name) LIKE :starts_with_term THEN 2
                    WHEN LOWER(food_name) LIKE :search_term THEN 3
                    WHEN LOWER(food_code) LIKE :search_term THEN 4
                    ELSE 5
                END as relevance_rank
            FROM indian_foods 
            WHERE is_active = true 
            AND (
                LOWER(food_name) LIKE :search_term 
                OR LOWER(food_code) LIKE :search_term
            )
            ORDER BY relevance_rank, food_name
            LIMIT :limit
        """)
        
        result = self.db.execute(sql_query, {
            'exact_term': exact_term,
            'starts_with_term': starts_with_term,
            'search_term': search_term,
            'limit': limit
        })
        
        # Convert result to IndianFood objects
        foods = []
        for row in result:
            food = IndianFood()
            for key, value in row._mapping.items():
                if key != 'relevance_rank':
                    setattr(food, key, value)
            foods.append(food)
        
        return [self._format_food_for_api(food) for food in foods]
    
    def get_food_by_code(self, food_code: str) -> Optional[Dict]:
        """Get food by food code"""
        food = self.db.query(IndianFood).filter(
            and_(
                IndianFood.food_code == food_code,
                IndianFood.is_active == True
            )
        ).first()
        
        return self._format_food_for_api(food) if food else None
    
    def get_food_nutrition(self, food_code: str, serving_qty: float = 1.0) -> Optional[Dict]:
        """Get nutrition data for a specific food and serving quantity"""
        food = self.db.query(IndianFood).filter(
            and_(
                IndianFood.food_code == food_code,
                IndianFood.is_active == True
            )
        ).first()
        
        if not food:
            return None
        
        nutrition = food.get_serving_nutrition(serving_qty)
        nutrition.update({
            "food_code": food.food_code,
            "food_name": food.food_name,
            "serving_qty": serving_qty,
            "serving_unit": food.servings_unit or "100g"
        })
        
        return nutrition
    
    def get_popular_foods(self, limit: int = 20) -> List[Dict]:
        """Get popular Indian foods (ordered by energy content)"""
        foods = self.db.query(IndianFood).filter(
            IndianFood.is_active == True
        ).order_by(IndianFood.energy_kcal.desc()).limit(limit).all()
        
        return [self._format_food_for_api(food) for food in foods]
    
    def get_foods_by_category(self, category_keywords: List[str], limit: int = 20) -> List[Dict]:
        """Get foods by category keywords (e.g., ['curry', 'rice', 'dal'])"""
        search_conditions = []
        for keyword in category_keywords:
            search_conditions.append(IndianFood.food_name.ilike(f"%{keyword.lower()}%"))
        
        foods = self.db.query(IndianFood).filter(
            and_(
                IndianFood.is_active == True,
                or_(*search_conditions)
            )
        ).limit(limit).all()
        
        return [self._format_food_for_api(food) for food in foods]
    
    def _format_food_for_api(self, food: IndianFood) -> Dict:
        """Format food data for API response"""
        return {
            "food_code": food.food_code,
            "food_name": food.food_name,
            "primary_source": food.primary_source,
            "energy_kcal": food.energy_kcal,
            "protein_g": food.protein_g,
            "carbs_g": food.carb_g,
            "fat_g": food.fat_g,
            "fiber_g": food.fibre_g,
            "sugar_g": food.free_sugar_g,
            "serving_unit": food.servings_unit,
            "nutrition_per_100g": food.get_nutrition_per_100g(),
            "nutrition_per_serving": food.get_serving_nutrition(1.0)  # Add serving nutrition data
        }
    
    def calculate_meal_nutrition(self, food_items: List[Dict]) -> Dict:
        """Calculate total nutrition for a meal with multiple food items"""
        total_nutrition = {
            "energy_kcal": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "fiber_g": 0,
            "sugar_g": 0,
            "sodium_mg": 0,
            "calcium_mg": 0,
            "iron_mg": 0,
            "vitc_mg": 0
        }
        
        for item in food_items:
            food_code = item.get('food_code')
            serving_qty = item.get('serving_qty', 1.0)
            
            if food_code:
                nutrition = self.get_food_nutrition(food_code, serving_qty)
                if nutrition:
                    for key in total_nutrition:
                        total_nutrition[key] += nutrition.get(key, 0)
        
        # Round to 2 decimal places
        for key in total_nutrition:
            total_nutrition[key] = round(total_nutrition[key], 2)
        
        return total_nutrition
