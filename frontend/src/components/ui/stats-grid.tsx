import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCard, AnimatedCounter } from '@/components/ui/micro-interactions';

export interface StatItem {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow' | 'gray';
  gradient?: boolean;
  animated?: boolean;
}

export interface StatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    text: 'text-blue-100',
    icon: 'text-blue-200',
    value: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500 to-green-600',
    text: 'text-green-100',
    icon: 'text-green-200',
    value: 'text-green-600 dark:text-green-400'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    text: 'text-orange-100',
    icon: 'text-orange-200',
    value: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-red-600',
    text: 'text-red-100',
    icon: 'text-red-200',
    value: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-purple-100',
    icon: 'text-purple-200',
    value: 'text-purple-600 dark:text-purple-400'
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    text: 'text-yellow-100',
    icon: 'text-yellow-200',
    value: 'text-yellow-600 dark:text-yellow-400'
  },
  gray: {
    bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
    text: 'text-gray-100',
    icon: 'text-gray-200',
    value: 'text-gray-600 dark:text-gray-400'
  }
};

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
};

export function StatsGrid({ 
  stats, 
  columns = 4, 
  loading = false, 
  className = '' 
}: StatsGridProps) {
  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {[...Array(columns)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {stats.map((stat) => {
        const colors = colorClasses[stat.color || 'blue'];
        
        return (
          <AnimatedCard 
            key={stat.id}
            className={stat.gradient ? `${colors.bg} text-white` : 'p-6'}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.gradient ? colors.text : 'text-gray-600 dark:text-gray-400'}`}>
                    {stat.label}
                  </p>
                  {stat.animated ? (
                    <AnimatedCounter 
                      value={typeof stat.value === 'number' ? stat.value : 0} 
                      className={`text-2xl font-bold ${stat.gradient ? 'text-white' : colors.value}`}
                    />
                  ) : (
                    <div className={`text-2xl font-bold ${stat.gradient ? 'text-white' : colors.value}`}>
                      {stat.value}
                    </div>
                  )}
                  {stat.unit && (
                    <p className={`text-xs ${stat.gradient ? colors.text : 'text-gray-500'}`}>
                      {stat.unit}
                    </p>
                  )}
                </div>
                {stat.icon && (
                  <div className={stat.gradient ? colors.icon : 'text-gray-500'}>
                    {stat.icon}
                  </div>
                )}
              </div>
            </CardContent>
          </AnimatedCard>
        );
      })}
    </div>
  );
}
