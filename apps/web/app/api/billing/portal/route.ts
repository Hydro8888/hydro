import { getAuthUserId } from '@/lib/auth';

export async function POST() {
  try { await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
