// 이 파일은 Prisma 스키마의 enum을 프론트엔드에서도 사용할 수 있도록 미러링한다.
// Prisma 클라이언트가 없는 컴포넌트에서 타입 안전하게 사용 가능.

export const AutomationGrade = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const
export type AutomationGrade = (typeof AutomationGrade)[keyof typeof AutomationGrade]

export const AutomationGradeLabel: Record<AutomationGrade, string> = {
  A: 'Autopilot',
  B: 'Approval',
  C: 'Assisted',
}

export const AutomationGradeDescription: Record<AutomationGrade, string> = {
  A: '시스템이 자동으로 실행합니다',
  B: '승인 후 시스템이 실행합니다',
  C: '시스템이 안내하고, 담당자가 직접 실행합니다',
}

export const ChannelConnectionStatus = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  FAILED: 'FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  REAUTH_REQUIRED: 'REAUTH_REQUIRED',
  SUSPENDED: 'SUSPENDED',
} as const
export type ChannelConnectionStatus = (typeof ChannelConnectionStatus)[keyof typeof ChannelConnectionStatus]

export const ChannelConnectionStatusLabel: Record<ChannelConnectionStatus, string> = {
  DISCONNECTED: '미연결',
  CONNECTING: '연결 요청 중',
  CONNECTED: '연결 완료',
  FAILED: '연결 실패',
  INSUFFICIENT_PERMISSIONS: '권한 부족',
  REAUTH_REQUIRED: '재인증 필요',
  SUSPENDED: '운영 중지',
}

export const TaskStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  APPROVAL_NEEDED: 'APPROVAL_NEEDED',
  USER_ACTION_NEEDED: 'USER_ACTION_NEEDED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRY_PENDING: 'RETRY_PENDING',
  REJECTED: 'REJECTED',
  ON_HOLD: 'ON_HOLD',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const TaskStatusLabel: Record<TaskStatus, string> = {
  CREATED: '생성됨',
  PENDING: '대기 중',
  RUNNING: '실행 중',
  APPROVAL_NEEDED: '승인 필요',
  USER_ACTION_NEEDED: '사용자 작업 필요',
  COMPLETED: '완료',
  FAILED: '실패',
  RETRY_PENDING: '재시도 대기',
  REJECTED: '반려됨',
  ON_HOLD: '보류됨',
}

export const ApprovalStatus = {
  REVIEW_PENDING: 'REVIEW_PENDING',
  REVIEWING: 'REVIEWING',
  APPROVED: 'APPROVED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus]

export const ApprovalStatusLabel: Record<ApprovalStatus, string> = {
  REVIEW_PENDING: '검토 대기',
  REVIEWING: '검토 중',
  APPROVED: '승인',
  REVISION_REQUESTED: '수정 요청',
  REJECTED: '반려',
  EXPIRED: '만료',
}

export const AssistedTaskStatus = {
  CREATED: 'CREATED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  EVIDENCE_PENDING: 'EVIDENCE_PENDING',
  REVIEW_PENDING: 'REVIEW_PENDING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const
export type AssistedTaskStatus = (typeof AssistedTaskStatus)[keyof typeof AssistedTaskStatus]

export const AssistedTaskStatusLabel: Record<AssistedTaskStatus, string> = {
  CREATED: '생성됨',
  INSUFFICIENT_DATA: '자료 부족',
  ASSIGNED: '담당자 할당 완료',
  IN_PROGRESS: '진행 중',
  EVIDENCE_PENDING: '완료 증빙 대기',
  REVIEW_PENDING: '검수 대기',
  COMPLETED: '완료',
  REJECTED: '반려',
}

export const GoalType = {
  SIGNUP_INCREASE: 'SIGNUP_INCREASE',
  APP_INSTALL_INCREASE: 'APP_INSTALL_INCREASE',
  SEARCH_TRAFFIC_INCREASE: 'SEARCH_TRAFFIC_INCREASE',
  LOCAL_EXPOSURE_INCREASE: 'LOCAL_EXPOSURE_INCREASE',
  INQUIRY_INCREASE: 'INQUIRY_INCREASE',
  BRAND_AWARENESS: 'BRAND_AWARENESS',
  REVIEW_MANAGEMENT: 'REVIEW_MANAGEMENT',
  CUSTOM: 'CUSTOM',
} as const
export type GoalType = (typeof GoalType)[keyof typeof GoalType]

export const GoalTypeLabel: Record<GoalType, string> = {
  SIGNUP_INCREASE: '회원가입 증가',
  APP_INSTALL_INCREASE: '앱 설치 증가',
  SEARCH_TRAFFIC_INCREASE: '검색 유입 증가',
  LOCAL_EXPOSURE_INCREASE: '지역 노출 증가',
  INQUIRY_INCREASE: '문의 증가',
  BRAND_AWARENESS: '브랜드 인지도 향상',
  REVIEW_MANAGEMENT: '리뷰 관리',
  CUSTOM: '직접 입력',
}

export const ServiceType = {
  WEB_SERVICE: 'WEB_SERVICE',
  MOBILE_APP: 'MOBILE_APP',
  LOCAL_BUSINESS: 'LOCAL_BUSINESS',
  SAAS: 'SAAS',
  ECOMMERCE: 'ECOMMERCE',
  CONTENT_PLATFORM: 'CONTENT_PLATFORM',
  OTHER: 'OTHER',
} as const
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

export const ServiceTypeLabel: Record<ServiceType, string> = {
  WEB_SERVICE: '웹 서비스',
  MOBILE_APP: '모바일 앱',
  LOCAL_BUSINESS: '로컬 비즈니스',
  SAAS: 'SaaS',
  ECOMMERCE: '이커머스',
  CONTENT_PLATFORM: '콘텐츠 플랫폼',
  OTHER: '기타',
}

export const TaskType = {
  CHANNEL_REGISTRATION: 'CHANNEL_REGISTRATION',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  CONTENT_PUBLISH: 'CONTENT_PUBLISH',
  REVIEW_RESPONSE: 'REVIEW_RESPONSE',
  INFO_SYNC: 'INFO_SYNC',
  MONITORING: 'MONITORING',
  SEO_OPTIMIZATION: 'SEO_OPTIMIZATION',
  IMAGE_UPDATE: 'IMAGE_UPDATE',
  DESCRIPTION_UPDATE: 'DESCRIPTION_UPDATE',
  CTA_UPDATE: 'CTA_UPDATE',
} as const
export type TaskType = (typeof TaskType)[keyof typeof TaskType]

export const TaskTypeLabel: Record<TaskType, string> = {
  CHANNEL_REGISTRATION: '채널 등록',
  PROFILE_UPDATE: '프로필 업데이트',
  CONTENT_PUBLISH: '콘텐츠 게시',
  REVIEW_RESPONSE: '리뷰 응답',
  INFO_SYNC: '정보 동기화',
  MONITORING: '모니터링',
  SEO_OPTIMIZATION: 'SEO 최적화',
  IMAGE_UPDATE: '이미지 업데이트',
  DESCRIPTION_UPDATE: '설명문 업데이트',
  CTA_UPDATE: 'CTA 업데이트',
}

export const NotificationPriority = {
  URGENT: 'URGENT',
  IMPORTANT: 'IMPORTANT',
  NORMAL: 'NORMAL',
  RECOMMENDATION: 'RECOMMENDATION',
} as const
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority]

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

export const UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  REVIEWER: 'REVIEWER',
  WORKER: 'WORKER',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const UserRoleLabel: Record<UserRole, string> = {
  OWNER: '소유자',
  MANAGER: '운영 관리자',
  REVIEWER: '검수자',
  WORKER: '실무자',
}
