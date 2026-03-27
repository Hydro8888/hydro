import { getAuthUserId } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }
  return Response.json({
    conversation: { id: params.id, title: 'Conversation', messages: [] },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }
  const body = await req.json();
  return Response.json({ conversation: { id: params.id, ...body } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }
  return new Response(null, { status: 204 });
}
