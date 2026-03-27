import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Missing webhook secret', { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // TODO: Update user tier in DB, store stripe_customer_id and stripe_subscription_id
      console.log('[stripe webhook] checkout.session.completed:', session.id);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      // TODO: Handle plan changes (upgrade/downgrade)
      console.log('[stripe webhook] subscription.updated:', subscription.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      // TODO: Revert user to free plan
      console.log('[stripe webhook] subscription.deleted:', subscription.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // TODO: Flag account, send warning
      console.log('[stripe webhook] invoice.payment_failed:', invoice.id);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
