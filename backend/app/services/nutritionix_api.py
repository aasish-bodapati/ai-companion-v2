"""
Nutritionix API Client
Fetches nutrition data from Nutritionix API and maps it to our system
"""
import os
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from app.core.config import settings

# Load environment variables
load_dotenv()

class NutritionixApiClient:
    def __init__(self):
        self.base_url = "https://trackapi.nutritionix.com/v2"
        self.app_id = os.getenv("NUTRITIONIX_APP_ID", "fb6b427b")
        self.api_key = os.getenv("NUTRITIONIX_API_KEY", "7017dca7c579fb823722dc34441c570e")
        self.headers = {
            "x-app-id": self.app_id,
            "x-app-key": self.api_key,
            "Content-Type": "application/json"
        }

    def _make_request(self, endpoint: str, method: str = "GET", data: Dict = None) -> Dict:
        """Make a request to Nutritionix API with rate limiting"""
        url = f"{self.base_url}/{endpoint}"

        try:
            if method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data)
            else:
                response = requests.get(url, headers=self.headers, params=data)
            
            response.raise_for_status()

            # Rate limiting - small delay between requests
            time.sleep(0.1)  # 100ms delay between requests

            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] [NUTRITIONIX API] Request failed: {e}")
            return {}

    def search_foods(self, query: str, limit: int = 20) -> List[Dict]:
        """Search for foods by name"""
        params = {
            "query": query
        }
        
        result = self._make_request("search/instant", "GET", params)
        return result.get("common", []) + result.get("branded", [])

    def get_food_nutrition(self, food_id: str, food_type: str = "common") -> Dict:
        """Get detailed nutrition information for a specific food"""
        data = {
            "query": food_id,
            "timezone": "US/Eastern"
        }
        
        result = self._make_request("natural/nutrients", "POST", data)
        foods = result.get("foods", [])
        return foods[0] if foods else {}

    def get_food_nutrition_by_name(self, food_name: str) -> Dict:
        """Get nutrition information by food name using natural language"""
        data = {
            "query": food_name,
            "timezone": "US/Eastern"
        }
        
        result = self._make_request("natural/nutrients", "POST", data)
        foods = result.get("foods", [])
        return foods[0] if foods else {}

    def get_branded_food(self, nix_item_id: str) -> Dict:
        """Get detailed information for a branded food item"""
        data = {
            "nix_item_id": nix_item_id,
            "timezone": "US/Eastern"
        }
        
        result = self._make_request("search/item", "POST", data)
        return result.get("foods", [{}])[0]

    def get_exercise_info(self, exercise_name: str) -> List[Dict]:
        """Get exercise information and calories burned"""
        data = {
            "query": exercise_name,
            "gender": "male",  # Default, should be configurable
            "weight_kg": 70,   # Default, should be configurable
            "height_cm": 175,  # Default, should be configurable
            "age": 30          # Default, should be configurable
        }
        
        result = self._make_request("natural/exercise", "POST", data)
        return result.get("exercises", [])

    def map_nutrition_data(self, nutrition_data: Dict) -> Dict:
        """Map Nutritionix nutrition data to our system format - basic macros only"""
        if not nutrition_data:
            return {}
        
        return {
            "food_name": nutrition_data.get("food_name", ""),
            "brand": nutrition_data.get("brand_name", ""),
            "calories": round(nutrition_data.get("nf_calories", 0), 1),
            "protein_g": round(nutrition_data.get("nf_protein", 0), 1),
            "carbs_g": round(nutrition_data.get("nf_total_carbohydrate", 0), 1),
            "fat_g": round(nutrition_data.get("nf_total_fat", 0), 1),
            "serving_qty": nutrition_data.get("serving_qty", 1),
            "serving_unit": nutrition_data.get("serving_unit", ""),
            "serving_weight_g": nutrition_data.get("serving_weight_grams", 0),
            "photo": nutrition_data.get("photo", {}).get("thumb", ""),
            "nix_id": nutrition_data.get("tag_id") or nutrition_data.get("nix_item_id", "")
        }

    def search_and_get_nutrition(self, query: str) -> List[Dict]:
        """Search for foods and get their nutrition data"""
        # First search for foods
        search_results = self.search_foods(query, limit=5)
        
        nutrition_results = []
        for item in search_results:
            try:
                if item.get("type") == "common":
                    # For common foods, get nutrition by name
                    nutrition = self.get_food_nutrition_by_name(item.get("food_name", ""))
                else:
                    # For branded foods, get by nix_item_id
                    nutrition = self.get_branded_food(item.get("nix_item_id", ""))
                
                if nutrition:
                    mapped_data = self.map_nutrition_data(nutrition)
                    if mapped_data:
                        nutrition_results.append(mapped_data)
                        
            except Exception as e:
                print(f"[ERROR] [NUTRITIONIX API] Error getting nutrition for {item.get('food_name', 'unknown')}: {e}")
                continue
        
        return nutrition_results

    def calculate_serving_nutrition(self, base_nutrition: Dict, serving_qty: float, serving_unit: str = None) -> Dict:
        """Calculate nutrition for a custom serving size"""
        if not base_nutrition:
            return {}
        
        # Use provided serving unit or default from base nutrition
        target_unit = serving_unit or base_nutrition.get("serving_unit", "")
        base_qty = base_nutrition.get("serving_qty", 1)
        
        # Calculate multiplier
        multiplier = serving_qty / base_qty if base_qty > 0 else 1
        
        return {
            "food_name": base_nutrition.get("food_name", ""),
            "brand": base_nutrition.get("brand", ""),
            "calories": round(base_nutrition.get("calories", 0) * multiplier, 1),
            "protein_g": round(base_nutrition.get("protein_g", 0) * multiplier, 1),
            "carbs_g": round(base_nutrition.get("carbs_g", 0) * multiplier, 1),
            "fat_g": round(base_nutrition.get("fat_g", 0) * multiplier, 1),
            "serving_qty": serving_qty,
            "serving_unit": target_unit,
            "serving_weight_g": round(base_nutrition.get("serving_weight_g", 0) * multiplier, 1),
            "photo": base_nutrition.get("photo", ""),
            "nix_id": base_nutrition.get("nix_id", "")
        }

# Test function
def test_nutritionix_api():
    """Test the Nutritionix API with sample queries"""
    client = NutritionixApiClient()
    
    print("Testing Nutritionix API...")
    
    # Test 1: Search for foods
    print("\n1. Testing food search...")
    search_results = client.search_foods("apple")
    print(f"Found {len(search_results)} results for 'apple'")
    for item in search_results[:3]:
        print(f"  - {item.get('food_name', 'Unknown')} ({item.get('type', 'unknown')})")
    
    # Test 2: Get nutrition for a specific food
    print("\n2. Testing nutrition lookup...")
    nutrition = client.get_food_nutrition_by_name("1 medium apple")
    if nutrition:
        mapped = client.map_nutrition_data(nutrition)
        print(f"Basic macros for apple:")
        print(f"  Calories: {mapped.get('calories', 0)}")
        print(f"  Protein: {mapped.get('protein_g', 0)}g")
        print(f"  Carbs: {mapped.get('carbs_g', 0)}g")
        print(f"  Fat: {mapped.get('fat_g', 0)}g")
        print(f"  Serving: {mapped.get('serving_qty', 1)} {mapped.get('serving_unit', '')}")
    else:
        print("No nutrition data found")
    
    # Test 3: Search and get nutrition
    print("\n3. Testing combined search and nutrition...")
    results = client.search_and_get_nutrition("banana")
    print(f"Found nutrition data for {len(results)} items")
    for result in results[:2]:
        print(f"  - {result.get('food_name', 'Unknown')}: {result.get('calories', 0)} cal, {result.get('protein_g', 0)}g protein")
    
    # Test 4: Serving size calculation
    print("\n4. Testing serving size calculation...")
    if nutrition:
        # Test 2 apples
        two_apples = client.calculate_serving_nutrition(mapped, 2)
        print(f"2 apples: {two_apples.get('calories', 0)} cal, {two_apples.get('protein_g', 0)}g protein")
        
        # Test 0.5 apple
        half_apple = client.calculate_serving_nutrition(mapped, 0.5)
        print(f"Half apple: {half_apple.get('calories', 0)} cal, {half_apple.get('protein_g', 0)}g protein")
    
    # Test 5: Exercise lookup
    print("\n5. Testing exercise lookup...")
    exercises = client.get_exercise_info("running")
    print(f"Found {len(exercises)} exercise results")
    for exercise in exercises[:2]:
        print(f"  - {exercise.get('name', 'Unknown')}: {exercise.get('nf_calories', 0)} cal")
    
    print("\n[SUCCESS] Nutritionix API test completed!")

if __name__ == "__main__":
    test_nutritionix_api()
