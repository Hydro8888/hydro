import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // TODO: Look up stripeCustomerId from DB
    const stripeCustomerId = '';

    if (!stripeCustomerId) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get('origin')}/billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[billing/portal] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create portal session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
