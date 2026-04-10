export async function POST(req: Request) {
  // Clerk webhook — requires CLERK_WEBHOOK_SECRET and svix package for full verification
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    return Response.json({ error: 'Clerk not configured' }, { status: 503 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // TODO: svix 패키지로 웹훅 서명 검증 추가 필요
  // const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  // try { wh.verify(body, { 'svix-id': ..., 'svix-signature': ..., 'svix-timestamp': ... }); }
  // catch { return Response.json({ error: 'Invalid signature' }, { status: 401 }); }

  // TODO: DB 연결 시 user.created / user.deleted / user.updated 이벤트 처리
  if (process.env.NODE_ENV !== 'production') {
    console.log('[clerk webhook]', payload?.type, payload?.data?.id);
  }
  return new Response('OK', { status: 200 });
}
