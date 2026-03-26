import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateDailyReport } from '@/lib/engines/reporting'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    const dateParam = request.nextUrl.searchParams.get('date')
    const date = dateParam ? new Date(dateParam) : new Date()

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })

    const report = await generateDailyReport(services.map(s => s.id), date)
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json({ success: false, error: '일간 보고서 생성에 실패했습니다' }, { status: 500 })
  }
}
