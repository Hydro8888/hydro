import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateRecommendations, saveRecommendations } from '@/lib/engines/recommendation'

export async function GET() {
  try {
    const user = getCurrentUser()
    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const serviceIds = services.map(s => s.id)

    const recommendations = await generateRecommendations(serviceIds)

    // DB에 저장 (각 서비스별)
    for (const sid of serviceIds) {
      await saveRecommendations(sid, recommendations)
    }

    return NextResponse.json({ success: true, data: recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ success: false, error: '추천 액션 생성에 실패했습니다' }, { status: 500 })
  }
}
