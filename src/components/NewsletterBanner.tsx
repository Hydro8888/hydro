'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { NEWSLETTER_ENABLED, subscribeNewsletter } from '@/lib/newsletter';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'livenews_newsletter_dismissed';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Newsletter call-out. Rendered only when NEXT_PUBLIC_NEWSLETTER_ENABLED is 'true' (S2 contract C),
 * and success is shown only for a 2xx response from the backend.
 */
export default function NewsletterBanner() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      setDismissed(stored === 'true');
    } catch {
      setDismissed(false);
    }
    return () => {
      mounted.current = false;
    };
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting' || !email.trim()) return;
    setStatus('submitting');
    setErrorMsg('');
    const r = await subscribeNewsletter(email);
    if (!mounted.current) return;
    if (r.ok) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setErrorMsg(
        r.reason === 'invalid'
          ? '올바른 이메일 주소를 입력해 주세요.'
          : '구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (!NEWSLETTER_ENABLED || dismissed) return null;

  return (
    <div className="relative rounded-card border border-accent/30 bg-surface-card p-5 sm:p-6">
      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="배너 닫기"
        className="absolute top-3 right-3 w-7 h-7 inline-flex items-center justify-center rounded-full
          text-text-muted hover:text-text hover:bg-surface-elevated transition-colors"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Accent top bar */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      {status !== 'success' && (
        <>
          <h3 className="text-headline-sm text-text mb-1 pr-6">
            매일 아침 AI가 정리한 글로벌 뉴스를 받아보세요
          </h3>
          <p className="text-body-md text-text-secondary mb-4">
            주요 뉴스 요약과 시장 동향을 이메일로 받아보세요. 언제든 구독 해지 가능.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="banner-newsletter-email" className="sr-only">
              이메일 주소
            </label>
            <input
              id="banner-newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              autoComplete="email"
              required
              className="flex-1 min-w-0 px-3 py-2 rounded-badge
                bg-surface-elevated border border-border-muted
                text-body-md text-text placeholder:text-text-muted
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex-none px-4 py-2 rounded-badge
                bg-accent text-white text-body-md font-semibold
                hover:bg-accent/90 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-wait
                transition-all duration-150"
            >
              구독
            </button>
          </form>
        </>
      )}

      {/* One live region that is always mounted; only its text changes (success / error). */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          'empty:hidden',
          status === 'success' ? 'py-2 text-center text-headline-sm text-accent' : 'mt-2 text-caption text-accent-red',
        )}
      >
        {status === 'success' ? '구독 신청이 접수되었습니다.' : status === 'error' ? errorMsg : ''}
      </p>
    </div>
  );
}
