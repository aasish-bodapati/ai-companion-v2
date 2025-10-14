export interface HealthData {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'active' | 'very_active';
}

export interface GoalRecommendation {
  bmi: number;
  bmiCategory: string;
  bodyGoal: string;
  bodyGoalDescription: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  tdee: number;
  bmr: number;
  activityGuidance: string;
  phaseDescription: string;
}

export class GoalRecommendationService {
  /**
   * Calculate BMI
   */
  static calculateBMI(weight: number, height: number): number {
    return weight / ((height / 100) ** 2);
  }

  /**
   * Calculate BMR using Mifflin-St Jeor equation
   * Age and gender affect BMR:
   * - Age: Higher age = lower BMR (metabolism slows with age)
   * - Gender: Males typically have higher BMR due to more lean mass
   */
  static calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    const s = gender === 'male' ? 5 : -161; // Gender constant
    return 10 * weight + 6.25 * height - 5 * age + s; // Age reduces BMR
  }

  /**
   * Calculate TDEE based on activity level
   */
  static calculateTDEE(bmr: number, activityLevel: string): number {
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      active: 1.55,
      very_active: 1.725
    };
    return bmr * (activityFactors[activityLevel as keyof typeof activityFactors] || 1.55);
  }

  /**
   * Get BMI category and interpretation
   */
  static getBMICategory(bmi: number): { category: string; color: string; interpretation: string } {
    if (bmi < 18.5) {
      return {
        category: 'Underweight',
        color: '#3b82f6',
        interpretation: 'muscle & nutrition focus'
      };
    }
    if (bmi < 22) {
      return {
        category: 'Lean',
        color: '#10b981',
        interpretation: 'muscle gain or maintenance'
      };
    }
    if (bmi < 25) {
      return {
        category: 'Healthy',
        color: '#10b981',
        interpretation: 'recomposition (tone up, maintain)'
      };
    }
    if (bmi < 30) {
      return {
        category: 'Overweight',
        color: '#f59e0b',
        interpretation: 'gentle fat balance'
      };
    }
    return {
      category: 'Obese',
      color: '#ef4444',
      interpretation: 'metabolic health focus'
    };
  }

  /**
   * Determine body goal based on BMI
   */
  static getBodyGoal(bmi: number): { goal: string; description: string; phase: string } {
    if (bmi < 18.5) {
      return {
        goal: 'Muscle Gain 💪',
        description: 'Build lean muscle mass and strength',
        phase: 'Muscle Gain Phase'
      };
    }
    if (bmi < 22) {
      return {
        goal: 'Muscle Building / Lean Tone 💪',
        description: 'Build muscle while maintaining lean physique',
        phase: 'Muscle Building Phase'
      };
    }
    if (bmi < 25) {
      return {
        goal: 'Recomposition 🔁',
        description: 'Build muscle while losing fat',
        phase: 'Recomposition Phase'
      };
    }
    if (bmi < 30) {
      return {
        goal: 'Fat Balance ⚡',
        description: 'Lose fat while preserving muscle',
        phase: 'Fat Balance Phase'
      };
    }
    return {
      goal: 'Metabolic Health ⚡',
      description: 'Focus on metabolic health and sustainable fat loss',
      phase: 'Metabolic Health Phase'
    };
  }

  /**
   * Get activity level guidance
   */
  static getActivityGuidance(activityLevel: string): string {
    const guidance = {
      sedentary: 'Start with activation goals - focus on daily movement and light structured workouts',
      light: 'Foundation building - add light training and optimize meal timing',
      active: 'Performance boost - structured training with macro precision',
      very_active: 'Recovery & optimization - fuel properly and avoid under-eating'
    };
    return guidance[activityLevel as keyof typeof guidance] || guidance.active;
  }

  /**
   * Calculate nutrition targets based on body goal
   * Note: TDEE already includes age and gender effects from BMR calculation
   */
  static calculateNutritionTargets(
    tdee: number,
    weight: number,
    bodyGoal: string
  ): { calories: number; protein: number; carbs: number; fats: number } {
    let calorieGoal = tdee;
    let proteinPerKg = 1.8;

    if (bodyGoal.includes('Muscle')) {
      calorieGoal *= 1.1; // +10% for muscle gain
      proteinPerKg = 2.0;
    } else if (bodyGoal.includes('Fat Balance') || bodyGoal.includes('Metabolic')) {
      calorieGoal *= 0.85; // -15% for fat loss
      proteinPerKg = 2.0;
    }

    const proteinGoal = weight * proteinPerKg;
    const carbsGoal = (0.5 * calorieGoal) / 4; // 50% calories from carbs
    const fatsGoal = (0.25 * calorieGoal) / 9; // 25% calories from fats

    return {
      calories: Math.round(calorieGoal),
      protein: Math.round(proteinGoal),
      carbs: Math.round(carbsGoal),
      fats: Math.round(fatsGoal)
    };
  }

  /**
   * Generate complete goal recommendation
   */
  static generateRecommendation(healthData: HealthData): GoalRecommendation {
    const { age, gender, height, weight, activityLevel } = healthData;

    // Calculate metrics
    const bmi = this.calculateBMI(weight, height);
    const bmr = this.calculateBMR(weight, height, age, gender);
    const tdee = this.calculateTDEE(bmr, activityLevel);

    // Get BMI info
    const bmiInfo = this.getBMICategory(bmi);

    // Get body goal
    const bodyGoalInfo = this.getBodyGoal(bmi);

    // Get activity guidance
    const activityGuidance = this.getActivityGuidance(activityLevel);

    // Calculate nutrition targets
    const nutrition = this.calculateNutritionTargets(tdee, weight, bodyGoalInfo.goal);

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmiCategory: bmiInfo.category,
      bodyGoal: bodyGoalInfo.goal,
      bodyGoalDescription: bodyGoalInfo.description,
      calorieGoal: nutrition.calories,
      proteinGoal: nutrition.protein,
      carbsGoal: nutrition.carbs,
      fatsGoal: nutrition.fats,
      tdee: Math.round(tdee),
      bmr: Math.round(bmr),
      activityGuidance,
      phaseDescription: bodyGoalInfo.phase
    };
  }
}
