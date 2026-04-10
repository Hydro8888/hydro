import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'gray' | 'primary' | 'success' | 'warning' | 'error';
type Size = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const variantStyles: Record<Variant, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:ring-primary-900',
  success: 'bg-success-50 text-success-700 ring-success-500/20',
  warning: 'bg-warning-50 text-warning-600 ring-warning-500/20',
  error: 'bg-error-50 text-error-700 ring-error-500/20',
};

const dotStyles: Record<Variant, string> = {
  gray: 'bg-gray-500 dark:bg-gray-400',
  primary: 'bg-primary-500 dark:bg-primary-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function Badge({
  variant = 'gray',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
}
