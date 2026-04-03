/**
 * content-translator.ts
 * Phase 2: Translates full article content (contentOriginal → contentKo).
 * Split from translator.ts for separation of concerns.
 */

import OpenAI from 'openai';
import type { TranslatableArticle } from './translator';
import { xaiTextBreaker } from '../lib/circuit-breaker';
import { retryWithBackoff } from '../lib/retry';

function buildClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

/**
 * Translates article body content from original language to Korean.
 * Only processes articles that have contentOriginal longer than 30 chars.
 * Updates contentKo and improves summaryKo based on translated content.
 */
export async function translateContent(
  articles: TranslatableArticle[],
): Promise<TranslatableArticle[]> {
  const client = buildClient();
  if (!client) {
    console.warn('[content-translator] XAI_API_KEY not set — skipping content translation');
    return articles;
  }

  const model = process.env.XAI_MODEL || 'grok-4-1-fast';

  const articlesWithContent = articles.filter(
    (a) => a.contentOriginal && a.contentOriginal.length > 30,
  );

  if (articlesWithContent.length === 0) {
    return articles;
  }

  console.log(
    `[content-translator] Translating content for ${articlesWithContent.length} articles...`,
  );

  for (const article of articlesWithContent) {
    try {
      const trimmed = (article.contentOriginal || '').slice(0, 4500);

      const contentKo = await retryWithBackoff(
        () =>
          xaiTextBreaker.execute(async () => {
            const res = await client.chat.completions.create({
              model,
              messages: [
                {
                  role: 'system',
                  content: `당신은 뉴스 기사 번역 전문가입니다. 주어진 영문 뉴스 기사 본문을 자연스러운 한국어로 번역하세요.

규칙:
- 뉴스 기사 스타일의 격식체 사용 (예: ~했다, ~이다)
- 고유명사(인명, 지명, 기관명)는 원문 그대로 유지하거나 널리 알려진 한국어 표기 사용
- 문단 구분을 유지하세요 (빈 줄로 구분)
- 내용을 빠짐없이 모두 번역하세요
- 번역문만 출력하세요`,
                },
                { role: 'user', content: trimmed },
              ],
              max_tokens: 4000,
              temperature: 0.3,
            });
            return res.choices[0]?.message?.content?.trim() || '';
          }),
        { maxRetries: 2, baseDelay: 1500 },
      );

      article.contentKo = contentKo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[content-translator] Failed for "${article.titleOriginal.slice(0, 40)}": ${msg}`,
      );
      article.contentKo = '';
    }

    // Pause between translations
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[content-translator] Content translation complete`);
  return articles;
}
