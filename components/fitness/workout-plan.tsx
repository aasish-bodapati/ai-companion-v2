'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { Save, Edit2, Check } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight?: string;
  day: string;
}

type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  textFormat: string;
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const COMMON_EXERCISES = [
  { name: 'Push-ups', sets: '3', reps: '12' },
  { name: 'Squats', sets: '3', reps: '12' },
  { name: 'Lunges', sets: '3', reps: '10 each leg' },
  { name: 'Plank', sets: '3', reps: '30s' },
  { name: 'Sit-ups', sets: '3', reps: '15' },
  { name: 'Burpees', sets: '3', reps: '10' },
  { name: 'Pull-ups', sets: '3', reps: '8' },
  { name: 'Dips', sets: '3', reps: '10' },
  { name: 'Mountain Climbers', sets: '3', reps: '20' },
  { name: 'Jumping Jacks', sets: '3', reps: '30s' },
];

const BODY_PARTS = [
  'Full Body', 'Upper Body', 'Lower Body', 'Core', 'Chest', 'Back', 'Arms', 'Legs', 'Shoulders'
];

// Helper function to convert exercises to text format
export const exercisesToText = (exercises: Exercise[]): string => {
  const exercisesByDay: { [key: string]: Exercise[] } = {};
  
  // Group exercises by day
  exercises.forEach(exercise => {
    if (!exercisesByDay[exercise.day]) {
      exercisesByDay[exercise.day] = [];
    }
    exercisesByDay[exercise.day].push(exercise);
  });
  
  // Convert to text format
  let text = '';
  Object.entries(exercisesByDay).forEach(([day, dayExercises]) => {
    text += `## ${day}\n\n`;
    dayExercises.forEach(ex => {
      const weight = ex.weight ? ` ${ex.weight}kg` : '';
      text += `- ${ex.name} (${ex.sets}x${ex.reps}${weight})\n`;
    });
    text += '\n';
  });
  
  return text.trim();
};

// Helper function to parse text back to exercises
export const textToExercises = (text: string): Exercise[] => {
  const exercises: Exercise[] = [];
  let currentDay = '';
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    const dayMatch = line.match(/^##\s+(.+)$/);
    if (dayMatch) {
      currentDay = dayMatch[1].trim();
      continue;
    }
    
    if (!currentDay) continue;
    
    const exerciseMatch = line.match(/^-\s*(.+?)\s*\(?(\d+)x(\d+)(?:\s*([\d.]+)kg)?\)?/i);
    if (exerciseMatch) {
      const name = exerciseMatch[1].trim();
      const sets = exerciseMatch[2];
      const reps = exerciseMatch[3];
      const weight = exerciseMatch[4];
      
      exercises.push({
        id: Math.random().toString(36).substr(2, 9),
        name,
        sets,
        reps,
        weight,
        day: currentDay
      });
    }
  }
  

  return exercises;
};

export function WorkoutPlan() {
  const [isEditing, setIsEditing] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan>({
    id: '1',
    name: 'My Workout Plan',
    description: 'Weekly workout routine',
    exercises: [
      { id: '1', name: 'Push-ups', sets: '3', reps: '15', day: 'Monday' },
      { id: '2', name: 'Squats', sets: '3', reps: '12', day: 'Monday' },
      { id: '3', name: 'Plank', sets: '3', reps: '30s', day: 'Tuesday' },
    ],
    textFormat: ''
  });
  
  const [textFormat, setTextFormat] = useState('');
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id'>>({
    name: '',
    sets: '3',
    reps: '12',
    weight: '',
    day: 'Monday'
  });
  const [filter, setFilter] = useState('All');
  
  // Initialize text format from exercises
  useEffect(() => {
    if (!plan.textFormat && plan.exercises.length > 0) {
      const initialText = exercisesToText(plan.exercises);
      setTextFormat(initialText);
      setPlan(prev => ({ ...prev, textFormat: initialText }));
    }
  }, [plan.exercises, plan.textFormat]);

  // Add a new exercise
  const addExercise = (exercise: Omit<Exercise, 'id'>) => {
    const newEx = {
      ...exercise,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    setPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, newEx]
    }));
    
    // Update the text format
    const updatedExercises = [...plan.exercises, newEx];
    const updatedTextFormat = exercisesToText(updatedExercises);
    setTextFormat(updatedTextFormat);
    
    // Reset form
    setNewExercise({
      name: '',
      sets: '3',
      reps: '12',
      day: selectedDay
    });
    setShowExerciseForm(false);
  };

  // Remove an exercise
  const removeExercise = (id: string) => {
    const updatedExercises = plan.exercises.filter(ex => ex.id !== id);
    setPlan(prev => ({
      ...prev,
      exercises: updatedExercises
    }));
    setTextFormat(exercisesToText(updatedExercises));
  };

  // Get exercises for a specific day
  const getExercisesForDay = (day: string) => {
    return plan.exercises
      .filter(ex => ex.day === day)
      .map(ex => `- ${ex.name} (${ex.sets} x ${ex.reps})`)
      .join('\n');
  };

  // Add a common exercise
  const addCommonExercise = (exercise: typeof COMMON_EXERCISES[0]) => {
    addExercise({
      ...exercise,
      day: selectedDay,
      weight: '' // Initialize weight as empty for common exercises
    });
  };

  // Filter common exercises by body part
  const filteredExercises = filter === 'All' 
    ? COMMON_EXERCISES 
    : COMMON_EXERCISES.filter(ex => 
        ex.name.toLowerCase().includes(filter.toLowerCase())
      );

  // Save the plan
  const savePlan = () => {
    try {
      // The exercises are already updated in state via updateExercisesForDay
      // Just need to update the text format
      const updatedPlan = {
        ...plan,
        textFormat: exercisesToText(plan.exercises)
      };
      
      console.log('Saving plan:', updatedPlan);
      setPlan(updatedPlan);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };
  
  // Update the preview when text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextFormat(newText);
  };
  
  // Handle canceling edit mode
  const handleCancel = () => {
    // Revert to the last saved state
    setTextFormat(plan.textFormat);
    setIsEditing(false);
  };

  // Group exercises by day for display
  const exercisesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = plan.exercises.filter(ex => ex.day === day);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Check if a day has exercises
  const hasExercises = (day: string) => {
    return exercisesByDay[day] && exercisesByDay[day].length > 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
          ) : (
            <div className="space-x-2">
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={savePlan} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Plan
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <input
                id="plan-name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={plan.name}
                onChange={(e) => setPlan({...plan, name: e.target.value})}
                placeholder="E.g., 4-Week Strength Program"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea 
                id="plan-description"
                value={plan.description} 
                onChange={(e) => setPlan({...plan, description: e.target.value})} 
                placeholder="Describe your workout plan"
                rows={2}
              />
            </div>
          </div>
        )}
        
        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Exercises</h3>
            {isEditing && (
              <div className="text-sm text-muted-foreground">
                One exercise per line. Format: <code className="bg-muted px-1.5 py-0.5 rounded">- Exercise Name (sets x reps)</code>
              </div>
            )}
          </div>
          
          {isEditing ? (
          <div className="space-y-6">
            {/* Day Selector */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDay === day
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {day.slice(0, 3)}
                  {hasExercises(day) && (
                    <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-xs">
                      {exercisesByDay[day].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Day Exercises */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{selectedDay}'s Workout</h3>
                <Button 
                  onClick={() => setShowExerciseForm(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              </div>

              {/* Exercise List */}
              {hasExercises(selectedDay) ? (
                <div className="space-y-2">
                  {exercisesByDay[selectedDay].map((exercise) => (
                    <div 
                      key={exercise.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} × {exercise.reps}{exercise.weight ? ` (${exercise.weight}kg)` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">No exercises added for {selectedDay}</p>
                  <Button onClick={() => setShowExerciseForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Exercise
                  </Button>
                </div>
              )}

              {/* Common Exercises */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Common Exercises</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Filter:</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-background border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="All">All</option>
                      {BODY_PARTS.map(part => (
                        <option key={part} value={part}>{part}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredExercises.map((exercise, i) => (
                    <button
                      key={i}
                      onClick={() => addCommonExercise(exercise)}
                      className="p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets} × {exercise.reps}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add Exercise Form */}
            {showExerciseForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add Exercise</h3>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowExerciseForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="exercise-name">Exercise Name</Label>
                      <input
                        id="exercise-name"
                        type="text"
                        className="w-full p-2 border rounded mt-1"
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                        placeholder="e.g., Push-ups"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="sets">Sets</Label>
                        <input
                          id="sets"
                          type="text"
                          className="w-full p-2 border rounded mt-1"
                          value={newExercise.sets}
                          onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                          placeholder="3"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reps">Reps/Time</Label>
                        <input
                          id="reps"
                          type="text"
                          className="w-full p-2 border rounded mt-1"
                          value={newExercise.reps}
                          onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                          placeholder="12 or 30s"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <input
                          id="weight"
                          type="number"
                          className="w-full p-2 border rounded mt-1"
                          value={newExercise.weight || ''}
                          onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})}
                          placeholder="e.g., 20"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Day</Label>
                      <select
                        className="w-full p-2 border rounded mt-1"
                        value={newExercise.day}
                        onChange={(e) => setNewExercise({...newExercise, day: e.target.value})}
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExerciseForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => addExercise(newExercise)}
                        disabled={!newExercise.name}
                      >
                        Add Exercise
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div className="space-y-6">
              {plan.exercises.length > 0 ? (
                Object.entries(exercisesByDay).map(([day, dayExercises]) => (
                  <div key={day} className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-3">{day}</h4>
                    <ul className="space-y-2">
                      {(dayExercises as Exercise[]).map((exercise, index) => (
                        <li key={`${day}-${index}`} className="flex items-center p-2 hover:bg-muted/30 rounded-md">
                          <div className="flex-1">
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">{exercise.sets} sets × {exercise.reps}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No exercises added to this plan yet.</p>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Add Exercises
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
