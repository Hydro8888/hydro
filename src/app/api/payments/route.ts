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

  const payments = await prisma.payment.findMany({
    where: {
      request: {
        OR: [{ requesterId: userId }, { helperId: userId }],
      },
    },
    include: {
      request: { select: { title: true, requesterId: true, helperId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId, amount, method } = body;

    if (!requestId || !amount) {
      return NextResponse.json(
        { error: '요청 ID와 금액은 필수입니다.' },
        { status: 400 }
      );
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { requestId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: '이 요청에 대한 결제가 이미 존재합니다.' },
        { status: 409 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        requestId,
        amount: parseFloat(String(amount)),
        platformFee: 0,
        status: 'HELD',
        method: method || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다.' },
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
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: '결제 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const validStatuses = ['RELEASED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: '결제 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
