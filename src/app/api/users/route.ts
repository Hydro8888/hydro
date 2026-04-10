import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const selfParam = req.nextUrl.searchParams.get('self');
  if (selfParam === 'true') {
    const userId = (session.user as { id: string }).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { helperProfile: true },
    });
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verified: user.verified,
      trustScore: user.trustScore,
      helperProfile: user.helperProfile,
    });
  }

  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, roleHint, categories, bio } = body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      roleHint?: string;
      categories?: string;
      bio?: string;
    };

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone ?? null,
        role: roleHint === 'HELPER' ? 'HELPER' : 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        verified: true,
        trustScore: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (roleHint === 'HELPER' && categories) {
      await prisma.helperProfile.create({
        data: {
          userId: user.id,
          categories,
          bio: bio ?? null,
        },
      });
    }

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
