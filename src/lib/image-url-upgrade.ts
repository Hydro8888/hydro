/**
 * image-url-upgrade.ts
 * Many feeds give a THUMBNAIL as the article image (e.g. CGTN "…-250.png",
 * 250×140), which looks blurry once stretched over a card or the article hero.
 * For CDNs whose URLs encode the size, return the URL of a larger variant.
 *
 * Pure. Only the size part of the path changes — never the host — and the image
 * proxy always falls back to the original URL when the larger one fails.
 */

/** Width we ask the CDNs for: enough for a 2× phone screen and the desktop hero. */
export const UPGRADE_TARGET_WIDTH = 1280;

interface Rule {
  name: string;
  host: RegExp;
  upgrade: (u: URL) => boolean;
}

const RULES: Rule[] = [
  {
    // news.cgtn.com/…/img/<id>/<id>-250.png → -1280.png (750 / 1280 / 1920 exist with the same extension)
    name: 'cgtn',
    host: /(^|\.)cgtn\.com$/,
    upgrade: (u) => {
      const m = u.pathname.match(/^(.*\/[0-9a-f]{32})-(\d{2,4})\.(png|jpe?g|webp)$/i);
      if (!m || Number(m[2]) >= UPGRADE_TARGET_WIDTH) return false;
      u.pathname = `${m[1]}-${UPGRADE_TARGET_WIDTH}.${m[3]}`;
      return true;
    },
  },
  {
    // ichef.bbci.co.uk/news/240/cpsprodpb/… → /news/1024/…  (also /ace/standard/240/, /ace/ws/240/)
    name: 'bbc',
    host: /^ichef\.bbci\.co\.uk$/,
    upgrade: (u) => {
      const m = u.pathname.match(/^\/(news|ace\/standard|ace\/ws)\/(\d{2,4})\//);
      if (!m || Number(m[2]) >= 1024) return false;
      u.pathname = u.pathname.replace(m[0], `/${m[1]}/1024/`);
      return true;
    },
  },
  {
    // static01.nyt.com/…-thumbStandard.jpg / -moth.jpg / -articleInline.jpg → -superJumbo.jpg
    name: 'nyt',
    host: /(^|\.)nyt\.com$/,
    upgrade: (u) => {
      const m = u.pathname.match(/^(.*)-(thumbStandard|thumbLarge|moth|blogSmallThumb|articleInline|mediumThreeByTwo\d+|threeByTwoSmallAt2X)\.(jpe?g|png|webp)$/);
      if (!m) return false;
      u.pathname = `${m[1]}-superJumbo.${m[3]}`;
      u.search = '';
      return true;
    },
  },
  {
    // WordPress-style size suffix: …/photo-300x200.jpg → …/photo.jpg (the full upload)
    name: 'wp-size-suffix',
    host: /./,
    upgrade: (u) => {
      const m = u.pathname.match(/^(.*\/[^/]+?)-(\d{2,4})x(\d{2,4})\.(jpe?g|png|webp)$/i);
      if (!m || Number(m[2]) >= 800) return false;
      u.pathname = `${m[1]}.${m[4]}`;
      return true;
    },
  },
];

/**
 * Larger variants to try for `raw`, best first for an image shown `wantWidth` px
 * wide; [] when no rule applies. CGTN has several sizes and some are slow to
 * serve (the 1280 one took 30 s), so the closest sufficient size comes first and
 * the other one is a backup.
 */
export function upgradeImageUrlCandidates(raw: string, wantWidth = UPGRADE_TARGET_WIDTH): string[] {
  const best = upgradeImageUrl(raw);
  if (!best) return [];
  const m = best.match(/^(.*\/[0-9a-f]{32})-1280\.(png|jpe?g|webp)$/i);
  if (!m || !/(^|\.)cgtn\.com$/.test(new URL(best).hostname)) return [best];
  const orig = Number(raw.match(/-(\d{2,4})\.(?:png|jpe?g|webp)$/i)?.[1] ?? 0);
  const mid = orig < 750 ? `${m[1]}-750.${m[2]}` : null;
  if (!mid) return [best];
  return wantWidth <= 750 ? [mid, best] : [best, mid];
}

/** URL of a larger variant of `raw`, or null when no rule applies (or `raw` is not an http(s) URL). */
export function upgradeImageUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  for (const rule of RULES) {
    if (!rule.host.test(u.hostname)) continue;
    const next = new URL(u.toString());
    if (rule.upgrade(next) && next.toString() !== u.toString()) return next.toString();
  }
  return null;
}
