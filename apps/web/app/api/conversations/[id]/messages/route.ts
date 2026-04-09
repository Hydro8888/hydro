import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const conversation = memoryStore.getConversation(params.id);
  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }
  if (conversation.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  const messages = memoryStore.getMessages(params.id);
  return Response.json({ messages, conversationId: params.id });
}
