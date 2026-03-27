const CLERK_ENABLED = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

export async function getAuthUserId(): Promise<string> {
  if (CLERK_ENABLED) {
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    return userId;
  }
  return 'anonymous';
}
