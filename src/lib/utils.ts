import type { Category, Status, Urgency } from '@/types';

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 * ex) 15000 => "15,000원"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 날짜를 한국어 형식으로 포맷합니다.
 * ex) 2026-04-10T09:30:00Z => "2026년 4월 10일 09:30"
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기 중',
  AI_REVIEWED: 'AI 검토 완료',
  MATCHED: '매칭 완료',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
  DISPUTED: '분쟁 중',
};

/**
 * 상태 코드를 한국어 레이블로 변환합니다.
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const CATEGORY_LABELS: Record<string, string> = {
  CLEANING: '청소',
  DELIVERY: '배달·운반',
  SHOPPING: '장보기·쇼핑',
  MOVING: '이사·운송',
  REPAIR: '수리·설치',
  ERRAND: '심부름',
  PET: '반려동물',
  CARE: '돌봄',
  OTHER: '기타',
};

/**
 * 카테고리 코드를 한국어 레이블로 변환합니다.
 */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const URGENCY_LABELS: Record<string, string> = {
  LOW: '여유',
  NORMAL: '보통',
  HIGH: '급함',
  URGENT: '긴급',
};

/**
 * 긴급도 코드를 한국어 레이블로 변환합니다.
 */
export function getUrgencyLabel(urgency: string): string {
  return URGENCY_LABELS[urgency] ?? urgency;
}

/**
 * 여러 className 문자열을 병합합니다.
 * falsy 값은 무시됩니다.
 * ex) cn('px-4', isActive && 'bg-blue-500', undefined) => "px-4 bg-blue-500"
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
