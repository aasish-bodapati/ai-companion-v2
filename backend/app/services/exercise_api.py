"""
ExerciseDB API Client
Fetches exercise data from our self-hosted ExerciseDB API
"""
import os
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from app.core.config import settings

# Load environment variables
load_dotenv()

class ExerciseApiClient:
    def __init__(self):
        # Use our self-hosted ExerciseDB API
        self.base_url = "http://localhost:80/api/v1"
        self.headers = {
            "Content-Type": "application/json"
        }

    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to ExerciseDB API"""
        url = f"{self.base_url}/{endpoint}"

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()

            # Small delay to be respectful to our own server
            time.sleep(0.01)  # 10ms delay

            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching from ExerciseDB API: {e}")
            return {"success": False, "data": [], "error": str(e)}

    def get_exercises(self, limit: int = 100, offset: int = 0, body_part: str = None, equipment: str = None, target_muscle: str = None) -> List[Dict]:
        """Fetch exercises from ExerciseDB API with optional filtering"""
        params = {
            "limit": limit,
            "offset": offset
        }
        
        if body_part:
            params["bodyPart"] = body_part
        if equipment:
            params["equipment"] = equipment
        if target_muscle:
            params["targetMuscle"] = target_muscle

        data = self._make_request("exercises", params)
        if data.get("success"):
            return data.get("data", [])
        return []

    def get_all_exercises(self) -> List[Dict]:
        """Fetch all exercises from ExerciseDB API (handles pagination)"""
        all_exercises = []
        offset = 0
        limit = 100

        while True:
            exercises = self.get_exercises(limit=limit, offset=offset)
            if not exercises:
                break

            all_exercises.extend(exercises)
            offset += limit

            # Safety break to prevent infinite loops
            if len(exercises) < limit:
                break

        return all_exercises

    def get_exercise_by_id(self, exercise_id: str) -> Optional[Dict]:
        """Fetch a specific exercise by ID"""
        data = self._make_request(f"exercises/{exercise_id}")
        if data.get("success"):
            return data.get("data")
        return None

    def get_exercise_categories(self) -> List[Dict]:
        """Fetch exercise categories (body parts) from ExerciseDB API"""
        data = self._make_request("bodyparts")
        if data.get("success"):
            return data.get("data", [])
        return []

    def get_muscles(self) -> List[Dict]:
        """Fetch muscle groups from ExerciseDB API"""
        data = self._make_request("muscles")
        if data.get("success"):
            return data.get("data", [])
        return []

    def get_equipment(self) -> List[Dict]:
        """Fetch equipment from ExerciseDB API"""
        data = self._make_request("equipments")
        if data.get("success"):
            return data.get("data", [])
        return []

    def search_exercises(self, query: str, limit: int = 20) -> List[Dict]:
        """Search exercises by name"""
        params = {
            "search": query,
            "limit": limit
        }

        data = self._make_request("exercises", params)
        if data.get("success"):
            return data.get("data", [])
        return []

    def get_exercises_by_body_part(self, body_part: str, limit: int = 50) -> List[Dict]:
        """Get exercises for a specific body part"""
        return self.get_exercises(limit=limit, body_part=body_part)

    def get_exercises_by_equipment(self, equipment: str, limit: int = 50) -> List[Dict]:
        """Get exercises for a specific equipment type"""
        return self.get_exercises(limit=limit, equipment=equipment)

    def get_exercises_by_target_muscle(self, target_muscle: str, limit: int = 50) -> List[Dict]:
        """Get exercises for a specific target muscle"""
        return self.get_exercises(limit=limit, target_muscle=target_muscle)

# Category mapping from ExerciseDB to our attribute system
EXERCISE_CATEGORY_MAPPING = {
    # ExerciseDB body part -> our category name -> our attribute type
    "chest": ("Chest", "strength"),
    "back": ("Back", "strength"),
    "upper arms": ("Arms", "strength"),
    "lower arms": ("Arms", "strength"),
    "shoulders": ("Shoulders", "strength"),
    "upper legs": ("Legs", "strength"),
    "lower legs": ("Legs", "strength"),
    "waist": ("Abs", "strength"),
    "cardio": ("Cardio", "cardio"),
    "neck": ("Neck", "flexibility"),
}

def map_exercise_category_to_attributes(body_part: str) -> Dict:
    """Map ExerciseDB body part to our attribute system"""
    if body_part not in EXERCISE_CATEGORY_MAPPING:
        return {"category": "Other", "type": "general", "attributes": []}

    category_name, attribute_type = EXERCISE_CATEGORY_MAPPING[body_part]

    # Define attributes based on type
    if attribute_type == "strength":
        return {
            "category": category_name,
            "type": "strength",
            "attributes": [
                {"name": "sets", "type": "number", "label": "Sets", "required": True},
                {"name": "reps", "type": "number", "label": "Reps", "required": True},
                {"name": "weight", "type": "number", "label": "Weight", "required": False},
                {"name": "weight_unit", "type": "select", "label": "Weight Unit", "options": ["lbs", "kg"], "required": False},
                {"name": "equipment_type", "type": "select", "label": "Equipment", "options": ["barbell", "dumbbell", "machine", "bodyweight"], "required": False},
                {"name": "rest_time", "type": "number", "label": "Rest Time (min)", "required": False}
            ]
        }
    elif attribute_type == "cardio":
        return {
            "category": category_name,
            "type": "cardio",
            "attributes": [
                {"name": "duration", "type": "number", "label": "Duration (min)", "required": True},
                {"name": "distance", "type": "number", "label": "Distance", "required": False},
                {"name": "intensity", "type": "select", "label": "Intensity", "options": ["low", "medium", "high"], "required": False},
                {"name": "heart_rate", "type": "number", "label": "Heart Rate (bpm)", "required": False},
                {"name": "notes", "type": "text", "label": "Notes", "required": False}
            ]
        }
    elif attribute_type == "flexibility":
        return {
            "category": category_name,
            "type": "flexibility",
            "attributes": [
                {"name": "duration", "type": "number", "label": "Duration (min)", "required": True},
                {"name": "hold_time", "type": "number", "label": "Hold Time (sec)", "required": False},
                {"name": "difficulty", "type": "select", "label": "Difficulty", "options": ["beginner", "intermediate", "advanced"], "required": False},
                {"name": "notes", "type": "text", "label": "Notes", "required": False}
            ]
        }
    else:
        return {
            "category": category_name,
            "type": "general",
            "attributes": [
                {"name": "duration", "type": "number", "label": "Duration (min)", "required": True},
                {"name": "notes", "type": "text", "label": "Notes", "required": False}
            ]
        }
