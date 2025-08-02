export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
};

export type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'other';
export type Intensity = 'low' | 'moderate' | 'high';
export type Location = 'gym' | 'home' | 'outdoor' | 'other';

export type Workout = {
  id: string;
  name: string;
  type: WorkoutType;
  duration: number; // in minutes
  calories: number;
  date: string;
  location: Location;
  intensity: Intensity;
  exercises: Exercise[];
  notes?: string;
  createdAt: string;
};

export type WorkoutFormData = Omit<Workout, 'id' | 'createdAt' | 'exercises'> & {
  exercises: Array<Omit<Exercise, 'id'>>;
};
