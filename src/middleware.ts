import { NextRequest, NextResponse } from 'next/server';
import { WWW_AUTHENTICATE, isValidBasicAuth, requiresAuth } from '@/lib/auth-policy';
import { LIST_QUERY_HEADER, forwardsListQuery } from '@/lib/routing';

// Which requests need admin auth is decided by requiresAuth (src/lib/auth-policy.ts, unit-tested);
// the matcher below only limits where this middleware runs at all.
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!requiresAuth(pathname, request.method)) {
    if (forwardsListQuery(pathname)) {
      // Public list pages: hand the query string to the segment layout (layouts get no
      // searchParams) so an out-of-range ?page= is answered with a real 307 — see routing.ts.
      // Always overwritten, never trusted from the client.
      const headers = new Headers(request.headers);
      headers.set(LIST_QUERY_HEADER, search);
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.next();
  }

  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || 'livenews2026';
  if (isValidBasicAuth(request.headers.get('authorization'), user, pass)) return NextResponse.next();

  // Every 401 carries the challenge: without it the browser does not re-send the admin
  // credentials it cached for /admin to /api/admin/* (bookmarked admin pages got empty tables).
  const challenge = { 'WWW-Authenticate': WWW_AUTHENTICATE };
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: challenge });
  }
  return new NextResponse('Authentication required', { status: 401, headers: challenge });
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/collect',
    '/api/collect/:path*',
    '/api/articles',
    '/api/articles/:path*',
    // Public list pages under a loading.tsx boundary (query forwarding only, no auth)
    '/breaking',
    '/category/:path*',
  ],
};
