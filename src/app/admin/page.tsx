'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAdminJson, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import { BTN_GHOST_SM, BTN_PRIMARY, BTN_SECONDARY, NUM, PANEL, TABLE_WRAP, TD, TD_MAIN, TD_NUM, TD_TIME, TH, TH_NUM, TR } from '@/lib/ui';
import { categoryLabel, cn, countryLabel, formatCount, formatDate } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';
import { AdminStat, LogStatus } from '@/components/AdminParts';
import PageHeading from '@/components/PageHeading';

interface Stats {
  totalArticles: number;
  articlesToday: number;
  activeSources: number;
  failedCollections: number;
  byCountry: Array<{ country: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  recentLogs: Array<{
    id: number;
    status: string;
    articlesFound: number;
    articlesNew: number;
    errorMessage: string | null;
    startedAt: string;
    source: { sourceName: string };
  }>;
}

/** Minimal guard: the numbers and lists the dashboard renders. */
function isStats(json: unknown): json is Stats {
  return (
    isRecord(json) &&
    typeof json.totalArticles === 'number' &&
    typeof json.articlesToday === 'number' &&
    typeof json.activeSources === 'number' &&
    typeof json.failedCollections === 'number' &&
    Array.isArray(json.byCountry) &&
    Array.isArray(json.byCategory) &&
    Array.isArray(json.recentLogs)
  );
}

/** Result of POST /api/admin/fix-translations in Korean (the API's own `message` is an English sentence). */
function healSummary(json: unknown): string {
  if (
    isRecord(json) &&
    typeof json.titlesFixed === 'number' &&
    typeof json.contentFixed === 'number' &&
    typeof json.remainingTitles === 'number' &&
    typeof json.remainingContent === 'number'
  ) {
    return (
      `제목 ${formatCount(json.titlesFixed)}건, 본문 ${formatCount(json.contentFixed)}건을 번역했습니다\n` +
      `남은 제목 ${formatCount(json.remainingTitles)}건 · 본문 ${formatCount(json.remainingContent)}건`
    );
  }
  return '번역 보정을 마쳤습니다';
}

const LIST_PANEL_TITLE = 'mb-3 text-headline-sm text-text';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; stats: Stats }
  | { status: 'error'; kind: AdminFetchErrorKind; code?: number };

export default function AdminDashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchAdminJson('/api/admin/stats', isStats, { signal: controller.signal })
      .then((r) => setState(r.ok ? { status: 'ready', stats: r.data } : { status: 'error', kind: r.kind, code: r.status }))
      .catch((err) => {
        if (!isAbortError(err)) setState({ status: 'error', kind: 'network' });
      });
    return () => controller.abort();
  }, [reloadKey]);

  async function triggerCollection() {
    setCollecting(true);
    try {
      const res = await fetch(withBasePath('/api/collect'), { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert('수집을 시작했습니다');
    } catch {
      alert('수집을 시작하지 못했습니다\n잠시 후 다시 시도하세요');
    } finally {
      setCollecting(false);
    }
  }

  async function fixTranslations() {
    setFixing(true);
    try {
      const res = await fetch(withBasePath('/api/admin/fix-translations?titles=500&content=30'), {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert(healSummary(await res.json()));
    } catch {
      alert('번역을 보정하지 못했습니다\n잠시 후 다시 시도하세요');
    } finally {
      setFixing(false);
    }
  }

  if (state.status !== 'ready') {
    return (
      <div>
        <PageHeading title="관리자 대시보드" />
        {state.status === 'loading' ? (
          <AdminLoading />
        ) : (
          <AdminLoadError kind={state.kind} status={state.code} onRetry={() => setReloadKey((k) => k + 1)} />
        )}
      </div>
    );
  }

  const { stats } = state;

  return (
    <div>
      <PageHeading title="관리자 대시보드">
        <button
          type="button"
          onClick={fixTranslations}
          disabled={fixing}
          className={BTN_SECONDARY}
          title="한글 번역이 누락된 기사 제목/요약/본문을 일괄 재번역합니다 (500건씩)"
        >
          {fixing ? '번역 보정 중' : '미번역 보정'}
        </button>
        <button type="button" onClick={triggerCollection} disabled={collecting} className={BTN_PRIMARY}>
          {collecting ? '수집 중' : '수동 수집 실행'}
        </button>
      </PageHeading>

      {/* Figures only. The third line says what each one is counted over (see api/admin/stats). */}
      <dl className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <AdminStat label="전체 기사" value={stats.totalArticles} basis="비활성 제외" />
        <AdminStat label="오늘 수집" value={stats.articlesToday} basis="KST 0시부터" />
        <AdminStat label="활성 소스" value={stats.activeSources} basis="수집 대상" />
        <AdminStat
          label="수집 실패 소스"
          value={stats.failedCollections}
          basis="최근 24시간"
          alert={stats.failedCollections > 0}
        />
      </dl>

      {/* Two lists, each as tall as its own rows */}
      <div className="mb-8 grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <div className={cn(PANEL, 'p-5')}>
          <h2 className={LIST_PANEL_TITLE}>국가별 기사 수</h2>
          <ul className="space-y-1">
            {stats.byCountry.map((item) => (
              <li key={item.country} className="flex h-8 items-center justify-between gap-3">
                <span className="text-body-md text-text-secondary">{countryLabel(item.country)}</span>
                <span className={cn('text-body-md text-text', NUM)}>{formatCount(item.count)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(PANEL, 'p-5')}>
          <h2 className={LIST_PANEL_TITLE}>카테고리별 기사 수</h2>
          <ul className="space-y-1">
            {stats.byCategory.slice(0, 10).map((item) => (
              <li key={item.category} className="flex h-8 items-center justify-between gap-3">
                <span className="text-body-md text-text-secondary">{item.category ? categoryLabel(item.category) : '미분류'}</span>
                <span className={cn('text-body-md text-text', NUM)}>{formatCount(item.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Collection Logs */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-headline-sm text-text">최근 수집 로그</h2>
        <Link href="/admin/logs" className={BTN_GHOST_SM}>
          전체 보기
        </Link>
      </div>
      <div className={TABLE_WRAP}>
        <table className="w-full whitespace-nowrap text-body-md">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>소스</th>
              <th className={TH}>상태</th>
              <th className={cn(TH_NUM, 'hidden sm:table-cell')}>발견</th>
              <th className={cn(TH_NUM, 'hidden sm:table-cell')}>신규</th>
              <th className={TH}>시작</th>
              <th className={cn(TH, 'hidden sm:table-cell')}>오류</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {stats.recentLogs.map((log) => (
              <tr key={log.id} className={TR}>
                <td className={TD_MAIN}>{log.source.sourceName}</td>
                <td className={TD}>
                  <LogStatus log={log} />
                </td>
                <td className={cn(TD_NUM, 'hidden sm:table-cell')}>{formatCount(log.articlesFound)}</td>
                <td className={cn(TD_NUM, 'hidden sm:table-cell')}>{formatCount(log.articlesNew)}</td>
                <td className={TD_TIME}>{formatDate(log.startedAt) || '-'}</td>
                <td className={cn(TD, 'hidden max-w-xs truncate sm:table-cell')} title={log.errorMessage ?? undefined}>
                  {log.errorMessage ? <span className="text-negative">{log.errorMessage}</span> : '-'}
                </td>
              </tr>
            ))}
            {stats.recentLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="h-24 px-4 text-center text-text-muted">
                  수집 로그가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
