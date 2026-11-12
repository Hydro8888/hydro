/**
 * Unit tests for full-article extraction (scraper) and teaser detection. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ARTICLE_CHARS,
  capAtParagraph,
  cleanBodyLines,
  extractJsonLdBody,
  extractReadableText,
  shouldReplaceBody,
} from '../src/workers/article-extract';
import { extractArticleContent } from '../src/workers/scraper';
import { endsLikeTeaser, isExcerptBody } from '../src/lib/excerpt';

const PARAS = [
  'Health officials approved trials for two new vaccines on Wednesday, the agency said in a statement.',
  'The vaccines were designed for a strain of the virus that has killed more than a hundred people this year.',
  'Researchers will enrol several hundred volunteers across three countries over the coming months.',
  'Officials said the first results could be available early next year if enrolment goes to plan.',
  'Aid groups welcomed the decision but warned that funding for the response remains far short of needs.',
  'The outbreak has strained health systems that were already stretched by previous emergencies in the region.',
];

/** The production failure: JSON-LD carries only a short description, the article sits in <p> tags. */
function newsPage(opts: { jsonLd?: Record<string, unknown>; extra?: string } = {}): string {
  const ld = opts.jsonLd ?? { '@type': 'NewsArticle', headline: 'Trials approved', description: 'Vaccines were designed for the virus that has killed more than 100 people.' };
  return `<!doctype html><html><head><title>Trials approved</title>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<header><nav><a href="/">Home</a> <a href="/news">News</a> Sign up Show navigation menu</nav></header>
<main><article><h1>Trials approved for two new vaccines</h1>
<p>watch now</p>
${PARAS.map((p) => `<p>${p}</p>`).join('\n')}
<figure><img src="x.jpg"><figcaption>A health worker in a clinic.</figcaption></figure>
${opts.extra ?? ''}
</article></main>
<footer><p>Got a confidential news tip? We want to hear from you.</p><p>© 2026 Example News. All rights reserved.</p></footer>
</body></html>`;
}

test('a JSON-LD description is NOT taken as the article body — the full text is', () => {
  const html = newsPage();
  assert.equal(extractJsonLdBody(html), '', 'description must not count as a body');
  const body = extractArticleContent(html);
  for (const p of PARAS) assert.ok(body.includes(p), `missing paragraph: ${p.slice(0, 40)}`);
  assert.ok(body.length > 500);
});

test('Readability keeps paragraphs and drops navigation, captions and boilerplate', () => {
  const lines = extractReadableText(newsPage()).split('\n');
  assert.deepEqual(lines.filter((l) => PARAS.includes(l)), PARAS);
  for (const junk of ['watch now', 'Sign up', 'A health worker in a clinic.', 'Got a confidential news tip?', 'All rights reserved']) {
    assert.ok(!lines.some((l) => l.includes(junk)), `junk kept: ${junk}`);
  }
});

test('a publisher articleBody is used when complete, but not when it is one paragraph-less block', () => {
  const full = PARAS.join('\n') + '\n' + 'An extra closing paragraph that only the structured data carries, with more detail.';
  assert.equal(extractArticleContent(newsPage({ jsonLd: { '@type': 'NewsArticle', articleBody: full } })), cleanBodyLines(full.split('\n')).join('\n'));
  const block = PARAS.join(' ');
  const body = extractArticleContent(newsPage({ jsonLd: { '@type': 'NewsArticle', articleBody: block } }));
  assert.ok(body.split('\n').length >= 3, 'page paragraphs preferred over a single block');
});

test('cleanBodyLines removes furniture lines, fragments and duplicates', () => {
  assert.deepEqual(
    cleanBodyLines([
      'NEWYou can now listen to Fox News articles!',
      'Subscribe to our newsletter',
      'By Euronews Published on 4 November 2026 - 20:48 GMT+1',
      'Related',
      'Short label',
      PARAS[0],
      `  ${PARAS[0]}  `,
      'He said: “We are ready.”',
    ]),
    [PARAS[0], 'He said: “We are ready.”'],
  );
});

test('long articles are no longer cut at 8,000 chars; the cap cuts at a paragraph boundary', () => {
  const long = Array.from({ length: 120 }, (_, i) => `${PARAS[i % PARAS.length]} (${i})`).join('\n');
  assert.ok(long.length > 8000 && long.length < MAX_ARTICLE_CHARS);
  assert.equal(capAtParagraph(long), long);
  const capped = capAtParagraph(long, 1000);
  assert.ok(capped.length <= 1000);
  assert.ok(long.startsWith(capped));
  assert.ok(long.charAt(capped.length) === '\n', 'cut exactly at a paragraph end');
});

test('only a real, clearly longer article replaces the stored body', () => {
  const teaser = 'Republican Senator Susan Collins won in China on Tuesday. Statewide,...';
  const full = PARAS.join('\n');
  assert.equal(shouldReplaceBody(teaser, full), true);
  assert.equal(shouldReplaceBody(teaser, 'Got a confidential news tip? We want to hear from you.'), false); // paywall footer
  assert.equal(shouldReplaceBody(full, full + ' x'), false); // not clearly longer
  assert.equal(shouldReplaceBody(full, ''), false);
  assert.equal(shouldReplaceBody(null, PARAS.slice(0, 2).join('\n')), true); // nothing stored yet
});

test('teaser detection', () => {
  assert.equal(endsLikeTeaser('In China, a lakeside town… Statewide,...'), true);
  assert.equal(endsLikeTeaser('The minister spoke on Tuesday […]'), true);
  assert.equal(endsLikeTeaser('He resigned. Continue reading...'), true);
  assert.equal(endsLikeTeaser('주 전체에서는…'), true);
  assert.equal(endsLikeTeaser(PARAS.join('\n')), false);
  assert.equal(isExcerptBody('A short summary of the story.'), true); // too short to be an article
  assert.equal(isExcerptBody(PARAS.join('\n')), false);
  assert.equal(isExcerptBody(''), false);
  assert.equal(isExcerptBody(null), false);
});
