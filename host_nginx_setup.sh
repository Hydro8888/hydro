#!/bin/bash
# ============================================================
# 호스트 nginx 설치 & 설정 스크립트
# 외부 포트 80 → 각 서비스 라우팅
# 실행: sudo bash host_nginx_setup.sh
# ============================================================
set -e

echo "================================================"
echo "  호스트 nginx 설치 및 외부 접속 설정"
echo "================================================"

# ── 1. nginx 설치 ──────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  echo "[1/4] nginx 설치 중..."
  apt-get update -qq
  apt-get install -y nginx
  systemctl enable nginx
else
  echo "[1/4] nginx 이미 설치됨: $(nginx -v 2>&1)"
fi

# ── 2. nginx 설정 작성 ────────────────────────────────────
echo "[2/4] nginx 설정 작성 중..."

cat > /etc/nginx/sites-available/hydro << 'NGINXEOF'
# ============================================================
# Hydro 멀티 서비스 리버스 프록시
# ============================================================

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # ── matching (port 3001) ───────────────────────────────
    location /matching {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ── jobworld (port 3100, Docker) ───────────────────────
    location /jobworld {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ── agentmarket (port 3000) ────────────────────────────
    location /agentmarket {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ── contact (static files) ─────────────────────────────
    location /contact {
        alias /home/ubuntu/contact;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # ── fundmanager (port 8000) ────────────────────────────
    location /fundmanager/ {
        proxy_pass http://127.0.0.1:8000/fundmanager/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ── hacker (port 5000) ────────────────────────────────
    location /hacker {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ── gonak (snippets) ──────────────────────────────────
    include snippets/gonak-proxy.conf;

    # 루트 접속 시 안내
    location = / {
        return 200 'Hydro Services OK';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# 기존 설정 비활성화, hydro 설정 활성화
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/multi-service
ln -sf /etc/nginx/sites-available/hydro /etc/nginx/sites-enabled/hydro

# ── 3. nginx 문법 검사 & 재시작 ────────────────────────────
echo "[3/4] nginx 설정 검사 및 재시작 중..."
nginx -t
systemctl restart nginx
systemctl status nginx --no-pager | grep -E "Active|Main"

# ── 4. 방화벽(UFW) 80포트 개방 ────────────────────────────
echo "[4/4] 방화벽 설정 중..."
if command -v ufw &>/dev/null; then
  ufw allow 'Nginx Full' 2>/dev/null || ufw allow 80/tcp
  ufw allow 22/tcp
  ufw --force enable
  ufw status
else
  echo "  UFW 없음 - iptables 직접 확인 필요"
  iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null && echo "  iptables: 80포트 개방" || true
fi

# ── 5. PM2 부팅 자동실행 등록 ──────────────────────────────
echo "[5/5] PM2 자동실행 등록 중..."
if command -v pm2 &>/dev/null; then
  pm2 save
  pm2 startup | tail -1 | bash || true
  echo "  PM2 startup 등록 완료"
else
  echo "  PM2 미설치 - 수동으로 설치 필요: npm install -g pm2"
fi

# ── 완료 ──────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  설정 완료!"
echo "================================================"

# 헬스체크 (localhost 기준 — 서버 내부에서 211.198.54.207은 NAT 루프로 불가)
echo ""
echo "헬스체크 중..."
for svc in jobworld contact matching hacker agentmarket fundmanager gonak; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost/${svc}/" 2>/dev/null || echo "ERR")
  echo "  /${svc}/ → HTTP ${code}"
done
