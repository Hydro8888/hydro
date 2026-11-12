'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { CATEGORIES, MAIN_MENU } from '@/lib/constants';
import { cn, formatCount } from '@/lib/utils';
import { isAdminPath, kstYear } from '@/lib/site';
import { BTN_PRIMARY, FIELD, NUM } from '@/lib/ui';
import { NEWSLETTER_ENABLED, isNewsletterBannerPath, subscribeNewsletter } from '@/lib/newsletter';
import { useSiteStats } from '@/hooks/useSiteStats';
import { CheckIcon, MailIcon } from './icons';

/* ------------------------------------------------------------------ */
/*  Category links (pick top categories for footer display)            */
/* ------------------------------------------------------------------ */
const FOOTER_CATEGORIES = CATEGORIES.slice(0, 12);

const QUICK_LINKS = MAIN_MENU.filter(
  (m) => m.href !== '/' && m.href !== '/ranking' && m.href !== '/search',
).slice(0, 6);

// Page container shared with the header and every page (UNSLOP-AUDIT §7-6).
const CONTAINER = 'mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8';

// Section label (sentence case) and the one link shape of every footer list: a 32px row.
const LABEL = 'mb-3 text-overline text-text-muted';
const ROW_LINK =
  'inline-flex h-8 items-center gap-2 text-body-md text-text-secondary transition-colors hover:text-text';

/* ------------------------------------------------------------------ */
/*  Newsletter form — rendered only when NEXT_PUBLIC_NEWSLETTER_ENABLED */
/*  is 'true'. Success is shown only for a 2xx from the backend.       */
/* ------------------------------------------------------------------ */
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || !email.trim()) return;
    setStatus('submitting');
    const result = await subscribeNewsletter(email);
    if (result.ok) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <div>
      <h2 className={LABEL}>뉴스레터 구독</h2>
      <p className="mb-3 text-caption text-text-secondary">주요 뉴스를 이메일로 받아 보세요</p>
      {status === 'success' ? (
        <p role="status" className="flex h-10 items-center gap-2 text-body-md text-text">
          <CheckIcon />
          구독 신청이 접수되었습니다
        </p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              뉴스레터 받을 이메일 주소
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              autoComplete="email"
              required
              className={cn(FIELD, 'min-w-0 flex-1')}
            />
            <button type="submit" disabled={status === 'submitting'} className={cn(BTN_PRIMARY, 'shrink-0')}>
              구독
            </button>
          </form>
          <p role="status" className="mt-2 text-caption text-negative empty:hidden">
            {status === 'error' ? '구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' : ''}
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer stats bar (public /api/stats, request shared with Header)   */
/* ------------------------------------------------------------------ */
function FooterStats() {
  const stats = useSiteStats();
  if (!stats) return null;

  // Same format and face as the header figures ('164,917건').
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-muted">
      <span>
        전체 기사 <span className={cn(NUM, 'text-text-secondary')}>{formatCount(stats.totalArticles)}</span>건
      </span>
      <span aria-hidden="true" className="hidden sm:inline">·</span>
      <span className="hidden sm:inline">
        오늘 <span className={cn(NUM, 'text-text-secondary')}>{formatCount(stats.articlesToday)}</span>건
      </span>
      <span aria-hidden="true" className="hidden sm:inline">·</span>
      <span className="hidden sm:inline">
        활성 소스 <span className={cn(NUM, 'text-text-secondary')}>{formatCount(stats.activeSources)}</span>개
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Footer                                                        */
/* ------------------------------------------------------------------ */
export default function Footer() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;
  return <SiteFooter pathname={pathname} />;
}

function SiteFooter({ pathname }: { pathname: string }) {
  // KST year; static pages (/search, 404) carry the build-time year → suppressHydrationWarning below
  const year = kstYear();
  // The newsletter column exists only when the flag is on and the page has no NewsletterBanner (S3)
  const showNewsletter = NEWSLETTER_ENABLED && !isNewsletterBannerPath(pathname);

  return (
    <footer className="mt-12 w-full border-t border-border bg-surface-deep pb-16 lg:pb-0">
      <div className={cn(CONTAINER, 'py-10')}>
        {/* 3- or 4-column grid (no empty track when the newsletter column is off) */}
        <div
          className={
            showNewsletter
              ? 'grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6'
              : 'grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6'
          }
        >
          {/* Column 1: 사이트 소개 + 자동 처리 안내 (plain sentences) */}
          <div>
            <p className="mb-3 text-lg font-semibold text-text">
              LiveNews<span className="text-text-secondary">.co.kr</span>
            </p>
            <p className="text-body-md text-text-secondary">전 세계 주요 뉴스를 한국어로 번역·요약해 전합니다</p>
            <p className="mt-2 text-caption text-text-muted">
              번역·카테고리 분류·요약은 OpenAI GPT 모델로 자동 처리합니다
            </p>
          </div>

          {/* Column 2: 카테고리 링크 */}
          <div>
            <h2 className={LABEL}>카테고리</h2>
            <ul className="grid grid-cols-2 gap-x-4">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.slug} className="flex">
                  <Link href={`/category/${cat.slug}`} className={ROW_LINK}>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Quick nav links */}
            <h2 className={cn(LABEL, 'mt-6')}>바로가기</h2>
            <ul className="flex flex-wrap gap-x-4">
              {QUICK_LINKS.map((link) => (
                <li key={link.href} className="flex">
                  <Link href={link.href} className={ROW_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: 뉴스레터 구독 (feature-flagged) */}
          {showNewsletter && (
            <div>
              <NewsletterForm />
            </div>
          )}

          {/* Column 4: 연락처 */}
          <div>
            <h2 className={LABEL}>연락처</h2>
            <ul>
              <li className="flex">
                <a href="mailto:contact@livenews.co.kr" className={ROW_LINK}>
                  <MailIcon />
                  contact@livenews.co.kr
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border-muted" />

        {/* Bottom bar: copyright + AI disclaimer + stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-3 max-w-2xl text-caption leading-5 text-text-muted">
              본 서비스의 기사는 AI를 통해 번역 · 요약되었으며, 원문 저작권은 각 언론사에 있습니다.
              번역 과정에서 오류가 발생할 수 있으므로, 중요한 정보는 원문을 직접 확인하시기 바랍니다.
            </p>
            <FooterStats />
          </div>
          <p className="shrink-0 whitespace-nowrap text-caption text-text-muted" suppressHydrationWarning>
            &copy; {year} LiveNews. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
