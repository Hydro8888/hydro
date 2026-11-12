'use client';

import { useState } from 'react';
import ArticleImage from './ArticleImage';
import { resolveImageSources } from '@/lib/image-chain';
import { cn } from '@/lib/utils';

interface ArticleHeroImageProps {
  /** Preferred: getArticleImageSources(article). */
  sources?: readonly string[];
  /** Legacy pair, used only when `sources` is empty. */
  src?: string;
  fallback?: string;
  /** Defaults to '' (decorative — the headline follows right below). */
  alt?: string;
  /** @deprecated Unused since the unslop pass: categories carry no color. Kept so existing callers compile. */
  categoryPrimary?: string | null;
  /** Source name shown as a quiet wordmark when no photo is available. */
  sourceName?: string | null;
}

/**
 * Article hero with a fixed frame (16:10 on mobile, 2:1 from sm) so a slow image never
 * shifts the body text. When the chain ends on the placeholder ("no image") the frame
 * settles once into a low strip (3:1 / 4:1) with the source wordmark instead of a large empty box.
 */
export default function ArticleHeroImage({ sources, src, fallback, alt, sourceName }: ArticleHeroImageProps) {
  const list = resolveImageSources({ sources, src, fallback });
  const [noImage, setNoImage] = useState(false);
  const wordmark = typeof sourceName === 'string' ? sourceName.trim() : '';

  return (
    <div
      data-no-image={noImage ? '' : undefined}
      className={cn('relative w-full bg-surface-elevated', noImage ? 'aspect-[3/1] sm:aspect-[4/1]' : 'aspect-[16/10] sm:aspect-[2/1]')}
    >
      <ArticleImage
        sources={list}
        alt={alt ?? ''}
        priority
        sizes="(min-width: 920px) 896px, 100vw"
        onSettled={setNoImage}
        className={cn('absolute inset-0 h-full w-full', noImage ? 'object-contain' : 'object-cover')}
      />
      {noImage && wordmark && (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-4 text-caption text-text-muted">
          {wordmark}
        </span>
      )}
    </div>
  );
}
