import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conversation = memoryStore.getConversation(params.id);
  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = memoryStore.getMessages(params.id);
  return Response.json({ conversation, messages });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const body = await req.json();
  const updated = memoryStore.updateConversation(params.id, body);
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.json({ conversation: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  memoryStore.deleteConversation(params.id);
  return new Response(null, { status: 204 });
}
