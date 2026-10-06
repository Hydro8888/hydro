/**
 * OpenAI-compatible mock of the xAI chat completions API — lets the whole
 * translation pipeline (collector / backfill) run end-to-end without an API
 * key, with deterministic failure injection keyed on markers in the text:
 *   ECHO       in a title → the model echoes the English title as titleKo
 *   TRUNCJSON  in a title → the JSON array is cut off mid-object
 *   LENGTHCUT  in a body  → finish_reason "length" + partial output whenever
 *                           the request segment is longer than 1200 chars
 * Every request is appended to qa-out/mock-llm-requests.jsonl.
 *
 *   node scripts/qa/mock-llm.js [port=4010]
 *   XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 4010);
const OUT = path.join(process.cwd(), 'qa-out');
fs.mkdirSync(OUT, { recursive: true });
const LOG = path.join(OUT, 'mock-llm-requests.jsonl');

function reply(res, content, finish = 'stop') {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    id: `mock-${Date.now()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: 'mock',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finish }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  }));
}

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (!req.url.endsWith('/chat/completions')) { res.writeHead(404); return res.end('{}'); }
    if (process.env.MOCK_BILLING === '1') {
      // Same refusal xAI sends when the team is out of credits
      res.writeHead(403, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ code: 'Some requested entity was not found', error: 'Your team mock has either used all available credits or reached its monthly spending limit. To continue making API requests, please purchase more credits or raise your spending limit.' }));
    }
    const j = JSON.parse(body || '{}');
    const sys = j.messages?.find((m) => m.role === 'system')?.content || '';
    const user = j.messages?.find((m) => m.role === 'user')?.content || '';
    const isTitle = /idx/.test(sys);
    fs.appendFileSync(LOG, JSON.stringify({
      t: Date.now(), kind: isTitle ? 'title' : 'content', model: j.model,
      max_tokens: j.max_tokens ?? j.max_completion_tokens, chars: user.length, head: user.slice(0, 60),
    }) + '\n');

    if (isTitle) {
      const lines = user.split('\n').map((l) => l.match(/^(\d+)\.\s(.*)$/)).filter(Boolean);
      const items = lines.map(([, n, t]) => ({
        idx: Number(n),
        titleKo: /ECHO/.test(t) ? t : `한국어 제목: ${t.replace(/\(#\d+\)/, '').trim()}`,
        summaryKo: `요약: ${t.slice(0, 30)}에 관한 기사입니다.`,
        primary: /chip|AI/i.test(t) ? 'ai-tech' : /stock|rate|Fed/i.test(t) ? 'economy' : 'world',
        secondary: '',
      }));
      let out = JSON.stringify(items);
      if (lines.some(([, , t]) => /TRUNCJSON/.test(t))) out = out.slice(0, Math.floor(out.length * 0.6));
      return reply(res, '```json\n' + out + '\n```');
    }

    const paras = user.split(/\n+/).filter((p) => p.trim());
    const translated = paras.map((p) => `번역된 문단: ${p.slice(0, 50)}`).join('\n\n');
    if (/LENGTHCUT/.test(user) && user.length > 1200) {
      return reply(res, translated.slice(0, Math.floor(translated.length / 3)), 'length');
    }
    return reply(res, translated);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock-llm listening on :${PORT}`));
