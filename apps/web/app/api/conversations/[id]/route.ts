import { auth } from '@clerk/nextjs/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Fetch conversation and messages from DB
  return Response.json({
    conversation: { id: params.id, title: 'Conversation', messages: [] },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();

  // TODO: Update conversation in DB
  return Response.json({
    conversation: { id: params.id, ...body },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Delete conversation from DB
  return new Response(null, { status: 204 });
}
