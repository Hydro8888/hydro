# S1 디자인 시스템 개선 설계서 — Round 5 (결함 수정 라운드)

> **근거 문서**: `QA_BASELINE-R5.md`(결함 D1~D25) + 이번 Planner 실측(아래 "실측 요약", 도구는 스크래치패드에 보존).
> **라운드 규칙**: 결함 수정 전용. 신규 기능·AI 기능·근거 없는 디자인 변경 금지(planner.md 원칙 2 "AI 기능" 이번 라운드 미적용).
> 모든 항목은 결함 ID 또는 `파일:라인` 근거에 연결된다. DB 스키마 변경 없음. 기존 export 이름·시그니처 하위 호환 유지.
> **사용자 요청**: "전체적으로 뉴스 번역이 잘 안되고 있고 화면이 깨지는 게 있어 모두 점검하고 수정하고 테스트까지 완료해줘"
> S1은 이 중 **화면 깨짐의 디자인 시스템 원인**과 **뒤 슬라이스가 쓸 공용 유틸·테스트 기반**을 담당한다.

```
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad   # 이하 모든 명령의 $SP
```

---

## 현재 상태 분석

### 장점 (유지)
- 다크 모던 토큰 체계가 정착됨: `surface`(#0d1117/#161b22/#21262d), `text`(#e6edf3/#8b949e/#6e7681), `accent`(#f0883e/#58a6ff/#f85149/#3fb950), `border`(#30363d/#21262d), Pretendard, 타이포 스케일(`headline-*`, `body-*`, `caption`, `overline`). `tailwind.config.ts:17-57`
- 그리드는 모두 Tailwind `grid-cols-N` = `repeat(N, minmax(0,1fr))`(빌드 CSS로 확인) → 그리드 트랙이 min-content로 부풀지 않는 구조.
- Pretendard 원격 `@import`는 빌드 CSS 0바이트 위치에 있어 유효함(결함 아님, 손대지 말 것).
- reduced-motion 대응, 이미지 URL 정규화/로고 차단 유틸, `cn`/`getCategoryStyle` 등 헬퍼가 한 곳에 모여 있음.

### 결함 (근거)

| ID | 심각도 | 증상 | 근거 |
|---|---|---|---|
| **D1** | 높음 | Unsplash 대체 사진 60개 중 6개 404 → 이미지 없는 기사 중 6개 카테고리의 1/4이 깨진 이미지 | `utils.ts:213,215,217,218,225,227`. Planner 재측정: `curl -I` 결과 정확히 같은 6개 404, 교체 후보 6개 모두 200 |
| **S1-A (신규)** | 높음 | **카테고리 색 체계 전체가 렌더링되지 않음.** 모든 카테고리 배지가 투명 배경·본문색 글자·**라이트 테마 기본 테두리 #e5e7eb**(다크 화면에 밝은 회색 선) | `tailwind.config.ts:4-8` `content`에 `src/lib/**` 없음 → `constants.ts:87-104`의 클래스 문자열이 Tailwind 스캔 대상이 아님. 빌드 CSS에 카테고리 색 클래스 **64개 중 63개 없음**(`text-amber-400`만 타 파일 사용으로 존재). 실측: 페이지당 배지 20~30개 전부 `color: rgb(230,237,243)`, `background: transparent`, `border-left-color: rgb(229,231,235)`. 기사 상세 배지는 `article/[id]/page.tsx:106`의 `.replace('border-l-','border-')`로 만든 `border-blue-500` 등이 **어디에도 리터럴로 없어** 영구 미생성(0/16). 발생 시점: 커밋 `3ce8104`(2026-04-03, 카드의 인라인 색 맵을 `getCategoryStyle()`로 중앙화) 이후 6개월간 잠복 |
| **D6** | 높음 | 공백 없는 긴 문자열이 박스를 넘침. PC 2305px/1440, 태블릿 2033/768, 모바일 레이아웃 뷰포트 1500px(최소 배율 0.25 한도까지 확대 → 전체 축소). h1은 모든 화면 40px 고정 | `globals.css:10-13`에 줄바꿈 규칙 없음. `tailwind.config.ts:49` `headline-xl` 2.5rem 고정. 모바일 장문 제목 h1 높이 1150px. 한국어가 음절 단위로 잘림("테스/트", "수출/입", "배터/리") |
| **D7** | 중간 | 날짜가 서버 TZ·ICU 의존, 잘못된 입력에 "Invalid Date" 노출, 미래 시각에 "방금 전", 하이드레이션 불일치 | `utils.ts:136-156`. Planner 실측: `formatDate('2026-10-01T08:03:00Z')` → TZ=UTC `"2026. 10. 01. AM 08:03"` / TZ=Asia/Seoul `"2026. 10. 01. PM 05:03"`(한국어 UI에 AM/PM). `timeAgo('2026-09-01T20:30:00Z')` → UTC `"2026년 9월 1일"` / KST `"2026년 9월 2일"` → 클라이언트 카드(`NewsCard.tsx:53`, `NewsCardLarge.tsx:62`)에서 **결정적 하이드레이션 불일치**. 기준선 감사에서 실제 발생: `[tablet] art-chinese` React #425(텍스트 불일치) + #422(루트 전체 클라이언트 재렌더). `formatDate('garbage')`/`timeAgo('garbage')` → `"Invalid Date"`, `timeAgo(now+5h)` → `"방금 전"` |
| **D8** | 중간 | `?page=abc` → Prisma 에러, 과대값도 에러. **API에도 동일 결함** | 페이지: `breaking/page.tsx:19`, `[country]/page.tsx:47`, `category/[slug]/page.tsx:28`, `search/page.tsx:44`의 `parseInt` → NaN. API: `api/search/route.ts:12-13`, `api/articles/route.ts:12-13`, `api/admin/logs/route.ts:9-10`의 `Math.max(1, parseInt('abc'))` = **NaN**. Planner 실측: `/api/search?page=abc`, `…&limit=abc`, `…&page=99999999999999999999`, `/api/admin/logs?page=abc` 모두 **HTTP 500** → `/search?page=abc`가 거짓 "검색 중 오류" 표시 |
| **D2/D3 (S3 기반)** | 높음 | 최종(무네트워크) 대체 수단 없음, 하이드레이션 전 실패 이미지 복구 불가 | 이미지 소스 결정 로직이 3곳에 복제(`NewsCard.tsx:16-18`, `NewsCardLarge.tsx:16-18`, `article/[id]/page.tsx:97-98`)되고 2단계(원본→Unsplash)뿐 |
| **S1-B (신규)** | 낮음 | 페이지가 쓰는 `scrollbar-hide` 클래스가 정의되지 않음 → 가로 스크롤 줄에 스크롤바 노출(Firefox/클래식 스크롤바 환경) | 사용처 `[country]/page.tsx:66`, `category/[slug]/page.tsx:45`. 정의는 `scrollbar-none`뿐(`globals.css:111-117`). 실측 computed `scrollbar-width: auto` |
| **S1-C (신규, D24 연관)** | 낮음 | 이미지 URL 유틸이 http(s) 외 스킴을 통과, 프로토콜 상대 URL을 프록시하지 않음 | `utils.ts:69-76` → `isValidArticleImage('javascript:alert(document.cookie)')`, `('ftp://…')` 모두 `true`(프록시로 전달). `utils.ts:109` → `proxyImageUrl('//cdn…/a.jpg')`가 `'/'` 접두 검사에 걸려 **원본 그대로 반환**(핫링크·혼합콘텐츠 우회 안 됨). `getDefaultImage('sports', -1 \| NaN)` → `https://images.unsplash.com/undefined?…`(`utils.ts:236-239`) |
| **D6 후속 (ja/zh)** | 낮음 | 한국어용 `keep-all`을 전역 적용하면 `lang` 표기 없는 일본어·중국어 원문이 불규칙 줄바꿈("維/持", "示/す") | Planner 주입 실험 스크린샷. 원인: 원문 블록에 `lang` 속성 없음 + 제목 폴백 `titleKo \|\| titleOriginal`이 7곳에 복제(`NewsCard.tsx:11`, `NewsCardLarge.tsx:11`, `NewsCardCompact.tsx:16`, `BreakingTicker.tsx:46`, `article/[id]/page.tsx:19,72`, `admin/articles/page.tsx:101`) |
| **D25** | 중간 | 자동 테스트 없음 | `package.json`에 `test` 스크립트 없음, `tests/` 없음 |

### Planner 실측 요약 (모두 재실행 가능, `$SP`)

| 측정 | 결과 | 도구 |
|---|---|---|
| Unsplash ID 66개 HEAD | 기존 60개 중 404 = D1의 6개 그대로 / 교체 6개 = 200 | `curl -I` (검증 V1-2) |
| 빌드 CSS 카테고리 색 클래스 | 64개 중 63개 누락 | `.next/static/css/*.css` grep |
| 배지 computed style | `/` 27개, `/breaking` 30개, `/category/market` 20개 배지 전부 무색 + #e5e7eb 테두리 | `planner-s1-badge-probe.js`, `planner-s1-border-probe.js` |
| 관리자·404 페이지의 #e5e7eb 테두리 | 0건 → 기본 테두리색 변경의 부작용 대상 없음 | `planner-s1-border-probe-admin.js` |
| `src/lib` 글롭을 넣은 임시 config로 Tailwind 컴파일 | CATEGORY_COLORS 48/48 생성, 단 전체 테두리 `border-<색>` 0/16 → 리터럴 필요 | `planner-s1-tw.config.ts`, `planner-s1-tw-out.css` |
| D6 CSS 주입 실험 (16 라우트 × 3 뷰포트 × 4 변형) | 모든 변형이 `art-unbroken` 넘침 해소. `overflow-wrap:anywhere` 단독은 공개 페이지 요소 크기 변화 **0건**(넘치던 요소 제외). **유일한 부작용 = 표 압착**: 태블릿 `/admin/logs` 표 폭 902→734px, 높이 5313→8313px | `planner-s1-wrap-experiment.js` → `.json` |
| 표 리셋 포함 최종안 | 관리자 표 6개 케이스(2 페이지 × 3 뷰포트) 기하가 기준선과 **완전히 동일** | `planner-s1-table-check2.js` |
| 최종안 전 라우트 (40 라우트 × 3 뷰포트) | 넘침 3 → **0**. 모바일 장문 제목 h1 높이 1150 → 595px, 한국어 어절 단위 줄바꿈 | `planner-s1-final-check.js`, `planner-s1-shots/` |
| react-dom(Next 14.2.18 번들) | `didNotMatchHydratedTextInstance`가 **부모 요소의 `suppressHydrationWarning`이면 텍스트 불일치 검사 생략** | `node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:36220` |
| `tsx --test` 러너 | Node 22 + tsx 4.21에서 `node:test` TS 파일 실행·런타임 `process.env.TZ` 전환 동작 확인 | `$SP/tsxtest/` |

---

## 디자인 방향

- **유지**: 다크 모던(Bloomberg/Reuters) — 깊은 네이비-블랙 표면 3단계, 앰버 악센트, Pretendard, 정보 밀도 높은 레이아웃. 기존 색·폰트·간격 토큰 **값 변경 금지**.
- **이번 라운드의 "디자인 작업" = 원래 의도했던 디자인을 실제로 보이게 만드는 것**:
  1. **카테고리 색 코드 복구** — 좌측 2px 컬러 틱의 터미널형 라벨(S1 R1에서 설계한 차별화 요소)이 6개월간 화면에 한 번도 나오지 않았다. 새 색을 만들지 말고 `CATEGORY_COLORS`에 이미 정의된 색이 렌더링되게 한다.
  2. **한국어 조판 품질** — 어절 단위 줄바꿈 + 반응형 대제목. 장식이 아니라 가독성 결함 수정이다.
- **명시적 금지(AI slop)**: 보라색/핑크 그라데이션, 흰 카드+밝은 그림자, 네온 악센트, 새 장식 효과, 새 색 토큰. (미사용 `.text-gradient-amber` 등은 이번 라운드에서 건드리지 않는다.)
- **최종 대체 이미지(오프라인 플레이스홀더)**는 "조용한" 표현: 텍스트·로고 없이 표면색 위에 테두리 토큰색의 단순 사진 아이콘. 다크 팔레트 밖의 색 금지.

---

## 대상 파일 목록

| 파일 | 변경 |
|---|---|
| `tailwind.config.ts` | `content`에 `src/lib`·`src/hooks` 추가, `borderColor.DEFAULT` = 테두리 토큰, `headline-xl` 유동 크기 |
| `src/app/globals.css` | base 레이어 전역 줄바꿈 안전장치, `scrollbar-hide` 별칭 |
| `src/lib/constants.ts` | `CATEGORY_COLORS.*.borderAll`, `MAX_PAGE`, `BREAKING_ITEMS_PER_PAGE`, `IMAGE_PLACEHOLDER_SRC` |
| `src/lib/utils.ts` | D1 사진 교체·`getDefaultImage` 견고화, KST 날짜 유틸, `parseIntParam`/`parsePage`, 이미지 체인, URL 유틸 견고화, 표시 제목/언어 헬퍼 |
| `package.json` | `scripts.test` **한 줄만** 추가 (의존성 추가·변경 금지) |
| `tests/utils.test.ts` (신규) | 유틸 단위 테스트 |
| `tests/design-tokens.test.ts` (신규) | 상수·Tailwind 설정 불변식 테스트 |

**수정 금지**: 위 목록 외 파일(컴포넌트·페이지·워커·API). S1 변경은 전부 **추가형(additive)** 이어야 하며, 다른 슬라이스 파일을 고치지 않아도 `npm run build`가 통과해야 한다.
**실행 환경 제약**: `utils.ts`/`constants.ts`는 브라우저·Next 서버·Node 워커(tsx, `src/workers/*`가 `../lib/utils` import)에서 공용 → DOM/브라우저 전용 API, Node 전용 모듈, `Intl`/`toLocale*`(날짜용) 사용 금지.

---

## 개선 항목

우선순위: **P0** = 이번 슬라이스 합격 필수, **P1** = 필수(뒤 슬라이스 의존), **P2** = 필수(저위험 보강).

### 항목 1 [P0 · D1]: 죽은 Unsplash 사진 6개 교체 + `getDefaultImage` 견고화
- **대상 파일**: `src/lib/utils.ts` (`CATEGORY_PHOTOS` 211-228, `getDefaultImage` 235-241)
- **현재 문제**: 아래 6개 ID가 404. `id % 4` 매핑이라 해당 카테고리의 이미지 없는 기사 1/4이 깨진 이미지(`general`은 미분류 기본값이라 영향 최대). 음수/NaN id면 URL에 `undefined`가 들어가 100% 깨짐. 카테고리 앞뒤 공백은 `general`로 떨어짐.
- **개선 방법**:
  1. **같은 배열 위치에서** 정확히 교체(다른 58개 슬롯은 한 글자도 바꾸지 말 것 → 기존 기사의 대표 사진 불변):

     | 카테고리(라인) | 인덱스 | 제거(404) | 교체(검증된 ID) |
     |---|---|---|---|
     | market (213) | 1 | `photo-1535320903710-d946a44237ab` | `photo-1640340434855-6084b1f4901c` (캔들차트) |
     | sports (215) | 0 | `photo-1461896836934-bd45ba43fcee` | `photo-1471295253337-3ceaaedca402` (야구장) |
     | semiconductor (217) | 2 | `photo-1640955014216-7d4be39b5f94` | `photo-1591799264318-7e6ef8ddb7ea` (CPU 칩) |
     | automotive (218) | 2 | `photo-1549317661-bd32c8ce0abe` | `photo-1494976388531-d1058494cdd8` (자동차) |
     | culture (225) | 2 | `photo-1499781350541-7783f6c6a0c8` | `photo-1460661419201-fd4cecdf8a8b` (붓) |
     | general (227) | 0 | `photo-1504711434969-e33886168d4c` | `photo-1504711331083-9c895941bf81` (신문) |
  2. `CATEGORY_PHOTOS`를 `export const CATEGORY_PHOTOS: Readonly<Record<string, readonly string[]>>`로 export(테스트·검증용, 위치는 `utils.ts` 유지).
  3. `getDefaultImage(category: string | null | undefined, articleId: number | string | null | undefined): string`:
     - 카테고리: `(category ?? '').trim().toLowerCase()`, 없거나 미지 → `general`.
     - 인덱스: number면 그대로, 그 외는 `parseInt(String(articleId ?? ''), 10)`(기존 동작 유지) → 유한수가 아니면 0, 유한수면 `Math.abs(Math.trunc(n)) % photos.length`. **양의 정수 id는 기존과 같은 인덱스**(회귀 없음).
     - URL 형식 불변: `https://images.unsplash.com/{id}?w=800&h=500&fit=crop&auto=format&q=75`.
- **기대 효과**: 운영 환경에서 Unsplash 대체 이미지 404 0건. 어떤 입력에도 유효 URL 반환.
- **검증 방법**:
  - V1-1 `npm test` — `tests/utils.test.ts`의 D1 케이스(항목 7) 통과.
  - V1-2 네트워크 실검증(빈 출력이면 통과):
    `for id in $(grep -ohE "photo-[0-9]+-[0-9a-f]+" src/lib/utils.ts src/lib/constants.ts | sort -u); do curl -s -o /dev/null -m 15 -w "%{http_code} $id\n" -I "https://images.unsplash.com/$id?w=64&q=10"; done | grep -v '^200'`
  - V1-3 `git diff src/lib/utils.ts`에서 `CATEGORY_PHOTOS`의 변경이 정확히 6개 ID 치환뿐인지(+export 키워드) 확인.

### 항목 2 [P0 · S1-A 신규]: Tailwind가 `src/lib`를 스캔하도록 수정 — 카테고리 색 체계 복구
- **대상 파일**: `tailwind.config.ts` (4-8), `src/lib/constants.ts` (87-104), `src/lib/utils.ts` (248-250)
- **현재 문제**: 위 결함표 S1-A. 다크 화면에 라이트 테마 기본 테두리(#e5e7eb)가 그려지고 카테고리 구분 색이 전무.
- **개선 방법**:
  1. `content`에 `'./src/lib/**/*.{js,ts,jsx,tsx}'`, `'./src/hooks/**/*.{js,ts,jsx,tsx}'` 추가(기존 3개 글롭 유지, `src/workers`는 넣지 않음).
  2. `theme.extend.borderColor.DEFAULT`를 `border` 토큰과 **같은 값**(#30363d)으로 설정 → 색 미지정 테두리의 기본색이 다크 토큰이 됨(안전망). 가능하면 리터럴 중복 대신 같은 상수/`theme()` 참조로 단일 출처 유지. 실측상 현재 #e5e7eb를 쓰는 요소는 고장 난 배지뿐이라 부작용 없음.
  3. `CATEGORY_COLORS` 각 항목에 `borderAll` 추가 — 값은 **반드시 `border` 값에서 `border-l-`를 `border-`로 바꾼 완전한 리터럴**(예: politics `'border-red-500'`, world `'border-blue-400'`, general `'border-gray-500'`). 타입: `export type CategoryStyle = { border: string; text: string; bg: string; borderAll: string }`. 이렇게 하면 **S4가 아직 손대지 않은 기사 상세의 `.replace()` 코드도 즉시 색을 얻는다**(그 결과 클래스가 리터럴로 존재하게 되므로).
  4. `getCategoryStyle()` 반환 타입을 `CategoryStyle`로, 폴백에 `borderAll: 'border-gray-500'` 추가(`border-l-gray-500`과 불변식 일치). 기존 필드·값 불변.
  5. 새 색을 만들지 말 것. 클래스 문자열은 동적 조합 금지(완전한 리터럴만).
- **기대 효과**: 16개 카테고리 배지·섹션 헤더가 설계된 색으로 표시, 다크 화면의 밝은 회색 선 제거.
- **검증 방법**:
  - V2-1 빌드 후 CSS 존재 확인(모두 OK여야 함):
    `CSS=$(ls .next/static/css/*.css); for c in border-l-indigo-500 text-violet-400 'bg-cyan-500\\/10' border-l-blue-400 border-blue-500 border-gray-500 border-red-500; do grep -q "\.$c[{:,]" $CSS && echo "OK $c" || echo "MISSING $c"; done`
  - V2-2 `cd $SP && node planner-s1-verify.js` → **T5 PASS**(배지 전부 유색, #e5e7eb 테두리 0건).
  - V2-3 `npm test` — 불변식: 16개 카테고리 모두 4필드, `borderAll === border.replace('border-l-','border-')`, `content`에 `src/lib` 포함, `borderColor.DEFAULT === colors.border.DEFAULT`.

### 항목 3 [P0 · D6]: 전역 타이포그래피 안전장치 (globals.css `@layer base`)
- **대상 파일**: `src/app/globals.css` (base 레이어 10-13 부근)
- **현재 문제**: 줄바꿈 규칙 부재로 URL·긴 단어가 박스를 넘고 모바일 레이아웃 뷰포트가 1500px로 확대. 한국어는 음절 중간에서 잘림.
- **개선 방법** — `@layer base`에 아래 규칙을 **그대로** 추가(기존 `body { @apply … }`에 합쳐도 됨):
  ```css
  body {
    overflow-wrap: anywhere;   /* 넘칠 때만 임의 지점 줄바꿈 + min-content 계산에 반영 */
    word-break: keep-all;      /* 한국어 어절(띄어쓰기) 단위 줄바꿈 */
  }
  /* 띄어쓰기 없는 중·일 원문은 keep-all 해제(문자 단위 줄바꿈 + 금칙 처리) */
  :lang(ja), :lang(zh) {
    word-break: normal;
  }
  /* 표는 열 너비를 min-content로 계산 → anywhere를 상속하면 짧은 단어 열이 글자 단위로 압착됨.
     표 안은 기존 규칙으로 되돌리고 넘침은 기존 overflow-x-auto 래퍼가 흡수 */
  table {
    overflow-wrap: break-word;
    word-break: normal;
  }
  ```
  - `break-all` 금지(한·영 모두 아무 데서나 끊어 keep-all을 무력화). 컴포넌트별 `break-words`/`min-w-0` 추가는 S1 범위 밖이며 이 규칙으로 불필요.
- **설계 근거 (min-content 부작용 분석)**:
  - `overflow-wrap: break-word`는 줄바꿈만 허용하고 **min-content 계산에는 반영되지 않는다** → flex 아이템(`min-width:auto` = min-content)·표·`inline-flex`/`w-fit` 같은 내재 크기 요소에서는 긴 URL 폭이 그대로 최소 폭이 되어 계속 넘친다. `anywhere`는 그 줄바꿈 기회를 min-content에 반영하므로 flex 아이템이 컨테이너 폭까지 줄어든다. 일반 블록(h1·p)에서는 둘의 동작이 같다.
  - **flex**: 넘치지 않는 행은 flex-basis(=max-content, `overflow-wrap`과 무관)로 배치되므로 레이아웃 불변. 영향은 "원래 넘치던 과제약 행"에만 생기며 그 경우 넘침 대신 줄바꿈된다. `whitespace-nowrap` 요소(내비·티커·국가 탭·필 행)는 줄바꿈 기회 자체가 없어 영향 없음. 명시적 `min-w-[…]`(페이지네이션 버튼)는 그 값이 하한으로 유지.
  - **grid**: 전 그리드가 `minmax(0,1fr)`(이미 하한 0) → 영향 없음.
  - **한국어**: 현재도 기본 `word-break:normal`에서 한글 음절마다 줄바꿈 기회가 있어 한글 min-content는 이미 1음절이다. 따라서 `anywhere`가 한국어 UI 라벨에 새로 주는 위험은 없다. `keep-all`은 줄 배치 시 어절 단위를 우선하고, 한 어절이 줄보다 길 때만 `anywhere`의 비상 줄바꿈이 작동한다.
  - **표**: 유일하게 실측된 부작용(태블릿 `/admin/logs` 902→734px로 압착, 행 높이 +56%)을 `table` 리셋으로 제거. 리셋 후 6개 케이스 모두 기준선과 픽셀 단위로 같은 기하.
  - **실측**: 이 규칙으로 40 라우트 × 3 뷰포트 넘침 3 → 0. `anywhere` 단독 주입 시 공개 페이지에서 크기가 바뀐 요소는 넘치던 요소뿐(0건 부작용).
- **기대 효과**: 어떤 텍스트 컨테이너에서도 긴 문자열이 뷰포트를 넘지 않음. 모바일이 1500px로 축소되던 현상 제거. 한국어 제목이 어절 단위로 줄바꿈.
- **검증 방법**:
  - V3-1 `bash $SP/qa-env.sh restart && cd $SP && node planner-s1-verify.js` → **T1**(넘침 0, 모바일 vw=375 유지), **T2**(computed: body `anywhere`/`keep-all`, table·td `break-word`/`normal`, `:lang(ja|zh)` `normal`), **T4**(표 기하 = 기존 규칙과 동일) PASS.
  - V3-2 `cd $SP && node audit.js s1` → `art-unbroken` OVERFLOW가 3개 뷰포트 모두 사라지고, 기준선(`audit-baseline.json`)에 없던 OVERFLOW 신규 0건.
  - V3-3 육안: `node peek.js mobile /article/392 peek/s1-unbroken 2`, `node peek.js mobile /article/391 peek/s1-long 1` → URL이 화면 안에서 줄바꿈, 한국어 어절 단위.

### 항목 4 [P0 · D6]: `headline-xl` 유동(반응형) 크기 토큰
- **대상 파일**: `tailwind.config.ts:49`
- **현재 문제**: 기사 h1(`text-headline-xl`, 사용처는 `article/[id]/page.tsx:123` 1곳)이 375px 화면에서도 40px → 장문 제목 h1 높이 1150px, URL 제목 1단어가 10줄 이상.
- **개선 방법**: `'headline-xl': ['clamp(1.75rem, 1.2rem + 2vw, 2.5rem)', { lineHeight: '1.15', fontWeight: '800' }]` (lineHeight·weight 불변). 결과: ≤440px에서 28px(= `headline-lg`, 타이포 스케일 역전 없음), 768px에서 ≈34.56px, ≥1040px에서 40px(데스크톱 불변). rem+vw 조합이라 브라우저 확대 시에도 커짐.
- **기대 효과**: 모바일 장문 제목 h1 높이 1150 → 595px(실측), 데스크톱 디자인 불변.
- **검증 방법**: `node planner-s1-verify.js` **T3** PASS(28 / ≈34.56 / 40px, ±0.75). `npm test`에서 토큰 문자열이 `clamp(`로 시작하고 `1.75rem`·`2.5rem` 포함.

### 항목 5 [P0 · D7]: 서버 TZ·ICU 무관한 결정적 KST 날짜 유틸 + 하이드레이션 안전 계약
- **대상 파일**: `src/lib/utils.ts` (136-156)
- **현재 문제**: 결함표 D7. 서버(UTC)와 브라우저(KST)가 다른 문자열을 만들어 클라이언트 카드에서 하이드레이션 실패(#425/#422 실제 관측). `Intl` 구현차로 "AM/PM" 등 형식도 환경마다 다름.
- **개선 방법** (`Intl`·`toLocale*` 사용 금지. 한국은 1988년 이후 서머타임이 없으므로 **고정 +9시간 오프셋**이 기사 날짜 전 범위에서 정확):
  ```ts
  export type DateInput = Date | string | number | null | undefined;
  export interface KstParts { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number } // weekday 0=일
  export function toKstParts(input: DateInput): KstParts | null;      // new Date(ms + 9h)의 getUTC* 값
  export function formatDate(input: DateInput): string;               // 'YYYY.MM.DD HH:mm' (KST, 24시간, 0 채움)
  export function formatDateOnly(input: DateInput): string;           // 'YYYY.MM.DD' (KST)
  export function toIsoDateTime(input: DateInput): string | undefined; // Date#toISOString() (UTC 'Z') — <time dateTime>용
  export function timeAgo(input: DateInput, now?: Date | number): string; // now 기본값 Date.now()
  ```
  - 입력 해석: `null`/`undefined`/`''`/파싱 불가/`Invalid Date` → `formatDate`·`formatDateOnly`·`timeAgo`는 `''`, `toKstParts`는 `null`, `toIsoDateTime`은 `undefined`. **타임존 표기가 없는 날짜-시간 문자열**(`'2026-10-01T08:03:00'`, `'2026-10-01 08:03'`)은 **UTC로 해석**(V8은 로컬 TZ로 해석하므로 서버 TZ 의존이 생김; Prisma DateTime은 UTC 저장).
  - 출력 예시(TZ와 무관하게 문자 단위 동일):
    - `formatDate('2026-10-01T08:03:00Z')` → `'2026.10.01 17:03'`
    - `formatDate('2026-12-31T15:00:00Z')` → `'2027.01.01 00:00'` · `formatDate('2028-02-28T15:30:00Z')` → `'2028.02.29 00:30'`
    - `formatDateOnly('2026-09-30T15:00:00Z')` → `'2026.10.01'`
    - `toIsoDateTime('2026-10-01T17:03:00+09:00')` → `'2026-10-01T08:03:00.000Z'`
    - `toKstParts('2026-10-04T15:30:00Z')` → `{ year: 2026, month: 10, day: 5, hour: 0, minute: 30, second: 0, weekday: 1 }`
  - `timeAgo` 규칙(`diff = floor((now − t)/1000)`초):
    | 조건 | 출력 |
    |---|---|
    | 입력 무효 | `''` |
    | `diff < −60` (60초 넘게 미래) | `formatDate(t)` (절대 시각) |
    | `diff < 60` (±60초 시계 오차 포함) | `'방금 전'` |
    | `< 3600` | `'N분 전'` |
    | `< 86400` | `'N시간 전'` |
    | `< 604800` | `'N일 전'` |
    | 그 이상 | `formatDateOnly(t)` 예: `'2026.09.28'` (기존 `'2026년 9월 28일'`에서 의도적 변경: ICU 제거 + `formatDate`와 형식 통일, 모바일 메타 행 폭 절약) |
  - 시그니처는 기존 호출(`timeAgo(article.publishedAt)`, `formatDate(article.publishedAt)`)과 100% 호환.
- **하이드레이션 안전 계약** (S3/S4가 적용, "슬라이스 간 계약" 참조): 절대 형식(`formatDate`/`formatDateOnly`)은 결정적이라 그대로 안전. `timeAgo`는 `now`에 의존하므로 **클라이언트 컴포넌트에서는 반드시** `<time dateTime={toIsoDateTime(d)} suppressHydrationWarning>{timeAgo(d)}</time>`처럼 결과 텍스트의 **직접 부모 요소**에 `suppressHydrationWarning`을 둔다(react-dom 18.3이 이 경우 텍스트 불일치 검사를 생략함을 소스로 확인).
- **기대 효과**: 서버·브라우저 결과가 문자 단위로 동일(TZ/ICU 무관), "Invalid Date"·"AM/PM"·미래 "방금 전" 제거, 하이드레이션 오류의 결정적 원인 제거.
- **검증 방법**:
  - V5-1 `TZ=UTC npm test && TZ=Asia/Seoul npm test && TZ=America/Los_Angeles npm test` 모두 통과(테스트 내부에서도 `process.env.TZ`를 바꿔가며 동일 출력 단언).
  - V5-2 `grep -nE "toLocale|Intl\." src/lib/utils.ts` → **0건**.
  - V5-3 빌드 후 `curl -s http://127.0.0.1:4000/livenews/article/1 | grep -oE "20[0-9]{2}\.[0-9]{2}\.[0-9]{2} [0-9]{2}:[0-9]{2}" | head -2` → `YYYY.MM.DD HH:mm` 형식, `AM|PM|Invalid Date` 문자열 없음(`grep -cE "AM [0-9]|PM [0-9]|Invalid Date"` → 0).

### 항목 6 [P0 · D8 기반]: 쿼리 정수 파서 `parseIntParam` / `parsePage` + `MAX_PAGE`
- **대상 파일**: `src/lib/utils.ts`, `src/lib/constants.ts`
- **현재 문제**: 결함표 D8 — 페이지·API의 `parseInt`가 NaN·과대값을 Prisma로 흘려 500/거짓 안내.
- **개선 방법**:
  ```ts
  // constants.ts
  export const MAX_PAGE = 10_000;               // 운영 최대(속보 458p)의 20배+, skip 최대 ≈ 300k로 Prisma Int 범위 안
  export const BREAKING_ITEMS_PER_PAGE = 30;    // queries.ts의 하드코딩 30을 S4가 대체할 수 있도록 (ITEMS_PER_PAGE=20은 유지)
  // utils.ts
  export function parseIntParam(raw: unknown, opts: { min: number; max: number; fallback: number }): number;
  export function parsePage(raw: unknown): number; // = parseIntParam(raw, { min: 1, max: MAX_PAGE, fallback: 1 })
  ```
  - 규칙: 배열이면 첫 요소(`?page=2&page=3` → `['2','3']`). 문자열은 trim 후 **`/^\d+$/`(ASCII 숫자만)일 때만** 정수로 인정 — 부호·소수점·지수·전각 숫자·문자 혼입은 해석 불가 → `fallback`. number는 `Number.isInteger`일 때만 인정(NaN·Infinity·2.5 → `fallback`). 해석된 값은 `[min, max]`로 clamp(`'0'` → 1, 과대값 → `MAX_PAGE`). 그 외 타입 → `fallback`. 항상 정수 반환.
  - `parsePage`는 서버 컴포넌트(`searchParams.page: string | string[] | undefined`)와 클라이언트(`URLSearchParams.get()`: `string | null`) 양쪽에서 쓰는 순수 함수.
- **기대 효과**: S4/API가 한 줄로 NaN·과대값 500을 제거. 범위 초과(`page > totalPages`) 처리는 S4 몫(계약 참조).
- **검증 방법**: `npm test`의 parse 케이스(항목 7 표) 전부 통과 + 무작위 문자열 1,000개에 대해 결과가 항상 `1 ≤ 정수 ≤ MAX_PAGE`.

### 항목 7 [P0 · D25]: `npm test` 도입 + S1 단위 테스트
- **대상 파일**: `package.json`(scripts만), `tests/utils.test.ts`(신규), `tests/design-tokens.test.ts`(신규)
- **현재 문제**: 자동 테스트 0개.
- **개선 방법**:
  - `package.json` → `"test": "tsx --test tests/*.test.ts"` 한 줄 추가. **의존성 추가 금지**(tsx는 기존 devDependency, `node:test`/`node:assert/strict` 사용).
  - 테스트 작성 규칙: 상대 경로 import(`../src/lib/utils`, `../tailwind.config`), 네트워크 호출 금지, `process.env.TZ`를 바꾸는 테스트는 `finally`에서 원복, `tsconfig`의 `include: ["**/*.ts"]` 때문에 **`next build`가 테스트도 타입 검사**하므로 타입 오류 0.
  - **`tests/utils.test.ts` 필수 케이스** (기준 시각 `NOW = Date.UTC(2026, 9, 5, 3, 0, 0)` = 2026-10-05 12:00 KST):

    | 대상 | 입력 → 기대값 |
    |---|---|
    | formatDate | `'2026-10-01T08:03:00Z'`·같은 순간의 `Date`·`Date.UTC(2026,9,1,8,3)` → `'2026.10.01 17:03'`; `'2026-10-01T17:03:00+09:00'` → `'2026.10.01 17:03'`; `'2026-10-01T08:03:00'`(존 없음=UTC) → `'2026.10.01 17:03'`; `'2026-12-31T15:00:00Z'` → `'2027.01.01 00:00'`; `'2026-12-31T14:59:59Z'` → `'2026.12.31 23:59'`; `'2028-02-28T15:30:00Z'` → `'2028.02.29 00:30'`; `'2026-02-28T15:30:00Z'` → `'2026.03.01 00:30'`; `null`/`undefined`/`''`/`'garbage'`/`new Date(NaN)` → `''` |
    | TZ 독립성 | `process.env.TZ`를 `'UTC'`, `'Asia/Seoul'`, `'America/Los_Angeles'`, `'Pacific/Kiritimati'`로 바꿔도 `formatDate`/`formatDateOnly`/`timeAgo(…, NOW)` 결과 동일 |
    | formatDateOnly | `'2026-09-30T15:00:00Z'` → `'2026.10.01'`; 무효 → `''` |
    | toIsoDateTime / toKstParts | 위 항목 5 예시 그대로; 무효 → `undefined` / `null` |
    | timeAgo(t, NOW) | t=NOW → `'방금 전'`; −59s → `'방금 전'`; −60s → `'1분 전'`; −3599s → `'59분 전'`; −3600s → `'1시간 전'`; −86399s → `'23시간 전'`; −86400s → `'1일 전'`; −604799s → `'6일 전'`; −604800s → `'2026.09.28'`; +30s → `'방금 전'`; +5h → `'2026.10.05 17:00'`; `'2026-09-01T20:30:00Z'` → `'2026.09.02'`; 무효 → `''`; `now`에 `Date` 객체를 줘도 같은 결과 |
    | parsePage | `undefined`/`null`/`''`/`'abc'`/`'7abc'`/`'-3'`/`'2.5'`/`'1e3'`/`'０７'`/`[]`/`{}`/`2.5`/`NaN`/`Infinity` → 1; `'1'` → 1; `'7'`/`' 7 '`/`'007'`/`7` → 7; `'0'` → 1; `['3','9']` → 3; `String(MAX_PAGE)` → MAX_PAGE; `String(MAX_PAGE+1)`/`'99999999999999999999'` → MAX_PAGE; 무작위 문자열 1,000개 → 항상 `1..MAX_PAGE` 정수 |
    | parseIntParam | (`'abc'`, {min:1,max:100,fallback:20}) → 20; `'0'` → 1; `'500'` → 100; `'50'` → 50 |
    | D1 사진 | `CATEGORY_PHOTOS` 전체에 죽은 6개 ID 0건; 교체 ID가 정확한 위치에 존재(market[1], sports[0], semiconductor[2], automotive[2], culture[2], general[0]); `CATEGORIES`의 16개 slug 모두 4개 ID, 각 ID `/^photo-\d+-[0-9a-f]+$/` |
    | getDefaultImage | id `0,1,2,3,5,-1,NaN,1.5,'12','abc',null,undefined,Number.MAX_SAFE_INTEGER` 모두 `/^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]+\?w=800&h=500&fit=crop&auto=format&q=75$/` 일치('undefined' 미포함); `('economy',5)`는 `CATEGORY_PHOTOS.economy[1]` 사용(기존 매핑 유지); `(' Sports ',1)` = `('sports',1)`; `(null,1)` = `('quantum-weird-category',1)` = `('general',1)`; 같은 입력 → 같은 출력 |
    | getArticleImageSources | 유효 원본 → 길이 3 `[proxyImageUrl(정규화 원본), getDefaultImage(cat,id), IMAGE_PLACEHOLDER_SRC]`; `imageUrl: null`·로고 URL(`https://static.example.com/assets/logo.png`)·`'javascript:alert(1)'` → 길이 2; `'//cdn.example.com/photos/abc.jpg'` → 첫 요소가 `'https://cdn.example.com/photos/abc.jpg'`의 프록시; `'http://x.com/a.jpg'` → https 프록시; 마지막 요소는 항상 `IMAGE_PLACEHOLDER_SRC`; 중복 없음; 두 번 호출 deepEqual |
    | isValidArticleImage | true: `'https://cdn.example.com/news/2026/photo.jpg'`, `'http://cdn.example.com/a.jpg'`. false: `null`, `''`, `'short'`, 로고/파비콘/`.svg`/`data:` URL, `'javascript:alert(document.cookie)'`, `'ftp://files.example.com/a.jpg'`, `'https://static.chinadaily.com.cn/img/a.jpg'`, `'/relative/a.jpg'`, `IMAGE_PLACEHOLDER_SRC` |
    | normalizeImageUrl (회귀) | `'//x.com/a.jpg'` → `'https://x.com/a.jpg'`; `'http://x.com/a.jpg'` → `'https://x.com/a.jpg'`; 앞뒤 공백 제거; `null`/`''` → `null` |
    | proxyImageUrl | `'https://x.com/a b.jpg'` → `'/livenews/api/img?url=https%3A%2F%2Fx.com%2Fa%20b.jpg'`; `'/local.png'`·`'data:image/png;base64,AA'`·`''` → 그대로; `'//cdn.example.com/a.jpg'` → `'/livenews/api/img?url=' + encodeURIComponent('https://cdn.example.com/a.jpg')` |
    | getDisplayTitle / toLangTag | 항목 11 표 그대로 |
  - **`tests/design-tokens.test.ts` 필수 케이스**:
    - `CATEGORIES` 16개 slug 모두 `getCategoryStyle(slug)`가 `border` `/^border-l-[a-z]+-\d{3}$/`, `text` `/^text-[a-z]+-\d{3}$/`, `bg` `/^bg-[a-z]+-\d{3}\/\d{1,2}$/`, `borderAll === border.replace('border-l-','border-')`; 미지 slug 폴백도 4필드 + 같은 불변식.
    - Tailwind 설정: `content` 중 `src/lib/` 포함 항목 존재; `extend.borderColor.DEFAULT === extend.colors.border.DEFAULT`; `fontSize['headline-xl'][0]`이 `clamp(`로 시작하고 `1.75rem`·`2.5rem` 포함; **기존 팔레트 스냅샷 불변**(surface #0d1117/#161b22/#21262d, text #e6edf3/#8b949e/#6e7681, accent #f0883e/#58a6ff/#f85149/#3fb950, border #30363d/#21262d).
    - `IMAGE_PLACEHOLDER_SRC`: `data:image/svg+xml`로 시작; 디코딩한 SVG에 `viewBox="0 0 800 500"` 포함; `href`·`url(`·`<image`·`<text`·`@import`·`font` 미포함(외부 요청·글꼴 의존 없음); SVG 안의 모든 `#rrggbb`가 Tailwind 팔레트 값 집합에 속함.
    - `MAX_PAGE`는 양의 정수, `BREAKING_ITEMS_PER_PAGE === 30`, `ITEMS_PER_PAGE === 20`(불변).
- **기대 효과**: 회귀 자동 탐지 기반. 다른 슬라이스는 `tests/<영역>.test.ts`만 추가하면 됨.
- **검증 방법**: `npm test` 종료코드 0, 출력에 두 파일이 모두 실행되고 `# fail 0`, 위 표의 모든 행이 최소 1개 이상의 단언으로 존재(Evaluator가 테스트 파일을 읽고 표와 대조), `npx tsc --noEmit` 0 오류, `npm run build` 성공.

### 항목 8 [P1 · D2/D3 기반]: 이미지 대체 체인 API + 오프라인 플레이스홀더
- **대상 파일**: `src/lib/utils.ts`, `src/lib/constants.ts`
- **현재 문제**: 이미지 소스 결정이 3곳에 복제되고 2단계뿐 → Unsplash까지 실패하면 같은 URL 재설정(D2), 하이드레이션 전 실패는 복구 불가(D3). S3가 고칠 수 있도록 결정적 체인이 필요.
- **개선 방법**:
  ```ts
  // constants.ts — 네트워크 요청 0, 다크 팔레트만 사용하는 인라인 SVG
  export const IMAGE_PLACEHOLDER_SRC: string; // 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG)
  // utils.ts
  export function getArticleImageSources(article: { id: number | string; imageUrl?: string | null; categoryPrimary?: string | null }): string[];
  ```
  - 체인: `normalizeImageUrl(imageUrl)`이 `isValidArticleImage` 통과 시 `proxyImageUrl(그 값)` → `getDefaultImage(categoryPrimary, id)` → `IMAGE_PLACEHOLDER_SRC`. 중복 제거. 길이 2~3, **마지막은 항상 플레이스홀더**(절대 실패하지 않음). `Date`·난수 미사용 → 서버/클라이언트 동일(첫 `src` 하이드레이션 안전).
  - 플레이스홀더 SVG 기준안(형태는 조정 가능, 제약은 필수): `viewBox="0 0 800 500"`(Unsplash 대체 800×500과 같은 16:10), `preserveAspectRatio="xMidYMid slice"`, 배경 `#21262d`(surface.elevated = 카드 이미지 영역 배경과 동일), 중앙의 단순 사진 아이콘(사각 프레임+산+해) 선색 `#30363d`(border). 텍스트·글꼴·외부 참조 금지.
    ```
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><rect width="800" height="500" fill="#21262d"/><g fill="none" stroke="#30363d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><rect x="330" y="185" width="140" height="130" rx="12"/><path d="M348 297l36-42 28 30 22-22 30 34"/><circle cx="436" cy="222" r="12"/></g></svg>
    ```
  - 플레이스홀더는 `isValidArticleImage`에 넣지 않는다(`data:`·svg 패턴으로 의도적으로 false).
- **기대 효과**: S3가 `onError`/마운트 시점 검사로 인덱스만 증가시키면 최종적으로 깨진 아이콘·alt 텍스트 노출 0건(무네트워크 최악 조건 포함).
- **검증 방법**: `npm test`의 getArticleImageSources·IMAGE_PLACEHOLDER_SRC 케이스. 렌더링 효과(깨진 이미지 0)는 S3 검수에서 `audit.js`로 확인.

### 항목 9 [P1 · S1-B 신규]: 미정의 `scrollbar-hide` 클래스 별칭 추가
- **대상 파일**: `src/app/globals.css` (`@layer utilities` 111-117)
- **현재 문제**: 두 페이지가 쓰는 `.scrollbar-hide`가 어디에도 정의되지 않아 무효(실측 computed `scrollbar-width: auto`).
- **개선 방법**: 기존 규칙 셀렉터에 별칭 추가 — `.scrollbar-none, .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }` / `.scrollbar-none::-webkit-scrollbar, .scrollbar-hide::-webkit-scrollbar { display: none; }`. 페이지 파일 수정 불필요.
- **기대 효과**: 국가·카테고리 필 행이 의도대로 스크롤바 없이 가로 스크롤.
- **검증 방법**: `node planner-s1-verify.js` **T6** PASS(`/category/market`, `/japan`의 `.scrollbar-hide` computed `scrollbar-width: none`).

### 항목 10 [P1 · S1-C 신규, D24 연관]: 이미지 URL 유틸 견고화
- **대상 파일**: `src/lib/utils.ts` (`isValidArticleImage` 53-79, `proxyImageUrl` 108-111)
- **현재 문제**: 결함표 S1-C.
- **개선 방법**:
  - `isValidArticleImage`: 기존 패턴 검사 유지 + `new URL()` 결과의 `protocol`이 `http:`/`https:`가 아니면 `false`. 워커(`scraper.ts`·`normalizer.ts`·`collector.ts`)는 원본 URL을 검사하는데, 프로토콜 상대 URL은 지금도 `new URL()` 실패로 false이고 DB 이미지 URL은 https 273건·null 136건·`//` 1건(픽스처)뿐이라 기존 정상 이미지에 영향 없음.
  - `proxyImageUrl`: `'//'`로 시작하면 `'https:'`를 붙인 뒤 프록시. `data:`와 단일 `/` 상대 경로는 그대로 통과. 빈 문자열은 그대로 반환. 출력 형식 `/livenews/api/img?url=<encodeURIComponent>` 불변.
  - SSRF 차단 자체(사설 IP 등)는 `/api/img` 라우트의 몫(D24, S5). S1은 우리 페이지가 비 http(s) URL을 프록시에 보내지 않게만 한다.
- **기대 효과**: 비정상 스킴이 프록시로 가지 않음(불필요한 500·콘솔 에러 감소), 프로토콜 상대 URL도 일관되게 프록시 경유.
- **검증 방법**: `npm test`의 isValidArticleImage·proxyImageUrl·normalizeImageUrl 케이스.

### 항목 11 [P2 · D6 후속]: 표시 제목·언어 태그 헬퍼
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: 결함표 "D6 후속". 전역 `keep-all`(항목 3)의 중·일 예외는 `lang` 표기가 있어야 작동하는데 원문 블록에 `lang`이 없다. 제목 폴백 로직은 7곳에 복제되고 공백뿐인 `titleKo`(`' '`, truthy)는 빈 제목을 만든다.
- **개선 방법**:
  ```ts
  export function toLangTag(language: string | null | undefined): string | undefined;
  // trim+소문자, /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/ 만 허용, 그 외 undefined
  export function getDisplayTitle(a: { titleKo?: string | null; titleOriginal: string; language?: string | null }):
    { text: string; lang: string | undefined; isTranslated: boolean };
  // isTranslated = titleKo.trim()이 비어 있지 않고 titleOriginal.trim()과 다름(영어 echo 제목은 미번역 취급, D17 표시 측면)
  // text = isTranslated ? titleKo.trim() : titleOriginal ; lang = isTranslated ? 'ko' : toLangTag(language)
  ```
  | 입력 | 기대값 |
  |---|---|
  | `{titleKo:'미 연준 금리 인하 신호', titleOriginal:'Fed signals rate cuts', language:'en'}` | `{text:'미 연준 금리 인하 신호', lang:'ko', isTranslated:true}` |
  | `{titleKo:null, titleOriginal:'日本銀行、…', language:'ja'}` | `{text:'日本銀行、…', lang:'ja', isTranslated:false}` |
  | `{titleKo:'Fed signals', titleOriginal:'Fed signals', language:'en'}` (echo) | `{text:'Fed signals', lang:'en', isTranslated:false}` |
  | `{titleKo:'   ', titleOriginal:'X', language:'en'}` | `{text:'X', lang:'en', isTranslated:false}` |
  | `{titleKo:'번역', titleOriginal:'orig'}` | `{text:'번역', lang:'ko', isTranslated:true}` |
  | `{titleKo:null, titleOriginal:'orig'}` | `{text:'orig', lang:undefined, isTranslated:false}` |
  | `toLangTag`: `'ja'`→`'ja'`, `' ZH '`→`'zh'`, `'zh-CN'`→`'zh-cn'`, `''`/`null`/`'english'` → `undefined` | |
- **기대 효과**: S3/S4가 `lang={t.lang}` 한 줄로 중·일 원문 줄바꿈 회귀를 막고, 스크린리더가 영어 원제목을 영어로 읽음. 제목 폴백 중복 제거 기반.
- **검증 방법**: `npm test`의 표 케이스. 렌더링 적용(`lang` 속성)은 S3/S4 검수 항목.

---

## 범위 밖 (S1에서 하지 말 것)

- 컴포넌트·페이지·API·워커 파일 수정(D2~D5, D8 페이지 로직, D9~D24는 각 슬라이스 담당). S1은 **공용 API·토큰·전역 CSS·테스트 기반**만.
- 토큰 값 변경, 새 색·새 애니메이션·새 장식, AI 기능.
- 미사용 CSS 클래스 정리(`.news-card`, `.text-gradient-amber` 등) — 결함 아님, 이번 라운드 변경 최소화.
- 스크롤바 두께(`::-webkit-scrollbar` height) — headless에서 검증 불가하므로 근거 없는 변경 금지.
- Pretendard `@import` — 빌드 CSS 맨 앞에 위치해 유효함을 확인, 손대지 말 것.
- `categoryLabel`의 미지 slug 원문 표시, `estimateReadingTime`의 영어 기준 등 — 기준선 결함 목록에 없음.

---

## Evaluator 검증 절차 (요약)

```bash
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
cd /home/user/hydro
# 1) 단위 테스트 + TZ 독립성 (항목 5·6·7·8·10·11, 1·2 일부)
npm test && TZ=UTC npm test && TZ=Asia/Seoul npm test && TZ=America/Los_Angeles npm test
# 2) 타입·빌드
npx tsc --noEmit && bash $SP/qa-env.sh restart          # restart = rm -rf .next → next build → :4000 기동
# 3) 하위 호환 export + 신규 계약 API 존재 (exit 0이어야 함)
npx tsx $SP/planner-s1-exports-check.ts
# 4) 렌더링 검증 T1~T6 (항목 2·3·4·9) — 'S1 verify: 7/7 passed' 기대 (T7은 정보용)
cd $SP && node planner-s1-verify.js
# 5) 전 라우트 회귀 감사 — audit-baseline.json 대비: art-unbroken OVERFLOW 소멸, 신규 OVERFLOW·CONSOLE 0
cd $SP && node audit.js s1
# 6) D1 네트워크 실검증 (빈 출력이면 통과) / CSS 클래스 존재 (전부 OK)
cd /home/user/hydro && for id in $(grep -ohE "photo-[0-9]+-[0-9a-f]+" src/lib/utils.ts src/lib/constants.ts | sort -u); do curl -s -o /dev/null -m 15 -w "%{http_code} $id\n" -I "https://images.unsplash.com/$id?w=64&q=10"; done | grep -v '^200'
CSS=$(ls .next/static/css/*.css); for c in border-l-indigo-500 text-violet-400 'bg-cyan-500\\/10' border-l-blue-400 border-blue-500 border-gray-500 border-red-500; do grep -q "\.$c[{:,]" $CSS && echo "OK $c" || echo "MISSING $c"; done
# 7) ICU/TZ 의존 제거
grep -nE "toLocale|Intl\." src/lib/utils.ts      # 0건
```
- 기준선 대비 확인용 원본 자료: `$SP/audit-baseline.json`, `$SP/planner-s1-wrap-experiment.json`, `$SP/planner-s1-shots/`.
- 현재(수정 전) 코드에서 `planner-s1-verify.js`는 T1·T2·T3·T5·T6 FAIL, `planner-s1-exports-check.ts`는 신규 API 누락으로 exit 1 — 도구가 결함을 실제로 잡는지 확인을 마쳤다.

**회귀 안전 체크리스트**
- [ ] 기존 export 16개(utils)·8개(constants) 이름·종류 유지, 기존 호출부 타입 오류 0 (`planner-s1-exports-check.ts`, `tsc`)
- [ ] 양의 정수 id의 대체 사진 매핑 불변(교체 6슬롯 제외)
- [ ] 관리자 표 기하 불변(T4), 공개 페이지 그리드·내비·티커·필 행 배치 불변(`audit.js` 신규 OVERFLOW 0)
- [ ] 토큰 팔레트 값 불변(design-tokens 스냅샷 테스트), 데스크톱 h1 40px 불변(T3)
- [ ] `npm run build` 성공, 워커 경로에서 utils 로드 정상: `npx tsx -e "import('./src/workers/normalizer.ts').then(m => console.log('OK', Object.keys(m.default ?? m)))"` → `OK [ 'normalizeArticle' ]` (부작용 없는 모듈, 현재 코드에서 확인함)

---

## 슬라이스 간 계약

S1이 제공하고 S2~S5가 사용하는 공용 API. **모든 추가는 additive** — 기존 export·시그니처·출력 형식(아래 명시한 날짜 형식 변경 제외)은 유지된다.
경로: `@/lib/utils`, `@/lib/constants` (워커는 상대 경로 `../lib/utils`). `type DateInput = Date | string | number | null | undefined`.

### A. 함수·상수

| API | 위치 | 시그니처 | 반환 / 동작 | 사용 슬라이스 |
|---|---|---|---|---|
| `formatDate` | utils | `(input: DateInput) => string` | `'YYYY.MM.DD HH:mm'` KST 24h (예 `'2026.10.01 17:03'`), 무효 → `''` | S4 기사 상세; 관리자 화면(`toLocaleString` 대체 권장) |
| `formatDateOnly` | utils | `(input: DateInput) => string` | `'YYYY.MM.DD'` KST | S3/S4 |
| `timeAgo` | utils | `(input: DateInput, now?: Date \| number) => string` | `방금 전/N분 전/N시간 전/N일 전`, 7일 이상 `'YYYY.MM.DD'`, 60초 넘는 미래 → `formatDate`, 무효 → `''` | S3 카드, S4 |
| `toIsoDateTime` | utils | `(input: DateInput) => string \| undefined` | ISO-8601 UTC(`…Z`), `<time dateTime>`용 | S3/S4 |
| `toKstParts` | utils | `(input: DateInput) => KstParts \| null` | `{year,month,day,hour,minute,second,weekday}` (KST, weekday 0=일) | S2(LiveClock을 KST로 맞출 경우, 선택) |
| `parseIntParam` | utils | `(raw: unknown, opts: {min:number; max:number; fallback:number}) => number` | ASCII 숫자 문자열/정수만 인정, 해석 불가 → fallback, 값은 [min,max] clamp | S4/S5 API의 `page`·`limit` |
| `parsePage` | utils | `(raw: unknown) => number` | 1 ≤ 정수 ≤ `MAX_PAGE` (배열은 첫 요소) | S4 모든 목록 페이지·검색 페이지·목록 API |
| `MAX_PAGE` / `BREAKING_ITEMS_PER_PAGE` / `ITEMS_PER_PAGE` | constants | `10_000` / `30` / `20` | 페이지 상한·페이지당 개수 | S4 `queries.ts`(하드코딩 20/30 대체) |
| `getArticleImageSources` | utils | `(a: {id: number\|string; imageUrl?: string\|null; categoryPrimary?: string\|null}) => string[]` | `[프록시 원본?, Unsplash 대체, IMAGE_PLACEHOLDER_SRC]`, 마지막은 항상 플레이스홀더, 결정적 | S3 `NewsCard`·`NewsCardLarge`·`ArticleHeroImage`, S4 기사 상세 |
| `IMAGE_PLACEHOLDER_SRC` | constants | `string` (data URI SVG, 800×500) | 절대 실패하지 않는 최종 대체 이미지 | S3 |
| `getDefaultImage` | utils | `(category?: string\|null, articleId?: number\|string\|null) => string` | 항상 유효한 Unsplash URL (기존 시그니처 확장) | 기존 호출부 호환 |
| `CATEGORY_COLORS` / `getCategoryStyle` | constants / utils | `(slug: string) => CategoryStyle` | `{border, text, bg, borderAll}` — `borderAll`은 전체 테두리 색 클래스(예 `'border-blue-500'`) | S3 카드, S4 기사 상세·홈·카테고리 |
| `getDisplayTitle` | utils | `(a: {titleKo?: string\|null; titleOriginal: string; language?: string\|null}) => {text: string; lang: string\|undefined; isTranslated: boolean}` | 번역 제목 우선, echo·공백은 미번역 취급, 원문이면 원문 언어 태그 | S3 카드·티커·컴팩트, S4 기사 상세·메타데이터·관리자 |
| `toLangTag` | utils | `(language: string\|null\|undefined) => string\|undefined` | `lang` 속성용 정규화 태그 | S4 원문 본문 블록, S3 |
| `isValidArticleImage` / `normalizeImageUrl` / `proxyImageUrl` | utils | 기존 시그니처 | http(s)만 유효, `//` URL도 https로 프록시 | S5 워커·`/api/admin/fix-images`, S3 |
| `CATEGORY_PHOTOS` | utils | `Readonly<Record<string, readonly string[]>>` | 카테고리별 Unsplash ID 4개 | 테스트 전용(직접 사용 지양) |

### B. CSS·토큰 계약

| 항목 | 내용 | 영향 슬라이스 |
|---|---|---|
| 전역 줄바꿈 | `body`: `overflow-wrap:anywhere; word-break:keep-all` / `:lang(ja),:lang(zh)`: `word-break:normal` / `table`: `break-word`+`normal`. 컴포넌트에 `break-all`을 쓰지 말 것. `whitespace-nowrap`은 짧은 UI 라벨에만(기사 제목·본문·태그·저자 등 데이터 텍스트에 금지). 그래도 넘치는 flex 행이 발견되면 해당 아이템에 `min-w-0`을 지역적으로 추가 | S2·S3·S4 |
| `text-headline-xl` | 유동 크기(28px→40px). 기사 h1은 별도 반응형 클래스 불필요 | S4 |
| `.scrollbar-hide` | `.scrollbar-none`과 동일 동작 | S4 (기존 클래스 그대로 사용 가능) |
| 테두리 기본색 | 색 미지정 `border`는 다크 토큰 #30363d | 전 슬라이스 |
| Tailwind 스캔 범위 | `src/app`·`src/components`·`src/lib`·`src/hooks`. **클래스는 항상 완전한 리터럴 문자열로**(문자열 치환·조합으로 만든 클래스는 생성되지 않음) | 전 슬라이스 |

### C. 사용 규칙 (뒤 슬라이스 필수 준수)

1. **상대 시간 하이드레이션 (S3, S4)**: 클라이언트 컴포넌트에서 `timeAgo`는 반드시 텍스트의 직접 부모 요소에 `suppressHydrationWarning`:
   `<time dateTime={toIsoDateTime(article.publishedAt)} suppressHydrationWarning>{timeAgo(article.publishedAt)}</time>`
   (아이콘 `<svg>`와 같은 `span`에 텍스트를 섞어 두는 경우에도 그 `span`에 붙이면 동작하지만, `<time>`으로 감싸는 형태를 표준으로 한다.) 서버 컴포넌트·절대 형식(`formatDate`)에는 불필요.
2. **이미지 체인 (S3)**: `const sources = getArticleImageSources(article)` → `src = sources[idx]`; `onError` 시 `idx = min(idx+1, sources.length-1)`; **D3 대응으로 마운트 직후 `img.complete && img.naturalWidth === 0`이면 한 단계 전진**(하이드레이션 전에 난 오류 복구). 마지막 플레이스홀더는 절대 실패하지 않으므로 같은 src 재설정 루프가 생기지 않는다. 플레이스홀더를 `isValidArticleImage`로 검사하지 말 것. 대체 사진·플레이스홀더가 모두 16:10(800×500)이므로 고정 비율 컨테이너(예 `aspect-[16/10]`, D4)와 맞는다.
3. **빌드 호환 순서 (S3 → S4)**: S3는 `ArticleHeroImage`에 `sources?: string[]`를 **추가**하되 기존 `src`/`fallback`/`alt` props를 유지해 S4 차례 전에도 빌드가 깨지지 않게 한다. S4가 기사 상세에서 `sources={getArticleImageSources(article)}`로 전환한다.
4. **페이지 파라미터 (S4, API)**: `const page = parsePage(searchParams.page)`(클라이언트는 `parsePage(searchParams.get('page'))`). `page > totalPages && total > 0`(범위 초과)일 때의 처리(마지막 페이지로 `redirect` 또는 "해당 페이지 없음" 안내 + 1페이지/마지막 페이지 링크)와 "새로고침" 오안내 제거는 S4 결정 사항. API의 `limit`은 `parseIntParam(raw, {min:1, max:100, fallback:20})` 형태 권장.
5. **언어 표기 (S3, S4)**: 제목은 `const t = getDisplayTitle(article)` → `<h3 lang={t.lang}>{t.text}</h3>`. 원문 본문(`contentOriginal`)·원제목 보조줄을 보여줄 때 컨테이너에 `lang={toLangTag(article.language)}`. 번역문에는 붙이지 않아도 됨(문서 `lang="ko"` 상속).
6. **카테고리 배지 (S4)**: 기사 상세의 `catStyle.border.replace('border-l-','border-')`를 `catStyle.borderAll`로 교체(S1 이후엔 기존 코드도 동작하지만 동적 클래스 조합은 금지 규칙 위반).
7. **테스트 (전 슬라이스, D25)**: 순수 로직은 `src/lib/` 등 React 의존 없는 모듈에 두고 `tests/<영역>.test.ts`(node:test + node:assert/strict, 상대 import, 네트워크 금지, 신규 의존성 금지)로 검증. `npm test`가 `tests/*.test.ts`를 모두 실행하며 `next build`가 테스트 파일도 타입 검사한다.
