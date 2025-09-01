"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Target, Award, Plus, Edit3 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be "8-12" for ranges
  weight: number;
  unit: 'kg' | 'lbs';
  restTime?: number; // seconds
  notes?: string;
}

interface Workout {
  id: string;
  date: string;
  name: string;
  duration: number; // minutes
  exercises: Exercise[];
  notes?: string;
  completed: boolean;
}

interface PersonalRecord {
  exercise: string;
  weight: number;
  unit: 'kg' | 'lbs';
  reps: number;
  date: string;
  improvement: number; // kg/lbs improved from previous PR
}

// Mock data - this would come from your backend
const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    date: '2024-01-15',
    name: 'Upper Body Strength',
    duration: 90,
    completed: true,
    exercises: [
      { id: 'e1', name: 'Bench Press', sets: 4, reps: 8, weight: 80, unit: 'kg' },
      { id: 'e2', name: 'Rows', sets: 4, reps: 10, weight: 70, unit: 'kg' },
      { id: 'e3', name: 'Overhead Press', sets: 3, reps: 8, weight: 50, unit: 'kg' },
      { id: 'e4', name: 'Pull-ups', sets: 3, reps: '8-10', weight: 0, unit: 'kg' }
    ]
  },
  {
    id: 'w2',
    date: '2024-01-13',
    name: 'Lower Body Power',
    duration: 85,
    completed: true,
    exercises: [
      { id: 'e5', name: 'Squats', sets: 4, reps: 6, weight: 100, unit: 'kg' },
      { id: 'e6', name: 'Deadlifts', sets: 3, reps: 5, weight: 120, unit: 'kg' },
      { id: 'e7', name: 'Bulgarian Split Squats', sets: 3, reps: 12, weight: 25, unit: 'kg' },
      { id: 'e8', name: 'Calf Raises', sets: 4, reps: 15, weight: 40, unit: 'kg' }
    ]
  }
];

const mockPersonalRecords: PersonalRecord[] = [
  { exercise: 'Squats', weight: 102.5, unit: 'kg', reps: 6, date: '2024-01-15', improvement: 2.5 },
  { exercise: 'Bench Press', weight: 82.5, unit: 'kg', reps: 8, date: '2024-01-10', improvement: 2.5 },
  { exercise: 'Deadlifts', weight: 125, unit: 'kg', reps: 5, date: '2024-01-08', improvement: 5 }
];

function WorkoutSummaryCard() {
  const thisWeekWorkouts = 4;
  const thisMonthWorkouts = 16;
  const consistency = 85; // percentage
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Workout Summary</h2>
        <Calendar className="h-5 w-5 text-gray-500" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{thisWeekWorkouts}</div>
          <div className="text-sm text-gray-500">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{thisMonthWorkouts}</div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{consistency}%</div>
          <div className="text-sm text-gray-500">Consistency</div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Great consistency! You're on track to hit your monthly goal.
          </span>
        </div>
      </div>
    </Card>
  );
}

function PersonalRecordsCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Personal Records</h2>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
      
      <div className="space-y-3">
        {mockPersonalRecords.map((pr, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{pr.exercise}</div>
              <div className="text-sm text-gray-500">
                {pr.weight}{pr.unit} × {pr.reps} reps
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                +{pr.improvement}{pr.unit}
              </Badge>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(pr.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className="w-full mt-4">
        <Target className="h-4 w-4 mr-2" />
        View All PRs
      </Button>
    </Card>
  );
}

function RecentWorkoutsCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Workouts</h2>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Workout
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockWorkouts.slice(0, 3).map((workout) => (
          <div key={workout.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">{workout.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={workout.completed ? "default" : "secondary"}>
                  {workout.completed ? "Completed" : "In Progress"}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mb-3">
              {new Date(workout.date).toLocaleDateString()} • {workout.duration} minutes
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {workout.exercises.slice(0, 4).map((exercise) => (
                <div key={exercise.id} className="text-sm">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-gray-500 ml-2">
                    {exercise.sets}×{exercise.reps} @ {exercise.weight}{exercise.unit}
                  </span>
                </div>
              ))}
            </div>
            
            {workout.exercises.length > 4 && (
              <div className="text-sm text-gray-500 mt-2">
                +{workout.exercises.length - 4} more exercises
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function WorkoutPlanCard() {
  const currentPlan = {
    name: "Strength Building Program",
    week: 3,
    totalWeeks: 12,
    nextWorkout: "Upper Body Strength",
    scheduledFor: "Tomorrow 5:00 AM"
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Current Plan</h2>
        <Button variant="outline" size="sm">
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Plan
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{currentPlan.name}</h3>
          <div className="text-sm text-gray-500">
            Week {currentPlan.week} of {currentPlan.totalWeeks}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentPlan.week / currentPlan.totalWeeks) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="font-medium text-blue-800 dark:text-blue-200">Next Workout</div>
          <div className="text-sm text-blue-600 dark:text-blue-300">{currentPlan.nextWorkout}</div>
          <div className="text-sm text-blue-500">{currentPlan.scheduledFor}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm">
            View Full Plan
          </Button>
          <Button size="sm">
            Start Workout
          </Button>
        </div>
      </div>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
      
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <Plus className="h-4 w-4 mr-2" />
          Log Today's Workout
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <Edit3 className="h-4 w-4 mr-2" />
          Update Last Workout
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <Target className="h-4 w-4 mr-2" />
          Set New Goals
        </Button>
        
        <Link href="/chat" className="block">
          <Button variant="outline" className="w-full justify-start">
            💬 Chat About Fitness
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function FitnessPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full px-4 py-6 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fitness Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your strength journey and celebrate progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/today">
              <Button variant="outline">
                ← Back to Today
              </Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workout
            </Button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <section className="lg:col-span-2 space-y-6">
            <WorkoutSummaryCard />
            <RecentWorkoutsCard />
          </section>

          {/* Right Column - Sidebar */}
          <aside className="space-y-6">
            <WorkoutPlanCard />
            <PersonalRecordsCard />
            <QuickActionsCard />
          </aside>
        </div>

        {/* AI Insights Section */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">AI Fitness Insights</h3>
              <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                <p>
                  💪 <strong>Strength Progress:</strong> You've increased your squat by 7.5kg over the past month. 
                  Your consistent 5 AM routine is paying off!
                </p>
                <p>
                  ⏰ <strong>Optimal Timing:</strong> Your workout performance peaks between 5-6 AM. 
                  Consider scheduling your heaviest lifts during this window.
                </p>
                <p>
                  🎯 <strong>Next Goal:</strong> Based on your progression, you could hit a 110kg squat within 3 weeks. 
                  Focus on progressive overload and recovery.
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-3 text-purple-600 border-purple-300">
                Get Personalized Plan
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}