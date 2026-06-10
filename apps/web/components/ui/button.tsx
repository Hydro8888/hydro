import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gray-900 text-white hover:bg-gray-800 shadow-xs ring-1 ring-gray-900/10 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 shadow-xs ring-1 ring-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800',
  tertiary:
    'bg-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900',
  destructive:
    'bg-error-600 text-white hover:bg-error-700 shadow-xs ring-1 ring-error-700/30',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
  lg: 'px-4 py-2.5 text-sm rounded-lg gap-2',
  xl: 'px-5 py-3 text-base rounded-xl gap-2.5',
};

const baseStyles =
  'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-primary-500/12 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

interface ButtonProps
  extends BaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  href?: undefined;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  target?: string;
  rel?: string;
}

export function Button(props: ButtonProps | LinkButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    className,
    children,
    leftIcon,
    rightIcon,
    ...rest
  } = props;

  const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if ('href' in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes} target={rest.target} rel={rest.rel}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
