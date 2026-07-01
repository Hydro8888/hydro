'use client';

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'livenews_newsletter_dismissed';

export default function NewsletterBanner() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      setDismissed(stored === 'true');
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (dismissed) return null;

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
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Accent top bar */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      {submitted ? (
        <div className="text-center py-2">
          <p className="text-headline-sm text-accent">구독 완료!</p>
          <p className="mt-1 text-body-md text-text-secondary">
            매일 아침 글로벌 뉴스를 보내드리겠습니다.
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-headline-sm text-text mb-1 pr-6">
            매일 아침 AI가 정리한 글로벌 뉴스를 받아보세요
          </h3>
          <p className="text-body-md text-text-secondary mb-4">
            주요 뉴스 요약과 시장 동향을 이메일로 받아보세요. 언제든 구독 해지 가능.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              className="flex-1 min-w-0 px-3 py-2 rounded-badge
                bg-surface-elevated border border-border-muted
                text-body-md text-text placeholder:text-text-muted
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                transition-colors"
            />
            <button
              type="submit"
              className="flex-none px-4 py-2 rounded-badge
                bg-accent text-white text-body-md font-semibold
                hover:bg-accent/90 active:scale-[0.98]
                transition-all duration-150"
            >
              구독
            </button>
          </form>
        </>
      )}
    </div>
  );
}
