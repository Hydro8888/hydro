import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateWeeklyReport } from '@/lib/engines/reporting'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    const weekParam = request.nextUrl.searchParams.get('weekStart')
    let weekStart: Date
    if (weekParam) {
      weekStart = new Date(weekParam)
    } else {
      weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // 이번 주 월요일
    }

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })

    const report = await generateWeeklyReport(services.map(s => s.id), weekStart)
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json({ success: false, error: '주간 보고서 생성에 실패했습니다' }, { status: 500 })
  }
}
