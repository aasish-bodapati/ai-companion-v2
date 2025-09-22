import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className, 
  variant = 'default',
  animation = 'pulse' 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
    none: ''
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
}

// Pre-built skeleton components for common patterns
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 3, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-11 w-24 rounded-lg', className)} />;
}

export function SkeletonAvatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  
  return <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}
