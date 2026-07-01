import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // GET requests to /api/admin/stats are public — consumed by Header/Footer
  // on every page load. All other /admin and /api/admin mutating requests
  // require Basic Auth.
  const isPublicRead =
    method === 'GET' && pathname === '/api/admin/stats';

  if (isPublicRead) {
    return NextResponse.next();
  }

  // /api/admin/* mutating (POST/PUT/PATCH/DELETE) + ALL /api/collect,
  // /api/articles/[id] PATCH — require auth.
  // The matcher below ensures we only run for the relevant paths.
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !isValidAuth(authHeader)) {
    // API routes get JSON 401; page routes get browser Basic Auth challenge
    const isApi = pathname.startsWith('/api/');
    if (isApi) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

function isValidAuth(header: string): boolean {
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [user, pass] = decoded.split(':');
  return user === (process.env.ADMIN_USER || 'admin') && pass === (process.env.ADMIN_PASS || 'livenews2026');
}

export const config = {
  matcher: [
    // Admin pages (including /admin itself)
    '/admin',
    '/admin/:path*',
    // Admin API mutating endpoints
    '/api/admin/sources',
    '/api/admin/clear-cache',
    '/api/admin/fix-content',
    '/api/admin/fix-images',
    '/api/admin/fix-translations',
    '/api/admin/stats',
    // Public API mutating endpoints that must be protected
    '/api/collect',
    '/api/articles/:path*',
  ],
};
