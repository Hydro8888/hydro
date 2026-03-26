import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { analyzeService } from '@/lib/engines/service-analyzer'

// POST /api/services - 서비스 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, appUrl, type, description, logoUrl } = body

    if (!name || !type || !description) {
      return NextResponse.json(
        { success: false, error: '서비스명, 유형, 소개문은 필수입니다' },
        { status: 400 }
      )
    }

    const user = getCurrentUser()

    // 서비스 분석 실행
    const analysis = analyzeService({
      url,
      appUrl,
      type,
      description,
      assetTypes: [],
    })

    const service = await prisma.service.create({
      data: {
        name,
        url,
        appUrl,
        type,
        description,
        logoUrl,
        userId: user.id,
        isLocal: analysis.isLocal,
        isApp: analysis.isApp,
        isB2B: analysis.isB2B,
      },
    })

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        entityType: 'Service',
        entityId: service.id,
        action: 'CREATE',
        userId: user.id,
        after: { name, type, url },
      },
    })

    return NextResponse.json({
      success: true,
      data: { service, analysis },
    })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json(
      { success: false, error: '서비스 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/services - 서비스 목록
export async function GET() {
  try {
    const user = getCurrentUser()

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            goals: true,
            channelConnections: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Service list error:', error)
    return NextResponse.json(
      { success: false, error: '서비스 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
