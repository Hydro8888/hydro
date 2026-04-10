import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CLERK_ENABLED = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

export default async function middleware(request: NextRequest) {
  if (CLERK_ENABLED) {
    const { clerkMiddleware, createRouteMatcher } = await import(
      '@clerk/nextjs/server'
    );
    const isPublicRoute = createRouteMatcher([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/api/webhooks(.*)',
    ]);
    const handler = clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    });
    // Clerk middleware returns a Next.js middleware function that accepts a request and a NextFetchEvent.
    // We pass an empty event since we don't need to wait for async tasks.
    return handler(request, { waitUntil: () => undefined } as never);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
