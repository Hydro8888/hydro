import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/services/[id] - 서비스 상세
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        assets: true,
        goals: true,
        channelConnections: {
          include: { channel: true },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        recommendedActions: {
          where: { accepted: null },
          orderBy: { priority: 'desc' },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('Service detail error:', error)
    return NextResponse.json(
      { success: false, error: '서비스 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/services/[id] - 서비스 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, url, appUrl, type, description, logoUrl } = body

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(url !== undefined && { url }),
        ...(appUrl !== undefined && { appUrl }),
        ...(type && { type }),
        ...(description && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    })

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json(
      { success: false, error: '서비스 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}
