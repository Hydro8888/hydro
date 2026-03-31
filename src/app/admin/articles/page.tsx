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
    await fetch(`/livenews/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadArticles();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">기사 관리 ({total})</h1>
        <div className="flex gap-2">
          <select value={filter.country} onChange={(e) => { setFilter({ ...filter, country: e.target.value }); setPage(1); }} className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="">전체 국가</option>
            <option value="global">글로벌</option>
            <option value="us">미국</option>
            <option value="japan">일본</option>
            <option value="china">중국</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">소스</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">국가</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">카테고리</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">조회</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{article.id}</td>
                <td className="px-4 py-3 max-w-md">
                  <Link href={`/article/${article.id}`} className="hover:text-primary line-clamp-1">
                    {article.titleKo || article.titleOriginal}
                  </Link>
                </td>
                <td className="px-4 py-3">{article.source.sourceName}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{article.country}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{article.categoryPrimary || '-'}</td>
                <td className="px-4 py-3">{article.viewCount}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(article.id, article.isActive)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${article.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
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
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">이전</button>
        <span className="px-4 py-2 text-sm text-gray-600">페이지 {page}</span>
        <button disabled={articles.length < 30} onClick={() => setPage(page + 1)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">다음</button>
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-400">로딩 중...</div>
      )}
    </div>
  );
}
