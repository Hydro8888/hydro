/**
 * image-generator.ts
 * Phase 3: Generates images for articles that lack an imageUrl (OpenAI image API).
 *
 * OFF by default — every image costs money and articles without a photo already
 * get a category photo + placeholder fallback in the UI. Enable with
 * OPENAI_IMAGE_GENERATION=true (model: OPENAI_IMAGE_MODEL, default gpt-image-2.5-flare).
 *
 * The API returns base64 data, which is saved under OPENAI_IMAGE_DIR and stored
 * in the article as /livenews/api/generated-image/<file>.
 */

import type { TranslatableArticle } from './translator';
import { aiImageBreaker, CircuitOpenError } from '../lib/circuit-breaker';
import { createAiClient, isImageGenerationEnabled, resolveImageModel } from '../lib/ai-client';
import { getErrorStatus, isBillingError } from '../lib/retry';
import { saveGeneratedImage } from '../lib/generated-image-store';

/** Minimal structural type so tests can inject a fake client. */
export interface ImageClient {
  images: { generate(params: any): Promise<any> };
}

export interface ImageGenerationOptions {
  client?: ImageClient | null;
  /** Bypass the OPENAI_IMAGE_GENERATION flag (tests). */
  force?: boolean;
  dir?: string;
  pauseMs?: number;
}

/**
 * Errors after which further image requests in this run are pointless:
 * open circuit, billing refusal, or an HTTP status that will not change per
 * article (bad request / auth / unknown model).
 */
function isFatalImageError(err: unknown): boolean {
  if (err instanceof CircuitOpenError || isBillingError(err)) return true;
  const status = getErrorStatus(err);
  return status === 400 || status === 401 || status === 403 || status === 404;
}

function imagePrompt(article: TranslatableArticle): string {
  return (
    `Professional news article header image for: "${article.titleOriginal}". ` +
    `Category: ${article.categoryPrimary || 'general news'}. ` +
    'Style: photojournalism, realistic, high quality, editorial photo. No text, letters, logos or watermarks.'
  );
}

export async function generateImages(
  articles: TranslatableArticle[],
  opts: ImageGenerationOptions = {},
): Promise<TranslatableArticle[]> {
  if (!opts.force && !isImageGenerationEnabled()) return articles;

  const client = opts.client === undefined ? createAiClient('image') : opts.client;
  if (!client) {
    console.warn('[image-generator] OPENAI_API_KEY not set — skipping image generation');
    return articles;
  }

  const articlesWithoutImage = articles.filter((a) => !a.imageUrl);
  if (articlesWithoutImage.length === 0) return articles;

  const model = resolveImageModel();
  console.log(
    `[image-generator] Generating images for ${articlesWithoutImage.length} articles without photos (model=${model})...`,
  );

  for (const article of articlesWithoutImage) {
    try {
      const b64 = await aiImageBreaker.execute(async () => {
        const res = await client.images.generate({
          model,
          prompt: imagePrompt(article),
          n: 1,
          size: '1536x1024',
          quality: 'low',
          output_format: 'jpeg',
          output_compression: 80,
        });
        const data = res?.data?.[0];
        return typeof data?.b64_json === 'string' ? data.b64_json : '';
      });

      const url = b64 ? await saveGeneratedImage(article.originalUrl || article.titleOriginal, b64, 'jpg', opts.dir) : null;
      if (url) {
        article.imageUrl = url;
        console.log(`[image-generator] Generated image for "${article.titleOriginal.slice(0, 40)}..."`);
      } else {
        console.warn('[image-generator] Response contained no usable image data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[image-generator] Image generation failed: ${msg}`);

      // Stop trying if the model / key / account is not usable
      if (isFatalImageError(err)) {
        console.warn(
          `[image-generator] Image generation unavailable (${getErrorStatus(err) ?? 'circuit open'}). Skipping remaining.`,
        );
        break;
      }
    }

    await new Promise((r) => setTimeout(r, opts.pauseMs ?? 1000));
  }

  console.log('[image-generator] Image generation complete');
  return articles;
}
