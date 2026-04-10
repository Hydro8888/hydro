import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  variant?: 'white' | 'gray';
  containerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
};

export function Section({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  variant = 'white',
  containerSize = 'xl',
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'py-16 md:py-24',
        variant === 'gray' ? 'bg-gray-50 dark:bg-gray-950' : 'bg-white dark:bg-gray-900',
        className
      )}
      {...props}
    >
      <div className={cn('mx-auto px-6', containerSizes[containerSize])}>
        {(eyebrow || title || subtitle) && (
          <div className={cn('mb-12 md:mb-16', align === 'center' && 'text-center max-w-2xl mx-auto')}>
            {eyebrow && (
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-3">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
