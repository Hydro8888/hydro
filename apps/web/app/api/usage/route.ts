import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }
  return Response.json({
    currentPeriod: {
      totalTokens: 0,
      totalCost: 0,
      limit: 50000,
      byModel: [],
    },
  });
}
