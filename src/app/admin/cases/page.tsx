'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getCategoryLabel, formatDate } from '@/lib/utils';

interface CaseItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  duration: string | null;
  satisfaction: number | null;
  reused: boolean;
  published: boolean;
  createdAt: string;
}

const CATEGORIES = [
  'CLEANING', 'DELIVERY', 'SHOPPING', 'MOVING', 'REPAIR', 'ERRAND', 'PET', 'CARE', 'OTHER',
];

export default function AdminCasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const [form, setForm] = useState({
    category: 'ERRAND',
    title: '',
    summary: '',
    duration: '',
    satisfaction: '',
    reused: false,
    published: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchCases() {
    try {
      const res = await fetch('/simburum/api/requests?type=cases');
      const data = await res.json();
      setCases(Array.isArray(data) ? data : data.cases || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, []);

  async function handleSubmitCase(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/simburum/api/requests?type=cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          satisfaction: form.satisfaction ? parseFloat(form.satisfaction) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || '사례 등록에 실패했습니다.');
        return;
      }
      setShowForm(false);
      setForm({ category: 'ERRAND', title: '', summary: '', duration: '', satisfaction: '', reused: false, published: true });
      await fetchCases();
    } catch {
      setFormError('사례 등록 중 오류가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleTogglePublish(caseId: string, published: boolean) {
    setActionLoading(caseId);
    try {
      await fetch('/simburum/api/requests?type=cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, published: !published }),
      });
      await fetchCases();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">성공 사례 관리</h1>
          <p className="text-gray-600 mt-1">성공 사례를 등록하고 공개 여부를 관리합니다.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} size="sm">
          {showForm ? '취소' : '새 사례 등록'}
        </Button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">새 성공 사례</h2>
          <form onSubmit={handleSubmitCase} className="space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>

            <Input
              label="제목"
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
              required
            />

            <Input
              as="textarea"
              label="요약"
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: (e.target as HTMLTextAreaElement).value }))}
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="소요 시간"
                type="text"
                placeholder="예: 30분"
                value={form.duration}
                onChange={(e) => setForm((prev) => ({ ...prev, duration: (e.target as HTMLInputElement).value }))}
              />
              <Input
                label="만족도 (1~5)"
                type="number"
                placeholder="예: 4.8"
                value={form.satisfaction}
                onChange={(e) => setForm((prev) => ({ ...prev, satisfaction: (e.target as HTMLInputElement).value }))}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.reused}
                  onChange={(e) => setForm((prev) => ({ ...prev, reused: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                재이용 사례
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                바로 공개
              </label>
            </div>

            <Button type="submit" loading={formLoading}>등록</Button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-gray-500">등록된 사례가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {getCategoryLabel(c.category)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.published ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                      {c.published ? '공개' : '비공개'}
                    </span>
                    {c.reused && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">재이용</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{c.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {c.duration && <span>소요: {c.duration}</span>}
                    {c.satisfaction && <span>만족도: {c.satisfaction}</span>}
                    <span>{formatDate(new Date(c.createdAt))}</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleTogglePublish(c.id, c.published)}
                  loading={actionLoading === c.id}
                  variant={c.published ? 'secondary' : 'primary'}
                  size="sm"
                >
                  {c.published ? '비공개로' : '공개하기'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
