import React from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const MobileOptimizedButton = React.forwardRef<HTMLButtonElement, MobileOptimizedButtonProps>(({ 
  variant = 'default', 
  size = 'default', 
  className, 
  children, 
  fullWidth = false,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };

  const sizeClasses = {
    default: 'h-12 px-6 py-3 min-h-[48px]', // 48px for better mobile touch
    sm: 'h-10 rounded-md px-4 py-2 min-h-[44px]', // 44px minimum
    lg: 'h-14 rounded-lg px-8 py-4 min-h-[56px]', // 56px for important actions
    icon: 'h-12 w-12 min-h-[48px] min-w-[48px]' // 48px for icon buttons
  };

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses, 
        variantClasses[variant], 
        sizeClasses[size], 
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

MobileOptimizedButton.displayName = 'MobileOptimizedButton';
