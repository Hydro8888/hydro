'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

interface ReportItem {
  id: string;
  type: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  reported: { name: string };
  request?: { title: string } | null;
}

const REPORT_TYPES = [
  { value: 'FRAUD', label: '사기' },
  { value: 'ABUSE', label: '욕설·폭언' },
  { value: 'NO_SHOW', label: '노쇼' },
  { value: 'QUALITY', label: '서비스 품질' },
  { value: 'OTHER', label: '기타' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: '접수됨',
  INVESTIGATING: '조사 중',
  RESOLVED: '해결 완료',
  DISMISSED: '기각',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-50 text-gray-700',
  INVESTIGATING: 'bg-yellow-50 text-yellow-700',
  RESOLVED: 'bg-green-50 text-green-700',
  DISMISSED: 'bg-red-50 text-red-700',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    requestId: '',
    reportedId: '',
    type: 'OTHER',
    description: '',
    evidence: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/simburum/api/reports');
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [formSuccess]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/simburum/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: form.requestId || undefined,
          reportedId: form.reportedId,
          type: form.type,
          description: form.description,
          evidence: form.evidence || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || '신고 접수에 실패했습니다.');
        return;
      }
      setFormSuccess(true);
      setShowForm(false);
      setForm({ requestId: '', reportedId: '', type: 'OTHER', description: '', evidence: '' });
    } catch {
      setFormError('신고 접수 중 오류가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신고</h1>
          <p className="text-gray-600 mt-1">문제를 신고하고 처리 현황을 확인하세요.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} size="sm">
          {showForm ? '취소' : '신고하기'}
        </Button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">신고 접수</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <Input
              label="관련 요청 ID"
              type="text"
              placeholder="선택사항"
              value={form.requestId}
              onChange={(e) => setForm((prev) => ({ ...prev, requestId: (e.target as HTMLInputElement).value }))}
              hint="관련된 요청이 있으면 ID를 입력하세요"
            />

            <Input
              label="신고 대상 사용자 ID"
              type="text"
              placeholder="신고할 사용자의 ID"
              value={form.reportedId}
              onChange={(e) => setForm((prev) => ({ ...prev, reportedId: (e.target as HTMLInputElement).value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                신고 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="input-field"
                required
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <Input
              as="textarea"
              label="상세 설명"
              placeholder="발생한 문제를 자세히 설명해주세요."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: (e.target as HTMLTextAreaElement).value }))}
              rows={4}
              required
            />

            <Input
              as="textarea"
              label="증거 자료"
              placeholder="스크린샷 URL이나 추가 증거를 입력하세요. (선택사항)"
              value={form.evidence}
              onChange={(e) => setForm((prev) => ({ ...prev, evidence: (e.target as HTMLTextAreaElement).value }))}
              rows={2}
            />

            <Button type="submit" loading={formLoading}>신고 접수</Button>
          </form>
        </div>
      )}

      {formSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-6">
          신고가 접수되었습니다. 운영팀이 검토 후 조치하겠습니다.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-gray-500">신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      {REPORT_TYPES.find((t) => t.value === report.type)?.label || report.type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status] || 'bg-gray-50 text-gray-700'}`}>
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{report.description}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{formatDate(new Date(report.createdAt))}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>대상: {report.reported?.name}</span>
                {report.request && <span>요청: {report.request.title}</span>}
              </div>
              {report.resolution && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <span className="font-medium">처리 결과:</span> {report.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
