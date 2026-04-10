import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { matchHelpers } from '@/lib/ai';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: '요청 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const helperProfiles = await prisma.helperProfile.findMany({
      where: { available: true },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (helperProfiles.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const helpers = helperProfiles.map((hp) => ({
      id: hp.userId,
      name: hp.user.name,
      categories: hp.categories,
      bio: hp.bio,
      completedCount: hp.completedCount,
      onTimeRate: hp.onTimeRate,
      avgRating: hp.avgRating,
      available: hp.available,
      badges: hp.badges,
    }));

    const requestInfo = {
      title: request.title,
      description: request.description,
      category: request.category,
      urgency: request.urgency,
      location: request.location,
      budget: request.budget,
      scheduledAt: request.scheduledAt?.toISOString() || null,
    };

    const result = await matchHelpers(requestInfo, helpers);

    const matchesWithDetails = result.matches.map((m) => {
      const hp = helperProfiles.find((h) => h.userId === m.helperId);
      return {
        ...m,
        helper: hp
          ? {
              id: hp.userId,
              name: hp.user.name,
              helperProfile: {
                avgRating: hp.avgRating,
                completedCount: hp.completedCount,
                onTimeRate: hp.onTimeRate,
                categories: hp.categories,
              },
            }
          : null,
      };
    });

    return NextResponse.json({ matches: matchesWithDetails });
  } catch (error) {
    console.error('AI match error:', error);
    return NextResponse.json(
      { error: 'AI 매칭 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
