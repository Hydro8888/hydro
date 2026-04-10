import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = true,
}: CardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={[
        'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
        hover
          ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300'
          : '',
        onClick ? 'cursor-pointer text-left w-full' : '',
        padding ? 'p-6' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}
