'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailCaptureFormProps {
  variant?: 'light' | 'dark';
  className?: string;
  placeholder?: string;
}

export function EmailCaptureForm({ variant = 'light', className, placeholder }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus('submitting');
    timerRef.current = setTimeout(() => {
      setStatus('success');
      try {
        localStorage.setItem('waitlist-email', email);
      } catch (err) {
        console.warn('[email-capture] localStorage failed:', err);
      }
    }, 800);
  }

  const isDark = variant === 'dark';

  if (status === 'success') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium',
            isDark ? 'bg-white/20 text-white' : 'bg-success-50 text-success-700'
          )}
        >
          <Check className="w-5 h-5" />
          등록 완료!
        </div>
        <Link
          href="/chat"
          className={cn(
            'px-5 py-3 rounded-lg text-sm font-semibold transition-colors',
            isDark
              ? 'bg-white text-gray-900 hover:bg-gray-100'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          )}
        >
          대시보드로
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
        placeholder={placeholder ?? '이메일 주소를 입력하세요'}
        required
        aria-label="이메일"
        className={cn(
          'flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all shadow-xs',
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-white/50'
            : 'bg-white border border-gray-300 dark:border-gray-700 dark:bg-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/12'
        )}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={cn(
          'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xs',
          isDark
            ? 'bg-white text-gray-900 hover:bg-gray-100'
            : 'bg-gray-900 text-white hover:bg-gray-800 ring-1 ring-gray-900/10',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        {status === 'submitting' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            시작하기
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
