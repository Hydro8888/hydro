import { getAuthUserId } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }
  return Response.json({ messages: [], conversationId: params.id });
}
