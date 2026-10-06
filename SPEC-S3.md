# S3 콘텐츠 컴포넌트 개선 설계서 (Round 5 · 결함 수정 라운드)

> 사용자 요청: "전체적으로 뉴스 번역이 잘안되고 있고 화면이 깨지는게 있어 모두 점검 하고 수정 하고 테스트까지 완료 해줘"
> 근거: `QA_BASELINE-R5.md`(D2·D3·D4·D5·D11·D25), `QA_REPORT-S1.md` 지시 3·4, `QA_REPORT-S2.md` 지시 3, SPEC-S1/S2 "슬라이스 간 계약".
> 이번 라운드는 **결함 수정 라운드**다. 모든 항목은 결함 ID 또는 `파일:라인` 근거에 연결되며, 근거 없는 신규 기능·AI 기능은 넣지 않는다(planner.md 원칙 2는 이번 라운드 규칙으로 대체).

```
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
```

---

## 현재 상태 분석

### 장점 (유지)
- 카드 3종(`NewsCard`·`NewsCardLarge`·`NewsCardCompact`)이 S1 토큰(surface/border/text/accent, `rounded-card`, `text-headline-*`)만 사용 — 다크 팔레트 일관.
- 카드 이미지 박스는 이미 고정 높이(`h-[160px] sm:h-[180px]`, `h-[200px] sm:h-[260px]`)라 카드 그리드가 이미지 실패로 무너지지 않음.
- `AdSlot`은 `NEXT_PUBLIC_ADS_ENABLED === 'true'`일 때만 렌더(플래그 패턴의 원형), `BookmarkButton`은 `hydrated` 이후에만 활성 표시(하이드레이션 안전), `CountryTabs`는 `overflow-x-auto scrollbar-none`로 넘침 없음 — **세 파일은 결함 없음, 변경 금지(회귀 대상)**.
- `prefers-reduced-motion`이 `globals.css:58`에서 티커 애니메이션까지 정지.

### 결함 (Planner 실측, 현재 빌드 :4000, 외부망 차단 = 최악 조건)

`node $SP/planner-s3-verify.js` 현재 결과 **0/8 PASS**:

| 테스트 | 결함 | 현재 실측 |
|---|---|---|
| T1 | D2 | 8개 라우트(스크롤 후) 깨진 이미지: 홈 27, `/breaking?page=14` 19, `/japan` 20, `/ranking` 30, 검색 20, 기사 상세 각 7. 전부 alt 텍스트가 보일 수 있는 상태(`alt=제목`, color 불투명). 증거 `peek/m-home-0.jpg`(헤드라인 자리에 "미 연준, … (#0)" alt 텍스트), `peek/m-break7-14.jpg` |
| T2 | D3 | JS를 2.5초 지연(하이드레이션 전 실패 재현) → 홈 18, `/breaking` 27, 기사 7 깨짐. 최신 감사 `audit-s2-eval.json`의 `/api/img` 깨짐 45건은 **전부 `ArticleHeroImage`**(plain `<img>`, 하이드레이션 전 실패 시 `onError` 미호출). 카드도 `onError={() => setImgSrc(fallback)}`(NewsCard.tsx:33, NewsCardLarge.tsx:33)가 Unsplash까지 실패하면 같은 URL을 다시 넣어 영구 깨짐 |
| T3 | D4 | 히어로 높이 = alt 텍스트 높이: 375px `351×48`/`351×24`, 768px `736×24`, 1440px `864×24` (`ArticleHeroImage.tsx:12` `h-auto max-h-…`, 비율 없음). 증거 `peek/m-bodyuntr-0.jpg` |
| T4 | D5 | 375px `/breaking?page=7` 문서 폭 438(nav 426/351, 버튼 4개 화면 밖). **320px에서는 1페이지조차 넘침**: `/breaking` 306/296, `?page=2` 329/296, `?page=13` 329/296, `/world?page=3` 325/288. `/breaking?page=999` → "이전"이 존재하지 않는 998페이지로 링크(`Pagination.tsx:49,66`) |
| T5 | S1 지시 3 | 일본어·중국어 원문 제목 카드(`/breaking?page=14`, `/search?q=日本`, `/search?q=中国`) `lang=ko` 상속 → `word-break: keep-all` → 구두점에서만 줄바꿈 |
| T6 | S1 계약 C-1 | 카드 상대시간이 `<time>` 없이 `<span>` 안에 svg와 섞여 있음(`NewsCard.tsx:51-54`, `NewsCardLarge.tsx:60-63`, `NewsCardCompact.tsx:33`) — 0/27(홈), 0/30(속보) |
| T7 | D11 | 플래그 off인데 홈·world·us·japan·china main에 email 입력 1개씩, 제출 시 저장 없이 `setSubmitted(true)` → "구독 완료!"(`NewsletterBanner.tsx:30-34, 56-58`) |
| T8 | D2 연관 | 카드마다 이미지 링크와 제목 링크가 같은 기사로 중복(탭 정지 2회, 스크린리더 제목 2번 낭독), 이미지 `alt`=제목(`NewsCard.tsx:25-28`, `NewsCardLarge.tsx:25-28`) — 대체 사진(신문·차트 Unsplash)에 기사 제목을 alt로 붙이는 것은 사실과 다른 설명 |

추가 코드 근거 결함:
- **S3-A** `BreakingTicker.tsx:46` 제목 폴백 복제 + `lang` 없음, `types.ts:44-48` `TickerArticle`에 `language` 필드 없음(홈 `page.tsx:61-65`가 넘길 수 없음). `BreakingTicker.tsx:81-83` hover만 일시정지 → 키보드 포커스한 링크가 계속 흘러가 화면 밖으로 사라짐. `:19-21` `role="marquee"` + `aria-live="polite"` 모순(marquee는 암묵적 live=off인 비필수 콘텐츠).
- **S3-B** `ShareButtons.tsx:52-62` 클립보드 폴백에서 `document.execCommand('copy')`가 `false`를 반환해도 "복사됨" 표시(D11과 같은 가짜 성공 유형), 상태 변화가 보조기기에 안 알려짐.
- **S3-C** `TrendingKeywords.tsx:25` 빈 상태 문구 "데이터를 불러오는 중입니다."는 로딩이 일어나지 않는 서버 컴포넌트의 거짓 안내(D8 "불러오는 중 · 새로고침" 오안내와 같은 유형).
- **S3-D** 이미지 소스 결정 로직이 3곳에 복제(`NewsCard.tsx:16-19`, `NewsCardLarge.tsx:16-19`, `article/[id]/page.tsx:97-98`) — S1이 `getArticleImageSources`로 단일화했으나 미사용.

### 실측 메모 (Generator 참고)
- 플레이스홀더 `IMAGE_PLACEHOLDER_SRC`는 Chromium 141에서 `complete=true, naturalWidth=240, naturalHeight=150`(viewBox 비율) — **깨진 이미지로 오인되지 않음**, 마운트 검사가 플레이스홀더에서 오작동하지 않음(`$SP/planner-s3-svgnw.js`).
- `next/image`(14.2.18)는 ref 콜백에서 `img.src = img.src`로 하이드레이션 전 오류를 재발생시키지만, 대체 URL도 실패하면 같은 값 재설정이라 깨짐이 남는다. 이번 설계는 **plain `<img>` + 마운트 검사**로 통일한다(`next.config.js` 이미지 최적화를 쓰지 않음 — 카드도 이미 `unoptimized`).
- 클라이언트 이동(`/article/1` → 관련 기사 클릭) 시 히어로는 새 `src`로 바뀜을 확인(`$SP/planner-s3-nav.js`) — 상태 고착 결함은 없음. 단, 공용 컴포넌트는 `sources`가 바뀌면 단계 인덱스를 0으로 되돌려야 한다(아래 항목 1 불변식).

---

## 디자인 방향

- **기존 다크 모던 토큰 유지**(Bloomberg/Reuters 톤). 새 색·새 애니메이션·그라데이션 장식 추가 금지. 보라 그라데이션·흰 카드 같은 AI slop 금지.
- **"고장 나도 단정하게"**: 이미지 서버가 죽어도 카드·히어로는 같은 크기의 어두운 프레임(`#21262d` 바탕 + `#30363d` 사진 아이콘 플레이스홀더)으로 남는다. 깨진 아이콘·alt 문장·쪼그라든 박스는 0.
- **차별화 1 — 언어를 존중하는 타이포**: 원문 제목은 원문 언어로 표기(`lang`)해 일본어·중국어는 글자 단위, 한국어는 어절 단위로 줄바꿈. 번역 실패 기사도 "원문 그대로, 그러나 깔끔하게" 보인다.
- **차별화 2 — 터미널식 페이지 이동**: 모바일 페이지네이션은 `‹ 1 … 7 … 14 ›` 고정 5칸 + 등폭 숫자(`tabular-nums`)로 금융 터미널처럼 폭이 흔들리지 않게.

---

## 대상 파일 목록

| 파일 | 변경 |
|---|---|
| `src/components/ArticleImage.tsx` | **신규** — 공용 이미지 체인 컴포넌트 (항목 1) |
| `src/lib/pagination.ts` | **신규** — 순수 페이지 범위 계산 (항목 4) |
| `tests/pagination.test.ts`, `tests/image-chain.test.ts` | **신규** — 단위 테스트 (항목 10) |
| `src/lib/image-chain.ts` | **신규** — 히어로 하위 호환 소스 해석 + 단계 전진 순수 함수 (항목 1·3) |
| `src/components/NewsCard.tsx`, `NewsCardLarge.tsx` | 이미지·제목·시간·장식 링크 (항목 2·5·6·8) |
| `src/components/ArticleHeroImage.tsx` | 고정 비율 + `sources` + 하위 호환 (항목 3) |
| `src/components/Pagination.tsx` | 모바일 압축·범위 안전 (항목 4) |
| `src/components/NewsCardCompact.tsx` | 제목·시간 (항목 5·6) |
| `src/components/BreakingTicker.tsx` | 제목 `lang`·키보드 정지·ARIA (항목 5·9) |
| `src/components/NewsletterBanner.tsx` | 플래그 게이트·정직한 결과 (항목 7) |
| `src/components/ShareButtons.tsx` | 복사 결과 정직 표시 (항목 11) |
| `src/components/TrendingKeywords.tsx` | 빈 상태 문구 (항목 11) |
| `src/lib/types.ts` | `TickerArticle.language?` (항목 5) |

**변경 금지**: `CountryTabs.tsx`, `BookmarkButton.tsx`, `AdSlot.tsx`(결함 없음), S1 파일(`utils.ts`·`constants.ts`·`globals.css`·`tailwind.config.ts`), S2 파일(`newsletter.ts`·`site.ts`·`Header`·`Footer`·`layout`), **모든 `src/app/**/page.tsx`(S4)**, 워커·API·DB 스키마.

---

## 개선 항목

### 항목 1 [P0 · D2/D3]: 공용 `ArticleImage` — 대체 체인을 끝까지 진행하는 이미지
- **대상 파일**: `src/components/ArticleImage.tsx`(신규, `'use client'`), `src/lib/image-chain.ts`(신규, 순수)
- **현재 문제**: D2(대체까지 실패하면 같은 URL 재설정 → 깨진 아이콘+alt), D3(하이드레이션 전 실패 시 `onError` 미호출 → 영구 깨짐, `/api/img` 45건), S3-D(소스 결정 3곳 복제).
- **개선 방법**:
  ```ts
  // src/lib/image-chain.ts (React 의존 없음)
  export function nextImageIndex(idx: number, length: number): number; // min(idx+1, length-1), length<=0 → 0
  export function resolveImageSources(p: { sources?: readonly string[] | null; src?: string | null; fallback?: string | null }): string[];
  //  sources가 비어 있지 않으면 그 값(빈 문자열 제거), 아니면 [src, fallback]의 비어 있지 않은 값;
  //  마지막이 IMAGE_PLACEHOLDER_SRC가 아니면 덧붙임; 중복 제거. 결과는 항상 길이 ≥1, 마지막 = 플레이스홀더.

  // src/components/ArticleImage.tsx
  export default function ArticleImage(props: {
    sources: readonly string[];          // 보통 getArticleImageSources(article)
    alt?: string;                        // 기본 '' (장식)
    className?: string;                  // 크기·object-fit은 부모 박스 기준(예 'absolute inset-0 h-full w-full object-cover')
    loading?: 'lazy' | 'eager';          // 기본 'lazy'
  }): JSX.Element;
  ```
  - 내부: `list = resolveImageSources({ sources })`, `const [idx, setIdx] = useState(0)`, `src = list[min(idx, list.length-1)]`.
  - `onError={() => setIdx(i => nextImageIndex(i, list.length))}` — 마지막(플레이스홀더)에서는 같은 인덱스 유지 → 재설정 루프 없음.
  - **D3 마운트 검사**: `ref` + `useEffect(() => { const img = ref.current; if (img && img.complete && img.naturalWidth === 0) setIdx(i => nextImageIndex(i, list.length)); }, [src])` — 하이드레이션 전에 이미 실패한 이미지를 한 단계 전진(전진 후 새 src는 정상 이벤트로 처리). 아직 로딩 중(`complete=false`)이면 아무것도 안 함.
  - **소스 변경 시 리셋**: `list.join('\n')`가 바뀌면 `idx`를 0으로(예: 내부를 `key={list.join('\n')}` 자식으로 감싸거나 이전 키 state 비교). 같은 인스턴스가 다른 기사로 재사용돼도 이전 기사의 단계가 남지 않게.
  - `<img>` 속성: `src`, `alt`(기본 `''`), `loading`, `decoding="async"`, `draggable={false}`, `className`에 **항상 `text-transparent`** 병합(전환 순간에도 alt 문장이 그려지지 않음). `next/image` 미사용, `// eslint-disable-next-line @next/next/no-img-element` 주석 허용. `fetchPriority` prop 금지(React 18.3 미지원 경고).
  - 플레이스홀더를 `isValidArticleImage`로 검사하지 말 것(S1 계약 C-2).
- **기대 효과**: 원본 → Unsplash → 인라인 SVG로 반드시 수렴, 깨진 아이콘·alt 노출 0(최악 조건 포함), 소스 결정 단일화.
- **검증 방법**: `node $SP/planner-s3-verify.js` **T1**(8개 라우트 스크롤 후 깨진 이미지 0, alt 가시 0), **T2**(JS 2.5초 지연 = 하이드레이션 전 실패 재현 → 깨짐 0); `cd $SP && node audit.js s3` 전 라우트×3뷰포트 `BROKEN_IMG` **0건**(기준선 1,257); `npm test`의 `image-chain` 케이스(항목 10).

### 항목 2 [P0 · D2 · S3-D]: `NewsCard`·`NewsCardLarge`를 공용 이미지로 전환 + 장식 이미지 링크
- **대상 파일**: `src/components/NewsCard.tsx`(6, 16-35), `src/components/NewsCardLarge.tsx`(6, 16-34)
- **현재 문제**: 자체 `useState(initial)` + `onError → fallback` 2단계(D2), `next/image`, 이미지 링크·제목 링크 중복, `alt=제목`(T8).
- **개선 방법**:
  - `const sources = getArticleImageSources(article)` → `<ArticleImage sources={sources} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />`. `getDefaultImage`·`isValidArticleImage`·`normalizeImageUrl`·`proxyImageUrl`·`useState`·`next/image` import 제거.
  - 이미지 박스 크기는 **현행 유지**(`h-[160px] sm:h-[180px]`, `h-[200px] sm:h-[260px]`, `relative overflow-hidden bg-surface-elevated`) — 그리드 기하 회귀 방지.
  - 이미지 `<Link>`에 `tabIndex={-1}` + `aria-hidden="true"`, 이미지 `alt=""`. 기사로 가는 접근 가능한 링크는 제목 링크 하나(마우스 클릭 영역은 그대로).
  - `NewsCardLarge`의 그라데이션 오버레이·오버레이 배지·`BookmarkButton` 위치는 그대로(배지는 `aria-hidden` 링크 안에 있으므로 카테고리 텍스트가 보조기기에서 사라짐 → 배지를 링크 **밖** 형제(`absolute bottom-3 left-3`, `pointer-events-none`)로 옮겨 텍스트를 유지).
- **기대 효과**: 카드 깨짐 0, 카드당 탭 정지 1회 감소, 거짓 alt 제거, 중복 코드 제거.
- **검증 방법**: verify **T1**, **T8**(`/breaking` 카드 30개 전부 `img[alt=""]`, 이미지 링크 `tabindex=-1`·`aria-hidden=true`); `grep -nE "next/image|getDefaultImage|setImgSrc" src/components/NewsCard*.tsx` → **0건**; 1440 `/breaking` 카드 이미지 박스 높이 180·260px(기존과 동일), `peek.js desktop /breaking` 육안으로 Large 카드 배지가 이미지 좌하단에 그대로 표시.

### 항목 3 [P0 · D3/D4]: `ArticleHeroImage` 고정 비율 + `sources` + 하위 호환
- **대상 파일**: `src/components/ArticleHeroImage.tsx`, `src/lib/image-chain.ts`
- **현재 문제**: plain `<img>` + `h-auto max-h`(비율 없음) → 실패 시 24~48px로 쪼그라듦(D4), 하이드레이션 전 실패 복구 불가(D3), 대체 실패 시 깨진 아이콘(D2).
- **개선 방법**:
  ```ts
  export default function ArticleHeroImage(props: {
    sources?: readonly string[];  // 신규 — S4가 getArticleImageSources(article)로 전환
    src?: string; fallback?: string;   // 기존 — 유지(하위 호환), sources 없을 때만 사용
    alt?: string;                 // 기존 — 받되 기본 ''(텍스트는 투명 처리)
  })
  ```
  - `list = resolveImageSources({ sources, src, fallback })` → 마지막은 항상 플레이스홀더. **S4가 page를 바꾸기 전에도**(현재 `src`/`fallback` 호출) 플레이스홀더·비율·D3 복구가 적용된다.
  - 렌더: `<div className="relative w-full aspect-[16/10] sm:aspect-[2/1] bg-surface-elevated"><ArticleImage sources={list} alt={alt ?? ''} loading="eager" className="absolute inset-0 h-full w-full object-cover" /></div>`. 16:10은 대체 사진·플레이스홀더(800×500)와 같은 비율, sm 이상 2:1은 기존 `max-h-[450px]`에 대응(864px 폭 → 432px).
- **기대 효과**: 히어로가 어떤 실패에서도 같은 크기의 어두운 프레임 유지, 본문 위치가 이미지 로딩·실패로 흔들리지 않음(CLS 0).
- **검증 방법**: verify **T3**(375: 높이/폭 = 0.625±0.02, 768·1440: 0.5±0.02, `/article/393`·`/356`·`/1`), **T2**(`/article/393`·`/article/1` 하이드레이션 전 실패 복구); `npx tsc --noEmit`이 **현재 S4 호출부(`src`/`fallback`/`alt`) 그대로** 0 오류.

### 항목 4 [P0 · D5]: `Pagination` 모바일 압축 + 범위 안전
- **대상 파일**: `src/components/Pagination.tsx`, `src/lib/pagination.ts`(신규)
- **현재 문제**: D5 — `getPageRange`(26-43)가 가변 개수(최대 9칸) + 버튼 `min-w-[2.5rem]`·`gap-1.5` → 375px 중간 페이지 438px, **320px은 1·2·13·14페이지와 `/world?page=3`도 넘침**. `currentPage > totalPages`(예 `?page=999`)면 "이전"이 존재하지 않는 998페이지로 링크(49, 66). `currentPage`가 NaN이어도 방어 없음.
- **개선 방법**:
  ```ts
  // src/lib/pagination.ts
  export type PageItem = number | 'gap';
  export function getPageItems(current: number, total: number, siblings: number): PageItem[];
  export function getPrevNext(current: number, total: number): { prev: number | null; next: number | null };
  ```
  - 정규화: `total` = 유한 정수 아니면 1, 최소 1. `current` = 유한 정수 아니면 1, `[1, total]`로 clamp(범위 계산용).
  - `getPageItems`는 **고정 슬롯** 알고리즘: `total ≤ 2*siblings + 5`면 1..total 전부; 아니면 길이가 정확히 `2*siblings + 5`, 항상 1·total·current 포함, 숫자 오름차순, `'gap'`은 연속하지 않으며 **정확히 한 페이지만 숨기는 gap은 그 페이지 번호로 대체**.
    - siblings=0, total=14: c=1·2·3 → `[1,2,3,'gap',14]`; c=4 → `[1,'gap',4,'gap',14]`; c=7 → `[1,'gap',7,'gap',14]`; c=11 → `[1,'gap',11,'gap',14]`; c=12·13·14 → `[1,'gap',12,13,14]`.
    - siblings=2, total=14: c=1 → `[1,2,3,4,5,6,7,'gap',14]`; c=7 → `[1,'gap',5,6,7,8,9,'gap',14]`; c=14 → `[1,'gap',8,9,10,11,12,13,14]`.
  - `getPrevNext`: 원래 `current`가 유효 정수일 때 `prev = current > 1 ? min(current-1, total) : null`, `next = current < total ? current+1 : null` (→ `?page=999`, total 14 이면 prev=14, next=null). 생성되는 모든 링크는 `1..total` 안.
  - 렌더: 모바일(<sm) 목록 = `getPageItems(c, t, 0)`, sm 이상 = `getPageItems(c, t, 2)`(기존 데스크톱 모습 유지). 두 목록을 각각 `flex sm:hidden` / `hidden sm:flex` 래퍼로 렌더하거나 항목별 가시성 클래스로 한 목록에 합쳐도 됨 — 숨겨진 쪽은 `display:none`(보조기기 중복 없음).
  - 모바일 치수: 버튼 `h-10 min-w-9 px-1.5 tabular-nums`, gap 표시 `w-5`, 간격 `gap-1`. 예산: 화살표 2×36 + 숫자 3칸(3자리까지 각 ≤40) + gap 2×20 + 간격 6×4 = 최대 256px ≤ 320px 화면의 콘텐츠 폭 288px. sm 이상은 기존 `h-10 min-w-[2.5rem] gap-1.5` 유지.
  - 안전망: nav에 `flex-wrap justify-center` (예산을 넘는 극단값(5자리 페이지)에서도 넘치지 않고 줄바꿈). `aria-current="page"`·활성 스타일은 **원래 `currentPage`가 그 번호와 같을 때만**(범위 밖 페이지에서 14를 현재로 거짓 표시하지 않음). 기존 `aria-label`(이전/다음/N 페이지)·`buildHref` 동작(`[page]` 치환 또는 `?page=`/`&page=` 추가) 유지.
- **기대 효과**: 320~375px에서 이전/다음과 처음/끝이 항상 화면 안, 문서 폭 확장 0, 존재하지 않는 페이지 링크 0.
- **검증 방법**: verify **T4**(320·375 × `/breaking`, `?page=2,7,13,14,999`, `/world?page=3`, `/category/economy?page=2`: 문서 폭 ≤ 뷰포트, nav `scrollWidth ≤ clientWidth`, 한 줄, 화면 밖 항목 0, `?page=999`에서 15 이상 링크 0); `npm test`의 pagination 케이스(항목 10); audit `OVERFLOW` 기준선 `mobile breaking-p7` 소멸.

### 항목 5 [P0 · S1 지시 3 / 계약 C-5]: 카드·티커·컴팩트 제목 `getDisplayTitle` + `lang`
- **대상 파일**: `NewsCard.tsx:11,63-65`, `NewsCardLarge.tsx:11,72-74`, `NewsCardCompact.tsx:4-11,16,28-30`, `BreakingTicker.tsx:46,53-58`, `src/lib/types.ts:44-48`
- **현재 문제**: `article.titleKo || article.titleOriginal` 폴백 4곳 복제, 공백 `titleKo`·영어 echo 제목(D17 표시 측면)을 번역으로 취급, 원문 제목에 `lang` 없음 → 일·중 원문이 `keep-all`로 구두점에서만 줄바꿈(T5).
- **개선 방법**:
  - `const t = getDisplayTitle(article)` → `<h3 lang={t.lang} …>{t.text}</h3>`(Large는 h2, Compact는 h4 — 태그 레벨 유지). `lang`은 **제목 요소 자체**에 둔다(Evaluator가 계산된 `word-break`를 그 요소에서 읽음).
  - `NewsCardCompact` Props `article`에 `language?: string | null` 추가(홈은 Prisma 행 전체를 넘기므로 즉시 적용됨).
  - `types.ts` `TickerArticle`에 `language?: string | null` 추가(선택 필드 → 홈 `page.tsx`의 현재 매핑도 타입 통과). 티커 `<Link lang={t.lang}>`. 홈이 `language`를 넘기는 것은 S4(계약 참조).
  - `alt`·`ShareButtons` 등 다른 곳에 제목 문자열이 필요하면 `t.text` 사용. 요약(`summaryKo`)은 한국어라 `lang` 불필요.
- **기대 효과**: 일·중 원문 제목은 글자 단위 자연 줄바꿈, 한국어 제목은 어절 단위(keep-all) 유지, 영어 echo 제목은 `lang="en"`로 스크린리더가 영어로 낭독.
- **검증 방법**: verify **T5**(375 `/breaking?page=14`·`/search?q=日本`·`/search?q=中国`: 일·중 제목 요소의 가장 가까운 `[lang]`이 `ja`/`zh*`, computed `word-break: normal`; 한국어 제목은 `keep-all`); `grep -nE "titleKo \|\| |titleKo\|\|" src/components` → **0건**; `peek.js mobile "/breaking?page=14" peek/s3-cjk 3` 육안으로 일·중 제목이 줄 끝까지 채워짐.

### 항목 6 [P1 · S1 계약 C-1 / D7]: 상대시간 `<time dateTime>` + 하이드레이션 안전
- **대상 파일**: `NewsCard.tsx:51-54`, `NewsCardLarge.tsx:60-63`, `NewsCardCompact.tsx:33`
- **현재 문제**: 클라이언트 카드에서 `timeAgo`(현재 시각 의존)를 svg와 같은 `<span>`에 직접 출력 — 서버/브라우저 렌더 사이 분 경계를 넘으면 텍스트 불일치(D7 계열), 기계 판독 가능한 시각 없음.
- **개선 방법**: 아이콘 span은 유지하고 텍스트만 `<time dateTime={toIsoDateTime(article.publishedAt)} suppressHydrationWarning>{timeAgo(article.publishedAt)}</time>`로 감싼다. `publishedAt`이 null/무효면(`toIsoDateTime` → `undefined`, `timeAgo` → `''`) **시간 span 전체를 렌더하지 않음**(빈 시계 아이콘 제거, 픽스처 `art-nulldate` 계열). `NewsCardCompact`(서버 컴포넌트)도 같은 `<time>` 형태(일관성, `suppressHydrationWarning` 무해).
- **기대 효과**: 하이드레이션 경고 원인 제거, 날짜 없는 기사에서 빈 아이콘 제거, 의미 있는 마크업.
- **검증 방법**: verify **T6**(`/`, `/breaking`, 검색, `/article/1` 관련 기사: 모든 카드가 `time[datetime$="Z"]`를 갖거나 — 날짜 없는 카드는 — 시계 아이콘 자체가 없음, 컴팩트 카드 전부 `<time>`, hydration/page 오류 0; 상세 본문 `<article>`(h1 포함)은 제외); 코드 확인: `suppressHydrationWarning`이 `timeAgo` 텍스트의 **직접 부모**인 `<time>`에 있음.

### 항목 7 [P1 · D11 / S2 계약 C · QA_REPORT-S2 지시 3]: `NewsletterBanner` 플래그 게이트 + 정직한 결과
- **대상 파일**: `src/components/NewsletterBanner.tsx`
- **현재 문제**: 플래그 off에서도 렌더, `handleSubmit`이 아무것도 보내지 않고 `setSubmitted(true)` → "구독 완료!"(30-34, 56-58), 입력에 레이블 없음(72-83, placeholder만).
- **개선 방법**:
  - `import { NEWSLETTER_ENABLED, subscribeNewsletter } from '@/lib/newsletter'`. 훅 선언 이후 `if (!NEWSLETTER_ENABLED || dismissed) return null;`(`process.env` 직접 읽기 금지).
  - 상태 `'idle' | 'submitting' | 'success' | 'error'` — `Footer.tsx:28-90`의 폼과 같은 패턴·문구: 제출 시 `submitting`(버튼 `disabled`), `const r = await subscribeNewsletter(email)` → `r.ok`일 때만 성공 문구, 아니면 `reason === 'invalid'`면 "올바른 이메일 주소를 입력해 주세요.", 그 외 "구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." 결과 영역 `role="status" aria-live="polite"`.
  - `<label htmlFor="banner-newsletter-email" className="sr-only">이메일 주소</label>` + `id`. 닫기 버튼·localStorage 키(`livenews_newsletter_dismissed`)·시각 디자인 유지. 성공 문구에서 "매일 아침 … 보내드리겠습니다" 같은 약속성 문장 제거(발송 기능 없음) → "구독 신청이 접수되었습니다."
- **기대 효과**: 기본 배포에서 가짜 폼 0, 플래그를 켜도 거짓 성공 0(엔드포인트 미구현 → 정직한 실패).
- **검증 방법**: verify **T7**(플래그 미설정 빌드: 5개 배너 경로 main `input[type=email]` 0, "구독 완료" 0); 선택 심화 — `NEXT_PUBLIC_NEWSLETTER_ENABLED=true bash $SP/qa-env.sh restart` 후 홈에서 유효 이메일 제출 → 404 응답 → 오류 문구, "접수되었습니다" 미표시, 확인 후 **플래그 없이 다시 `restart`**; `grep -n "process.env" src/components/NewsletterBanner.tsx` → 0건.

### 항목 8 [P1 · S1 계약 B/C-6]: 카테고리 배지 클래스 규칙 준수
- **대상 파일**: `NewsCard.tsx:46`, `NewsCardLarge.tsx:40-43`
- **현재 문제**: 현재 S3 카드는 왼쪽 강조선 배지(`border-l-2` + `catStyle.border`)라 올바르지만, 이번 수정(배지 이동, 항목 2)에서 전체 테두리로 바꾸거나 문자열 치환으로 클래스를 만들면 Tailwind 스캔에서 빠져 색이 사라진다(S1 실측 결함 S1-A와 같은 경로).
- **개선 방법**: 왼쪽 강조선 배지는 `catStyle.border`, 전체 테두리가 필요하면 **반드시 `catStyle.borderAll`**. `.replace(`·템플릿 조합으로 클래스 생성 금지. 배지 표시 조건(`categoryPrimary` 있을 때만)·색 체계 유지.
- **기대 효과**: 16개 카테고리 색이 카드에서 모두 유지.
- **검증 방법**: `grep -nE "\.replace\(|border-l-\\$\{|border-\\$\{" src/components/*.tsx` → **0건**; 1440 `/category/international-politics`·`/category/economy` 카드 배지 computed `border-left-color`가 회색(#6b7280)이 아님(카테고리 색).

### 항목 9 [P2 · S3-A]: `BreakingTicker` 키보드 정지·ARIA 정리
- **대상 파일**: `src/components/BreakingTicker.tsx:19-21, 81-83`
- **현재 문제**: hover에서만 정지 → Tab으로 포커스한 링크가 흘러가 화면 밖으로 사라짐(WCAG 2.2.2 정지 수단·2.4.7 포커스 가시성), `role="marquee"`와 `aria-live="polite"` 모순.
- **개선 방법**: `.animate-ticker:hover, .animate-ticker:focus-within { animation-play-state: paused; }`. 바깥 `aria-live` 제거(`role="marquee"`와 `aria-label="속보"` 유지 또는 `role="region"`). 복제본 `aria-hidden`/`tabIndex=-1` 처리·애니메이션 길이·레이아웃·색 유지. `whitespace-nowrap`은 티커 트랙의 의도된 한 줄 표시라 예외로 유지(S1 계약 B "짧은 UI 라벨" 예외에 티커를 명시).
- **기대 효과**: 키보드 사용자가 속보 링크를 읽고 선택 가능, 보조기기에 혼란스러운 live 영역 제거.
- **검증 방법**: Playwright로 1440 홈에서 티커 첫 링크 `focus()` → 1초 간격 두 번 `getBoundingClientRect().left` 동일(정지), 포커스 해제 후 변화(재개); 티커 루트에 `aria-live` 속성 없음; `prefers-reduced-motion` 동작(globals.css) 그대로.

### 항목 10 [P1 · D25]: 순수 로직 단위 테스트
- **대상 파일**: `tests/pagination.test.ts`, `tests/image-chain.test.ts`(신규). 규칙은 S1 계약 C-7(node:test, 상대 import, 네트워크·신규 의존성 금지, `next build`가 타입 검사).
- **필수 케이스**:
  | 대상 | 케이스 |
  |---|---|
  | `getPageItems` | 항목 4의 표 9개 그대로; `total ≤ 2s+5`면 1..total(예 `(3,5,0)` → `[1,2,3,4,5]`, `(2,7,1)` → 1..7); `(NaN,14,0)`·`(0,14,0)`·`(-3,14,0)` = `(1,14,0)`; `(999,14,0)` = `(14,14,0)`; `(1,NaN,0)`·`(1,0,0)` → `[1]`; 퍼즈: total 1..600 무작위 + current 1..total, siblings ∈ {0,2} → 길이 = `min(total, 2s+5)`, 1·total·current 포함, 숫자 엄격 오름차순, gap 비연속, 각 gap이 숨기는 페이지 수 ≥ 2 |
  | `getPrevNext` | `(1,14)` → `{prev:null,next:2}`; `(7,14)` → `{6,8}`; `(14,14)` → `{13,null}`; `(999,14)` → `{prev:14,next:null}`; `(NaN,14)` → `{null,2}`; 결과는 항상 null 또는 `1..total` |
  | `nextImageIndex` | `(0,3)`→1, `(1,3)`→2, `(2,3)`→2, `(5,3)`→2, `(0,1)`→0, `(0,0)`→0 |
  | `resolveImageSources` | `{sources:getArticleImageSources({id:1,imageUrl:'https://cdn.example.com/a.jpg',categoryPrimary:'economy'})}` → 그대로(길이 3); `{src:'/x.jpg',fallback:'https://images.unsplash.com/p'}` → `['/x.jpg','https://images.unsplash.com/p', IMAGE_PLACEHOLDER_SRC]`; `src===fallback` → 중복 제거 길이 2; `{sources:[]}`·`{}`·`{src:''}` → `[IMAGE_PLACEHOLDER_SRC]`; 결과 마지막은 항상 플레이스홀더, 중복 없음, 빈 문자열 없음 |
- **검증 방법**: `npm test` 종료코드 0, `# fail 0`, 4개 기존 테스트 파일 + 신규 2개 실행; Evaluator가 표와 대조.

### 항목 11 [P2 · S3-B/S3-C]: 거짓 상태 표시 제거 (공유 복사·인기 검색어 빈 상태)
- **대상 파일**: `src/components/ShareButtons.tsx:46-63, 98-107`, `src/components/TrendingKeywords.tsx:21-27`
- **현재 문제**: 복사 폴백에서 `execCommand('copy')`가 실패(`false`/예외)해도 "복사됨"(가짜 성공); 결과가 보조기기에 안 알려짐; 인기 검색어 빈 상태가 "불러오는 중"이라고 거짓 안내.
- **개선 방법**:
  - ShareButtons: 상태 `'idle' | 'copied' | 'failed'`. 클립보드 API 성공 또는 `execCommand('copy') === true`일 때만 `copied`, 아니면 `failed` → 라벨 "복사 실패"(2초 후 idle). 결과 텍스트를 `role="status" aria-live="polite"` 요소(`sr-only` 가능)로 알림. 토스트 중복 문구는 하나로(버튼 라벨 또는 토스트). `setTimeout`은 언마운트 시 정리(`useRef` + cleanup). 채널 목록·링크·스타일 유지(공유 URL 선택은 S4 호출부 몫).
  - TrendingKeywords: 빈 상태 문구 → "아직 집계된 인기 검색어가 없습니다." (그 외 유지, 서버 컴포넌트 유지).
- **기대 효과**: D11과 같은 "가짜 성공/거짓 안내" 패턴을 S3 전 파일에서 제거.
- **검증 방법**: 코드 확인(성공 판정 분기); Playwright 1440 `/article/1`에서 `navigator.clipboard.writeText`를 reject하도록 덮고 `document.execCommand`를 `() => false`로 덮은 뒤 "링크 복사" 클릭 → "복사됨" 미표시·"복사 실패" 표시, 정상 경로(`grantPermissions(['clipboard-read','clipboard-write'])`)에선 "복사됨"; `grep -n "불러오는 중" src/components/TrendingKeywords.tsx` → 0건.

---

## 범위 밖 (S3에서 하지 말 것)
- `src/app/**/page.tsx` 수정(히어로 `sources` 전환, 티커 `language` 전달, 기사 상세 배지 `borderAll`, 원문 본문 `lang`, 공유 URL 선택, 배너 감싸는 `<section>` 여백) — 전부 S4(아래 계약).
- `CountryTabs`·`BookmarkButton`·`AdSlot` 수정, 새 색·애니메이션·장식, AI 기능, 뉴스레터 API 라우트 신설, 카드 레이아웃/정보 순서 재설계, `estimateReadingTime` 기준 변경.
- S1/S2 파일 수정. 필요한 헬퍼가 없으면 S3 신규 `src/lib/*.ts`에 둔다.

---

## Evaluator 검증 절차 (요약)

```bash
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
cd /home/user/hydro
npm test && npx tsc --noEmit                       # 항목 10, 3(하위 호환)
bash $SP/qa-env.sh restart > $SP/x.log 2>&1; tail -1 $SP/x.log    # 'APP UP'
cd $SP && node planner-s3-verify.js                # 기대: 'S3 verify: 8/8 passed' (현재 기준선 0/8)
cd $SP && node audit.js s3                         # BROKEN_IMG 0 (기준선 1,257), mobile breaking-p7 OVERFLOW 소멸, 신규 OVERFLOW·CONSOLE·PAGEERR 0
node peek.js mobile / peek/s3-home 2; node peek.js mobile "/breaking?page=7" peek/s3-b7 16; node peek.js mobile /article/393 peek/s3-ja 2   # 육안: alt 문장·깨진 아이콘 없음, 페이지네이션 한 줄, 히어로 16:10 프레임
cd /home/user/hydro && grep -nE "next/image|setImgSrc|titleKo \|\||\.replace\(" src/components/{NewsCard,NewsCardLarge,NewsCardCompact,BreakingTicker,ArticleHeroImage}.tsx   # 0건
git diff --stat -- src/app src/lib/utils.ts src/lib/constants.ts src/lib/newsletter.ts src/components/{CountryTabs,BookmarkButton,AdSlot}.tsx   # 빈 출력(범위 준수)
```
회귀 확인: 1440 `/breaking` 카드 이미지 박스 180/260px 유지, 북마크 버튼 동작(클릭 → `aria-pressed=true`), 카드 제목 링크로 기사 이동, 티커 링크 이동, `/world?page=3` 등 페이지 링크 URL 형식(`?page=N`) 불변.

---

## 슬라이스 간 계약

S3가 제공하고 S4(페이지)가 사용하는 컴포넌트 API. **모두 하위 호환** — 현재 page 호출부는 수정 없이 빌드·동작한다. S1·S2 계약은 그대로 유효.

### A. 컴포넌트 API

| 컴포넌트 | Props | 비고 / S4 할 일 |
|---|---|---|
| `ArticleImage` (`@/components/ArticleImage`, client, 신규) | `{ sources: readonly string[]; alt?: string = ''; className?: string; loading?: 'lazy' \| 'eager' = 'lazy' }` | 체인 진행 + 마운트 시 `complete && naturalWidth===0` 검사 + 플레이스홀더 종착. 부모가 `relative` 크기 박스를 제공하고 `className="absolute inset-0 h-full w-full object-cover"`. **페이지에서 기사 이미지를 직접 `<img>`/`next/image`로 그리지 말고 이것을 쓸 것** |
| `ArticleHeroImage` | `{ sources?: readonly string[]; src?: string; fallback?: string; alt?: string }` | 자체 비율 박스(`aspect-[16/10] sm:aspect-[2/1]`) 포함. **S4: `article/[id]/page.tsx:96-100`을 `<ArticleHeroImage sources={getArticleImageSources(article)} />`로 교체**(alt 생략 = 장식, 제목은 바로 아래 h1). 감싸는 `div`의 `rounded-card overflow-hidden shadow-elevated bg-surface-elevated`는 유지 가능 |
| `NewsCard` / `NewsCardLarge` | `{ article: Article }` (불변) | `article.language`가 있으면 원문 제목에 `lang` 적용 — Prisma 행 전체(`include: { source: true }`)를 그대로 넘길 것. `select`로 필드를 줄이면 `language`, `publishedAt`, `imageUrl`, `categoryPrimary` 포함 필수 |
| `NewsCardCompact` | `{ article: { id; titleKo; titleOriginal; publishedAt; source: { sourceName }; language?: string \| null }; rank?: number }` | `language` 추가(선택). 홈의 `article as any` 캐스트는 S4가 정리 권장(타입 그대로 통과) |
| `BreakingTicker` | `{ articles: TickerArticle[] }`, `TickerArticle = { id: string; titleKo: string \| null; titleOriginal: string; language?: string \| null }` | **S4: 홈 `page.tsx:61-65` 매핑에 `language: a.language` 추가**(없으면 원문 제목 `lang` 미적용) |
| `Pagination` | `{ currentPage: number; totalPages: number; basePath: string }` (불변) | NaN/범위 밖 `currentPage`에도 안전(링크는 항상 `1..totalPages`). 범위 초과 시 리다이렉트/안내는 여전히 S4(S1 계약 C-4). `basePath`의 `[page]` 치환·`?page=` 추가 규칙 불변 |
| `NewsletterBanner` | `()` (불변) | 플래그 off면 `null`. **S4: 홈 `page.tsx:208-212`·`[country]/page.tsx:127-130`의 감싸는 `<section className="mt-12">`가 빈 요소로 여백만 남으므로 `NEWSLETTER_ENABLED &&`로 감싸거나 여백을 배너 쪽으로 옮길 것**. 배너를 다른 경로에 추가/제거하면 S2 `isNewsletterBannerPath` 목록·테스트 함께 갱신(S2 계약 C) |
| `ShareButtons` | `{ url: string; title: string }` (불변) | `title`은 `getDisplayTitle(article).text` 권장. 공유 URL(현재 `article.originalUrl` = 외부 원문)을 우리 기사 URL로 바꿀지는 S4 결정 |
| `TrendingKeywords`, `CountryTabs`, `BookmarkButton`, `AdSlot` | 불변 | — |

### B. 순수 함수 (`@/lib/pagination`, `@/lib/image-chain` — React 의존 없음, 테스트 공용)

| API | 시그니처 | 동작 |
|---|---|---|
| `getPageItems` | `(current: number, total: number, siblings: number) => (number \| 'gap')[]` | 고정 슬롯(`min(total, 2s+5)`), 1·total·current 포함, 한 페이지만 숨기는 gap 없음 |
| `getPrevNext` | `(current: number, total: number) => { prev: number \| null; next: number \| null }` | 링크 대상은 항상 `1..total` |
| `nextImageIndex` | `(idx: number, length: number) => number` | 마지막에서 멈춤 |
| `resolveImageSources` | `(p: { sources?; src?; fallback? }) => string[]` | 마지막 = `IMAGE_PLACEHOLDER_SRC`, 중복·빈 값 제거, 길이 ≥ 1 |

### C. 사용 규칙 (S4 필수 준수)
1. **제목**: 기사 상세 h1·메타데이터·관리자 목록도 `getDisplayTitle(article)` → `lang={t.lang}`(S1 계약 C-5). S4 Evaluator는 `/article/393`·`/article/394` 모바일 h1과 "원문(번역 준비 중)"/"원문 보기" 컨테이너의 computed `word-break: normal`을 확인(S3 verify T5와 같은 방식).
2. **상대시간**: 클라이언트 컴포넌트에서 `timeAgo`는 `<time dateTime={toIsoDateTime(d)} suppressHydrationWarning>`(S1 계약 C-1). 서버 컴포넌트에서도 `<time>` 형태 권장.
3. **카테고리 배지**: `article/[id]/page.tsx:106`의 `catStyle.border.replace('border-l-','border-')` → `catStyle.borderAll`(S1 지시 4, 계약 C-6).
4. **이미지**: 기사 이미지는 `getArticleImageSources(article)` + `ArticleImage`/`ArticleHeroImage`만 사용. `getDefaultImage`/`proxyImageUrl`로 페이지에서 소스를 직접 조합하지 말 것.
5. **회귀 검증 도구 재사용**: `node $SP/planner-s3-verify.js`는 S4 이후에도 8/8을 유지해야 한다(T5는 S4가 상세 h1에 `lang`을 넣어도 영향 없음, T6은 상세 페이지의 본문 `<article>`을 제외하고 센다).
