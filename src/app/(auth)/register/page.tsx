'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/simburum/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '회원가입에 실패했습니다.');
        return;
      }

      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('회원가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-gray-600">심부름에 가입하고 생활대행 서비스를 이용하세요</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Input
              label="이름"
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => updateField('name', (e.target as HTMLInputElement).value)}
              required
            />

            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => updateField('email', (e.target as HTMLInputElement).value)}
              required
            />

            <Input
              label="비밀번호"
              type="password"
              placeholder="8자 이상 입력하세요"
              value={form.password}
              onChange={(e) => updateField('password', (e.target as HTMLInputElement).value)}
              required
              hint="영문, 숫자 포함 8자 이상"
            />

            <Input
              label="전화번호"
              type="tel"
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={(e) => updateField('phone', (e.target as HTMLInputElement).value)}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              가입하기
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
