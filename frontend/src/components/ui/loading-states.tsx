'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export function Skeleton({ className = '', height = 'h-4', width = 'w-full' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${height} ${width} ${className}`}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton height="h-4" width="w-3/4" />
          <Skeleton height="h-8" width="w-1/2" />
          <Skeleton height="h-3" width="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton height="h-4" width="w-24" />
            <Skeleton height="h-8" width="w-16" />
          </div>
          <Skeleton height="h-8" width="w-8" className="rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkoutCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton height="h-5" width="w-3/4" />
              <Skeleton height="h-4" width="w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton height="h-7" width="w-7" className="rounded" />
              <Skeleton height="h-7" width="w-7" className="rounded" />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center space-y-1">
              <Skeleton height="h-3" width="w-8" className="mx-auto" />
              <Skeleton height="h-5" width="w-6" className="mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton height="h-3" width="w-8" className="mx-auto" />
              <Skeleton height="h-5" width="w-6" className="mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton height="h-3" width="w-8" className="mx-auto" />
              <Skeleton height="h-5" width="w-6" className="mx-auto" />
            </div>
          </div>
          
          {/* Exercise details */}
          <div className="space-y-2">
            <Skeleton height="h-4" width="w-32" />
            <div className="space-y-2">
              <Skeleton height="h-16" width="w-full" className="rounded-lg" />
              <Skeleton height="h-16" width="w-full" className="rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Skeleton height="h-6" width="w-32" />
            <div className="flex gap-2">
              <Skeleton height="h-8" width="w-20" />
              <Skeleton height="h-8" width="w-20" />
            </div>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="aspect-square p-2">
                <div className="space-y-1">
                  <Skeleton height="h-4" width="w-6" />
                  {i % 7 === 0 && <Skeleton height="h-3" width="w-12" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ButtonSkeleton({ className = '' }: { className?: string }) {
  return (
    <Skeleton height="h-10" width="w-24" className={`rounded-md ${className}`} />
  );
}

export function TableSkeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton height="h-4" width="w-4" className="rounded" />
          <Skeleton height="h-4" width="w-1/3" />
          <Skeleton height="h-4" width="w-1/4" />
          <Skeleton height="h-4" width="w-1/6" />
          <div className="flex gap-2 ml-auto">
            <Skeleton height="h-6" width="w-6" className="rounded" />
            <Skeleton height="h-6" width="w-6" className="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ isLoading, children, message = 'Loading...', className = '' }: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export function Pulse({ children, isActive = true, className = '' }: PulseProps) {
  return (
    <div className={`${isActive ? 'animate-pulse' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface ShimmerProps {
  children: React.ReactNode;
  className?: string;
}

export function Shimmer({ children, className = '' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// Add shimmer animation to global CSS
export const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;
