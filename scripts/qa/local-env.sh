#!/bin/bash
# Local QA environment for this repo (never touches production).
#   bash scripts/qa/local-env.sh up        # Postgres :54329 + Redis :6380 (+ schema, sources, fixtures if empty)
#   bash scripts/qa/local-env.sh restart   # rebuild the app and (re)start `next start` on :4000
#   bash scripts/qa/local-env.sh reseed    # reset fixture articles (stable ids) + flush Redis
#   bash scripts/qa/local-env.sh status
# Needs: PostgreSQL 16 binaries, redis-server, fuser. State lives in /var/lib/postgresql/livenews-qa.
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PGD=/var/lib/postgresql/livenews-qa
PGBIN=/usr/lib/postgresql/16/bin
OUT="$APP/qa-out"; mkdir -p "$OUT"
export DATABASE_URL="postgresql://postgres@127.0.0.1:54329/livenews?schema=public"
export REDIS_URL="redis://127.0.0.1:6380"
q() { psql -h 127.0.0.1 -p 54329 -U postgres -d "${2:-livenews}" -tAc "$1" 2>/dev/null; }

up() {
  if ! q 'select 1' postgres >/dev/null; then
    mkdir -p $PGD && chown -R postgres:postgres $PGD && chmod 700 $PGD
    [ -d $PGD/data ] || runuser -u postgres -- $PGBIN/initdb -D $PGD/data -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
    rm -f $PGD/data/postmaster.pid
    runuser -u postgres -- setsid $PGBIN/pg_ctl -D $PGD/data -l $PGD/pg.log -o "-p 54329 -k $PGD -c listen_addresses=127.0.0.1" start >/dev/null
    for i in $(seq 1 20); do q 'select 1' postgres >/dev/null && break; sleep 0.5; done
  fi
  q 'select 1' >/dev/null || psql -h 127.0.0.1 -p 54329 -U postgres -c 'CREATE DATABASE livenews' >/dev/null
  redis-cli -p 6380 ping >/dev/null 2>&1 || { redis-server --port 6380 --daemonize yes --save "" --appendonly no >/dev/null; sleep 1; }
  cd "$APP" || exit 1
  if [ -z "$(q 'select count(*) from "Article"')" ]; then node_modules/.bin/prisma db push --skip-generate >/dev/null 2>&1; fi
  [ "$(q 'select count(*) from "Source"')" -gt 0 ] 2>/dev/null || npx tsx prisma/seed.ts >/dev/null 2>&1
  [ "$(q 'select count(*) from "Article"')" -gt 0 ] 2>/dev/null || QA_ALLOW_RESET=1 npx tsx scripts/qa/seed-fixtures.ts >/dev/null 2>&1
}

case "$1" in
  up) up; echo "pg: $(q 'select count(*) from "Article"') articles | redis: $(redis-cli -p 6380 ping)" ;;
  reseed) up; cd "$APP" && QA_ALLOW_RESET=1 npx tsx scripts/qa/seed-fixtures.ts >/dev/null 2>&1; redis-cli -p 6380 flushall >/dev/null; echo "RESEEDED: $(q 'select count(*) from "Article"') articles" ;;
  restart)
    up
    # Next renames its process, so stop it by port
    fuser -k -TERM 4000/tcp >/dev/null 2>&1; for i in $(seq 1 15); do fuser 4000/tcp >/dev/null 2>&1 || break; sleep 1; done
    fuser -k -KILL 4000/tcp >/dev/null 2>&1
    cd "$APP" && rm -rf .next && NODE_ENV=production npx next build > "$OUT/build.log" 2>&1 < /dev/null
    if ! grep -q "Compiled successfully" "$OUT/build.log" || grep -qE "Failed to compile|Type error" "$OUT/build.log"; then echo "BUILD FAILED"; tail -40 "$OUT/build.log"; exit 1; fi
    (cd "$APP" && NODE_ENV=production exec setsid nohup node_modules/.bin/next start -H 127.0.0.1 -p 4000) > "$OUT/next.log" 2>&1 < /dev/null &
    for i in $(seq 1 40); do
      if [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/livenews)" = "200" ]; then
        css=$(curl -s http://127.0.0.1:4000/livenews | grep -oE '/livenews/_next/static/css/[^"]+\.css' | head -1)
        [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:4000$css")" = "200" ] && { redis-cli -p 6380 flushall >/dev/null; echo "APP UP (${i}s, css 200)"; exit 0; }
        echo "APP RESPONDS BUT CSS MISSING (stale server?)"; exit 1
      fi; sleep 1
    done
    echo "APP DID NOT START"; tail -30 "$OUT/next.log"; exit 1 ;;
  status) echo "pg: $(q 'select count(*) from "Article"') articles | redis: $(redis-cli -p 6380 ping 2>&1) | app: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/livenews)" ;;
  *) sed -n 2,7p "${BASH_SOURCE[0]}" ;;
esac
