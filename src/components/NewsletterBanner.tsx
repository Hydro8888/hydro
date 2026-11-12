'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { NEWSLETTER_ENABLED, subscribeNewsletter } from '@/lib/newsletter';
import { BTN_GHOST_SM, BTN_PRIMARY, FIELD } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { CloseIcon } from './icons';

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
          ? '올바른 이메일 주소를 입력해 주세요'
          : '구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (!NEWSLETTER_ENABLED || dismissed) return null;

  return (
    <div className="relative rounded-card border border-border bg-surface-card p-5">
      <button type="button" onClick={handleDismiss} aria-label="배너 닫기" className={cn(BTN_GHOST_SM, 'absolute right-3 top-3')}>
        <CloseIcon />
      </button>

      {status !== 'success' && (
        <>
          {/* Same wording as the footer form. Nothing here promises a schedule or contents. */}
          <h3 className="pr-8 text-headline-sm text-text">뉴스레터 구독</h3>
          <p className="mt-1 text-body-md text-text-secondary">주요 뉴스를 이메일로 받아 보세요</p>
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
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
              aria-invalid={status === 'error' || undefined}
              aria-describedby="banner-newsletter-status"
              className={cn(FIELD, 'min-w-0 flex-1')}
            />
            <button type="submit" disabled={status === 'submitting'} className={cn(BTN_PRIMARY, 'shrink-0')}>
              구독
            </button>
          </form>
        </>
      )}

      {/* One live region that is always mounted; only its text changes (success / error). */}
      <p
        id="banner-newsletter-status"
        role="status"
        aria-live="polite"
        className={cn('empty:hidden', status === 'success' ? 'pr-8 text-body-md text-text' : 'mt-2 text-caption text-negative')}
      >
        {status === 'success' ? '구독 신청이 접수되었습니다' : status === 'error' ? errorMsg : ''}
      </p>
    </div>
  );
}
