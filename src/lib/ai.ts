import type { AIClassifyResult, AIModerationResult, AIMatchResult } from '@/types';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_MODEL = 'grok-3-fast';

interface HelperInfo {
  id: string;
  name: string;
  categories: string;
  bio?: string | null;
  completedCount: number;
  onTimeRate: number;
  avgRating: number;
  available: boolean;
  badges?: string | null;
}

interface RequestInfo {
  title: string;
  description: string;
  category: string;
  urgency: string;
  location?: string | null;
  budget?: number | null;
  scheduledAt?: string | null;
}

async function callGrok(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`xAI API 호출 실패 (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  return content;
}

function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }
  return raw.trim();
}

/**
 * 사용자의 자연어 요청을 분석하여 카테고리, 긴급도, 예상 비용 등을 분류합니다.
 */
export async function classifyRequest(input: string): Promise<AIClassifyResult> {
  const systemPrompt = `당신은 생활대행·심부름 매칭 플랫폼 "심부름"의 AI 분류 도우미입니다.
사용자의 요청을 분석하여 다음 정보를 JSON 형식으로 반환해주세요.

카테고리 종류: CLEANING(청소), DELIVERY(배달·운반), SHOPPING(장보기·쇼핑), MOVING(이사·운송), REPAIR(수리·설치), ERRAND(심부름), PET(반려동물), CARE(돌봄), OTHER(기타)
긴급도 종류: LOW(여유), NORMAL(보통), HIGH(급함), URGENT(긴급)
리스크 수준: LOW, MEDIUM, HIGH

반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 포함하지 마세요.
{
  "category": "카테고리 코드",
  "urgency": "긴급도 코드",
  "suggestedMin": 최소 예상 비용(숫자, 원 단위),
  "suggestedMax": 최대 예상 비용(숫자, 원 단위),
  "missingInfo": ["부족한 정보 1", "부족한 정보 2"],
  "riskLevel": "리스크 수준"
}`;

  const raw = await callGrok(systemPrompt, input);
  const json = extractJSON(raw);
  const parsed = JSON.parse(json) as AIClassifyResult;
  return parsed;
}

/**
 * 사용자의 요청이 플랫폼 정책에 부합하는지 검토합니다.
 */
export async function moderateRequest(input: string): Promise<AIModerationResult> {
  const systemPrompt = `당신은 생활대행·심부름 매칭 플랫폼 "심부름"의 콘텐츠 모더레이터입니다.
사용자의 요청이 플랫폼 정책에 부합하는지 검토해주세요.

거부 사유:
- 불법적인 활동 요청 (마약, 도박, 불법 대리 등)
- 성적인 내용 또는 성인 서비스 요청
- 폭력, 위협, 혐오 표현
- 개인정보 탈취 시도
- 사기 또는 기만적 행위
- 타인에게 해를 끼칠 수 있는 요청

리스크 수준: LOW(안전), MEDIUM(주의 필요), HIGH(위험)

반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 포함하지 마세요.
{
  "allowed": true 또는 false,
  "reason": "거부 사유 (allowed가 false일 때만)",
  "riskLevel": "리스크 수준"
}`;

  const raw = await callGrok(systemPrompt, input);
  const json = extractJSON(raw);
  const parsed = JSON.parse(json) as AIModerationResult;
  return parsed;
}

/**
 * 요청 정보와 헬퍼 목록을 기반으로 최적의 헬퍼를 매칭합니다.
 */
export async function matchHelpers(
  request: RequestInfo,
  helpers: HelperInfo[]
): Promise<AIMatchResult> {
  const systemPrompt = `당신은 생활대행·심부름 매칭 플랫폼 "심부름"의 AI 매칭 도우미입니다.
요청 정보와 헬퍼 목록을 분석하여 가장 적합한 헬퍼를 점수화하고 순위를 매겨주세요.

매칭 기준:
1. 카테고리 적합성 (헬퍼의 전문 분야와 요청 카테고리 일치 여부)
2. 평균 평점 (avgRating)
3. 완료 건수 (completedCount) - 경험이 많을수록 우대
4. 정시 완료율 (onTimeRate) - 긴급 요청일수록 중요
5. 현재 가용 여부 (available)
6. 뱃지 보유 현황

각 헬퍼에 대해 0~100 사이의 점수를 부여하고, 점수가 높은 순으로 정렬해주세요.
가용하지 않은(available=false) 헬퍼는 점수를 0으로 설정하세요.

반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 포함하지 마세요.
{
  "matches": [
    {
      "helperId": "헬퍼ID",
      "score": 점수(0~100),
      "reasons": ["선정 사유 1", "선정 사유 2"]
    }
  ]
}`;

  const userMessage = `요청 정보:
${JSON.stringify(request, null, 2)}

헬퍼 목록:
${JSON.stringify(helpers, null, 2)}`;

  const raw = await callGrok(systemPrompt, userMessage);
  const json = extractJSON(raw);
  const parsed = JSON.parse(json) as AIMatchResult;

  parsed.matches.sort((a, b) => b.score - a.score);

  return parsed;
}
