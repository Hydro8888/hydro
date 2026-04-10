'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentItem {
  id: string;
  requestId: string;
  amount: number;
  platformFee: number;
  status: string;
  method: string | null;
  createdAt: string;
  request?: { title: string };
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: '결제 대기',
  HELD: '에스크로 보관 중',
  RELEASED: '정산 완료',
  REFUNDED: '환불 완료',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-50 text-gray-700',
  HELD: 'bg-yellow-50 text-yellow-700',
  RELEASED: 'bg-green-50 text-green-700',
  REFUNDED: 'bg-red-50 text-red-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch('/simburum/api/payments');
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : data.payments || []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const activeEscrow = payments.filter((p) => p.status === 'HELD');
  const totalEscrow = activeEscrow.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제</h1>
      <p className="text-gray-600 mb-8">결제 내역 및 에스크로 현황을 확인하세요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card bg-green-50 border-green-200 text-center">
          <p className="text-sm text-green-700 font-medium">플랫폼 수수료</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">0원</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">에스크로 보관 중</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(totalEscrow)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">총 결제 건수</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}건</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 card">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <p className="text-gray-500">결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">요청</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">금액</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">수수료</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">상태</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.request?.title || payment.requestId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(payment.platformFee)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${PAYMENT_STATUS_COLORS[payment.status] || 'bg-gray-50 text-gray-700'}`}>
                      {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(new Date(payment.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
