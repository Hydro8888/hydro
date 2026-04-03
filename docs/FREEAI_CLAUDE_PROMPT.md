# freeai 서비스 작업 시 Claude Code에게 줄 프롬프트

아래 내용을 복사하여 Claude Code 대화 시작 시 입력하세요.

---

```
이 프로젝트는 AI Portal Pro (freeai) 서비스입니다.
작업 전에 아래 배포 가이드를 반드시 숙지하고 따르세요.

==========================================================
AI Portal Pro (freeai) 배포 트러블슈팅 가이드
==========================================================

## 서비스 정보

| 항목 | 값 |
|------|-----|
| 서비스명 | freeai (AI Portal Pro) |
| 포트 | 3010 |
| 접속 경로 | http://172.30.1.99/freeai (내부), http://free.ai.kr (외부) |
| 소스 경로 | /home/ubuntu/freeai |
| 앱 경로 | /home/ubuntu/freeai/apps/web |
| PM2 이름 | freeai |
| 브랜치 | claude/ai-portal-dev-plan-yI3Gd |
| 프레임워크 | Next.js 14 + Turbo 모노레포 + pnpm |

## 핵심 아키텍처 (반드시 숙지)

브라우저 → 211.198.54.207:80 (호스트 nginx /etc/nginx/sites-enabled/)
              ├─ /matching → 127.0.0.1:3001
              ├─ /jobworld → 127.0.0.1:3100 (Docker nginx, jobworld 전용)
              ├─ /freeai → 127.0.0.1:3010 (Next.js PM2)
              └─ server_name free.ai.kr → 127.0.0.1:3010

Docker nginx (jobworld-nginx, 포트 3100) = jobworld 전용. freeai와 무관!

## 절대 금지 사항 (과거 실수에서 학습)

1. docker exec jobworld-nginx 으로 freeai nginx 설정 변경 금지 — Docker nginx는 freeai와 무관
2. sudo pm2 start 금지 — root PM2와 ubuntu PM2가 분리되어 포트 충돌 발생
3. output: 'standalone' 사용 금지 — pnpm 모노레포와 호환 문제, static 파일 복사 실패
4. assetPrefix 설정 금지 — basePath와 이중 적용되어 CSS 404
5. node_modules/.bin/next 를 PM2 script로 지정 금지 — bash 스크립트라 SyntaxError
6. nginx sites-enabled/ 안에 .bak 백업 파일 생성 금지 — duplicate server 에러
7. .next만 삭제하고 빌드 금지 — turbo 캐시(.turbo/)가 이전 빌드를 복원함. 반드시 .turbo도 삭제

## 필수 설정 파일 (정상 상태 — 이것과 다르면 수정 필요)

### apps/web/next.config.js
const nextConfig = {
  basePath: '/freeai',        // 서브패스 접속 필수. 절대 제거하지 마
  trailingSlash: false,       // 308 리다이렉트 루프 방지. 필수!
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
};
module.exports = nextConfig;

### apps/web/lib/api-url.ts
export function apiUrl(path: string): string {
  return `/freeai${path}`;    // AI SDK의 useChat은 basePath 자동 추가 안 함
}

### apps/web/package.json (scripts)
"start": "next start -p 3010 -H 0.0.0.0"

### ecosystem.config.cjs
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

### 호스트 nginx 설정 (2곳)

1) /etc/nginx/sites-enabled/hydro — catch-all 서버 블록 내부:
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

2) /etc/nginx/sites-available/freeai (심볼릭 링크 활성화) — 도메인 접속용:
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

## 표준 배포 절차

cd /home/ubuntu/freeai
git pull origin claude/ai-portal-dev-plan-yI3Gd
rm -rf apps/web/.next .turbo apps/web/.turbo node_modules/.cache
pnpm build
pm2 delete freeai 2>/dev/null
pm2 start ecosystem.config.cjs
pm2 save
sleep 10
pm2 status | grep freeai
curl -sI http://localhost:3010/freeai | head -3
curl -sI http://172.30.1.99/freeai | head -3

## 문제별 해결 가이드

### CSS가 로드되지 않음 (스타일 없는 텍스트)
- PM2 확인: pm2 status | grep freeai (online, memory > 0)
- Next.js 확인: curl -sI http://localhost:3010/freeai (200 OK)
- nginx 확인: curl -sI http://172.30.1.99/freeai (200 또는 308)
- CSS 파일 없으면: rm -rf .next .turbo && pnpm build
- output: 'standalone' 있으면: 즉시 제거

### PM2 errored (재시작 반복, 0b memory)
- 에러 로그: pm2 logs freeai --err --lines 20
- SyntaxError: missing ) → script: 'pnpm' + interpreter: 'none'
- MODULE_NOT_FOUND standalone → rm -rf .next .turbo && pnpm build
- EADDRINUSE :3010 → pm2 delete freeai && sudo pm2 delete freeai
- EACCES permission → sudo chown -R ubuntu:ubuntu /home/ubuntu/freeai

### nginx 404 (스타일 없는 기본 에러)
- 활성 설정 확인: ls -la /etc/nginx/sites-enabled/
- location 확인: sudo grep "location /freeai" /etc/nginx/sites-enabled/hydro
- Docker nginx 사용 금지! 호스트 nginx만 수정

### Next.js styled 404 (CSS 있는 404)
- basePath 확인: grep basePath next.config.js (= '/freeai' 필수)
- PM2 재시작: pm2 delete freeai && pm2 start ecosystem.config.cjs
- turbo 캐시 확인: 빌드가 53ms이면 캐시 복원됨 → .turbo 삭제

### 308 리다이렉트 루프
- trailingSlash: false 확인

### Cloudflare 502/404
- 서버 직접 확인: curl -sI -H "Host: free.ai.kr" http://127.0.0.1:80/
- 200이면 Cloudflare 캐시 퍼지 필요

## 진단 명령어 모음

pm2 status | grep freeai
curl -sI http://localhost:3010/freeai | head -3
curl -sI http://172.30.1.99/freeai | head -3
curl -sI -H "Host: free.ai.kr" http://127.0.0.1:80/ | head -3
ls -la /etc/nginx/sites-enabled/
sudo nginx -T 2>&1 | grep "server_name"
pm2 logs freeai --err --lines 20
cat /home/ubuntu/freeai/apps/web/next.config.js
ss -tlnp | grep 3010

## 기존 서비스 영향 확인 (작업 후 반드시 실행)

for path in contact matching hacker agentmarket fundmanager gonak jobworld; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://172.30.1.99/$path/)
  echo "$path → $code"
done

## 과거 실수와 교훈

| 실수 | 교훈 |
|------|------|
| Docker nginx(jobworld-nginx)를 수정함 | 포트 80은 호스트 nginx가 처리. ls -la /etc/nginx/sites-enabled/ 먼저 확인 |
| sudo pm2 start로 root PM2에 프로세스 생성 | PM2는 항상 같은 사용자(ubuntu)로. sudo 사용 금지 |
| .next만 삭제하고 빌드 | turbo 캐시가 이전 빌드 복원. .turbo도 반드시 삭제 |
| output: 'standalone' 사용 | static 파일 복사 문제, pnpm 호환 문제. 사용 금지 |
| basePath 제거 후 재추가 반복 | 이 서버는 서브패스(/freeai) 방식 필수. basePath 유지 |
| assetPrefix도 함께 설정 | basePath만으로 충분. 둘 다 설정하면 CSS 경로 이중 적용 |
| nginx.conf를 sed -i로 수정 | Docker bind mount에서 sed -i는 inode 변경 → 컨테이너가 변경 못 봄 |
| sites-enabled/에 .bak 파일 생성 | nginx가 .bak도 설정 파일로 인식. 백업은 다른 폴더에 |
```
