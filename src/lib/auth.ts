import { UserRole } from './constants/enums'

// Mock Auth: Phase 1에서는 간단한 쿠키/헤더 기반 역할 전환
// 추후 NextAuth.js로 전환 예정

export const MOCK_USERS = [
  { id: 'user-owner', email: 'owner@hydro.dev', name: '김소유', role: 'OWNER' as const },
  { id: 'user-manager', email: 'manager@hydro.dev', name: '이운영', role: 'MANAGER' as const },
  { id: 'user-reviewer', email: 'reviewer@hydro.dev', name: '박검수', role: 'REVIEWER' as const },
  { id: 'user-worker', email: 'worker@hydro.dev', name: '최실무', role: 'WORKER' as const },
]

export function getCurrentUser(role?: UserRole) {
  const targetRole = role ?? 'OWNER'
  return MOCK_USERS.find(u => u.role === targetRole) ?? MOCK_USERS[0]
}

export function getUserById(id: string) {
  return MOCK_USERS.find(u => u.id === id)
}
