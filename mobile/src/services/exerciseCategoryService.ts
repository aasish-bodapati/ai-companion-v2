import { fitnessService } from './fitnessService';

export interface ExerciseCategory {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string;
}

class ExerciseCategoryService {
  private categories: ExerciseCategory[] = [];
  private loaded = false;

  async getCategories(): Promise<ExerciseCategory[]> {
    if (!this.loaded) {
      await this.loadCategories();
    }
    return this.categories;
  }

  async getCategoryById(id: string): Promise<ExerciseCategory | null> {
    if (!this.loaded) {
      await this.loadCategories();
    }
    return this.categories.find(cat => cat.id === id) || null;
  }

  // Helper method to check if a category exists in exercises
  async categoryExists(categoryId: string): Promise<boolean> {
    if (!this.loaded) {
      await this.loadCategories();
    }
    return this.categories.some(cat => cat.id === categoryId);
  }

  getCategoryNotFound(): ExerciseCategory {
    return {
      id: 'unknown',
      name: 'Category Not Found',
      display_name: 'Category Not Found',
      color: '#6b7280',
      icon: 'help-outline',
    };
  }

  private async loadCategories(): Promise<void> {
    try {
      // Get all exercises to extract unique categories
      const response = await fitnessService.getExerciseTypes();
      
      // Extract unique categories from exercises using logging_category_info
      const categoryMap = new Map();
      response.forEach(exercise => {
        // Use logging_category_info if available, otherwise fallback to manual mapping
        if (exercise.logging_category_info) {
          const category = exercise.logging_category_info;
          if (!categoryMap.has(category.id)) {
            categoryMap.set(category.id, {
              id: category.id,
              name: category.name,
              display_name: category.display_name,
              color: category.color || this.getCategoryColor(category.id),
              icon: category.icon || this.getCategoryIcon(category.id),
            });
          }
        } else {
          // Fallback to manual mapping for exercises without logging_category_info
          const category = exercise.logging_category || exercise.category;
          if (category && !categoryMap.has(category)) {
            categoryMap.set(category, {
              id: category,
              name: category,
              display_name: this.getDisplayName(category),
              color: this.getCategoryColor(category),
              icon: this.getCategoryIcon(category),
            });
          }
        }
      });
      
      this.categories = Array.from(categoryMap.values());
      this.loaded = true;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Fallback to empty array if API fails
      this.categories = [];
      this.loaded = true;
    }
  }

  private getDisplayName(category: string): string {
    const displayNames: { [key: string]: string } = {
      'bodyweight': 'Bodyweight',
      'weighted': 'Weighted',
      'cardio_duration': 'Cardio & Duration',
      'distance_based': 'Distance-Based',
    };
    return displayNames[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'bodyweight': '#3b82f6',
      'weighted': '#ef4444',
      'cardio_duration': '#10b981',
      'distance_based': '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  }

  private getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'bodyweight': 'person-outline',
      'weighted': 'barbell-outline',
      'cardio_duration': 'heart-outline',
      'distance_based': 'walk-outline',
    };
    return icons[category] || 'fitness-outline';
  }

  // Helper method to get category config for UI
  async getCategoryConfig(categoryId: string): Promise<ExerciseCategory> {
    const category = await this.getCategoryById(categoryId);
    return category || this.getCategoryNotFound();
  }
}

export const exerciseCategoryService = new ExerciseCategoryService();
