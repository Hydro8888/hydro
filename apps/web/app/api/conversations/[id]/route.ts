import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  mode: z.enum(['single', 'dual', 'multi']).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conversation = memoryStore.getConversation(params.id);
  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (conversation.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  const messages = memoryStore.getMessages(params.id);
  return Response.json({ conversation, messages });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conv = memoryStore.getConversation(params.id);
  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (conv.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const updated = memoryStore.updateConversation(params.id, parsed.data);
  return Response.json({ conversation: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conv = memoryStore.getConversation(params.id);
  if (conv && conv.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  memoryStore.deleteConversation(params.id);
  return new Response(null, { status: 204 });
}
