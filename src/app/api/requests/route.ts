import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const riskLevel = searchParams.get('riskLevel');
  const type = searchParams.get('type');

  if (type === 'cases') {
    const cases = await prisma.successCase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(cases);
  }

  const where: Record<string, unknown> = {};

  if (userRole !== 'ADMIN') {
    where.OR = [{ requesterId: userId }, { helperId: userId }];
  }

  if (status) where.status = status;
  if (category) where.category = category;
  if (riskLevel) where.riskLevel = riskLevel;

  const requests = await prisma.request.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, email: true } },
      helper: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');

  if (type === 'cases' && userRole === 'ADMIN') {
    try {
      const body = await req.json();
      const newCase = await prisma.successCase.create({
        data: {
          category: body.category,
          title: body.title,
          summary: body.summary,
          duration: body.duration || null,
          satisfaction: body.satisfaction || null,
          reused: body.reused || false,
          published: body.published ?? false,
        },
      });
      return NextResponse.json(newCase, { status: 201 });
    } catch (error) {
      console.error('Case creation error:', error);
      return NextResponse.json({ error: '사례 등록에 실패했습니다.' }, { status: 500 });
    }
  }

  try {
    const body = await req.json();
    const { title, description, naturalInput, category, urgency, budget, location, scheduledAt } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: '제목, 설명, 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    const request = await prisma.request.create({
      data: {
        requesterId: userId,
        title,
        description,
        naturalInput: naturalInput || null,
        category,
        urgency: urgency || 'NORMAL',
        budget: budget ? parseFloat(String(budget)) : null,
        location: location || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Request creation error:', error);
    return NextResponse.json(
      { error: '요청 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');

  if (type === 'cases' && userRole === 'ADMIN') {
    try {
      const body = await req.json();
      const updated = await prisma.successCase.update({
        where: { id: body.id },
        data: { published: body.published },
      });
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Case update error:', error);
      return NextResponse.json({ error: '사례 수정에 실패했습니다.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}
