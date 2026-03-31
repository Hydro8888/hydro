/**
 * translator.ts
 * Translates and categorizes article titles using xAI Grok via batchTranslateAndCategorize.
 * Processes articles in chunks of 10 to stay within token limits and avoid rate errors.
 */

import OpenAI from 'openai';
import type { NormalizedArticle } from './normalizer';

// ---------------------------------------------------------------------------
// Inline batchTranslateAndCategorize to avoid @/ alias issues in tsx runner
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 10;

interface TranslationResult {
  titleKo: string;
  summaryKo: string;
  primary: string;
  secondary: string;
}

function buildClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

async function translateChunk(
  client: OpenAI,
  model: string,
  articles: Array<{ title: string; snippet?: string }>,
): Promise<TranslationResult[]> {
  const titlesText = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');

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

  const text = res.choices[0]?.message?.content?.trim() ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    const parsed: unknown = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.length === articles.length) {
      return parsed as TranslationResult[];
    }
  }

  // If the response count doesn't match, return empty placeholders
  console.warn(
    `[translator] Unexpected response length for chunk of ${articles.length}. Using placeholders.`,
  );
  return articles.map(() => ({ titleKo: '', summaryKo: '', primary: 'general', secondary: '' }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TranslatableArticle = NormalizedArticle & {
  titleKo?: string;
  summaryKo?: string;
  categoryPrimary?: string;
  categorySecondary?: string;
};

/**
 * Accepts an array of normalized articles and enriches each one with:
 *   - titleKo        — Korean-translated headline
 *   - summaryKo      — Korean one-sentence summary
 *   - categoryPrimary   — primary category slug
 *   - categorySecondary — secondary category slug (may be empty)
 *
 * Articles are processed in chunks of {@link CHUNK_SIZE}.
 * Any chunk that fails is silently skipped (fields remain empty strings).
 */
export async function translateArticles(
  articles: TranslatableArticle[],
): Promise<TranslatableArticle[]> {
  if (articles.length === 0) return articles;

  const client = buildClient();
  if (!client) {
    console.warn('[translator] XAI_API_KEY not set — skipping translation');
    return articles.map((a) => ({
      ...a,
      titleKo: '',
      summaryKo: '',
      categoryPrimary: 'general',
      categorySecondary: '',
    }));
  }

  const model = process.env.XAI_MODEL || 'grok-4-1-fast';
  const results: TranslatableArticle[] = [];

  for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
    const chunk = articles.slice(i, i + CHUNK_SIZE);
    const chunkLabel = `[${i + 1}–${Math.min(i + CHUNK_SIZE, articles.length)}/${articles.length}]`;

    let translations: TranslationResult[];
    try {
      translations = await translateChunk(
        client,
        model,
        chunk.map((a) => ({ title: a.titleOriginal })),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[translator] Chunk ${chunkLabel} failed: ${message}`);
      // Keep originals untouched with empty AI fields
      translations = chunk.map(() => ({
        titleKo: '',
        summaryKo: '',
        primary: 'general',
        secondary: '',
      }));
    }

    for (let j = 0; j < chunk.length; j++) {
      const t = translations[j];
      results.push({
        ...chunk[j],
        titleKo: t?.titleKo ?? '',
        summaryKo: t?.summaryKo ?? '',
        categoryPrimary: t?.primary ?? 'general',
        categorySecondary: t?.secondary ?? '',
      });
    }

    console.log(`[translator] Translated chunk ${chunkLabel}`);

    // Small pause between chunks to be polite to the API
    if (i + CHUNK_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}
