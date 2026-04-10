import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId, helperId } = body;

    if (!requestId || !helperId) {
      return NextResponse.json(
        { error: '요청 ID와 헬퍼 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (request.status !== 'PENDING' && request.status !== 'AI_REVIEWED') {
      return NextResponse.json(
        { error: '이미 매칭된 요청이거나 매칭할 수 없는 상태입니다.' },
        { status: 400 }
      );
    }

    const helper = await prisma.user.findUnique({
      where: { id: helperId },
      include: { helperProfile: true },
    });

    if (!helper || helper.role !== 'HELPER') {
      return NextResponse.json({ error: '유효하지 않은 헬퍼입니다.' }, { status: 400 });
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        helperId,
        status: 'MATCHED',
      },
    });

    await prisma.message.create({
      data: {
        requestId,
        senderId: helperId,
        content: `${helper.name} 헬퍼가 매칭되었습니다.`,
        type: 'SYSTEM',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Matching error:', error);
    return NextResponse.json(
      { error: '매칭 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: '요청 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const validStatuses = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Match status update error:', error);
    return NextResponse.json(
      { error: '매칭 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
