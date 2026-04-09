import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';
import { z } from 'zod';

const createConversationSchema = z.object({
  title: z.string().optional(),
  mode: z.enum(['single', 'dual', 'multi']).optional(),
  modelIds: z.array(z.string()).optional(),
});

export async function GET() {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conversations = memoryStore.getConversations(userId);
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();
  const conversation = memoryStore.createConversation({
    id: crypto.randomUUID(),
    userId,
    title: parsed.data.title ?? 'New Conversation',
    mode: parsed.data.mode ?? 'single',
    modelIds: parsed.data.modelIds ?? [],
    messageCount: 0,
    totalTokens: 0,
    totalCost: 0,
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ conversation }, { status: 201 });
}
