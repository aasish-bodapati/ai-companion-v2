import React from 'react';

export type CardProps = React.PropsWithChildren<{
  className?: string;
  as?: React.ElementType;
  hover?: boolean;
}>;

export function Card({ className = '', as = 'div', hover = false, children }: CardProps) {
  const Comp: any = as;
  return (
    <Comp
      className={[
        'rounded-2xl border border-gray-200/60 dark:border-gray-700/60',
        'bg-white/70 dark:bg-gray-900/40 shadow-sm',
        'backdrop-blur',
        hover ? 'transition hover:shadow-card' : '',
        className,
      ].join(' ')}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={[
      'px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/60',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={[
      'p-5',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={[
      'p-5',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={[
      'text-lg font-semibold leading-none tracking-tight',
      className,
    ].join(' ')}>
      {children}
    </h3>
  );
}
