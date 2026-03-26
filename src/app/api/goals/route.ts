import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { interpretGoal } from '@/lib/engines/goal-interpreter'
import type { GoalType, ServiceType } from '@/lib/constants/enums'

// POST /api/goals - 목표 설정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, type, description } = body

    if (!serviceId || !type) {
      return NextResponse.json(
        { success: false, error: '서비스 ID와 목표 유형은 필수입니다' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 목표 해석 엔진 실행
    const subGoals = interpretGoal(
      type as GoalType,
      service.type as ServiceType,
      description
    )

    const goal = await prisma.goal.create({
      data: {
        serviceId,
        type,
        description: description || type,
        subGoals: JSON.parse(JSON.stringify(subGoals)),
      },
    })

    return NextResponse.json({
      success: true,
      data: { goal, subGoals },
    })
  } catch (error) {
    console.error('Goal creation error:', error)
    return NextResponse.json(
      { success: false, error: '목표 설정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/goals?serviceId= - 목표 조회
export async function GET(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId가 필요합니다' },
        { status: 400 }
      )
    }

    const goals = await prisma.goal.findMany({
      where: { serviceId },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json({ success: true, data: goals })
  } catch (error) {
    console.error('Goal list error:', error)
    return NextResponse.json(
      { success: false, error: '목표 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
