// API URL 유틸리티: basePath가 설정된 서버 환경에서 fetch 호출 시 경로 보정
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function apiUrl(path: string): string {
  return `${basePath}${path}`
}
