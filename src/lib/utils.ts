import { CATEGORY_COLORS } from './constants';

// ---------------------------------------------------------------------------
// Image validation — blocked URL patterns & domains
// ---------------------------------------------------------------------------

/** Blocked URL patterns indicating logos/placeholders, not real article images */
export const BLOCKED_IMAGE_PATTERNS: RegExp[] = [
  /logo/i,
  /brand/i,
  /favicon/i,
  /\bicon\b/i,
  /default[-_]?image/i,
  /placeholder/i,
  /share[-_]image/i,
  /site[-_]image/i,
  /og[-_]image/i,
  /sns[-_]image/i,
  /\/common\//i,
  /widget/i,
  /spacer/i,
  /pixel/i,
  /beacon/i,
  /tracking/i,
  /\b1x1\b/i,
  /\b50x50\b/i,
  /\b100x100\b/i,
  /\.svg(\?|$)/i,
  /^data:image\//i,
  /avatar/i,
  /banner[-_]?default/i,
  /transparent\./i,
  /blank\./i,
];

/** Domain-level patterns known to serve site-wide logos instead of article images */
export const BLOCKED_IMAGE_DOMAINS: RegExp[] = [
  /chinadaily\.com\.cn\/.*?(logo|masthead)/i,
  /chinadaily\.com\.cn\/image_e\//i,
  /cnbut\.png/i,
  /nhk\.or\.jp\/.*?common\//i,
  /reuters\.com\/pf\/resources\//i,
  /static\.bbc\.co\.uk\/.*?logo/i,
];

/** Domains known to serve site-wide logos instead of article images */
const BLOCKED_IMAGE_DOMAIN_NAMES = [
  'static.chinadaily.com.cn',
  'www.chinadaily.com.cn',
];

/** Check whether a URL looks like a real article image vs. site logo/placeholder */
export function isValidArticleImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length < 10) return false;

  // Check blocked patterns against full URL
  for (const pattern of BLOCKED_IMAGE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Check domain-level blocked patterns
  for (const pattern of BLOCKED_IMAGE_DOMAINS) {
    if (pattern.test(trimmed)) return false;
  }

  // Check blocked domain names
  try {
    const hostname = new URL(trimmed).hostname;
    if (BLOCKED_IMAGE_DOMAIN_NAMES.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return false;
    }
  } catch {
    return false; // malformed URL
  }

  return true;
}

/**
 * Normalizes an image URL: fixes protocol-relative URLs and upgrades http to https.
 * Returns null if the URL is not usable.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Fix protocol-relative URLs: //example.com/img.jpg → https://example.com/img.jpg
  if (trimmed.startsWith('//')) {
    trimmed = 'https:' + trimmed;
  }

  // Upgrade http to https to avoid mixed content blocking
  if (trimmed.startsWith('http://')) {
    trimmed = trimmed.replace(/^http:\/\//, 'https://');
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Category image seed keywords for default/fallback images
// ---------------------------------------------------------------------------

const CATEGORY_IMAGE_SEEDS: Record<string, string[]> = {
  economy: ['finance', 'stockmarket', 'trading', 'charts'],
  market: ['wallstreet', 'stocks', 'exchange', 'trading-floor'],
  politics: ['government', 'capitol', 'parliament', 'diplomacy'],
  sports: ['stadium', 'athletics', 'competition', 'match'],
  'ai-tech': ['technology', 'circuit', 'digital', 'computing'],
  semiconductor: ['microchip', 'silicon', 'wafer', 'processor'],
  automotive: ['automobile', 'factory', 'vehicle', 'highway'],
  energy: ['power', 'solar', 'wind-turbine', 'pipeline'],
  entertainment: ['performance', 'stage', 'cinema', 'entertainment'],
  health: ['medical', 'hospital', 'wellness', 'healthcare'],
  business: ['office', 'meeting', 'corporate', 'skyline'],
  science: ['laboratory', 'research', 'space', 'microscope'],
  society: ['cityscape', 'community', 'urban', 'people'],
  culture: ['museum', 'art', 'heritage', 'festival'],
  world: ['globe', 'international', 'landscape', 'travel'],
  general: ['newsroom', 'newspaper', 'press', 'editorial'],
};

export function timeAgo(date: Date | string | null): string {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function countryLabel(code: string): string {
  const map: Record<string, string> = {
    global: '세계', us: '미국', japan: '일본', china: '중국',
  };
  return map[code] || code;
}

export function countryColor(code: string): string {
  const map: Record<string, string> = {
    global: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    us: 'bg-red-500/15 text-red-400 border border-red-500/20',
    japan: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
    china: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  };
  return map[code] || 'bg-surface-elevated text-text-secondary';
}

export function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    politics: '정치', economy: '경제', market: '증시', business: '비즈니스',
    'ai-tech': 'AI·테크', semiconductor: '반도체', automotive: '자동차',
    energy: '에너지', society: '사회', culture: '문화', entertainment: '연예',
    sports: '스포츠', science: '과학', health: '건강', world: '세계',
    general: '일반', opinion: '오피니언', travel: '여행',
  };
  return map[slug] || slug;
}

export function buildSearchParams(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  return sp.toString();
}

/** Category-specific colors for SVG placeholder images */
const CATEGORY_PLACEHOLDER_COLORS: Record<string, { bg: string; fg: string; icon: string }> = {
  economy: { bg: '#1e3a5f', fg: '#58a6ff', icon: '📊' },
  market: { bg: '#1e2a4a', fg: '#818cf8', icon: '📈' },
  politics: { bg: '#3b1c32', fg: '#f87171', icon: '🏛' },
  sports: { bg: '#1a3329', fg: '#4ade80', icon: '⚽' },
  'ai-tech': { bg: '#1a2e3d', fg: '#22d3ee', icon: '🤖' },
  semiconductor: { bg: '#2d1f4e', fg: '#a78bfa', icon: '💾' },
  automotive: { bg: '#1e2d3d', fg: '#38bdf8', icon: '🚗' },
  energy: { bg: '#2d2a1a', fg: '#fbbf24', icon: '⚡' },
  entertainment: { bg: '#3b1d3d', fg: '#f472b6', icon: '🎬' },
  health: { bg: '#1a2e1a', fg: '#a3e635', icon: '🏥' },
  business: { bg: '#1a2e2a', fg: '#34d399', icon: '💼' },
  science: { bg: '#1a2e3d', fg: '#2dd4bf', icon: '🔬' },
  society: { bg: '#2d2218', fg: '#fb923c', icon: '🏙' },
  culture: { bg: '#3b1d2a', fg: '#fb7185', icon: '🎨' },
  world: { bg: '#1e2a3d', fg: '#60a5fa', icon: '🌍' },
  general: { bg: '#1e2530', fg: '#94a3b8', icon: '📰' },
};

/**
 * Returns a self-contained SVG data URI as default image for articles without photos.
 * No external service dependency — always works offline.
 */
export function getDefaultImage(category: string | null, articleId: number | string): string {
  const cat = (category || 'general').toLowerCase();
  const colors = CATEGORY_PLACEHOLDER_COLORS[cat] || CATEGORY_PLACEHOLDER_COLORS['general'];
  const label = categoryLabel(cat) || cat.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="${colors.bg}"/>
    <text x="400" y="220" text-anchor="middle" font-size="64">${colors.icon}</text>
    <text x="400" y="300" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="${colors.fg}">${label}</text>
    <text x="400" y="340" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="${colors.fg}" opacity="0.5">LiveNews</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Design System helpers (Slice S1)
// ---------------------------------------------------------------------------

/** Returns category color classes (border, text, bg) for the given slug */
export function getCategoryStyle(slug: string): { border: string; text: string; bg: string } {
  return CATEGORY_COLORS[slug] || { border: 'border-l-gray-500', text: 'text-text-secondary', bg: 'bg-surface-elevated' };
}

/** Merges class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Estimates reading time in minutes based on character count.
 * Korean reading speed: ~500 characters per minute.
 * Returns at least 1.
 */
export function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 1;
  const charCount = content.replace(/\s/g, '').length;
  return Math.max(1, Math.round(charCount / 500));
}
