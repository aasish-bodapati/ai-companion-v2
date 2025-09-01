/**
 * Companion Morning Briefing - Simple, flowing morning update from your AI companion
 * 
 * This aligns with the "rich circle" vision: a gentle companion check-in,
 * not a complex task management dashboard.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, Info, SparklesIcon, Heart } from 'lucide-react';

interface SimpleTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  category: string;
}

interface MorningBriefing {
  greeting: string;
  insights: string[];
  gentleReminders: SimpleTask[];
  moodCheck: string;
}

export default function AssistantMorningReport() {
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate fetching companion's morning briefing
  useEffect(() => {
    const fetchMorningBriefing = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple, focused data - what a companion would actually say
      const mockBriefing: MorningBriefing = {
        greeting: "Good morning! I've been thinking about you and wanted to share a few gentle insights.",
        insights: [
          "You've been sleeping better on days when you exercise in the evening",
          "Your mood tends to be highest on Tuesday and Thursday mornings",
          "You're most productive when you start with your most important task first"
        ],
        gentleReminders: [
          {
            id: '1',
            title: 'Morning Hydration',
            description: 'Remember to drink water - you feel better when hydrated',
            status: 'pending',
            category: 'Health'
          },
          {
            id: '2',
            title: 'Check Your Calendar',
            description: 'You have a meeting at 2 PM today',
            status: 'pending',
            category: 'Schedule'
          }
        ],
        moodCheck: "How are you feeling this morning? I'm here if you want to talk."
      };
      
      setBriefing(mockBriefing);
      setLoading(true);
    };

    fetchMorningBriefing();
  }, []);

  const handleTaskAction = (taskId: string, action: 'complete' | 'skip') => {
    if (!briefing) return;
    
    setBriefing(prev => {
      if (!prev) return prev;
      
      const updatedReminders = prev.gentleReminders.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: (action === 'complete' ? 'completed' : 'skipped') as SimpleTask['status'],
          };
        }
        return task;
      });
      
      return {
        ...prev,
        gentleReminders: updatedReminders
      };
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="text-center py-8">
        <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading your morning briefing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Companion Greeting */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl">👋</span>
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900 dark:text-blue-100">
                Your Companion's Morning Check-in
              </CardTitle>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                A gentle start to your day
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
            {briefing.greeting}
          </p>
        </CardContent>
      </Card>

      {/* Gentle Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl text-green-900 dark:text-green-100">
              What I've Noticed About You
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {briefing.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-green-800 dark:text-green-200 leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gentle Reminders */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl text-purple-900 dark:text-purple-100">
              Gentle Reminders for Today
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {briefing.gentleReminders.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    {task.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {task.status === 'skipped' && (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                    {task.title}
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {task.description}
                  </p>
                </div>
                
                {task.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTaskAction(task.id, 'complete')}
                      className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTaskAction(task.id, 'skip')}
                      className="text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mood Check */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
               <Heart className="h-5 w-5 text-white" />
             </div>
            <CardTitle className="text-xl text-orange-900 dark:text-orange-100">
              How Are You Feeling?
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-orange-800 dark:text-orange-200 leading-relaxed mb-4">
            {briefing.moodCheck}
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Great! 😊
            </Button>
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Okay 😐
            </Button>
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Could be better 😔
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
