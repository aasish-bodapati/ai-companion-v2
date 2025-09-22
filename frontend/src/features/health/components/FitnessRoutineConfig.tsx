'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoutineBuilderConfig } from './GenericRoutineBuilder';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';

// Fitness-specific interfaces
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  weight_unit?: 'lbs' | 'kg';
  notes?: string;
}

interface Workout {
  id: string;
  activity_name: string;
  activity_type: string;
  sets: number;
  reps: string;
  weight?: number;
  weight_unit?: 'lbs' | 'kg';
  notes?: string;
  exercises: Exercise[];
}

export const fitnessRoutineConfig: RoutineBuilderConfig<Workout, Exercise> = {
  routineType: 'fitness',
  itemType: 'workouts',
  subItemType: 'exercises',
  itemTypeOptions: ['strength', 'cardio', 'flexibility', 'endurance'],
  defaultItemName: 'New Workout',
  defaultSubItemName: 'New Exercise',
  
  createRoutine: async (data) => {
    return await simpleRoutineApi.createRoutineWithWorkoutPlan(data.routine_data, data.workout_days);
  },
  
  createItem: (activityType: string): Workout => ({
    id: `workout-${Date.now()}`,
    activity_name: 'New Workout',
    activity_type: activityType,
    sets: 3,
    reps: '10',
    exercises: []
  }),
  
  createSubItem: (): Exercise => ({
    id: `exercise-${Date.now()}`,
    name: 'New Exercise',
    sets: 3,
    reps: '10'
  }),
  
  updateItem: (item: Workout, updates: Partial<Workout>): Workout => ({
    ...item,
    ...updates
  }),
  
  updateSubItem: (subItem: Exercise, updates: Partial<Exercise>): Exercise => ({
    ...subItem,
    ...updates
  }),
  
  validateItem: (item: Workout): boolean => {
    return !!(item.activity_name && item.activity_type);
  },
  
  validateSubItem: (subItem: Exercise): boolean => {
    return !!(subItem.name && subItem.sets && subItem.reps);
  },
  
  renderItemForm: (item: Workout, onUpdate: (updates: Partial<Workout>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
      <div>
        <Label className="text-xs">Workout Name</Label>
        <Input
          value={item.activity_name}
          onChange={(e) => onUpdate({ activity_name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">Type</Label>
        <Select 
          value={item.activity_type} 
          onValueChange={(value: string) => onUpdate({ activity_type: value })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
            <SelectItem value="endurance">Endurance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Sets</Label>
        <Input
          type="number"
          value={item.sets}
          onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  ),
  
  renderSubItemForm: (subItem: Exercise, onUpdate: (updates: Partial<Exercise>) => void) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
      <div>
        <Label className="text-xs">Exercise Name</Label>
        <Input
          value={subItem.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Sets</Label>
        <Input
          type="number"
          value={subItem.sets}
          onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Reps</Label>
        <Input
          value={subItem.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Weight (lbs)</Label>
        <Input
          type="number"
          value={subItem.weight || 0}
          onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
          className="h-6 text-xs"
        />
      </div>
    </div>
  )
};
