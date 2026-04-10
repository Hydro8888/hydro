'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getCategoryLabel, getUrgencyLabel, formatCurrency } from '@/lib/utils';
import type { AIClassifyResult } from '@/types';

const CATEGORIES = [
  'CLEANING', 'DELIVERY', 'SHOPPING', 'MOVING', 'REPAIR', 'ERRAND', 'PET', 'CARE', 'OTHER',
] as const;

const URGENCIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCategory = searchParams.get('category') || '';

  const [naturalInput, setNaturalInput] = useState('');
  const [aiResult, setAiResult] = useState<AIClassifyResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: preCategory || 'ERRAND',
    urgency: 'NORMAL',
    budget: '',
    location: '',
    scheduledAt: '',
    description: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAIClassify() {
    if (!naturalInput.trim()) return;
    setAiLoading(true);
    setAiError('');

    try {
      const res = await fetch('/simburum/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: naturalInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'AI 분석에 실패했습니다.');
        return;
      }

      setAiResult(data);
      setForm((prev) => ({
        ...prev,
        category: data.category || prev.category,
        urgency: data.urgency || prev.urgency,
        title: naturalInput.slice(0, 50),
        description: naturalInput,
      }));
    } catch {
      setAiError('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    try {
      const res = await fetch('/simburum/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || naturalInput,
          naturalInput,
          category: form.category,
          urgency: form.urgency,
          budget: form.budget ? parseFloat(form.budget) : undefined,
          location: form.location || undefined,
          scheduledAt: form.scheduledAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || '요청 생성에 실패했습니다.');
        return;
      }

      router.push(`/dashboard/requests/${data.id}`);
    } catch {
      setSubmitError('요청 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">새 요청 만들기</h1>
      <p className="text-gray-600 mb-8">필요한 도움을 자유롭게 적어주세요. AI가 분석해드립니다.</p>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">무엇을 도와드릴까요?</h2>
        <Input
          as="textarea"
          placeholder="예: 내일 오후 2시까지 강남역 근처 인쇄소에서 A4 서류 10부 컬러 출력해서 삼성동 사무실로 가져다주세요."
          value={naturalInput}
          onChange={(e) => setNaturalInput((e.target as HTMLTextAreaElement).value)}
          rows={4}
        />
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleAIClassify}
            loading={aiLoading}
            disabled={!naturalInput.trim()}
            variant="accent"
          >
            AI 분석
          </Button>
          {aiError && (
            <span className="text-sm text-red-600">{aiError}</span>
          )}
        </div>
      </div>

      {aiResult && (
        <div className="card mb-6 bg-accent-50 border-accent-200">
          <h3 className="font-bold text-accent-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI 분석 결과
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">카테고리:</span>{' '}
              <span className="font-medium text-gray-900">{getCategoryLabel(aiResult.category)}</span>
            </div>
            <div>
              <span className="text-gray-500">긴급도:</span>{' '}
              <span className="font-medium text-gray-900">{getUrgencyLabel(aiResult.urgency)}</span>
            </div>
            <div>
              <span className="text-gray-500">예상 비용:</span>{' '}
              <span className="font-medium text-gray-900">
                {formatCurrency(aiResult.suggestedMin)} ~ {formatCurrency(aiResult.suggestedMax)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">위험도:</span>{' '}
              <span className={`font-medium ${
                aiResult.riskLevel === 'LOW' ? 'text-green-600' :
                aiResult.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {aiResult.riskLevel}
              </span>
            </div>
          </div>
          {aiResult.missingInfo.length > 0 && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-xs font-semibold text-gray-700 mb-1">추가 정보가 필요합니다:</p>
              <ul className="space-y-1">
                {aiResult.missingInfo.map((info) => (
                  <li key={info} className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <h2 className="text-lg font-bold text-gray-900">요청 상세 정보</h2>

        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}

        <Input
          label="제목"
          type="text"
          placeholder="요청 제목을 입력하세요"
          value={form.title}
          onChange={(e) => updateField('title', (e.target as HTMLInputElement).value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="input-field"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              긴급도
            </label>
            <select
              value={form.urgency}
              onChange={(e) => updateField('urgency', e.target.value)}
              className="input-field"
            >
              {URGENCIES.map((u) => (
                <option key={u} value={u}>{getUrgencyLabel(u)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="예산 (원)"
            type="number"
            placeholder="예: 15000"
            value={form.budget}
            onChange={(e) => updateField('budget', (e.target as HTMLInputElement).value)}
            hint={aiResult ? `AI 추천: ${formatCurrency(aiResult.suggestedMin)} ~ ${formatCurrency(aiResult.suggestedMax)}` : undefined}
          />

          <Input
            label="위치"
            type="text"
            placeholder="예: 서울 강남구"
            value={form.location}
            onChange={(e) => updateField('location', (e.target as HTMLInputElement).value)}
          />
        </div>

        <Input
          label="희망 일시"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => updateField('scheduledAt', (e.target as HTMLInputElement).value)}
        />

        <Input
          as="textarea"
          label="상세 설명"
          placeholder="요청에 대한 추가 설명을 입력하세요"
          value={form.description}
          onChange={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
          rows={4}
          required
        />

        <Button type="submit" fullWidth loading={submitLoading} size="lg">
          요청 등록하기
        </Button>
      </form>
    </div>
  );
}
