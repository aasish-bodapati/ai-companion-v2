"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Toast, useToast } from "@/components/Toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { routineService, type RoutineActivity } from '@/services/routineService';

type Counts = {
  hydration: number;
  mood: number;
  journal: number;
};

// Enhanced progress ring with better styling
function ProgressRing({ percent, size = 72, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-indigo-600 dark:text-indigo-400 transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

function CompanionWelcome() {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">N</span>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning!</h1>
        <p className="text-gray-600 dark:text-gray-400">Ready to tackle today's routine?</p>
      </div>
    </div>
  );
}

// Simplified routine display - only show next 3 activities
function TodayRoutine() {
  const [routine, setRoutine] = useState<RoutineActivity[]>([]);
  const [currentTime] = useState(new Date());
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  useEffect(() => {
    const todaysRoutine = routineService.getTodaysRoutine();
    // Only show next 3 upcoming activities
    const upcomingRoutine = todaysRoutine
      .filter(item => item.status === 'upcoming' || item.status === 'in-progress')
      .slice(0, 3);
    setRoutine(upcomingRoutine);
  }, []);

  const handleCompleteActivity = (activityId: string) => {
    routineService.completeActivity(activityId);
    const updatedRoutine = routineService.getTodaysRoutine()
      .filter(item => item.status === 'upcoming' || item.status === 'in-progress')
      .slice(0, 3);
    setRoutine(updatedRoutine);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "upcoming": return "text-gray-600 bg-gray-100 dark:bg-gray-800/50";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-800/50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-progress": return "🔄 Now";
      case "upcoming": return "⏰ Next";
      default: return "⏰ Upcoming";
    }
  };

  if (routine.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Today's Routine</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentTimeStr}
          </div>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>All activities completed for today! 🎉</p>
          <Link href="/routine" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
            View full routine
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Next Up</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentTimeStr}
        </div>
      </div>
      
      <div className="space-y-3">
        {routine.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-lg">{item.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.activity}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.time}
                {item.description && ` • ${item.description}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusText(item.status)}
              </span>
              {item.status === 'upcoming' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                  onClick={() => handleCompleteActivity(item.id)}
                  title="Mark as completed"
                >
                  ✓
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link href="/routine" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          View full routine →
        </Link>
      </div>
    </Card>
  );
}

// Simplified quick actions
function QuickActions() {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/fitness">
          <Button variant="outline" className="w-full h-12">
            💪 Log Workout
          </Button>
        </Link>
        <Link href="/nutrition">
          <Button variant="outline" className="w-full h-12">
            🥗 Track Meal
          </Button>
        </Link>
        <Link href="/mood">
          <Button variant="outline" className="w-full h-12">
            😊 Log Mood
          </Button>
        </Link>
        <Link href="/journal">
          <Button variant="outline" className="w-full h-12">
            📝 Journal
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// Simple daily summary
function DailySummary() {
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const [h, mo, j] = await Promise.all([
          api.get('/trackers/hydration', { from_: from, limit: 100 }),
          api.get('/trackers/mood', { from_: from, limit: 100 }),
          api.get('/trackers/journal', { from_: from, limit: 100 }),
        ]);
        setCounts({ hydration: h.length, mood: mo.length, journal: j.length });
        
        const todayCompletion = routineService.getTodayCompletionRate();
        setCompletionRate(todayCompletion);
      } catch {
        setCounts({ hydration: 0, mood: 0, journal: 0 });
        setCompletionRate(0);
      }
    })();
  }, []);

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Today's Progress</h2>
      <div className="flex items-center justify-center mb-4">
        <ProgressRing percent={completionRate} />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts?.hydration || 0}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Hydration</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{counts?.mood || 0}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Mood</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{counts?.journal || 0}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Journal</div>
        </div>
      </div>
    </Card>
  );
}

export default function TodayPage() {
  const { toast, show, hide } = useToast();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full px-4 py-6 sm:px-6 md:px-8">
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={hide} />
      )}
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <CompanionWelcome />
          <Link
            href="/chat"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200"
          >
            Open Chat
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Routine */}
          <section className="lg:col-span-2">
            <TodayRoutine />
          </section>

          {/* Sidebar - Quick actions and summary */}
          <aside className="space-y-6">
            <QuickActions />
            <DailySummary />
          </aside>
        </div>

        {/* Bottom section - Links to detailed pages */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Need more details? Check out these pages:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/fitness" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
              Fitness Dashboard
            </Link>
            <Link href="/nutrition" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
              Nutrition Tracking
            </Link>
            <Link href="/routine" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
              Full Routine
            </Link>
            <Link href="/profile" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
              Profile & Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
