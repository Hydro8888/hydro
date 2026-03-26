import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canTransitionChannel } from '@/lib/states/channel-state'
import { notifyChannelConnectionFailed } from '@/lib/engines/notification'

// POST /api/channels/connections - 채널 연결 시작
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, channelName } = body

    if (!serviceId || !channelName) {
      return NextResponse.json(
        { success: false, error: 'serviceId와 channelName이 필요합니다' },
        { status: 400 }
      )
    }

    const channel = await prisma.channel.findUnique({
      where: { name: channelName },
    })

    if (!channel) {
      return NextResponse.json(
        { success: false, error: '채널을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 기존 연결 확인
    const existing = await prisma.channelConnection.findUnique({
      where: {
        serviceId_channelId: {
          serviceId,
          channelId: channel.id,
        },
      },
    })

    if (existing && existing.status === 'CONNECTED') {
      return NextResponse.json(
        { success: false, error: '이미 연결된 채널입니다' },
        { status: 400 }
      )
    }

    // Mock: 연결 시뮬레이션 (즉시 CONNECTED로 전환)
    // 향후 실제 OAuth/API 인증으로 교체 시 CONNECTING → CONNECTED 비동기 처리
    const connection = await prisma.channelConnection.upsert({
      where: {
        serviceId_channelId: {
          serviceId,
          channelId: channel.id,
        },
      },
      update: {
        status: 'CONNECTED',
        connectedAt: new Date(),
        errorReason: null,
      },
      create: {
        serviceId,
        channelId: channel.id,
        status: 'CONNECTED',
        connectedAt: new Date(),
      },
    })

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        entityType: 'ChannelConnection',
        entityId: connection.id,
        action: 'CONNECT',
        after: {
          channelName: channel.name,
          displayName: channel.displayName,
          status: 'CONNECTED',
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: connection,
    })
  } catch (error) {
    console.error('Channel connection error:', error)
    return NextResponse.json(
      { success: false, error: '채널 연결에 실패했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/channels/connections?serviceId= - 연결 상태 조회
export async function GET(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId가 필요합니다' },
        { status: 400 }
      )
    }

    const connections = await prisma.channelConnection.findMany({
      where: { serviceId },
      include: { channel: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: connections })
  } catch (error) {
    console.error('Channel connections list error:', error)
    return NextResponse.json(
      { success: false, error: '채널 연결 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
