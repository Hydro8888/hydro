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
  const allParam = req.nextUrl.searchParams.get('all');

  const where =
    userRole === 'ADMIN' && allParam === 'true'
      ? {}
      : { reporterId: userId };

  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: { select: { name: true, email: true } },
      reported: { select: { name: true, email: true } },
      request: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { requestId, reportedId, type, description, evidence } = body;

    if (!reportedId || !type || !description) {
      return NextResponse.json(
        { error: '신고 대상, 유형, 설명은 필수입니다.' },
        { status: 400 }
      );
    }

    if (reportedId === userId) {
      return NextResponse.json(
        { error: '자기 자신을 신고할 수 없습니다.' },
        { status: 400 }
      );
    }

    const validTypes = ['FRAUD', 'ABUSE', 'NO_SHOW', 'QUALITY', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: '유효하지 않은 신고 유형입니다.' }, { status: 400 });
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedId },
    });

    if (!reportedUser) {
      return NextResponse.json({ error: '신고 대상을 찾을 수 없습니다.' }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        requestId: requestId || null,
        reporterId: userId,
        reportedId,
        type,
        description,
        evidence: evidence || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json(
      { error: '신고 접수 중 오류가 발생했습니다.' },
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
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { reportId, status, resolution } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: '신고 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const validStatuses = ['INVESTIGATING', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolution: resolution || null,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Report update error:', error);
    return NextResponse.json(
      { error: '신고 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
