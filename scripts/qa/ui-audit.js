/**
 * UI regression audit — every route x mobile/tablet/desktop in Chromium.
 *
 * Detects: content overflowing the viewport (boxes AND text spilling out of
 * their own box), broken <img>, console/hydration errors, uncaught page
 * errors, failed same-origin requests, stuck spinners, HTTP status of 404
 * routes. External network is aborted on purpose (worst case: image CDN and
 * Unsplash down) so image fallbacks are exercised.
 *
 * Prereqs: app running (next start) with fixtures from seed-fixtures.ts;
 *          `npm i --no-save playwright` (uses an installed Chromium).
 *
 *   node scripts/qa/ui-audit.js [label]
 *   env: QA_BASE_URL (default http://127.0.0.1:4000/livenews)
 *        QA_ADMIN_USER / QA_ADMIN_PASS (default admin / livenews2026)
 *
 * Output: qa-out/audit-<label>.json, qa-out/shots-<label>/*.jpg
 * Exit code 1 when any blocking issue is found (CI friendly).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LABEL = process.argv[2] || 'run';
const BASE = (process.env.QA_BASE_URL || 'http://127.0.0.1:4000/livenews').replace(/\/$/, '');
const ORIGIN = new URL(BASE).origin;
const OUT = path.join(process.cwd(), 'qa-out');
const SHOTS = path.join(OUT, `shots-${LABEL}`);
fs.mkdirSync(SHOTS, { recursive: true });

const fx = JSON.parse(fs.readFileSync(path.join(OUT, 'fixture-ids.json'), 'utf8'));
const first = (k) => fx.ranges[k][0];
const edge = fx.edgeIds;

const ROUTES = [
  ['home', '/'], ['world', '/world'], ['us', '/us'], ['japan', '/japan'], ['china', '/china'],
  ['breaking', '/breaking'], ['breaking-p7', '/breaking?page=7'], ['breaking-p14', '/breaking?page=14'],
  ['breaking-p999', '/breaking?page=999'], ['breaking-p-garbage', '/breaking?page=abc'],
  ['world-p3', '/world?page=3'], ['cat-economy', '/category/economy'], ['cat-economy-p2', '/category/economy?page=2'],
  ['cat-intl-politics', '/category/international-politics'], ['cat-unknown', '/category/quantum-weird-category'],
  ['cat-general', '/category/general'], ['ranking', '/ranking'], ['ranking-us', '/ranking?country=us'],
  ['search-empty', '/search'], ['search-q', '/search?q=%EA%B8%88%EB%A6%AC'], ['search-none', '/search?q=zzzqqqxx'],
  ['art-normal', `/article/${first('translated')}`], ['art-title-missing', `/article/${first('titleMissing')}`],
  ['art-title-echo', `/article/${first('titleEcho')}`], ['art-body-missing', `/article/${first('bodyMissing')}`],
  ['art-body-truncated', `/article/${first('bodyTruncated')}`],
  ...Object.entries(edge).map(([k, id]) => [`art-${k}`, `/article/${id}`]),
  ['art-404', '/article/99999999'], ['art-404-nan', '/article/abc'], ['country-404', '/nope'],
];
const ADMIN_ROUTES = [['admin', '/admin'], ['admin-sources', '/admin/sources'], ['admin-articles', '/admin/articles'], ['admin-logs', '/admin/logs']];
const EXPECT_404 = new Set(['art-404', 'art-404-nan', 'country-404']);

const VIEWPORTS = {
  mobile: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

function probe() {
  const vw = window.innerWidth;
  const clips = (el) => ['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(el).overflowX);
  const insideFittingClip = (el) => {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      if (clips(p)) { const r = p.getBoundingClientRect(); if (r.right <= vw + 1 && r.left >= -1) return true; }
    }
    return false;
  };
  const describe = (el, kind, left, right) => ({
    kind, tag: el.tagName.toLowerCase(),
    cls: (typeof el.className === 'string' ? el.className : '').replace(/\s+/g, ' ').slice(0, 90),
    left: Math.round(left), right: Math.round(right),
    text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
  });
  const offenders = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.opacity === '0' || el.closest('.sr-only') || insideFittingClip(el)) continue;
    const key = el.tagName + el.className;
    if (seen.has(key)) continue;
    seen.add(key);
    offenders.push(describe(el, 'box', r.left, r.right));
    if (offenders.length >= 12) break;
  }
  const spill = [];
  for (const el of document.querySelectorAll('body *')) {
    const st = getComputedStyle(el);
    if (st.display === 'inline' || st.overflowX !== 'visible' || el.scrollWidth <= el.clientWidth + 2) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.left + el.scrollWidth <= vw + 1 || insideFittingClip(el)) continue;
    spill.push(el);
  }
  for (const el of spill.filter((e) => !spill.some((o) => o !== e && e.contains(o))).slice(0, 12)) {
    const r = el.getBoundingClientRect();
    offenders.push(describe(el, 'text', r.left, r.left + el.scrollWidth));
  }
  const broken = [...document.images]
    .filter((i) => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0)
    .map((i) => ({ src: (i.currentSrc || i.src).slice(0, 110), alt: (i.alt || '').slice(0, 40) }));
  return {
    vw, offenders, broken,
    bodyTextLen: document.querySelector('main')?.innerText.trim().length ?? -1,
    spinners: document.querySelectorAll('main .animate-spin').length,
  };
}

async function auditPage(context, name, route, vp, results, shoot) {
  const page = await context.newPage();
  const rec = { name, route, vp, status: null, console: [], pageErrors: [], failed: [] };
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    if (/Failed to load resource/.test(t) && /net::|ERR_/.test(t)) return; // our own aborts
    rec.console.push(`${m.type()}: ${t.slice(0, 220)}`);
  });
  page.on('pageerror', (e) => rec.pageErrors.push(String(e.message || e).slice(0, 240)));
  page.on('response', (r) => {
    const u = r.url();
    if (u.startsWith(ORIGIN) && r.status() >= 400 && !u.includes('/api/img') && !(EXPECT_404.has(name) && r.request().isNavigationRequest())) {
      rec.failed.push(`${r.status()} ${r.request().method()} ${u.replace(ORIGIN, '')}`);
    }
  });
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    rec.status = resp ? resp.status() : null;
  } catch (e) {
    rec.pageErrors.push('NAV: ' + String(e.message).slice(0, 160));
  }
  await page.waitForTimeout(1200);
  Object.assign(rec, await page.evaluate(probe));
  if (shoot) await page.screenshot({ path: path.join(SHOTS, `${vp}-${name}.jpg`), fullPage: true, type: 'jpeg', quality: 55 }).catch(() => {});
  results.push(rec);
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const shoot = process.env.QA_SCREENSHOTS !== '0';
  for (const [vp, opts] of Object.entries(VIEWPORTS)) {
    const ctxOpts = { ...opts, locale: 'ko-KR', timezoneId: 'Asia/Seoul' };
    const ctx = await browser.newContext(ctxOpts);
    await ctx.route((url) => url.origin !== ORIGIN, (r) => r.abort());
    for (const [name, route] of ROUTES) await auditPage(ctx, name, route, vp, results, shoot);
    await ctx.close();
    // Each admin page in a fresh context = admin opening a bookmarked URL directly
    for (const [name, route] of ADMIN_ROUTES) {
      const actx = await browser.newContext({
        ...ctxOpts,
        httpCredentials: { username: process.env.QA_ADMIN_USER || 'admin', password: process.env.QA_ADMIN_PASS || 'livenews2026' },
      });
      await actx.route((url) => url.origin !== ORIGIN, (r) => r.abort());
      await auditPage(actx, name, route, vp, results, shoot);
      await actx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `audit-${LABEL}.json`), JSON.stringify(results, null, 1));

  const issues = (r) => {
    const out = [];
    if (r.offenders.length) out.push(`OVERFLOW ${r.offenders[0].kind}<${r.offenders[0].tag}> R${r.offenders[0].right}/${r.vw} "${r.offenders[0].text.slice(0, 40)}"`);
    if (r.broken.length) out.push(`BROKEN_IMG(${r.broken.length})`);
    if (r.console.length) out.push(`CONSOLE(${r.console.length}) ${r.console[0].slice(0, 100)}`);
    if (r.pageErrors.length) out.push(`PAGEERR ${r.pageErrors[0].slice(0, 100)}`);
    if (r.failed.length) out.push(`FAILED ${r.failed.slice(0, 2).join(' | ')}`);
    if (r.spinners) out.push(`SPINNER(${r.spinners})`);
    if (EXPECT_404.has(r.name) && r.status !== 404) out.push(`STATUS ${r.status} (expected 404)`);
    if (!EXPECT_404.has(r.name) && r.status !== 200) out.push(`STATUS ${r.status}`);
    return out;
  };
  let bad = 0;
  for (const vp of Object.keys(VIEWPORTS)) {
    const rs = results.filter((r) => r.vp === vp);
    console.log(`== ${vp}: ${rs.length} routes, overflow=${rs.filter((r) => r.offenders.length).length} brokenImgPages=${rs.filter((r) => r.broken.length).length} consoleErr=${rs.filter((r) => r.console.length || r.pageErrors.length).length}`);
  }
  for (const r of results) {
    const i = issues(r);
    if (i.length) { bad++; console.log(`[${r.vp}] ${r.name} (${r.status}) → ${i.join(' ; ')}`); }
  }
  console.log(bad ? `\n${bad} route/viewport combinations with issues` : '\nALL CLEAN');
  process.exit(bad ? 1 : 0);
})();
