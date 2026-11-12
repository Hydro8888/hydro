# S4 페이지 & UX 개선 설계서 — unslop 재작업 라운드

> 사용자 요청: "https://github.com/heydamir/unslop 이 기능을 모두 활용해서 재작업해줘 테스트까지 완료해줘"
> 계약: `UNSLOP-AUDIT.md`(감사·방향·토큰·6절 인터페이스), 스킬 `.claude/skills/unslop/SKILL.md` + `references/signs.md`·`tokens.md`·`visuals.md`.
> 라운드 규칙: 새 기능·새 장식 금지, **섹션·기능·순서 유지**. 모든 항목은 9개 패스 중 어느 패스의 어떤 징후를 고치는지와 `파일:라인` 근거를 갖는다.
> 전제: S1이 3절 토큰·유틸(`formatCount`, `formatWireTime`, `.dateline`, `font-serif`, `font-mono`, `rounded-tag/control/card/panel`, `positive/negative`, `accent-ink`, 전역 포커스 링)을, S3가 6절 컴포넌트 API(`NewsCardCompact` rank 생략 시 통신 시각, `NewsCardLarge lead`)를 이미 구현했다.
> 라인 번호는 이 라운드 시작 시점(커밋 `0e0c122`) 기준이다. S1~S3가 한 줄 수정을 했다면 ±몇 줄 어긋날 수 있다.

```
B=http://127.0.0.1:4000/livenews
수정 전 화면   qa-out/unslop/before/prod/{d,m}-*.jpg , qa-out/planner-s4-{d,m}-*.jpg (관리자·세계·기사 상태별, 로컬)
징후 계수기    bash qa-out/planner-s4-audit.sh          (기준선: qa-out/planner-s4-audit-baseline.txt)
화면 검증기    node qa-out/planner-s4-verify.js         (기준선: qa-out/planner-s4-verify-baseline.txt — 현재 225 FAIL)
```

---

## 현재 상태 분석

### 유지할 것 (회귀 금지)
- 404 구조: 루트·`[country]`·`article/[id]`에 `loading.tsx`/Suspense 없음 → `/nope`·`/xx`·`/article/999999`·`/article/abc`·`/category/nope` 모두 HTTP 404 (Planner 실측).
- 범위 초과 페이지: `/breaking?page=99999` → 307 `?page=14`, `/category/economy?page=99999` → 307 `?page=2`, `/world?page=99999` → 307 `?page=6` (실측). `breaking/layout.tsx`·`category/[slug]/layout.tsx`·`middleware.ts`·`routing.ts`·`queries.ts`는 **이번 라운드 수정 대상이 아니다**.
- 번역 상태 표시: `getArticleView()` 분기와 DOM 표식 — `data-translation-status="title-pending"`(305·345·393), `"body-pending"`(360·393·406), `data-body-excerpt`(393), `data-original-body`, 번역 완료 기사의 `<details>`(1), 본문 없음 안내(405), 비활성 404(407).
- 관리자: `fetchAdminJson` + `AdminLoadError`/`AdminLoading` 오류·로딩 상태, 낙관적 토글과 롤백, "로드 전에는 (0)을 보여 주지 않음".
- 검색: `retryKey` 재시도, 범위 초과 페이지 `router.replace`, AbortController, `role="alert"`/`role="status"`.
- `scripts/qa/ui-audit.js`는 `main .animate-spin`으로 멈춘 로딩을 감지한다 → 로딩 스피너의 `animate-spin` 클래스 이름은 유지.

### 징후 (S4 11개 페이지, `bash qa-out/planner-s4-audit.sh` 기준선)

| 패스 | 징후 | 개수 | 대표 위치 |
|---|---|---|---|
| 1 간격 | 반 단계(`1.5/2.5/3.5`) | 22 | `page.tsx:137,143` `[country]/page.tsx:73,85` `article/[id]/page.tsx:175,258,284` `search/page.tsx:161,180` |
| 1 | 임의 값 | 2 | `article/[id]/page.tsx:77` `leading-[1.9]`, `md:text-[17px]` |
| 1 | 12px 페이지 여백(`px-3`) — 헤더는 `px-4` | 6 | `page.tsx:62` 외 5곳 |
| 1 | 같은 것 다른 간격: 머리기사 3장 그리드 `gap-4` vs 아래 `gap-5` | 1 | `[country]/page.tsx:96` (d-world 화면에서 카드 가장자리 2px 어긋남) |
| 2 색 | `accent-blue/red/green` | 28 | `page.tsx:122,188` `breaking/page.tsx:34` `search/page.tsx:200` 관리자 4화면 |
| 2 | 강조색 면(`bg-accent…`) + `text-white` | 17 / 7 | `category/[slug]/page.tsx:63` `ranking/page.tsx:33` `search/page.tsx:141,206` `admin/*` |
| 2 | hover마다 강조색 | 22 | 링크·알약·태그 전부 |
| 2 | 제목 옆 색 막대 | 4 | `page.tsx:81,122,188` `article/[id]/page.tsx:300` |
| 2 | 카테고리 색 제목·배지 | 4 | `page.tsx:128,138` `article/[id]/page.tsx:112,166` |
| 2 | 그림자 | 16 | `article/[id]/page.tsx:155` `ranking/page.tsx:33` 관리자 카드·표 전부 `shadow-card` |
| 2 | 안내문 레일·오버라인에 강조색 | 2+1 | `article/[id]/page.tsx:214,229` `AdminLoadError.tsx:23` |
| 3 아이콘 | 이모지 | 4자+필드 | `[country]/page.tsx:18-23,71` (🌍 🇺🇸 🇯🇵 🇨🇳) |
| 3 | 인라인 SVG 5종이 12·14·64px, stroke 1·2 | 5 | 항목 14의 표 |
| 4 문구 | `toLocaleString` | 5 | `admin/page.tsx:135,139,160,173` `admin/sources/page.tsx:231` |
| 4 | 날것 숫자·단위 불일치(`{total}개`, `(410)`, `40054건`) | 3+3+1 | `breaking/page.tsx:37` `[country]/page.tsx:74` `category/[slug]/page.tsx:49` `admin/articles/page.tsx:113` `admin/logs/page.tsx:69` `admin/sources/page.tsx:145` `search/page.tsx:193` |
| 4 | 순위가 아닌 목록의 1·2·3 | 2 | `page.tsx:99,166` |
| 4 | 말줄임표 라벨 | 6 | `search/page.tsx:27,136,214` `admin/page.tsx:119,126` `admin/sources/page.tsx:201` |
| 4 | 영어 enum 그대로 노출(`success/failed/partial`, `us/global`), 영어 alert | 2곳+ | `admin/page.tsx:214,85` `admin/logs/page.tsx:132,125` `admin/sources/page.tsx:229` |
| 4 | 한 화면에 같은 제목 두 번("최신 뉴스") | 1 | `page.tsx:95,189` |
| 5 서체 | `font-bold/semibold` | 21 | 관리자 h1·통계 숫자, `article/[id]/page.tsx:166`, `breaking/page.tsx:34` |
| 5 | `uppercase`+`tracking-widest` | 2줄 | `article/[id]/page.tsx:122,229` |
| 5 | `italic` | 1 | `article/[id]/page.tsx:197` |
| 5 | 토큰 밖 크기(`text-sm/xs/2xl/3xl`) | 47 | 관리자 4화면 |
| 7 디테일 | 알약 | 3 | `[country]/page.tsx:85` `category/[slug]/page.tsx:61` `article/[id]/page.tsx:284` |
| 7 | 토큰 밖 모서리(`rounded-lg/badge/rounded`) | 47 | 관리자 전부, 검색 |
| 7 | 표: 머리글 면 = hover 면(`bg-surface-elevated` / `/50`), 선택 상태 없음 | 4표 | `admin/*` thead·tr |
| 7 | 제각각 포커스 스타일(`focus:outline-none focus:ring-*`) | 28 | 검색·관리자 입력 |
| 9 모션 | 진입 애니메이션 4개(섹션마다) | 4 | `page.tsx:79,120,186,206` |

실제 화면에서 추가로 확인한 것: 기사 본문 줄 길이 864px(한글 약 50자/줄, `d-article-1.jpg`), 모바일 관리자 머리(제목 2줄 + 버튼 2줄로 깨짐, `planner-s4-m-admin.jpg`), 대시보드 "국가별" 패널이 옆 패널 높이에 맞춰 늘어나 빈 면이 생김(`planner-s4-d-admin.jpg`), 로그 표의 빈 오류 칸 `-`까지 빨간색.

---

## 디자인 방향

`UNSLOP-AUDIT.md` 2절 그대로: **밤의 편집국·통신 데스크 — 차분한, 정확한, 종이 신문 같은.** S4가 이 방향을 화면에 옮기는 방식:

- 크롬은 조용하게: 페이지 제목·섹션 제목은 **크기와 글자색**으로만 위계를 만든다(막대·배지·알약·그림자 없음). 강조색은 "현재 위치"(활성 칩·탭) 한 곳.
- 색이 풍부한 곳은 두 모먼트뿐: ① 홈 머리기사의 실제 보도 사진(`lead`), ② "최신 뉴스" 통신 목록.
- 시그니처 = 통신 시각표. 숫자·시각은 전부 고정폭 + `tabular-nums`, 형식 하나(`164,917건`, `14:02`, `2026.11.12 06:31`).
- 명시적 금지: 보라색 그라데이션·글로우·흰 카드 같은 AI slop, 제거한 장식을 다른 장식으로 바꾸는 것(글래스·그레인·네온·벤토), 404·빈 상태의 장식 아이콘, 생성 이미지.
- 차별화: (1) 기사 머리의 **데이트라인 한 줄** `France 24 · 2026.11.12 06:31` — 통신 전문의 머리, (2) 홈 카테고리 열을 상자 대신 **신문 단(段) 머리**(헤어라인 + 단 이름)로.

### 시그니처(통신 시각표) 배치 — Template check

| 화면 | 어디에 어떻게 | 담당 |
|---|---|---|
| 홈 | 머리기사 아래 "최신 뉴스" 통신 목록: 왼쪽 칸에 `14:02` / `11.05 14:02`(`.dateline`), 목록 머리 오른쪽에 `KST`. 카테고리 열의 하위 3건도 같은 시각 칸. 행은 **찍힌 시각 순**. | S4(배치·정렬) + S3(행) |
| 속보·카테고리·국가·검색 | 카드 메타 `매체 · 시각`(S3). 제목 줄의 건수는 같은 고정폭 숫자 `164,917건`. | S3 + S4 |
| 랭킹 | 순위 숫자를 같은 고정폭 숫자로 카드 위에(1~30 전부). 카드 메타는 `매체 · 시각`. | S4 + S3 |
| 기사 상세 | 머리와 꼬리의 데이트라인 `매체 · YYYY.MM.DD HH:mm · 기자`. 영구 기록이라 날짜 전체를 쓴다(같은 고정폭·같은 `HH:mm`). | S4 |
| 관리자 | 수집 로그·최근 로그의 시작/완료 시각, 건수·조회수·ID 전부 고정폭 오른쪽 정렬. 수집 로그가 곧 운영자의 통신 기록. | S4 |

제품 이름을 바꿔 끼우면 어색해지는 지점: 통신 시각 칸, 데이트라인, "원문 · English" 병기, 번역 상태 안내 — 해외 기사를 번역해 싣는 데스크에만 있는 것들이다.

### 9개 패스를 이 슬라이스에 순서대로 적용한 결과 (요약)

1. **간격** — 페이지 여백 16/24/32, 섹션 사이 48·제목↔내용 16·카드 사이 20, 반 단계·임의 값 0, 기사 읽기 폭 720px(항목 1·2·9).
2. **색** — S4 파일에 `accent-blue/red/green`·`text-white`·강조색 면·그림자 0. 강조색은 활성 칩 1곳, 의미색은 관리자의 실패/성공에만(항목 3·5·8·9·16·17).
3. **아이콘** — 이모지 0, SVG 3종만 남기고 16px·stroke 1.5로 통일(항목 14).
4. **문구** — 숫자 한 형식, 순위 아닌 순번 제거, 말줄임표·마침표·영어 enum 정리, 빈/오류 상태 문구(항목 4·11·12·13·18).
5. **서체** — 굵기 400/500/600만, 기사 h1 `font-serif` 600, `uppercase`·`tracking`·`italic` 0, 토큰 크기만(항목 4·8·15·16).
6. **레이아웃** — 섹션·순서 그대로. 정렬만: 제목 줄, 머리기사 3장 그리드, 기사 한 단, 랭킹 `<ol>`, 관리자 머리 줄바꿈(항목 3·6·7·9·15).
7. **디테일** — 알약 → 컨트롤 모서리, 건수는 조용한 고정폭 글자, 표 상태 4종 구분, 전역 포커스 링 하나(항목 0·5·10·17).
8. **비주얼** — 앱 화면이므로 생성 이미지 없음. 모먼트는 머리기사 사진과 통신 목록. 빈 상태 아이콘 제거, 추가 없음(항목 12·20).
9. **모션** — S4 페이지의 진입 애니메이션 0, 전환은 `transition-colors`/`transition-transform`만, 로딩 스피너만 회전(항목 19).

---

## 대상 파일 목록

수정(11): `src/app/page.tsx`, `src/app/[country]/page.tsx`, `src/app/article/[id]/page.tsx`, `src/app/breaking/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/ranking/page.tsx`, `src/app/search/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/sources/page.tsx`, `src/app/admin/articles/page.tsx`, `src/app/admin/logs/page.tsx`

수정(S4가 만든 관리자 공용 컴포넌트): `src/components/AdminLoadError.tsx`

신규(4): `src/lib/ui.ts`(컨트롤·표 클래스 상수), `src/components/PageHeading.tsx`, `src/components/EmptyState.tsx`, `tests/unslop-pages.test.ts`

수정 금지: `src/middleware.ts`, `src/lib/queries.ts`, `src/lib/routing.ts`, `src/lib/article-view.ts`, `src/app/breaking/layout.tsx`, `src/app/category/[slug]/layout.tsx`, `src/app/search/layout.tsx`, 모든 `loading.tsx`, API 라우트. S1·S2·S3 파일은 항목 21의 백스톱 조건에서만 최소 수정.

---

## 개선 항목

### 항목 0: 공용 조각 — 컨트롤 클래스, 제목 줄, 빈 상태
- **[패스 1 "Same thing, same size" · 패스 7 "Buttons share the control radius"]**
- 대상 파일: `src/lib/ui.ts`(신규), `src/components/PageHeading.tsx`(신규), `src/components/EmptyState.tsx`(신규)
- 현재 문제: 버튼 클래스가 11개 파일에 9가지(`px-6 py-3 rounded-card`, `px-4 py-2 rounded-lg`, `px-4 py-2 rounded`, `text-xs` 링크 버튼 …), 제목 줄 5가지, 빈 상태 6벌 복사. 화면마다 높이·모서리가 달라 "같은 것 같은 크기"가 구조적으로 깨진다.
- 개선 방법: 아래 세 파일을 만들고 항목 4~18이 이것만 쓴다. **S1/S2/S3가 같은 역할의 클래스(`.btn-primary` 등)를 이미 만들었다면 `ui.ts`의 값을 그쪽과 동일하게 맞추고 SELF_CHECK에 적는다**(높이 40/32, 모서리 `rounded-control`, 주요 = `text` 면 + `accent-ink`는 계약이므로 불변).

```ts
// src/lib/ui.ts — 완전한 리터럴만 쓴다(Tailwind가 src/lib를 스캔). 문자열 조립으로 클래스 이름을 만들지 말 것.
const CONTROL =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-body-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
/** 화면당 1개. 어두운 테마의 주요 버튼 = text 색 면 + accent-ink 글자 */
export const BTN_PRIMARY = `${CONTROL} h-10 px-4 bg-text text-accent-ink hover:bg-text/90`;
export const BTN_SECONDARY = `${CONTROL} h-10 px-4 border border-border bg-surface-elevated text-text hover:border-text-muted`;
export const BTN_SECONDARY_SM = `${CONTROL} h-8 px-3 border border-border bg-surface-elevated text-text hover:border-text-muted`;
export const BTN_GHOST_SM = `${CONTROL} h-8 px-2 text-text-secondary hover:bg-surface-elevated hover:text-text`;
export const FIELD =
  'h-10 w-full rounded-control border border-border bg-surface-elevated px-3 text-body-md text-text placeholder:text-text-muted transition-colors';
export const FIELD_SM =
  'h-8 rounded-control border border-border bg-surface-elevated px-2 text-body-md text-text transition-colors';
export const CHIP =
  'inline-flex h-8 items-center whitespace-nowrap rounded-control border border-border px-3 text-body-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text';
/** 현재 위치: 작은 면 단계 + 헤어라인 + 강조색 글자 (강조색 면 금지) */
export const CHIP_CURRENT =
  'inline-flex h-8 items-center whitespace-nowrap rounded-control border border-border bg-surface-elevated px-3 text-body-md text-accent';
export const TAG = 'inline-flex h-6 items-center rounded-tag bg-surface-elevated px-2 text-caption text-text-secondary transition-colors hover:text-text';
export const NUM = 'font-mono tabular-nums';

// 관리자 표
export const PANEL = 'rounded-card border border-border bg-surface-card';
export const TABLE_WRAP = 'overflow-x-auto rounded-card border border-border bg-surface-card';
export const TH = 'h-10 px-4 text-left text-caption font-medium text-text-muted whitespace-nowrap';
export const TH_NUM = 'h-10 px-4 text-right text-caption font-medium text-text-muted whitespace-nowrap';
export const TR = 'transition-colors hover:bg-surface-elevated/50 focus-within:bg-surface-elevated/50';
export const TR_SELECTED = 'bg-surface-elevated';
export const TD = 'h-11 px-4 text-text-secondary';
export const TD_MAIN = 'h-11 px-4 text-text';
export const TD_NUM = 'h-11 px-4 text-right font-mono tabular-nums text-text';
export const TD_TIME = 'h-11 px-4 font-mono tabular-nums text-text-secondary whitespace-nowrap';
export const STATUS_DOT = 'h-2 w-2 shrink-0 rounded-full';
/** 수집 로그 상태: 의미색은 점에만. partial은 성공도 실패도 아니므로 중립 */
export const LOG_STATUS: Record<string, { label: string; dot: string }> = {
  success: { label: '성공', dot: 'bg-positive' },
  failed: { label: '실패', dot: 'bg-negative' },
  partial: { label: '부분', dot: 'bg-text-muted' },
};
```

```tsx
// src/components/PageHeading.tsx — 'use client' 없음(서버·클라이언트 페이지 모두에서 import)
import type { ReactNode } from 'react';
import { formatCount } from '@/lib/utils';

export default function PageHeading({ title, count, unit = '건', children }: {
  title: string; count?: number | null; unit?: string; children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-headline-lg font-medium text-text">{title}</h1>
        {typeof count === 'number' && (
          <p data-count className="text-meta text-text-muted">
            <span className="font-mono tabular-nums">{formatCount(count)}</span>{unit}
          </p>
        )}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
```
  - `font-medium`: 페이지 제목은 500(600은 serif 큰 헤드라인 2곳만). Tailwind 3.4는 굵기 유틸을 크기 유틸 뒤에 내보내므로 `text-headline-lg`의 토큰 굵기를 덮는다.
  - 숫자만 `font-mono` span에 넣고 단위 `건`은 밖에 둔다(고정폭 글꼴에 한글이 없다 — "계약에서 발견한 문제" 1).

```tsx
// src/components/EmptyState.tsx — 장식 없음: 문장 두 줄 + 선택적 동작 하나
import type { ReactNode } from 'react';

export default function EmptyState({ title, detail, alert = false, children }: {
  title: string; detail?: string; alert?: boolean; children?: ReactNode;
}) {
  return (
    <div className="py-16 text-center">
      <div role={alert ? 'alert' : undefined}>
        <p className="text-headline-sm text-text">{title}</p>
        {detail ? <p className="mt-2 text-body-md text-text-secondary">{detail}</p> : null}
      </div>
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  );
}
```
- 기대 효과: 버튼 높이 2가지(40/32), 모서리 1가지, 제목 줄 1가지, 빈 상태 1가지.
- Evaluator 검증: 세 파일 존재. `grep -rn "px-4 py-2\|px-6 py-3" src/app --include=page.tsx` → 0. 임의의 두 화면에서 주요 버튼의 `getBoundingClientRect().height`가 40, `border-radius`가 8px.

### 항목 1: 페이지 가장자리 여백과 섹션 간격 리듬
- **[패스 1 · "Padding follows density … page edges 24 to 32" / "Groups that sit closer to their neighbours than to their own items"]**
- 대상 파일: 공개 페이지 7개
- 현재 문제: 컨테이너가 `px-3 sm:px-4`(12/16px, `page.tsx:62`, `article/[id]/page.tsx:132`, `breaking/page.tsx:32`, `category/[slug]/page.tsx:45`, `ranking/page.tsx:24`, `search/page.tsx:126`)와 `px-4`(`[country]/page.tsx:68`)로 섞여 있고 헤더(`Header.tsx:215` `px-4`)와 모바일에서 4px 어긋난다. 홈 섹션 사이 40px(`mt-10`, `page.tsx:120,186`)·제목↔내용 20px(`mb-5`)·카드 사이 20px로 "그룹 안"과 "그룹 사이"의 차가 2배뿐이다.
- 개선 방법:
  - 목록·홈 컨테이너: `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8` (홈만 `py-6` → `py-8`로 통일). **S2가 Header/Footer 컨테이너에 쓴 가로 패딩 클래스를 먼저 읽고 같은 값을 쓴다.** 다르면 S2 값을 따르고 SELF_CHECK에 적는다(정렬이 범위보다 우선).
  - 리듬(전 페이지 공통): 섹션 사이 `mt-12`(48) · 섹션 제목 아래 `mb-4`(16) · 카드 그리드 `gap-5`(20) · 제목 줄 아래 `mb-6`(24, `PageHeading`) · 필터 줄 아래 32.
  - 홈: 티커 래퍼 `mb-6 rounded-lg overflow-hidden`(`page.tsx:66`) → `mb-8 overflow-hidden rounded-card`. `mt-10` 2곳 → `mt-12`. 인기 검색어 래퍼 `mt-5`(`page.tsx:177`) → `mt-8`. 통신 목록 패널 `p-4`(`:93`) → `p-5`, 제목 `mb-3` → `mb-2`, 의미 없는 `space-y-0` 래퍼 클래스 삭제(`:97`).
  - 국가: 뉴스레터 섹션 `mt-6`(`[country]/page.tsx:140`) → `mt-12`.
  - 반 단계 전부 정수 단계로: `gap-1.5` → `gap-2`, `px-2.5 py-1` → 항목별 새 클래스, `px-3.5 py-1.5` → `CHIP`, `w-3.5 h-3.5` → `h-4 w-4`.
- 기대 효과: 로고·제목·카드 왼쪽 선이 한 줄. 섹션이 덩어리로 읽힌다.
- Evaluator 검증: `planner-s4-audit.sh`의 P1 3행 = 0. `planner-s4-verify.js`의 "h1 left ≠ header logo left" 0건(390·1440). 홈에서 `section`들의 `margin-top` = 48px, `h2`의 `margin-bottom` = 16px.

### 항목 2: 머리기사 3장 그리드 통일 (속보·카테고리·국가)
- **[패스 1 "Same thing, same size" · 패스 6 "alignment and proportions may change"]**
- 대상 파일: `breaking/page.tsx:41-47`, `category/[slug]/page.tsx:73-81`, `[country]/page.tsx:94-102`
- 현재 문제: 같은 구성(큰 카드 3장 + 카드 그리드)인데 `md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10` / `md:grid-cols-3 gap-5 mb-10` / `md:grid-cols-3 gap-4 mb-10` 세 가지. 768px에서 속보는 3번째 카드가 혼자 남고, 카테고리·국가는 224px 폭 카드에 28px 제목이 들어가 3줄로 잘린다. 큰 카드 묶음과 아래 그리드 사이가 40px라 한 목록이 두 덩어리로 보인다.
- 개선 방법: 세 페이지 모두 동일하게
  ```tsx
  <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
    {headlines.map((a) => (
      <div key={a.id} className="grid md:first:col-span-2 lg:first:col-span-1">
        <NewsCardLarge article={a} />
      </div>
    ))}
  </div>
  ```
  (래퍼 `grid`는 카드가 행 높이를 채우게 한다. `<section>` 래퍼가 있던 곳은 유지하고 클래스만 교체.) 아래 카드 그리드는 `grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3` 그대로.
- 기대 효과: 세 화면의 첫 화면이 같은 격자. 태블릿에서 고아 카드·3줄 제목 없음.
- Evaluator 검증: 768px에서 세 페이지의 첫 큰 카드 폭 = 컨테이너 폭, 2·3번째가 나란히. 1440px에서 큰 카드 3장의 `left`가 아래 카드 3열의 `left`와 일치(±0). `node scripts/qa/ui-audit.js` 넘침 0.

### 항목 3: 홈 — 섹션 머리 중립화, 카테고리 단 머리
- **[패스 2 · "Every element highlighted, so nothing stands out" / "Many near identical tints" · 패스 6]**
- 대상 파일: `src/app/page.tsx`
- 현재 문제: 섹션 제목 3곳에 주황·파랑·초록 세로 막대(`:81,122,188`), 카테고리 제목이 카테고리 색 글자(`:128,138`), 카테고리 묶음이 카드 안의 카드(`:132` 패널 안에 `NewsCard`). 진입 클래스는 항목 19.
- 개선 방법:
  - h2 3곳: `<h2 className="mb-4 text-headline-md text-text">주요 헤드라인</h2>` 형태(막대 `<span>` 삭제, `flex items-center gap-2` 삭제).
  - `:189`의 두 번째 "최신 뉴스" → **"그 밖의 뉴스"** (한 화면에 같은 제목 2개 — 패스 4. `:95`의 통신 목록이 "최신 뉴스"를 유지).
  - 카테고리 묶음(`:130-170`): 바깥 상자(`bg-surface-card rounded-card border border-border-muted p-4`)를 없애고 신문 단 머리로.
    ```tsx
    <div key={slug} className="border-t border-border pt-4">
      <Link href={`/category/${slug}`} className="mb-4 inline-flex items-center gap-2 text-headline-sm text-text transition-colors hover:text-text-secondary">
        {label}
        <svg aria-hidden="true" className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      {featured && <NewsCard article={featured} />}
      {secondary.length > 0 && (
        <div className="mt-2">{byWireTime(secondary).map((a) => <NewsCardCompact key={a.id} article={a} />)}</div>
      )}
    </div>
    ```
    그리드: `grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3`.
  - `getCategoryStyle`·`cn` import와 `const style = …` 삭제(`:12,128`).
- 기대 효과: 홈 크롬에서 색이 사라지고 머리기사 사진만 색을 가진다. 카드 중첩 1단계 감소.
- Evaluator 검증: verify "colour bar" 0, "section titles must be unique" 통과. `grep -c "getCategoryStyle\|bg-accent" src/app/page.tsx` = 0. 1440px 화면에서 카테고리 제목 3개의 `color`가 모두 `rgb(239, 233, 222)`.

### 항목 4: 홈 — 머리기사 `lead`, 통신 목록(순번 제거·시각 순)
- **[패스 4 · 감사 "최신 뉴스 목록의 1·2·3 순번(순위가 아닌데 순위처럼 보임)" · 패스 5 serif 헤드라인 · 패스 7 "The signature detail … appears where it belongs" · 패스 8 모먼트]**
- 대상 파일: `src/app/page.tsx:88,93-102,163-169`
- 현재 문제: 머리기사가 옆 카드와 같은 서체·크기라 모먼트가 없다. 통신 목록과 카테고리 하위 목록에 `rank={idx + 1}`(`:99,166`) — 순위가 아니다. 또 목록 순서는 수집 시각(`createdAt`, `queries.ts:28`)인데 화면에 찍히는 시각은 발행 시각(`publishedAt`)이라, 시각 칸이 생기면 `08:10 → 11:40 → 09:05`처럼 뒤섞여 보인다(운영 화면의 "4시간 전, 2시간 전, 3시간 전, 8시간 전 …"이 그 순서).
- 개선 방법:
  - `:88` → `<NewsCardLarge article={hero} priority lead />`. 옆 2장(`:110`)은 그대로.
  - `:99`, `:166`의 `rank` prop 삭제 → S3가 왼쪽 칸에 통신 시각을 찍는다.
  - 통신 목록 머리(`:94-96`):
    ```tsx
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h3 className="text-headline-sm text-text">최신 뉴스</h3>
      <span className="dateline">KST</span>
    </div>
    ```
    (`KST`는 시각 칸의 단위 표기. 자간·대문자 변환 클래스 없음.)
  - 같은 묶음 안에서만 시각 순으로 재정렬(어떤 기사가 어느 구역에 놓이는지는 그대로 — `hero`/`subHeroes`/`listItems`/`secondary` 분배 로직 불변):
    ```ts
    /** 통신 목록은 찍히는 시각(publishedAt) 순으로 읽힌다. 같은 묶음 안의 행 순서만 바꾼다. */
    const wireMs = (d: Date | string | null | undefined): number => {
      const t = d ? new Date(d).getTime() : 0;
      return Number.isNaN(t) ? 0 : t;
    };
    const byWireTime = <T extends { id: number; publishedAt: Date | string | null }>(list: T[]): T[] =>
      [...list].sort((a, b) => wireMs(b.publishedAt) - wireMs(a.publishedAt) || b.id - a.id);
    ```
    `listItems.map` → `byWireTime(listItems).map`, `secondary.map` → `byWireTime(secondary).map`. (모듈 최상위 함수, 서버 컴포넌트 전용.)
- 기대 효과: 첫 화면에 모먼트 2개(사진 + serif 제목, 시각이 찍힌 전문 목록)가 생기고 나머지는 조용하다.
- Evaluator 검증: verify "lead headline is not font-serif"·"wire list still shows N rank numbers"·"wire list times" 통과. 통신 목록의 `<time datetime>` 값이 내림차순. 옆 카드 2장의 제목 `font-family` 첫 항목은 Pretendard(=serif 아님). `curl -s $B/ | grep -c 'fetchpriority="high"'` ≥ 1(우선 로딩 유지).

### 항목 5: 목록 페이지 제목 줄 — 배지·카운트 알약 → 제목 + 조용한 고정폭 건수
- **[패스 7 · "Glowing pills for counts … → quiet mono text" · 패스 4 숫자 형식 · 패스 3 이모지]**
- 대상 파일: `breaking/page.tsx:33-39`, `category/[slug]/page.tsx:46-51`, `[country]/page.tsx:18-23,70-76`, `ranking/page.tsx:25`, `search/page.tsx:127`
- 현재 문제: 속보 = 빨간 테두리 배지 + "최신 뉴스" + `164917개` 알약, 국가 = 30px 이모지 + 제목 + 알약, 카테고리 = 제목 + 알약. 숫자에 쉼표가 없고 단위가 헤더(`건`)와 다르다(`개`). 속보 페이지의 h1이 메뉴·`<title>`("속보")과 다른 "최신 뉴스".
- 개선 방법:
  - 속보: `<PageHeading title="속보" count={total} />` (배지 `<span>` 삭제. "속보"라는 말은 배지에서 제목으로 옮긴다.)
  - 카테고리: `<PageHeading title={`${label} 뉴스`} count={total} />`
  - 국가: `<PageHeading title={`${config.label} 뉴스`} count={total} />`. `COUNTRY_CONFIG`에서 `emoji` 필드와 타입(`:18-23`) 삭제, `:71` `<span className="text-3xl">` 삭제.
  - 랭킹: `<PageHeading title="뉴스 랭킹" />`, 검색: `<PageHeading title="뉴스 검색" />` (건수 없음).
  - 메타 설명의 확인할 수 없는 "실시간"(패스 4): `[country]/page.tsx:42` → `` `${config.label} 주요 뉴스를 한국어로 번역해 전합니다` ``, `breaking/page.tsx:13` → `'해외 주요 언론의 최신 기사를 수집 순서대로 전합니다'`.
- 기대 효과: 제목 줄이 다섯 화면에서 같은 모양. 숫자 형식이 헤더와 일치.
- Evaluator 검증: verify `[data-count]` 검사 통과(`/^\d{1,3}(,\d{3})*건$/`, 숫자 span이 mono + `tabular-nums`). `curl -s $B/world | grep -c '🌍'` = 0. 다섯 페이지 h1의 `font-size` 28px·`font-weight` 500.

### 항목 6: 필터 알약 → 컨트롤 모서리 칩
- **[패스 7 · "Every element a full pill" · 패스 2 "one accent"]**
- 대상 파일: `category/[slug]/page.tsx:54-71`, `[country]/page.tsx:79-91`
- 현재 문제: `rounded-pill` 알약 16개/5~7개, 활성 = `bg-accent text-white`(흰 글자 대비 2.3:1), hover = 주황 테두리 + 주황 글자.
- 개선 방법:
  ```tsx
  <nav aria-label="카테고리" className="-mx-1 mb-7 flex gap-2 overflow-x-auto px-1 py-1 scrollbar-hide">
    {CATEGORIES.map((cat) => {
      const active = cat.slug === params.slug;
      return (
        <Link key={cat.slug} href={`/category/${cat.slug}`} aria-current={active ? 'page' : undefined}
              className={active ? CHIP_CURRENT : CHIP}>{cat.label}</Link>
      );
    })}
  </nav>
  ```
  국가 페이지는 같은 래퍼(`aria-label="세부 분야"`)에 전부 `CHIP`. `px-1 py-1 -mx-1`은 가로 스크롤 상자가 포커스 링(2px + offset 2px)을 자르지 않게 하는 여유이고, `mb-7`(28) + `py-1`(4) = 32.
- 기대 효과: 강조색은 현재 카테고리 글자 한 곳. 칩 높이 32, 간격 8.
- Evaluator 검증: verify "pill-shaped element" 0. `/category/economy`에서 `a[aria-current="page"]` 1개, `color` = `rgb(240, 136, 62)`, `background-color` = `rgb(38, 36, 33)`; 나머지 칩 `border-radius` 8px. Tab으로 칩에 포커스했을 때 outline 4변이 모두 보임(스크린샷).

### 항목 7: 랭킹 순위 숫자
- **[패스 7 · "Counts and meta become quiet text, often mono" · 패스 2 강조색 면·그림자 · 패스 1 "nudged off the line"]**
- 대상 파일: `src/app/ranking/page.tsx:29-40`
- 현재 문제: 상위 3개만 카드 모서리 밖으로 8px 삐져나온 주황 원(`absolute -top-2 -left-2 … rounded-full bg-accent text-white font-bold shadow-elevated`). 4~30위는 순위가 없다.
- 개선 방법:
  ```tsx
  {articles.length > 0 && (
    <ol className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <li key={article.id} className="flex flex-col">
          <p className={cn('mb-2 font-mono text-headline-sm tabular-nums', idx < 3 ? 'text-text' : 'text-text-muted')}>
            {idx + 1}<span className="sr-only">위</span>
          </p>
          <div className="grid flex-1"><NewsCard article={article} /></div>
        </li>
      ))}
    </ol>
  )}
  ```
  한 형식: `1`…`30`, 0 채움 없음. 위계는 글자색(1~3위 `text`, 이하 `text-muted`). `cn`은 `@/lib/utils`.
- 기대 효과: 순위가 30개 전부에, 한 열에, 같은 고정폭 숫자로.
- Evaluator 검증: verify ranking 검사 통과(`ol > li` 첫 자식 텍스트 `1위`…`10위`). `grep -c "rounded-full\|bg-accent\|shadow-" src/app/ranking/page.tsx` = 0. `?country=zz` → 200(전체로 대체) 유지.

### 항목 8: 기사 상세 — 머리(경로·데이트라인·h1·원제목)
- **[패스 5 · "Headings at weight 800" / "Italic used for emphasis" · 패스 4 "one format" · 패스 3 아이콘 · 패스 2 배지 색]**
- 대상 파일: `src/app/article/[id]/page.tsx:112-116,132-206`
- 현재 문제: h1 800 굵기 sans(`:187`), 원제목 `italic`(`:197`), 메타 줄에 색 배지 + 매체 + 날짜 + 시계 아이콘 + 상대 시각 + 기자 5종이 섞여 모바일에서 2줄 + 북마크 1줄(`m-article-0.jpg`), 카테고리가 경로와 배지에 두 번, 사진에 `shadow-elevated`(`:155`), 경로 구분자가 12px stroke 2 아이콘.
- 개선 방법:
  - 컨테이너(`:132`): `mx-auto max-w-3xl px-4 py-8 sm:px-6` (읽기 폭은 항목 9).
  - 경로(`:134-151`): `className="mb-4 flex flex-wrap items-center gap-2 text-body-md text-text-secondary"`, 링크 hover `hover:text-text`, 구분자 `<Chevron className="w-3 h-3 …" />` 2곳 → `<span aria-hidden="true" className="text-text-muted">/</span>`.
  - 사진 래퍼(`:155`): `mb-6 overflow-hidden rounded-card bg-surface-elevated` (그림자 삭제).
  - 메타 줄(`:164-184`) 전체를 데이트라인 한 줄로. 색 배지(`:165-169`)·시계 아이콘과 상대 시각(`:174-177`) 삭제 — 카테고리는 바로 위 경로에 링크로 남는다.
    ```tsx
    const dateline = (
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-body-md text-text-secondary">
        <span>{article.source.sourceName}</span>
        {dateLabel && (<>
          <span aria-hidden="true" className="text-text-muted">·</span>
          <time dateTime={dateTime} className="dateline">{dateLabel}</time>
        </>)}
        {article.author && (<>
          <span aria-hidden="true" className="text-text-muted">·</span>
          <span className="text-text-muted">{article.author}</span>
        </>)}
      </p>
    );
    …
    <div className="mb-3 flex items-start justify-between gap-3">
      {dateline}
      <div className="shrink-0"><BookmarkButton articleId={article.id} /></div>
    </div>
    ```
    `dateLabel`은 기존 `formatDate()`(`2026.11.12 06:31`, 서버·브라우저 동일) 그대로.
  - h1(`:187`): `className="mb-3 font-serif text-headline-xl text-text"` (`leading-tight` 삭제 — 토큰 1.2/600 사용, 자간 클래스 없음). `lang` 유지.
  - 원제목(`:197`): `className="mb-6 text-body-md text-text-muted"` (`italic` 삭제). 제목 번역 대기 문구(`:192`)는 `mb-6`로만 변경, `data-translation-status` 유지.
  - 사용하지 않게 되는 것 삭제: `catStyle`(`:112`), `relative`(`:116`), import의 `cn`·`getCategoryStyle`·`timeAgo`.
- 기대 효과: 사진 → 데이트라인 → serif 제목 → 원제목 순의 신문 머리. 모바일에서 메타 1줄.
- Evaluator 검증: verify article 검사(h1 serif·600·음수 자간 없음, `time` = `YYYY.MM.DD HH:mm` + mono, 시계 아이콘 0, italic 0, box-shadow 0). 390px `/article/402`(긴 기자명)에서 넘침 0. `/article/395`(날짜 없음)에서 `·`가 줄 끝에 남지 않음. `/article/398·399·400`(카테고리 없음/미등록/오피니언)에서 경로가 이전과 같은 규칙으로 표시.

### 항목 9: 기사 상세 — 본문 읽기 폭·줄 간격, 안내문·오버라인 색
- **[패스 1 임의 값 · 패스 6 읽기 폭 · 패스 5 "Uppercase labels with wide tracking" · 패스 2 "one accent, used rarely"]**
- 대상 파일: `src/app/article/[id]/page.tsx:77,119-129,208-263`
- 현재 문제: 본문 줄 길이 864px(한글 약 50자), `leading-[1.9] md:text-[17px]` 임의 값(`:77`). "요약"이 주황 + `uppercase tracking-widest`(`:229`), "원문 · English"가 대문자 변환(`:122`). 번역 대기 안내의 왼쪽 레일이 주황(`:214`), 요약 안내의 링크가 주황(`:241`).
- 개선 방법:
  - 읽기 폭: 항목 8의 `max-w-3xl`(본문 720px, 18px 기준 한글 약 40자/줄; 390px에서 16px 약 22자).
  - `:77` → `const BODY_TEXT = 'space-y-6 text-base leading-7 text-text sm:text-lg sm:leading-8';` (16/28 → 18/32, 문단 사이 24. 줄 높이 4px 격자.)
  - 오버라인 2곳(`:122,229`): `className="mb-2 text-overline text-text-muted"` — `uppercase`·`tracking-widest`·`text-accent` 삭제.
  - 번역 대기 안내(`:214`): `className="border-l-2 border-border pl-3 text-caption text-text-secondary"` (요약 안내 `:239`와 같은 중립 레일). 문구(`:79-83`) 유지.
  - 요약 안내(`:239-245`): `data-body-excerpt` 유지, `className="border-l-2 border-border pl-3 text-caption text-text-secondary"`, 문구 → `원문 매체({article.source.sourceName})가 기사 앞부분만 제공해 요약 분량만 실려 있습니다 ·{' '}` + 링크 `전체 기사 원문 보기`(조사 자리표시 "이(가)" 제거), 링크 `className="underline underline-offset-2 transition-colors hover:text-text"`.
  - 본문 없음(`:248`): `className="text-body-md text-text-secondary"`, 문구 유지.
  - 접힌 원문(`:121,123`): 상자 `mt-2 rounded-card border border-border bg-surface-card p-5`, 안쪽 글 `space-y-3 text-body-md text-text-secondary`.
  - `<summary>`(`:257-260`): `className="inline-flex h-10 cursor-pointer items-center gap-2 text-body-md text-text-secondary transition-colors hover:text-text"`, `<Chevron className="h-4 w-4 transition-transform group-open:rotate-90" />`. `Chevron`(`:85-91`)의 `strokeWidth={2}` → svg 속성 `strokeWidth={1.5}`.
  - `<hr>`(`:208`)·블록 간격 `mb-8 space-y-8`(`:212`) 유지.
- 기대 효과: 긴 글이 읽히는 줄 길이. 본문 영역에 강조색 0.
- Evaluator 검증: verify "reading measure ≤ 720", "accent-coloured text inside the article" 0, "text-transform uppercase" 0, "letter-spacing" 0. 본문 `<p>`의 계산값 1440px: `font-size` 18px·`line-height` 32px, 390px: 16px·28px. 표식 회귀: 305/345 title-pending, 360/406 body-pending, 393 excerpt+body-pending+title-pending, 1 `<details>` — verify가 확인.

### 항목 10: 기사 상세 — 출처 줄·태그·관련 기사
- **[패스 7 알약·nested radius · 패스 2 색 막대 · 패스 3 아이콘 크기]**
- 대상 파일: `src/app/article/[id]/page.tsx:266-309`
- 현재 문제: 태그가 테두리 있는 알약 + 주황 hover(`:284`), 외부 링크 아이콘 12px stroke 2(`:272`), "관련 기사"에 주황 막대(`:300`), 좁아진 단에 3열 그리드.
- 개선 방법:
  - 출처 줄(`:266-275`): `className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-body-md text-text-secondary"` 안에 `{dateline}`(항목 8의 같은 JSX) + `원문 보기` 링크(`inline-flex items-center gap-2 transition-colors hover:text-text`, 아이콘 `h-4 w-4`·`strokeWidth={1.5}`) + `목록으로`(`transition-colors hover:text-text`).
  - 태그(`:281-287`): `className={TAG}` (`#` 유지, 높이 24·모서리 6·테두리 없음).
  - 관련 기사(`:298-308`): `<h2 className="mb-4 text-headline-md text-text">관련 기사</h2>`(막대 삭제), 그리드 `grid grid-cols-1 gap-5 sm:grid-cols-2`. 섹션 `border-t border-border pt-8` 유지.
- 기대 효과: 꼬리에도 같은 데이트라인. 태그가 조용한 글자표.
- Evaluator 검증: verify "pill-shaped element" 0(`/article/401` 태그 많은 기사 포함해 수동 확인). 관련 기사 카드 폭 ≥ 320px(1440px), 6장이 2열 3행. `grep -c "strokeWidth={2}" 'src/app/article/[id]/page.tsx'` = 0.

### 항목 11: 검색 — 입력·필터·결과 줄·상태
- **[패스 4 · "Wordy placeholders" / 말줄임표 / 모호한 표현 · 패스 2 강조색 버튼·오류색 · 패스 7 모서리·포커스]**
- 대상 파일: `src/app/search/page.tsx:27,130-236`
- 현재 문제: placeholder `키워드를 입력하세요...`(레이블 없음), 주황 면 + 흰 글자 버튼 2개(`:141,206`), `rounded-card`/`rounded-badge`/제각각 focus ring(`:137,161,180`), 결과 줄 `"AI" 검색 결과: 40054건`(쉼표 없음), 오류 제목 빨강(`:200`) + "오류가 발생했습니다"(무엇이 안 됐는지 없음), `검색 중...`·`로딩 중...`, 주황 스피너, "키워드/검색어" 용어 혼용.
- 개선 방법:
  - Suspense fallback(`:27`): `<div className="py-16 text-center text-body-md text-text-secondary">불러오는 중</div>`
  - 입력(`:132-138`): `aria-label="검색어"`, `placeholder="검색어"`, `className="h-12 w-full flex-1 rounded-control border border-border bg-surface-elevated px-4 text-body-lg text-text placeholder:text-text-muted transition-colors"` (자체 focus 클래스 삭제 → 전역 링).
  - 제출 버튼(`:139-144`): `className={`${BTN_PRIMARY} h-12 px-6`}` 대신 리터럴로 `"inline-flex h-12 items-center justify-center whitespace-nowrap rounded-control bg-text px-6 text-body-md font-medium text-accent-ink transition-colors hover:bg-text/90"` (이 화면의 주요 동작 1개).
  - 필터 select 2개(`:161,180`): `className={FIELD_SM}`. 레이블 유지.
  - 결과 줄(`:191-195`): `<p className="mb-4 text-body-md text-text-secondary">“{q}” 검색 결과 <span className="font-mono tabular-nums text-text">{formatCount(total)}</span>건</p>` (콜론 삭제).
  - 오류(`:197-210`): `<EmptyState alert title="검색하지 못했습니다" detail="잠시 후 다시 시도하세요"><button type="button" onClick={() => setRetryKey((k) => k + 1)} className={BTN_SECONDARY}>다시 시도</button></EmptyState>` — `role="alert"`는 `EmptyState`가 문장 묶음에 건다(이전과 같은 위치).
  - 로딩(`:211-215`): `<div role="status" className="py-16 text-center text-body-md text-text-secondary"><div aria-hidden="true" className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />검색 중</div>`
  - 결과 없음(`:224-229`): `<EmptyState title="검색 결과가 없습니다" detail="다른 검색어로 다시 찾아보세요" />`
  - 검색어 없음(`:231-236`): `<EmptyState title="검색어를 입력하세요" detail="국가와 카테고리로 결과를 좁힐 수 있습니다" />`
  - 로직(`useEffect`, `retryKey`, `router.replace`, `pagePattern`)은 한 글자도 바꾸지 않는다.
- 기대 효과: 검색 화면에 주황 0, 주요 버튼 1개, 문구가 짧고 구체적.
- Evaluator 검증: verify search 검사(placeholder, 결과 줄 형식). `/search?q=zzzzqqq` → "검색 결과가 없습니다". API를 막고(`page.route('**/api/search**', r => r.abort())`) → `[role="alert"]` + "다시 시도" 클릭 시 재요청 1회. `?q=AI&page=99999` → 마지막 페이지로 교체. Tab으로 입력에 포커스 → `outline` 2px 강조색·offset 2px.

### 항목 12: 빈 상태·오류 상태 — 한 형태, 장식 없음
- **[패스 8 · "Decorative filler goes" · 패스 4 마침표·느낌표·모호한 표현 · 패스 3 크기 다른 아이콘]**
- 대상 파일: `page.tsx:212-231`, `[country]/page.tsx:121-132`, `breaking/page.tsx:57-62`, `category/[slug]/page.tsx:99-110`, `ranking/page.tsx:42-47`
- 현재 문제: 홈 빈 상태에만 64px stroke 1 신문 아이콘, 6벌이 `py-24`/`py-20`·`text-text-secondary`/`text-text-muted` 조합으로 제각각, 보조 문장이 muted(본문에는 muted 금지), 링크 버튼이 `rounded-card` + 주황 hover.
- 개선 방법: 전부 `EmptyState`로.

  | 화면 | title | detail | 동작 |
  |---|---|---|---|
  | 홈 | 아직 표시할 뉴스가 없습니다 | 새 기사가 수집되면 이곳에 표시됩니다 | — (svg `:214-227` 삭제) |
  | 속보 | 아직 표시할 뉴스가 없습니다 | 새 기사가 수집되면 이곳에 표시됩니다 | — |
  | 국가 | `{config.label} 뉴스가 아직 없습니다` | 새 기사가 수집되면 이곳에 표시됩니다 | `<Link href="/breaking" className={BTN_SECONDARY}>전체 속보 보기</Link>` |
  | 카테고리 | `{label} 분야 기사가 아직 없습니다` | 새 기사가 수집되면 이곳에 표시됩니다 | 위와 같음 |
  | 랭킹 | 아직 랭킹 데이터가 없습니다 | 기사 조회가 쌓이면 이곳에 순위가 표시됩니다 | — |

  문구 점검 결과: 느낌표 0, 한 문장짜리 끝 마침표 0, 모호한 "오류가 발생했습니다"는 검색(항목 11)에서 교체. 404·오류 화면(`not-found.tsx`·`error.tsx`)은 S2.
- 기대 효과: 빈 화면이 같은 두 줄. 장식 0.
- Evaluator 검증: `grep -c "w-16 h-16" src/app/page.tsx` = 0. `grep -rn "py-24\|py-20" src/app --include=page.tsx` = 0. (빈 DB 재현이 어렵다면 `EmptyState` 사용을 소스로 확인.)

### 항목 13: 숫자·날짜 형식 전수 교체
- **[패스 5 · "Numbers in mixed formats → one format, tabular figures" · 계약 6절 "`toLocaleString` 금지"]**
- 대상 파일: S4 페이지 전부
- 전수 조사(S4 범위, `grep -rnE "toLocale|Intl\.|toFixed" src` + 날것 숫자 수동 확인):

  | 위치 | 현재 | 변경 |
  |---|---|---|
  | `admin/page.tsx:135,139` | `stats.totalArticles.toLocaleString()` 등 | `formatCount(…)` (항목 16) |
  | `admin/page.tsx:143,147` | `{stats.activeSources}`, `{stats.failedCollections}` | `formatCount(…)` |
  | `admin/page.tsx:160,173` | `item.count.toLocaleString()` | `formatCount(item.count)` |
  | `admin/page.tsx:217,218` | `{log.articlesFound}`, `{log.articlesNew}` | `formatCount(…)`, `TD_NUM` |
  | `admin/sources/page.tsx:231` | `(source.articleCount ?? 0).toLocaleString()` | `formatCount(source.articleCount ?? 0)` |
  | `admin/sources/page.tsx:145` | `소스 관리 ({sources.length})` | `PageHeading count unit="개"` |
  | `admin/articles/page.tsx:113` | `` `기사 관리 (${total})` `` | `PageHeading count={ready ? total : null}` |
  | `admin/articles/page.tsx:187` | `{article.viewCount}` (`2599`) | `formatCount(article.viewCount)` |
  | `admin/articles/page.tsx:213`, `admin/logs/page.tsx:160-162` | `{page} / {totalPages}` | `<span className="font-mono tabular-nums text-meta text-text-muted">{page} / {Math.max(1, totalPages)}</span>` |
  | `admin/logs/page.tsx:69` | `` `수집 로그 (${total})` `` | `PageHeading count={load.status === 'ready' ? total : null}` |
  | `admin/logs/page.tsx:86,90,94,135,136` | 날것 숫자 | `formatCount(…)` |
  | `breaking/page.tsx:37`, `[country]/page.tsx:74`, `category/[slug]/page.tsx:49` | `{total}개` | `PageHeading count` → `164,917건` |
  | `search/page.tsx:193` | `{total}건` | `formatCount(total)` (항목 11) |
  | ID 열(`admin/articles/page.tsx:166`, `admin/logs/page.tsx:123`) | 숫자 | 식별자이므로 쉼표 없이, `TD_NUM` + `text-text-muted` |

  날짜: S4 파일의 날짜 출력은 `formatDate()`(KST 고정 산술, `utils.ts:303`)뿐이라 서버·브라우저가 같다 — 유지. `timeAgo`(`article/[id]/page.tsx:116`)는 항목 8에서 삭제. `Intl`·`toLocaleDateString` 사용 0(확인).
  S4 밖에 남는 것(담당 슬라이스가 처리해야 함): `Header.tsx:54,56`, `Footer.tsx:108,112`, `TrendingKeywords.tsx:66`.
- 기대 효과: 숫자 한 형식(쉼표 + `tabular-nums`), 하이드레이션 차이 원천 제거.
- Evaluator 검증: `grep -rn "toLocaleString" src/app` = 0. 관리자 기사 목록의 조회 열이 `2,599` 형식·오른쪽 정렬. `ui-audit.js` 콘솔 하이드레이션 경고 0.

### 항목 14: 아이콘·이모지 전수 표와 통일안
- **[패스 3 · "Emoji as … label decoration" / "Icons in many sizes" → 16px · stroke 1.5 · 글자 역할 색]**
- 대상 파일: `page.tsx`, `[country]/page.tsx`, `article/[id]/page.tsx`
- 전수 표(S4 파일의 이모지·인라인 SVG 전부. 관리자 4화면·속보·카테고리·랭킹·검색에는 SVG 없음, 검색 스피너는 CSS 테두리):

  | # | 위치 | 무엇 | 현재 크기·선 | 처리 |
  |---|---|---|---|---|
  | E1 | `[country]/page.tsx:19-22,71` | 🌍 🇺🇸 🇯🇵 🇨🇳 (30px) | 이모지 | 삭제(대체 아이콘 없음 — 제목이 이미 나라를 말한다) |
  | I1 | `page.tsx:142-154` | 카테고리 제목 화살표 | 14px, stroke 2, `opacity-60` | 유지 → `h-4 w-4`, `strokeWidth={1.5}`, `text-text-muted`, 라벨과 `gap-2` |
  | I2 | `page.tsx:214-227` | 빈 상태 신문 | 64px, stroke 1 | 삭제(항목 12) |
  | I3 | `article/[id]/page.tsx:136,142` | 경로 구분 화살표 | 12px, stroke 2 | 글자 `/`로 교체(항목 8) |
  | I4 | `article/[id]/page.tsx:258` | 원문 펼침 화살표 | 14px, stroke 2 | 유지 → `h-4 w-4`, 1.5 |
  | I5 | `article/[id]/page.tsx:175` | 시계 | 14px, stroke 2 | 삭제(항목 8) |
  | I6 | `article/[id]/page.tsx:272` | 외부 링크 | 12px, stroke 2 | 유지 → `h-4 w-4`, 1.5, `gap-2` |

  남는 3개(I1·I4·I6)의 공통 속성: `aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}`(svg 요소에), path에 `strokeLinecap="round" strokeLinejoin="round"`, 색은 부모 글자 역할, 자체 색·`opacity-*` 없음. 아이콘 세트는 프로젝트가 이미 쓰는 인라인 outline 경로를 유지(새 의존성 없음).
- 기대 효과: S4 화면에 이모지 0, 아이콘 한 크기·한 굵기.
- Evaluator 검증: audit P3 3행 = 0. 브라우저에서 `main svg`의 `getBoundingClientRect()` 폭이 전부 16(북마크·공유 등 S3 아이콘이 다르면 백스톱 항목 21로 보고), `stroke-width` 계산값 1.5.

### 항목 15: 관리자 — 머리 줄과 버튼 체계
- **[패스 5 굵기·토큰 밖 크기 · 패스 2 "primary button can be an off white" · 패스 6 모바일 줄바꿈]**
- 대상 파일: `admin/page.tsx:96,110-129`, `admin/sources/page.tsx:132,144-152,199-206`, `admin/articles/page.tsx:111-139,211-215`, `admin/logs/page.tsx:68-80,152-170`
- 현재 문제: h1 `text-2xl font-bold` 8곳, 주황 면 버튼 3개(수동 수집·새 소스 추가·폼 제출) + 주황 테두리 버튼 1개, 390px에서 제목 2줄 + 버튼 2줄(`planner-s4-m-admin.jpg`), select `rounded px-2 py-1` + `focus:border-accent focus:outline-none`.
- 개선 방법:
  - 네 화면의 h1 전부 `PageHeading`(로딩·오류 분기의 h1 포함):
    - 대시보드: `<PageHeading title="관리자 대시보드">` + 자식으로 `<button … className={BTN_SECONDARY} title=…>{fixing ? '번역 보정 중' : '미번역 보정'}</button>` `<button … className={BTN_PRIMARY}>{collecting ? '수집 중' : '수동 수집 실행'}</button>`. 로딩·오류 분기(`:96`)는 `<PageHeading title="관리자 대시보드" />`.
    - 소스: `<PageHeading title="소스 관리" count={sources.length} unit="개">` + `<button … className={showForm ? BTN_SECONDARY : BTN_PRIMARY}>{showForm ? '취소' : '소스 추가'}</button>`. 폼이 열리면 폼의 제출 버튼이 그 화면의 주요 버튼이 된다 → 동시에 주요 버튼 1개.
    - 기사: `<PageHeading title="기사 관리" count={ready ? total : null}>` + select 2개(`className={FIELD_SM}`, 기존 sr-only 레이블 유지).
    - 로그: `<PageHeading title="수집 로그" count={load.status === 'ready' ? total : null}>` + `<label htmlFor="admin-log-status" className="sr-only">상태</label>` + select(`id="admin-log-status"`, `FIELD_SM`).
  - 폼 버튼(`admin/sources/page.tsx:200-205`): 제출 `BTN_PRIMARY`(`{saving ? '저장 중' : editSource ? '수정' : '추가'}`), 취소 `BTN_SECONDARY`.
  - 페이지네이션(기사·로그): 이전/다음 `BTN_SECONDARY_SM`, 가운데는 항목 13의 고정폭 `1 / 14`, 래퍼 `mt-6 flex items-center justify-center gap-3`.
  - "전체 보기"(`admin/page.tsx:184`): `<Link href="/admin/logs" className={BTN_GHOST_SM}>전체 보기</Link>`.
- 기대 효과: 관리자 화면마다 주요 버튼(밝은 면) 최대 1개, 나머지는 보조. 모바일에서 버튼이 제목 아래 한 줄로 내려간다.
- Evaluator 검증: verify admin "primary fill ≤ 1", "accent-filled 0", "font-weight > 600" 0. 390px `/admin`에서 버튼 2개가 한 줄, 글자 줄바꿈 없음(높이 40). `/admin/sources`에서 "소스 추가" 클릭 → 밝은 면 버튼이 폼의 "추가" 1개뿐.

### 항목 16: 관리자 — 통계 카드는 숫자만
- **[패스 7 · "Stat cards are numbers. A label, a big figure and a change with what it compares to" · 패스 2 의미색만 · 패스 4 "says what it compares to"]**
- 대상 파일: `admin/page.tsx:132-178`, `admin/logs/page.tsx:83-96`
- 현재 문제: 숫자 4개가 주황·초록·흰색·빨강(`:135,139,143,147`)으로 전부 강조, `font-bold text-3xl`, `shadow-card`, `rounded-lg`. "수집 실패 6"은 무엇의 언제 값인지 없다(API는 "최근 24시간에 실패 로그가 있는 소스 수" — `api/admin/stats/route.ts:52-57`). 로그 화면의 3장은 가운데 정렬이고 "성공 41"이 전체가 아니라 이 페이지 50건 중이라는 기준이 없다. 대시보드 두 목록 패널은 높이를 맞추느라 "국가별"에 빈 면이 생긴다.
- 개선 방법:
  - 대시보드 카드(4장, `<dl className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">`):

    | 라벨 | 값 | 기준(3번째 줄) | 근거 |
    |---|---|---|---|
    | 전체 기사 | `totalArticles` | 비활성 제외 | `route.ts:23` |
    | 오늘 수집 | `articlesToday` | KST 0시부터 | `route.ts:12,25-27` |
    | 활성 소스 | `activeSources` | 수집 대상 | `route.ts:29` |
    | 수집 실패 소스 | `failedCollections` | 최근 24시간 | `route.ts:52-57` |

    ```tsx
    <div key={s.label} className={`${PANEL} p-5`}>
      <dt className="text-caption text-text-secondary">{s.label}</dt>
      <dd className={cn('mt-2 font-mono text-headline-lg font-medium leading-none tabular-nums', s.alert ? 'text-negative' : 'text-text')}>{formatCount(s.value)}</dd>
      <dd className="mt-2 text-caption text-text-muted">{s.basis}</dd>
    </div>
    ```
    `alert`는 "수집 실패 소스"가 0보다 클 때만 true. 나머지 숫자는 전부 `text-text`. 아이콘·스파크라인·막대 추가 금지.
  - 로그 화면 카드(3장, `grid grid-cols-3 gap-4 mb-6`): 같은 마크업, 왼쪽 정렬(`text-center` 삭제), `p-4`.
    `이 페이지` / `formatCount(logs.length)` / `` `전체 ${formatCount(total)}건 중` `` · `성공` / `successCount` / `이 페이지 기준` · `실패` / `failedCount`(0보다 크면 `text-negative`) / `이 페이지 기준`.
  - 두 목록 패널(`:152-178`): 그리드 `mb-8 grid grid-cols-1 items-start gap-5 md:grid-cols-2`, 패널 `${PANEL} p-5`, 제목 `<h2 className="mb-3 text-headline-sm text-text">`, 목록 `<ul className="space-y-1">` + `<li className="flex h-8 items-center justify-between">` 라벨 `text-body-md text-text-secondary` / 값 `font-mono tabular-nums text-body-md text-text`.
- 기대 효과: 색이 있는 숫자는 "실패가 있을 때의 실패 수" 하나. 카드 4장 같은 높이·같은 패딩.
- Evaluator 검증: verify admin "non-token colours" 0. `/admin`에서 카드 4장 `height` 동일, 숫자 `font-size` 28px·`font-weight` 500·mono. 실패 0인 상태(또는 값을 0으로 가정한 소스 검토)에서 빨강 없음. "국가별" 패널 높이 < "카테고리별" 패널 높이.

### 항목 17: 관리자 — 표의 행 상태, 의미색, 숫자 열
- **[패스 7 · 체크리스트 "Table row states read apart: header, value in use, selection and keyboard focus" · 패스 2 "Semantic colors only carry meaning" · 패스 1 "numbers align right in one column"]**
- 대상 파일: `admin/page.tsx:181-237`, `admin/sources/page.tsx:211-247`, `admin/articles/page.tsx:148-208`, `admin/logs/page.tsx:105-149`
- 현재 문제: 머리글 `bg-surface-elevated`와 hover `bg-surface-elevated/50`이 같은 계열이라 머리글이 "선택된 행"처럼 보이고, 편집 중인 소스 행 표시가 없다. 상태가 초록·빨강·주황 색 면 태그(`success`/`failed`/`partial` 영어 그대로, partial에 강조색), 빈 오류 칸 `-`도 빨강, 숫자 열 왼쪽 정렬, 국가가 `us/global` 원시 코드, 토글 버튼이 색 태그 모양(`text-xs`), "수정"이 주황 글자 링크.
- 개선 방법(네 표 공통):
  - 래퍼 `TABLE_WRAP`(그림자 삭제), `<table className="w-full text-body-md">`.
  - **머리글**: `<thead><tr className="border-b border-border">`, 칸 `TH`/`TH_NUM`(면 없음, 12px muted 500) — 면이 아니라 글자 크기·헤어라인으로 구분.
  - **hover**: `<tr className={TR}>`(면 반 단계). **키보드 포커스**: 같은 행에 `focus-within` 반 단계 + 포커스된 컨트롤의 전역 링. **선택(값 사용 중)**: 소스 표에서 편집 중인 행 `className={cn(TR, editSource?.id === source.id && TR_SELECTED)}` + `data-selected` + 첫 칸에 `border-l-2`(선택 시 `border-accent`, 아니면 `border-transparent` — 모든 행의 첫 칸에 걸어 글자 시작선을 맞춘다).
  - 칸: 이름·제목 `TD_MAIN`, 보조 `TD`, 숫자(ID·발견·신규·기사 수·조회) `TD_NUM`(+ID는 `text-text-muted`), 시각 `TD_TIME`(`formatDate(…) || '-'`). 숫자 열의 `<th>`는 `TH_NUM`. 기존 `hidden sm:table-cell`은 그대로 덧붙인다.
  - 상태(로그 2표, `admin/page.tsx:205-215`, `admin/logs/page.tsx:127-133`):
    ```tsx
    const st = LOG_STATUS[log.status] ?? { label: log.status, dot: 'bg-text-muted' };
    <span className="inline-flex items-center gap-2 text-text-secondary"><span aria-hidden="true" className={cn(STATUS_DOT, st.dot)} />{st.label}</span>
    ```
  - 오류 칸: `<td className={cn(TD, 'max-w-xs truncate hidden sm:table-cell', log.errorMessage ? 'text-negative' : 'text-text-muted')} title={log.errorMessage ?? undefined}>`. 열 머리글 `에러` → `오류`.
  - 토글(소스 `:233-238`, 기사 `:189-196`): `className={BTN_SECONDARY_SM}` + `aria-pressed={on}` + 점(`on ? 'bg-positive' : 'bg-text-muted'`) + `활성`/`비활성`. 비활성은 실패가 아니므로 빨강을 쓰지 않는다. 소스 토글에 `aria-label={`${source.sourceName} ${source.isEnabled ? '비활성으로 전환' : '활성으로 전환'}`}` 추가(기사 토글의 기존 레이블 유지).
  - "수정"(소스 `:241`): `className={BTN_GHOST_SM}`.
  - 소스 표: 타입 태그(`:228`) → 글자만(`TD`), 국가(`:229`) → `countryLabel(source.country)`, 언어 그대로. 로그 표 국가(`admin/logs/page.tsx:125`) → `countryLabel(log.source.country)`. (`countryLabel` import 추가.)
  - 기사 표 제목 링크(`:170`): `className="line-clamp-1 text-text underline-offset-4 hover:underline"`, 묶음 `gap-1.5` → `gap-2`.
  - 빈 행: `<td colSpan={n} className="h-24 px-4 text-center text-text-muted">`.
- 기대 효과: 머리글·hover·선택·포커스가 서로 다른 신호. 초록/빨강은 점과 오류 글자에만.
- Evaluator 검증: verify admin "raw enum cell" 0, "numeric cells tabular + right" 통과, "non-token colours" 0. `/admin/sources`에서 "수정" 클릭 → 그 행만 `background-color: rgb(38, 36, 33)` + 첫 칸 왼쪽 2px 강조색; 다른 행 hover 시 반투명 면(서로 다름). Tab으로 토글에 포커스 → outline 보임 + 행 면 변화. `thead`의 `background-color`가 투명. 토글 클릭 → 낙관적 변경 후 재조회(기존 동작), 실패 시 롤백 + alert.

### 항목 18: 관리자 — 폼, 알림 문구, 오류 상자
- **[패스 4 · "Trailing periods" / 말줄임표 / 영어 문장 노출 · 패스 7 모서리·포커스 · 패스 2 강조색 레일]**
- 대상 파일: `admin/sources/page.tsx:156-207`, `admin/page.tsx:64-91`, `admin/sources/page.tsx:91,114`, `admin/articles/page.tsx:103`, `src/components/AdminLoadError.tsx`
- 현재 문제: 폼 입력 `rounded`(4px) + `focus:border-accent focus:outline-none`, 레이블이 입력과 연결되지 않음(`htmlFor` 없음), `shadow-card`. 번역 보정 완료 알림이 API의 영어 문장(`Healed 3/500 titles and …`) 그대로(`admin/page.tsx:85`). alert 문구에 마침표 2개짜리 문장·"실패했습니다". 오류 상자 레일이 강조색(`AdminLoadError.tsx:23`), `rounded-lg`, 스피너가 강조색(`:47`), 문구 끝 마침표.
- 개선 방법:
  - 폼(`:156`): `<form … className={`${PANEL} mb-6 p-5`}>`, 제목 `<h2 className="mb-4 text-headline-sm text-text">{editSource ? '소스 수정' : '소스 추가'}</h2>`, 각 필드 `<label htmlFor="src-name" className="mb-2 block text-body-md text-text-secondary">` + 입력/선택 `id="src-…"` `className={FIELD}`. 선택지 문구 한 형식: 국가 `글로벌` → `세계`(표·기사 화면과 같은 말), 언어 `English/Japanese/Chinese/Korean` → `영어/일본어/중국어/한국어`(value 불변).
  - alert 문구(동작은 그대로 `alert()`):

    | 위치 | 현재 | 변경 |
    |---|---|---|
    | `admin/page.tsx:69` | 수집이 시작되었습니다 | 수집을 시작했습니다 |
    | `admin/page.tsx:71` | 수집 시작에 실패했습니다. 잠시 후 다시 시도해주세요. | `수집을 시작하지 못했습니다\n잠시 후 다시 시도하세요` |
    | `admin/page.tsx:85` | `data.message \|\| '번역 보정이 완료되었습니다'` | 숫자 필드가 있으면 `` `제목 ${formatCount(d.titlesFixed)}건, 본문 ${formatCount(d.contentFixed)}건을 번역했습니다\n남은 제목 ${formatCount(d.remainingTitles)}건 · 본문 ${formatCount(d.remainingContent)}건` ``, 없으면 `번역 보정을 마쳤습니다` (필드: `api/admin/fix-translations/route.ts:71-77`; `typeof === 'number'` 확인 후 사용) |
    | `admin/page.tsx:87` | 번역 보정에 실패했습니다. … | `번역을 보정하지 못했습니다\n잠시 후 다시 시도하세요` |
    | `admin/sources/page.tsx:91` | `소스 저장에 실패했습니다: ${…}` | `` `소스를 저장하지 못했습니다\n${…}` `` |
    | `admin/sources/page.tsx:114` | 소스 상태 변경에 실패했습니다. … | `소스 상태를 바꾸지 못했습니다\n잠시 후 다시 시도하세요` |
    | `admin/articles/page.tsx:103` | 상태 변경에 실패했습니다. … | `기사 상태를 바꾸지 못했습니다\n잠시 후 다시 시도하세요` |

  - `AdminLoadError.tsx`:
    - `MESSAGES`: auth `{ title: '관리자 인증이 필요합니다', detail: '페이지를 새로고침해 다시 로그인하세요' }`, server `{ title: '데이터를 불러오지 못했습니다', detail: '서버 오류 · 잠시 후 다시 시도하세요' }`, invalid `{ title: '데이터를 불러오지 못했습니다', detail: '응답 형식이 올바르지 않습니다 · 잠시 후 다시 시도하세요' }`, network `{ title: '서버에 연결할 수 없습니다', detail: '네트워크 연결을 확인하세요' }`.
    - 상자(`:22`): `rounded-card border border-border bg-surface-card p-6 text-center`, 레일(`:23`): `border-l-2 border-negative pl-3 …`(오류의 의미색), HTTP 코드 `font-mono tabular-nums text-meta text-text-muted`, 버튼(`:34`) `BTN_SECONDARY`, 버튼 래퍼 `mt-6`.
    - `AdminLoading`(`:46-47`): `py-16`, 스피너 `mx-auto h-8 w-8 animate-spin rounded-full border-2 border-text-muted border-t-transparent`(이름 `animate-spin` 유지).
- 기대 효과: 관리자 문구가 전부 한국어·한 말투·마침표 없음. 오류 상자만 의미색.
- Evaluator 검증: `grep -rn "실패했습니다\.\|해주세요\.\|\.\.\.'" src/app/admin src/components/AdminLoadError.tsx` = 0. 폼의 모든 `label[for]`가 존재하는 `id`를 가리킴. API 차단(`page.route('**/api/admin/stats', r => r.fulfill({ status: 500 }))`) → 오류 상자 + "다시 시도" → 재요청; 401 → "관리자 인증이 필요합니다". `npm test`의 `admin-fetch.test.ts` 통과.

### 항목 19: 모션 정리
- **[패스 9 · "At most one entrance on load" / "Everything flying in on load" / `transition-all`]**
- 대상 파일: `src/app/page.tsx:79,120,186,206` 및 S4 전체
- 현재 문제: 홈의 섹션 4개가 각각 `animate-fade-in`(같은 화면에 진입 4개). 나머지 페이지는 진입 없음 — 화면마다 다르다.
- 개선 방법: **S4 페이지의 진입 애니메이션은 0개**로 통일(`animate-fade-in` 4곳 삭제). 근거: 서버가 그린 기사가 첫 페인트에 바로 읽혀야 하고(머리기사 사진이 LCP), 계약에 진입 클래스 이름이 없다. 남기는 움직임: 색·면 전환 `transition-colors`(150ms, S1 기본 easing), 원문 펼침 화살표 `transition-transform`, 로딩 스피너 `animate-spin`(검색·관리자, 상태를 설명하는 움직임), 티커(S3). `transition-all`·`hover:scale`·`duration-*` 사용 0 유지.
- 기대 효과: 모든 S4 화면이 같은 규칙(진입 없음, hover는 색만).
- Evaluator 검증: audit P9 2행 = 0. verify "entrance/loop animation" 0(티커 제외). `prefers-reduced-motion`에서 화면 동일.

### 항목 20: 비주얼 패스·첫 화면·템플릿 체크
- **[패스 8 · "Dashboards and app screens almost never need generated images" · 체크리스트 "first screen composed … no dead empty band" / "Template check"]**
- 대상 파일: 구조 확인(코드 변경은 다른 항목에 포함)
- 결정:
  - 생성 이미지·일러스트·대체 장식을 **추가하지 않는다**. 빈 상태·검색 초기 화면·404에 아이콘을 넣지 않는다. 이미지 슬롯은 기존 기사 사진뿐이며 대체 사진의 인쇄 처리(`.img-standin`)는 S1·S3.
  - 모먼트 2개의 자리: 홈 머리기사(`lead`, 왼쪽 2/3 폭) + 바로 아래 통신 목록. 다른 화면에는 모먼트를 만들지 않는다(목록·기사·관리자는 조용한 크롬 + 시그니처).
  - 첫 화면(1440×900, 390×844) 구성: 홈 = 티커 → "주요 헤드라인" → 머리기사 사진이 첫 화면 안, 죽은 띠 없음(컨테이너 위 32, 티커 아래 32). 목록 = 제목 줄(위 32) → 칩 → 카드. 기사 = 경로 → 사진 → 데이트라인 → 제목이 첫 화면 안(1440). 검색 초기 = 제목 → 입력 → 필터 → 두 줄 안내(위아래 64).
  - 시그니처 배치는 "디자인 방향"의 표를 따른다.
- 기대 효과: 정리된 뒤에도 "어느 제품에나 맞는 화면"으로 떨어지지 않는다.
- Evaluator 검증: `main img` 중 기사 사진이 아닌 것 0, `main svg` 개수가 항목 14 표와 일치(카드·공유·북마크의 S3 아이콘 제외). 1440·390 첫 화면 스크린샷에서 높이 120px 이상의 빈 띠 없음. 표의 시그니처 5행을 화면에서 하나씩 확인.

### 항목 21: 회귀 잠금 — 정적 테스트와 S2/S3 백스톱
- **[스킬 6단계 "Check … Anything still on the list gets fixed" · 라운드 규칙 "이전 라운드의 동작 회귀 금지"]**
- 대상 파일: `tests/unslop-pages.test.ts`(신규)
- 개선 방법:
  1. `tests/unslop-pages.test.ts`(`node:test`, 파일 읽기만): S4 페이지 11개 + `ui.ts`·`PageHeading.tsx`·`EmptyState.tsx`·`AdminLoadError.tsx`에 대해
     - 금지 패턴 0: `accent-(blue|red|green)`, `text-white`, `font-(bold|semibold|extrabold)`, `uppercase`, `tracking-`, `\bitalic\b`, `rounded-(pill|lg|badge)`, `shadow-(card|elevated|dropdown)`, `animate-(fade|slide)`, `transition-all`, `toLocaleString`, 반 단계 간격(`-[1-9]\d*\.5\b`), `-\[[^\]]+\]` 임의 값, `getCategoryStyle`, 이모지(`/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u` — 주석의 `→`·`—`·`·`는 걸리지 않는 범위).
     - 구조 유지: `article/[id]/page.tsx`에 `data-translation-status="title-pending"`, `data-translation-status="body-pending"`, `data-body-excerpt`, `data-original-body`, `font-serif`가 있다. `page.tsx`에 `lead`가 있고 `rank=`가 없다. `search/page.tsx`에 `retryKey`·`role="alert"`가 있다(EmptyState 경유면 `alert` prop).
     - 404 구조: `src/app/loading.tsx`, `src/app/[country]/loading.tsx`, `src/app/article/[id]/loading.tsx`가 **없다**. 서버 페이지(`page.tsx` 중 `'use client'`가 없는 것)에 `<Suspense`가 없다.
  2. 백스톱(S4가 마지막 슬라이스): 구현을 마친 뒤 `bash qa-out/planner-s4-audit.sh`의 "backstop" 구역과 `node qa-out/planner-s4-verify.js`를 돌린다. S4 화면에 그려지는 S2·S3 컴포넌트(`TrendingKeywords`, `ShareButtons`, `ArticleHeroImage`, `AdminNav`, `admin/layout.tsx`, `NewsletterBanner`, `BookmarkButton`, 카드 3종, `Pagination`)에 징후가 남아 verify가 실패하면, **그 클래스만** 계약 토큰으로 바꾸는 최소 수정을 하고 파일·줄·이유를 SELF_CHECK-S4.md에 적는다(구조·props 변경 금지). 대표적으로 남기 쉬운 것: `admin/layout.tsx:21`의 `font-bold text-lg text-accent` 워드마크(→ `text-headline-sm text-text`), `TrendingKeywords.tsx:14-17,65-66`의 순위 색·알약·`toLocaleString`, `ArticleHeroImage.tsx:53`의 `uppercase tracking-widest`, `ShareButtons.tsx:113`의 `text-accent-red`.
- 기대 효과: 다음 수정에서 징후가 되돌아오면 `npm test`가 잡는다. 화면 단위 체크리스트가 슬라이스 경계 때문에 새지 않는다.
- Evaluator 검증: `npm test` 전체 통과(신규 파일 포함). `bash qa-out/planner-s4-audit.sh` — "info" 행을 뺀 모든 행 0, backstop 구역 전부 0. `node qa-out/planner-s4-verify.js` → `ALL PASS`(기준선 225 FAIL).

---

## 통합 검증 절차 (Evaluator)

```bash
cd /home/user/hydro
npx tsc --noEmit && npm test && npm run build          # 타입·단위·빌드
bash qa-out/planner-s4-audit.sh                        # 징후 0 (info 행 제외)
# 앱 재시작은 오케스트레이터가 수행한 뒤:
node qa-out/planner-s4-verify.js                       # ALL PASS
node scripts/qa/ui-audit.js after-unslop-s4            # ALL CLEAN (넘침·깨진 이미지·콘솔·404)
B=http://127.0.0.1:4000/livenews
for u in /nope /xx /article/999999 /article/abc /category/nope /article/407; do curl -s -o /dev/null -w "$u %{http_code}\n" $B$u; done   # 전부 404
for u in "/breaking?page=99999" "/category/economy?page=99999" "/world?page=99999"; do curl -s -o /dev/null -w "$u %{http_code} %{redirect_url}\n" "$B$u"; done   # 전부 307 → 마지막 페이지
```

화면 비교: `qa-out/unslop/before/prod/*.jpg`와 같은 경로·뷰포트(1440, 390)로 다시 찍어 9개 패스 체크리스트(SKILL.md 끝)를 화면별로 대조한다. 렌더 확인은 3회 이내.

회귀 표식 기준선(Planner 실측, `≥1`이면 있음):

| 기사 | title-pending | body-pending | excerpt | original-body | details | 상태 |
|---|---|---|---|---|---|---|
| 1 | – | – | – | ✓ | ✓ | 200 |
| 305, 345 | ✓ | – | – | ✓ | ✓ | 200 |
| 360 | – | ✓ | – | ✓ | – | 200 |
| 393 | ✓ | ✓ | ✓ | ✓ | – | 200 |
| 405 | – | – | – | – | – | 200 (본문 없음 안내) |
| 406 | – | ✓ | – | – | – | 200 |
| 407 | | | | | | 404 |

---

## 계약(UNSLOP-AUDIT.md)에서 발견한 문제와 S4의 처리

1. **`font-mono` 스택에 한글이 없다.** `164,917건`처럼 단위가 붙은 문자열 전체에 `font-mono`/`.dateline`을 걸면 `건`이 시스템 기본 글꼴로 떨어진다. → S4는 숫자만 mono span으로 감싼다. 권고: S1이 스택의 `monospace` 앞에 Pretendard를 넣는다.
2. **`formatWireTime`에 연도가 없고 `now`에 의존한다.** 해가 다른 기사(랭킹·검색 결과)의 `11.05 14:02`는 어느 해인지 알 수 없고, 클라이언트 카드에서는 자정 전후에 서버·브라우저 출력이 달라질 수 있다. → S4의 기사 상세는 `formatDate()`(날짜 전체)를 쓴다. 카드 쪽은 S1/S3 판단 필요.
3. **통신 목록의 정렬 기준(수집 시각)과 찍히는 시각(발행 시각)이 다르다.** 시각 칸이 생기면 뒤섞여 보인다. → S4가 홈의 두 목록을 묶음 안에서 발행 시각 순으로 재정렬(항목 4). `queries.ts`는 건드리지 않는다. 원치 않으면 `byWireTime` 호출 2곳만 빼면 된다.
4. **페이지 가장자리 여백이 범위(16 / 24~32)로만 적혀 있다.** S2(Header·Footer·PageSkeleton·admin layout)와 S4가 다른 값을 고르면 로고와 본문이 어긋난다. → S4 기본 `px-4 sm:px-6 lg:px-8`, S2 값이 다르면 S2를 따른다(항목 1).
5. **계약에 없는 것:** 버튼·입력·칩의 높이/패딩, 진입 애니메이션 클래스 이름, 긴 글 본문용 크기 토큰(`body-lg` 15px는 기사 본문에 작다). → S4 결정: `ui.ts`(40/32px), 진입 없음, 본문 `text-base`/`sm:text-lg`.
6. **`headline-lg` 토큰 굵기 600 vs "600은 큰 헤드라인만".** 페이지 제목과 비-lead 큰 카드 제목(28px)까지 600이 된다. → S4의 h1은 `font-medium`으로 덮는다. 카드는 S1/S3 확인 필요.
7. **`negative`가 "관리자 전용"이라 공개 화면의 오류에 쓸 의미색이 없다**(검색 실패, 공유 복사 실패, 뉴스레터 오류). → S4 공개 화면은 중립색으로 처리.
8. **6절에 담당이 없는 컴포넌트가 S4 화면에 그려진다:** `TrendingKeywords`, `ShareButtons`, `ArticleHeroImage`, `NewsletterBanner`, `AdSlot`, `SearchBar`, `PageSkeleton`, `AdminNav`, `admin/layout.tsx`. 이전 라운드 기준으로는 S3/S2 소유. → S4는 `AdminLoadError`만 맡고 나머지는 항목 21의 백스톱으로 잔여 징후를 잡는다.
