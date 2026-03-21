#!/bin/bash
# ============================================================
# 호스트 nginx 설치 & 설정 스크립트
# 외부 포트 80 → 각 서비스 Docker 내부 포트 라우팅
# 실행: sudo bash host_nginx_setup.sh
# ============================================================
set -e

echo "================================================"
echo "  호스트 nginx 설치 및 외부 접속 설정"
echo "================================================"

# ── 1. nginx 설치 ──────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  echo "[1/5] nginx 설치 중..."
  apt-get update -qq
  apt-get install -y nginx
  systemctl enable nginx
else
  echo "[1/5] nginx 이미 설치됨: $(nginx -v 2>&1)"
fi

# ── 2. 각 서비스 포트 감지 ─────────────────────────────────
echo "[2/5] 실행 중인 Docker 서비스 포트 감지 중..."

detect_port() {
  local name="$1"
  # docker ps 에서 컨테이너 이름(-nginx 포함)으로 호스트 포트 추출
  docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null \
    | grep "${name}" \
    | grep -oP '0\.0\.0\.0:\K[0-9]+(?=->80)' \
    | head -1
}

PORT_JOBWORLD=$(detect_port "jobworld")
PORT_CONTACT=$(detect_port "contact")
PORT_MATCHING=$(detect_port "matching")
PORT_HACKER=$(detect_port "hacker")
PORT_AGENTMARKET=$(detect_port "agentmarket")
PORT_FUNDMANAGER=$(detect_port "fundmanager")
PORT_GONAK=$(detect_port "gonak")

# 미감지 시 기본값
PORT_JOBWORLD="${PORT_JOBWORLD:-3100}"
PORT_CONTACT="${PORT_CONTACT:-3101}"
PORT_MATCHING="${PORT_MATCHING:-3102}"
PORT_HACKER="${PORT_HACKER:-3103}"
PORT_AGENTMARKET="${PORT_AGENTMARKET:-3104}"
PORT_FUNDMANAGER="${PORT_FUNDMANAGER:-3105}"
PORT_GONAK="${PORT_GONAK:-3106}"

echo "  감지된 포트:"
echo "    jobworld     → $PORT_JOBWORLD"
echo "    contact      → $PORT_CONTACT"
echo "    matching     → $PORT_MATCHING"
echo "    hacker       → $PORT_HACKER"
echo "    agentmarket  → $PORT_AGENTMARKET"
echo "    fundmanager  → $PORT_FUNDMANAGER"
echo "    gonak        → $PORT_GONAK"

# ── 3. nginx 설정 작성 ────────────────────────────────────
echo "[3/5] nginx 설정 작성 중..."

cat > /etc/nginx/sites-available/hydro << NGINXEOF
# ============================================================
# Hydro 멀티 서비스 리버스 프록시
# 자동 생성: $(date)
# ============================================================

# 업스트림 정의
upstream up_jobworld     { server 127.0.0.1:${PORT_JOBWORLD};     keepalive 16; }
upstream up_contact      { server 127.0.0.1:${PORT_CONTACT};      keepalive 16; }
upstream up_matching     { server 127.0.0.1:${PORT_MATCHING};     keepalive 16; }
upstream up_hacker       { server 127.0.0.1:${PORT_HACKER};       keepalive 16; }
upstream up_agentmarket  { server 127.0.0.1:${PORT_AGENTMARKET};  keepalive 16; }
upstream up_fundmanager  { server 127.0.0.1:${PORT_FUNDMANAGER};  keepalive 16; }
upstream up_gonak        { server 127.0.0.1:${PORT_GONAK};        keepalive 16; }

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 공통 프록시 헤더
    proxy_http_version 1.1;
    proxy_set_header   Host              \$host;
    proxy_set_header   X-Real-IP         \$remote_addr;
    proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \$scheme;
    proxy_set_header   Upgrade           \$http_upgrade;
    proxy_set_header   Connection        "upgrade";
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 60s;

    # ── jobworld ──────────────────────────────────────────
    location /jobworld/ {
        proxy_pass http://up_jobworld/jobworld/;
    }

    # ── contact ───────────────────────────────────────────
    location /contact/ {
        proxy_pass http://up_contact/contact/;
    }

    # ── matching ──────────────────────────────────────────
    location /matching/ {
        proxy_pass http://up_matching/matching/;
    }

    # ── hacker ────────────────────────────────────────────
    location /hacker/ {
        proxy_pass http://up_hacker/hacker/;
    }

    # ── agentmarket ───────────────────────────────────────
    location /agentmarket/ {
        proxy_pass http://up_agentmarket/agentmarket/;
    }

    # ── fundmanager ───────────────────────────────────────
    location /fundmanager/ {
        proxy_pass http://up_fundmanager/fundmanager/;
    }

    # ── gonak ─────────────────────────────────────────────
    location /gonak/ {
        proxy_pass http://up_gonak/gonak/;
    }

    # 루트 접속 시 안내
    location = / {
        return 200 'Hydro Services OK';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# 기본 설정 비활성화, hydro 설정 활성화
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/hydro /etc/nginx/sites-enabled/hydro

# ── 4. nginx 문법 검사 & 재시작 ────────────────────────────
echo "[4/5] nginx 설정 검사 및 재시작 중..."
nginx -t
systemctl restart nginx
systemctl status nginx --no-pager | grep -E "Active|Main"

# ── 5. 방화벽(UFW) 80포트 개방 ────────────────────────────
echo "[5/5] 방화벽 설정 중..."
if command -v ufw &>/dev/null; then
  ufw allow 'Nginx Full' 2>/dev/null || ufw allow 80/tcp
  ufw allow 22/tcp   # SSH 차단 방지
  ufw --force enable
  ufw status
else
  echo "  UFW 없음 - iptables 직접 확인 필요"
  iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null && echo "  iptables: 80포트 개방" || true
fi

# ── 완료 ──────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  설정 완료!"
echo ""
echo "  접속 확인:"
echo "    curl http://localhost/jobworld/"
echo "    curl http://localhost/contact/"
echo "    curl http://211.198.54.207/jobworld/"
echo "================================================"

# 각 서비스 헬스체크
echo ""
echo "헬스체크 중..."
for svc in jobworld contact matching hacker agentmarket fundmanager gonak; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost/${svc}/" 2>/dev/null || echo "ERR")
  echo "  /${svc}/ → HTTP ${code}"
done
