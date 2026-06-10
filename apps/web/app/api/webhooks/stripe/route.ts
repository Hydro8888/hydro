export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe not configured', { status: 503 });
  }

  const body = await req.text();
  const { headers: reqHeaders } = req;
  const signature = reqHeaders.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const { stripe } = await import('@/lib/stripe');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[stripe webhook] checkout.session.completed:', event.data.object.id);
        break;
      case 'customer.subscription.updated':
        console.log('[stripe webhook] subscription.updated:', event.data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('[stripe webhook] subscription.deleted:', event.data.object.id);
        break;
      case 'invoice.payment_failed':
        console.log('[stripe webhook] invoice.payment_failed:', event.data.object.id);
        break;
    }

    return new Response('OK', { status: 200 });
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
}
