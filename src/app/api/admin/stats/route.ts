import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalHelpers,
      totalRequests,
      requestsToday,
      completedRequests,
      cancelledRequests,
      matchedRequests,
      totalReviews,
      totalReports,
      pendingReports,
      allReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'HELPER' } }),
      prisma.request.count(),
      prisma.request.count({ where: { createdAt: { gte: today } } }),
      prisma.request.count({ where: { status: 'COMPLETED' } }),
      prisma.request.count({ where: { status: 'CANCELLED' } }),
      prisma.request.count({
        where: {
          status: { in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      prisma.review.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.review.findMany({ select: { rating: true } }),
    ]);

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    const matchingRate =
      totalRequests > 0
        ? (matchedRequests / totalRequests) * 100
        : 0;

    const cancelRate =
      totalRequests > 0
        ? (cancelledRequests / totalRequests) * 100
        : 0;

    return NextResponse.json({
      totalUsers,
      totalHelpers,
      totalRequests,
      requestsToday,
      completedRequests,
      cancelledRequests,
      matchingRate,
      cancelRate,
      avgMatchingTime: '약 15분',
      totalReviews,
      avgRating,
      totalReports,
      pendingReports,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
