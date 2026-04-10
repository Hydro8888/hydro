'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

interface ReportItem {
  id: string;
  type: string;
  description: string;
  evidence: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  reporter: { name: string; email: string };
  reported: { name: string; email: string };
  request?: { id: string; title: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  FRAUD: '사기',
  ABUSE: '욕설·폭언',
  NO_SHOW: '노쇼',
  QUALITY: '서비스 품질',
  OTHER: '기타',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: '접수됨',
  INVESTIGATING: '조사 중',
  RESOLVED: '해결 완료',
  DISMISSED: '기각',
};

export default function DisputesPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  async function fetchReports() {
    try {
      const res = await fetch('/simburum/api/reports?all=true');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function handleUpdateStatus(reportId: string, status: string) {
    setActionLoading(reportId);
    try {
      await fetch('/simburum/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status,
          resolution: resolutionText[reportId] || undefined,
        }),
      });
      await fetchReports();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">분쟁 관리</h1>
      <p className="text-gray-600 mb-8">신고 내역을 검토하고 조치를 취하세요.</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-gray-500">신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700">
                    {TYPE_LABELS[report.type] || report.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    report.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                    report.status === 'INVESTIGATING' ? 'bg-blue-50 text-blue-700' :
                    report.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {STATUS_LABELS[report.status] || report.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(new Date(report.createdAt))}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 mb-1">신고자</p>
                  <p className="text-sm text-gray-900">{report.reporter?.name}</p>
                  <p className="text-xs text-gray-500">{report.reporter?.email}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 mb-1">신고 대상</p>
                  <p className="text-sm text-gray-900">{report.reported?.name}</p>
                  <p className="text-xs text-gray-500">{report.reported?.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">신고 내용</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
              </div>

              {report.evidence && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">증거</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{report.evidence}</p>
                </div>
              )}

              {report.request && (
                <p className="text-xs text-gray-500 mb-4">관련 요청: {report.request.title} ({report.request.id})</p>
              )}

              {report.resolution && (
                <div className="p-3 bg-green-50 rounded-lg mb-4">
                  <p className="text-xs font-semibold text-green-700 mb-1">처리 결과</p>
                  <p className="text-sm text-green-600">{report.resolution}</p>
                </div>
              )}

              {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Input
                    as="textarea"
                    placeholder="처리 결과를 입력하세요..."
                    value={resolutionText[report.id] || ''}
                    onChange={(e) => setResolutionText((prev) => ({
                      ...prev,
                      [report.id]: (e.target as HTMLTextAreaElement).value,
                    }))}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus(report.id, 'INVESTIGATING')}
                      loading={actionLoading === report.id}
                      variant="secondary"
                      size="sm"
                    >
                      조사 시작
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                      loading={actionLoading === report.id}
                      size="sm"
                    >
                      해결 완료
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                      loading={actionLoading === report.id}
                      variant="danger"
                      size="sm"
                    >
                      기각
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
