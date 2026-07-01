'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  id: number;
  titleOriginal: string;
  titleKo: string | null;
  country: string;
  categoryPrimary: string | null;
  publishedAt: string | null;
  isActive: boolean;
  viewCount: number;
  source: { sourceName: string };
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ country: '', category: '' });

  useEffect(() => { loadArticles(); }, [page, filter]);

  async function loadArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (filter.country) params.set('country', filter.country);
      if (filter.category) params.set('category', filter.category);
      const res = await fetch(`/livenews/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch {
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: number, isActive: boolean) {
    // Optimistic update for instant feedback
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
    );
    try {
      const res = await fetch(`/livenews/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadArticles();
    } catch {
      // Roll back optimistic change and notify
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive } : a))
      );
      alert('상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">기사 관리 ({total})</h1>
        <div className="flex gap-2">
          <select value={filter.country} onChange={(e) => { setFilter({ ...filter, country: e.target.value }); setPage(1); }} className="text-sm bg-surface border border-border text-text rounded px-2 py-1 focus:border-accent focus:outline-none">
            <option value="">전체 국가</option>
            <option value="global">글로벌</option>
            <option value="us">미국</option>
            <option value="japan">일본</option>
            <option value="china">중국</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-card rounded-lg shadow-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">ID</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">제목</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">소스</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">국가</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">카테고리</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">조회</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-surface-elevated/50">
                <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{article.id}</td>
                <td className="px-4 py-3 max-w-md">
                  <Link href={`/article/${article.id}`} className="text-text hover:text-accent line-clamp-1">
                    {article.titleKo || article.titleOriginal}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{article.source.sourceName}</td>
                <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{article.country}</td>
                <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{article.categoryPrimary || '-'}</td>
                <td className="px-4 py-3 text-text">{article.viewCount}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(article.id, article.isActive)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${article.isActive ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}
                  >
                    {article.isActive ? '활성' : '비활성'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50">이전</button>
        <span className="px-4 py-2 text-sm text-text-secondary">페이지 {page}</span>
        <button disabled={articles.length < 30} onClick={() => setPage(page + 1)} className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50">다음</button>
      </div>

      {loading && (
        <div className="text-center py-4 text-text-muted">로딩 중...</div>
      )}
    </div>
  );
}
