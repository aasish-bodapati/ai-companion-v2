import { DebugUtils } from '../utils/debugUtils';


// Local food service using Indian Food Nutrition dataset
// We'll load the data dynamically to avoid import issues

export interface LocalFoodItem {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitamin_c_mg: number;
  folate_ug: number;
  serving_qty: number;
  serving_unit: string;
  serving_weight_g: number;
  photo: string;
  type: string;
}

export interface LocalFoodSearchResult {
  id: string;
  name: string;
  brand: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_qty: number;
  serving_unit: string;
  serving_weight_g: number;
  photo: string;
  type: string;
}

class LocalFoodService {
  private foodData: LocalFoodItem[] = [];
  private dataLoaded: boolean = false;

  constructor() {
    this.loadFoodData();
  }

  private loadFoodData() {
    DebugUtils.log('Loading food data with sample items');
    // Sample data for testing - we'll expand this later
    this.foodData = [
      {
        id: 'local-1',
        name: 'Rice',
        brand: '',
        calories: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fat_g: 0.3,
        fiber_g: 0.4,
        sodium_mg: 1,
        calcium_mg: 28,
        iron_mg: 0.8,
        vitamin_c_mg: 0,
        folate_ug: 8,
        serving_qty: 1,
        serving_unit: '100g',
        serving_weight_g: 100,
        photo: '',
        type: 'food'
      },
      {
        id: 'local-2',
        name: 'Dal (Lentils)',
        brand: '',
        calories: 116,
        protein_g: 9,
        carbs_g: 20,
        fat_g: 0.4,
        fiber_g: 7.9,
        sodium_mg: 2,
        calcium_mg: 19,
        iron_mg: 3.3,
        vitamin_c_mg: 1.5,
        folate_ug: 181,
        serving_qty: 1,
        serving_unit: '100g',
        serving_weight_g: 100,
        photo: '',
        type: 'food'
      },
      {
        id: 'local-3',
        name: 'Roti (Chapati)',
        brand: '',
        calories: 297,
        protein_g: 11,
        carbs_g: 59,
        fat_g: 2,
        fiber_g: 2.7,
        sodium_mg: 409,
        calcium_mg: 20,
        iron_mg: 3.2,
        vitamin_c_mg: 0,
        folate_ug: 20,
        serving_qty: 1,
        serving_unit: '100g',
        serving_weight_g: 100,
        photo: '',
        type: 'food'
      }
    ];
    this.dataLoaded = true;
  }

  // Search foods by name
  async searchFoods(query: string, limit: number = 10): Promise<LocalFoodSearchResult[]> {
    const searchTerm = query.toLowerCase().trim();

    // Wait for data to be loaded
    while (!this.dataLoaded) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    DebugUtils.log('Searching for:', query, 'in', this.foodData.length, 'items');

    if (!searchTerm) {
      return [];
    }

    const results = this.foodData
      .filter(food =>
        food.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit)
      .map(food => {
        DebugUtils.log('Found food:', food.name, 'calories:', food.calories);
        return {
          id: food.id,
          name: food.name,
          brand: food.brand,
          calories_per_100g: food.calories,
          protein_per_100g: food.protein_g,
          carbs_per_100g: food.carbs_g,
          fat_per_100g: food.fat_g,
          serving_qty: food.serving_qty,
          serving_unit: food.serving_unit,
          serving_weight_g: food.serving_weight_g,
          photo: food.photo,
          type: food.type
        };
      });

    return results;
  }

  // Get detailed nutrition for a specific food
  async getFoodNutrition(foodName: string, type: string = 'common'): Promise<LocalFoodItem | null> {
    const food = this.foodData.find(item =>
      item.name.toLowerCase() === foodName.toLowerCase()
    );

    if (!food) {
      return null;
    }

    return {
      ...food,
      serving_qty: 1,
      serving_unit: '100g',
      serving_weight_g: 100
    };
  }

  // Get nutrition using natural language (for compatibility)
  async getNaturalNutrition(query: string): Promise<LocalFoodItem | null> {
    return this.getFoodNutrition(query);
  }

  // Calculate serving nutrition (for compatibility)
  async calculateServingNutrition(foodName: string, quantity: number): Promise<LocalFoodItem | null> {
    const food = await this.getFoodNutrition(foodName);

    if (!food) {
      return null;
    }

    // Scale nutrition based on quantity (quantity is in grams)
    const scaleFactor = quantity / 100; // Since our data is per 100g

    return {
      ...food,
      calories: Math.round(food.calories * scaleFactor * 10) / 10,
      protein_g: Math.round(food.protein_g * scaleFactor * 10) / 10,
      carbs_g: Math.round(food.carbs_g * scaleFactor * 10) / 10,
      fat_g: Math.round(food.fat_g * scaleFactor * 10) / 10,
      fiber_g: Math.round(food.fiber_g * scaleFactor * 10) / 10,
      sodium_mg: Math.round(food.sodium_mg * scaleFactor * 10) / 10,
      calcium_mg: Math.round(food.calcium_mg * scaleFactor * 10) / 10,
      iron_mg: Math.round(food.iron_mg * scaleFactor * 10) / 10,
      vitamin_c_mg: Math.round(food.vitamin_c_mg * scaleFactor * 10) / 10,
      folate_ug: Math.round(food.folate_ug * scaleFactor * 10) / 10,
      serving_qty: quantity / 100,
      serving_unit: 'g',
      serving_weight_g: quantity
    };
  }
}

export const localFoodService = new LocalFoodService();
