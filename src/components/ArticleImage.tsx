'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { nextImageIndex, resolveImageSources } from '@/lib/image-chain';

interface ArticleImageProps {
  /** Ordered candidates, usually getArticleImageSources(article). Always ends in the inline placeholder. */
  sources: readonly string[];
  /** Defaults to '' — article photos/fallback stock photos are decorative next to the headline. */
  alt?: string;
  /** Sizing is the parent's job, e.g. 'absolute inset-0 h-full w-full object-cover' inside a relative box. */
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Article image that walks its fallback chain to the end:
 * original (proxied) → Unsplash → inline SVG placeholder. Never shows a broken icon or alt text.
 * Also recovers images that failed before hydration (onError never fired) by checking
 * `complete && naturalWidth === 0` after mount.
 */
export default function ArticleImage({ sources, alt = '', className, loading = 'lazy' }: ArticleImageProps) {
  const list = resolveImageSources({ sources });
  // A new source list (e.g. the same instance reused for another article) restarts the chain.
  return <ImageChain key={list.join('\n')} list={list} alt={alt} className={className} loading={loading} />;
}

function ImageChain({
  list,
  alt,
  className,
  loading,
}: {
  list: string[];
  alt: string;
  className?: string;
  loading: 'lazy' | 'eager';
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const src = list[Math.min(idx, list.length - 1)];
  const advance = () => setIdx((i) => nextImageIndex(i, list.length));

  useEffect(() => {
    const img = ref.current;
    // Failed before React attached onError (pre-hydration) → step forward once.
    if (img && img.complete && img.naturalWidth === 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={advance}
      className={cn(className, 'text-transparent')}
    />
  );
}
