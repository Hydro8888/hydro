import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search');
  const role = searchParams.get('role');

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      trustScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(users);
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
    const { userId, role, verified } = body;

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (role !== undefined) {
      const validRoles = ['USER', 'HELPER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (verified !== undefined) {
      updateData.verified = verified;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        trustScore: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: '사용자 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
