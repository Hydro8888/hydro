/**
 * Unit tests for src/lib/safe-image-fetch.ts (slice S5, D24 SSRF).
 * DNS and HTTP are injected — no network. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkImageUrl,
  fetchImageSafely,
  isBlockedAddress,
  sniffImageType,
  type ImageRequester,
  type ResolvedAddress,
  type UpstreamResponse,
} from '../src/lib/safe-image-fetch';

test('isBlockedAddress: internal ranges are blocked', () => {
  const blocked = [
    '127.0.0.1', '127.255.255.254', '10.0.0.1', '10.255.255.255', '172.16.0.1', '172.31.255.255',
    '192.168.0.1', '192.168.255.255', '169.254.169.254', '100.64.0.1', '100.127.255.255', '0.0.0.0',
    '198.18.0.1', '224.0.0.1', '240.0.0.1', '255.255.255.255', '192.0.0.8',
    '::', '::1', 'fd00::1', 'fc00::1', 'fe80::1', 'fe80::1%eth0', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::127.0.0.1', '64:ff9b::a00:1', '2002:7f00:1::1',
    'not-an-ip', '', '1.2.3', '256.1.1.1',
  ];
  for (const ip of blocked) assert.equal(isBlockedAddress(ip), true, ip);
});

test('isBlockedAddress: public addresses are allowed', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '172.15.255.255', '100.128.0.1', '2606:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8']) {
    assert.equal(isBlockedAddress(ip), false, ip);
  }
});

test('checkImageUrl: scheme / credentials / port / localhost', () => {
  const status = (u: string) => {
    const r = checkImageUrl(u);
    return r.ok ? 'ok' : r.status;
  };
  assert.equal(status('https://img.example.com/a.jpg'), 'ok');
  assert.equal(status('http://img.example.com:80/a.jpg'), 'ok');
  assert.equal(status('https://img.example.com:443/a.jpg'), 'ok');
  assert.equal(status('http://example.com:6379/a.jpg'), 400);
  assert.equal(status('http://u:p@example.com/a.jpg'), 400);
  assert.equal(status('ftp://example.com/a.jpg'), 400);
  assert.equal(status('javascript:alert(1)'), 400);
  assert.equal(status('%E0'), 400);
  assert.equal(status(''), 400);
  assert.equal(status('http://localhost/x'), 403);
  assert.equal(status('http://api.localhost/x'), 403);
  assert.equal(status('http://localhost:4010/v1/models'), 403, 'internal host wins over the port rule');
  assert.equal(status('http://127.0.0.1:4000/livenews/api/admin/health'), 403);
  assert.equal(status('http://8.8.8.8:8080/a.jpg'), 400);
  // WHATWG URL normalizes numeric hosts (127.1 / 2130706433 → 127.0.0.1) before the check
  for (const u of ['http://127.1/', 'http://2130706433/', 'http://[::ffff:127.0.0.1]/', 'http://0.0.0.0/', 'http://[::1]/']) {
    assert.equal(status(u), 403, u);
  }
  const pub = checkImageUrl('http://[2606:4700::1111]/a.png');
  assert.ok(pub.ok && pub.hostname === '2606:4700::1111');
});

// ── fetch with injected DNS + requester ─────────────────────────────────────

const PUBLIC: ResolvedAddress = { address: '93.184.216.34', family: 4 };

function lookupTable(table: Record<string, string[]>) {
  return async (host: string): Promise<ResolvedAddress[]> => {
    const ips = table[host];
    if (!ips) throw Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' });
    return ips.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
  };
}

async function* chunks(...parts: Buffer[]) {
  for (const p of parts) yield p;
}

function response(status: number, headers: Record<string, string>, body: Buffer[] = []): UpstreamResponse {
  return { status, headers, body: chunks(...body), destroy: () => {} };
}

function requester(routes: Record<string, () => UpstreamResponse>) {
  const seen: Array<{ url: string; address: string }> = [];
  const req: ImageRequester = async (url, address) => {
    seen.push({ url: url.href, address: address.address });
    const route = routes[url.href];
    if (!route) throw new Error('no route');
    return route();
  };
  return { req, seen };
}

const lookup = lookupTable({
  'img.example.com': ['93.184.216.34'],
  'cdn.example.com': ['93.184.216.35'],
  'evil.example.com': ['93.184.216.36', '127.0.0.1'], // one internal answer is enough to block
  'rebind.example.com': ['10.0.0.5'],
});

test('public IP + image/jpeg → ok, connection pinned to the validated address', async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const { req, seen } = requester({
    'https://img.example.com/a.jpg': () => response(200, { 'content-type': 'image/jpeg', 'content-length': String(jpeg.length) }, [jpeg]),
  });
  const r = await fetchImageSafely('https://img.example.com/a.jpg', { lookup, request: req });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.contentType, 'image/jpeg');
    assert.deepEqual(r.body, jpeg);
  }
  assert.deepEqual(seen, [{ url: 'https://img.example.com/a.jpg', address: PUBLIC.address }]);
});

test('text/html → 415 (never relayed)', async () => {
  const { req } = requester({
    'https://img.example.com/page': () => response(200, { 'content-type': 'text/html; charset=utf-8' }, [Buffer.from('<html>')]),
  });
  const r = await fetchImageSafely('https://img.example.com/page', { lookup, request: req });
  assert.deepEqual(r, { ok: false, status: 415, error: 'not_an_image' });
});

test('blocked hosts never reach the requester', async () => {
  const { req, seen } = requester({});
  for (const u of ['http://127.0.0.1:80/', 'http://evil.example.com/a.jpg', 'http://rebind.example.com/a.jpg', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/']) {
    const r = await fetchImageSafely(u, { lookup, request: req });
    assert.equal(r.ok ? 200 : r.status, 403, u);
  }
  assert.equal(seen.length, 0);
});

test('redirect to 127.0.0.1 → 403; redirect to a public host is followed', async () => {
  const jpeg = Buffer.from([1, 2, 3]);
  const { req, seen } = requester({
    'https://img.example.com/r1': () => response(302, { location: 'http://127.0.0.1/' }),
    'https://img.example.com/r2': () => response(302, { location: 'https://cdn.example.com/x.png' }),
    'https://cdn.example.com/x.png': () => response(200, { 'content-type': 'image/png' }, [jpeg]),
  });
  const bad = await fetchImageSafely('https://img.example.com/r1', { lookup, request: req });
  assert.equal(bad.ok ? 200 : bad.status, 403);
  const good = await fetchImageSafely('https://img.example.com/r2', { lookup, request: req });
  assert.equal(good.ok, true);
  assert.equal(seen.at(-1)!.address, '93.184.216.35');
});

test('redirect chain: 3 hops followed, the 4th is refused', async () => {
  const png = Buffer.from([9]);
  const hop = (n: number) => `https://img.example.com/h${n}`;
  const routes: Record<string, () => UpstreamResponse> = {};
  for (let i = 0; i < 4; i++) routes[hop(i)] = () => response(301, { location: `/h${i + 1}` });
  routes[hop(3)] = () => response(200, { 'content-type': 'image/png' }, [png]);
  const three = await fetchImageSafely(hop(0), { lookup, request: requester(routes).req });
  assert.equal(three.ok, true, '3 redirects are allowed');

  routes[hop(3)] = () => response(302, { location: '/h4' });
  routes[hop(4)] = () => response(200, { 'content-type': 'image/png' }, [png]);
  const four = await fetchImageSafely(hop(0), { lookup, request: requester(routes).req });
  assert.equal(four.ok ? 200 : four.status, 502);
});

test('Content-Length over the limit → 413; streamed body over the limit → 413', async () => {
  const { req } = requester({
    'https://img.example.com/big': () => response(200, { 'content-type': 'image/jpeg', 'content-length': String(20 * 1024 * 1024) }),
    'https://img.example.com/stream': () =>
      response(200, { 'content-type': 'image/jpeg' }, [Buffer.alloc(600), Buffer.alloc(600)]),
  });
  const big = await fetchImageSafely('https://img.example.com/big', { lookup, request: req });
  assert.equal(big.ok ? 200 : big.status, 413);
  const stream = await fetchImageSafely('https://img.example.com/stream', { lookup, request: req, maxBytes: 1000 });
  assert.equal(stream.ok ? 200 : stream.status, 413);
});

test('bad port → 400, upstream error → 502, upstream 404 → 502, DNS failure → 502, timeout → 504', async () => {
  const { req } = requester({
    'https://img.example.com/404': () => response(404, { 'content-type': 'text/html' }),
  });
  const code = async (u: string, extra: object = {}) => {
    const r = await fetchImageSafely(u, { lookup, request: req, ...extra });
    return r.ok ? 200 : r.status;
  };
  assert.equal(await code('http://img.example.com:6379/a.jpg'), 400);
  assert.equal(await code('https://img.example.com/none'), 502);
  assert.equal(await code('https://img.example.com/404'), 502);
  assert.equal(await code('https://unknown.example.com/a.jpg'), 502);

  const hang: ImageRequester = (_u, _a, signal) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const t = await fetchImageSafely('https://img.example.com/slow', { lookup, request: hang, timeoutMs: 30 });
  assert.equal(t.ok ? 200 : t.status, 504);
});

test('missing / octet-stream Content-Type → magic-number sniffing (never HTML or SVG)', async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const html = Buffer.from('<!doctype html><html><body>x</body></html>');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const { req } = requester({
    'https://img.example.com/o.jpg': () => response(200, { 'content-type': 'application/octet-stream' }, [jpeg]),
    'https://img.example.com/b.png': () => response(200, { 'content-type': 'binary/octet-stream' }, [png]),
    'https://img.example.com/none': () => response(200, {}, [png]),
    'https://img.example.com/o.html': () => response(200, { 'content-type': 'application/octet-stream' }, [html]),
    'https://img.example.com/o.svg': () => response(200, { 'content-type': 'application/octet-stream' }, [svg]),
  });
  const get = (u: string) => fetchImageSafely(u, { lookup, request: req });
  const a = await get('https://img.example.com/o.jpg');
  assert.ok(a.ok && a.contentType === 'image/jpeg');
  const b = await get('https://img.example.com/b.png');
  assert.ok(b.ok && b.contentType === 'image/png');
  const c = await get('https://img.example.com/none');
  assert.ok(c.ok && c.contentType === 'image/png');
  const d = await get('https://img.example.com/o.html');
  assert.equal(d.ok ? 200 : d.status, 415);
  const e = await get('https://img.example.com/o.svg');
  assert.equal(e.ok ? 200 : e.status, 415);
});

test('sniffImageType table', () => {
  const b = (...x: Array<number | string>) =>
    Buffer.concat(x.map((v) => (typeof v === 'string' ? Buffer.from(v, 'latin1') : Buffer.from([v]))));
  assert.equal(sniffImageType(b(0xff, 0xd8, 0xff, 0xdb)), 'image/jpeg');
  assert.equal(sniffImageType(b(0x89, 'PNG\r\n')), 'image/png');
  assert.equal(sniffImageType(b('GIF89a')), 'image/gif');
  assert.equal(sniffImageType(b('RIFF', 0, 0, 0, 0, 'WEBPVP8 ')), 'image/webp');
  assert.equal(sniffImageType(b(0, 0, 0, 0x1c, 'ftypavif')), 'image/avif');
  assert.equal(sniffImageType(b('<svg')), null);
  assert.equal(sniffImageType(b('<html>')), null);
  assert.equal(sniffImageType(Buffer.alloc(0)), null);
});

test('connection fallback: IPv4 first, next validated address on connect error', async () => {
  const multi = lookupTable({ 'multi.example.com': ['2606:4700::1111', '93.184.216.40', '93.184.216.41'] });
  const tried: string[] = [];
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const req: ImageRequester = async (_url, address) => {
    tried.push(address.address);
    if (address.address === '93.184.216.40') throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    return response(200, { 'content-type': 'image/png' }, [png]);
  };
  const r = await fetchImageSafely('https://multi.example.com/a.png', { lookup: multi, request: req });
  assert.equal(r.ok, true);
  assert.deepEqual(tried, ['93.184.216.40', '93.184.216.41']);

  const tried2: string[] = [];
  const down: ImageRequester = async (_u, a) => {
    tried2.push(a.address);
    throw new Error('connect ETIMEDOUT');
  };
  const all = await fetchImageSafely('https://multi.example.com/a.png', { lookup: multi, request: down });
  assert.equal(all.ok ? 200 : all.status, 502);
  assert.deepEqual(tried2, ['93.184.216.40', '93.184.216.41', '2606:4700::1111']);

  // a mixed answer with one internal address is still refused outright
  const mixed = lookupTable({ 'mix.example.com': ['93.184.216.40', '10.0.0.1'] });
  const blocked = await fetchImageSafely('https://mix.example.com/a.png', { lookup: mixed, request: down });
  assert.equal(blocked.ok ? 200 : blocked.status, 403);
});
