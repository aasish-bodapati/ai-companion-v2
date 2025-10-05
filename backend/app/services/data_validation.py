"""
Data validation service for health logging data quality.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from app.models.health.fitness_log import FitnessLog
from app.models.health.fitness_log import NutritionLog
from app.models.health.food_log_items import FoodLogItem


class DataValidationService:
    """Service for validating health logging data quality."""
    
    # Realistic limits for validation
    MAX_WORKOUT_DURATION = 480  # 8 hours
    MAX_CALORIES_PER_MEAL = 2000  # Very large meal
    MAX_WEIGHT_LIFTED = 500  # kg
    MAX_DISTANCE_RUN = 100  # km
    MAX_REPS = 1000
    
    def validate_fitness_log(self, log: FitnessLog) -> Tuple[bool, List[str]]:
        """Validate fitness log data for realistic values."""
        warnings = []
        
        # Duration validation
        if log.duration_minutes > self.MAX_WORKOUT_DURATION:
            warnings.append(f"Workout duration ({log.duration_minutes} min) seems unusually long")
        elif log.duration_minutes < 1:
            warnings.append("Workout duration seems too short")
        
        # Weight validation
        if log.weight_kg and log.weight_kg > self.MAX_WEIGHT_LIFTED:
            warnings.append(f"Weight lifted ({log.weight_kg} kg) seems unrealistic")
        
        # Distance validation
        if log.distance_km and log.distance_km > self.MAX_DISTANCE_RUN:
            warnings.append(f"Distance ({log.distance_km} km) seems unusually long")
        
        # Reps validation
        if log.reps and log.reps > self.MAX_REPS:
            warnings.append(f"Repetitions ({log.reps}) seems unrealistic")
        
        # Calories validation
        if log.calories_burned:
            expected_calories = self._estimate_calories_burned(
                log.activity_type, log.duration_minutes, log.weight_kg
            )
            if log.calories_burned > expected_calories * 2:
                warnings.append(f"Calories burned ({log.calories_burned}) seems high for this activity")
            elif log.calories_burned < expected_calories * 0.3:
                warnings.append(f"Calories burned ({log.calories_burned}) seems low for this activity")
        
        return len(warnings) == 0, warnings
    
    def validate_nutrition_log(self, log: NutritionLog) -> Tuple[bool, List[str]]:
        """Validate nutrition log data for realistic values."""
        warnings = []
        
        # Calorie validation
        if log.total_calories > self.MAX_CALORIES_PER_MEAL:
            warnings.append(f"Meal calories ({log.total_calories}) seems unusually high")
        elif log.total_calories < 10:
            warnings.append("Meal calories seem too low")
        
        # Macro validation
        if log.protein_g and log.protein_g > 200:
            warnings.append(f"Protein ({log.protein_g}g) seems unusually high for one meal")
        
        if log.carbs_g and log.carbs_g > 300:
            warnings.append(f"Carbs ({log.carbs_g}g) seems unusually high for one meal")
        
        if log.fat_g and log.fat_g > 150:
            warnings.append(f"Fat ({log.fat_g}g) seems unusually high for one meal")
        
        # Sodium validation
        if log.sodium_mg and log.sodium_mg > 5000:
            warnings.append(f"Sodium ({log.sodium_mg}mg) seems unusually high")
        
        return len(warnings) == 0, warnings
    
    def validate_food_log_item(self, item: FoodLogItem) -> Tuple[bool, List[str]]:
        """Validate individual food log item."""
        warnings = []
        
        # Quantity validation
        if item.quantity_grams > 2000:  # 2kg
            warnings.append(f"Food quantity ({item.quantity_grams}g) seems unusually large")
        elif item.quantity_grams < 1:
            warnings.append("Food quantity seems too small")
        
        # Nutritional validation
        if item.calories and item.calories > 1000:  # 1000 cal per food item
            warnings.append(f"Food calories ({item.calories}) seem high for this quantity")
        
        return len(warnings) == 0, warnings
    
    def suggest_corrections(self, log: FitnessLog) -> Dict[str, any]:
        """Suggest corrections for fitness log data."""
        suggestions = {}
        
        # Duration suggestions
        if log.duration_minutes > self.MAX_WORKOUT_DURATION:
            suggestions['duration_minutes'] = min(log.duration_minutes, self.MAX_WORKOUT_DURATION)
        
        # Weight suggestions
        if log.weight_kg and log.weight_kg > self.MAX_WEIGHT_LIFTED:
            suggestions['weight_kg'] = min(log.weight_kg, self.MAX_WEIGHT_LIFTED)
        
        # Calories suggestions
        if log.calories_burned:
            expected_calories = self._estimate_calories_burned(
                log.activity_type, log.duration_minutes, log.weight_kg
            )
            if log.calories_burned > expected_calories * 2:
                suggestions['calories_burned'] = expected_calories
        
        return suggestions
    
    def _estimate_calories_burned(self, activity_type: str, duration_minutes: int, weight_kg: Optional[float] = None) -> int:
        """Estimate calories burned based on activity type and duration."""
        # Base calories per minute for different activities
        calories_per_minute = {
            'running': 10,
            'cycling': 8,
            'swimming': 12,
            'weightlifting': 6,
            'yoga': 3,
            'walking': 4,
            'cardio': 9,
            'strength_training': 7,
        }
        
        base_rate = calories_per_minute.get(activity_type.lower(), 5)
        
        # Adjust for weight (assuming 70kg as baseline)
        if weight_kg:
            weight_factor = weight_kg / 70
            base_rate *= weight_factor
        
        return int(base_rate * duration_minutes)
    
    def get_data_quality_score(self, user_id: str, logs: List[FitnessLog]) -> Dict[str, any]:
        """Calculate data quality score for user's logs."""
        if not logs:
            return {"score": 0, "issues": [], "suggestions": []}
        
        total_logs = len(logs)
        valid_logs = 0
        issues = []
        
        for log in logs:
            is_valid, warnings = self.validate_fitness_log(log)
            if is_valid:
                valid_logs += 1
            else:
                issues.extend(warnings)
        
        score = (valid_logs / total_logs) * 100
        
        return {
            "score": round(score, 1),
            "total_logs": total_logs,
            "valid_logs": valid_logs,
            "issues": issues[:10],  # Limit to first 10 issues
            "suggestions": [
                "Log workouts immediately after completion",
                "Include accurate duration and intensity",
                "Add notes for better tracking"
            ]
        }
