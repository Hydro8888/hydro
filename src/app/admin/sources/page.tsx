'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminJson, hasRowsWithId, isAbortError, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';

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
      alert(`소스 저장에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
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
      alert('소스 상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
        <h1 className="text-2xl font-bold text-text mb-6">소스 관리</h1>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">소스 관리 ({sources.length})</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditSource(null); }}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          {showForm ? '취소' : '새 소스 추가'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-card rounded-lg shadow-card border border-border p-6 mb-6">
          <h2 className="font-bold mb-4 text-text">{editSource ? '소스 수정' : '새 소스 추가'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">소스명</label>
              <input type="text" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} required className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">타입</label>
              <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none">
                <option value="RSS">RSS</option>
                <option value="API">API</option>
                <option value="SITEMAP">SITEMAP</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">국가</label>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none">
                <option value="global">글로벌</option>
                <option value="us">미국</option>
                <option value="japan">일본</option>
                <option value="china">중국</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">언어</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none">
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base URL</label>
              <input type="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feed URL</label>
              <input type="url" value={form.feedUrl} onChange={(e) => setForm({ ...form, feedUrl: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border text-text rounded focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50">
              {saving ? '저장 중...' : editSource ? '수정' : '추가'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditSource(null); }} className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated">
              취소
            </button>
          </div>
        </form>
      )}

      {/* Sources Table */}
      <div className="bg-surface-card rounded-lg shadow-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">소스명</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">타입</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">국가</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">언어</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">기사 수</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-surface-elevated/50">
                <td className="px-4 py-3 font-medium text-text">{source.sourceName}</td>
                <td className="px-4 py-3 hidden sm:table-cell"><span className="px-2 py-0.5 bg-surface-elevated rounded text-xs text-text-secondary">{source.sourceType}</span></td>
                <td className="px-4 py-3 text-text-secondary">{source.country}</td>
                <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{source.language}</td>
                <td className="px-4 py-3 text-text">{(source.articleCount ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSource(source.id, source.isEnabled)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${source.isEnabled ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}
                  >
                    {source.isEnabled ? '활성' : '비활성'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => startEdit(source)} className="text-accent hover:underline text-xs">수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
