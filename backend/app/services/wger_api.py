"""
wger.de API Client
Fetches exercise data from wger.de API and maps it to our system
"""
import os
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from app.core.config import settings

# Load environment variables
load_dotenv()

class WgerApiClient:
    def __init__(self):
        self.base_url = "https://wger.de/api/v2"
        self.api_key = os.getenv("WGER_API")
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }

    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to wger.de API with rate limiting"""
        url = f"{self.base_url}/{endpoint}"

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()

            # Rate limiting - wger.de allows 100 requests per hour
            time.sleep(0.1)  # 100ms delay between requests

            return response.json()
        except requests.exceptions.RequestException as e:
            return {}

    def get_exercises(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Fetch exercises from wger.de API"""
        params = {
            "limit": limit,
            "offset": offset
        }

        data = self._make_request("exercise/", params)
        return data.get("results", [])

    def get_all_exercises(self) -> List[Dict]:
        """Fetch all exercises from wger.de API (handles pagination)"""
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

    def get_exercise_categories(self) -> List[Dict]:
        """Fetch exercise categories from wger.de API"""
        return self._make_request("exercisecategory/").get("results", [])

    def get_muscles(self) -> List[Dict]:
        """Fetch muscle groups from wger.de API"""
        return self._make_request("muscle/").get("results", [])

    def get_equipment(self) -> List[Dict]:
        """Fetch equipment from wger.de API"""
        return self._make_request("equipment/").get("results", [])

    def get_exercise_translations(self, exercise_id: int) -> List[Dict]:
        """Fetch exercise translations for a specific exercise"""
        return self._make_request(f"exercise-translation/?exercise={exercise_id}").get("results", [])

    def search_exercises(self, query: str, limit: int = 20) -> List[Dict]:
        """Search exercises by name"""
        params = {
            "search": query,
            "limit": limit
        }

        return self._make_request("exercise/", params).get("results", [])

# Category mapping from wger.de to our attribute system
WGER_CATEGORY_MAPPING = {
    # wger.de category ID -> our category name -> our attribute type
    8: ("Arms", "strength"),           # Arms
    11: ("Chest", "strength"),         # Chest
    12: ("Back", "strength"),          # Back
    9: ("Legs", "strength"),           # Legs
    13: ("Shoulders", "strength"),     # Shoulders
    10: ("Abs", "strength"),           # Abs
    15: ("Cardio", "cardio"),          # Cardio
    14: ("Calves", "flexibility"),     # Calves (treat as flexibility)
}

def map_wger_category_to_attributes(category_id: int) -> Dict:
    """Map wger.de category to our attribute system"""
    if category_id not in WGER_CATEGORY_MAPPING:
        return {"category": "Other", "type": "general", "attributes": []}

    category_name, attribute_type = WGER_CATEGORY_MAPPING[category_id]

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
