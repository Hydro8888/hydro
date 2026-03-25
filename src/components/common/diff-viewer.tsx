'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DiffViewerProps {
  before: any
  after: any
  title?: string
}

function renderValue(val: any): string {
  if (val === null || val === undefined) return '(없음)'
  if (typeof val === 'string') return val
  return JSON.stringify(val, null, 2)
}

export function DiffViewer({ before, after, title }: DiffViewerProps) {
  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-red-600">변경 전</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <pre className="whitespace-pre-wrap text-sm bg-red-50 p-3 rounded-md">
              {renderValue(before)}
            </pre>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-green-600">변경 후</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <pre className="whitespace-pre-wrap text-sm bg-green-50 p-3 rounded-md">
              {renderValue(after)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
