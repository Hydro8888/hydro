'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { IMAGE_PLACEHOLDER_SRC } from '@/lib/constants';
import { nextImageIndex, resolveImageSources } from '@/lib/image-chain';

interface ArticleImageProps {
  /** Ordered candidates, usually getArticleImageSources(article). Always ends in the inline placeholder. */
  sources: readonly string[];
  /** Defaults to '' — article photos/fallback stock photos are decorative next to the headline. */
  alt?: string;
  /** Sizing is the parent's job, e.g. 'absolute inset-0 h-full w-full object-cover' inside a relative box. */
  className?: string;
  loading?: 'lazy' | 'eager';
  /** Called once the chain settles: true = ended on the placeholder, false = a real image loaded. */
  onSettled?: (isPlaceholder: boolean) => void;
}

/**
 * Article image that walks its fallback chain to the end:
 * original (proxied) → Unsplash → inline SVG placeholder. Never shows a broken icon or alt text.
 * Also recovers images that failed before hydration (onError never fired) by checking
 * `complete && naturalWidth === 0` after mount. The <img> carries `data-placeholder` when it
 * shows the placeholder.
 */
export default function ArticleImage({ sources, alt = '', className, loading = 'lazy', onSettled }: ArticleImageProps) {
  const list = resolveImageSources({ sources });
  // A new source list (e.g. the same instance reused for another article) restarts the chain.
  // The placeholder data URI is always the last entry, so it is left out of the key.
  const key = list.slice(0, -1).join('\n');
  return <ImageChain key={key} list={list} alt={alt} className={className} loading={loading} onSettled={onSettled} />;
}

function ImageChain({
  list,
  alt,
  className,
  loading,
  onSettled,
}: {
  list: string[];
  alt: string;
  className?: string;
  loading: 'lazy' | 'eager';
  onSettled?: (isPlaceholder: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const src = list[Math.min(idx, list.length - 1)];
  const isPlaceholder = src === IMAGE_PLACEHOLDER_SRC;
  const advance = () => setIdx((i) => nextImageIndex(i, list.length));

  useEffect(() => {
    if (isPlaceholder) {
      settledRef.current?.(true);
      return;
    }
    const img = ref.current;
    if (!img || !img.complete) return;
    // Failed before React attached onError (pre-hydration) → step forward once.
    if (img.naturalWidth === 0) advance();
    // Loaded before hydration (onLoad never fired) → report it now.
    else settledRef.current?.(false);
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
      data-placeholder={isPlaceholder ? '' : undefined}
      onError={advance}
      onLoad={isPlaceholder ? undefined : () => settledRef.current?.(false)}
      className={cn(className, 'text-transparent')}
    />
  );
}
