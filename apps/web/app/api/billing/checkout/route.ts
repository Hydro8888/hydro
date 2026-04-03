import { getAuthUserId } from '@/lib/auth';
import { z } from 'zod';

const checkoutSchema = z.object({
  priceId: z.string(),
});

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getAuthUserId(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stripe integration - requires STRIPE_SECRET_KEY
  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { stripe } = await import('@/lib/stripe');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: parsed.data.priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin')}/freeai/billing?success=true`,
      cancel_url: `${req.headers.get('origin')}/freeai/billing?canceled=true`,
      metadata: { userId },
    });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[billing/checkout] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
