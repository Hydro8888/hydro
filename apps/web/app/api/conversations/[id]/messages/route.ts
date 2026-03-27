import { auth } from '@clerk/nextjs/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Fetch messages from DB with pagination
  return Response.json({ messages: [], conversationId: params.id });
}
