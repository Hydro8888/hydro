#!/bin/bash
# JobWorld 서버 최초 설치 및 배포 스크립트
# 실행: bash server_setup.sh
set -e

echo "================================================"
echo "  JobWorld 서버 설치 및 배포"
echo "================================================"

# 1. Docker 설치 확인
if ! command -v docker &> /dev/null; then
  echo "[1/6] Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker 설치 완료. 재로그인 후 다시 실행하세요."
  exit 0
else
  echo "[1/6] Docker 이미 설치됨: $(docker --version)"
fi

# 2. Docker Compose 플러그인 확인
if ! sudo docker compose version &> /dev/null 2>&1; then
  echo "[2/6] Docker Compose 설치 중..."
  sudo apt-get update -qq
  sudo apt-get install -y docker-compose-plugin
else
  echo "[2/6] Docker Compose 이미 설치됨: $(sudo docker compose version)"
fi

# 3. 코드 클론/업데이트
REPO_URL="https://github.com/Hydro8888/hydro.git"
BRANCH="claude/ai-job-platform-GXCLo"

echo "[3/6] 코드 준비 중..."
if [ ! -d "/home/ubuntu/hydro" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" /home/ubuntu/hydro
  echo "  레포지토리 클론 완료"
else
  cd /home/ubuntu/hydro
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  echo "  레포지토리 업데이트 완료"
fi

cd /home/ubuntu/hydro/jobworld

# 4. .env 파일 설정
echo "[4/6] 환경 변수 설정..."
if [ ! -f .env ]; then
  POSTGRES_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
  cat > .env << ENVEOF
POSTGRES_PASSWORD=${POSTGRES_PASS}
SECRET_KEY=${SECRET}
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ENVEOF
  echo "  .env 파일 생성 완료"
else
  echo "  .env 파일 이미 존재 - 건너뜀"
fi

# 5. nginx HTTP 전용 설정 생성
echo "[5/6] Docker 컨테이너 빌드 및 실행 중..."
mkdir -p nginx/ssl

cat > nginx/nginx.conf << 'NGINXEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;

    upstream frontend { server frontend:3000; }
    upstream backend  { server backend:8000; }

    server {
        listen 80 default_server;
        server_name _;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 60s;
        }

        location /health {
            proxy_pass http://backend/health;
        }
    }
}
NGINXEOF

sudo docker compose down --remove-orphans 2>/dev/null || true
sudo docker compose up -d --build

echo "[6/6] 배포 완료 확인 중..."
sleep 15

sudo docker compose ps

for i in 1 2 3 4 5; do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo ""
    echo "================================================"
    echo "  배포 성공!"
    echo "  서비스 주소: http://211.198.54.207"
    echo "  API 주소:   http://211.198.54.207/api/v1"
    echo "================================================"
    exit 0
  fi
  echo "  헬스체크 대기 중... ($i/5)"
  sleep 5
done

echo ""
echo "헬스체크 실패 - 로그 확인:"
sudo docker compose logs --tail=30
