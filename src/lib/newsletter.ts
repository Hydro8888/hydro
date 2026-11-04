import { withBasePath } from './site';

// Newsletter feature flag + subscribe call (slice S2 contract C, shared with S3 NewsletterBanner).
// The only place that reads NEXT_PUBLIC_NEWSLETTER_ENABLED — components must import NEWSLETTER_ENABLED.

/** Exactly the string 'true' turns a flag on (same rule as NEXT_PUBLIC_ADS_ENABLED). */
export function isFlagOn(v: string | null | undefined): boolean {
  return v === 'true';
}

// Keep the literal property access: Next inlines NEXT_PUBLIC_* at build time (rebuild to change).
export const NEWSLETTER_ENABLED = isFlagOn(process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED);

export const NEWSLETTER_ENDPOINT = withBasePath('/api/newsletter');

/** Routes that render the S3 NewsletterBanner — the footer form hides there to avoid a duplicate CTA. */
const BANNER_PATHS: ReadonlySet<string> = new Set(['/', '/world', '/us', '/japan', '/china']);

export function isNewsletterBannerPath(pathname?: string | null): boolean {
  return !!pathname && BANNER_PATHS.has(pathname);
}

export type SubscribeResult = { ok: true } | { ok: false; reason: 'invalid' | 'http' | 'network' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POSTs the address to NEWSLETTER_ENDPOINT. Reports success only for a 2xx response. */
export async function subscribeNewsletter(email: string, fetchImpl: typeof fetch = fetch): Promise<SubscribeResult> {
  const value = email.trim();
  if (!EMAIL_RE.test(value)) return { ok: false, reason: 'invalid' };
  try {
    const res = await fetchImpl(NEWSLETTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    });
    return res.status >= 200 && res.status < 300 ? { ok: true } : { ok: false, reason: 'http' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
