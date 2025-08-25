"""
Natural language intent parsing for direct command execution.
Extracts structured action parameters from casual speech.
"""
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json


class IntentParser:
    """Parse natural language into structured action parameters."""
    
    def __init__(self):
        # Exercise name patterns
        self.exercise_patterns = {
            'bench press': ['bench', 'bench press', 'benchpress'],
            'squat': ['squat', 'squats'],
            'deadlift': ['deadlift', 'deadlifts', 'dl'],
            'pull up': ['pull up', 'pullup', 'pull-up', 'pullups'],
            'push up': ['push up', 'pushup', 'push-up', 'pushups'],
            'run': ['run', 'running', 'jog', 'jogging'],
            'walk': ['walk', 'walking'],
            'bike': ['bike', 'biking', 'cycling', 'cycle'],
            'swim': ['swim', 'swimming'],
            'plank': ['plank', 'planks'],
            'burpee': ['burpee', 'burpees'],
        }
        
        # Food patterns for quick recognition
        self.food_patterns = {
            'breakfast': ['breakfast', 'morning meal'],
            'lunch': ['lunch', 'midday meal'],
            'dinner': ['dinner', 'evening meal', 'supper'],
            'snack': ['snack', 'snacking'],
        }
    
    def parse_fitness_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse fitness-related commands from natural language."""
        text_lower = text.lower().strip()
        
        # Goal creation patterns
        goal_patterns = [
            r'my goal is to (.+)',
            r'i want to (.+)',
            r'goal: (.+)',
            r'target: (.+)',
        ]
        
        for pattern in goal_patterns:
            match = re.search(pattern, text_lower)
            if match:
                goal_text = match.group(1).strip()
                return {
                    'action': 'fitness.create_goal',
                    'params': {
                        'name': goal_text,
                        'category': self._detect_goal_category(goal_text)
                    }
                }
        
        # Workout logging patterns
        workout_match = self._parse_workout_log(text_lower)
        if workout_match:
            return workout_match
            
        return None
    
    def parse_nutrition_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse nutrition-related commands from natural language."""
        text_lower = text.lower().strip()
        
        # Meal logging patterns
        meal_patterns = [
            r'i ate (.+)',
            r'had (.+) for (breakfast|lunch|dinner|snack)',
            r'(breakfast|lunch|dinner|snack): (.+)',
            r'logged? (.+) meal',
            r'my (breakfast|lunch|dinner|snack) was (.+)',
        ]
        
        for pattern in meal_patterns:
            match = re.search(pattern, text_lower)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    meal_type, foods = groups[1], groups[0]
                    if meal_type in ['breakfast', 'lunch', 'dinner', 'snack']:
                        foods, meal_type = meal_type, foods
                else:
                    foods = groups[0]
                    meal_type = self._detect_meal_type(text_lower)
                
                return {
                    'action': 'nutrition.log_meal',
                    'params': {
                        'description': foods.strip(),
                        'meal_type': meal_type,
                        'when': datetime.now().isoformat()
                    }
                }
        
        return None
    
    def parse_hydration_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse hydration logging from natural language."""
        text_lower = text.lower().strip()
        
        # Water logging patterns
        water_patterns = [
            r'drank (\d+(?:\.\d+)?)\s*(ml|milliliters?|cups?|glasses?|liters?|l)',
            r'had (\d+(?:\.\d+)?)\s*(ml|milliliters?|cups?|glasses?|liters?|l) of water',
            r'(\d+(?:\.\d+)?)\s*(ml|milliliters?|cups?|glasses?|liters?|l) water',
        ]
        
        for pattern in water_patterns:
            match = re.search(pattern, text_lower)
            if match:
                amount = float(match.group(1))
                unit = match.group(2).lower()
                
                # Convert to ml
                if unit in ['cups', 'cup', 'glasses', 'glass']:
                    amount_ml = amount * 240
                elif unit in ['liters', 'liter', 'l']:
                    amount_ml = amount * 1000
                else:
                    amount_ml = amount
                
                return {
                    'action': 'hydration.log_water',
                    'params': {
                        'amount_ml': amount_ml,
                        'when': datetime.now().isoformat()
                    }
                }
        
        return None
    
    def parse_mood_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse mood check-ins from natural language."""
        text_lower = text.lower().strip()
        
        # Mood patterns
        mood_patterns = [
            r'feeling (\w+)',
            r'mood: (\d+(?:/10)?)',
            r'i feel (\w+)',
            r'my mood is (\w+|\d+)',
        ]
        
        for pattern in mood_patterns:
            match = re.search(pattern, text_lower)
            if match:
                mood_text = match.group(1)
                mood_score = self._text_to_mood_score(mood_text)
                
                if mood_score:
                    return {
                        'action': 'mood.log_checkin',
                        'params': {
                            'mood_score': mood_score,
                            'notes': text.strip(),
                            'when': datetime.now().isoformat()
                        }
                    }
        
        return None
    
    def parse_any_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """Try to parse any supported intent from text."""
        # Try fitness first
        intent = self.parse_fitness_intent(text)
        if intent:
            return intent
            
        # Try nutrition
        intent = self.parse_nutrition_intent(text)
        if intent:
            return intent
            
        # Try hydration
        intent = self.parse_hydration_intent(text)
        if intent:
            return intent
            
        # Try mood
        intent = self.parse_mood_intent(text)
        if intent:
            return intent
            
        return None
    
    def _parse_workout_log(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse workout logging from text."""
        exercises = []
        
        # Pattern: "I did 3 sets of bench press at 50kg"
        workout_pattern = r'(?:i (?:did|performed|completed)|logged?)\s+(\d+)\s+sets?\s+of\s+(.+?)\s+(?:at|with|@)\s+(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)'
        matches = re.finditer(workout_pattern, text)
        
        for match in matches:
            sets = int(match.group(1))
            exercise_name = self._normalize_exercise_name(match.group(2))
            weight = float(match.group(3))
            unit = match.group(4).lower()
            
            weight_kg = weight if unit in ['kg'] else weight * 0.453592  # lbs to kg
            
            exercises.append({
                'name': exercise_name,
                'sets': sets,
                'weight_kg': weight_kg
            })
        
        # Pattern: "I benched 50kg" (simpler)
        simple_pattern = r'i\s+(\w+(?:\s+\w+)?)\s+(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)'
        matches = re.finditer(simple_pattern, text)
        
        for match in matches:
            exercise_raw = match.group(1)
            exercise_name = self._normalize_exercise_name(exercise_raw)
            weight = float(match.group(2))
            unit = match.group(3).lower()
            
            weight_kg = weight if unit in ['kg'] else weight * 0.453592
            
            exercises.append({
                'name': exercise_name,
                'sets': 1,  # Default
                'weight_kg': weight_kg
            })
        
        # Cardio patterns: "I ran 5k in 30 minutes"
        cardio_pattern = r'i\s+(ran|jogged|walked|biked|cycled|swam)\s+(\d+(?:\.\d+)?)\s*(k|km|miles?|mi)\s*(?:in\s+(\d+)\s*(?:minutes?|mins?|m))?'
        matches = re.finditer(cardio_pattern, text)
        
        for match in matches:
            activity = match.group(1)
            distance = float(match.group(2))
            unit = match.group(3).lower()
            duration = int(match.group(4)) if match.group(4) else None
            
            distance_km = distance if unit in ['k', 'km'] else distance * 1.60934  # miles to km
            
            exercise = {
                'name': activity,
                'distance_km': distance_km
            }
            if duration:
                exercise['duration_min'] = duration
                
            exercises.append(exercise)
        
        if exercises:
            return {
                'action': 'fitness.log_workout',
                'params': {
                    'exercises': exercises,
                    'when': datetime.now().isoformat()
                }
            }
        
        return None
    
    def _normalize_exercise_name(self, raw_name: str) -> str:
        """Normalize exercise names to standard forms."""
        raw_lower = raw_name.lower().strip()
        
        for standard_name, variants in self.exercise_patterns.items():
            if any(variant in raw_lower for variant in variants):
                return standard_name
                
        return raw_name.title()
    
    def _detect_goal_category(self, goal_text: str) -> str:
        """Detect goal category from goal description."""
        text_lower = goal_text.lower()
        
        if any(word in text_lower for word in ['lift', 'bench', 'squat', 'deadlift', 'press', 'strong']):
            return 'strength'
        elif any(word in text_lower for word in ['run', 'cardio', 'endurance', 'marathon', 'bike']):
            return 'cardio'
        elif any(word in text_lower for word in ['lose', 'weight', 'fat', 'slim']):
            return 'weight_loss'
        elif any(word in text_lower for word in ['gain', 'muscle', 'bulk', 'mass']):
            return 'muscle_gain'
        elif any(word in text_lower for word in ['flexible', 'stretch', 'yoga']):
            return 'flexibility'
        else:
            return 'strength'  # Default
    
    def _detect_meal_type(self, text: str) -> Optional[str]:
        """Detect meal type from context."""
        now = datetime.now()
        hour = now.hour
        
        # Time-based defaults
        if hour < 11:
            return 'breakfast'
        elif hour < 16:
            return 'lunch'
        elif hour < 22:
            return 'dinner'
        else:
            return 'snack'
    
    def _text_to_mood_score(self, mood_text: str) -> Optional[int]:
        """Convert mood text to 1-10 score."""
        mood_text = mood_text.lower().strip()
        
        # Direct number
        if mood_text.isdigit():
            score = int(mood_text)
            return score if 1 <= score <= 10 else None
        
        # Number with /10
        if '/' in mood_text:
            try:
                score = int(mood_text.split('/')[0])
                return score if 1 <= score <= 10 else None
            except:
                pass
        
        # Text to score mapping
        mood_map = {
            'terrible': 1, 'awful': 1, 'horrible': 1,
            'bad': 2, 'poor': 2, 'sad': 2,
            'low': 3, 'down': 3, 'meh': 3,
            'okay': 4, 'ok': 4, 'fine': 4,
            'neutral': 5, 'average': 5, 'normal': 5,
            'good': 6, 'decent': 6, 'alright': 6,
            'great': 7, 'happy': 7, 'positive': 7,
            'excellent': 8, 'amazing': 8, 'fantastic': 8,
            'incredible': 9, 'outstanding': 9, 'wonderful': 9,
            'perfect': 10, 'ecstatic': 10, 'euphoric': 10,
        }
        
        return mood_map.get(mood_text)


# Singleton instance
intent_parser = IntentParser()
