'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegisterWizard } from '@/components/auth/RegisterWizard';

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            여우알바 회원이 되어 안전하게 알바를 찾아보세요
          </p>
        </div>
        <RegisterWizard />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary hover:text-primary-light">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
