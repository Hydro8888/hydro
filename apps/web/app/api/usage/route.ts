import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';
import { TIERS } from '@ai-portal/shared';

export async function GET() {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const usage = memoryStore.getUsage(userId);
  // TODO: 사용자 tier를 DB에서 조회. 현재는 free tier 기본값 사용
  const userTier = TIERS.free;

  return Response.json({
    currentPeriod: {
      totalTokens: usage.totalTokens,
      totalCost: usage.totalCost,
      limit: userTier.monthlyTokens,
      byModel: usage.byModel,
    },
  });
}
