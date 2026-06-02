'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { CATEGORIES, MAIN_MENU } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Category links (pick top categories for footer display)            */
/* ------------------------------------------------------------------ */
const FOOTER_CATEGORIES = CATEGORIES.slice(0, 12);

const QUICK_LINKS = MAIN_MENU.filter(
  (m) => m.href !== '/' && m.href !== '/ranking' && m.href !== '/search',
).slice(0, 6);

/* ------------------------------------------------------------------ */
/*  Newsletter form (UI only — no backend)                             */
/* ------------------------------------------------------------------ */
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
    // Reset after 4 seconds
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div>
      <h3 className="text-overline text-text-muted uppercase tracking-widest mb-3">
        뉴스레터 구독
      </h3>
      <p className="text-caption text-text-secondary mb-3 leading-relaxed">
        매일 아침 AI가 선별한 핵심 뉴스를 이메일로 받아보세요.
      </p>
      {submitted ? (
        <div className="flex items-center gap-2 py-2.5 px-3 rounded-card bg-accent-green/10 border border-accent-green/20">
          <svg className="h-4 w-4 text-accent-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-caption text-accent-green font-medium">구독 완료! 감사합니다.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            className="flex-1 min-w-0 px-3 py-2 rounded-card bg-surface border border-border text-body-md text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-2 rounded-card bg-accent text-surface text-caption font-semibold hover:bg-accent/90 active:bg-accent/80 transition-colors"
          >
            구독
          </button>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer stats bar                                                   */
/* ------------------------------------------------------------------ */
function FooterStats() {
  const [stats, setStats] = useState<{ total: number; today: number; sources: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const res = await fetch('/livenews/api/admin/stats');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled) {
          setStats({
            total: data.totalArticles ?? 0,
            today: data.articlesToday ?? 0,
            sources: data.activeSources ?? 0,
          });
        }
      } catch {
        if (!cancelled) setStats(null);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-muted tabular-nums">
      <span>
        전체 기사 <strong className="text-text-secondary">{stats.total.toLocaleString('ko-KR')}</strong>건
      </span>
      <span className="hidden sm:inline text-border">|</span>
      <span className="hidden sm:inline">
        오늘 <strong className="text-text-secondary">{stats.today.toLocaleString('ko-KR')}</strong>건
      </span>
      <span className="hidden sm:inline text-border">|</span>
      <span className="hidden sm:inline">
        활성 소스 <strong className="text-text-secondary">{stats.sources}</strong>개
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Footer                                                        */
/* ------------------------------------------------------------------ */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-card border-t border-border mt-12 pb-16 lg:pb-0">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Column 1: 사이트 소개 + AI 설명 */}
          <div>
            <div className="mb-3 flex items-center gap-0.5">
              <span className="text-lg font-extrabold text-accent">LiveNews</span>
              <span className="text-base font-medium text-text-secondary">.co.kr</span>
              <span className="ml-1.5 h-1 w-1 rounded-full bg-accent-red" />
            </div>
            <p className="text-body-md text-text-secondary leading-relaxed mb-3">
              전 세계 주요 뉴스를 AI 기반으로 번역 · 요약하여 한국어로 제공합니다.
            </p>
            <div className="flex items-start gap-2 p-2.5 rounded-card bg-accent-blue/5 border border-accent-blue/10">
              <AiIcon className="h-4 w-4 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-caption text-accent-blue/80 leading-relaxed">
                xAI Grok 기반 자동 번역 · 카테고리 분류 · 요약 시스템 운영 중
              </p>
            </div>
          </div>

          {/* Column 2: 카테고리 링크 */}
          <div>
            <h3 className="text-overline text-text-muted uppercase tracking-widest mb-3">
              카테고리
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-body-md text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="text-xs opacity-60">{cat.icon}</span>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Quick nav links */}
            <h3 className="text-overline text-text-muted uppercase tracking-widest mt-5 mb-2">
              바로가기
            </h3>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-caption text-text-secondary hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: 뉴스레터 구독 */}
          <div>
            <NewsletterForm />
          </div>

          {/* Column 4: 소셜 링크 + 연락처 */}
          <div>
            <h3 className="text-overline text-text-muted uppercase tracking-widest mb-3">
              연락처
            </h3>
            <ul className="space-y-2.5 mb-5">
              <li>
                <a
                  href="mailto:contact@livenews.co.kr"
                  className="flex items-center gap-2 text-body-md text-text-secondary hover:text-accent transition-colors"
                >
                  <MailIcon className="h-4 w-4 text-text-muted" />
                  contact@livenews.co.kr
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/livenews"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-body-md text-text-secondary hover:text-accent transition-colors"
                >
                  <GithubIcon className="h-4 w-4 text-text-muted" />
                  GitHub
                </a>
              </li>
            </ul>

            <h3 className="text-overline text-text-muted uppercase tracking-widest mb-3">
              소셜
            </h3>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/livenews_kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-8 w-8 rounded-card bg-surface-elevated text-text-secondary hover:text-accent hover:bg-surface transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/livenews"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-8 w-8 rounded-card bg-surface-elevated text-text-secondary hover:text-accent hover:bg-surface transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@livenews.co.kr"
                className="flex items-center justify-center h-8 w-8 rounded-card bg-surface-elevated text-text-secondary hover:text-accent hover:bg-surface transition-colors"
                aria-label="Email"
              >
                <MailIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border-muted" />

        {/* Bottom bar: copyright + AI disclaimer + stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-relaxed text-text-muted max-w-2xl mb-2">
              본 서비스의 기사는 AI를 통해 번역 · 요약되었으며, 원문 저작권은 각 언론사에 있습니다.
              번역 과정에서 오류가 발생할 수 있으므로, 중요한 정보는 원문을 직접 확인하시기 바랍니다.
            </p>
            <FooterStats />
          </div>
          <p className="text-xs text-text-muted whitespace-nowrap shrink-0">
            &copy; {year} LiveNews. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon components (inline SVG)                                       */
/* ------------------------------------------------------------------ */

function AiIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function MailIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function GithubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
