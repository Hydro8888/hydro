/**
 * safe-image-fetch.ts
 * SSRF-safe image fetcher behind /api/img (D24). Node built-ins only.
 *
 *  - http/https only, default port / 80 / 443 only, no credentials in the URL → 400
 *  - every host (names AND IP literals) is resolved; if ANY address is
 *    loopback / private / link-local / CGNAT / multicast / reserved → 403
 *  - the connection is pinned to the validated address (custom `lookup`), so
 *    a DNS answer that changes between check and connect (rebinding) is ignored
 *  - redirects are followed manually (max 3), re-validating every hop
 *  - only 2xx with Content-Type image/* is returned (else 502 / 415); a missing
 *    or octet-stream type is decided by the magic number (JPEG/PNG/GIF/WebP/AVIF;
 *    never SVG)
 *  - all validated addresses are tried in order (IPv4 first) on connection errors
 *    > 10MB → 413 (Content-Length or streamed); overall timeout 10s → 504
 *  - never throws; errors are short codes, never raw messages
 */

import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_IMAGE_TIMEOUT_MS = 10_000;
export const MAX_REDIRECTS = 3;

export type SafeFetchErrorStatus = 400 | 403 | 413 | 415 | 502 | 504;

export type SafeFetchResult =
  | { ok: true; status: 200; contentType: string; body: Buffer; finalUrl: string }
  | { ok: false; status: SafeFetchErrorStatus; error: string };

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export interface UpstreamResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: AsyncIterable<Buffer | Uint8Array | string>;
  /** Abort the underlying socket (used for redirects / rejected bodies). */
  destroy?: () => void;
}

/** Performs ONE request to `url`, connecting only to `address`. */
export type ImageRequester = (
  url: URL,
  address: ResolvedAddress,
  signal: AbortSignal,
) => Promise<UpstreamResponse>;

export type HostLookup = (hostname: string) => Promise<ResolvedAddress[]>;

export interface SafeFetchOptions {
  lookup?: HostLookup;
  request?: ImageRequester;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

// ---------------------------------------------------------------------------
// Address classification
// ---------------------------------------------------------------------------

function parseIPv4(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

const V4_BLOCKS: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const V4_RANGES = V4_BLOCKS.map(([base, bits]) => {
  const start = parseIPv4(base)!;
  const size = 2 ** (32 - bits);
  return { start, end: start + size - 1 };
});

function isBlockedV4(n: number): boolean {
  return V4_RANGES.some((r) => n >= r.start && n <= r.end); // 255.255.255.255 is inside 240/4
}

/** IPv6 text → 8 hextets, or null. Accepts '::', embedded IPv4 tails and zone ids. */
function parseIPv6(ip: string): number[] | null {
  let s = ip.trim().toLowerCase();
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  const zone = s.indexOf('%');
  if (zone !== -1) s = s.slice(0, zone);
  if (!s.includes(':')) return null;

  // Embedded IPv4 tail (::ffff:1.2.3.4) → two hextets
  const lastColon = s.lastIndexOf(':');
  const maybeV4 = s.slice(lastColon + 1);
  if (maybeV4.includes('.')) {
    const v4 = parseIPv4(maybeV4);
    if (v4 === null) return null;
    s = `${s.slice(0, lastColon + 1)}${Math.floor(v4 / 65536).toString(16)}:${(v4 % 65536).toString(16)}`;
  }

  const halves = s.split('::');
  if (halves.length > 2) return null;
  const toHex = (part: string) => (part === '' ? [] : part.split(':'));
  const head = toHex(halves[0]);
  const rest = halves.length === 2 ? toHex(halves[1]) : [];
  const parsePart = (h: string) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN);
  const headN = head.map(parsePart);
  const restN = rest.map(parsePart);
  if ([...headN, ...restN].some((v) => Number.isNaN(v))) return null;

  const total = headN.length + restN.length;
  if (halves.length === 1) return total === 8 ? headN : null;
  if (total > 7) return null;
  return [...headN, ...new Array(8 - total).fill(0), ...restN];
}

/**
 * True when connecting to `ip` could reach something internal.
 * Unparseable input is treated as blocked.
 */
export function isBlockedAddress(ip: string): boolean {
  const v4 = parseIPv4(ip);
  if (v4 !== null) return isBlockedV4(v4);

  const h = parseIPv6(ip);
  if (!h) return true;
  const embeddedV4 = (hi: number, lo: number) => hi * 65536 + lo;

  if (h.every((x) => x === 0)) return true; // ::
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true; // ::1
  // IPv4-mapped ::ffff:a.b.c.d  → judge the IPv4
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) return isBlockedV4(embeddedV4(h[6], h[7]));
  // IPv4-compatible ::a.b.c.d (deprecated) → judge the IPv4
  if (h.slice(0, 6).every((x) => x === 0)) return isBlockedV4(embeddedV4(h[6], h[7]));
  // NAT64 64:ff9b::/96 → judge the IPv4
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0)) {
    return isBlockedV4(embeddedV4(h[6], h[7]));
  }
  // 6to4 2002:AABB:CCDD::/48 → judge the IPv4
  if (h[0] === 0x2002) return isBlockedV4(embeddedV4(h[1], h[2]));
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((h[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  return false;
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

export type UrlCheck = { ok: true; url: URL; hostname: string } | { ok: false; status: 400 | 403; error: string };

/** Syntax-level checks (no DNS): scheme, credentials, port, obviously-internal names. */
export function checkImageUrl(raw: string | URL): UrlCheck {
  let url: URL;
  try {
    url = typeof raw === 'string' ? new URL(raw) : new URL(raw.href);
  } catch {
    return { ok: false, status: 400, error: 'invalid_url' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, status: 400, error: 'unsupported_scheme' };
  }
  if (url.username || url.password) return { ok: false, status: 400, error: 'credentials_not_allowed' };
  let hostname = url.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) hostname = hostname.slice(1, -1);
  hostname = hostname.replace(/\.$/, '');
  if (!hostname) return { ok: false, status: 400, error: 'invalid_url' };
  // Internal targets are refused as such (403) whatever the port
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return { ok: false, status: 403, error: 'blocked_host' };
  }
  if (net.isIP(hostname) && isBlockedAddress(hostname)) {
    return { ok: false, status: 403, error: 'blocked_host' };
  }
  if (url.port !== '' && url.port !== '80' && url.port !== '443') {
    return { ok: false, status: 400, error: 'port_not_allowed' };
  }
  return { ok: true, url, hostname };
}

const defaultLookup: HostLookup = async (hostname) => {
  const res = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return res.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
};

/**
 * Resolve and validate. Every answer must be public (one internal answer → 403).
 * Returns all validated addresses, IPv4 first (stable), for connection fallback.
 */
async function resolveSafe(
  hostname: string,
  lookup: HostLookup,
): Promise<{ ok: true; addresses: ResolvedAddress[] } | { ok: false; status: 403 | 502; error: string }> {
  const ipFamily = net.isIP(hostname);
  let addresses: ResolvedAddress[];
  if (ipFamily) {
    addresses = [{ address: hostname, family: ipFamily === 6 ? 6 : 4 }];
  } else {
    try {
      addresses = await lookup(hostname);
    } catch {
      return { ok: false, status: 502, error: 'dns_failed' };
    }
  }
  if (addresses.length === 0) return { ok: false, status: 502, error: 'dns_failed' };
  if (addresses.some((a) => isBlockedAddress(a.address))) return { ok: false, status: 403, error: 'blocked_host' };
  const seen = new Set<string>();
  const unique = addresses.filter((a) => (seen.has(a.address) ? false : (seen.add(a.address), true)));
  const ordered = [...unique.filter((a) => a.family === 4), ...unique.filter((a) => a.family !== 4)];
  return { ok: true, addresses: ordered };
}

// ---------------------------------------------------------------------------
// Content sniffing for upstreams that send no / a generic Content-Type
// ---------------------------------------------------------------------------

const GENERIC_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

/**
 * Raster image type from the first bytes: JPEG, PNG, GIF, WebP, AVIF.
 * SVG is deliberately never sniffed (it must be declared as image/svg+xml).
 */
export function sniffImageType(buf: Uint8Array): string | null {
  const b = buf;
  const ascii = (start: number, end: number) => String.fromCharCode(...Array.from(b.subarray(start, end)));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length >= 4 && ascii(0, 4) === 'GIF8') return 'image/gif';
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (b.length >= 12 && ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}

// ---------------------------------------------------------------------------
// Default requester: node:http(s) pinned to the validated address
// ---------------------------------------------------------------------------

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export const nodeRequester: ImageRequester = (url, address, signal) =>
  new Promise<UpstreamResponse>((resolve, reject) => {
    const mod = url.protocol === 'https:' ? https : http;
    const host = url.hostname.replace(/^\[|\]$/g, '');
    // Every lookup the socket does returns the address we validated.
    const pinnedLookup = (
      _hostname: string,
      options: unknown,
      callback?: (...args: unknown[]) => void,
    ) => {
      const cb = (typeof options === 'function' ? options : callback) as (...args: unknown[]) => void;
      const wantsAll = typeof options === 'object' && options !== null && (options as { all?: boolean }).all;
      if (wantsAll) cb(null, [{ address: address.address, family: address.family }]);
      else cb(null, address.address, address.family);
    };
    const req = mod.request(
      {
        protocol: url.protocol,
        hostname: host,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/*,*/*;q=0.8',
          Referer: url.origin,
        },
        lookup: pinnedLookup as unknown as net.LookupFunction,
        ...(url.protocol === 'https:' && !net.isIP(host) ? { servername: host } : {}),
        signal,
      },
      (res) => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: res,
          destroy: () => res.destroy(),
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

function header(h: UpstreamResponse['headers'], name: string): string | undefined {
  const v = h[name] ?? h[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

class FetchAbort extends Error {}

export async function fetchImageSafely(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const lookup = opts.lookup ?? defaultLookup;
  const request = opts.request ?? nodeRequester;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_IMAGE_TIMEOUT_MS;
  const maxRedirects = opts.maxRedirects ?? MAX_REDIRECTS;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let current: string | URL = rawUrl;
    for (let hop = 0; ; hop++) {
      const check = checkImageUrl(current);
      if (!check.ok) return { ok: false, status: check.status, error: check.error };
      const resolved = await resolveSafe(check.hostname, lookup);
      if (!resolved.ok) return { ok: false, status: resolved.status, error: resolved.error };
      if (timedOut) return { ok: false, status: 504, error: 'timeout' };

      // Try each validated address in order (IPv4 first); a connection error
      // moves on to the next one, all within the overall timeout.
      let res: UpstreamResponse | null = null;
      for (const address of resolved.addresses) {
        try {
          res = await request(check.url, address, controller.signal);
          break;
        } catch {
          if (timedOut) return { ok: false, status: 504, error: 'timeout' };
        }
      }
      if (!res) return { ok: false, status: 502, error: 'upstream_error' };

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        res.destroy?.();
        const location = header(res.headers, 'location');
        if (!location) return { ok: false, status: 502, error: 'bad_redirect' };
        if (hop >= maxRedirects) return { ok: false, status: 502, error: 'too_many_redirects' };
        try {
          current = new URL(location, check.url);
        } catch {
          return { ok: false, status: 502, error: 'bad_redirect' };
        }
        continue;
      }

      if (res.status < 200 || res.status >= 300) {
        res.destroy?.();
        return { ok: false, status: 502, error: 'upstream_status' };
      }

      const declaredType = (header(res.headers, 'content-type') ?? '').split(';')[0].trim().toLowerCase();
      // Missing / generic types are decided by the magic number once the body is read
      const needsSniff = GENERIC_TYPES.has(declaredType);
      if (!needsSniff && !declaredType.startsWith('image/')) {
        res.destroy?.();
        return { ok: false, status: 415, error: 'not_an_image' };
      }

      const declared = Number(header(res.headers, 'content-length'));
      if (Number.isFinite(declared) && declared > maxBytes) {
        res.destroy?.();
        return { ok: false, status: 413, error: 'too_large' };
      }

      const chunks: Buffer[] = [];
      let total = 0;
      try {
        for await (const chunk of res.body) {
          const buf = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
          total += buf.length;
          if (total > maxBytes) {
            res.destroy?.();
            throw new FetchAbort('too_large');
          }
          chunks.push(buf);
        }
      } catch (err) {
        if (err instanceof FetchAbort) return { ok: false, status: 413, error: 'too_large' };
        return timedOut ? { ok: false, status: 504, error: 'timeout' } : { ok: false, status: 502, error: 'upstream_error' };
      }
      if (timedOut) return { ok: false, status: 504, error: 'timeout' };

      const body = Buffer.concat(chunks);
      const contentType = needsSniff ? sniffImageType(body.subarray(0, 16)) : declaredType;
      if (!contentType) return { ok: false, status: 415, error: 'not_an_image' };
      return { ok: true, status: 200, contentType, body, finalUrl: check.url.href };
    }
  } catch {
    return timedOut ? { ok: false, status: 504, error: 'timeout' } : { ok: false, status: 502, error: 'upstream_error' };
  } finally {
    clearTimeout(timer);
  }
}
