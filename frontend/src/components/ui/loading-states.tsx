import { Skeleton, SkeletonCard, SkeletonStatsCard, SkeletonTable, SkeletonList, SkeletonForm, SkeletonButton, SkeletonAvatar, SkeletonText } from './skeleton';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

interface PageLoadingProps {
  className?: string;
  message?: string;
}

export function PageLoading({ className, message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
}

interface CardLoadingProps {
  className?: string;
  variant?: 'default' | 'stats' | 'form' | 'list';
  items?: number;
}

export function CardLoading({ className, variant = 'default', items = 1 }: CardLoadingProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'stats':
        return <SkeletonStatsCard className={className} />;
      case 'form':
        return <SkeletonForm className={className} />;
      case 'list':
        return <SkeletonList items={items} className={className} />;
      default:
        return <SkeletonCard className={className} />;
    }
  };

  if (items === 1) {
    return renderSkeleton();
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

interface TableLoadingProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export function TableLoading({ className, rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <SkeletonTable rows={rows} />
    </div>
  );
}

interface DashboardLoadingProps {
  className?: string;
}

export function DashboardLoading({ className }: DashboardLoadingProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Section Skeleton */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-8 animate-pulse">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex space-x-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Content Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

interface FormLoadingProps {
  className?: string;
  fields?: number;
}

export function FormLoading({ className, fields = 4 }: FormLoadingProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <SkeletonForm fields={fields} />
      <div className="flex justify-end space-x-3">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}

interface ListLoadingProps {
  className?: string;
  items?: number;
  showAvatar?: boolean;
}

export function ListLoading({ className, items = 5, showAvatar = false }: ListLoadingProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          {showAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

interface ModalLoadingProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function ModalLoading({ className, showHeader = true, showFooter = true }: ModalLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      
      <div className="space-y-4">
        <SkeletonForm fields={3} />
      </div>
      
      {showFooter && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      )}
    </div>
  );
}

interface InlineLoadingProps {
  className?: string;
  text?: string;
}

export function InlineLoading({ className, text = 'Loading...' }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
}

interface ButtonLoadingProps {
  className?: string;
  text?: string;
}

export function ButtonLoading({ className, text = 'Loading...' }: ButtonLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

// Re-export skeleton components for convenience
export { SkeletonStatsCard as StatsCardSkeleton };