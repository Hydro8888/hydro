export async function POST(req: Request) {
  // Clerk webhook - requires CLERK_WEBHOOK_SECRET and svix package
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    return new Response('Clerk not configured', { status: 503 });
  }

  const payload = await req.json();
  console.log('[clerk webhook]', payload?.type, payload?.data?.id);
  return new Response('OK', { status: 200 });
}
