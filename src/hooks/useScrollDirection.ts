'use client';

import { useState, useEffect, useRef } from 'react';

export type ScrollDirection = 'up' | 'down';

/**
 * Tracks vertical scroll direction.
 * Returns 'down' when scrolling past `threshold` pixels downward,
 * 'up' otherwise. Designed for shrink-on-scroll header patterns.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up');
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY.current) >= threshold) {
          setDirection(y > lastY.current ? 'down' : 'up');
          lastY.current = y;
        }
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return direction;
}
