'use client';

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, Plus, Flame, Zap, Activity, Clock, Calendar, Trash2, Edit, ListChecks, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkoutForm } from '@/components/fitness/workout-form';
import { WorkoutPlan } from '@/components/fitness/workout-plan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Workout, WorkoutType, Intensity, Location } from '@/types/fitness';
// StatCard is defined at the bottom of this file

const workoutCategories = [
  { value: 'cardio' as WorkoutType, label: 'Cardio' },
  { value: 'strength' as WorkoutType, label: 'Strength Training' },
  { value: 'flexibility' as WorkoutType, label: 'Flexibility' },
  { value: 'hiit' as WorkoutType, label: 'HIIT' },
  { value: 'other' as WorkoutType, label: 'Other' },
];



export default function FitnessPage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const [activeTab, setActiveTab] = useState('workout-plan');
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: '1',
      name: 'Morning Run',
      type: 'cardio' as WorkoutType,
      duration: 30,
      calories: 320,
      date: new Date().toISOString(),
      location: 'outdoor' as Location,
      intensity: 'moderate' as Intensity,
      exercises: [
        { id: 'ex-1', name: 'Running', sets: 1, reps: 1, weight: 0, weightUnit: 'kg' }
      ],
      notes: 'Felt great this morning!',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Evening Yoga',
      type: 'flexibility' as WorkoutType,
      duration: 45,
      calories: 180,
      date: new Date(Date.now() - 86400000).toISOString(),
      location: 'home' as Location,
      intensity: 'low' as Intensity,
      exercises: [
        { id: 'ex-2', name: 'Sun Salutations', sets: 5, reps: 1, weight: 0, weightUnit: 'kg' },
        { id: 'ex-3', name: 'Downward Dog', sets: 3, reps: 5, weight: 0, weightUnit: 'kg' }
      ],
      notes: 'Need to work on my balance',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      name: 'HIIT Workout',
      type: 'hiit' as WorkoutType,
      duration: 25,
      calories: 280,
      date: new Date(Date.now() - 172800000).toISOString(),
      location: 'gym',
      intensity: 'high',
      exercises: [
        {
          id: 'ex1',
          name: 'Burpees',
          sets: 3,
          reps: 15,
          weight: 0,
          weightUnit: 'kg'
        },
        {
          id: 'ex2',
          name: 'Mountain Climbers',
          sets: 3,
          reps: 20,
          weight: 0,
          weightUnit: 'kg'
        }
      ],
      notes: 'Intense session!',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };

  const addWorkout = (formData: Omit<Workout, 'id' | 'createdAt'>) => {
    const workoutWithId: Workout = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // Ensure exercises have IDs
      exercises: formData.exercises.map(ex => ({
        ...ex,
        id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    
    setWorkouts(prevWorkouts => [workoutWithId, ...prevWorkouts]);
    setIsFormOpen(false);
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(workout => workout.id !== id));
  };

  // Prepare filtered and grouped workouts
  const getFilteredWorkouts = () => {
    return workouts.filter(workout => {
      const matchesSearch = searchQuery === '' || 
        workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workout.notes && workout.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = activeFilter === 'all' || workout.type === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  };

  const getGroupedWorkouts = () => {
    const filtered = getFilteredWorkouts();
    const grouped = filtered.reduce<Record<string, Workout[]>>((groups, workout) => {
      const date = new Date(workout.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(workout);
      return groups;
    }, {});

    // Sort workouts within each date group by time (newest first)
    Object.values(grouped).forEach(workouts => {
      workouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return grouped;
  };

  // Calculate total duration and calories for the stats
  const totalDuration = workouts.reduce((total, workout) => total + workout.duration, 0);
  const totalCalories = workouts.reduce((total, workout) => total + workout.calories, 0);
  
  // Get filtered and grouped workouts
  const filteredWorkouts = getFilteredWorkouts();
  const workoutsByDate = getGroupedWorkouts();

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Fitness Tracker</h1>
        <p className="text-sm text-gray-400">
          {today} • Track your workouts and stay active
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="workout-plan" className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <ListChecks className="h-4 w-4" />
              Workout Plan
            </TabsTrigger>
            <TabsTrigger value="workout-log" className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Dumbbell className="h-4 w-4" />
              Workout Log
            </TabsTrigger>
          </TabsList>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Log Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Log a New Workout</DialogTitle>
              </DialogHeader>
              <WorkoutForm onSubmit={addWorkout} />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="workout-plan" className="space-y-6">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <WorkoutPlan />
          </div>
        </TabsContent>

        <TabsContent value="workout-log" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="search" className="text-gray-300">Search Workouts</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search by name or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter" className="text-gray-300">Filter by Type</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger id="filter" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="hover:bg-gray-700 focus:bg-gray-700">All Types</SelectItem>
                  {workoutCategories.map((category) => (
                    <SelectItem 
                      key={category.value} 
                      value={category.value}
                      className="hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard 
              title="Total Workouts" 
              value={workouts.length.toString()} 
              description="Workouts logged"
              icon={<Activity className="h-4 w-4 text-gray-400" />}
            />
            <StatCard 
              title="Total Duration" 
              value={`${totalDuration} min`} 
              description="Minutes exercised"
              icon={<Clock className="h-4 w-4 text-gray-400" />}
            />
            <StatCard 
              title="Calories Burned" 
              value={totalCalories.toString()} 
              description="Total calories"
              icon={<Flame className="h-4 w-4 text-gray-400" />}
            />
          </div>

          {filteredWorkouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white">No workouts found</h3>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Start by logging your first workout'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(workoutsByDate).map(([date, dateWorkouts]) => (
                <div key={date} className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-200">{date}</h2>
                  <div className="space-y-4">
                    {dateWorkouts.map((workout) => (
                      <Card key={workout.id} className="relative group bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg text-white">{workout.name}</CardTitle>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Dumbbell className="h-3.5 w-3.5 text-gray-400" />
                                  {workout.type}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  {workout.duration} min
                                </span>
                                {workout.location && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                      {workout.location}
                                    </span>
                                  </>
                                )}
                                {workout.intensity && (
                                  <span 
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 sm:mt-0",
                                      workout.intensity === 'low' ? 'bg-green-900/50 text-green-400' :
                                      workout.intensity === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' :
                                      'bg-red-900/50 text-red-400'
                                    )}
                                  >
                                    {workout.intensity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:bg-gray-800 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-400 hover:bg-red-900/20 hover:text-red-400"
                                onClick={() => deleteWorkout(workout.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {workout.notes && (
                          <CardContent>
                            <p className="text-sm text-gray-400">{workout.notes}</p>
                          </CardContent>
                        )}
                        {workout.exercises && workout.exercises.length > 0 && (
                          <CardContent className="pt-0">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Exercises</h4>
                            <div className="space-y-2">
                              {workout.exercises.map((exercise, index) => (
                                <div key={`${workout.id}-ex-${index}`} className="text-sm pl-2 border-l-2 border-gray-700">
                                  <div className="font-medium text-gray-200">{exercise.name}</div>
                                  <div className="flex items-center space-x-4 text-gray-400">
                                    <span>{exercise.sets} sets × {exercise.reps} reps</span>
                                    {exercise.weight && exercise.weight > 0 && (
                                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                                        {exercise.weight} {exercise.weightUnit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium">{title}</p>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
