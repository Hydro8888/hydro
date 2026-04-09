'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailCaptureFormProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function EmailCaptureForm({ variant = 'light', className }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      localStorage.setItem('waitlist-email', email);
    }, 800);
  }

  const isDark = variant === 'dark';

  if (status === 'success') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
          isDark ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
        )}>
          <Check className="w-5 h-5" />
          환영합니다! 이메일이 등록되었습니다.
        </div>
        <Link
          href="/chat"
          className={cn(
            'px-5 py-3 rounded-xl text-sm font-semibold transition-all',
            isDark
              ? 'bg-white text-primary-600 hover:bg-gray-100'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
        >
          대시보드로 이동
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col sm:flex-row gap-3', className)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일을 입력하세요"
        required
        className={cn(
          'flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all',
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20'
            : 'bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        )}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={cn(
          'px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap',
          isDark
            ? 'bg-white text-primary-600 hover:bg-gray-100 shadow-lg'
            : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 animate-gentle-pulse'
        )}
      >
        {status === 'submitting' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            무료로 시작하기
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
