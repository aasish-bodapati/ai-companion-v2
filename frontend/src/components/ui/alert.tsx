import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const alertVariants = {
  default: 'border bg-background text-foreground',
  destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
  success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-500',
  warning: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-500',
  info: 'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-500'
};

const alertIcons = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info
};

export function Alert({ variant = 'default', children, className }: AlertProps) {
  const Icon = alertIcons[variant];
  
  return (
    <div className={cn(
      'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
      alertVariants[variant],
      className
    )}>
      <Icon className="h-4 w-4" />
      <div>{children}</div>
    </div>
  );
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  );
}
