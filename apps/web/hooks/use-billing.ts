'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api-url';

export function useBilling() {
  const [loading, setLoading] = useState(false);

  async function createCheckout(priceId: string): Promise<{ error?: string }> {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/billing/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error ?? '결제 서비스를 사용할 수 없습니다.' };
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
      return {};
    } catch {
      return { error: '네트워크 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }

  async function openPortal(): Promise<{ error?: string }> {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/billing/portal'), { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error ?? '포털을 열 수 없습니다.' };
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
      return {};
    } catch {
      return { error: '네트워크 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }

  return { createCheckout, openPortal, loading };
}
