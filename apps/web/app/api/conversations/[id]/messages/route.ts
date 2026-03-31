import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const messages = memoryStore.getMessages(params.id);
  return Response.json({ messages, conversationId: params.id });
}
