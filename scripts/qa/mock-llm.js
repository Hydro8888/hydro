/**
 * OpenAI-compatible mock of the chat completions / models API — lets the whole
 * translation pipeline (collector / backfill) and set-ai-key.sh run end-to-end
 * without a real API key. Behaves like current OpenAI models:
 *   - `max_tokens` is rejected (400 unsupported_parameter) — use max_completion_tokens
 *   - errors use the OpenAI shape { error: { message, type, param, code } }
 * Deterministic failure injection, keyed on markers in the text:
 *   ECHO       in a title → the model echoes the English title as titleKo
 *   TRUNCJSON  in a title → the JSON array is cut off mid-object
 *   LENGTHCUT  in a body  → finish_reason "length" + partial output whenever
 *                           the request segment is longer than 1200 chars
 * Environment switches:
 *   MOCK_VALID_KEY=sk-…          → any other bearer key gets 401 invalid_api_key
 *   MOCK_BILLING=1               → every chat request: 429 insufficient_quota
 *   MOCK_REJECT_PARAMS=a,b       → 400 unsupported_parameter for these params
 *   MOCK_LOG_DIR=/path           → where mock-llm-requests.jsonl goes (default ./qa-out)
 *
 *   node scripts/qa/mock-llm.js [port=4010]
 *   OPENAI_API_KEY=test OPENAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 4010);
const OUT = process.env.MOCK_LOG_DIR || path.join(process.cwd(), 'qa-out');
fs.mkdirSync(OUT, { recursive: true });
const LOG = path.join(OUT, 'mock-llm-requests.jsonl');
const REJECT = new Set((process.env.MOCK_REJECT_PARAMS || '').split(',').map((s) => s.trim()).filter(Boolean));
REJECT.add('max_tokens');

function send(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function apiError(res, status, message, type, code, param = null) {
  send(res, status, { error: { message, type, param, code } });
}

function reply(res, content, finish = 'stop') {
  send(res, 200, {
    id: `mock-${Date.now()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: 'mock',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finish }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
}

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const auth = req.headers.authorization || '';
    if (process.env.MOCK_VALID_KEY && auth !== `Bearer ${process.env.MOCK_VALID_KEY}`) {
      return apiError(res, 401, 'Incorrect API key provided.', 'invalid_request_error', 'invalid_api_key');
    }

    const model = req.url.match(/\/models\/([^/?]+)/);
    if (req.method === 'GET' && model) {
      return send(res, 200, { id: decodeURIComponent(model[1]), object: 'model', owned_by: 'mock' });
    }
    if (!req.url.endsWith('/chat/completions')) return apiError(res, 404, 'Not found', 'invalid_request_error', 'not_found');

    if (process.env.MOCK_BILLING === '1') {
      return apiError(res, 429, 'You exceeded your current quota, please check your plan and billing details.', 'insufficient_quota', 'insufficient_quota');
    }

    const j = JSON.parse(body || '{}');
    for (const p of REJECT) {
      if (p in j) {
        return apiError(res, 400, `Unsupported parameter: '${p}' is not supported with this model.`, 'invalid_request_error', 'unsupported_parameter', p);
      }
    }

    const sys = j.messages?.find((m) => m.role === 'system')?.content || '';
    const user = j.messages?.find((m) => m.role === 'user')?.content || '';
    const isTitle = /idx/.test(sys);
    fs.appendFileSync(LOG, JSON.stringify({
      t: Date.now(), kind: isTitle ? 'title' : 'content', model: j.model,
      max_completion_tokens: j.max_completion_tokens, reasoning_effort: j.reasoning_effort,
      temperature: j.temperature, chars: user.length, head: user.slice(0, 60),
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

    if (user === 'ping') return reply(res, 'pong');

    const paras = user.split(/\n+/).filter((p) => p.trim());
    const translated = paras.map((p) => `번역된 문단: ${p.slice(0, 50)}`).join('\n\n');
    if (/LENGTHCUT/.test(user) && user.length > 1200) {
      return reply(res, translated.slice(0, Math.floor(translated.length / 3)), 'length');
    }
    return reply(res, translated);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock-llm listening on :${PORT}`));
