'use client';

import type { AdminFetchErrorKind } from '@/lib/admin-fetch';

const MESSAGES: Record<AdminFetchErrorKind, { title: string; detail: string }> = {
  auth: { title: '관리자 인증이 필요합니다', detail: '페이지를 새로고침해 다시 로그인하세요.' },
  server: { title: '데이터를 불러오지 못했습니다(서버 오류)', detail: '잠시 후 다시 시도하세요.' },
  invalid: { title: '데이터를 불러오지 못했습니다(서버 오류)', detail: '응답 형식이 올바르지 않습니다. 잠시 후 다시 시도하세요.' },
  network: { title: '네트워크 연결을 확인하세요', detail: '서버에 연결할 수 없습니다.' },
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
    <div className="bg-surface-card border border-border rounded-lg px-6 py-10 text-center">
      <div role="alert" className="border-l-2 border-accent/60 pl-3 text-left inline-block max-w-md">
        <p className="text-headline-sm text-text">{msg.title}</p>
        <p className="mt-1 text-body-md text-text-secondary">
          {msg.detail}
          {status ? <span className="ml-1 text-caption text-text-muted tabular-nums">(HTTP {status})</span> : null}
        </p>
      </div>
      <div className="mt-5">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 border border-border text-text rounded-lg hover:bg-surface-elevated transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

/** Loading indicator for admin screens (announced to screen readers). */
export function AdminLoading() {
  return (
    <div role="status" className="text-center py-20">
      <div aria-hidden="true" className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
