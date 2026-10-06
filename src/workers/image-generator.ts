/**
 * image-generator.ts
 * Phase 3: Generates images for articles that lack an imageUrl.
 * Split from translator.ts for separation of concerns.
 */

import type { TranslatableArticle } from './translator';
import { xaiImageBreaker, CircuitOpenError } from '../lib/circuit-breaker';
import { createXaiClient } from '../lib/xai-client';
import { getErrorStatus } from '../lib/retry';

/**
 * Errors after which further image requests in this run are pointless:
 * open circuit, or an HTTP status that will not change per article
 * (bad request / auth / unknown model).
 */
function isFatalImageError(err: unknown): boolean {
  if (err instanceof CircuitOpenError) return true;
  const status = getErrorStatus(err);
  return status === 400 || status === 401 || status === 403 || status === 404;
}

/**
 * Generates images for articles that have no imageUrl.
 * Uses xAI grok-2-image model. Stops early if the model is unavailable.
 */
export async function generateImages(
  articles: TranslatableArticle[],
): Promise<TranslatableArticle[]> {
  const client = createXaiClient('image');
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
      const imageModel = process.env.XAI_IMAGE_MODEL || 'grok-2-image';
      const url = await xaiImageBreaker.execute(async () => {
        const res = await client.images.generate({
          model: imageModel,
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

      // Stop trying if the model / key / API is not usable
      if (isFatalImageError(err)) {
        console.warn(
          `[image-generator] Image generation unavailable (${getErrorStatus(err) ?? 'circuit open'}). Skipping remaining.`,
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
