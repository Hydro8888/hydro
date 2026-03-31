import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';

export async function GET() {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const usage = memoryStore.getUsage(userId);
  return Response.json({
    currentPeriod: {
      totalTokens: usage.totalTokens,
      totalCost: usage.totalCost,
      limit: 50000,
      byModel: usage.byModel,
    },
  });
}
