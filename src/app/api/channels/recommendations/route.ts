import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeService } from '@/lib/engines/service-analyzer'
import { calculateChannelFitness } from '@/lib/engines/channel-fitness'
import type { GoalType, ServiceType } from '@/lib/constants/enums'

// GET /api/channels/recommendations?serviceId= - 추천 채널
export async function GET(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId가 필요합니다' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        assets: true,
        goals: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 서비스 분석
    const analysis = analyzeService({
      url: service.url,
      appUrl: service.appUrl,
      type: service.type as ServiceType,
      description: service.description,
      assetTypes: service.assets.map(a => a.type),
    })

    // 채널 적합도 계산
    const recommendations = calculateChannelFitness({
      serviceType: service.type as ServiceType,
      analysis,
      goalTypes: service.goals.map(g => g.type as GoalType),
      availableAssets: service.assets.map(a => a.type),
    })

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        recommendations,
      },
    })
  } catch (error) {
    console.error('Channel recommendation error:', error)
    return NextResponse.json(
      { success: false, error: '채널 추천에 실패했습니다' },
      { status: 500 }
    )
  }
}
