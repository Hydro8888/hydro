/**
 * image-generator.ts
 * Phase 3: Generates images for articles that lack an imageUrl.
 * Split from translator.ts for separation of concerns.
 */

import OpenAI from 'openai';
import type { TranslatableArticle } from './translator';
import { xaiImageBreaker, CircuitOpenError } from '../lib/circuit-breaker';

function buildClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

/**
 * Generates images for articles that have no imageUrl.
 * Uses xAI grok-2-image model. Stops early if the model is unavailable.
 */
export async function generateImages(
  articles: TranslatableArticle[],
): Promise<TranslatableArticle[]> {
  const client = buildClient();
  if (!client) {
    console.warn('[image-generator] XAI_API_KEY not set — skipping image generation');
    return articles;
  }

  const articlesWithoutImage = articles.filter((a) => !a.imageUrl);

  if (articlesWithoutImage.length === 0) {
    return articles;
  }

  console.log(
    `[image-generator] Generating images for ${articlesWithoutImage.length} articles without photos...`,
  );

  for (const article of articlesWithoutImage) {
    try {
      const url = await xaiImageBreaker.execute(async () => {
        const res = await client.images.generate({
          model: 'grok-2-image',
          prompt: `Professional news article header image for: "${article.titleOriginal}". Category: ${article.categoryPrimary || 'general news'}. Style: photojournalism, realistic, high quality, editorial photo. No text overlays.`,
          n: 1,
          size: '1024x1024',
        });
        return res.data?.[0]?.url || '';
      });

      if (url) {
        article.imageUrl = url;
        console.log(
          `[image-generator] Generated image for "${article.titleOriginal.slice(0, 40)}..."`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[image-generator] Image generation failed: ${msg}`);

      // Stop trying if the model is not available
      if (
        err instanceof CircuitOpenError ||
        msg.includes('model') ||
        msg.includes('not found') ||
        msg.includes('404')
      ) {
        console.warn(
          `[image-generator] Image generation model not available. Skipping remaining.`,
        );
        break;
      }
    }

    // Pause between generations
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[image-generator] Image generation complete`);
  return articles;
}
