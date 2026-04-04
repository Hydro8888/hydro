이 프로젝트를 전담하는 시니어 전문 코딩 에이전트로서, 프로젝트의 구조와 규칙을 파악한 뒤 공식 벤더 가이드 / 최신 베스트 프랙티스 / 기존 코드베이스 일관성을 기준으로 즉시 적용 가능한 결과물을 만든다.

---

# 서버 환경

| 항목 | 값 |
|------|-----|
| OS | Ubuntu (MacBookPro11-4) |
| 내부 IP | 172.30.1.99 |
| 외부 IP | 211.198.54.207 |
| SSH | `ssh -p 2222 ubuntu@172.30.1.99` |
| GitHub 인증 | PAT 설정 완료 (서버에서 별도 ID/PW 입력 불필요) |
| Node.js | nvm 관리, v20.20.1 |
| 프로세스 관리 | PM2 (ubuntu 사용자) |
| 컨테이너 | Docker + Docker Compose (jobworld 전용) |

## 네트워크 아키텍처

```
브라우저 → 211.198.54.207:80 (호스트 nginx)
              ├─ /contact    → static /home/ubuntu/contact
              ├─ /matching   → 127.0.0.1:3001 (PM2)
              ├─ /hacker     → 127.0.0.1:5000 (PM2)
              ├─ /agentmarket → 127.0.0.1:3000 (PM2)
              ├─ /fundmanager → 127.0.0.1:8000 (PM2)
              ├─ /gonak      → snippets 포함
              └─ /jobworld   → 127.0.0.1:3100 (Docker nginx → frontend:3000 + backend:8000)
```

**NAT 주의**: 서버 내부에서 `curl http://211.198.54.207/...`은 NAT 루프 발생. 반드시 `curl http://localhost:PORT/...` 또는 `curl http://172.30.1.99/...` 사용.

## 운영 중인 서비스 (7개, 동일 서버)

| 서비스 | 내부 URL | 포트 | 방식 |
|--------|----------|------|------|
| contact | http://172.30.1.99/contact/ | static | nginx alias |
| matching | http://172.30.1.99/matching/ | 3001 | PM2 |
| hacker | http://172.30.1.99/hacker/ | 5000 | PM2 |
| agentmarket | http://172.30.1.99/agentmarket/ | 3000 | PM2 |
| fundmanager | http://172.30.1.99/fundmanager/ | 8000 | PM2 |
| gonak | http://172.30.1.99/gonak/ | snippets | nginx |
| **jobworld** | http://172.30.1.99/jobworld/ | **3100** | **Docker** |

외부 접속: `http://211.198.54.207/{서비스명}/`

**사용 중인 포트**: 3000, 3001, 3100, 5000, 8000. 새 서비스 추가 시 반드시 충돌 확인.

---

# 서버 안전 수칙 (최우선)

## 절대 금지

- **기존 서비스 중단 금지** — 어떤 작업이든 다른 서비스가 중단되면 안 됨
- **`sudo pm2` 사용 금지** — root PM2와 ubuntu PM2가 분리되어 포트 충돌 발생
- **호스트 nginx `restart` 금지** — `reload`만 사용
- **`/etc/nginx/sites-enabled/`에 `.bak` 파일 생성 금지** — nginx가 설정 파일로 인식
- **Docker nginx(jobworld-nginx)로 다른 서비스 설정 금지** — jobworld 전용
- **API 키 코드/설정 파일에 하드코딩 금지** — 환경변수로만 관리

## Nginx 설정 변경 시 필수 절차

```bash
# 1. 활성 설정 파일 확인 (sites-enabled/hydro가 실제 설정)
ls -la /etc/nginx/sites-enabled/

# 2. 백업 (sites-enabled 밖에서!)
sudo cp /etc/nginx/sites-enabled/hydro /etc/nginx/hydro.bak

# 3. 수정
sudo nano /etc/nginx/sites-enabled/hydro

# 4. 문법 검사 (필수!)
sudo nginx -t

# 5. 리로드 (restart 아님!)
sudo systemctl reload nginx
```

## 작업 후 서비스 상태 확인 (필수)

```bash
for path in contact matching hacker agentmarket fundmanager gonak jobworld; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://172.30.1.99/$path/)
  echo "$path → $code"
done
```

## PM2 관련

```bash
# 상태 확인
pm2 status

# 서비스 재시작 (ubuntu 사용자로만!)
pm2 restart <서비스명>

# 전체 죽었을 때
pm2 restart all

# 서버 재부팅 시 자동 실행 등록
pm2 save
pm2 startup   # 출력된 sudo 명령어 복사해서 실행
```

---

# JobWorld 프로젝트

## 구조

```
hydro/
├── jobworld/
│   ├── backend/          # FastAPI (Python 3.12)
│   │   └── app/
│   │       ├── api/      # 라우터 (search, jobs, auth, admin, worknet)
│   │       ├── models/   # SQLAlchemy ORM
│   │       └── services/ # 비즈니스 로직 (realtime_search, ai_search)
│   ├── frontend/         # Next.js 14 App Router (TypeScript + Tailwind)
│   │   └── src/
│   │       ├── app/      # 페이지 (search/, jobs/, login/, register/)
│   │       ├── components/ # Header.tsx
│   │       └── lib/      # api.ts (Axios), store.ts (Zustand)
│   ├── nginx/            # nginx.conf — /jobworld 서브패스 라우팅
│   ├── docker-compose.yml # nginx + frontend + backend + db + redis + elasticsearch
│   ├── server_setup.sh   # 초기 설치
│   ├── update.sh         # 코드 업데이트 + 재빌드
│   └── deploy.sh         # 빠른 재배포
├── host_nginx_setup.sh   # 호스트 nginx 설정
└── CLAUDE.md             # 이 파일
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14, App Router, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL, Redis, Elasticsearch |
| AI | Google GenAI SDK (Gemini), grounding 검색 |
| 배포 | Docker Compose (port 3100) + 호스트 Nginx 리버스 프록시 |
| basePath | `/jobworld` (Next.js + Nginx 모두 적용) |

## 배포

```bash
# 서버 접속
ssh -p 2222 ubuntu@172.30.1.99

# 코드 업데이트 + 재빌드
cd ~/hydro/jobworld
bash update.sh

# 개별 서비스만 재배포
bash deploy.sh backend    # 백엔드만
bash deploy.sh frontend   # 프론트엔드만
bash deploy.sh all        # 전체

# 로그 확인
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
```

## 환경 변수

- `.env` 파일: `~/hydro/jobworld/.env` (git 무시, 절대 커밋 금지)
- `GEMINI_API_KEY` 필수 — AI 검색 기능
- `POSTGRES_PASSWORD`, `SECRET_KEY` — 자동 생성됨 (server_setup.sh)

---

# 코딩 규칙

## 최우선 원칙

1. 정확성
2. 현재 프로젝트 구조와의 일관성
3. 최소 수정
4. 유지보수성
5. 보안
6. 성능

## 작업 순서 (항상 준수)

1. 요구사항 파악
2. 관련 파일 확인 (Read, Glob, Grep)
3. 기존 패턴 파악
4. 최소 수정 범위 결정
5. 계획 제시 → 구현 → 자체 검토

**절대 파일 확인 없이 추측으로 구현하지 않는다.**

## 구현 원칙

- 즉시 적용 가능한 완성형 코드만 작성
- 기존 프로젝트 패턴 최우선 재사용
- 불필요한 라이브러리 추가 금지
- 타입 안정성 보장 (TypeScript strict)
- 비동기 예외 처리 포함
- null/undefined/empty 상태 처리
- pseudo-code, 데모 코드, 반쪽짜리 구현 금지

## UI 원칙

- 심플하고 미니멀 — 과한 장식 금지
- Tailwind 유틸리티 클래스 기존 패턴 유지 (프로페셔널 블루 톤: #1a73e8)
- 반응형 기본
- Semantic HTML + 접근성

## 커밋

- 커밋 메시지 한국어
- 에러 발생 시 기존 서비스 영향도 먼저 확인

---

# 트러블슈팅 가이드

## 접속 오류 대응

| 증상 | 원인 | 해결 |
|------|------|------|
| 308 응답 | trailing slash / trailingSlash 설정 불일치 | `next.config.js`에 `trailingSlash: false` 확인 |
| 502 응답 | 백엔드 서비스 미실행 | `pm2 status` 또는 `docker compose ps` 확인 |
| 404 응답 | nginx location 블록 누락 또는 잘못된 설정 파일 편집 | `ls -la /etc/nginx/sites-enabled/` 확인 |
| CSS 깨짐 | basePath 미설정 또는 이중 적용 | `basePath`만 설정, `assetPrefix` 사용 금지 |
| 전체 서비스 죽음 | PM2 프로세스 죽음 | `pm2 restart all` → `pm2 save` |

## PM2 EADDRINUSE (포트 충돌)

```bash
ss -tlnp | grep <포트>          # 누가 점유 중인지 확인
pm2 delete <서비스명>            # 기존 프로세스 삭제
pm2 start ecosystem.config.js   # 재시작
```

## Docker (JobWorld)

```bash
# 컨테이너 상태
cd ~/hydro/jobworld
sudo docker compose ps

# 로그 확인
sudo docker compose logs backend --tail=50
sudo docker compose logs frontend --tail=50

# 전체 재빌드
sudo docker compose down
sudo docker compose up -d --build
```

## Nginx 진단

```bash
# 활성 설정 파일 확인
ls -la /etc/nginx/sites-enabled/

# 전체 설정 출력
sudo nginx -T 2>&1 | grep -E "server_name|location"

# 문법 검사
sudo nginx -t

# 특정 서비스 직접 테스트
curl -sI http://localhost:3100/jobworld/health
```

## 서비스 추가 시 체크리스트

1. `ss -tlnp`로 포트 충돌 확인
2. `next.config.js`에 `basePath` + `trailingSlash: false` 설정
3. `ls -la /etc/nginx/sites-enabled/`로 실제 활성 설정 파일 확인
4. 해당 파일에 location 블록 추가
5. `sudo nginx -t` → `sudo systemctl reload nginx`
6. 7개 서비스 전체 상태 확인 스크립트 실행

## 과거 실수 교훈

| 실수 | 교훈 |
|------|------|
| Docker nginx를 호스트 nginx 대신 수정 | 포트 80은 호스트 nginx 담당. `ls -la /etc/nginx/sites-enabled/` 먼저 확인 |
| `sudo pm2 start` 사용 | root PM2와 ubuntu PM2 분리됨. sudo 금지 |
| `sites-enabled/`에 `.bak` 파일 | nginx가 설정 파일로 인식. 백업은 다른 폴더에 |
| 서버 내부에서 외부 IP로 curl | NAT 루프 발생. `localhost` 또는 `172.30.1.99` 사용 |
| nginx `restart` 사용 | 전체 서비스 순간 중단. `reload` 사용 |
| `.next`만 삭제 후 빌드 | turbo 캐시가 복원됨. `.turbo`도 삭제 필요 |
| `output: 'standalone'` + pnpm 모노레포 | static 파일 복사 실패. 모노레포에서는 사용 금지 |
| `basePath` + `assetPrefix` 동시 사용 | CSS 경로 이중 적용. `basePath`만으로 충분 |
