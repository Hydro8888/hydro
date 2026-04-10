'use client';

import React, { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const CATEGORIES = [
  { id: 'CLEANING', label: '청소' },
  { id: 'DELIVERY', label: '배달·운반' },
  { id: 'SHOPPING', label: '장보기·쇼핑' },
  { id: 'MOVING', label: '이사·운송' },
  { id: 'REPAIR', label: '수리·설치' },
  { id: 'ERRAND', label: '심부름' },
  { id: 'PET', label: '반려동물' },
  { id: 'CARE', label: '돌봄' },
  { id: 'OTHER', label: '기타' },
];

const VERIFICATION_STEPS = [
  {
    step: '1',
    title: '지원서 작성',
    description: '아래 양식을 통해 기본 정보와 전문 분야를 입력합니다.',
  },
  {
    step: '2',
    title: '신원 확인',
    description: '전화번호 인증과 신분증 확인을 통해 본인 인증을 완료합니다.',
  },
  {
    step: '3',
    title: '심사 및 승인',
    description: '운영팀이 지원 내용을 검토하고 승인 여부를 안내합니다.',
  },
  {
    step: '4',
    title: '활동 시작',
    description: '승인이 완료되면 바로 요청을 받고 활동을 시작할 수 있습니다.',
  },
];

export default function HelperApplyPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    categories: [] as string[],
    bio: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.categories.length === 0) {
      setError('전문 분야를 1개 이상 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/simburum/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: 'temp-' + Date.now(),
          roleHint: 'HELPER',
          categories: form.categories.join(','),
          bio: form.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '지원에 실패했습니다.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('지원 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">헬퍼 지원</h1>
          <p className="mt-4 text-lg text-gray-600">
            심부름 헬퍼로 활동하며 수익을 올려보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">헬퍼란?</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                헬퍼는 심부름 플랫폼에서 요청자의 생활대행 요청을 수행하는 파트너입니다.
                자유롭게 원하는 시간에 원하는 카테고리의 요청을 선택하여 수행하고,
                완료 시 서비스 비용을 받습니다.
              </p>
              <div className="space-y-3">
                {[
                  '자유로운 시간 관리 - 원하는 시간에 활동',
                  '카테고리 선택 - 본인의 전문 분야 선택 가능',
                  'AI 매칭 - 적합한 요청이 자동으로 추천됨',
                  '투명한 정산 - 에스크로를 통한 안전한 결제',
                  '성장 시스템 - 활동 실적에 따른 배지·등급 부여',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">지원 절차</h2>
              <div className="space-y-6">
                {VERIFICATION_STEPS.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {success ? (
              <div className="card text-center py-12">
                <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">지원이 완료되었습니다!</h2>
                <p className="text-gray-600">
                  운영팀이 지원 내용을 검토 후 이메일로 결과를 안내해 드리겠습니다.
                  <br />
                  보통 1~3 영업일 내에 결과를 확인하실 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">헬퍼 지원서</h2>
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
                    label="전화번호"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={form.phone}
                    onChange={(e) => updateField('phone', (e.target as HTMLInputElement).value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전문 분야 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            form.categories.includes(cat.id)
                              ? 'bg-primary-50 border-primary-300 text-primary-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    as="textarea"
                    label="자기소개"
                    placeholder="본인의 경험, 전문 분야, 활동 가능 시간 등을 자유롭게 적어주세요."
                    value={form.bio}
                    onChange={(e) => updateField('bio', (e.target as HTMLTextAreaElement).value)}
                    rows={5}
                  />

                  <Button type="submit" fullWidth loading={loading}>
                    헬퍼 지원하기
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
