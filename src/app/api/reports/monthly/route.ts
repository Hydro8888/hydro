import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateMonthlyReport } from '@/lib/engines/reporting'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    const monthParam = request.nextUrl.searchParams.get('month')
    const month = monthParam ? new Date(monthParam + '-01') : new Date()

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })

    const report = await generateMonthlyReport(services.map(s => s.id), month)
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json({ success: false, error: '월간 보고서 생성에 실패했습니다' }, { status: 500 })
  }
}
