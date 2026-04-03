#!/bin/bash
set -e

#=============================================================================
# AI Portal Pro - 서버 로컬 배포 스크립트
# 서버에서 직접 실행: sudo bash deploy.sh
# 접속: http://211.198.54.207/freeai/
# 포트: 3010 (PM2 관리)
#=============================================================================

SERVER_IP="211.198.54.207"
DEPLOY_DIR="/home/ubuntu/freeai"
APP_PORT="3010"
APP_NAME="freeai"
BRANCH="claude/ai-portal-dev-plan-yI3Gd"
REPO_SSH="git@github.com:Hydro8888/hydro.git"
REAL_USER="${SUDO_USER:-$(whoami)}"
REAL_HOME=$(eval echo "~${REAL_USER}")
NGINX_CONTAINER="jobworld-nginx"

# xAI API Key (환경 변수에서 가져오거나 실행 시 입력)
if [ -z "${XAI_API_KEY}" ]; then
  read -p "xAI API Key를 입력하세요: " XAI_API_KEY
fi
if [ -z "${XAI_API_KEY}" ]; then
  echo "오류: XAI_API_KEY가 설정되지 않았습니다."
  echo "사용법: XAI_API_KEY=your-key-here sudo bash deploy.sh"
  exit 1
fi

echo "============================================"
echo "  AI Portal Pro 로컬 배포 시작"
echo "  경로: /freeai/"
echo "  포트: ${APP_PORT}"
echo "============================================"

echo ""
echo "=== [1/9] Node.js / pnpm / PM2 확인 ==="
if ! command -v node &> /dev/null; then
  echo "Node.js 설치 중..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v)"

if ! command -v pnpm &> /dev/null; then
  echo "pnpm 설치 중..."
  npm install -g pnpm@9
fi
echo "pnpm: $(pnpm -v)"

if ! command -v pm2 &> /dev/null; then
  echo "PM2 설치 중..."
  npm install -g pm2
fi
echo "PM2: $(pm2 -v)"

echo ""
echo "=== [2/9] 소스 코드 클론/업데이트 ==="
# sudo 실행 시 원래 사용자의 SSH 키를 사용
# SSH 키 자동 탐색 (id_ed25519 우선, 없으면 id_rsa)
if [ -f "${REAL_HOME}/.ssh/id_ed25519" ]; then
  SSH_KEY="${REAL_HOME}/.ssh/id_ed25519"
elif [ -f "${REAL_HOME}/.ssh/id_rsa" ]; then
  SSH_KEY="${REAL_HOME}/.ssh/id_rsa"
else
  echo "오류: SSH 키를 찾을 수 없습니다 (${REAL_HOME}/.ssh/)"
  exit 1
fi
GIT_SSH_CMD="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no"
if [ -d "${DEPLOY_DIR}/.git" ]; then
  echo "기존 디렉토리 존재 - git pull..."
  cd ${DEPLOY_DIR}
  GIT_SSH_COMMAND="${GIT_SSH_CMD}" git fetch origin
  git checkout ${BRANCH}
  GIT_SSH_COMMAND="${GIT_SSH_CMD}" git pull origin ${BRANCH}
else
  echo "새로 클론..."
  GIT_SSH_COMMAND="${GIT_SSH_CMD}" git clone ${REPO_SSH} ${DEPLOY_DIR}
  cd ${DEPLOY_DIR}
  git checkout ${BRANCH}
fi

echo ""
echo "=== [3/9] .env 파일 생성 ==="
cat > ${DEPLOY_DIR}/apps/web/.env.local << EOF
# AI Portal Pro - Production Environment
NODE_ENV=production

# xAI (Grok) - 활성 모델
XAI_API_KEY=${XAI_API_KEY}

# 나머지 키는 비워둠 (해당 모델 비활성)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
TOGETHER_API_KEY=
COHERE_API_KEY=
MISTRAL_API_KEY=
AI21_API_KEY=
PERPLEXITY_API_KEY=

# Clerk (비활성 - 인증 없이 운영)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe (비활성)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF
echo ".env.local 생성 완료"

echo ""
echo "=== [4/9] 의존성 설치 ==="
cd ${DEPLOY_DIR}
pnpm install --no-frozen-lockfile

echo ""
echo "=== [5/9] 프로덕션 빌드 ==="
cd ${DEPLOY_DIR}
pnpm build

# standalone 빌드에 static 파일 복사 (CSS/JS 포함 — 필수!)
echo "static 파일 복사 중..."
STANDALONE_DIR="${DEPLOY_DIR}/apps/web/.next/standalone/apps/web"
mkdir -p "${STANDALONE_DIR}/.next"
mkdir -p "${STANDALONE_DIR}/public"
cp -r ${DEPLOY_DIR}/apps/web/.next/static "${STANDALONE_DIR}/.next/static"
CSS_COUNT=$(find "${STANDALONE_DIR}/.next/static" -name '*.css' 2>/dev/null | wc -l)
JS_COUNT=$(find "${STANDALONE_DIR}/.next/static" -name '*.js' 2>/dev/null | wc -l)
echo "✓ .next/static 복사 완료 (CSS: ${CSS_COUNT}개, JS: ${JS_COUNT}개)"
if [ "${CSS_COUNT}" -eq 0 ]; then
  echo "⚠ 경고: CSS 파일이 없습니다! 빌드가 올바른지 확인하세요."
fi
cp -r ${DEPLOY_DIR}/apps/web/public/* "${STANDALONE_DIR}/public/" 2>/dev/null && echo "✓ public 파일 복사 완료" || echo "⚠ public 폴더가 비어있음 (무시 가능)"

echo ""
echo "=== [6/9] PM2 프로세스 시작/재시작 ==="
cd ${DEPLOY_DIR}

if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
  echo "기존 프로세스 재시작..."
  pm2 restart ${APP_NAME}
else
  echo "새 프로세스 시작..."
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo ""
echo "=== [7/9] 앱 시작 대기 (5초) ==="
sleep 5

# 앱 상태 확인
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${APP_PORT}/freeai/ | grep -q "200\|301\|302\|304"; then
  echo "앱이 포트 ${APP_PORT}에서 정상 실행 중!"
else
  echo "경고: 앱 응답 확인 실패. PM2 로그 확인: pm2 logs ${APP_NAME}"
fi

echo ""
echo "=== [8/9] iptables 방화벽 규칙 추가 ==="
# Docker에서 호스트 포트 접근 허용
if ! iptables -C DOCKER-USER -p tcp -s 172.17.0.0/16 --dport ${APP_PORT} -j ACCEPT 2>/dev/null; then
  iptables -I DOCKER-USER -p tcp -s 172.17.0.0/16 --dport ${APP_PORT} -j ACCEPT
  echo "iptables 규칙 추가: 172.17.0.0/16 → ${APP_PORT}"
else
  echo "iptables 규칙 이미 존재: 172.17.0.0/16 → ${APP_PORT}"
fi

if ! iptables -C DOCKER-USER -p tcp -s 172.18.0.0/16 --dport ${APP_PORT} -j ACCEPT 2>/dev/null; then
  iptables -I DOCKER-USER -p tcp -s 172.18.0.0/16 --dport ${APP_PORT} -j ACCEPT
  echo "iptables 규칙 추가: 172.18.0.0/16 → ${APP_PORT}"
else
  echo "iptables 규칙 이미 존재: 172.18.0.0/16 → ${APP_PORT}"
fi

echo ""
echo "=== [9/9] Docker nginx 설정 업데이트 ==="

# nginx 설정 파일 위치 확인
NGINX_CONF=""
for conf_path in \
  "/etc/nginx/conf.d/default.conf" \
  "/etc/nginx/nginx.conf" \
  "/etc/nginx/sites-enabled/default"; do
  if docker exec ${NGINX_CONTAINER} test -f ${conf_path} 2>/dev/null; then
    NGINX_CONF=${conf_path}
    break
  fi
done

if [ -z "${NGINX_CONF}" ]; then
  echo "경고: nginx 설정 파일을 찾을 수 없습니다. 수동 설정이 필요합니다."
  echo "Docker 컨테이너 내부 nginx 설정에 아래 location 블록을 추가하세요:"
  echo ""
  echo '  location /freeai/ {'
  echo "      proxy_pass http://172.17.0.1:${APP_PORT}/freeai/;"
  echo '      proxy_http_version 1.1;'
  echo '      proxy_set_header Upgrade $http_upgrade;'
  echo "      proxy_set_header Connection 'upgrade';"
  echo '      proxy_set_header Host $host;'
  echo '      proxy_set_header X-Real-IP $remote_addr;'
  echo '      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
  echo '      proxy_set_header X-Forwarded-Proto $scheme;'
  echo '      proxy_cache_bypass $http_upgrade;'
  echo '  }'
else
  echo "nginx 설정 파일: ${NGINX_CONF}"

  # freeai location 블록이 이미 있는지 확인
  if docker exec ${NGINX_CONTAINER} grep -q "location /freeai/" ${NGINX_CONF} 2>/dev/null; then
    echo "freeai location 블록이 이미 존재합니다."
  else
    echo "freeai location 블록 추가 중..."

    # 임시 nginx 설정 파일 생성
    cat > /tmp/freeai-nginx.conf << 'NGINX_BLOCK'

    # AI Portal Pro
    location /freeai/ {
        proxy_pass http://172.17.0.1:3010/freeai/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /freeai/_next/ {
        proxy_pass http://172.17.0.1:3010/freeai/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
NGINX_BLOCK

    # 기존 nginx 설정을 컨테이너에서 복사
    docker exec ${NGINX_CONTAINER} cat ${NGINX_CONF} > /tmp/nginx-original.conf

    # 마지막 닫는 중괄호 } 앞에 location 블록 삽입
    sed -i "/^}$/r /tmp/freeai-nginx.conf" /tmp/nginx-original.conf

    # 수정된 설정을 컨테이너에 복사
    docker cp /tmp/nginx-original.conf ${NGINX_CONTAINER}:${NGINX_CONF}

    # nginx 설정 테스트 및 리로드
    if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
      docker exec ${NGINX_CONTAINER} nginx -s reload
      echo "nginx 설정 업데이트 및 리로드 완료!"
    else
      echo "경고: nginx 설정 오류! 수동으로 확인하세요."
      echo "docker exec ${NGINX_CONTAINER} nginx -t"
    fi

    # 임시 파일 정리
    rm -f /tmp/freeai-nginx.conf /tmp/nginx-original.conf
  fi
fi

echo ""
echo "============================================"
echo "  배포 완료!"
echo "============================================"
echo ""
echo "  PM2 상태:    pm2 status"
echo "  PM2 로그:    pm2 logs ${APP_NAME}"
echo "  로컬 접속:   http://localhost:${APP_PORT}/freeai/"
echo "  외부 접속:   http://${SERVER_IP}/freeai/"
echo ""
pm2 status
