import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { moderateRequest } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { input } = body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: '검토할 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    const result = await moderateRequest(input.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI moderate error:', error);
    return NextResponse.json(
      { error: 'AI 모더레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
