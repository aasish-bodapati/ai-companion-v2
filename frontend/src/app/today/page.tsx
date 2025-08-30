"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Toast, useToast } from "@/components/Toast";
import { Card } from "@/components/ui/card";
import { memoryContextService, type MemoryContextData } from '@/services/memoryContextService';
import SmartNotifications from '@/components/notifications/SmartNotifications';
import ProgressInsights from '@/components/progress/ProgressInsights';

type Counts = {
  hydration: number;
  mood: number;
  journal: number;
};

// Enhanced progress ring with better styling
function ProgressRing({ percent, size = 72, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * radius;
  const dash = (p / 100) * c;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle 
        cx={size/2} 
        cy={size/2} 
        r={radius} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700" 
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        className="text-emerald-500 transition-all duration-500 ease-out"
      />
      <text 
        x={size/2} 
        y={size/2 + 4} 
        textAnchor="middle" 
        className="fill-gray-800 dark:fill-gray-200 text-sm font-semibold transform rotate-90"
      >
        {p}%
      </text>
    </svg>
  );
}

// Time-aware greeting component
function TimeAwareGreeting() {
  const [greeting, setGreeting] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning! Ready to crush your day?");
        setTimeOfDay("morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon! How's your day going?");
        setTimeOfDay("afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good evening! Time to wind down and reflect.");
        setTimeOfDay("evening");
      } else {
        setGreeting("Late night! Don't forget to get some rest.");
        setTimeOfDay("night");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case "morning": return "🌅";
      case "afternoon": return "☀️";
      case "evening": return "🌆";
      case "night": return "🌙";
      default: return "🤝";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${
        timeOfDay === "morning" ? "bg-yellow-100 text-yellow-700" :
        timeOfDay === "afternoon" ? "bg-orange-100 text-orange-700" :
        timeOfDay === "evening" ? "bg-purple-100 text-purple-700" :
        "bg-blue-100 text-blue-700"
      }`}>
        {getTimeIcon()}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your life improvement companion</p>
      </div>
    </div>
  );
}

// Personalized routine display
function PersonalizedRoutine() {
  const [currentTime] = useState(new Date());
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  // Example routine based on the 9-5 workflow document
  const routine = [
    { time: "04:30", activity: "Wake up", icon: "🌅", status: "completed" },
    { time: "05:00", activity: "Workout (Monday-Saturday)", icon: "💪", status: "in-progress" },
    { time: "07:00", activity: "Back home", icon: "🏠", status: "upcoming" },
    { time: "08:00", activity: "Breakfast", icon: "🥗", status: "upcoming" },
    { time: "09:30", activity: "Leave for work", icon: "🚗", status: "upcoming" },
    { time: "10:30", activity: "Reach office", icon: "🏢", status: "upcoming" },
    { time: "12:00", activity: "Snack: 1 carrot", icon: "🥕", status: "upcoming" },
    { time: "14:00", activity: "Lunch", icon: "🍽️", status: "upcoming" },
    { time: "16:00", activity: "Fruit salad", icon: "🍎", status: "upcoming" },
    { time: "18:30", activity: "Leave work", icon: "🚗", status: "upcoming" },
    { time: "19:30", activity: "Reach home", icon: "🏠", status: "upcoming" },
    { time: "20:00", activity: "Dinner", icon: "🍽️", status: "upcoming" },
    { time: "20:30", activity: "Work on app, short walk", icon: "💻", status: "upcoming" },
    { time: "21:30", activity: "Bedtime", icon: "😴", status: "upcoming" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "in-progress": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "upcoming": return "text-gray-600 bg-gray-100 dark:bg-gray-800/50";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-800/50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "✓ Done";
      case "in-progress": return "🔄 Now";
      case "upcoming": return "⏰ Upcoming";
      default: return "⏰ Upcoming";
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Today's Routine</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Current time: {currentTimeStr}
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {routine.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="text-lg">{item.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.activity}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.time}</div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Your energy peaks 5-7 AM. Perfect timing for your workout!
        </div>
      </div>
    </Card>
  );
}

// Smart suggestions component
function SmartSuggestions() {
  const suggestions = [
    {
      type: "workout",
      title: "Workout Progress",
      description: "You've been consistent with your 5:00 AM routine. Ready to increase weights?",
      action: "Review progress",
      icon: "💪",
      priority: "high"
    },
    {
      type: "nutrition",
      title: "Protein Goal",
      description: "You're at 120g protein today. Need 30g more to hit your 150g target.",
      action: "Log dinner",
      icon: "🥗",
      priority: "medium"
    },
    {
      type: "schedule",
      title: "Evening Planning",
      description: "You have 2 hours before bedtime. Perfect for app development and your walk.",
      action: "Plan evening",
      icon: "📅",
      priority: "low"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "medium": return "border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "low": return "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20";
      default: return "border-l-4 border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Smart Suggestions</h2>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className={`p-3 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
            <div className="flex items-start gap-3">
              <div className="text-xl">{suggestion.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{suggestion.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2 hover:underline">
                  {suggestion.action} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function TodayPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [habits, setHabits] = useState<{ id: string; label: string; done: boolean }[]>([]);
  const [streakDays] = useState<number>(7); // Example streak
  const { toast, show, hide } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const now = new Date();
        const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const [h, mo, j] = await Promise.all([
          api.get('/trackers/hydration', { from_: from, limit: 100 }),
          api.get('/trackers/mood', { from_: from, limit: 100 }),
          api.get('/trackers/journal', { from_: from, limit: 100 }),
        ]);
        setCounts({ hydration: h.length, mood: mo.length, journal: j.length });
      } catch {
        setCounts({ hydration: 0, mood: 0, journal: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Initialize default habits from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('today.habits') : null;
    if (saved) {
      try { setHabits(JSON.parse(saved)); } catch { /* noop */ }
    } else {
      setHabits([
        { id: 'h1', label: 'Drink 8 glasses of water', done: false },
        { id: 'h2', label: '10-minute walk or stretch', done: false },
        { id: 'h3', label: 'Sleep by 11 PM', done: false },
        { id: 'h4', label: 'Practice gratitude (3 things)', done: false },
        { id: 'h5', label: 'Take a break from screens', done: false },
      ]);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('today.habits', JSON.stringify(habits));
    }
  }, [habits]);

  const goalsCompleted = 2; // Example data
  const goalsTarget = 3;
  const goalsPct = goalsTarget > 0 ? (goalsCompleted / goalsTarget) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-64px)] w-full px-4 py-6 sm:px-6 md:px-8">
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={hide} />
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <TimeAwareGreeting />
          <Link
            href="/chat"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Open Chat
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Personalized Routine + Smart Suggestions */}
          <section className="col-span-2 space-y-6">
            <PersonalizedRoutine />
            <SmartSuggestions />
            
            {/* Enhanced Daily Habits */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Today's Life Habits</h2>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                  onClick={() => setHabits((h) => [...h, { id: `h${Date.now()}`, label: 'New habit', done: false }])}
                >
                  + Add Habit
                </button>
              </div>
              <ul className="space-y-3">
                {habits.map(h => (
                  <li key={h.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      id={h.id}
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
                      checked={h.done}
                      onChange={() => setHabits(prev => prev.map(x => x.id === h.id ? { ...x, done: !x.done } : x))}
                    />
                    <label htmlFor={h.id} className={`flex-1 text-sm ${h.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {h.label}
                    </label>
                    <button
                      type="button"
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      onClick={() => setHabits(prev => prev.filter(x => x.id !== h.id))}
                      aria-label="Remove habit"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {habits.length === 0 && (
                  <li className="text-sm text-gray-500 text-center py-4">No habits yet. Add one to get started!</li>
                )}
              </ul>
            </Card>
          </section>

          {/* Enhanced Progress & Quick Actions */}
          <aside className="space-y-6">
            {/* Progress Overview */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Today's Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ProgressRing percent={goalsPct} size={80} />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Life goals</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {goalsCompleted} of {goalsTarget} completed
                    </div>
                    <Link href="/chat" className="text-xs text-indigo-600 hover:underline">Set goals</Link>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium">Streak: {streakDays} days</span>
                </div>
              </div>
            </Card>

            {/* Progress Insights */}
            <ProgressInsights />

            {/* Quick Actions */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 text-left"
                  onClick={async () => {
                    try {
                      await api.post('/trackers/hydration', { when: new Date().toISOString(), amount_ml: 250 });
                      show('Hydration +250ml logged! 💧', 'success');
                      setCounts((c) => (c ? { ...c, hydration: c.hydration + 1 } : c));
                    } catch { show('Failed to log hydration', 'error'); }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💧</span>
                    <div>
                      <div className="font-medium">Log Water</div>
                      <div className="text-xs text-gray-500">+250ml hydration</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 text-left"
                  onClick={async () => {
                    try {
                      await api.post('/trackers/mood', { when: new Date().toISOString(), val: 7, scale: 10 });
                      show('Mood logged! 😊', 'success');
                      setCounts((c) => (c ? { ...c, mood: c.mood + 1 } : c));
                    } catch { show('Failed to log mood', 'error'); }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">😊</span>
                    <div>
                      <div className="font-medium">Log Mood</div>
                      <div className="text-xs text-gray-500">How are you feeling?</div>
                    </div>
                  </div>
                </button>
                
                <Link href="/chat" className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 text-left block">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <div className="font-medium">Get Advice</div>
                      <div className="text-xs text-gray-500">Chat with your AI companion</div>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>

            {/* Activity Summary */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Last 24 Hours</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Hydration logs</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {counts?.hydration ?? (loading ? '…' : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Mood logs</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {counts?.mood ?? (loading ? '…' : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Journal entries</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {counts?.journal ?? (loading ? '…' : 0)}
                  </span>
                </div>
              </div>
            </Card>
            
            {/* Daily Tip */}
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Today's Insight</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your 4:30 AM wake-up routine is working! Research shows early risers have 25% better productivity and improved mood throughout the day. Keep it up! 🌅
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
