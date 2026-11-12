'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminJson, hasRowsWithId, isAbortError, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import { BTN_GHOST_SM, BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL, TABLE_WRAP, TD, TD_MAIN, TD_NUM, TH, TH_NUM, TR, TR_SELECTED } from '@/lib/ui';
import { cn, countryLabel, formatCount } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';
import { ActiveToggle } from '@/components/AdminParts';
import PageHeading from '@/components/PageHeading';

interface Source {
  id: number;
  sourceName: string;
  sourceType: string;
  country: string;
  language: string;
  baseUrl: string;
  feedUrl: string | null;
  crawlInterval: number;
  isEnabled: boolean;
  createdAt: string;
  articleCount?: number;
}

// One wording for the stored codes, in the form and in the table.
const SOURCE_TYPES = ['RSS', 'API', 'SITEMAP', 'HTML'] as const;
const SOURCE_COUNTRIES = ['global', 'us', 'japan', 'china'] as const;
const SOURCE_LANGUAGES = [
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'zh', label: '중국어' },
  { code: 'ko', label: '한국어' },
] as const;
const languageName = (code: string) => SOURCE_LANGUAGES.find((l) => l.code === code)?.label ?? code;

const FIELD_LABEL = 'mb-2 block text-body-md text-text-secondary';

const isSourcesPayload = (json: unknown): json is { sources: Source[] } => hasRowsWithId(json, 'sources');

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; kind: AdminFetchErrorKind; code?: number };

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const controllerRef = useRef<AbortController | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editSource, setEditSource] = useState<Source | null>(null);

  const [form, setForm] = useState({
    sourceName: '', sourceType: 'RSS', country: 'global', language: 'en',
    baseUrl: '', feedUrl: '', crawlInterval: 180, isEnabled: true,
  });

  /**
   * (Re)load the list. `quiet` keeps the current table on screen (refresh after a change);
   * a failed load always replaces the table with an error box — never an empty "(0)" list.
   */
  const loadSources = useCallback(async (quiet = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!quiet) setLoad({ status: 'loading' });
    try {
      const r = await fetchAdminJson('/api/admin/sources', isSourcesPayload, { signal: controller.signal });
      if (r.ok) {
        setSources(r.data.sources);
        setLoad({ status: 'ready' });
      } else {
        setLoad({ status: 'error', kind: r.kind, code: r.status });
      }
    } catch (err) {
      if (!isAbortError(err)) setLoad({ status: 'error', kind: 'network' });
    }
  }, []);

  useEffect(() => {
    loadSources();
    return () => controllerRef.current?.abort();
  }, [loadSources]);

  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editSource ? 'PUT' : 'POST';
    const body = editSource ? { ...form, id: editSource.id } : form;

    setSaving(true);
    try {
      const res = await fetch(withBasePath('/api/admin/sources'), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      setEditSource(null);
      setForm({
        sourceName: '', sourceType: 'RSS', country: 'global', language: 'en',
        baseUrl: '', feedUrl: '', crawlInterval: 180, isEnabled: true,
      });
      loadSources(true);
    } catch (err) {
      alert(`소스를 저장하지 못했습니다\n${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSource(id: number, isEnabled: boolean) {
    // Optimistic update
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !isEnabled } : s))
    );
    try {
      const res = await fetch(withBasePath('/api/admin/sources'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isEnabled: !isEnabled }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadSources(true);
    } catch {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isEnabled } : s))
      );
      alert('소스 상태를 바꾸지 못했습니다\n잠시 후 다시 시도하세요');
    }
  }

  function startEdit(source: Source) {
    setEditSource(source);
    setForm({
      sourceName: source.sourceName, sourceType: source.sourceType,
      country: source.country, language: source.language,
      baseUrl: source.baseUrl, feedUrl: source.feedUrl || '',
      crawlInterval: source.crawlInterval, isEnabled: source.isEnabled,
    });
    setShowForm(true);
  }

  if (load.status !== 'ready') {
    return (
      <div>
        <PageHeading title="소스 관리" />
        {load.status === 'loading' ? (
          <AdminLoading />
        ) : (
          <AdminLoadError kind={load.kind} status={load.code} onRetry={() => loadSources()} />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* While the form is open its submit button is the screen's one primary action, and its
          "취소" the one way out: the head button is not shown then. */}
      <PageHeading title="소스 관리" count={sources.length} unit="개">
        {!showForm && (
          <button type="button" onClick={() => { setShowForm(true); setEditSource(null); }} className={BTN_PRIMARY}>
            소스 추가
          </button>
        )}
      </PageHeading>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={cn(PANEL, 'mb-6 p-5')}>
          <h2 className="mb-4 text-headline-sm text-text">{editSource ? '소스 수정' : '소스 추가'}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="src-name" className={FIELD_LABEL}>소스명</label>
              <input id="src-name" type="text" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} required className={FIELD} />
            </div>
            <div>
              <label htmlFor="src-type" className={FIELD_LABEL}>타입</label>
              <select id="src-type" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className={FIELD}>
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="src-country" className={FIELD_LABEL}>국가</label>
              <select id="src-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={FIELD}>
                {SOURCE_COUNTRIES.map((code) => (
                  <option key={code} value={code}>{countryLabel(code)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="src-language" className={FIELD_LABEL}>언어</label>
              <select id="src-language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={FIELD}>
                {SOURCE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="src-base-url" className={FIELD_LABEL}>기본 URL</label>
              <input id="src-base-url" type="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required className={FIELD} />
            </div>
            <div>
              <label htmlFor="src-feed-url" className={FIELD_LABEL}>피드 URL</label>
              <input id="src-feed-url" type="url" value={form.feedUrl} onChange={(e) => setForm({ ...form, feedUrl: e.target.value })} className={FIELD} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={BTN_PRIMARY}>
              {saving ? '저장 중' : editSource ? '수정' : '추가'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditSource(null); }} className={BTN_SECONDARY}>
              취소
            </button>
          </div>
        </form>
      )}

      {/* Sources Table. The row being edited is the selected one: a full surface step and an accent
          rule on its first cell, and it keeps that under the pointer and with focus inside it.
          On the other rows hover and keyboard focus are half a step. */}
      <div className={TABLE_WRAP}>
        <table className="w-full whitespace-nowrap text-body-md">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(TH, 'border-l-2 border-transparent')}>소스명</th>
              <th className={cn(TH, 'hidden sm:table-cell')}>타입</th>
              <th className={TH}>국가</th>
              <th className={cn(TH, 'hidden sm:table-cell')}>언어</th>
              <th className={TH_NUM}>기사 수</th>
              <th className={TH}>상태</th>
              <th className={TH}>작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {sources.map((source) => {
              const selected = showForm && editSource?.id === source.id;
              return (
                <tr key={source.id} data-selected={selected ? '' : undefined} className={selected ? TR_SELECTED : TR}>
                  <td className={cn(TD_MAIN, 'border-l-2', selected ? 'border-accent' : 'border-transparent')}>{source.sourceName}</td>
                  <td className={cn(TD, 'hidden sm:table-cell')}>{source.sourceType}</td>
                  <td className={TD}>{countryLabel(source.country)}</td>
                  <td className={cn(TD, 'hidden sm:table-cell')}>{languageName(source.language)}</td>
                  <td className={TD_NUM}>{formatCount(source.articleCount ?? 0)}</td>
                  <td className={TD}>
                    <ActiveToggle
                      on={source.isEnabled}
                      label={`${source.sourceName} ${source.isEnabled ? '비활성으로 전환' : '활성으로 전환'}`}
                      onToggle={() => toggleSource(source.id, source.isEnabled)}
                    />
                  </td>
                  <td className={TD}>
                    <button type="button" onClick={() => startEdit(source)} className={BTN_GHOST_SM}>
                      수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
