'use client';

import { useState } from 'react';

export default function ArticleHeroImage({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="w-full h-auto max-h-[280px] sm:max-h-[450px] object-cover"
      onError={() => setImgSrc(fallback)}
    />
  );
}
