import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Apple, Calendar, TrendingUp, Target } from 'lucide-react';
import { useHealthMemories } from '../hooks/useHealthMemories';

interface HealthMemoryDisplayProps {
  className?: string;
}

function MemoryItem({ memory }: { memory: any }) {
  const getMemoryIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'goal':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'preference':
        return <Heart className="h-4 w-4 text-blue-600" />;
      case 'fact':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'fitness':
        return <Activity className="h-4 w-4 text-orange-600" />;
      case 'nutrition':
        return <Apple className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMemoryTypeColor = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'goal':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'preference':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'fact':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'fitness':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'nutrition':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getMemoryIcon(memory.content_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${getMemoryTypeColor(memory.content_type)}`}>
              {memory.content_type}
            </Badge>
            <span className="text-xs text-gray-500">
              {Math.round(memory.relevance_score * 100)}% relevant
            </span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {memory.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function HealthInfoCard() {
  const { data: healthMemories, isLoading, error } = useHealthMemories();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Health Info</h2>
            <p className="text-sm text-gray-500">From your conversations</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 italic">Loading your health information...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Health Info</h2>
            <p className="text-sm text-gray-500">From your conversations</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 italic">Unable to load health information.</div>
      </Card>
    );
  }

  const hasMemories = healthMemories && healthMemories.length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Health Info</h2>
          <p className="text-sm text-gray-500">From your conversations</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {hasMemories ? (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Here&apos;s what your AI companion has learned about your health and wellness:
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {healthMemories.slice(0, 8).map((memory) => (
                <MemoryItem key={memory.id} memory={memory} />
              ))}
            </div>
            {healthMemories.length > 8 && (
              <div className="text-xs text-gray-500 text-center">
                +{healthMemories.length - 8} more health memories
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No health information yet. Start chatting about your health, fitness, nutrition, or wellness goals!
          </div>
        )}
      </div>
    </Card>
  );
}

export function HealthMemoryDisplay({ className }: HealthMemoryDisplayProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <HealthInfoCard />
    </div>
  );
}
