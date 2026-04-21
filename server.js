const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '5110', 10);
const DB_PATH = process.env.DB_PATH || '/home/ubuntu/room/data/reservations.db';
const PEPPER = process.env.ROOM_PEPPER || 'room-meeting-pepper-2026-v1';

function hashPassword(pw) {
  return crypto.createHash('sha256').update(PEPPER + ':' + pw).digest('hex');
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    people INTEGER NOT NULL,
    reserver TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_reservations_room_date
    ON reservations(room, date);
  CREATE INDEX IF NOT EXISTS idx_reservations_date
    ON reservations(date);
`);

// Idempotent migrations
const migrations = [
  `ALTER TABLE reservations ADD COLUMN password_hash TEXT`,
  `ALTER TABLE reservations ADD COLUMN description TEXT NOT NULL DEFAULT ''`,
];
for (const sql of migrations) {
  try { db.exec(sql); } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

const stmts = {
  list: db.prepare(`
    SELECT id, room, date, startTime, endTime, people, reserver, description, created_at,
           (password_hash IS NOT NULL) AS has_password
    FROM reservations
    ORDER BY date ASC, startTime ASC
  `),
  findConflict: db.prepare(`
    SELECT id, startTime, endTime, reserver
    FROM reservations
    WHERE room = ? AND date = ?
      AND NOT (? <= startTime OR ? >= endTime)
    LIMIT 1
  `),
  insert: db.prepare(`
    INSERT INTO reservations (room, date, startTime, endTime, people, reserver, description, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getById: db.prepare(`
    SELECT id, room, date, startTime, endTime, people, reserver, description, created_at,
           (password_hash IS NOT NULL) AS has_password
    FROM reservations WHERE id = ?
  `),
  getFullById: db.prepare('SELECT * FROM reservations WHERE id = ?'),
  delete: db.prepare('DELETE FROM reservations WHERE id = ?'),
};

const ROOMS = new Set(['서초회의실', '신사회의실']);
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateInput(body) {
  const room = (body.room || '').toString();
  const date = (body.date || '').toString();
  const startTime = (body.startTime || '').toString();
  const endTime = (body.endTime || '').toString();
  const reserver = (body.reserver || '').toString().trim();
  const description = (body.description || '').toString().trim();
  const password = (body.password || '').toString();
  const people = parseInt(body.people, 10);

  if (!ROOMS.has(room)) return '회의실이 올바르지 않습니다';
  if (!DATE_RE.test(date)) return '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return '시간 형식이 올바르지 않습니다 (HH:MM)';
  if (startTime >= endTime) return '종료 시간은 시작 시간 이후여야 합니다';
  if (startTime < '07:00') return '예약 시작 시간은 07:00 이후여야 합니다';
  if (endTime > '19:00')   return '예약 종료 시간은 19:00 이하여야 합니다';
  if (!Number.isFinite(people) || people < 1 || people > 50) return '인원은 1~50명 사이여야 합니다';
  if (!reserver || reserver.length > 50) return '예약자 이름은 1~50자여야 합니다';
  if (description.length > 100) return '회의 내용은 100자 이내여야 합니다';
  if (!password || password.length < 4 || password.length > 20) return '비밀번호는 4~20자여야 합니다';

  return { room, date, startTime, endTime, people, reserver, description, password };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get('/api/reservations', (_req, res) => {
  res.json(stmts.list.all());
});

app.post('/api/reservations', (req, res) => {
  const v = validateInput(req.body || {});
  if (typeof v === 'string') return res.status(400).json({ error: v });

  const insertTxn = db.transaction((data) => {
    const conflict = stmts.findConflict.get(data.room, data.date, data.endTime, data.startTime);
    if (conflict) {
      const err = new Error('conflict');
      err.conflict = conflict;
      throw err;
    }
    const pwHash = hashPassword(data.password);
    const info = stmts.insert.run(
      data.room, data.date, data.startTime, data.endTime,
      data.people, data.reserver, data.description, pwHash
    );
    return stmts.getById.get(info.lastInsertRowid);
  });

  try {
    const row = insertTxn(v);
    res.status(201).json(row);
  } catch (e) {
    if (e.message === 'conflict') {
      const c = e.conflict;
      return res.status(409).json({
        error: `${v.room}에 해당 시간대 예약이 이미 존재합니다 (기존 ${c.startTime}~${c.endTime} ${c.reserver})`,
        conflict: c,
      });
    }
    console.error('[POST /api/reservations] error:', e);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.delete('/api/reservations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id 형식 오류' });

  const row = stmts.getFullById.get(id);
  if (!row) return res.status(404).json({ error: '해당 예약을 찾을 수 없습니다' });

  const pw = ((req.body && req.body.password) || '').toString();
  if (row.password_hash) {
    if (!pw) return res.status(401).json({ error: '비밀번호를 입력해주세요' });
    if (hashPassword(pw) !== row.password_hash) {
      return res.status(403).json({ error: '비밀번호가 일치하지 않습니다' });
    }
  }

  const info = stmts.delete.run(id);
  if (info.changes === 0) return res.status(404).json({ error: '해당 예약을 찾을 수 없습니다' });
  res.json({ ok: true, id });
});

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[room] listening on 0.0.0.0:${PORT} (db=${DB_PATH})`);
});

const shutdown = (sig) => {
  console.log(`[room] ${sig} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
