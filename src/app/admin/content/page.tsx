'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const INITIAL_FAQS: FAQItem[] = [
  { id: 1, question: '심부름은 어떤 서비스인가요?', answer: 'AI 기반 생활대행·심부름 매칭 플랫폼입니다.' },
  { id: 2, question: '플랫폼 수수료가 정말 무료인가요?', answer: '네, 현재 플랫폼 이용 수수료는 0원입니다.' },
  { id: 3, question: '헬퍼는 어떻게 검증되나요?', answer: '실명 인증, 신분증 확인, 양방향 리뷰 시스템을 통해 검증됩니다.' },
  { id: 4, question: '결제는 어떻게 이루어지나요?', answer: '에스크로 결제 방식으로 안전하게 처리됩니다.' },
  { id: 5, question: '요청을 취소할 수 있나요?', answer: '헬퍼 수락 전 무료 취소 가능, 이후 조건부 취소입니다.' },
];

export default function AdminContentPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ question: '', answer: '' });

  function startEdit(faq: FAQItem) {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
  }

  function saveEdit() {
    if (!editingId) return;
    setFaqs((prev) =>
      prev.map((f) =>
        f.id === editingId ? { ...f, question: editForm.question, answer: editForm.answer } : f
      )
    );
    setEditingId(null);
  }

  function deleteFAQ(id: number) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  function addFAQ() {
    if (!addForm.question.trim() || !addForm.answer.trim()) return;
    const newId = Math.max(0, ...faqs.map((f) => f.id)) + 1;
    setFaqs((prev) => [...prev, { id: newId, question: addForm.question, answer: addForm.answer }]);
    setAddForm({ question: '', answer: '' });
    setShowAdd(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">콘텐츠 관리</h1>
      <p className="text-gray-600 mb-8">FAQ 및 정책 콘텐츠를 관리합니다.</p>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">FAQ 관리</h2>
          <Button onClick={() => setShowAdd(!showAdd)} variant={showAdd ? 'secondary' : 'primary'} size="sm">
            {showAdd ? '취소' : 'FAQ 추가'}
          </Button>
        </div>

        {showAdd && (
          <div className="card mb-6">
            <div className="space-y-4">
              <Input
                label="질문"
                type="text"
                value={addForm.question}
                onChange={(e) => setAddForm((prev) => ({ ...prev, question: (e.target as HTMLInputElement).value }))}
              />
              <Input
                as="textarea"
                label="답변"
                value={addForm.answer}
                onChange={(e) => setAddForm((prev) => ({ ...prev, answer: (e.target as HTMLTextAreaElement).value }))}
                rows={3}
              />
              <Button onClick={addFAQ} size="sm">추가</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="card">
              {editingId === faq.id ? (
                <div className="space-y-4">
                  <Input
                    label="질문"
                    type="text"
                    value={editForm.question}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, question: (e.target as HTMLInputElement).value }))}
                  />
                  <Input
                    as="textarea"
                    label="답변"
                    value={editForm.answer}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, answer: (e.target as HTMLTextAreaElement).value }))}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm">저장</Button>
                    <Button onClick={() => setEditingId(null)} variant="secondary" size="sm">취소</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Q: {faq.question}</h3>
                    <p className="text-sm text-gray-600">A: {faq.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button onClick={() => startEdit(faq)} variant="ghost" size="sm">수정</Button>
                    <Button onClick={() => deleteFAQ(faq.id)} variant="danger" size="sm">삭제</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">정책 콘텐츠</h2>
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">
            이용약관, 개인정보처리방침, 환불 정책 등의 정책 콘텐츠 편집 기능은 추후 업데이트 예정입니다.
            현재는 고객지원 페이지에서 기본 내용을 확인할 수 있습니다.
          </p>
          <div className="mt-4 space-y-2">
            {['이용약관', '개인정보처리방침', '환불 정책', '금지 요청 정책'].map((policy) => (
              <div key={policy} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-900">{policy}</span>
                <span className="text-xs text-gray-400">편집 기능 준비 중</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
