'use client';

import { useEffect, useState } from 'react';
import { SITE_STATS_PATH, parseSiteStats, withBasePath, type SiteStats } from '@/lib/site';

// One shared request for every subscriber (Header LiveStats + Footer FooterStats),
// refreshed by a single 5-minute timer that stops when nobody is subscribed.

const REFRESH_MS = 5 * 60 * 1000;

let lastValue: SiteStats | null = null;
let inFlight: Promise<SiteStats | null> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(v: SiteStats | null) => void>();

function load(): Promise<SiteStats | null> {
  if (!inFlight) {
    inFlight = fetch(withBasePath(SITE_STATS_PATH), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => parseSiteStats(json))
      .catch(() => null)
      .then((value) => {
        lastValue = value;
        inFlight = null;
        subscribers.forEach((fn) => fn(value));
        return value;
      });
  }
  return inFlight;
}

export function useSiteStats(): SiteStats | null {
  const [stats, setStats] = useState<SiteStats | null>(lastValue);

  useEffect(() => {
    subscribers.add(setStats);
    if (lastValue) setStats(lastValue);
    else void load();
    if (!timer) timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      subscribers.delete(setStats);
      if (subscribers.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return stats;
}
