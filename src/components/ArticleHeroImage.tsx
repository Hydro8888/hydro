'use client';

import ArticleImage from './ArticleImage';
import { resolveImageSources } from '@/lib/image-chain';

interface ArticleHeroImageProps {
  /** Preferred: getArticleImageSources(article). */
  sources?: readonly string[];
  /** Legacy pair, used only when `sources` is empty. */
  src?: string;
  fallback?: string;
  /** Defaults to '' (decorative — the headline follows right below). */
  alt?: string;
}

/**
 * Article hero with a fixed frame (16:10 on mobile, 2:1 from sm) so a slow or failed image
 * never collapses the box or shifts the body text. Ends in the inline placeholder.
 */
export default function ArticleHeroImage({ sources, src, fallback, alt }: ArticleHeroImageProps) {
  const list = resolveImageSources({ sources, src, fallback });
  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[2/1] bg-surface-elevated">
      <ArticleImage
        sources={list}
        alt={alt ?? ''}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
