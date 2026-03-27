import { auth } from '@clerk/nextjs/server';
import { MODEL_CATALOG } from '@ai-portal/shared';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Filter models based on user's tier
  return Response.json({ models: MODEL_CATALOG });
}
