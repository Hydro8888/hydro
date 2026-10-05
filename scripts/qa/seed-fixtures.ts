/**
 * Edge-case fixture seeder for LOCAL QA only.
 *
 * Wipes Article / CollectionLog / SearchLog and inserts ~410 articles in every
 * state the translation pipeline can leave them in (untranslated titles,
 * English echoes, truncated bodies, CJK originals, long URLs, odd dates, …).
 *
 * Refuses to run unless DATABASE_URL points at localhost AND
 * QA_ALLOW_RESET=1 is set — it must never touch a real database.
 *
 *   QA_ALLOW_RESET=1 npx tsx prisma/seed.ts            # sources first
 *   QA_ALLOW_RESET=1 npx tsx scripts/qa/seed-fixtures.ts
 *
 * Writes qa-out/fixture-ids.json (consumed by ui-audit.js).
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL || '';
const host = (() => { try { return new URL(dbUrl).hostname; } catch { return ''; } })();
if (process.env.QA_ALLOW_RESET !== '1' || !['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error('[seed-fixtures] Refusing to run: requires QA_ALLOW_RESET=1 and a localhost DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient();

let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const CATS = ['politics', 'economy', 'market', 'business', 'ai-tech', 'semiconductor', 'automotive',
  'energy', 'society', 'culture', 'entertainment', 'sports', 'science', 'health', 'world', 'general'];
const EN_TITLES = [
  'Federal Reserve signals rate cuts as inflation cools faster than expected',
  'Japan unveils record defense budget amid regional tensions',
  'China export growth slows as global demand weakens',
  'Tech giants race to build next-generation AI chips',
  'European leaders meet to discuss energy security plan',
  'Automakers shift strategy as EV sales growth stalls',
  'Stocks rally after strong earnings from chipmakers',
  'Scientists discover new species in deep ocean expedition',
];
const KO_TITLES = [
  '미 연준, 인플레이션 둔화에 금리 인하 신호',
  '일본, 지역 긴장 속 사상 최대 국방 예산 공개',
  '중국 수출 증가세 둔화…글로벌 수요 약화',
  '빅테크, 차세대 AI 칩 개발 경쟁 가속',
  '유럽 정상들, 에너지 안보 대책 논의',
  '전기차 판매 둔화에 완성차 업계 전략 수정',
  '반도체 기업 호실적에 증시 반등',
  '심해 탐사서 신종 생물 발견',
];
const KO_PARA = [
  '미국 연방준비제도는 이날 성명을 통해 물가 상승세가 예상보다 빠르게 둔화하고 있다고 밝혔다.',
  '시장 전문가들은 이번 결정이 향후 경기 흐름에 중요한 분수령이 될 것으로 내다봤다.',
  '정부 관계자는 관련 대책을 조만간 발표할 예정이라고 전했다.',
  '업계에서는 공급망 재편이 가속화될 것이라는 전망이 나온다.',
];
const EN_PARA = [
  'The Federal Reserve said in a statement on Wednesday that inflation was cooling faster than many economists had predicted, opening the door to rate cuts later this year.',
  'Market analysts said the decision could mark a turning point for the broader economy, although risks remain elevated across several sectors.',
  'Officials said further measures would be announced in the coming weeks as negotiations continue with industry stakeholders.',
  'Supply chains are expected to keep shifting as companies diversify production away from single-country dependence.',
];
const koBody = (n: number) => Array.from({ length: n }, (_, i) => KO_PARA[i % KO_PARA.length]).join('\n');
const enBody = (n: number) => Array.from({ length: n }, (_, i) => EN_PARA[i % EN_PARA.length]).join('\n');

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE "SearchLog", "CollectionLog", "Article" RESTART IDENTITY CASCADE');

  const sources = await prisma.source.findMany({ orderBy: { id: 'asc' } });
  if (sources.length === 0) throw new Error('No sources — run prisma/seed.ts first');

  const now = Date.now();
  const H = 3600_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  let n = 0;

  const base = (i: number, over: Record<string, unknown> = {}) => {
    const src = sources[i % sources.length];
    const t = i % EN_TITLES.length;
    return {
      sourceId: src.id,
      originalUrl: `https://news.example.com/${src.country}/${i}-${Math.floor(rnd() * 1e9)}`,
      titleOriginal: `${EN_TITLES[t]} (#${i})`,
      titleKo: `${KO_TITLES[t]} (#${i})`,
      summaryKo: KO_PARA[i % KO_PARA.length],
      contentOriginal: enBody(6),
      contentKo: koBody(6),
      publishedAt: new Date(now - ((i * 37) % 160) * H - (i % 50) * 60_000),
      language: src.language,
      country: src.country,
      categoryPrimary: CATS[i % CATS.length],
      imageUrl: i % 3 === 0 ? null : `https://images.example-cdn.com/photo-${i}.jpg`,
      author: i % 4 === 0 ? 'Jane Doe' : null,
      tags: i % 5 === 0 ? ['연준', '금리', 'inflation'] : [],
      viewCount: Math.floor(rnd() * 5000),
      createdAt: new Date(now - i * 7 * 60_000),
      ...over,
    };
  };

  const ranges: Record<string, [number, number]> = {};
  const mark = (name: string, from: number) => { ranges[name] = [from + 1, n]; };

  let s = n; for (; n < 300; n++) rows.push(base(n)); mark('translated', s);
  s = n; for (let k = 0; k < 40; k++, n++) rows.push(base(n, { titleKo: null, summaryKo: null })); mark('titleMissing', s);
  s = n; for (let k = 0; k < 15; k++, n++) { const r = base(n); rows.push({ ...r, titleKo: r.titleOriginal }); } mark('titleEcho', s);
  s = n; for (let k = 0; k < 25; k++, n++) rows.push(base(n, { contentKo: null })); mark('bodyMissing', s);
  s = n; for (let k = 0; k < 10; k++, n++) rows.push(base(n, { contentOriginal: enBody(60), contentKo: koBody(12) })); mark('bodyTruncated', s);

  const edge = [
    { tag: 'longtitle', titleKo: '초장문 제목 테스트: ' + '대한민국 수출입 동향과 글로벌 공급망 재편에 따른 반도체·자동차·배터리 산업의 구조적 변화 전망 '.repeat(4) },
    { tag: 'unbroken', titleKo: '링크 포함 제목 https://www.example.com/very/long/path/that/does/not/contain/any/spaces/at/all/and/keeps/going/forever?query=parameters&and=more&more=1234567890', contentKo: '본문에 매우 긴 URL이 들어있습니다: https://www.example.com/very/long/path/that/does/not/contain/any/spaces/at/all/and/keeps/going/forever/and/ever/and/ever?query=parameters&and=more\n그리고 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 같은 단어.' },
    { tag: 'japanese', titleOriginal: '日本銀行、金融政策の現状維持を決定 長期金利の上昇を容認する姿勢を示す', titleKo: null, summaryKo: null, contentOriginal: '日本銀行は金融政策決定会合で、現状の金融緩和策を維持することを決めた。'.repeat(8), contentKo: null, language: 'ja' },
    { tag: 'chinese', titleOriginal: '中国国家统计局：前三季度国内生产总值同比增长百分之五点二经济运行总体平稳', titleKo: null, summaryKo: null, contentOriginal: '国家统计局今天发布数据显示，前三季度国内生产总值同比增长。'.repeat(8), contentKo: null, language: 'zh' },
    { tag: 'nulldate', publishedAt: null },
    { tag: 'future', publishedAt: new Date(now + 5 * H) },
    { tag: 'old', publishedAt: new Date(now - 40 * 24 * H) },
    { tag: 'nocat', categoryPrimary: null },
    { tag: 'unknowncat', categoryPrimary: 'quantum-weird-category' },
    { tag: 'opinion', categoryPrimary: 'opinion' },
    { tag: 'manytags', tags: ['반도체', '삼성전자', 'TSMC', '엔비디아', 'HBM', '고대역폭메모리', '파운드리', '미국수출규제', 'AI가속기', 'supercalifragilisticexpialidocious-very-long-tag-name'] },
    { tag: 'longauthor', author: 'By Jonathan Alexander Montgomery-Wellington III and Elizabeth Catherine Fitzgerald-Harrington, Senior International Correspondents' },
    { tag: 'logoimg', imageUrl: 'https://static.example.com/assets/logo.png' },
    { tag: 'protorel', imageUrl: '//cdn.example.com/photos/abc.jpg' },
    { tag: 'emptybody', contentOriginal: null, contentKo: null, summaryKo: null },
    { tag: 'summaryonly', contentOriginal: null, contentKo: null },
    { tag: 'inactive', isActive: false },
    // Failure-injection rows for mock-llm.js (markers in text)
    { tag: 'mk-echo', titleOriginal: 'ECHO Markets rally on chip earnings', titleKo: null, summaryKo: null },
    { tag: 'mk-truncjson', titleOriginal: 'TRUNCJSON Oil prices climb as supply tightens', titleKo: null, summaryKo: null },
    { tag: 'mk-lengthcut', titleKo: null, contentKo: null, contentOriginal: Array.from({ length: 24 }, (_, i) => `LENGTHCUT ${EN_PARA[i % EN_PARA.length]}`).join('\n') },
  ];
  for (const e of edge) {
    const { tag, ...over } = e as { tag: string } & Record<string, unknown>;
    rows.push({ ...base(n, over), originalUrl: `https://news.example.com/edge/${tag}` });
    n++;
  }

  await prisma.article.createMany({ data: rows });

  const edgeIds: Record<string, number> = {};
  for (const e of edge) {
    const a = await prisma.article.findUnique({ where: { originalUrl: `https://news.example.com/edge/${e.tag}` }, select: { id: true } });
    edgeIds[e.tag] = a!.id;
  }

  await prisma.collectionLog.createMany({
    data: Array.from({ length: 80 }, (_, i) => ({
      sourceId: sources[i % sources.length].id,
      status: i % 9 === 0 ? 'failed' : i % 13 === 0 ? 'partial' : 'success',
      articlesFound: 20 + (i % 15),
      articlesNew: i % 7,
      errorMessage: i % 9 === 0 ? 'FetchError: request to https://feeds.example.com/very/long/feed/url/that/keeps/going/rss.xml failed, reason: getaddrinfo ENOTFOUND feeds.example.com — retry exhausted after 3 attempts' : null,
      startedAt: new Date(now - i * 30 * 60_000),
      completedAt: new Date(now - i * 30 * 60_000 + 40_000),
    })),
  });
  const kws = ['금리', '반도체', '엔비디아', '트럼프', '일본 엔화', '중국 경제', 'AI', '전기차'];
  await prisma.searchLog.createMany({
    data: Array.from({ length: 60 }, (_, i) => ({ keyword: kws[i % kws.length], resultCount: 10 + i, searchedAt: new Date(now - i * 600_000) })),
  });

  const out = { total: await prisma.article.count(), ranges, edgeIds };
  const dir = path.join(process.cwd(), 'qa-out');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'fixture-ids.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
