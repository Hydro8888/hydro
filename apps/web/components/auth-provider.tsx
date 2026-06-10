'use client';

import React from 'react';

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (CLERK_ENABLED) {
    const { ClerkProvider } = require('@clerk/nextjs');
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  return <>{children}</>;
}
