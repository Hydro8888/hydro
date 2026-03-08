'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Search Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-3xl mb-4">⚠️</p>
        <h1 className="text-lg font-bold text-gray-800 mb-2">검색 중 오류가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-1">
          {error?.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4">오류 코드: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-full hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}
