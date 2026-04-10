import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // ── Admin 사용자 ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simburum.com' },
    update: {},
    create: {
      email: 'admin@simburum.com',
      password: adminPassword,
      name: '관리자',
      phone: '010-0000-0000',
      role: 'ADMIN',
      verified: true,
      trustScore: 100,
    },
  });
  console.log(`✅ 관리자 생성: ${admin.email}`);

  // ── 샘플 헬퍼 사용자 ─────────────────────────────────────────────────────
  const helperPassword = await bcrypt.hash('helper1234', 12);
  const helper = await prisma.user.upsert({
    where: { email: 'helper@simburum.com' },
    update: {},
    create: {
      email: 'helper@simburum.com',
      password: helperPassword,
      name: '김도움',
      phone: '010-1234-5678',
      role: 'HELPER',
      verified: true,
      trustScore: 85,
    },
  });
  console.log(`✅ 헬퍼 생성: ${helper.email}`);

  // ── 헬퍼 프로필 ──────────────────────────────────────────────────────────
  await prisma.helperProfile.upsert({
    where: { userId: helper.id },
    update: {},
    create: {
      userId: helper.id,
      categories: 'CLEANING,DELIVERY,ERRAND,SHOPPING',
      bio: '서울 전역에서 활동하는 5년 경력의 전문 헬퍼입니다. 청소, 배달, 장보기 등 다양한 심부름을 신속하고 정확하게 처리합니다.',
      completedCount: 142,
      onTimeRate: 97.5,
      avgRating: 4.8,
      available: true,
      badges: 'TOP_RATED,FAST_RESPONDER,VETERAN',
    },
  });
  console.log(`✅ 헬퍼 프로필 생성: ${helper.name}`);

  // ── 성공 사례 5건 ────────────────────────────────────────────────────────
  const successCases = [
    {
      category: 'CLEANING',
      title: '이사 후 입주 청소 완벽 처리',
      summary:
        '30평대 아파트 입주 청소를 요청하셨습니다. 헬퍼가 4시간 만에 거실, 주방, 욕실, 베란다까지 꼼꼼하게 청소를 완료했습니다. 요청자분께서 "새 집처럼 깨끗해졌다"며 높은 만족도를 보여주셨습니다.',
      duration: '4시간',
      satisfaction: 5.0,
      published: true,
    },
    {
      category: 'DELIVERY',
      title: '급한 서류 당일 배달 성공',
      summary:
        '강남에서 분당까지 계약 서류를 2시간 내에 전달해야 하는 긴급 요청이었습니다. 헬퍼가 접수 30분 만에 서류를 픽업하여 1시간 20분 만에 안전하게 전달을 완료했습니다. 정시 도착으로 중요한 계약이 무사히 체결되었습니다.',
      duration: '1시간 50분',
      satisfaction: 5.0,
      published: true,
    },
    {
      category: 'SHOPPING',
      title: '어르신 대신 주간 장보기',
      summary:
        '거동이 불편한 어르신의 주간 장보기를 대행했습니다. 헬퍼가 요청 목록에 맞춰 신선한 재료를 꼼꼼히 골라 구매하고 집 앞까지 배달했습니다. 이후 정기 요청으로 이어져 매주 도움을 드리고 있습니다.',
      duration: '2시간',
      satisfaction: 4.9,
      published: true,
    },
    {
      category: 'PET',
      title: '출장 중 반려견 산책 및 돌봄',
      summary:
        '3일간 출장을 가시는 요청자의 반려견(골든 리트리버) 산책과 밥 주기를 대행했습니다. 헬퍼가 하루 2회 산책과 식사를 제공하고, 매번 사진과 함께 상태를 보고했습니다. 요청자분이 안심하고 출장을 다녀오셨습니다.',
      duration: '3일 (1일 2회 방문)',
      satisfaction: 4.8,
      published: true,
    },
    {
      category: 'REPAIR',
      title: '수도 누수 긴급 수리 연결',
      summary:
        '주말 늦은 밤에 화장실 수도 누수가 발생한 긴급 요청이었습니다. 헬퍼가 30분 내에 도착하여 임시 조치를 취하고, 다음 날 전문 배관 업체와 연결하여 완벽히 수리를 완료했습니다. 빠른 대응으로 큰 피해를 방지했습니다.',
      duration: '당일 임시조치 30분 + 다음날 본수리 2시간',
      satisfaction: 4.7,
      published: true,
    },
  ];

  for (const sc of successCases) {
    await prisma.successCase.create({
      data: sc,
    });
  }
  console.log(`✅ 성공 사례 ${successCases.length}건 생성 완료`);

  console.log('🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
