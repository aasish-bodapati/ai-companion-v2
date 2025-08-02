'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, Clock, Flame, Plus, X, MapPin, Activity } from 'lucide-react';
import { WorkoutType, Intensity, Location, WorkoutFormData, Workout } from '@/types/fitness';

const workoutCategories = [
  { value: 'cardio' as WorkoutType, label: 'Cardio' },
  { value: 'strength' as WorkoutType, label: 'Strength Training' },
  { value: 'flexibility' as WorkoutType, label: 'Flexibility' },
  { value: 'hiit' as WorkoutType, label: 'HIIT' },
  { value: 'other' as WorkoutType, label: 'Other' },
];

const intensityLevels: { value: Intensity; label: string; color: string }[] = [
  { value: 'low' as Intensity, label: 'Low', color: 'bg-blue-500' },
  { value: 'moderate' as Intensity, label: 'Moderate', color: 'bg-green-500' },
  { value: 'high' as Intensity, label: 'High', color: 'bg-red-500' },
];

const locations: { value: Location; label: string }[] = [
  { value: 'gym' as Location, label: 'Gym' },
  { value: 'home' as Location, label: 'Home' },
  { value: 'outdoor' as Location, label: 'Outdoor' },
  { value: 'other' as Location, label: 'Other' },
];

export function WorkoutForm({ onSubmit }: { onSubmit: (data: Omit<Workout, 'id' | 'createdAt'>) => void }) {
  const [type, setType] = useState<WorkoutType>('cardio');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [location, setLocation] = useState<Location>('gym');
  const [exercises, setExercises] = useState<Array<{ name: string; sets: number; reps: number; weight?: number; weightUnit?: 'kg' | 'lb' }>>([
    { name: '', sets: 3, reps: 10, weight: 0, weightUnit: 'kg' },
  ]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data: Omit<Workout, 'id' | 'createdAt'> = {
      name: formData.get('name') as string,
      type,
      duration: parseInt(formData.get('duration') as string) || 0,
      calories: parseInt(formData.get('calories') as string) || 0,
      notes: formData.get('notes') as string,
      date: new Date().toISOString(),
      location,
      intensity,
      exercises: exercises
        .filter(ex => ex.name.trim() !== '')
        .map(ex => ({
          ...ex,
          id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
    };
    
    onSubmit(data);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, weight: 0, weightUnit: 'kg' }]);
  };

  const removeExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="e.g., Morning Run" 
              required 
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value: WorkoutType) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {workoutCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              <Activity className="inline h-4 w-4 mr-2" />
              Intensity
            </Label>
            <div className="flex space-x-2">
              {intensityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setIntensity(level.value)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    intensity === level.value
                      ? `${level.color} text-white`
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              <MapPin className="inline h-4 w-4 mr-2" />
              Location
            </Label>
            <Select value={location} onValueChange={(value: Location) => setLocation(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">
              <Clock className="inline h-4 w-4 mr-2" />
              Duration (minutes)
            </Label>
            <Input 
              id="duration" 
              name="duration" 
              type="number" 
              min="1" 
              required 
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="calories">
              <Flame className="inline h-4 w-4 mr-2" />
              Calories Burned
            </Label>
            <Input 
              id="calories" 
              name="calories" 
              type="number" 
              min="0" 
              required 
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <Label className="text-base">Exercises</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addExercise}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
          
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeExercise(index)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise Name</Label>
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="e.g., Bench Press"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Weight (optional)</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="flex-1"
                      />
                      <select
                        value={exercise.weightUnit}
                        onChange={(e) => updateExercise(index, 'weightUnit', e.target.value as 'kg' | 'lb')}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Workout Notes</Label>
          <Textarea 
            id="notes" 
            name="notes" 
            placeholder="How did it go? Any specific notes about your workout..." 
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button type="submit" className="min-w-[120px]">
          <Plus className="h-4 w-4 mr-2" />
          Log Workout
        </Button>
      </div>
    </form>
  );
}
