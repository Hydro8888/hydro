import { headers } from 'next/headers';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Missing webhook secret', { status: 500 });
  }

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (evt.type) {
    case 'user.created':
    case 'user.updated': {
      // TODO: Upsert user in DB
      console.log(`[clerk webhook] ${evt.type}:`, evt.data.id);
      break;
    }
    case 'user.deleted': {
      // TODO: Delete user from DB
      console.log(`[clerk webhook] user.deleted:`, evt.data.id);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
