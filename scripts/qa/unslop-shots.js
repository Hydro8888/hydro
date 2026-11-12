// node shots.js <base> <outDir>  — viewport-sized screenshots of the key screens, desktop + mobile
const { chromium } = require('/home/user/hydro/node_modules/playwright');
const path = require('path');
const [base, out] = process.argv.slice(2);
const routes = [['home', '/', 4], ['article', process.env.ARTICLE || '/article/1', 3], ['breaking', '/breaking', 2], ['category', '/category/economy', 1], ['search', '/search?q=AI', 1], ['ranking', '/ranking', 1], ['notfound', '/nope', 1]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  for (const [vp, opts] of [['d', { viewport: { width: 1440, height: 900 } }], ['m', { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext({ ...opts, locale: 'ko-KR', timezoneId: 'Asia/Seoul', colorScheme: 'dark' });
    const p = await ctx.newPage();
    for (const [name, route, segs] of routes) {
      await p.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await p.waitForTimeout(800);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let i = 0; i < segs; i++) {
        const y = i * opts.viewport.height; if (y >= H) break;
        await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(350);
        await p.screenshot({ path: path.join(out, `${vp}-${name}-${i}.jpg`), type: 'jpeg', quality: 62 });
      }
      if (name === 'home') { await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, `${vp}-home-footer.jpg`), type: 'jpeg', quality: 62 }); }
    }
    await ctx.close();
  }
  await b.close(); console.log('done');
})();
