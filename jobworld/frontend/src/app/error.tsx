'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">페이지 오류가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-6">
          {error?.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
        <div className="flex gap-3 justify-center">
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
