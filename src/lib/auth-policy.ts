// Admin authentication policy (slice S4). Pure — no next/server, no Node-only APIs — so the
// Edge middleware and node:test unit tests import the very same rules.

export const AUTH_REALM = 'Admin';

/** Sent with every 401 (pages and APIs) so the browser re-sends cached admin credentials. */
export const WWW_AUTHENTICATE = `Basic realm="${AUTH_REALM}", charset="UTF-8"`;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Segment-wise prefix match: '/api/admin' matches '/api/admin' and '/api/admin/x', never '/api/adminx'. */
function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/**
 * Whether a request needs admin Basic auth. First matching rule wins:
 *   1. /admin, /admin/…                       → always
 *   2. /api/admin/health                      → GET/HEAD/OPTIONS public (deploy health check), other methods protected
 *   3. /api/admin, /api/admin/…               → always (new admin routes are protected automatically)
 *   4. /api/collect, /api/collect/…           → always
 *   5. /api/articles, /api/articles/…         → reads public, writes (PATCH/POST/PUT/DELETE) protected
 *   6. anything else                          → public
 * @param pathname path without basePath (request.nextUrl.pathname); one trailing '/' is ignored
 * @param method   HTTP method (case-insensitive)
 */
export function requiresAuth(pathname: string, method: string): boolean {
  const p = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const m = String(method || 'GET').toUpperCase();
  const safe = SAFE_METHODS.has(m);

  if (under(p, '/admin')) return true;
  if (p === '/api/admin/health') return !safe;
  if (under(p, '/api/admin')) return true;
  if (under(p, '/api/collect')) return true;
  if (under(p, '/api/articles')) return !safe;
  return false;
}

/** Decodes standard base64 to a UTF-8 string; null when the input is not valid base64. */
function decodeBase64(encoded: string): string | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 === 1) return null;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Validates an `Authorization: Basic base64(user:pass)` header. Never throws.
 * The scheme is case-insensitive; the password may contain ':' (split on the first ':').
 */
export function isValidBasicAuth(header: string | null | undefined, user: string, pass: string): boolean {
  if (typeof header !== 'string') return false;
  const match = /^\s*basic\s+(\S+)\s*$/i.exec(header);
  if (!match) return false;
  const decoded = decodeBase64(match[1]);
  if (decoded === null) return false;
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  return decoded.slice(0, sep) === user && decoded.slice(sep + 1) === pass;
}
