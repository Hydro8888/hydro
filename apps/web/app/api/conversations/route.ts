import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const createConversationSchema = z.object({
  title: z.string().optional(),
  mode: z.enum(['single', 'dual', 'multi']).optional(),
  modelIds: z.array(z.string()).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Query conversations from DB
  return Response.json({ conversations: [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO: Create conversation in DB
  const conversation = {
    id: crypto.randomUUID(),
    title: parsed.data.title ?? 'New Conversation',
    mode: parsed.data.mode ?? 'single',
    modelIds: parsed.data.modelIds ?? [],
    createdAt: new Date().toISOString(),
  };

  return Response.json({ conversation }, { status: 201 });
}
