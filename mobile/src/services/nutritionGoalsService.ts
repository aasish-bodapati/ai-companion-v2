

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  meal_frequency: number;
  bodyTypeGoal: 'sleek' | 'steady' | 'bold';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weight_goal: 'lose' | 'maintain' | 'gain';
  target_weight?: number;
  current_weight?: number;
}

export interface NutritionRecommendations {
  daily_targets: NutritionGoals;
  meal_timing: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  macro_ratios: {
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  hydration_goal: number;
  supplements: string[];
  foods_to_avoid: string[];
  foods_to_prioritize: string[];
}

export class NutritionGoalsService {
  private static instance: NutritionGoalsService;
  private goals: NutritionGoals | null = null;
  private recommendations: NutritionRecommendations | null = null;

  static getInstance(): NutritionGoalsService {
    if (!NutritionGoalsService.instance) {
      NutritionGoalsService.instance = new NutritionGoalsService();
    }
    return NutritionGoalsService.instance;
  }

  // Calculate nutrition goals based on user profile and body type
  calculateGoals(
    userProfile: {
      age: number;
      gender: 'male' | 'female' | 'other';
      height_cm: number;
      weight_kg: number;
      activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      bodyTypeGoal: 'sleek' | 'steady' | 'bold';
      weight_goal: 'lose' | 'maintain' | 'gain';
      target_weight?: number;
    }
  ): NutritionGoals {
    const { age, gender, height_cm, weight_kg, activity_level, bodyTypeGoal, weight_goal, target_weight } = userProfile;

    // Calculate BMR using Mifflin-St Jeor Equation
    const bmr = this.calculateBMR(age, gender, height_cm, weight_kg);

    // Calculate TDEE based on activity level
    const tdee = this.calculateTDEE(bmr, activity_level);

    // Adjust calories based on weight goal
    let calorieGoal = tdee;
    if (weight_goal === 'lose') {
      calorieGoal = tdee - 500; // 500 calorie deficit for 1 lb/week loss
    } else if (weight_goal === 'gain') {
      calorieGoal = tdee + 300; // 300 calorie surplus for 0.6 lb/week gain
    }

    // Adjust calories based on body type goal
    const bodyTypeMultiplier = this.getBodyTypeMultiplier(bodyTypeGoal);
    calorieGoal = Math.round(calorieGoal * bodyTypeMultiplier);

    // Calculate protein needs based on body type and activity level
    const proteinPerKg = this.getProteinPerKg(bodyTypeGoal, activity_level);
    const proteinGoal = Math.round(weight_kg * proteinPerKg);

    // Calculate carb and fat goals
    const { carbsGoal, fatGoal } = this.calculateMacroGoals(calorieGoal, proteinGoal, bodyTypeGoal);

    // Calculate water needs (35ml per kg body weight)
    const waterGoal = Math.round(weight_kg * 35);

    // Calculate meal frequency based on body type
    const mealFrequency = this.getMealFrequency(bodyTypeGoal);

    this.goals = {
      calories: calorieGoal,
      protein_g: proteinGoal,
      carbs_g: carbsGoal,
      fat_g: fatGoal,
      water_ml: waterGoal,
      meal_frequency: mealFrequency,
      bodyTypeGoal: bodyTypeGoal,
      activity_level: activity_level,
      weight_goal: weight_goal,
      target_weight: target_weight,
      current_weight: weight_kg,
    };

    return this.goals;
  }

  // Generate personalized nutrition recommendations
  generateRecommendations(goals: NutritionGoals): NutritionRecommendations {
    const { bodyTypeGoal, activity_level, weight_goal } = goals;

    // Meal timing recommendations
    const mealTiming = this.getMealTimingRecommendations(bodyTypeGoal, activity_level);

    // Macro ratios
    const macroRatios = this.getMacroRatios(bodyTypeGoal, weight_goal);

    // Hydration goal
    const hydrationGoal = goals.water_ml;

    // Supplements based on body type
    const supplements = this.getSupplementRecommendations(bodyTypeGoal, activity_level);

    // Food recommendations
    const { foodsToAvoid, foodsToPrioritize } = this.getFoodRecommendations(bodyTypeGoal, weight_goal);

    this.recommendations = {
      daily_targets: goals,
      meal_timing: mealTiming,
      macro_ratios: macroRatios,
      hydration_goal: hydrationGoal,
      supplements: supplements,
      foods_to_avoid: foodsToAvoid,
      foods_to_prioritize: foodsToPrioritize,
    };

    return this.recommendations;
  }

  // Get current goals
  getGoals(): NutritionGoals | null {
    return this.goals;
  }

  // Get current recommendations
  getRecommendations(): NutritionRecommendations | null {
    return this.recommendations;
  }

  // Calculate progress towards goals
  calculateProgress(
    currentNutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      water_ml: number;
      meals_count: number;
    }
  ) {
    if (!this.goals) return null;

    return {
      calories: {
        current: currentNutrition.calories,
        target: this.goals.calories,
        percentage: Math.round((currentNutrition.calories / this.goals.calories) * 100),
        status: this.getProgressStatus(currentNutrition.calories, this.goals.calories, 'calories'),
      },
      protein: {
        current: currentNutrition.protein_g,
        target: this.goals.protein_g,
        percentage: Math.round((currentNutrition.protein_g / this.goals.protein_g) * 100),
        status: this.getProgressStatus(currentNutrition.protein_g, this.goals.protein_g, 'protein'),
      },
      carbs: {
        current: currentNutrition.carbs_g,
        target: this.goals.carbs_g,
        percentage: Math.round((currentNutrition.carbs_g / this.goals.carbs_g) * 100),
        status: this.getProgressStatus(currentNutrition.carbs_g, this.goals.carbs_g, 'carbs'),
      },
      fat: {
        current: currentNutrition.fat_g,
        target: this.goals.fat_g,
        percentage: Math.round((currentNutrition.fat_g / this.goals.fat_g) * 100),
        status: this.getProgressStatus(currentNutrition.fat_g, this.goals.fat_g, 'fat'),
      },
      water: {
        current: currentNutrition.water_ml,
        target: this.goals.water_ml,
        percentage: Math.round((currentNutrition.water_ml / this.goals.water_ml) * 100),
        status: this.getProgressStatus(currentNutrition.water_ml, this.goals.water_ml, 'water'),
      },
      meals: {
        current: currentNutrition.meals_count,
        target: this.goals.meal_frequency,
        percentage: Math.round((currentNutrition.meals_count / this.goals.meal_frequency) * 100),
        status: this.getProgressStatus(currentNutrition.meals_count, this.goals.meal_frequency, 'meals'),
      },
    };
  }

  // Private helper methods
  private calculateBMR(age: number, gender: string, height_cm: number, weight_kg: number): number {
    if (gender === 'male') {
      return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    }
  }

  private calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2);
  }

  private getBodyTypeMultiplier(bodyTypeGoal: string): number {
    switch (bodyTypeGoal) {
      case 'sleek': return 0.9; // Slight deficit for lean physique
      case 'steady': return 1.0; // Maintenance
      case 'bold': return 1.1; // Slight surplus for muscle building
      default: return 1.0;
    }
  }

  private getProteinPerKg(bodyTypeGoal: string, activityLevel: string): number {
    const baseProtein = {
      sleek: 1.2,
      steady: 1.6,
      bold: 2.0,
    };

    const activityMultiplier = {
      sedentary: 0.8,
      light: 1.0,
      moderate: 1.2,
      active: 1.4,
      very_active: 1.6,
    };

    return (baseProtein[bodyTypeGoal as keyof typeof baseProtein] || 1.6) *
           (activityMultiplier[activityLevel as keyof typeof activityMultiplier] || 1.0);
  }

  private calculateMacroGoals(calories: number, proteinGrams: number, bodyTypeGoal: string): { carbsGoal: number; fatGoal: number } {
    const proteinCalories = proteinGrams * 4;
    const remainingCalories = calories - proteinCalories;

    let carbPercent: number;
    let fatPercent: number;

    switch (bodyTypeGoal) {
      case 'sleek':
        carbPercent = 0.35; // Lower carbs for lean physique
        fatPercent = 0.25;
        break;
      case 'steady':
        carbPercent = 0.45; // Balanced macros
        fatPercent = 0.25;
        break;
      case 'bold':
        carbPercent = 0.50; // Higher carbs for muscle building
        fatPercent = 0.20;
        break;
      default:
        carbPercent = 0.45;
        fatPercent = 0.25;
    }

    const carbsGoal = Math.round((remainingCalories * carbPercent) / 4);
    const fatGoal = Math.round((remainingCalories * fatPercent) / 9);

    return { carbsGoal, fatGoal };
  }

  private getMealFrequency(bodyTypeGoal: string): number {
    switch (bodyTypeGoal) {
      case 'sleek': return 3; // 3 meals, focus on quality
      case 'steady': return 4; // 3 meals + 1 snack
      case 'bold': return 5; // 3 meals + 2 snacks for muscle building
      default: return 4;
    }
  }

  private getMealTimingRecommendations(bodyTypeGoal: string, activityLevel: string) {
    const baseTiming = {
      breakfast: '7:00 AM - 8:00 AM',
      lunch: '12:00 PM - 1:00 PM',
      dinner: '6:00 PM - 7:00 PM',
      snacks: ['10:00 AM', '3:00 PM'],
    };

    if (bodyTypeGoal === 'bold' && activityLevel === 'very_active') {
      return {
        ...baseTiming,
        snacks: ['10:00 AM', '3:00 PM', '9:00 PM'],
      };
    }

    if (bodyTypeGoal === 'sleek') {
      return {
        ...baseTiming,
        snacks: ['3:00 PM'],
      };
    }

    return baseTiming;
  }

  private getMacroRatios(bodyTypeGoal: string, weightGoal: string) {
    switch (bodyTypeGoal) {
      case 'sleek':
        return { protein_percent: 30, carbs_percent: 35, fat_percent: 35 };
      case 'steady':
        return { protein_percent: 25, carbs_percent: 45, fat_percent: 30 };
      case 'bold':
        return { protein_percent: 30, carbs_percent: 50, fat_percent: 20 };
      default:
        return { protein_percent: 25, carbs_percent: 45, fat_percent: 30 };
    }
  }

  private getSupplementRecommendations(bodyTypeGoal: string, activityLevel: string): string[] {
    const baseSupplements = ['Multivitamin', 'Omega-3'];

    if (bodyTypeGoal === 'bold' && activityLevel === 'very_active') {
      return [...baseSupplements, 'Creatine', 'Whey Protein', 'BCAA'];
    }

    if (bodyTypeGoal === 'sleek') {
      return [...baseSupplements, 'Green Tea Extract', 'L-Carnitine'];
    }

    return baseSupplements;
  }

  private getFoodRecommendations(bodyTypeGoal: string, weightGoal: string) {
    const foodsToAvoid = [
      'Processed foods',
      'Sugary drinks',
      'Trans fats',
      'Excessive sodium',
    ];

    const foodsToPrioritize = [
      'Lean proteins',
      'Whole grains',
      'Fresh vegetables',
      'Healthy fats',
    ];

    if (bodyTypeGoal === 'sleek') {
      return {
        foodsToAvoid: [...foodsToAvoid, 'High-calorie snacks', 'Refined carbs'],
        foodsToPrioritize: [...foodsToPrioritize, 'Leafy greens', 'Lean fish', 'Berries'],
      };
    }

    if (bodyTypeGoal === 'bold') {
      return {
        foodsToAvoid: [...foodsToAvoid, 'Empty calories'],
        foodsToPrioritize: [...foodsToPrioritize, 'Complex carbs', 'Red meat', 'Dairy', 'Nuts'],
      };
    }

    return { foodsToAvoid, foodsToPrioritize };
  }

  private getProgressStatus(current: number, target: number, type: string): 'excellent' | 'good' | 'low' | 'high' {
    const percentage = (current / target) * 100;

    if (type === 'calories') {
      if (percentage >= 90 && percentage <= 110) return 'excellent';
      if (percentage >= 80 && percentage <= 120) return 'good';
      if (percentage < 80) return 'low';
      return 'high';
    } else {
      if (percentage >= 90 && percentage <= 110) return 'excellent';
      if (percentage >= 75 && percentage <= 125) return 'good';
      if (percentage < 75) return 'low';
      return 'high';
    }
  }
}

export const nutritionGoalsService = NutritionGoalsService.getInstance();
