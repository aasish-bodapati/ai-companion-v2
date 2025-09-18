'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  activity_type: string;
  sets: number;
  reps: number;
  weight_kg: number;
  notes?: string;
}

interface SimpleWorkoutLoggerProps {
  onWorkoutLogged?: (workout: any) => void;
}

const ACTIVITY_TYPES = [
  'weightlifting', 'cardio', 'running', 'walking', 'cycling', 'swimming', 
  'yoga', 'pilates', 'hiit', 'dancing', 'sports', 'stretching', 'other'
];

export function SimpleWorkoutLogger({ onWorkoutLogged }: SimpleWorkoutLoggerProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      activity_type: 'weightlifting',
      sets: 3,
      reps: 10,
      weight_kg: 0,
      notes: ''
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const logWorkout = async () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    try {
      setLoading(true);
      
      // Log each exercise as a separate fitness log entry
      const promises = exercises.map(exercise => {
        const now = new Date();
        const logData = {
          activity_type: exercise.activity_type,
          activity_name: exercise.name,
          duration_minutes: 30, // Default duration
          intensity: exercise.weight_kg > 0 ? 'high' : 'medium',
          calories_burned: 200, // Default calories
          weight_kg: exercise.weight_kg || undefined,
          reps: exercise.reps || undefined,
          sets: exercise.sets || undefined,
          notes: exercise.notes || undefined,
          activity_date: now.toISOString(), // Use current time
          timezone_offset: now.getTimezoneOffset() // Send timezone offset in minutes
        };
        return api.post('/health/logging/fitness', logData);
      });

      await Promise.all(promises);
      
      toast.success(`Workout "${workoutName}" logged! ${exercises.length} exercises added.`);
      onWorkoutLogged?.({ name: workoutName, exercises });
      
      // Reset form
      setWorkoutName('');
      setExercises([]);
      setWorkoutNotes('');
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast.error('Failed to log workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-orange-600" />
          Log Detailed Workout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workout Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workoutName">Workout Name</Label>
            <Input
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Push Day - Chest & Shoulders"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addExercise} className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="workoutNotes">Workout Notes (Optional)</Label>
          <Textarea
            id="workoutNotes"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="e.g., Felt strong today, focused on form..."
            rows={2}
          />
        </div>

        {/* Exercises */}
        {exercises.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises ({exercises.length})</h3>
            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-100 px-2 py-1 rounded text-sm font-medium">
                        {index + 1}
                      </span>
                      {exercise.name || `Exercise ${index + 1}`}
                    </h4>
                    <Button
                      onClick={() => removeExercise(exercise.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Exercise Name</Label>
                      <Input
                        value={exercise.name}
                        onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                        placeholder="e.g., Bench Press"
                      />
                    </div>
                    <div>
                      <Label>Activity Type</Label>
                      <Select
                        value={exercise.activity_type}
                        onValueChange={(value) => updateExercise(exercise.id, 'activity_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        value={exercise.sets || ''}
                        onChange={(e) => updateExercise(exercise.id, 'sets', Number(e.target.value))}
                        placeholder="e.g. 3"
                        min="1"
                        max="20"
                        className="placeholder:text-gray-400 placeholder:italic"
                      />
                    </div>
                    <div>
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        value={exercise.reps || ''}
                        onChange={(e) => updateExercise(exercise.id, 'reps', Number(e.target.value))}
                        placeholder="e.g. 12"
                        min="1"
                        max="100"
                        className="placeholder:text-gray-400 placeholder:italic"
                      />
                    </div>
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        value={exercise.weight_kg || ''}
                        onChange={(e) => updateExercise(exercise.id, 'weight_kg', Number(e.target.value))}
                        placeholder="e.g. 20.5"
                        min="0"
                        step="0.5"
                        className="placeholder:text-gray-400 placeholder:italic"
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={exercise.notes || ''}
                        onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                        placeholder="Form cues..."
                        className="placeholder:text-gray-400 placeholder:italic"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={logWorkout}
            disabled={loading || !workoutName.trim() || exercises.length === 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Logging...' : 'Log Workout'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

