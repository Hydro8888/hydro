import React from 'react';

type RequestStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

interface StatusTagProps {
  status: RequestStatus;
  className?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  RequestStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: '대기 중',
    bg: 'bg-yellow-100 border-yellow-200',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },
  MATCHING: {
    label: '매칭 중',
    bg: 'bg-blue-100 border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  MATCHED: {
    label: '매칭 완료',
    bg: 'bg-indigo-100 border-indigo-200',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  IN_PROGRESS: {
    label: '진행 중',
    bg: 'bg-orange-100 border-orange-200',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  COMPLETED: {
    label: '완료',
    bg: 'bg-green-100 border-green-200',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
  CANCELLED: {
    label: '취소됨',
    bg: 'bg-gray-100 border-gray-200',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  DISPUTED: {
    label: '분쟁 중',
    bg: 'bg-red-100 border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-500',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function StatusTag({
  status,
  className = '',
  size = 'sm',
}: StatusTagProps) {
  const config = statusConfig[status];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.bg,
        config.text,
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
