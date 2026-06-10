# AI Portal Pro (freeai) 배포 트러블슈팅 가이드

> 이 문서는 Claude Code에게 주는 지침입니다. freeai 서비스 배포/운영 시 참조하세요.

---

## 서비스 정보

| 항목 | 값 |
|------|-----|
| 서비스명 | freeai (AI Portal Pro) |
| 포트 | 3010 |
| 접속 경로 | `http://172.30.1.99/freeai` (내부), `http://free.ai.kr` (외부) |
| 소스 경로 | `/home/ubuntu/freeai` |
| 앱 경로 | `/home/ubuntu/freeai/apps/web` |
| PM2 이름 | freeai |
| 브랜치 | `claude/ai-portal-dev-plan-yI3Gd` |
| 프레임워크 | Next.js 14 + Turbo 모노레포 + pnpm |

---

## 핵심 아키텍처 (반드시 숙지)

```
브라우저 → 211.198.54.207:80 (호스트 nginx /etc/nginx/sites-enabled/)
              ├─ /matching → 127.0.0.1:3001
              ├─ /jobworld → 127.0.0.1:3100 (Docker nginx, jobworld 전용)
              ├─ /freeai → 127.0.0.1:3010 (Next.js PM2)
              └─ server_name free.ai.kr → 127.0.0.1:3010

Docker nginx (jobworld-nginx, 포트 3100) = jobworld 전용. freeai와 무관!
```

### 절대 금지 사항
- ❌ `docker exec jobworld-nginx`로 freeai nginx 설정 변경 — Docker nginx는 freeai와 무관
- ❌ `sudo pm2 start` — root PM2와 ubuntu PM2가 분리되어 포트 충돌
- ❌ `output: 'standalone'` 사용 — pnpm 모노레포와 호환 문제
- ❌ `assetPrefix` 설정 — basePath와 이중 적용되어 CSS 404
- ❌ `node_modules/.bin/next`를 PM2 script로 지정 — bash 스크립트라 SyntaxError
- ❌ nginx `sites-enabled/` 안에 `.bak` 백업 파일 — duplicate server 에러

---

## 필수 설정 파일 (정상 상태)

### `apps/web/next.config.js`
```js
const nextConfig = {
  basePath: '/freeai',        // 서브패스 접속 필수
  trailingSlash: false,       // 308 리다이렉트 루프 방지 (필수!)
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
};
module.exports = nextConfig;
```

### `apps/web/lib/api-url.ts`
```ts
export function apiUrl(path: string): string {
  return `/freeai${path}`;    // AI SDK의 useChat은 basePath 자동 추가 안 함
}
```

### `apps/web/package.json` (scripts 부분)
```json
"start": "next start -p 3010 -H 0.0.0.0"
```

### `ecosystem.config.cjs`
```js
module.exports = {
  apps: [{
    name: 'freeai',
    cwd: '/home/ubuntu/freeai/apps/web',
    script: 'pnpm',           // pnpm으로 실행 (node_modules/.bin/next 사용 금지!)
    args: 'start',
    interpreter: 'none',      // PM2가 Node.js 인터프리터 사용 안 함
    exec_mode: 'fork',        // cluster 모드 금지
    env: { NODE_ENV: 'production', PORT: 3010 },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
  }],
};
```

### 호스트 nginx 설정 (2곳)

**1) `/etc/nginx/sites-enabled/hydro` — catch-all 서버 블록 내부:**
```nginx
location /freeai {
    proxy_pass http://127.0.0.1:3010;   # 끝에 / 없음!
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
}
```

**2) `/etc/nginx/sites-available/freeai` (심볼릭 링크 활성화) — 도메인 접속용:**
```nginx
server {
    listen 80;
    server_name free.ai.kr;
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3010/_next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 표준 배포 절차

```bash
cd /home/ubuntu/freeai
git pull origin claude/ai-portal-dev-plan-yI3Gd

# 빌드 캐시 전체 삭제 (turbo 캐시가 이전 빌드를 복원하므로 반드시!)
rm -rf apps/web/.next .turbo apps/web/.turbo node_modules/.cache

# 빌드
pnpm build

# PM2 재시작 (sudo 없이! ubuntu 사용자로!)
pm2 delete freeai 2>/dev/null
pm2 start ecosystem.config.cjs
pm2 save

# 확인 (10초 대기)
sleep 10
pm2 status | grep freeai
curl -sI http://localhost:3010/freeai | head -3
curl -sI http://172.30.1.99/freeai | head -3
```

---

## 문제별 해결 가이드

### 문제 1: CSS가 로드되지 않음 (스타일 없는 텍스트)

**증상:** HTML은 보이지만 Tailwind CSS가 적용되지 않아 plain text로 표시

**원인 체크리스트:**
```bash
# 1. PM2가 실행 중인지 확인
pm2 status | grep freeai   # online이어야 함, memory > 0

# 2. Next.js가 응답하는지 확인
curl -sI http://localhost:3010/freeai | head -3   # 200 OK

# 3. CSS 파일이 서빙되는지 확인
CSS_FILE=$(find /home/ubuntu/freeai/apps/web/.next/static/css -name '*.css' | head -1)
CSS_NAME=$(basename "$CSS_FILE")
curl -sI "http://localhost:3010/freeai/_next/static/css/$CSS_NAME" | head -3   # 200 OK

# 4. nginx가 라우팅하는지 확인
curl -sI http://172.30.1.99/freeai | head -3   # 200 또는 308
```

**해결:**
- CSS 파일 없음 → `rm -rf .next .turbo && pnpm build`
- PM2 errored → `pm2 delete freeai && pm2 start ecosystem.config.cjs` (sudo 없이!)
- nginx 404 → `sudo grep "location /freeai" /etc/nginx/sites-enabled/hydro` 확인
- `output: 'standalone'`이 next.config.js에 있으면 → 즉시 제거

### 문제 2: PM2 errored 상태 (↺ 15, 0b memory)

**증상:** PM2 status에서 errored, 재시작 반복, 메모리 0b

**원인 체크리스트:**
```bash
# 에러 로그 확인
pm2 logs freeai --err --lines 20
```

**에러별 해결:**

| 에러 메시지 | 원인 | 해결 |
|-------------|------|------|
| `SyntaxError: missing ) after argument list` | `node_modules/.bin/next`는 bash 스크립트 | `script: 'pnpm'` + `interpreter: 'none'`으로 변경 |
| `MODULE_NOT_FOUND .next/standalone/` | 이전 standalone 빌드 잔여물 | `rm -rf .next .turbo && pnpm build` |
| `EADDRINUSE :3010` | 다른 프로세스가 포트 점유 | `pm2 delete freeai && sudo pm2 delete freeai && pm2 start ecosystem.config.cjs` |
| `EACCES: permission denied .next/trace` | sudo로 빌드 후 일반 사용자 실행 | `sudo chown -R ubuntu:ubuntu /home/ubuntu/freeai` |

### 문제 3: nginx 404 (Next.js 404가 아닌 nginx 기본 404)

**증상:** `404 Not Found nginx/1.28.0 (Ubuntu)` — 스타일 없는 기본 에러 페이지

**원인:** 호스트 nginx에 `/freeai` location이 없음

**해결:**
```bash
# 1. 활성 설정 파일 확인 (반드시!)
ls -la /etc/nginx/sites-enabled/

# 2. 어느 서버 블록이 요청을 처리하는지 확인
sudo nginx -T 2>&1 | grep -B1 "server_name"

# 3. catch-all 서버 블록에 location 추가
# hydro 파일의 server_name _; 블록 내부에 location /freeai 추가
sudo grep "location /freeai" /etc/nginx/sites-enabled/hydro

# 4. 테스트 + 리로드
sudo nginx -t && sudo systemctl reload nginx
```

**주의:** `docker exec jobworld-nginx` 사용 금지! Docker nginx는 jobworld 전용.

### 문제 4: Next.js styled 404 (CSS 있는 404 페이지)

**증상:** `404 | This page could not be found.` — CSS 적용된 Next.js 404

**원인:** nginx → Next.js 라우팅은 성공했지만, Next.js가 해당 경로의 페이지를 못 찾음

**체크리스트:**
```bash
# basePath 확인
grep "basePath" /home/ubuntu/freeai/apps/web/next.config.js
# → basePath: '/freeai' 있어야 함

# 빌드가 최신인지 확인
ls -la /home/ubuntu/freeai/apps/web/.next/BUILD_ID

# PM2가 최신 빌드를 사용하는지 확인
pm2 delete freeai && pm2 start ecosystem.config.cjs
```

### 문제 5: Turbo 캐시가 이전 빌드를 복원

**증상:** `Cached: 4 cached, Time: 53ms >>> FULL TURBO` — 빌드가 너무 빠름

**원인:** `.turbo/` 캐시가 이전 빌드를 복원하여 코드 변경이 반영되지 않음

**해결:**
```bash
rm -rf /home/ubuntu/freeai/apps/web/.next
rm -rf /home/ubuntu/freeai/.turbo
rm -rf /home/ubuntu/freeai/apps/web/.turbo
rm -rf /home/ubuntu/freeai/node_modules/.cache
pnpm build
# → Cached: 0 cached 확인! Time: 30초 이상이어야 정상
```

### 문제 6: 308 Permanent Redirect 루프

**증상:** `/freeai/`와 `/freeai` 사이에서 무한 리다이렉트

**해결:** `next.config.js`에 `trailingSlash: false` 추가

### 문제 7: free.ai.kr 도메인 접속 시 Cloudflare 502/404

**증상:** Cloudflare 에러 페이지 또는 캐시된 404

**해결:**
```bash
# 1. 서버에서 직접 확인 (이게 200이면 앱은 정상)
curl -sI -H "Host: free.ai.kr" http://127.0.0.1:80/ | head -5

# 2. 200이면 → Cloudflare 대시보드에서 캐시 퍼지
# Cloudflare → free.ai.kr 도메인 → Caching → Purge Everything

# 3. 200이 아니면 → 호스트 nginx에 server_name free.ai.kr 서버 블록 확인
sudo nginx -T 2>&1 | grep "server_name free"
```

---

## 진단 명령어 모음

```bash
# === 전체 상태 확인 ===
pm2 status | grep freeai
curl -sI http://localhost:3010/freeai | head -3
curl -sI http://172.30.1.99/freeai | head -3
curl -sI -H "Host: free.ai.kr" http://127.0.0.1:80/ | head -3

# === nginx 설정 확인 ===
ls -la /etc/nginx/sites-enabled/
sudo nginx -T 2>&1 | grep "server_name"
sudo grep "location /freeai" /etc/nginx/sites-enabled/hydro

# === PM2 상세 확인 ===
pm2 logs freeai --err --lines 20
pm2 show freeai

# === 빌드 상태 확인 ===
cat /home/ubuntu/freeai/apps/web/next.config.js
ls -la /home/ubuntu/freeai/apps/web/.next/BUILD_ID

# === 기존 서비스 영향 확인 ===
for path in contact matching hacker agentmarket fundmanager gonak jobworld; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://172.30.1.99/$path/)
  echo "$path → $code"
done

# === 포트 확인 ===
ss -tlnp | grep 3010
```

---

## 이 서비스의 과거 실수와 교훈

| 실수 | 교훈 |
|------|------|
| Docker nginx(`jobworld-nginx`)를 수정함 | 포트 80은 호스트 nginx가 처리. `ls -la /etc/nginx/sites-enabled/`로 먼저 확인 |
| `sudo pm2 start`로 root PM2에 프로세스 생성 | PM2는 항상 같은 사용자(ubuntu)로. `sudo` 사용 금지 |
| `.next`만 삭제하고 빌드 | turbo 캐시가 이전 빌드 복원. `.turbo`도 반드시 삭제 |
| `output: 'standalone'` 사용 | static 파일 복사 문제, pnpm 호환 문제. 사용 금지 |
| `basePath` 제거 후 재추가 반복 | 이 서버는 서브패스(`/freeai`) 방식 필수. basePath 유지 |
| `assetPrefix`도 함께 설정 | basePath만으로 충분. 둘 다 설정하면 CSS 경로 이중 적용 |
| nginx.conf를 `sed -i`로 수정 | Docker bind mount에서 sed -i는 inode 변경 → 컨테이너가 변경 못 봄 |
| `sites-enabled/`에 .bak 파일 생성 | nginx가 .bak도 설정 파일로 인식. 백업은 다른 폴더에 |
