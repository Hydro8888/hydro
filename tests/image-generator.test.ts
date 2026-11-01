/**
 * Unit tests for OpenAI image generation + generated-image storage. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { generateImages, type ImageClient } from '../src/workers/image-generator';
import { readGeneratedImage, saveGeneratedImage, generatedImageFileName } from '../src/lib/generated-image-store';
import { getArticleImageSources, isGeneratedImagePath, isValidArticleImage } from '../src/lib/utils';
import type { TranslatableArticle } from '../src/workers/translator';

// 1x1 JPEG-ish payload, > 100 bytes once decoded
const B64 = Buffer.alloc(400, 7).toString('base64');

function article(over: Partial<TranslatableArticle> = {}): TranslatableArticle {
  return { originalUrl: 'https://news.example.com/a', titleOriginal: 'Title', imageUrl: null, categoryPrimary: 'economy', ...over } as TranslatableArticle;
}

test('generateImages is off unless OPENAI_IMAGE_GENERATION=true', async () => {
  let called = 0;
  const client: ImageClient = { images: { async generate() { called++; return { data: [{ b64_json: B64 }] }; } } };
  const a = [article()];
  await generateImages(a, { client });
  assert.equal(called, 0);
  assert.equal(a[0].imageUrl, null);
});

test('generateImages saves base64 to disk and stores a servable path', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'gen-img-'));
  try {
    const seen: Array<Record<string, unknown>> = [];
    const client: ImageClient = { images: { async generate(p) { seen.push(p); return { data: [{ b64_json: B64 }] }; } } };
    const a = [article(), article({ originalUrl: 'https://news.example.com/has', imageUrl: 'https://cdn.example.com/x.jpg' })];
    await generateImages(a, { client, force: true, dir, pauseMs: 0 });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].model, 'gpt-image-2.5-flare');
    assert.equal(seen[0].output_format, 'jpeg');
    assert.ok(isGeneratedImagePath(a[0].imageUrl!));
    assert.equal(a[1].imageUrl, 'https://cdn.example.com/x.jpg');
    const file = a[0].imageUrl!.split('/').pop()!;
    assert.deepEqual(readdirSync(dir), [file]);
    const back = await readGeneratedImage(file, dir);
    assert.equal(back?.contentType, 'image/jpeg');
    assert.equal(back?.body.length, 400);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('generateImages stops after a fatal error (billing / bad request)', async () => {
  let calls = 0;
  const client: ImageClient = {
    images: {
      async generate() {
        calls++;
        throw Object.assign(new Error('429 You exceeded your current quota, please check your plan and billing details.'), { status: 429, code: 'insufficient_quota' });
      },
    },
  };
  const a = [article(), article({ originalUrl: 'u2' }), article({ originalUrl: 'u3' })];
  await generateImages(a, { client, force: true, pauseMs: 0 });
  assert.equal(calls, 1);
  assert.ok(a.every((x) => x.imageUrl === null));
});

test('generated image paths: strict names, valid for the image chain, no traversal', async () => {
  const file = generatedImageFileName('seed', 'jpg');
  assert.match(file, /^[a-f0-9]{32}\.jpg$/);
  const p = `/livenews/api/generated-image/${file}`;
  assert.equal(isGeneratedImagePath(p), true);
  assert.equal(isValidArticleImage(p), true);
  assert.deepEqual(getArticleImageSources({ id: 1, imageUrl: p, categoryPrimary: 'economy' })[0], p);
  for (const bad of ['/livenews/api/generated-image/../../etc/passwd', '/livenews/api/generated-image/abc.jpg', '/other/x.jpg', `/livenews/api/generated-image/${file}.exe`]) {
    assert.equal(isGeneratedImagePath(bad), false, bad);
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'gen-img-'));
  try {
    assert.equal(await readGeneratedImage('../package.json', dir), null);
    assert.equal(await readGeneratedImage(file, dir), null); // missing
    assert.equal(await saveGeneratedImage('s', 'AAAA', 'jpg', dir), null); // too small to be an image
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('generateImages reports requests, failures and billing refusals through stats', async () => {
  const { newApiStats } = await import('../src/lib/ai-client');
  const stats = newApiStats();
  const client: ImageClient = {
    images: {
      async generate() {
        throw Object.assign(new Error('429 You exceeded your current quota, please check your plan and billing details.'), { status: 429, code: 'insufficient_quota' });
      },
    },
  };
  await generateImages([article(), article({ originalUrl: 'u2' })], { client, force: true, pauseMs: 0, stats });
  assert.deepEqual({ calls: stats.apiCalls, failures: stats.apiFailures, billing: stats.billingBlocked }, { calls: 1, failures: 1, billing: true });
});
