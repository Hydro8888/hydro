# S3 콘텐츠 컴포넌트 개선 설계서 — unslop 재작업 라운드

> 사용자 요청: "https://github.com/heydamir/unslop 이 기능을 모두 활용해서 재작업해줘 테스트까지 완료해줘"
> 계약 문서: `UNSLOP-AUDIT.md`(감사 · 방향 · 3절 토큰 계약 · 6절 슬라이스 간 인터페이스). 스킬: `.claude/skills/unslop/SKILL.md` + `references/{signs,tokens,visuals,effects}.md` (unslop by Damir Sokolovsky @heydamir, CC BY 4.0).
> **라운드 규칙.** 새 기능·새 장식 금지, 기능 유지. planner.md의 "야심차게"·"AI 기능"은 적용하지 않는다. 모든 항목은 `[패스 번호 · 징후]` + `파일:라인` 근거 + 정확한 변경 + Evaluator 검증 방법을 갖는다.
> 토큰 이름·값, 6절의 컴포넌트 API는 바꾸지 않는다. S1이 토큰과 `formatWireTime` / `formatCount` / `.dateline` / `.img-standin`을 이미 구현했다고 가정한다(아래 "S1 의존 목록"을 먼저 확인).

실험 근거(모두 `qa-out/`, 소스 미수정): 프로토타입 `planner-s3-proto.html`(생성기 `planner-s3-gen.js`, 토큰 `planner-s3-tailwind.config.js`), 실측 `planner-s3-measure.js`, 대비 `planner-s3-contrast.js`, 머리기사 글자 폭 `planner-s3-units.js`, 세리프 잘림 `planner-s3-clip.js`/`.png`, 화면 `planner-s3-{d1440,m390}-*.jpg`, 렌더 테스트 가능성 `planner-s3-render.test.ts.txt`, **구현 후 검증 스크립트 `planner-s3-verify.js`**(현재 코드 기준 151 FAIL = `planner-s3-verify-baseline.txt`).

---

## 현재 상태 분석

### 유지할 것 (회귀 금지)
- 이미지 대체 체인: 원본(프록시) → 카테고리 스톡 → 인라인 SVG, 하이드레이션 전 실패 복구(`ArticleImage.tsx:78-90`), `srcset`/`sizes`/`priority`(`fetchpriority="high"`), `data-placeholder`, `onSettled`.
- 페이지네이션 범위 계산(`src/lib/pagination.ts` — 수정 금지)과 링크 범위 1..total, `aria-current`, `aria-label`, 모바일 5칸/데스크톱 9칸 두 줄 구조(`Pagination.tsx:124-129`).
- 티커: 무한 스크롤, hover·focus-within 정지, 복제 항목 `aria-hidden` + `tabIndex=-1`, `role="marquee"`(`BreakingTicker.tsx:19-23, 52-56, 80-86`), reduced-motion(globals.css).
- `getDisplayTitle` + `lang` 속성(CJK 줄바꿈), `suppressHydrationWarning`이 붙은 `<time>`, 북마크 `aria-pressed`/하이드레이션 안전(`BookmarkButton.tsx:16`), 공유 복사 결과 live region(`ShareButtons.tsx:123`), 뉴스레터·광고 플래그.

### 발견한 징후 (signs.md 순서, S3 파일 14개 전수)

| 묶음 | 징후 | 위치 |
|---|---|---|
| 표면·색 | 카테고리 색 배지(글자+왼쪽 선+배경) | `NewsCard.tsx:45`, `NewsCardLarge.tsx:40-43`, `ArticleHeroImage.tsx:39` |
| | 강조색이 카드마다 반복("자세히 보기", 제목 hover) | `NewsCard.tsx:64,80`, `NewsCardLarge.tsx:73,89`, `NewsCardCompact.tsx:31` |
| | 강조색 면 버튼 | `Pagination.tsx:43`, `NewsletterBanner.tsx:114` |
| | 빨강 면 배지·붉은 틴트 띠 | `BreakingTicker.tsx:20,25` |
| | 순위 1·2·3위가 빨강·주황·노랑 | `TrendingKeywords.tsx:14-16` |
| | 그라데이션 4곳 | `NewsCardLarge.tsx:36`, `BreakingTicker.tsx:38,40`(서로 다른 색으로 사라짐), `NewsletterBanner.tsx:82` |
| | 블러·그림자 | `BookmarkButton.tsx:39`, `NewsCardLarge.tsx:41`, `NewsCard.tsx:20`·`NewsCardLarge.tsx:20`(`hover:shadow-elevated`) |
| 서체 | 700~800 굵기 | `TrendingKeywords.tsx:14-17,24,36`, `NewsCard.tsx:80`, `NewsCardLarge.tsx:89`, `NewsletterBanner.tsx:114` |
| | 대문자·자간 | `ArticleHeroImage.tsx:53`, `BreakingTicker.tsx:30` |
| | 숫자 형식 | `TrendingKeywords.tsx:66`(`toLocaleString`), 페이지 번호·순위가 본문 글꼴 |
| | 큰 카드 제목이 28px 굵은 글씨 2줄 고정 → 좁은 칸에서 제목이 "…"로 잘림 | `NewsCardLarge.tsx:73` (`before/prod/m-breaking-1.jpg`) |
| 아이콘 | 12·14·16px, stroke 2, 채움 브랜드 로고 혼용 — 15개 | 아래 "아이콘 전수 조사" |
| 간격 | 반 단계·임의 값 | `py-2.5` `gap-1.5` `px-1.5` `py-1.5` `px-2.5` `py-0.5` `gap-0.5` `mt-0.5` `w-3.5`, `h-[160px]` `h-[180px]` `h-[200px]` `h-[260px]` `min-w-[2.5rem]` `min-h-[120px]` |
| | 카드 패딩 16/20 혼용 | `NewsCard.tsx:41`(p-4) vs `NewsCardLarge.tsx:53`(p-5) |
| 문구 | "자세히 보기 →", "N분 읽기" | `NewsCard.tsx:58,82`, `NewsCardLarge.tsx:67,91` |
| | **"실시간 인기 검색어 / 검색 기준"이 사실이 아님** — 데이터는 카테고리별 누적 기사 수(`queries.ts:154-168`), 영문 slug가 그대로 노출 | `TrendingKeywords.tsx:24,36-37,60` (`before/prod/d-home-2.jpg`) |
| | "매일 아침 AI가 정리한…", "시장 동향" — 확인할 수 없는 주장(`/api/newsletter` 라우트 없음) | `NewsletterBanner.tsx:87-90` |
| | 한글 탭 옆 영문 병기 `(World)` | `CountryTabs.tsx:45-49` |
| | 짧은 문장 끝 마침표 | `NewsletterBanner.tsx:58,134`, `AdminLoadError.tsx:6-9`, `ShareButtons.tsx:86` |
| 컴포넌트 | 알약·원형 | `TrendingKeywords.tsx:65`, `BookmarkButton.tsx:33`, `NewsletterBanner.tsx:73`, `BreakingTicker.tsx:27-28` |
| | 모든 사진 위 블러 원형 북마크 | `NewsCard.tsx:35-37`, `NewsCardLarge.tsx:47-49` |
| | 모든 페이지 번호에 테두리 상자 | `Pagination.tsx:42-45` |
| 모션 | `transition-all` 3곳 | `NewsCard.tsx:20`, `NewsCardLarge.tsx:20`, `NewsletterBanner.tsx:117` |
| | 이미지 확대 hover | `NewsCard.tsx:32`, `NewsCardLarge.tsx:33` |
| | 펄스 점, 튀는 pop | `BreakingTicker.tsx:27`, `BookmarkButton.tsx:40` |
| 템플릿 | 카드 본문이 링크가 아님(감사 문서는 "카드 전체가 링크"라 적었으나 실제 링크는 사진·제목·CTA 셋) → CTA만 지우면 누를 곳이 줄어듦 | `NewsCard.tsx:23,63,78` |

---

## 디자인 방향

`UNSLOP-AUDIT.md` 2절 그대로: **밤의 편집국 · 통신 데스크**. 차분한, 정확한, 종이 신문 같은. 크롬은 종이·잉크 중립색 + 주황 하나, 풍부한 색은 **실제 보도 사진**에만, 시그니처는 **고정폭 통신 시각** 하나.

금지(이 슬라이스에 남기지 않는다): 색 배지, 그라데이션(티커 양끝의 한 가지 중립색 투명도 변화 2개 제외), 글로우·그림자·블러, 알약, 700 이상 굵기, 대문자·자간, 이모지, `transition-all`·hover 확대·펄스, 강조색 면 버튼, 뻔한 "자세히 보기" 카드.

S3가 정하는 규칙 5가지 (전 항목 공통):

1. **카드 해부 구조(신문식).** 사진 → 분야 라벨(색 없는 글자) → 제목 → 요약 → 맨 아래 `매체명 · 통신 시각` + 조용한 아이콘 2개(원문, 북마크). 사진 위에는 아무것도 올리지 않는다. 제목 링크가 카드 전체를 덮는다(stretched link).
2. **hover는 면 한 단계.** 면이 있는 대상(카드·행·컨트롤)은 `hover:bg-surface-elevated`, 글자·아이콘뿐인 조용한 링크는 `muted/secondary → text`. **hover에 accent를 쓰지 않는다.** hover로 면이 `surface-elevated`가 되면 그 안의 muted 메타는 `group-hover:text-text-secondary`로 한 단계 올린다(대비 실측: muted on elevated 4.17:1 < 4.5, secondary on elevated 6.19:1).
3. **accent = 현재 위치의 글자색뿐.** 활성 탭(글자 + 2px 밑줄), 현재 페이지 번호(올라온 면 위의 글자). 북마크 활성·성공 메시지·순위에는 쓰지 않는다.
4. **모서리.** 카드 `rounded-card`(12), 모든 컨트롤(버튼·입력·아이콘 버튼·페이지 번호·티커 항목) `rounded-control`(8). 중첩 계산: 카드 안 사진은 패딩 0으로 붙어 있으므로 바깥 12를 `overflow-hidden`으로 그대로 물려받는다(안쪽 반지름 = 12 − 0). 카드 패딩이 20(> 12)인 안쪽 컨트롤은 `12 − 20 < 4`이므로 하한 4 이상인 컨트롤 반지름 8을 쓴다(바깥보다 크지 않음). `rounded-full`은 실제 원(`AdminLoading` 스피너) 한 곳만.
5. **아이콘.** 한 벌(기존 heroicons 계열 path), 16px, `strokeWidth 1.5`, `currentColor`(글자 역할 색), 전부 `src/components/icons.tsx`의 `Icon` 래퍼로만 그린다. 설명을 더하지 않는 아이콘(시계·책·화살표·브랜드 로고·링크)은 뺀다.

차별화 2가지(둘 다 감사 문서의 모먼트·시그니처를 컴포넌트로 옮긴 것, 새 장식 아님): ① 머리기사만 명조(`font-serif`) + 원색 큰 사진, 대체(스톡) 사진은 흑백 인쇄 처리 → 실제 보도 사진만 색을 가진다. ② "최신 뉴스" 목록의 왼쪽 48px 고정 칸에 `14:02` / `11.05`+`14:02`가 고정폭으로 찍힌다.

---

## S1 의존 목록 — Generator가 수정 전에 확인

```bash
grep -n "export function formatWireTime\|export function formatCount" src/lib/utils.ts        # 2줄
grep -n "\.dateline\|\.img-standin\|:focus-visible\|scrollbar-none" src/app/globals.css        # 4종 모두
grep -n "serif\|mono\|meta\|control\|tag\|panel\|live\|negative\|'accent'\|ink\|deep" tailwind.config.ts
```
필요한 이름: 색 `surface` `surface-card` `surface-elevated` `text` `text-secondary` `text-muted` `border` `border-muted` `accent` `accent-ink` `live` `negative` / 글꼴 `font-serif` `font-mono` / 크기 `text-headline-{xl,lg,md,sm}` `text-body-{lg,md}` `text-caption` `text-overline` `text-meta` / 모서리 `rounded-card` `rounded-control` / 유틸 `.dateline` `.img-standin` `.scrollbar-none` / 전역 `:focus-visible` 링 / 함수 `formatWireTime(date, now?)` `formatCount(n)`.
하나라도 없으면 **S3 파일 안에서 대체 정의하지 말고** SELF_CHECK-S3.md 맨 위에 적고 중단한다(S1 몫). S1·S2·S4 파일(`utils.ts`, `constants.ts`, `globals.css`, `tailwind.config.ts`, 모든 `page.tsx`, `Header`/`Footer`)은 수정 금지.

---

## 대상 파일 목록

수정(14): `src/components/` `NewsCard.tsx` `NewsCardLarge.tsx` `NewsCardCompact.tsx` `ArticleImage.tsx` `ArticleHeroImage.tsx` `BreakingTicker.tsx` `CountryTabs.tsx` `Pagination.tsx` `NewsletterBanner.tsx` `TrendingKeywords.tsx` `ShareButtons.tsx` `BookmarkButton.tsx` `AdSlot.tsx` `AdminLoadError.tsx`
수정(1): `src/lib/image-chain.ts`(함수 추가만) · 수정 금지: `src/lib/pagination.ts`, `src/lib/types.ts`(변경 필요 없음)
신규(3): `src/components/icons.tsx`, `src/components/NewsCardMeta.tsx`, `src/lib/headline.ts`
테스트: `tests/image-chain.test.ts`(추가), 신규 `tests/headline.test.ts`, `tests/s3-components.test.ts`, `tests/unslop-s3.test.ts`. `tests/pagination.test.ts`·`tests/image-pipeline.test.ts`는 그대로 통과해야 한다.

---

## 9개 패스 적용 결과 (슬라이스 전체, 순서대로)

| 패스 | S3 전체에 적용한 결과 | 항목 |
|---|---|---|
| 1 간격 | 반 단계·임의 px 0개(광고 규격 4개만 예외). 카드 패딩 20 통일, 사진 높이 `h-40/44`·`h-52/64`·`h-56/80/96`, 컨트롤 높이 32/40, 목록 행 `py-3`(64/84px), 시각 칸 48px 고정으로 제목이 한 열 | 2·3·5·9·10·11·12·13·14·15 |
| 2 색 | 카테고리 색 0, `accent-*`·Tailwind 색 유틸 0. accent는 활성 탭·현재 페이지 글자 2곳, `live`는 티커 "속보" 글자 1곳, `negative`는 관리자 오류 선 1곳. 그라데이션은 티커 양끝(같은 `surface`의 투명도)뿐 | 2·3·6·8·9·10·11·12·14·15 |
| 3 아이콘 | 15개 → 4종(원문·북마크·화살괄호·닫기), 전부 16px/1.5/`currentColor`, `icons.tsx` 한 곳 | 1 |
| 4 문구 | "자세히 보기"·"N분 읽기" 삭제, 거짓 라벨 "실시간 인기 검색어" 교체, 뉴스레터의 확인 불가 주장 삭제, 영문 병기 삭제, 짧은 문장 끝 마침표 삭제 | 2·3·11·12·13·14·15 |
| 5 서체 | 굵기 400/500, 머리기사만 600 명조. 큰 카드 제목 28px→20px 3줄(잘림 해소), 시각·순위·페이지 번호·건수는 `font-mono tabular-nums`, 대문자·자간 0 | 2·3·4·5·8·9·10·12 |
| 6 레이아웃 | 섹션·순서 그대로. 컴포넌트 안에서만: 메타 줄을 카드 맨 아래로, 사진 위 요소 제거, 제목 링크가 카드 전체, 목록 왼쪽 칸 정렬 | 2·3·5 |
| 7 디테일 | 모서리 규칙 4, 건수·순위는 조용한 고정폭 글자, 활성 상태 = 면 한 단계 + 헤어라인, 포커스 링은 S1 전역 한 가지(컴포넌트별 `focus:` 재정의 삭제), 시그니처는 `.dateline` 한 클래스로만 | 2·5·6·10·11·12·14 |
| 8 비주얼 | 생성 이미지 없음. 스톡 대체 사진 `img-standin`(흑백), 머리기사 사진을 더 크게(모먼트 ①), 사진 위 그라데이션·배지 제거 | 3·4·7 |
| 9 모션 | `transition-all`·hover 확대·펄스·pop 0. 전환은 `transition-colors`(150ms, S1 기본 easing)만. 티커 스크롤만 유지(등속 `linear`, hover·focus 정지) | 2·3·6·9·14 |

---

## 개선 항목

### 항목 1: 아이콘 한 벌 — `icons.tsx` 신설, 15개 → 4종
- [패스 3 · 아이콘 크기/선 굵기 혼용, 설명 없는 아이콘, 채움 로고 혼용] [패스 1 · `w-3.5`]
- 대상 파일: 신규 `src/components/icons.tsx` + 아래 표의 모든 파일
- 현재 문제 — 전수 조사:

| # | 파일:줄 | 아이콘 | 크기 | stroke | 색 | 처리 |
|---|---|---|---|---|---|---|
| 1 | `NewsCard.tsx:52` | 시계 | 12 | 2 | muted | 삭제(시각은 글자로 충분) |
| 2 | `NewsCard.tsx:57` | 책 | 12 | 2 | muted | 삭제("N분 읽기"와 함께) |
| 3 | `NewsCard.tsx:83` | 화살표 | 14 | 2 | **accent** | 삭제(CTA와 함께) |
| 4 | `NewsCard.tsx:93` | 원문(외부 링크) | 16 | 2 | muted | **유지 → 16 / 1.5** |
| 5 | `NewsCardLarge.tsx:61` | 시계 | 12 | 2 | muted | 삭제 |
| 6 | `NewsCardLarge.tsx:66` | 책 | 12 | 2 | muted | 삭제 |
| 7 | `NewsCardLarge.tsx:92` | 화살표 | 16 | 2 | **accent** | 삭제 |
| 8 | `NewsCardLarge.tsx:102` | 원문 | 16 | 2 | muted | #4와 같은 컴포넌트 |
| 9 | `BookmarkButton.tsx:43` | 북마크 | 16 | 2 | muted / **accent** | **유지 → 16 / 1.5**, 활성은 `text` 채움 |
| 10 | `Pagination.tsx:49` | 화살괄호 | 16 | 2 | secondary | **유지 → 16 / 1.5** |
| 11 | `NewsletterBanner.tsx:76` | 닫기 | 16 | 2 | muted | **유지 → 16 / 1.5** |
| 12–14 | `ShareButtons.tsx:46,55,64` | 카카오·페이스북·X 로고 | 16 | 채움 | secondary | 삭제(글자 라벨이 이미 이름. 브랜드 **색**은 원래도 쓰지 않음 — 점검 결과 이상 없음) |
| 15 | `ShareButtons.tsx:117` | 링크 | 16 | 2 | 상태색 | 삭제(네 버튼 중 하나만 아이콘이 되는 것을 피함) |

- 개선 방법 — `src/components/icons.tsx` (서버·클라이언트 공용, `'use client'` 없음):
```tsx
import type { ReactNode } from 'react';

/** S3 icon rule: 16px box, 24-unit viewBox, stroke 1.5, round caps, currentColor, decorative. */
function Icon({ children, filled = false }: { children: ReactNode; filled?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
export function ExternalLinkIcon() { return <Icon><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></Icon>; }
export function BookmarkIcon({ filled = false }: { filled?: boolean }) { return <Icon filled={filled}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></Icon>; }
export function ChevronIcon({ dir }: { dir: 'prev' | 'next' }) { return <Icon><path d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} /></Icon>; }
export function CloseIcon() { return <Icon><path d="M6 18L18 6M6 6l12 12" /></Icon>; }

/** 32px icon-only control. Add a colour: ICON_BUTTON_QUIET, or 'text-text' for a pressed state (never both). */
export const ICON_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-control transition-colors';
export const ICON_BUTTON_QUIET = 'text-text-muted hover:text-text';
```
  `strokeWidth`는 반드시 `<svg>`에 둔다(검증 스크립트가 svg의 계산값을 읽는다). S3 파일에서 `<svg`는 `icons.tsx`에만 존재한다. `text-text-muted`와 `text-text`를 한 요소에 함께 넣지 말 것(생성 순서상 muted가 이긴다).
- 기대 효과: 크기·선 굵기가 구조적으로 한 가지. 카드당 아이콘 5개 → 2개.
- Evaluator 검증: `grep -n "<svg" src/components/{NewsCard,NewsCardLarge,NewsCardCompact,NewsCardMeta,ArticleImage,ArticleHeroImage,BreakingTicker,CountryTabs,Pagination,NewsletterBanner,TrendingKeywords,ShareButtons,BookmarkButton,AdSlot,AdminLoadError}.tsx` → 0줄. `grep -c "strokeWidth={1.5}" src/components/icons.tsx` → 1. `planner-s3-verify.js`의 카드 검사(아이콘 2개, 16×16, stroke 1.5px).

### 항목 2: NewsCard 재작성 + 공용 메타 줄 `NewsCardMeta`
- [4 · 반복 CTA, 채움 정보] [2 · 카테고리 색, 강조색 반복] [1 · 패딩 16, `h-[160px]`, `py-0.5`·`gap-0.5`] [5 · `font-semibold`] [6 · 사진 위 요소, 카드가 링크가 아님] [7 · 블러 원형 북마크, 모서리] [9 · `transition-all`, `group-hover:scale-105`, `duration-300/500`]
- 대상 파일: `src/components/NewsCard.tsx:1-99` 전체, 신규 `src/components/NewsCardMeta.tsx`
- 개선 방법 — `NewsCardMeta.tsx`:
```tsx
'use client';

import { formatWireTime, toIsoDateTime } from '@/lib/utils';
import type { Article } from '@/lib/types';
import BookmarkButton from './BookmarkButton';
import { ExternalLinkIcon, ICON_BUTTON, ICON_BUTTON_QUIET } from './icons';

/** Bottom row of NewsCard / NewsCardLarge: `매체명 · 통신 시각` and two quiet icon actions. */
export default function NewsCardMeta({ article }: { article: Pick<Article, 'id' | 'source' | 'publishedAt' | 'originalUrl'> }) {
  const isoDate = toIsoDateTime(article.publishedAt);
  const wire = formatWireTime(article.publishedAt);
  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
      <p className="flex min-w-0 items-center gap-2 text-caption">
        <span className="truncate text-text-secondary">{article.source.sourceName}</span>
        {isoDate && wire && (
          <>
            <span aria-hidden="true" className="text-text-muted">·</span>
            {/* formatWireTime depends on "today" → server and client can differ around midnight KST */}
            <time dateTime={isoDate} suppressHydrationWarning className="dateline shrink-0 group-hover:text-text-secondary">{wire}</time>
          </>
        )}
      </p>
      {/* above the stretched title link; -mr-2 puts the 16px glyph on the card's content edge */}
      <div className="relative z-10 -my-1 -mr-2 flex shrink-0 items-center">
        <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" aria-label="원문 보기 (새 창)" title="원문 보기"
          onClick={(e) => e.stopPropagation()} className={`${ICON_BUTTON} ${ICON_BUTTON_QUIET}`}>
          <ExternalLinkIcon />
        </a>
        <BookmarkButton articleId={article.id} />
      </div>
    </div>
  );
}
```
- `NewsCard.tsx` 반환부(임포트는 `Link`, `categoryLabel`, `getArticleImageSources`, `getDisplayTitle`, `Article`, `ArticleImage`, `NewsCardMeta`만 — `timeAgo`·`estimateReadingTime`·`getCategoryStyle`·`cn`·`BookmarkButton` 제거):
```tsx
<article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-card transition-colors hover:bg-surface-elevated">
  <div className="relative h-40 w-full overflow-hidden bg-surface-elevated sm:h-44">
    <ArticleImage sources={sources} sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
      className="absolute inset-0 h-full w-full object-cover" />
  </div>
  <div className="flex flex-1 flex-col p-5">
    {catLabel && <p className="mb-2 text-caption text-text-secondary">{catLabel}</p>}
    {/* the title link covers the whole card (::after is positioned against <article>) */}
    <Link href={`/article/${article.id}`} className="block after:absolute after:inset-0">
      <h3 lang={t.lang} className="text-headline-sm text-text line-clamp-3">{t.text}</h3>
    </Link>
    {summary && <p className="mt-2 text-body-md text-text-secondary line-clamp-2">{summary}</p>}
    <NewsCardMeta article={article} />
  </div>
</article>
```
  - 사진을 감싸던 `aria-hidden` 링크(`:23-34`)와 "자세히 보기" 링크(`:78-84`)는 삭제 — 덮는 제목 링크가 같은 클릭 영역을 대신하고 요약·여백까지 넓힌다. `<Link>` 자신에는 `relative`를 주지 않는다.
  - 제목 `line-clamp-2 → 3`: 실측(`planner-s3-measure.js`) 16px 제목이 390px에서 44~47자 2줄, 320px에서 3줄. 2줄 고정이면 320px에서 잘린다.
  - `sizes` 문자열은 그대로.
- 기대 효과: 카드 한 장에서 주황 2곳·아이콘 5개·배지 1개·블러 버튼 1개가 사라지고 사진·제목·시각만 남는다. 탭 정지점 4 → 3(제목, 원문, 북마크). 카드 어디를 눌러도 기사로 간다.
- Evaluator 검증: `planner-s3-verify.js`의 `card` 항목 전부(문구 없음, 기사 링크 1개, 원문 링크 `aria-label`, 아이콘 2개, `time` 형식·고정폭, 반지름 12px, 패딩 20px, 그림자·블러·그라데이션·대문자 없음) + hover(배경 `rgb(38, 36, 33)`, 이미지 transform `none`, 제목이 accent 아님) + 요약 클릭 → `/article/…` 이동 + 북마크 클릭은 이동 없이 `aria-pressed="true"`. 키보드: Tab 순서 제목 → 원문 → 북마크, 각각 2px accent 링.

### 항목 3: NewsCardLarge(일반) — 사진 위를 비우고 제목 크기를 칸에 맞춘다
- [2 · 색 배지 + 그라데이션 + 블러] [5 · 28px/700 제목이 좁은 칸에서 잘림] [4 · CTA·읽기 시간] [1 · `h-[200px]`/`h-[260px]`, `px-2.5`] [8 · 사진을 덮는 장식] [9 · `transition-all`, 확대]
- 대상 파일: `src/components/NewsCardLarge.tsx:9-107`
- 개선 방법 (lead가 아닐 때):
  - `<article>` 클래스는 항목 2와 동일 + `data-lead={lead ? '' : undefined}`.
  - 사진 상자: `className={cn('relative w-full overflow-hidden bg-surface-elevated', lead ? 'h-56 sm:h-80 lg:h-96' : 'h-52 sm:h-64')}`. 그라데이션 div(`:36`), 겹친 카테고리 배지(`:39-46`), 사진 위 북마크(`:47-49`), 사진 링크(`:23-28`) 삭제. `ArticleImage`의 `sizes="(min-width: 1024px) 840px, 100vw"`와 `priority={priority}`는 그대로, className은 `absolute inset-0 h-full w-full object-cover`.
  - 본문 `p-5`: 분야 라벨 `<p className="mb-2 text-caption text-text-secondary">` → 제목 `<Link className="block after:absolute after:inset-0"><h2 lang={t.lang} className="text-headline-md text-text line-clamp-3">` → 요약 `<p className="mt-3 text-body-lg text-text-secondary line-clamp-3">` → `<NewsCardMeta article={article} />`.
  - 제목 `text-headline-lg`(28px/600, 2줄) → `text-headline-md`(20px/500, 3줄): 402px 칸에서 28px은 줄당 약 13자 × 2줄 = 26자, 실제 제목 중앙값 34자 · 최대 47자(운영 스냅숏 39건)라 대부분 잘린다. 20px 3줄은 54자까지.
  - `h2` 수준, props `article`·`priority`는 유지.
- 기대 효과: 사진이 온전히 보이고 제목이 잘리지 않는다.
- Evaluator 검증: `/breaking` 상단 3장과 홈 오른쪽 2장에서 `planner-s3-verify.js` 카드 검사 통과. `grep -n "bg-gradient\|backdrop-blur\|getCategoryStyle\|estimateReadingTime\|timeAgo" src/components/NewsCardLarge.tsx` → 0줄. 390px `/breaking`에서 첫 3장 제목의 `scrollHeight <= clientHeight`(잘림 없음, 일반 길이 제목 기준).

### 항목 4: NewsCardLarge `lead` — 머리기사 명조 헤드라인과 길이 규칙
- [5 · 서체: 큰 헤드라인 2곳만 serif, 위계는 크기로] [8 · 모먼트 ①] [6 · 긴 제목은 왼쪽 정렬]
- 대상 파일: `src/components/NewsCardLarge.tsx`, 신규 `src/lib/headline.ts`
- 현재 문제: 머리기사가 다른 큰 카드와 같은 모양. 계약 6절이 `lead?: boolean`을 요구. 한국어 제목은 어절 단위로만 줄이 바뀌어(`word-break: keep-all`) 글자 수에 따라 줄 수가 크게 달라진다.
- 개선 방법:
  1. 시그니처 `{ article, priority = false, lead = false }: { article: Article; priority?: boolean; /** home lead story only: serif headline + taller photo */ lead?: boolean }`.
  2. `src/lib/headline.ts` (순수 함수, 클래스는 완전한 문자열 리터럴 — Tailwind가 `src/lib`를 스캔):
```ts
// Size rule for the home lead headline (slice S3). Pure; see tests/headline.test.ts.
export type LeadHeadlineTier = 'short' | 'medium' | 'long';

const WIDE = /[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏㐀-鿿가-힯豈-﫿＀-￯]/;

/** Approximate set width in em: Hangul/CJK/full-width 1, whitespace 0.3, Latin·digits·punctuation 0.55. */
export function headlineUnits(text: string | null | undefined): number {
  let units = 0;
  for (const ch of String(text ?? '').trim()) units += /\s/.test(ch) ? 0.3 : WIDE.test(ch) ? 1 : 0.55;
  return Math.round(units * 100) / 100;
}

export function leadHeadlineTier(text: string | null | undefined): LeadHeadlineTier {
  const u = headlineUnits(text);
  return u <= 30 ? 'short' : u <= 50 ? 'medium' : 'long';
}

export const LEAD_HEADLINE_CLASS: Record<LeadHeadlineTier, string> = {
  short: 'text-headline-xl',
  medium: 'text-headline-md sm:text-headline-xl',
  long: 'text-headline-md sm:text-headline-lg',
};
```
  3. lead일 때 제목: `<h2 lang={t.lang} className={cn('font-serif font-semibold text-text text-balance pb-1 line-clamp-4 sm:line-clamp-3', LEAD_HEADLINE_CLASS[leadHeadlineTier(t.text)])}>`, 요약: `mt-2 max-w-xl text-body-lg text-text-secondary line-clamp-3`(일반은 `mt-3`, `max-w-xl` 없음).
  4. 줄 수·크기 규칙(실측, Noto Serif KR 600):

| 단계 | 글자 폭 | 640px 미만 | 640px 이상 | 실측 줄 수 (320 / 390 / 768 / 1440) |
|---|---|---|---|---|
| short | ≤ 30 | 28px | 32→40px(`headline-xl` 유동) | 29단위 제목: 4 / 3 / 2 / 2 |
| medium | ≤ 50 | 20px | 32→40px | 37~38단위(실제 최대): 4 / 3 / 2 / 2 |
| long | > 50 | 20px | 28px | 99단위(픽스처 391): 4줄·3줄에서 말줄임 |

     상한은 모바일 4줄 · 640px 이상 3줄. 운영 홈 제목 39건은 short 26 · medium 13 · long 0 — 실제 제목은 어느 화면에서도 잘리지 않고, 28px 명조가 모바일에서 5줄 이상이 되는 일도 없다.
  5. `pb-1`은 장식이 아니라 잘림 방지: 줄 높이 1.2의 명조에 `line-clamp`(overflow hidden)를 걸면 마지막 줄의 g·y·p 아랫부분이 잘린다(`qa-out/planner-s3-clip.png` — 패딩 없음: 잘림, 4px: 온전). 번역 전 영문 제목이 머리기사가 될 수 있다. 그 4px만큼 요약 간격을 `mt-3 → mt-2`로 줄여 시각 간격은 12px 그대로.
  6. 사진은 `h-56 sm:h-80 lg:h-96`(224/320/384): 기존 260px는 815px 폭에서 3.1:1로 잘려 인물 머리가 나갔다(`before/prod/d-home-0.jpg`). 384px이면 2.1:1. 프로토타입 실측 카드 높이 646px(2줄 제목) — 현재 헤더 + 섹션 제목 높이(약 225px)를 더해도 1440×900 첫 화면 안에 사진·제목·요약·메타가 들어온다(`qa-out/planner-s3-d1440-home.jpg`).
- 기대 효과: 홈에서 가장 큰 색과 가장 큰 글자가 한 곳에 모인다. 제품 이름을 바꾸면 어색해지는 화면.
- Evaluator 검증: `npx tsx --test tests/headline.test.ts`. S4가 `lead`를 넘긴 뒤 홈에서 `planner-s3-verify.js`: `article[data-lead] h2`의 font-family가 `Noto Serif KR`로 시작, weight 600, letter-spacing 0, 줄 수 ≤ 4(모바일)/3(데스크톱). `lead` 없는 `NewsCardLarge`에는 `font-serif`가 없어야 한다(`tests/s3-components.test.ts`).

### 항목 5: NewsCardCompact — 왼쪽 칸에 통신 시각, `rank`를 주면 순위
- [7 · 시그니처 · 건수/메타는 조용한 고정폭] [1 · 한 열 정렬, `py-2.5`, `pt-0.5`, `px-1 -mx-1`] [2 · 제목 hover accent] [5 · 순위 숫자가 16px 굵은 글씨]
- 대상 파일: `src/components/NewsCardCompact.tsx:16-44` (Props 인터페이스 `:4-14`는 그대로)
- 개선 방법:
```tsx
export default function NewsCardCompact({ article, rank }: Props) {
  const t = getDisplayTitle(article);
  const isoDate = toIsoDateTime(article.publishedAt);
  const wire = formatWireTime(article.publishedAt);
  const hasTime = !!isoDate && !!wire;
  const ranked = rank != null;
  return (
    <Link href={`/article/${article.id}`}
      className="group -mx-2 flex items-baseline gap-3 border-b border-border-muted px-2 py-3 transition-colors last:border-b-0 hover:bg-surface-elevated">
      {ranked ? (
        <span className="w-6 shrink-0 font-mono text-meta tabular-nums text-text-muted group-hover:text-text-secondary">{rank}</span>
      ) : hasTime ? (
        <time dateTime={isoDate} suppressHydrationWarning className="dateline w-12 shrink-0 group-hover:text-text-secondary">{wire}</time>
      ) : (
        <span aria-hidden="true" className="w-12 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <h4 lang={t.lang} className="text-body-md font-medium leading-5 text-text line-clamp-2">{t.text}</h4>
        <p className="mt-1 flex items-center gap-2 text-caption text-text-muted group-hover:text-text-secondary">
          <span className="truncate">{article.source.sourceName}</span>
          {ranked && hasTime && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={isoDate} suppressHydrationWarning className="dateline shrink-0 group-hover:text-text-secondary">{wire}</time>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
```
  - `w-12`(48px): `HH:mm`은 고정폭 12px에서 36px(실측), `MM.DD HH:mm`은 공백에서 줄이 바뀌어 `11.05` / `14:02` 두 줄 5자 블록이 된다 — 칸 폭도 행 높이도 변하지 않는다(실측: 시각 칸 48×16 또는 48×32, 제목 x좌표 8행 동일, 행 65px/85px).
  - `items-baseline`으로 시각 첫 줄과 제목 첫 줄의 밑선이 맞는다(`pt-0.5` 보정 제거).
  - 날짜가 없으면 같은 폭의 빈 칸을 남겨 제목 열을 지킨다(`<time>`·숫자 span을 만들지 않는다).
  - 행 hover는 헤어라인 사이의 각진 면(표의 행). 둥근 모서리 + `border-b` 조합(현 `rounded`)은 밑선 끝이 휘므로 쓰지 않는다. `-mx-2 px-2`는 부모 패널 패딩(≥ 16) 안에서 8px.
- 기대 효과: "최신 뉴스"가 시각이 찍힌 전문 목록으로 읽힌다(모먼트 ②). 순위가 아닌 목록에 1·2·3이 붙지 않는다.
- Evaluator 검증: `tests/s3-components.test.ts`의 세 경우(rank 없음 / rank=3 / 날짜 없음). S4 반영 후 홈에서 `planner-s3-verify.js`: 시각 칸 폭이 모두 48, 제목 왼쪽 좌표 한 값, 형식 `/^(\d{2}\.\d{2} )?\d{2}:\d{2}$/`, 행 안 svg 0. (S4 계획의 검증식 `a > span` 숫자 0개, `time` 형식과도 맞는다.)

### 항목 6: BookmarkButton — 블러·원형·pop 제거
- [2 · 블러, accent 틴트] [7 · 알약/원형] [9 · 튀는 애니메이션] [3 · stroke 2]
- 대상 파일: `src/components/BookmarkButton.tsx:12-55`
- 개선 방법: `animating` 상태와 `setTimeout`(`:14, 21, 24`) 삭제(`useState` 임포트도). 버튼:
```tsx
<button type="button" onClick={handleClick} aria-label={active ? '북마크 해제' : '북마크 추가'} aria-pressed={active}
  className={cn(ICON_BUTTON, active ? 'text-text' : ICON_BUTTON_QUIET, className)}>
  <BookmarkIcon filled={active} />
</button>
```
  `handleClick`의 `preventDefault` + `stopPropagation` + `toggleBookmark`는 그대로. 상태 구분은 외곽선(muted) ↔ 채움(text) + `aria-pressed` — accent 없음. props(`articleId`, `className`) 불변.
- 기대 효과: 사진을 가리는 것이 없고, 저장한 기사가 많아도 강조색이 퍼지지 않는다.
- Evaluator 검증: 기사 상세에서 버튼 `backdrop-filter: none`, 배경 투명, 반지름 8px(`planner-s3-verify.js`). 클릭 → `aria-pressed` 토글, 새로고침 후 유지. `grep -n "backdrop-blur\|rounded-full\|animate-\|bg-accent" src/components/BookmarkButton.tsx` → 0줄.

### 항목 7: ArticleImage — 스톡 대체 사진 판별과 인쇄 처리
- [8 · 비주얼: 실제 보도 사진만 원색] (effects.md Duotone을 S1의 CSS 필터로)
- 대상 파일: `src/lib/image-chain.ts`(추가), `src/components/ArticleImage.tsx:6, 72, 94-108`, `tests/image-chain.test.ts`
- 개선 방법:
  1. `image-chain.ts` 끝에 추가:
```ts
export type ImageSourceKind = 'photo' | 'standin' | 'placeholder';

/** Origin of the category stock photos built by getDefaultImage() (utils.ts). */
const STANDIN_ORIGIN = 'https://images.unsplash.com/';

/**
 * What one step of an image chain shows.
 * - 'standin': a category stock photo — not a photo of this story. Article originals always arrive as a
 *   proxied '/livenews/api/img/…' path (getArticleImageSources), so a raw Unsplash URL is never an original.
 * - 'placeholder': the inline SVG (or a blank value).
 * - 'photo': everything else (proxied original, stored generated image, same-origin path).
 */
export function imageSourceKind(src: string | null | undefined): ImageSourceKind {
  if (typeof src !== 'string' || src.trim() === '' || src === IMAGE_PLACEHOLDER_SRC) return 'placeholder';
  return src.startsWith(STANDIN_ORIGIN) ? 'standin' : 'photo';
}

export function isStandInImage(src: string | null | undefined): boolean {
  return imageSourceKind(src) === 'standin';
}
```
  2. `ArticleImage.tsx`의 `ImageChain`: `const isStandIn = isStandInImage(src);` 추가, `<img>`에 `data-standin={isStandIn ? '' : undefined}`, `className={cn(className, 'text-transparent', isStandIn && 'img-standin')}`. JSDoc 한 줄 추가. **그 밖의 줄(상태, effect, `srcSet`/`sizes`/`priorityAttr`/`onError`/`onLoad`/`data-placeholder`, `key`)은 한 글자도 바꾸지 않는다.**
  3. 판별은 현재 `src` 기준이므로 원본이 실패해 스톡으로 넘어간 순간 필터가 붙고, 플레이스홀더로 끝나면 떨어진다.
- 기대 효과: 화면의 원색이 "이 기사의 사진"만 뜻하게 된다. 같은 스톡 사진이 여러 카드에 반복돼도 조용하다.
- Evaluator 검증: `npx tsx --test tests/image-chain.test.ts`(기존 5개 + 신규). `planner-s3-verify.js`: 각 카드 이미지에서 `currentSrc`가 Unsplash ⇔ `data-standin` ⇔ 계산된 `filter`에 `grayscale`. 외부 이미지를 막은 상태(`scripts/qa/ui-audit.js`)에서도 깨진 이미지 0 유지.

### 항목 8: ArticleHeroImage — 사진 없음 띠를 중립으로
- [2 · 카테고리 색 선] [5 · 대문자 + 넓은 자간 라벨]
- 대상 파일: `src/components/ArticleHeroImage.tsx:6, 22-27, 31, 39, 53`
- 개선 방법: `getCategoryStyle` 임포트와 `catStyle`(`:31`) 삭제. `:39` → `noImage ? 'aspect-[3/1] sm:aspect-[4/1]' : 'aspect-[16/10] sm:aspect-[2/1]'`(`border-t`·`catStyle.borderAll` 제거, 비율은 이전 라운드의 레이아웃 고정값이라 유지). `:53` → `className="pointer-events-none absolute bottom-3 left-4 text-caption text-text-secondary"`(대문자·자간 제거; 띠가 `surface-elevated`라 muted는 4.17:1 → secondary 6.19:1). `categoryPrimary` prop은 인터페이스에 남기고(S4가 넘김) JSDoc을 `@deprecated unused since the unslop pass — categories carry no colour`로 바꾼 뒤 구조 분해에서 뺀다. 주석 `:22-27`의 "category-colored top line" 문구 수정.
- 기대 효과: 사진이 없는 기사도 같은 중립 팔레트.
- Evaluator 검증: `grep -n "uppercase\|tracking-\|getCategoryStyle\|border-t" src/components/ArticleHeroImage.tsx` → 0줄. 이미지 없는 기사(픽스처)에서 `[data-no-image]` 띠의 `border-top-width` 0, 워드마크 `text-transform: none`. 히어로 `loading="eager"`, `fetchpriority="high"` 유지.

### 항목 9: BreakingTicker — 조용한 "속보" 표시, 한 가지 중립색 페이드
- [2 · 빨강 면 배지, 붉은 틴트, 색이 다른 그라데이션] [9 · 펄스 점] [5 · 자간] [1 · `gap-1.5`] [7 · 컨트롤 모서리]
- 대상 파일: `src/components/BreakingTicker.tsx:19-69` (`<style jsx global>` `:71-87`은 그대로)
- 개선 방법:
```tsx
<div className="news-ticker flex h-10 w-full items-stretch overflow-hidden border-y border-border bg-surface" role="marquee" aria-label="속보">
  <div className="flex flex-none items-center border-r border-border px-4">
    <span className="whitespace-nowrap text-overline text-live">속보</span>
  </div>
  <div className="relative flex flex-1 items-center overflow-hidden">
    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-surface to-surface/0" />
    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-surface to-surface/0" />
    <ul className="ticker-track flex min-w-max animate-ticker items-center" aria-label="속보 뉴스 목록">
      … <li> 구조·key·aria-hidden·tabIndex·lang 그대로 …
        <Link … className="rounded-control px-4 py-1 text-body-md text-text transition-colors hover:bg-surface-elevated">{t.text}</Link>
        <span className="select-none text-text-muted" aria-hidden="true">·</span>
```
  - 펄스 점 두 span(`:26-29`) 삭제. 라벨은 `live` 색 글자만: `#e5484d` on `surface` = 4.66:1(통과). **띠 배경은 반드시 `bg-surface`** — `surface-card` 위에서는 4.43:1로 미달.
  - 페이드: `to-transparent` → `to-surface/0`(실측 CSS `rgb(22 21 19 / 0)`), 배경과 같은 `surface`의 투명도 변화만. 현재는 붉은 틴트 띠 위에 `#0d1117`로 사라져 색이 달랐다.
  - 구분자 `/` → `·`(메타 줄과 같은 한 가지 구분 기호).
  - 루트의 `news-ticker`는 스타일 없는 표식 클래스다: S4 검증 스크립트가 `[class*="ticker"]` 안의 그라데이션·애니메이션만 허용한다. `.breaking-ticker`는 globals.css에 애니메이션이 걸려 있던 이름이므로 쓰지 않는다.
  - 스크롤(`ticker Ns linear infinite`), hover·focus-within 정지, 항목 수 × 4초는 그대로. 등속 스크롤이라 `linear`가 맞다(계약의 "easing 하나"는 전환용).
- 기대 효과: 화면 맨 위의 빨간 덩어리가 사라지고 "속보" 두 글자만 의미색을 가진다.
- Evaluator 검증: `planner-s3-verify.js` 티커 항목(라벨 색 `rgb(229, 72, 77)`, 라벨 배경이 빨강 아님, ul 외 애니메이션 0, `ticker|linear|infinite`, 페이드가 `22, 21, 19`뿐, hover 시 `paused`). Tab으로 항목에 포커스 → 정지. `prefers-reduced-motion`에서 움직임 없음. `grep -n "animate-pulse\|accent-red\|tracking-\|to-transparent" src/components/BreakingTicker.tsx` → 0줄.

### 항목 10: Pagination — 현재 쪽만 올라온 면 + accent 숫자
- [2 · 강조색 면 버튼] [7 · 활성 상태 = 면 한 단계 + 헤어라인, 숫자는 고정폭] [1 · `px-1.5`, `gap-1.5`, `min-w-[2.5rem]`] [3 · stroke 2] [5 · tabular]
- 대상 파일: `src/components/Pagination.tsx:29-53` (그 아래 `PageRow`·`Pagination` 로직은 `Chevron` → `ChevronIcon` 교체 외 불변)
- 개선 방법:
```ts
const BTN_SIZE: Record<Size, string> = { mobile: 'h-10 min-w-9 px-1', desktop: 'h-10 min-w-10 px-2' };
const GAP_SIZE: Record<Size, string> = { mobile: 'h-10 w-5', desktop: 'h-10 min-w-10' };
const ROW: Record<Size, string> = {
  mobile: 'flex sm:hidden flex-wrap items-center justify-center gap-1',
  desktop: 'hidden sm:flex flex-wrap items-center justify-center gap-1',
};
const BASE = 'inline-flex items-center justify-center rounded-control border font-mono text-body-md tabular-nums transition-colors';
const ACTIVE = 'border-border bg-surface-elevated text-accent';
const NORMAL = 'border-transparent text-text-secondary hover:bg-surface-elevated hover:text-text';
const DISABLED = 'border-transparent text-text-muted opacity-40 pointer-events-none';
```
  로컬 `Chevron` 함수 삭제, `<ChevronIcon dir="prev" />` / `"next"` 사용. `aria-label`·`aria-current`·`aria-disabled`·`buildHref`·두 줄 구조·`py-6` 불변. 쪽 번호에는 쉼표를 넣지 않는다(URL의 `page=5497`과 같은 식별자, 건수가 아님).
  - 폭 실측(고정폭 14px = 8.4px/자, `planner-s3-measure.js`): 모바일 `[1 … 2748 … 5497]` 259px, `[1 2 3 … 5497]` 268px — 320px 화면(가용 288px)에 한 줄. `MAX_PAGE`(10000) 끝 구간만 291px로 `flex-wrap`이 한 번 접는다(가로 넘침 없음).
  - accent on elevated 6.11:1.
- 기대 효과: 주황 덩어리와 상자 열 대신 숫자 한 줄, 현재 위치만 보인다.
- Evaluator 검증: `npx tsx --test tests/pagination.test.ts`(무수정 통과). `planner-s3-verify.js` 페이지네이션 항목(1440/390/320: 현재 쪽 글자 `rgb(240, 136, 62)`, 배경이 accent 아님, 나머지 투명, 반지름 8px, 높이 40, 고정폭·tabular, 화살괄호 stroke 1.5, 가로 넘침 0). `/breaking?page=2`에서 이전·다음 링크 동작.

### 항목 11: CountryTabs — 탭 높이·라벨 정리
- [4 · 짧은 라벨] [1 · 행 높이] [7 · 활성 상태]
- 대상 파일: `src/components/CountryTabs.tsx:27-50`
- 개선 방법: `import { cn } from '@/lib/utils'`. `<ul className="flex min-w-max items-center border-b border-border-muted">`. 링크:
```tsx
className={cn(
  'relative inline-flex h-10 items-center whitespace-nowrap px-4 text-body-md font-medium transition-colors',
  isActive ? 'text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent' : 'text-text-secondary hover:text-text',
)}
```
  영문 병기 span(`:45-49`) 삭제 — 내용은 `{c.label}`뿐. `aria-current`, `aria-label="국가별 뉴스"`, `buildHref`, `scrollbar-none`은 그대로. 활성 표현(accent 글자 + 2px 밑줄)은 S1의 `.nav-link-active`와 같은 문법으로 유지. `h-0.5`(2px)는 표시선 두께라 허용.
- 기대 효과: 탭 높이 46.4px → 40px(4px 격자), 한글 독자에게 불필요한 `(World)` 제거.
- Evaluator 검증: `/ranking?country=us`에서 `planner-s3-verify.js` 탭 항목(활성 1개만 accent, 나머지 accent 아님, 높이 40, 영문 병기 없음). 390px에서 가로 스크롤로 5개 모두 접근.

### 항목 12: TrendingKeywords — 사실과 맞는 라벨, 조용한 숫자
- [4 · 확인할 수 없는/틀린 주장, 날것의 데이터] [2 · 순위마다 다른 색] [5 · 800/700 굵기, 숫자 형식] [7 · 건수 알약] [1 · `py-2.5`, `py-0.5`]
- 대상 파일: `src/components/TrendingKeywords.tsx:12-75` (props `keywords: {keyword, count}[]` 불변)
- 현재 문제: 제목 "실시간 인기 검색어 · 검색 기준"인데 데이터는 `getTrendingKeywords()`의 **카테고리별 누적 기사 수**다(`queries.ts:154-168`). 화면에는 `politics 45,042`처럼 영문 slug가 나오고, 링크는 `/search?q=politics`로 간다(표시한 수와 무관한 결과).
- 개선 방법:
  - `rankColor` 삭제. `import { CATEGORIES } from '@/lib/constants'; import { categoryLabel, formatCount } from '@/lib/utils';` + `const CATEGORY_SLUGS: ReadonlySet<string> = new Set(CATEGORIES.map((c) => c.slug));`
  - 각 항목: `const isCategory = CATEGORY_SLUGS.has(item.keyword)`; 라벨 `isCategory ? categoryLabel(item.keyword) : item.keyword`; 링크 `isCategory ? \`/category/${item.keyword}\` : \`/search?q=${encodeURIComponent(item.keyword)}\``(카테고리가 아닌 값은 기존 동작 그대로).
  - 제목 `실시간 인기 검색어` → `카테고리별 기사 수`, 오른쪽 "검색 기준" 삭제. 빈 상태 문구 `아직 집계된 기사가 없습니다`.
  - 마크업: 바깥 `overflow-hidden rounded-card border border-border bg-surface-card`; 머리 `border-b border-border-muted px-5 py-4` + `<h2 className="text-headline-sm text-text">`; `<ol className="divide-y divide-border-muted">`; 행 `group flex h-10 items-center gap-3 px-5 transition-colors hover:bg-surface-elevated`; 순위 `w-6 font-mono text-meta tabular-nums text-text-muted group-hover:text-text-secondary`(`aria-label` 유지); 라벨 `flex-1 truncate text-body-md text-text`; 건수 `font-mono text-meta tabular-nums text-text-muted group-hover:text-text-secondary`에 `{formatCount(item.count)}`. 빈 상태 상자는 `rounded-card border border-border bg-surface-card p-5`.
- 기대 효과: 목록이 말하는 것과 보여 주는 것이 같아진다. 색 3개·굵기 3단계·알약 10개가 사라진다.
- Evaluator 검증: `tests/s3-components.test.ts`(`politics` → 글자 `정치`, `href="/category/politics"`, `45,042`; 알 수 없는 키워드 → 원문 글자 + `/search?q=`). `grep -n "toLocaleString\|font-bold\|font-extrabold\|rounded-pill\|amber\|accent" src/components/TrendingKeywords.tsx` → 0줄. 홈에서 행 높이 40px, 숫자 고정폭.
- 주의: 링크 대상 변경은 이 항목만의 독립 결정이다. 오케스트레이터가 원치 않으면 `href` 한 줄만 되돌리면 된다(라벨 교체는 유지).

### 항목 13: ShareButtons — 글자 버튼 한 줄
- [3 · 채움 로고 + 선 아이콘 혼용] [2 · 상태를 빨강·주황 글자로] [1 · `py-1.5`, `gap-1.5`] [7 · 컨트롤 모서리] [4 · 마침표]
- 대상 파일: `src/components/ShareButtons.tsx:41-126` (`execCommandCopy`, `handleCopy`, 타이머, URL 3개는 불변)
- 개선 방법: `channels`에서 `icon` 필드 삭제. 공통 클래스
  `const SHARE_BUTTON = 'inline-flex h-8 items-center justify-center rounded-control border border-border bg-surface-elevated px-3 text-caption text-text-secondary transition-colors hover:text-text';`
```tsx
<div role="group" aria-label="기사 공유" className="flex flex-wrap items-center gap-2">
  <span aria-hidden="true" className="text-caption text-text-muted">공유</span>
  {channels.map((ch) => (
    <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer" aria-label={`${ch.label}에 공유 (새 창)`} className={SHARE_BUTTON}>{ch.label}</a>
  ))}
  <button type="button" onClick={handleCopy} className={`${SHARE_BUTTON} min-w-20`}>{copyLabel}</button>
  <span role="status" aria-live="polite" className="sr-only">{statusText}</span>
</div>
```
  상태 색(`text-accent-red`/`text-accent`) 삭제 — 라벨 글자(`복사됨` / `복사 실패`)와 live region이 상태를 전한다(빨강 on elevated는 3.95:1 미달). `min-w-20`은 라벨이 바뀔 때 폭이 흔들리지 않게. `statusText`의 끝 마침표 삭제(`링크를 복사했습니다` / `링크를 복사하지 못했습니다`). "공유" 글자는 아이콘이 사라진 줄이 무엇인지 알려 주는 라벨.
- 기대 효과: 높이 32px 한 줄, 아이콘 4개 제거, 브랜드 로고 없이 이름만.
- Evaluator 검증: `planner-s3-verify.js` 기사 항목(공유 줄 svg 0, 외부 링크 3개, 버튼 높이 32 · 반지름 8px, live region 존재). 복사 클릭 → 라벨 `복사됨` → 2초 뒤 `링크 복사`, 색 변화 없음.

### 항목 14: NewsletterBanner — 주장 삭제, 중립 면, 밝은 면 주 버튼
- [4 · "AI가 정리한", 확인할 수 없는 "매일 아침"·"시장 동향", 마침표] [2 · accent 테두리 + 그라데이션 선 + accent 면 버튼] [7 · 원형 닫기 버튼, 포커스 재정의] [9 · `transition-all`, `active:scale`] [1 · `p-5 sm:p-6`, `w-7 h-7`]
- 대상 파일: `src/components/NewsletterBanner.tsx:56-136` (상태·`handleSubmit`·`handleDismiss`·플래그 로직 불변)
- 개선 방법:
  - 상자 `relative rounded-card border border-border bg-surface-card p-5`. 그라데이션 선 div(`:81-82`) 삭제.
  - 닫기 `className={cn(ICON_BUTTON, ICON_BUTTON_QUIET, 'absolute right-3 top-3')}` + `<CloseIcon />`.
  - 제목 `<h3 className="pr-8 text-headline-sm text-text">해외 뉴스 요약을 이메일로 받아보세요</h3>`, 설명 `<p className="mt-1 text-body-md text-text-secondary">언제든 구독을 해지할 수 있습니다</p>`, 폼 `mt-4 flex gap-2`.
  - 입력 `className="h-10 min-w-0 flex-1 rounded-control border border-border bg-surface-elevated px-3 text-body-md text-text placeholder:text-text-secondary"` + `aria-invalid={status === 'error' || undefined}` + `aria-describedby="banner-newsletter-status"`. `focus:outline-none focus:border-accent focus:ring-*` 삭제(S1 전역 링 한 가지). placeholder는 보이는 유일한 라벨이므로 secondary(6.19:1; muted는 4.17:1).
  - 제출 `className="h-10 flex-none rounded-control bg-text px-4 text-body-md font-medium text-accent-ink transition-colors hover:bg-text/90 disabled:cursor-wait disabled:opacity-60"`(계약: 주 버튼 = `text` 면 + `accent-ink`, 15.1:1).
  - 상태 문단 `id="banner-newsletter-status"`, `className={cn('empty:hidden text-body-md text-text', status === 'success' ? 'pr-8' : 'mt-2')}` — 성공의 accent, 오류의 빨강 삭제(빨강 on card 4.43:1 미달; 문장이 내용을 말한다).
  - 문구: 성공 `구독 신청이 접수되었습니다`, 오류 `올바른 이메일 주소를 입력해 주세요`(한 문장 → 마침표 없음), `구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.`(두 문장 → 유지).
- 기대 효과: 켜졌을 때도 화면에서 가장 조용한 카드. 약속하지 않은 것을 말하지 않는다.
- Evaluator 검증: `grep -n "AI\|매일\|시장\|bg-gradient\|bg-accent\|rounded-full\|transition-all\|focus:\|accent-red" src/components/NewsletterBanner.tsx` → 0줄. `NEXT_PUBLIC_NEWSLETTER_ENABLED` 미설정 시 렌더 결과가 빈 문자열(`tests/s3-components.test.ts`). 보고서에 "삭제한 주장: 매일 아침 / AI가 정리 / 시장 동향 — 실제 발송 기능이 생기면 사실대로 다시 적을 것"을 남긴다.

### 항목 15: AdSlot · AdminLoadError · AdminLoading
- [1 · `mt-0.5`, `min-h-[120px]`] [2 · accent를 오류 선·스피너에] [7 · `rounded-lg`] [4 · 마침표, 이중 라벨]
- 대상 파일: `src/components/AdSlot.tsx:17-48`, `src/components/AdminLoadError.tsx:5-49`
- 개선 방법:
  - AdSlot: `native.height` `min-h-[120px]` → `min-h-32`. 상자 `mx-auto flex items-center justify-center rounded-card border border-dashed border-border`(반투명 배경 삭제), 안쪽은 `<p className="text-caption text-text-muted">광고</p>` 한 줄(규격 문구는 `aria-label`에만). **예외로 남기는 임의 값 4개**: `max-w-[728px]` `h-[90px]` `max-w-[300px]` `h-[250px]` — IAB 광고 규격(728×90, 300×250)이라 격자에 맞출 수 없다. 플래그·`role`·`data-ad-slot` 불변.
  - AdminLoadError: 상자 `rounded-card border border-border bg-surface-card px-6 py-10 text-center`; 알림 `inline-block max-w-md border-l-2 border-negative pl-3 text-left`(관리자 화면의 실패 의미색); HTTP 코드 `ml-1 font-mono text-meta tabular-nums text-text-muted`; 버튼 `h-10 rounded-control border border-border bg-surface-elevated px-4 text-body-md font-medium text-text transition-colors hover:border-text-muted`. `MESSAGES.detail`: `페이지를 새로고침해 다시 로그인하세요` / `잠시 후 다시 시도하세요` / `응답 형식이 올바르지 않습니다. 잠시 후 다시 시도하세요.`(두 문장 유지) / `서버에 연결할 수 없습니다`. `role="alert"`, props 불변.
  - AdminLoading: `mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-text-secondary`(로딩 중에만 도는 스피너는 의미 있는 모션, 색은 중립). `role="status"` + sr-only 문구 불변.
- 기대 효과: 관리자 화면에서 주황은 "현재 위치"만, 빨강은 "실패"만 뜻한다.
- Evaluator 검증: `grep -n "rounded-lg\|border-accent\|mt-0.5\|min-h-\[" src/components/AdSlot.tsx src/components/AdminLoadError.tsx` → 0줄. `/admin`에서 API를 막고 오류 상자 확인(왼쪽 선 `rgb(229, 72, 77)`, 버튼 반지름 8px, "다시 시도" 동작).

### 항목 16: 테스트 — 순수 함수, 렌더 결과, 정적 금지 목록
- [스킬 6단계 Check: 체크리스트를 다시 돌려 남은 징후를 잡는다] — 사용자 요청 "테스트까지 완료"
- 대상 파일: `tests/image-chain.test.ts`(추가), 신규 `tests/headline.test.ts`, `tests/s3-components.test.ts`, `tests/unslop-s3.test.ts`
- 개선 방법:
  1. **`tests/image-chain.test.ts`** 추가(기존 5개 불변):
     - `getArticleImageSources({ id: 1, imageUrl: 'https://cdn.example.com/a.jpg', categoryPrimary: 'economy' }).map(imageSourceKind)` → `['photo', 'standin', 'placeholder']`; `imageUrl: null` → `['standin', 'placeholder']`.
     - 16개 카테고리 × id 0~3의 `getDefaultImage()`가 모두 `isStandInImage === true`.
     - 원본이 Unsplash에 있어도 프록시 경로로 오므로 photo: `imageUrl: 'https://images.unsplash.com/photo-1?w=800'`의 `sources[0]` → `'photo'`.
     - `'/livenews/api/generated-image/0123456789abcdef0123456789abcdef.jpg'` → `'photo'`; `IMAGE_PLACEHOLDER_SRC`, `''`, `'  '`, `null`, `undefined` → `'placeholder'`, `isStandInImage` false.
     - 레거시 쌍 `resolveImageSources({ src: '/x.jpg', fallback: 'https://images.unsplash.com/p' }).map(imageSourceKind)` → `['photo', 'standin', 'placeholder']`.
  2. **`tests/headline.test.ts`**: `headlineUnits('치세케디, 헌법 개정의 길 열어')` 13.75 / `'러시아와 우크라이나, 평화 회담 종료 후 대규모 포로 교환에 합의'` 29.25(short) / `'프랑스 학생들이 시위 압박을 이어가겠다고 다짐한 가운데 학교에서 폭력 사건 발생'` 37(medium) / `'Brazil electoral court fines Meta $1.3 million but finds no deliberate election bias at all'` 46.55(medium) / 픽스처 391의 초장문 → long / `''`, `'   '`, `null` → 0 · short. 경계: 30 → short, 30.3 → medium, 50 → medium, 50.3 → long(`'가'.repeat(n)` + 공백으로 구성). `LEAD_HEADLINE_CLASS` 세 값이 `src/lib/headline.ts` 원문에 따옴표로 감싼 완전한 리터럴로 존재.
  3. **`tests/s3-components.test.ts`** — `react-dom/server`의 `renderToStaticMarkup`으로 정적 HTML 검사(실행 가능성 확인: `qa-out/planner-s3-render.test.ts.txt`). 파일 맨 위에 `(globalThis as unknown as { React: typeof React }).React = React;`(tsconfig `jsx: preserve`라 tsx가 고전 런타임으로 변환) — JSX 없이 `React.createElement` 사용. 통신 시각은 실행 날짜에 따라 달라지므로 값이 아니라 형식 `WIRE = /^(\d{2}\.\d{2} )?\d{2}:\d{2}$/`로 검사. 경우:
     - NewsCard: `자세히 보기`·`분 읽기` 없음; `href="/article/7"` 정확히 1회; `<time` 1개 + `dateline` 클래스 + 내용이 WIRE; `France 24`; `정치` 라벨에 `text-text-secondary`; `target="_blank"` + `rel="noopener noreferrer"` + `aria-label="원문 보기 (새 창)"`; `aria-pressed="false"`; `<svg` 2개 모두 `stroke-width="1.5"`와 `h-4 w-4`; `publishedAt: null` → `<time` 없음, `·` 없음; `categoryPrimary: null` → 라벨 없음.
     - NewsCardLarge: `lead` → `data-lead=""`, h2에 `font-serif`와 단계 클래스; lead 없음 → `font-serif` 없음, `text-headline-md`; `priority` → `loading="eager"` + `fetchpriority="high"`; `bg-gradient`·`backdrop-blur` 없음.
     - NewsCardCompact: rank 없음 → `<a>`의 첫 자식이 `<time class="dateline w-12`, 숫자만 든 `<span>` 없음; `rank: 3` → 첫 자식 `<span` 내용 `3`, 메타에 `<time`; `publishedAt: null` → `<time` 없음 + `aria-hidden="true"` `w-12` 빈 span.
     - ArticleImage: `sources: [getDefaultImage('economy', 1), IMAGE_PLACEHOLDER_SRC]` → `img-standin` + `data-standin=""`; 프록시 원본 첫 단계 → 둘 다 없음 + `srcset` 있음; 플레이스홀더만 → `data-placeholder=""`, `data-standin` 없음.
     - Pagination: `(3, 9, '/x')` → `aria-current="page"` 2회(두 줄 각 1), `bg-accent` 없음, `font-mono`, 모든 `page=N`이 1..9; `totalPages: 1` → `''`.
     - CountryTabs: `aria-current="page"` 1회, `(World)` 없음, 5개 라벨.
     - TrendingKeywords: 항목 12의 두 경우 + 빈 배열 문구.
     - BookmarkButton·ShareButtons: `<svg` 수(1 / 0), `backdrop-blur` 없음, ShareButtons 외부 링크 3 + `role="status"`.
     - NewsletterBanner·AdSlot: 플래그 꺼짐 → `''`.
  4. **`tests/unslop-s3.test.ts`** — S3 파일 17개(수정 14 + `icons.tsx`, `NewsCardMeta.tsx`, `src/lib/headline.ts`) 원문에 대한 금지 목록(파일명과 줄을 메시지에 출력):
     - 모션: `transition-all`, `hover:scale`·`group-hover:scale`·`active:scale`, `animate-`(허용: `animate-ticker`, `animate-spin`), `duration-\d`.
     - 표면: `backdrop-blur`, `shadow-`, `bg-gradient-to-`(허용: `BreakingTicker.tsx`의 2회, 둘 다 `from-surface to-surface/0`), `text-white`·`bg-white`, `accent-(red|blue|green)`, Tailwind 색 유틸 `/\b(text|bg|border|from|via|to|ring|divide)-(l-|t-)?(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\d{2,3}\b/`.
     - 서체: `\buppercase\b`, `tracking-`, `\bitalic\b`, `font-(bold|extrabold|black)`, `font-semibold`(허용: `NewsCardLarge.tsx` 1회), `font-serif`(허용: `NewsCardLarge.tsx`).
     - 모서리: `rounded-(full|pill|badge|sm|md|lg|xl|2xl|3xl)`·맨 `rounded`(허용: `AdminLoadError.tsx`의 `rounded-full` 1회).
     - 간격: 반 단계 `/-[1-9]\d*\.5\b/`, 임의 px `/\[\d+px\]/`(허용: `AdSlot.tsx`의 4개), `\[[\d.]+rem\]`.
     - 문구·데이터: `자세히 보기`, `분 읽기`, `인기 검색어`, `AI가`, `toLocaleString`, `timeAgo`, `estimateReadingTime`, `getCategoryStyle`, 이모지 `/\p{Extended_Pictographic}/u`.
     - 아이콘·포커스: `<svg`는 `icons.tsx`에만, `strokeWidth={`는 `{1.5}`만, `focus:outline-none`·`focus:ring` 없음.
     - **생성 CSS 확인**(`tests/design-tokens.test.ts`의 `compileGlobals` 방식 — postcss + tailwindcss + 실제 config): 다음 선택자가 실제로 만들어지는지(`walkRules`로 미디어 쿼리 안까지): `.font-serif` `.font-mono` `.text-meta` `.rounded-control` `.rounded-card` `.text-live` `.text-accent` `.text-accent-ink` `.border-negative` `.bg-surface-elevated` `.dateline` `.img-standin` `.line-clamp-3` `.line-clamp-4` `.text-balance` `.min-w-9` `.min-w-10` `.to-surface\/0` `.sm\:text-headline-xl` `.sm\:text-headline-lg` `.lg\:h-96` `.hover\:bg-surface-elevated:hover` `.group:hover .group-hover\:text-text-secondary`. (S1이 닫힌 스케일을 쓰면 없는 클래스가 조용히 사라진다 — 지난 라운드 S1-A의 교훈.)
- 기대 효과: 이번 라운드의 판단이 다음 수정에서 되돌아가지 않는다.
- Evaluator 검증: `npm test` 전체 통과(기존 테스트 포함), `npx tsc --noEmit` 0 오류. 새 테스트 4개 파일이 실제로 실행됐는지 출력의 테스트 이름으로 확인.

---

## 회귀 금지 체크리스트 (Generator SELF_CHECK에 그대로 옮길 것)

- [ ] `ArticleImage`의 props·상태 전이·`srcSet`/`sizes`/`fetchpriority`/`data-placeholder`/`onSettled` 동작 불변(추가는 `data-standin`, `img-standin` 둘뿐)
- [ ] `Pagination` 링크가 1..total 범위, `aria-current="page"`·`aria-label` 문구 불변, `total <= 1`이면 null
- [ ] 티커: 복제 항목 `aria-hidden` + `tabIndex=-1`, hover·focus-within 정지, `role="marquee"`
- [ ] 카드: 제목 → 원문 → 북마크 순 키보드 접근, 원문은 새 창 + `rel="noopener noreferrer"`, 북마크 클릭이 기사로 이동시키지 않음
- [ ] `<time dateTime>` + `suppressHydrationWarning` 유지, 콘솔 하이드레이션 오류 0
- [ ] `getDisplayTitle`의 `lang`이 h2/h3/h4와 티커 링크에 유지
- [ ] 컴포넌트 props: `NewsCard{article}`, `NewsCardLarge{article, priority?, lead?}`, `NewsCardCompact{article, rank?}`, `ArticleHeroImage{sources?, src?, fallback?, alt?, categoryPrimary?, sourceName?}`, 나머지 불변
- [ ] `npx tsc --noEmit`, `npm test`, `npm run build` 통과. 320 / 390 / 768 / 1440에서 가로 넘침 0

## Evaluator 종합 검증

```bash
npx tsc --noEmit && npm test
grep -rn "transition-all\|backdrop-blur\|자세히 보기\|분 읽기\|accent-red\|accent-blue\|uppercase\|rounded-full\|rounded-pill\|rounded-badge" src/components/{NewsCard,NewsCardLarge,NewsCardCompact,NewsCardMeta,ArticleImage,ArticleHeroImage,BreakingTicker,CountryTabs,Pagination,NewsletterBanner,TrendingKeywords,ShareButtons,BookmarkButton,AdSlot,AdminLoadError,icons}.tsx
#   → AdminLoadError.tsx의 스피너 rounded-full 1줄만
# 새 빌드가 :4000에서 서비스된 뒤(S4까지 반영):
node qa-out/planner-s3-verify.js      # "S3 VERIFY CLEAN" (현재 코드 기준 151 FAIL)
```
`planner-s3-verify.js`는 1440 / 390 / 320에서 카드(홈·속보·카테고리·검색), 머리기사, 통신 목록, 티커, 페이지네이션, 탭, 공유 줄, 북마크, 히어로 이미지, 가로 넘침, 하이드레이션 오류를 본다. `NOTE`는 S4 연동이 필요한 항목(머리기사 `lead`, 목록 `rank` 제거)이 아직 반영되지 않았을 때 나온다.
화면 대조: `qa-out/unslop/before/prod/{d,m}-{home-0,home-1,home-2,breaking-1,ranking-0,article-0}.jpg` ↔ 새 화면, 목표 모양은 `qa-out/planner-s3-{d1440,m390}-{home,grid,pag}.jpg`.

채점 기준 연결: 디자인 품질(패스 1·2·5·7 결과), 독창성(머리기사 명조 + 흑백 대체 사진 + 통신 시각 칸), 기술(아이콘·메타 줄 중복 제거, 테스트 4종, 토큰만 사용), 기능(카드 전체 링크, 목록·탭·페이지 이동), 회귀(위 체크리스트).

---

## S4·S1에 전하는 인터페이스 메모 (계약에서 발견한 문제)

1. **TrendingKeywords의 데이터는 검색어가 아니다.** `getTrendingKeywords()`는 카테고리별 누적 기사 수를 돌려준다. S3는 제목을 "카테고리별 기사 수"로, 라벨을 한글 카테고리명으로, 링크를 `/category/{slug}`로 바꾼다(항목 12). 홈의 배치(`page.tsx:175-180`)와 섹션 이름은 S4 판단.
2. **홈 머리기사 칼럼 높이.** lead 카드가 1440px에서 약 646px(기존 447px)이 된다. 왼쪽(lead + 8행 목록 ≈ 1258px) 대 오른쪽(일반 큰 카드 2장 ≈ 950px). S4가 오른쪽 래퍼를 `grid gap-5 lg:grid-rows-2`로 바꾸면 두 카드가 늘어나 높이가 맞는다(카드는 `flex flex-col` + 메타 `mt-auto`라 늘어나도 메타가 바닥에 붙는다; 프로토타입 확인). 목록 패널 패딩은 16 이상이어야 한다(행이 `-mx-2`).
3. **티커 래퍼.** `page.tsx:66`의 `rounded-lg overflow-hidden`은 위아래 헤어라인의 양끝을 깎는다 — 래퍼에서 빼는 것을 권한다. 티커 루트에는 `news-ticker` 클래스가 있다(S4 검증식 `[class*="ticker"]`).
4. **카드 안의 카드.** 홈 카테고리 패널(`page.tsx:130-160`)은 면·테두리가 있는 패널 안에 `NewsCard`(면·테두리 12)가 들어간다. 패널 패딩 16이면 안쪽 반지름은 `max(4, R − 16)`이어야 하는데 카드는 12로 고정이다 — 패널의 면·테두리를 없애는 쪽이 맞다(S4).
5. **대비 한계(S1 참고).** `live`/`negative` `#e5484d`: surface 4.66 · card 4.43 · elevated 3.95. `text-muted`: surface 4.92 · card 4.68 · elevated 4.17. → 빨강 글자는 `surface` 위에서만, muted 글자는 elevated 면 위에 두지 않는다. S3는 공개 화면의 오류·복사 실패를 빨강 없이 문장으로만 표시한다(계약상 `negative`는 관리자 전용이기도 하다).
6. **`IMAGE_PLACEHOLDER_SVG`의 색이 하드코딩**(`constants.ts:136-137`, `#21262d`/`#30363d`). S1이 `surface-elevated`(`#262421`)로 맞추지 않으면 사진 없음 띠(`ArticleHeroImage`, 배경 `bg-surface-elevated`)에 두 톤 상자가 보인다.
7. **AI 생성 이미지**(`/livenews/api/generated-image/…`)는 계약 문구("카테고리 대체 사진")에 따라 원색(`'photo'`)으로 둔다. "실제 보도 사진만 원색"이라는 방향과는 어긋날 수 있다 — 흑백으로 돌리려면 `imageSourceKind`에 한 줄을 더하면 된다(결정 필요).
8. **상대 시각이 카드에서 사라진다**("3시간 전" → `14:02`). 계약의 시그니처에 따른 것. `timeAgo`·`estimateReadingTime`·`getCategoryStyle`은 S3에서 더는 쓰지 않는다.
9. **아이콘 규격은 16px / stroke 1.5**로 정했다. S2(헤더·푸터)·S4(페이지)도 같은 값이어야 "한 벌"이 된다 — `src/components/icons.tsx`를 함께 써도 된다.
10. **이 계획의 S3 목록에 없는 컴포넌트**: `PageSkeleton.tsx`(`shimmer`, `animate-fade-in`, `rounded-badge`; 카드 뼈대도 새 구조 — 사진 `h-40` + 패딩 20 — 와 맞아야 함), `SearchBar.tsx`(`rounded-pill`, accent 면 버튼, `transition-all`; 어디서도 임포트하지 않음), `AdminNav.tsx`. 담당 슬라이스 지정 필요.
11. 범위 밖 관찰(변경 없음): "카카오톡" 공유 버튼의 주소가 `story.kakao.com/share`(카카오스토리)다. `/api/newsletter` 라우트가 없다(플래그가 꺼져 있어 노출되지 않음).
