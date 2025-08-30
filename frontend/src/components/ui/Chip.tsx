import React from 'react';

type Variant = 'default' | 'outline' | 'brand' | 'success' | 'danger';

type Props = React.PropsWithChildren<{
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
  variant?: Variant;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}>;

export default function Chip({
  className = '',
  onClick,
  as = 'button',
  variant = 'outline',
  size = 'sm',
  ariaLabel,
  children,
}: Props) {
  const Comp: any = as;
  const base = 'inline-flex items-center rounded-full transition';
  const sizes = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-[11px]';
  const variants: Record<Variant, string> = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-200',
    brand: 'bg-brand-600 text-white hover:bg-brand-700',
    success: 'bg-success text-white hover:bg-success-600',
    danger: 'bg-danger text-white hover:bg-danger-600',
  };
  return (
    <Comp
      type={(as as any) === 'button' ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={[base, sizes, variants[variant], className].join(' ')}
    >
      {children}
    </Comp>
  );
}
