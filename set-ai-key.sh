#!/bin/bash
# =============================================================================
#  LiveNews — OpenAI API 키 입력 창
# -----------------------------------------------------------------------------
#  사용법:
#    cd /home/ubuntu/livenews && bash set-ai-key.sh          # 입력 창 → 확인 → 저장 → 재시작
#    bash set-ai-key.sh --check                              # 저장된 키로 연결 확인만
#    bash set-ai-key.sh --no-reload                          # 저장만 (redeploy.sh 가 사용)
#
#  - 키는 화면에 표시되지 않고, 명령 기록(history)·프로세스 목록에도 남지 않습니다.
#  - 저장 전에 OpenAI 에 직접 확인합니다: 키 유효성, 모델(gpt-6.1-terra) 권한, 크레딧.
#  - 프로젝트 폴더의 .env 에 OPENAI_API_KEY 로 저장합니다 (권한 600, git 에 올라가지 않음).
#  - 재시작은 livenews / livenews-collector 두 개만 합니다 (다른 PM2 서비스 영향 없음).
# =============================================================================

main() {
set -u

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
DEPLOY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DEPLOY_PATH/.env"
TITLE="LiveNews · OpenAI API 키"
ONLY_APPS="livenews,livenews-collector"

RELOAD=1; CHECK_ONLY=0
for arg in "$@"; do
    case "$arg" in
        --no-reload) RELOAD=0 ;;
        --check)     CHECK_ONLY=1 ;;
        -h|--help)   grep -E '^#( |$)' "${BASH_SOURCE[0]}" | head -16; return 0 ;;
        *) echo -e "${RED}알 수 없는 옵션: $arg${NC}"; return 1 ;;
    esac
done

cd "$DEPLOY_PATH" || return 1

# .env 값 읽기 (source 하지 않음 — 파일 안의 명령이 실행되지 않도록)
env_get() {
    [ -f "$ENV_FILE" ] || return 0
    grep -E "^[[:space:]]*(export[[:space:]]+)?$1=" "$ENV_FILE" | tail -1 \
        | sed -E "s/^[[:space:]]*(export[[:space:]]+)?$1=//; s/^[\"']//; s/[\"'][[:space:]]*$//"
}

MODEL="$(env_get OPENAI_MODEL)"; MODEL="${MODEL:-gpt-6.1-terra}"
BASE_URL="$(env_get OPENAI_BASE_URL)"; BASE_URL="${BASE_URL:-https://api.openai.com/v1}"; BASE_URL="${BASE_URL%/}"

VERIFY_TMP=$(mktemp); trap 'rm -f "$VERIFY_TMP"' EXIT

INTERACTIVE=0; [ -t 0 ] && [ -t 1 ] && INTERACTIVE=1
USE_WHIPTAIL=0; [ "$INTERACTIVE" = "1" ] && command -v whiptail >/dev/null 2>&1 && USE_WHIPTAIL=1

say() {   # 메시지 창 (또는 터미널 출력)
    if [ "$USE_WHIPTAIL" = "1" ]; then whiptail --title "$TITLE" --msgbox "$1" 14 74; else echo -e "$1"; fi
}

ask_key() {
    local key=""
    if [ "$USE_WHIPTAIL" = "1" ]; then
        key=$(whiptail --title "$TITLE" --passwordbox \
"OpenAI API 키를 붙여넣고 Enter 를 누르세요.

· 발급: platform.openai.com → API keys  (sk- 로 시작)
· 입력한 키는 화면에 표시되지 않습니다.
· 사용 모델: $MODEL" 14 74 3>&1 1>&2 2>&3) || return 1
    elif [ "$INTERACTIVE" = "1" ]; then
        read -rsp "OpenAI API 키 (sk-…, 화면에 표시되지 않음): " key || return 1; echo
    else
        IFS= read -r key || return 1
    fi
    printf '%s' "${key//[[:space:]]/}"
}

mask() { local k="$1"; printf '%s…%s' "${k:0:7}" "${k: -4}"; }

# OpenAI 에 실제로 확인. 결과: VERIFY_STATUS = ok | bad_key | no_model | no_credit | network | unknown
VERIFY_STATUS="unknown"; VERIFY_DETAIL=""
verify_key() {
    local key="$1" tmp="$VERIFY_TMP" code
    # 키는 stdin 으로 헤더를 넘겨 프로세스 목록(ps)에 노출되지 않게 함
    code=$(printf 'Authorization: Bearer %s\n' "$key" | curl -sS -o "$tmp" -w '%{http_code}' --max-time 20 -H @- "$BASE_URL/models/$MODEL" 2>/dev/null || true)
    case "$code" in
        200) ;;
        401) VERIFY_STATUS="bad_key"; VERIFY_DETAIL="키가 올바르지 않습니다 (401)"; return ;;
        403|404) VERIFY_STATUS="no_model"; VERIFY_DETAIL="이 키로는 모델 $MODEL 을 쓸 수 없습니다 (HTTP $code)"; return ;;
        000|"") VERIFY_STATUS="network"; VERIFY_DETAIL="OpenAI 서버에 연결하지 못했습니다 ($BASE_URL)"; return ;;
        *) VERIFY_STATUS="unknown"; VERIFY_DETAIL="모델 확인 응답 HTTP $code"; return ;;
    esac
    # 아주 짧은 실제 요청 1회로 크레딧까지 확인 (비용은 거의 0)
    code=$(printf 'Authorization: Bearer %s\nContent-Type: application/json\n' "$key" | curl -sS -o "$tmp" -w '%{http_code}' --max-time 30 -H @- \
        -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_completion_tokens\":16,\"reasoning_effort\":\"none\"}" \
        "$BASE_URL/chat/completions" 2>/dev/null || true)
    if [ "$code" = "200" ]; then VERIFY_STATUS="ok"; VERIFY_DETAIL="키·모델·크레딧 모두 정상"; return; fi
    if grep -qiE 'insufficient_quota|exceeded your current quota|billing' "$tmp" 2>/dev/null; then
        VERIFY_STATUS="no_credit"; VERIFY_DETAIL="키는 정상이지만 크레딧이 없습니다 (Billing 에서 충전 필요)"; return
    fi
    if [ "$code" = "400" ]; then VERIFY_STATUS="ok"; VERIFY_DETAIL="키·모델 정상 (요청 형식은 프로그램이 자동으로 맞춥니다)"; return; fi
    VERIFY_STATUS="unknown"; VERIFY_DETAIL="테스트 요청 응답 HTTP $code"
}

if [ "$CHECK_ONLY" = "1" ]; then
    KEY="$(env_get OPENAI_API_KEY)"
    if [ -z "$KEY" ]; then echo -e "${RED}.env 에 OPENAI_API_KEY 가 없습니다. 실행: bash set-ai-key.sh${NC}"; return 1; fi
    verify_key "$KEY"
    echo -e "키 $(mask "$KEY") / 모델 $MODEL → ${VERIFY_STATUS}: ${VERIFY_DETAIL}"
    [ "$VERIFY_STATUS" = "ok" ]; return $?
fi

# ---- 1. 키 입력 (최대 3회) ----
KEY=""
for attempt in 1 2 3; do
    KEY="$(ask_key)" || { echo -e "${YELLOW}입력을 취소했습니다. 아무것도 바뀌지 않았습니다.${NC}"; return 1; }
    if ! [[ "$KEY" =~ ^sk-[A-Za-z0-9_-]{20,}$ ]]; then
        say "키 형식이 아닙니다. OpenAI API 키는 sk- 로 시작합니다.\n다시 입력해 주세요. ($attempt/3)"
        KEY=""; continue
    fi
    echo -e "${BLUE}OpenAI 에 키를 확인하는 중...${NC}"
    verify_key "$KEY"
    if [ "$VERIFY_STATUS" = "bad_key" ]; then
        say "$VERIFY_DETAIL\n키를 다시 확인해 주세요. ($attempt/3)"
        KEY=""; continue
    fi
    break
done
if [ -z "$KEY" ]; then echo -e "${RED}올바른 키를 입력하지 못해 저장하지 않았습니다.${NC}"; return 1; fi

case "$VERIFY_STATUS" in
    ok)        say "확인 완료: $VERIFY_DETAIL\n\n키: $(mask "$KEY")\n모델: $MODEL" ;;
    no_credit) say "주의: $VERIFY_DETAIL\nhttps://platform.openai.com/settings/organization/billing\n\n키는 저장합니다. 충전하면 바로 번역이 시작됩니다." ;;
    *)         say "주의: $VERIFY_DETAIL\n\n키는 저장합니다. 나중에 확인: bash set-ai-key.sh --check" ;;
esac

# ---- 2. AI 이미지 생성 사용 여부 (기본: 사용 안 함) ----
IMAGE_GEN="$(env_get OPENAI_IMAGE_GENERATION)"; IMAGE_GEN="${IMAGE_GEN:-false}"
if [ "$USE_WHIPTAIL" = "1" ]; then
    DEFAULT_FLAG="--defaultno"; [ "$IMAGE_GEN" = "true" ] && DEFAULT_FLAG=""
    if whiptail --title "$TITLE" $DEFAULT_FLAG --yesno \
"사진이 없는 기사에 AI 이미지를 생성할까요?

· 기사 1건마다 이미지 비용이 듭니다.
· 사용하지 않아도 카테고리 대표 사진이 대신 표시됩니다.
· 나중에 .env 의 OPENAI_IMAGE_GENERATION 으로 바꿀 수 있습니다." 14 74; then
        IMAGE_GEN=true
    else
        IMAGE_GEN=false
    fi
fi

# ---- 3. .env 저장 (원자적 교체, 권한 600) ----
umask 077
[ -f "$ENV_FILE" ] && cp -p "$ENV_FILE" "$DEPLOY_PATH/.env.backup" && chmod 600 "$DEPLOY_PATH/.env.backup"
TMP_ENV=$(mktemp "$DEPLOY_PATH/.env.tmp.XXXXXX")
if [ -f "$ENV_FILE" ]; then
    grep -vE '^[[:space:]]*(export[[:space:]]+)?(OPENAI_API_KEY|OPENAI_IMAGE_GENERATION)=' "$ENV_FILE" > "$TMP_ENV" || true
fi
[ -s "$TMP_ENV" ] && [ -n "$(tail -c1 "$TMP_ENV")" ] && echo >> "$TMP_ENV"
grep -qE '^[[:space:]]*# OpenAI API' "$TMP_ENV" || printf '\n# OpenAI API (bash set-ai-key.sh 로 설정)\n' >> "$TMP_ENV"
printf 'OPENAI_API_KEY="%s"\n' "$KEY" >> "$TMP_ENV"
grep -qE '^[[:space:]]*(export[[:space:]]+)?OPENAI_MODEL=' "$TMP_ENV" || printf 'OPENAI_MODEL="%s"\n' "$MODEL" >> "$TMP_ENV"
printf 'OPENAI_IMAGE_GENERATION=%s\n' "$IMAGE_GEN" >> "$TMP_ENV"
chmod 600 "$TMP_ENV"
mv -f "$TMP_ENV" "$ENV_FILE"
unset KEY
echo -e "${GREEN}저장 완료: $ENV_FILE (OPENAI_API_KEY, 모델 $MODEL, 이미지 생성 $IMAGE_GEN)${NC}"

# ---- 4. livenews 앱만 재시작 ----
if [ "$RELOAD" = "0" ]; then return 0; fi
if ! command -v pm2 >/dev/null 2>&1; then
    export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}pm2 를 찾지 못했습니다. 적용하려면: pm2 startOrReload ecosystem.config.js --only $ONLY_APPS --update-env${NC}"
    return 0
fi
OTHER_APPS=$(grep -oE "name:\s*'[^']+'" ecosystem.config.js | grep -v "livenews" || true)
if [ -n "$OTHER_APPS" ]; then
    echo -e "${RED}ecosystem.config.js 에 livenews 외 앱이 있어 재시작을 생략합니다. 수동으로 적용하세요.${NC}"
    return 0
fi
echo -e "${BLUE}livenews / livenews-collector 재시작 (다른 서비스는 그대로)...${NC}"
pm2 startOrReload ecosystem.config.js --only "$ONLY_APPS" --update-env
echo -e "${GREEN}완료. 번역 상태 확인: curl -s http://localhost:4000/livenews/api/admin/health${NC}"
}

main "$@"
exit $?
