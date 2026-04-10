'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'AI Portal Pro는 무엇인가요?',
    a: 'GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro, Grok 등 전세계 TOP 10 프리미엄 AI 모델을 하나의 통합 대시보드에서 사용할 수 있는 플랫폼입니다. 각 AI의 강점을 비교하고, 팀과 공유하며, 비용을 효율적으로 관리할 수 있습니다.',
  },
  {
    q: '무료로 사용할 수 있나요?',
    a: '네, 카드 정보 없이 바로 시작할 수 있습니다. Free 플랜은 매달 50,000 토큰, 3개 기본 모델, 7일 대화 히스토리를 제공합니다. 업그레이드는 언제든지 가능하며, 언제든 취소할 수 있습니다.',
  },
  {
    q: '어떤 AI 모델을 사용할 수 있나요?',
    a: 'OpenAI GPT-5.4, Anthropic Claude Opus 4.6, Google Gemini 3.1 Pro, xAI Grok 4, Meta Llama 3.1, Cohere, Mistral, Amazon Nova, AI21, Perplexity 등 9개 제공사의 최신 모델을 지원합니다.',
  },
  {
    q: '내 데이터는 안전한가요?',
    a: '모든 데이터는 암호화되어 저장되며, 사용자 동의 없이 AI 학습에 사용되지 않습니다. Enterprise 플랜에서는 SSO/SAML, 감사 로그, 데이터 레지던시 옵션을 제공합니다.',
  },
  {
    q: '팀 계정은 어떻게 작동하나요?',
    a: 'Team 플랜에서는 최대 10명의 팀원과 워크스페이스를 공유하고, 대화를 협업하며, 관리자 대시보드를 통해 사용량과 비용을 통합 관리할 수 있습니다.',
  },
  {
    q: '다른 요금제로 언제든지 변경할 수 있나요?',
    a: '네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경 사항은 즉시 반영되며, 월별 요금은 일할 계산됩니다.',
  },
  {
    q: 'API 액세스가 제공되나요?',
    a: 'Pro 및 Team 플랜에서 REST API가 제공됩니다. 자체 애플리케이션에 AI 기능을 통합하거나 자동화 워크플로우를 구축할 수 있습니다.',
  },
  {
    q: '광고 파트너십은 어떻게 신청하나요?',
    a: 'contact@free.ai.kr로 연락주시면 광고 파트너십, 스폰서십, 기업 제휴 등 다양한 옵션을 안내해드립니다.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      variant="white"
      eyebrow="FAQ"
      title="자주 묻는 질문"
      subtitle="더 궁금한 점이 있으시면 언제든 연락주세요"
      containerSize="md"
    >
      <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full py-6 flex items-start justify-between gap-6 text-left hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded-lg"
                aria-expanded={isOpen}
                aria-label={`질문 ${isOpen ? '닫기' : '열기'}: ${faq.q}`}
              >
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  {faq.q}
                </h3>
                <ChevronDown
                  className={cn(
                    'shrink-0 w-5 h-5 text-gray-400 transition-transform duration-200 mt-1',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
              {isOpen && (
                <p className="pb-6 text-base text-gray-600 dark:text-gray-400 leading-relaxed -mt-2 pr-12">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
