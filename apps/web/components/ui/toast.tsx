'use client';

import { useToastStore, type Toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm shadow-lg min-w-[240px] max-w-sm ${colors[toast.type]}`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-80 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 items-stretch sm:items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
