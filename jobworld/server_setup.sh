#!/bin/bash
# JobWorld 서버 최초 설치 및 배포 스크립트
# 실행: bash server_setup.sh
set -e

# sudo 없이 docker 사용 가능한지 확인, 불가하면 sudo 사용
if docker info &>/dev/null 2>&1; then
  DOCKER="docker"
else
  DOCKER="sudo docker"
  echo "[권한] sudo로 docker 실행합니다."
fi

echo "================================================"
echo "  JobWorld 서버 설치 및 배포"
echo "================================================"

# 1. Docker 설치 확인
if ! command -v docker &> /dev/null; then
  echo "[1/6] Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker 설치 완료. 그룹 반영을 위해 재로그인 후 다시 실행하세요."
  exit 0
else
  echo "[1/6] Docker 이미 설치됨: $(docker --version)"
  # docker 그룹 추가 (이미 설치된 경우에도 권한 부여)
  sudo usermod -aG docker $USER 2>/dev/null || true
fi

# 2. Docker Compose 플러그인 확인
if ! $DOCKER compose version &> /dev/null 2>&1; then
  echo "[2/6] Docker Compose 설치 중..."
  sudo apt-get update -qq
  sudo apt-get install -y docker-compose-plugin
else
  echo "[2/6] Docker Compose 이미 설치됨: $($DOCKER compose version)"
fi

# 3. 코드 클론/업데이트
DEPLOY_DIR="/home/ubuntu/jobworld"
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
  cat > .env << ENVEOF
# Database
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# JWT
SECRET_KEY=$(openssl rand -base64 48)
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# AI API (선택사항 - 없으면 기본 요약 사용)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# CORS
CORS_ORIGINS=["http://211.198.54.207","https://jobworld.co.kr"]
ENVEOF
  echo "  .env 파일 생성 완료 (비밀번호 자동 생성)"
  echo "  AI 기능을 위해 .env 에 ANTHROPIC_API_KEY 또는 OPENAI_API_KEY를 추가하세요"
else
  echo "  .env 파일 이미 존재 - 건너뜀"
fi

# 5. SSL 디렉토리 생성 (nginx가 시작되도록)
mkdir -p nginx/ssl

# 6. 임시 nginx 설정 생성 (SSL 없이 HTTP만)
cat > nginx/nginx-http.conf << 'NGINXEOF'
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

# docker-compose.yml을 HTTP 전용으로 수정하여 실행
echo "[5/6] Docker 컨테이너 빌드 및 실행 중..."
# nginx 설정을 HTTP 전용으로 교체 후 실행
cp nginx/nginx.conf nginx/nginx.conf.ssl.bak
cp nginx/nginx-http.conf nginx/nginx.conf

$DOCKER compose down --remove-orphans 2>/dev/null || true
$DOCKER compose up -d --build

echo "[6/6] 배포 완료 확인 중..."
sleep 15

# 상태 확인
$DOCKER compose ps

# 헬스체크
for i in 1 2 3 4 5; do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo ""
    echo "================================================"
    echo "  배포 성공!"
    echo "  서비스 주소: http://211.198.54.207"
    echo "  API 문서: http://211.198.54.207/api/docs"
    echo "================================================"
    break
  fi
  echo "  헬스체크 대기 중... ($i/5)"
  sleep 5
done

echo ""
echo "로그 확인: docker compose -f /home/ubuntu/hydro/jobworld/docker-compose.yml logs -f"
echo ""
echo "HTTPS 설정 (도메인 연결 후):"
echo "  sudo apt install -y certbot"
echo "  sudo certbot certonly --standalone -d jobworld.co.kr"
echo "  sudo cp /etc/letsencrypt/live/jobworld.co.kr/fullchain.pem nginx/ssl/"
echo "  sudo cp /etc/letsencrypt/live/jobworld.co.kr/privkey.pem nginx/ssl/"
echo "  cp nginx/nginx.conf.ssl.bak nginx/nginx.conf"
echo "  docker compose restart nginx"
