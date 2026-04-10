'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface UserInfo {
  id: string;
  verified: boolean;
  phone: string | null;
  role: string;
  helperProfile: {
    categories: string;
    badges: string | null;
  } | null;
}

export default function VerificationPage() {
  const { data: session } = useSession();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyStep, setVerifyStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/simburum/api/users?self=true');
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
          if (data.verified) setVerifyStep('verified');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleSendCode() {
    if (!phoneInput.trim()) return;
    setVerifyLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setVerifyStep('sent');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!verifyCode.trim()) return;
    setVerifyLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setVerifyStep('verified');
      setUserInfo((prev) => prev ? { ...prev, verified: true } : prev);
    } finally {
      setVerifyLoading(false);
    }
  }

  const badges = userInfo?.helperProfile?.badges
    ? userInfo.helperProfile.badges.split(',').filter(Boolean)
    : [];

  const categories = userInfo?.helperProfile?.categories
    ? userInfo.helperProfile.categories.split(',').filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">인증</h1>
      <p className="text-gray-600 mb-8">본인 인증 상태를 확인하고 관리하세요.</p>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">인증 현황</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                userInfo?.verified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">전화번호 인증</p>
                <p className="text-sm text-gray-500">
                  {userInfo?.verified ? '인증 완료' : '인증 미완료'}
                </p>
              </div>
            </div>
            {userInfo?.verified ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">완료</span>
            ) : (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">미완료</span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-100 text-primary-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">이메일 인증</p>
                <p className="text-sm text-gray-500">가입 시 자동 완료</p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">완료</span>
          </div>
        </div>
      </div>

      {!userInfo?.verified && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">전화번호 인증</h2>
          {verifyStep === 'idle' && (
            <div className="space-y-4">
              <Input
                label="전화번호"
                type="tel"
                placeholder="010-0000-0000"
                value={phoneInput}
                onChange={(e) => setPhoneInput((e.target as HTMLInputElement).value)}
              />
              <Button onClick={handleSendCode} loading={verifyLoading} disabled={!phoneInput.trim()}>
                인증번호 발송
              </Button>
            </div>
          )}
          {verifyStep === 'sent' && (
            <div className="space-y-4">
              <p className="text-sm text-green-600">인증번호가 발송되었습니다.</p>
              <Input
                label="인증번호"
                type="text"
                placeholder="6자리 인증번호 입력"
                value={verifyCode}
                onChange={(e) => setVerifyCode((e.target as HTMLInputElement).value)}
              />
              <Button onClick={handleVerifyCode} loading={verifyLoading} disabled={!verifyCode.trim()}>
                인증 확인
              </Button>
            </div>
          )}
        </div>
      )}

      {user?.role === 'HELPER' && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">헬퍼 프로필</h2>

          {categories.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">전문 분야</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span key={cat} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary-50 text-primary-700">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">배지</h3>
            {badges.length === 0 ? (
              <p className="text-sm text-gray-500">아직 획득한 배지가 없습니다. 활동을 통해 배지를 획득하세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="text-xs font-medium px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
