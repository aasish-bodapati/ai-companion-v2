/**
 * Natural Language Workout Intelligence Service
 * Handles "same as last week", "increased squats by 2.5kg" type interactions
 */

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be ranges like "8-12"
  weight: number;
  unit: 'kg' | 'lbs';
  restTime?: number; // seconds
  notes?: string;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  duration: number; // minutes
  exercises: Exercise[];
  notes?: string;
  completed: boolean;
}

export interface WorkoutModification {
  type: 'same' | 'increase' | 'decrease' | 'add' | 'remove' | 'modify';
  exercise?: string;
  property?: 'weight' | 'reps' | 'sets';
  value?: number;
  unit?: 'kg' | 'lbs';
  description: string;
}

class WorkoutIntelligenceService {
  private readonly STORAGE_KEY = 'ai_companion_workouts';

  /**
   * Parse natural language workout input
   */
  parseWorkoutInput(input: string): WorkoutModification[] {
    const modifications: WorkoutModification[] = [];
    const lowerInput = input.toLowerCase().trim();

    // Pattern: "same as last week"
    if (lowerInput.includes('same as last week') || lowerInput.includes('same workout') || lowerInput.includes('repeat last')) {
      modifications.push({
        type: 'same',
        description: 'Repeat last week\'s workout with same weights and reps'
      });
      return modifications;
    }

    // Pattern: "increased [exercise] by [amount][unit]"
    const increasePattern = /increased?\s+(.+?)\s+by\s+(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)?/gi;
    let match;
    while ((match = increasePattern.exec(lowerInput)) !== null) {
      const exerciseName = match[1].trim();
      const amount = parseFloat(match[2]);
      const unit = this.normalizeUnit(match[3]);
      
      modifications.push({
        type: 'increase',
        exercise: exerciseName,
        property: 'weight',
        value: amount,
        unit: unit,
        description: `Increase ${exerciseName} weight by ${amount}${unit}`
      });
    }

    // Pattern: "decreased [exercise] by [amount][unit]" or "lighter [exercise]"
    const decreasePattern = /(?:decreased?|lighter|reduced?)\s+(.+?)(?:\s+by\s+(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?))?/gi;
    while ((match = decreasePattern.exec(lowerInput)) !== null) {
      const exerciseName = match[1].trim();
      const amount = match[2] ? parseFloat(match[2]) : 2.5; // Default decrease
      const unit = this.normalizeUnit(match[3] || 'kg');
      
      modifications.push({
        type: 'decrease',
        exercise: exerciseName,
        property: 'weight',
        value: amount,
        unit: unit,
        description: `Decrease ${exerciseName} weight by ${amount}${unit}`
      });
    }

    // Pattern: "[exercise] [amount][unit]" (direct weight specification)
    const directWeightPattern = /(?:^|\s)([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)(?:\s|$)/gi;
    while ((match = directWeightPattern.exec(lowerInput)) !== null) {
      const exerciseName = match[1].trim();
      const weight = parseFloat(match[2]);
      const unit = this.normalizeUnit(match[3]);
      
      // Skip if this looks like a generic number (too short exercise name)
      if (exerciseName.length < 3) continue;
      
      modifications.push({
        type: 'modify',
        exercise: exerciseName,
        property: 'weight',
        value: weight,
        unit: unit,
        description: `Set ${exerciseName} weight to ${weight}${unit}`
      });
    }

    // Pattern: "added [exercise]" or "new [exercise]"
    const addPattern = /(?:added?|new)\s+(.+?)(?:\s|$)/gi;
    while ((match = addPattern.exec(lowerInput)) !== null) {
      const exerciseName = match[1].trim();
      
      modifications.push({
        type: 'add',
        exercise: exerciseName,
        description: `Add new exercise: ${exerciseName}`
      });
    }

    // Pattern: "skipped [exercise]" or "removed [exercise]"
    const removePattern = /(?:skipped?|removed?|dropped?)\s+(.+?)(?:\s|$)/gi;
    while ((match = removePattern.exec(lowerInput)) !== null) {
      const exerciseName = match[1].trim();
      
      modifications.push({
        type: 'remove',
        exercise: exerciseName,
        description: `Remove exercise: ${exerciseName}`
      });
    }

    return modifications;
  }

  /**
   * Apply workout modifications to create new workout
   */
  applyWorkoutModifications(lastWorkout: Workout, modifications: WorkoutModification[]): Workout {
    let newWorkout: Workout = {
      ...lastWorkout,
      id: this.generateWorkoutId(),
      date: new Date().toISOString().split('T')[0],
      exercises: [...lastWorkout.exercises.map(ex => ({ ...ex, id: this.generateExerciseId() }))],
      completed: false,
      notes: this.generateModificationNotes(modifications)
    };

    for (const mod of modifications) {
      switch (mod.type) {
        case 'same':
          // No changes needed, workout is already copied
          break;

        case 'increase':
        case 'decrease':
        case 'modify':
          if (mod.exercise && mod.property && mod.value) {
            newWorkout = this.modifyExercise(newWorkout, mod.exercise, mod.property, mod.value, mod.type);
          }
          break;

        case 'add':
          if (mod.exercise) {
            newWorkout = this.addExercise(newWorkout, mod.exercise);
          }
          break;

        case 'remove':
          if (mod.exercise) {
            newWorkout = this.removeExercise(newWorkout, mod.exercise);
          }
          break;
      }
    }

    return newWorkout;
  }

  /**
   * Get the most recent workout
   */
  getLastWorkout(): Workout | null {
    const workouts = this.getSavedWorkouts();
    if (workouts.length === 0) return null;
    
    // Sort by date and return most recent
    const sortedWorkouts = workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedWorkouts[0];
  }

  /**
   * Save a new workout
   */
  saveWorkout(workout: Workout): void {
    const workouts = this.getSavedWorkouts();
    workouts.push(workout);
    
    // Keep only last 50 workouts
    const trimmedWorkouts = workouts.slice(-50);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedWorkouts));
    }
  }

  /**
   * Process natural language workout and return new workout
   */
  processWorkoutInput(input: string): { workout: Workout | null; modifications: WorkoutModification[]; success: boolean; message: string } {
    const lastWorkout = this.getLastWorkout();
    
    if (!lastWorkout) {
      return {
        workout: null,
        modifications: [],
        success: false,
        message: "No previous workout found. Please create your first workout manually."
      };
    }

    const modifications = this.parseWorkoutInput(input);
    
    if (modifications.length === 0) {
      return {
        workout: null,
        modifications: [],
        success: false,
        message: "I couldn't understand the workout modifications. Try phrases like 'same as last week' or 'increased squats by 2.5kg'."
      };
    }

    const newWorkout = this.applyWorkoutModifications(lastWorkout, modifications);
    
    return {
      workout: newWorkout,
      modifications,
      success: true,
      message: `Created new workout based on: ${modifications.map(m => m.description).join(', ')}`
    };
  }

  private normalizeUnit(unit?: string): 'kg' | 'lbs' {
    if (!unit) return 'kg';
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound')) return 'lbs';
    return 'kg';
  }

  private modifyExercise(workout: Workout, exerciseName: string, property: string, value: number, type: string): Workout {
    const exerciseIndex = workout.exercises.findIndex(ex => 
      ex.name.toLowerCase().includes(exerciseName.toLowerCase()) || 
      exerciseName.toLowerCase().includes(ex.name.toLowerCase())
    );

    if (exerciseIndex === -1) return workout;

    const exercise = { ...workout.exercises[exerciseIndex] };
    
    if (property === 'weight') {
      if (type === 'increase') {
        exercise.weight += value;
      } else if (type === 'decrease') {
        exercise.weight = Math.max(0, exercise.weight - value);
      } else if (type === 'modify') {
        exercise.weight = value;
      }
    }

    const newExercises = [...workout.exercises];
    newExercises[exerciseIndex] = exercise;

    return { ...workout, exercises: newExercises };
  }

  private addExercise(workout: Workout, exerciseName: string): Workout {
    const newExercise: Exercise = {
      id: this.generateExerciseId(),
      name: exerciseName,
      sets: 3,
      reps: 8,
      weight: 20, // Default starting weight
      unit: 'kg',
      notes: 'New exercise - adjust weight as needed'
    };

    return {
      ...workout,
      exercises: [...workout.exercises, newExercise]
    };
  }

  private removeExercise(workout: Workout, exerciseName: string): Workout {
    const filteredExercises = workout.exercises.filter(ex => 
      !ex.name.toLowerCase().includes(exerciseName.toLowerCase()) &&
      !exerciseName.toLowerCase().includes(ex.name.toLowerCase())
    );

    return { ...workout, exercises: filteredExercises };
  }

  private generateModificationNotes(modifications: WorkoutModification[]): string {
    return `Auto-generated from: ${modifications.map(m => m.description).join(', ')}`;
  }

  private generateWorkoutId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExerciseId(): string {
    return `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSavedWorkouts(): Workout[] {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Get workout suggestions based on history
   */
  getWorkoutSuggestions(): string[] {
    const lastWorkout = this.getLastWorkout();
    if (!lastWorkout) {
      return [
        "Create your first workout by describing your exercises",
        "Try: 'Bench press 80kg, Squats 100kg, Rows 70kg'",
        "Or: 'Upper body workout with push-ups and pull-ups'"
      ];
    }

    const daysSinceLastWorkout = Math.floor(
      (new Date().getTime() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const suggestions = [
      "Say 'same as last week' to repeat your last workout",
      "Try 'increased squats by 2.5kg' to add weight",
      "Say 'lighter bench press' to reduce weight",
      "Add new exercises: 'added pull-ups'"
    ];

    if (daysSinceLastWorkout >= 7) {
      suggestions.unshift("It's been a week! Ready to increase your weights?");
    } else if (daysSinceLastWorkout >= 3) {
      suggestions.unshift("Great consistency! Consider progressive overload.");
    }

    return suggestions;
  }
}

export const workoutIntelligenceService = new WorkoutIntelligenceService();
