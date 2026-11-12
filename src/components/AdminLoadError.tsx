'use client';

import type { AdminFetchErrorKind } from '@/lib/admin-fetch';
import { BTN_SECONDARY, NUM, PANEL } from '@/lib/ui';

const MESSAGES: Record<AdminFetchErrorKind, { title: string; detail: string }> = {
  auth: { title: '관리자 인증이 필요합니다', detail: '페이지를 새로고침해 다시 로그인하세요' },
  server: { title: '데이터를 불러오지 못했습니다', detail: '서버 오류 · 잠시 후 다시 시도하세요' },
  invalid: { title: '데이터를 불러오지 못했습니다', detail: '응답 형식이 올바르지 않습니다 · 잠시 후 다시 시도하세요' },
  network: { title: '서버에 연결할 수 없습니다', detail: '네트워크 연결을 확인하세요' },
};

interface AdminLoadErrorProps {
  kind: AdminFetchErrorKind;
  status?: number;
  onRetry: () => void;
}

/** Takes the place of an admin table when its data could not be loaded — never an empty "(0)" list. */
export default function AdminLoadError({ kind, status, onRetry }: AdminLoadErrorProps) {
  const msg = MESSAGES[kind];
  return (
    <div className={`${PANEL} px-6 py-10 text-center`}>
      {/* The error color is on the rule only; the message itself stays in the text colors. */}
      <div role="alert" className="inline-block max-w-md border-l-2 border-negative pl-3 text-left">
        <p className="text-headline-sm text-text">{msg.title}</p>
        <p className="mt-1 text-body-md text-text-secondary">
          {msg.detail}
          {status ? <span className={`ml-1 text-meta text-text-muted ${NUM}`}>(HTTP {status})</span> : null}
        </p>
      </div>
      <div className="mt-5">
        <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
          다시 시도
        </button>
      </div>
    </div>
  );
}

/** Loading indicator for admin screens (announced to screen readers). */
export function AdminLoading() {
  return (
    <div role="status" className="py-20 text-center">
      <div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-text-secondary" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
