#!/bin/bash
# JobWorld Deployment Script
set -e

echo "=== JobWorld 배포 시작 ==="

# 1. .env 파일 확인
if [ ! -f .env ]; then
  echo "[!] .env 파일이 없습니다. .env.example을 복사하고 값을 설정해주세요."
  cp .env.example .env
  echo "    .env 파일이 생성되었습니다. 설정 후 다시 실행해주세요."
  exit 1
fi

# 2. SSL 인증서 디렉토리 생성
mkdir -p nginx/ssl

# 3. Docker 이미지 빌드 및 실행
echo "[1/3] Docker 컨테이너 빌드 중..."
docker compose build --no-cache

echo "[2/3] 컨테이너 실행 중..."
docker compose up -d

echo "[3/3] 상태 확인..."
sleep 5
docker compose ps

echo ""
echo "=== 배포 완료 ==="
echo "  로컬: http://localhost"
echo "  운영: https://jobworld.co.kr"
echo ""
echo "SSL 인증서 발급 (최초 1회):"
echo "  docker run --rm -v ./nginx/ssl:/etc/letsencrypt certbot/certbot certonly \\"
echo "    --standalone -d jobworld.co.kr -d www.jobworld.co.kr --email admin@jobworld.co.kr --agree-tos"
