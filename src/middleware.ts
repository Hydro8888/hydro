import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /admin routes (accounting for basePath /livenews)
  const pathname = request.nextUrl.pathname;

  // Check for Basic Auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !isValidAuth(authHeader)) {
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
  matcher: ['/admin/:path*'],
};
