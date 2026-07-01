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

/**
 * Wraps an external image URL through our image proxy to avoid
 * CORS, hotlink blocking, and mixed content issues.
 * Only proxies external URLs — data URIs and relative paths pass through.
 */
export function proxyImageUrl(url: string): string {
  if (!url || url.startsWith('data:') || url.startsWith('/')) return url;
  return `/livenews/api/img?url=${encodeURIComponent(url)}`;
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
    // Country subcategory slugs (COUNTRY_SUBCATEGORIES) — without these the
    // category page title / breadcrumb shows the raw English slug
    'international-politics': '국제정치', 'war-diplomacy': '전쟁/외교',
    'global-economy': '글로벌 경제', climate: '기후/환경',
    'international-society': '국제사회', bigtech: '빅테크',
    industry: '산업', policy: '정책', technology: '기술',
    trade: '무역', international: '국제관계',
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

/**
 * Curated Unsplash photo IDs per category — permanent, high-quality editorial photos.
 * Each photo ID resolves to: https://images.unsplash.com/{id}?w=800&h=500&fit=crop
 * These are royalty-free photos from Unsplash's permanent CDN.
 */
const CATEGORY_PHOTOS: Record<string, string[]> = {
  economy:       ['photo-1611974789855-9c2a0a7236a3', 'photo-1590283603385-17ffb3a7f29f', 'photo-1526304640581-d334cdbbf45e', 'photo-1579532537598-459ecdaf39cc'],
  market:        ['photo-1611974789855-9c2a0a7236a3', 'photo-1535320903710-d946a44237ab', 'photo-1642790106117-e829e14a795f', 'photo-1468254095679-bbcba94a7066'],
  politics:      ['photo-1529107386315-e1a2ed48a620', 'photo-1555848962-6e79363ec58f', 'photo-1541872703-74c5e44368f9', 'photo-1575320181282-9afab399332c'],
  sports:        ['photo-1461896836934-bd45ba43fcee', 'photo-1579952363873-27f3bade9f55', 'photo-1517649763962-0c623066013b', 'photo-1574629810360-7efbbe195018'],
  'ai-tech':     ['photo-1677442136019-21780ecad995', 'photo-1620712943543-bcc4688e7485', 'photo-1555255707-c07966088b7b', 'photo-1518770660439-4636190af475'],
  semiconductor: ['photo-1518770660439-4636190af475', 'photo-1555255707-c07966088b7b', 'photo-1640955014216-7d4be39b5f94', 'photo-1558494949-ef010cbdcc31'],
  automotive:    ['photo-1492144534655-ae79c964c9d7', 'photo-1503376780353-7e6692767b70', 'photo-1549317661-bd32c8ce0abe', 'photo-1552519507-da3b142c6e3d'],
  energy:        ['photo-1466611653911-95081537e5b7', 'photo-1509391366360-2e959784a276', 'photo-1473341304170-971dccb5ac1e', 'photo-1532601224476-15c79f2f7a51'],
  entertainment: ['photo-1603190287605-e6ade32fa852', 'photo-1514533212735-5df27d970db0', 'photo-1470229722913-7c0e2dbbafd3', 'photo-1524368535928-5b5e00ddc76b'],
  health:        ['photo-1576091160399-112ba8d25d1d', 'photo-1559757148-5c350d0d3c56', 'photo-1530497610245-94d3c16cda28', 'photo-1505751172876-fa1923c5c528'],
  business:      ['photo-1486406146926-c627a92ad1ab', 'photo-1454165804606-c3d57bc86b40', 'photo-1507679799987-c73779587ccf', 'photo-1560179707-f14e90ef3623'],
  science:       ['photo-1507413245164-6160d8298b31', 'photo-1532094349884-543bc11b234d', 'photo-1451187580459-43490279c0fa', 'photo-1564325724739-bae0bd08762c'],
  society:       ['photo-1477959858617-67f85cf4f1df', 'photo-1480714378408-67cf0d13bc1b', 'photo-1519389950473-47ba0277781c', 'photo-1444723121867-7a241cacace9'],
  culture:       ['photo-1544967082-d9d25d867d66', 'photo-1518998053901-5348d3961a04', 'photo-1499781350541-7783f6c6a0c8', 'photo-1513364776144-60967b0f800f'],
  world:         ['photo-1451187580459-43490279c0fa', 'photo-1526778548025-fa2f459cd5c1', 'photo-1488085061387-422e29b40080', 'photo-1504198322253-cfa87a0ff25f'],
  general:       ['photo-1504711434969-e33886168d4c', 'photo-1495020689067-958852a7765e', 'photo-1585829365295-ab7cd400c167', 'photo-1586339949216-35c2747cc36d'],
};

/**
 * Returns a real photograph URL from Unsplash CDN for articles without photos.
 * Uses curated, permanent photo IDs — no API key needed, always available.
 * Article ID determines which photo is shown (consistent per article).
 */
export function getDefaultImage(category: string | null, articleId: number | string): string {
  const id = typeof articleId === 'string' ? parseInt(articleId) || 0 : articleId;
  const cat = (category || 'general').toLowerCase();
  const photos = CATEGORY_PHOTOS[cat] || CATEGORY_PHOTOS['general'];
  const photoId = photos[id % photos.length];
  return `https://images.unsplash.com/${photoId}?w=800&h=500&fit=crop&auto=format&q=75`;
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
