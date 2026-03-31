'use client';

import { useState, useEffect } from 'react';

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
  _count?: { articles: number };
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSource, setEditSource] = useState<Source | null>(null);

  const [form, setForm] = useState({
    sourceName: '', sourceType: 'RSS', country: 'global', language: 'en',
    baseUrl: '', feedUrl: '', crawlInterval: 180, isEnabled: true,
  });

  useEffect(() => { loadSources(); }, []);

  async function loadSources() {
    setLoading(true);
    try {
      const res = await fetch('/livenews/api/admin/sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editSource ? 'PUT' : 'POST';
    const body = editSource ? { ...form, id: editSource.id } : form;

    await fetch('/livenews/api/admin/sources', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setShowForm(false);
    setEditSource(null);
    setForm({
      sourceName: '', sourceType: 'RSS', country: 'global', language: 'en',
      baseUrl: '', feedUrl: '', crawlInterval: 180, isEnabled: true,
    });
    loadSources();
  }

  async function toggleSource(id: number, isEnabled: boolean) {
    await fetch('/livenews/api/admin/sources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isEnabled: !isEnabled }),
    });
    loadSources();
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

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">소스 관리 ({sources.length})</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditSource(null); }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? '취소' : '새 소스 추가'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-bold mb-4">{editSource ? '소스 수정' : '새 소스 추가'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소스명</label>
              <input type="text" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
              <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="RSS">RSS</option>
                <option value="API">API</option>
                <option value="SITEMAP">SITEMAP</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">국가</label>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="global">글로벌</option>
                <option value="us">미국</option>
                <option value="japan">일본</option>
                <option value="china">중국</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input type="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feed URL</label>
              <input type="url" value={form.feedUrl} onChange={(e) => setForm({ ...form, feedUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700">
              {editSource ? '수정' : '추가'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditSource(null); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              취소
            </button>
          </div>
        </form>
      )}

      {/* Sources Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">소스명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">타입</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">국가</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">언어</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">기사 수</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{source.sourceName}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{source.sourceType}</span></td>
                <td className="px-4 py-3">{source.country}</td>
                <td className="px-4 py-3">{source.language}</td>
                <td className="px-4 py-3">{source._count?.articles || 0}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSource(source.id, source.isEnabled)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${source.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {source.isEnabled ? '활성' : '비활성'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => startEdit(source)} className="text-primary hover:underline text-xs">수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
