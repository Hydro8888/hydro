import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

const model = process.env.XAI_MODEL || 'grok-4-1-fast';

export async function translateToKorean(text: string): Promise<string> {
  if (!text || !process.env.XAI_API_KEY) return '';
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '당신은 뉴스 제목 번역 전문가입니다. 영어/일본어/중국어 뉴스 제목을 자연스러운 한국어로 번역하세요. 번역문만 출력하세요.' },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('Translation error:', e);
    return '';
  }
}

export async function summarizeToKorean(title: string, snippet?: string): Promise<string> {
  if (!title || !process.env.XAI_API_KEY) return '';
  const content = snippet ? `제목: ${title}\n내용: ${snippet}` : `제목: ${title}`;
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '당신은 뉴스 요약 전문가입니다. 주어진 뉴스 제목과 내용을 바탕으로 한국어 2~3문장 요약을 작성하세요. 요약문만 출력하세요.' },
        { role: 'user', content },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('Summary error:', e);
    return '';
  }
}

export async function categorizeArticle(title: string): Promise<{ primary: string; secondary: string }> {
  if (!title || !process.env.XAI_API_KEY) return { primary: 'general', secondary: '' };

  const categories = [
    'politics', 'economy', 'market', 'business', 'ai-tech', 'semiconductor',
    'automotive', 'energy', 'society', 'culture', 'entertainment', 'sports',
    'science', 'health', 'travel', 'opinion', 'world',
  ];

  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `뉴스 기사의 카테고리를 분류하세요. 가능한 카테고리: ${categories.join(', ')}. JSON으로 응답하세요: {"primary":"카테고리","secondary":"카테고리 또는 빈문자열"}`,
        },
        { role: 'user', content: title },
      ],
      max_tokens: 100,
      temperature: 0.1,
    });
    const text = res.choices[0]?.message?.content?.trim() || '';
    const match = text.match(/\{[^}]+\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return { primary: parsed.primary || 'general', secondary: parsed.secondary || '' };
      } catch { /* malformed JSON from AI */ }
    }
  } catch (e) {
    console.error('Categorize error:', e);
  }
  return { primary: 'general', secondary: '' };
}

export async function batchTranslateAndCategorize(
  articles: Array<{ title: string; snippet?: string }>
): Promise<Array<{ titleKo: string; summaryKo: string; primary: string; secondary: string }>> {
  if (!process.env.XAI_API_KEY || articles.length === 0) {
    return articles.map(() => ({ titleKo: '', summaryKo: '', primary: 'general', secondary: '' }));
  }

  const titlesText = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');

  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `당신은 뉴스 처리 전문가입니다. 각 뉴스 제목에 대해:
1. 한국어 번역 제목
2. 한국어 1문장 요약
3. 카테고리 분류 (politics/economy/market/business/ai-tech/semiconductor/automotive/energy/society/culture/entertainment/sports/science/health/world/general)

JSON 배열로 응답하세요: [{"titleKo":"...","summaryKo":"...","primary":"...","secondary":"..."}]
정확히 ${articles.length}개의 항목을 반환하세요.`,
        },
        { role: 'user', content: titlesText },
      ],
      max_tokens: articles.length * 200,
      temperature: 0.2,
    });

    const text = res.choices[0]?.message?.content?.trim() || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === articles.length) {
          return parsed;
        }
      } catch { /* malformed JSON from AI */ }
    }
  } catch (e) {
    console.error('Batch translate error:', e);
  }

  return articles.map(() => ({ titleKo: '', summaryKo: '', primary: 'general', secondary: '' }));
}

/**
 * Translate article content (body) to Korean.
 * Processes one article at a time to handle long content.
 */
export async function translateContent(content: string): Promise<string> {
  if (!content || !process.env.XAI_API_KEY) return '';

  // Limit content to 2500 chars to manage API costs
  const trimmed = content.slice(0, 2500);

  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `당신은 뉴스 기사 번역 전문가입니다. 주어진 영문 뉴스 기사 본문을 자연스러운 한국어로 번역하세요.

규칙:
- 뉴스 기사 스타일의 격식체 사용 (예: ~했다, ~이다)
- 고유명사(인명, 지명, 기관명)는 원문 그대로 유지하거나 널리 알려진 한국어 표기 사용
- 문단 구분을 유지하세요
- 번역문만 출력하세요 (설명이나 주석 없이)`,
        },
        { role: 'user', content: trimmed },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('Content translation error:', e);
    return '';
  }
}
