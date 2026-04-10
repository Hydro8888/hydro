import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const reviews = await prisma.review.findMany({
    where: {
      OR: [{ authorId: userId }, { targetId: userId }],
    },
    include: {
      author: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } },
      request: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { requestId, rating, punctuality, accuracy, kindness, comment } = body;

    if (!requestId || !rating) {
      return NextResponse.json(
        { error: '요청 ID와 평점은 필수입니다.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (request.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: '완료된 요청만 리뷰를 작성할 수 있습니다.' },
        { status: 400 }
      );
    }

    let targetId: string;
    if (userId === request.requesterId) {
      if (!request.helperId) {
        return NextResponse.json({ error: '헬퍼가 배정되지 않은 요청입니다.' }, { status: 400 });
      }
      targetId = request.helperId;
    } else if (userId === request.helperId) {
      targetId = request.requesterId;
    } else {
      return NextResponse.json({ error: '이 요청의 참여자만 리뷰를 작성할 수 있습니다.' }, { status: 403 });
    }

    const existingReview = await prisma.review.findFirst({
      where: { requestId, authorId: userId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: '이미 이 요청에 대한 리뷰를 작성했습니다.' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        requestId,
        authorId: userId,
        targetId,
        rating,
        punctuality: punctuality || null,
        accuracy: accuracy || null,
        kindness: kindness || null,
        comment: comment || null,
      },
    });

    const allReviews = await prisma.review.findMany({
      where: { targetId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: targetId },
      data: { trustScore: avgRating * 20 },
    });

    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: targetId },
    });

    if (helperProfile) {
      await prisma.helperProfile.update({
        where: { userId: targetId },
        data: { avgRating },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { error: '리뷰 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
