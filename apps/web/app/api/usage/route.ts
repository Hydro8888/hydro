import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Aggregate usage from DB and Redis
  return Response.json({
    currentPeriod: {
      totalTokens: 0,
      totalCost: 0,
      limit: 50000,
      byModel: [],
    },
  });
}
