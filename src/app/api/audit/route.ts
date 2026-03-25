import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const entityType = request.nextUrl.searchParams.get('entityType')
    const action = request.nextUrl.searchParams.get('action')
    const userId = request.nextUrl.searchParams.get('userId')
    const dateFrom = request.nextUrl.searchParams.get('dateFrom')
    const dateTo = request.nextUrl.searchParams.get('dateTo')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const pageSize = 20

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (userId) where.userId = userId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json({ success: false, error: '감사 로그 조회에 실패했습니다' }, { status: 500 })
  }
}
