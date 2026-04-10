import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      helper: { select: { id: true, name: true } },
      messages: {
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      reviews: true,
      payment: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(request);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();

    if (body.message) {
      const msg = await prisma.message.create({
        data: {
          requestId: params.id,
          senderId: userId,
          content: body.message,
          type: 'TEXT',
        },
      });
      return NextResponse.json(msg);
    }

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (body.helperId) {
      updateData.helperId = body.helperId;
    }

    if (body.aiCategory) {
      updateData.aiCategory = body.aiCategory;
      updateData.aiConfidence = body.aiConfidence;
      updateData.riskLevel = body.riskLevel;
      updateData.suggestedMin = body.suggestedMin;
      updateData.suggestedMax = body.suggestedMax;
    }

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Request update error:', error);
    return NextResponse.json(
      { error: '요청 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const request = await prisma.request.findUnique({
      where: { id: params.id },
    });

    if (!request) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (request.requesterId !== userId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    if (request.status !== 'PENDING' && request.status !== 'AI_REVIEWED') {
      return NextResponse.json(
        { error: '진행 중이거나 완료된 요청은 취소할 수 없습니다.' },
        { status: 400 }
      );
    }

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Request cancel error:', error);
    return NextResponse.json(
      { error: '요청 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
