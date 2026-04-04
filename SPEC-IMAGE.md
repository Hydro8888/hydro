# 이미지 검증 및 폴백 개선 설계서 (SPEC-IMAGE)

## 현재 상태 분석

### 문제 진단
뉴스 기사들이 동일한 플레이스홀더 이미지(China Daily "中文" 로고 등)를 표시하고 있다. 근본 원인은 다단계에 걸쳐 있다:

1. **normalizer.ts `resolveImageUrl()`**: RSS enclosure/content에서 이미지를 추출하지만, 로고/사이트 이미지인지 검증하지 않는다. 사이트 로고 URL이 enclosure에 포함되면 그대로 채택한다.
2. **scraper.ts `extractOgImage()`**: og:image 메타 태그에서 이미지를 추출한다. `<img>` 태그 폴백에서는 `logo`, `icon`, `avatar` 등을 필터링하지만, **og:image 자체에는 검증이 전혀 없다**. 많은 사이트가 og:image에 사이트 로고를 설정한다.
3. **scraper.ts `scrapeArticleContents()`**: 이미 `imageUrl`이 있는 기사는 스크래핑 대상이 아닌 것처럼 동작한다(`!a.imageUrl` 조건). 로고 URL로 채워진 기사는 "이미지 있음"으로 판정되어 재추출 대상에서 제외된다.
4. **collector.ts**: 스크래핑 후 imageUrl의 품질을 검증하지 않는다. 잘못된 imageUrl이 그대로 DB에 저장되고, `image-generator.ts`의 AI 이미지 생성 트리거(`!a.imageUrl`)도 작동하지 않는다.
5. **utils.ts `getDefaultImage()`**: 카테고리 기반 Picsum 시드를 사용하지만 카테고리별 키워드 분류가 없어 랜덤 이미지가 나온다.
6. **NewsCard.tsx / NewsCardLarge.tsx**: `article.imageUrl || getDefaultImage(...)` 패턴을 사용한다. imageUrl이 로고 URL로 채워져 있으면 falsy가 아니므로 getDefaultImage 폴백이 트리거되지 않는다.

### 영향 범위
- 현재 DB 582개 기사 중 상당수가 사이트 로고 URL을 imageUrl로 갖고 있을 가능성
- 프론트엔드에서 모든 기사가 동일한 로고 이미지를 보여주는 UX 문제
- AI 이미지 생성이 트리거되지 않아 자원 낭비 없이 품질만 저하

## 디자인 방향

- 기존 다크 모던 (Bloomberg/Reuters 스타일) 유지
- 이미지 검증은 백엔드/유틸리티 레벨의 논리적 변경으로, 시각 디자인 변경 없음
- 카테고리별 폴백 이미지는 해당 카테고리를 시각적으로 대표할 수 있는 키워드로 Picsum seed 생성
- 기존 582개 기사 데이터 보존 (imageUrl 필드만 선택적으로 null로 업데이트)

## 대상 파일 목록

| 영역 | 파일 경로 |
|------|----------|
| 유틸리티 | `src/lib/utils.ts` |
| 컴포넌트 | `src/components/NewsCard.tsx` |
| 컴포넌트 | `src/components/NewsCardLarge.tsx` |
| 백엔드 | `src/workers/normalizer.ts` |
| 백엔드 | `src/workers/scraper.ts` |
| 백엔드 | `src/workers/collector.ts` |
| API | `src/app/api/admin/fix-images/route.ts` (신규) |

## 개선 항목

### 항목 1: `isValidArticleImage()` 유틸리티 함수 추가
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: 이미지 URL이 실제 기사 이미지인지 사이트 로고인지 판별하는 로직이 어디에도 없다.
- **개선 방법**:
  ```
  export function isValidArticleImage(url: string | null | undefined): boolean
  ```
  다음 조건에 해당하면 `false` 반환:
  - `url`이 falsy이거나 빈 문자열
  - URL 경로/파일명에 차단 키워드 포함: `logo`, `brand`, `favicon`, `icon`, `default`, `placeholder`, `share-image`, `site-image`, `og-image`, `sns-image`, `common/`, `assets/logo`, `widget`
  - URL에 소형 이미지 크기 힌트 포함: `100x100`, `50x50`, `1x1`, `pixel`, `tracking`, `spacer`, `beacon`
  - 알려진 반복 로고 URL 패턴 (정규식): 예를 들어 `chinadaily.com.cn` 로고 경로, `nhk.or.jp/common/`, `reuters.com/pf/resources/` 등
  - 데이터 URI (`data:image/`)
  - SVG 파일 (`.svg` — 보통 아이콘/로고)
  - 이 외에는 `true` 반환
- **기대 효과**: 프론트엔드와 백엔드 모두에서 재사용 가능한 단일 검증 포인트 확보

### 항목 2: `getDefaultImage()` 카테고리별 키워드 매핑 개선
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: `getDefaultImage()`가 `picsum.photos/seed/${category}-${id}/800/500` 형태로 카테고리 이름만 seed에 넣는다. 카테고리별 시각적 차별화가 없다.
- **개선 방법**:
  카테고리별 Picsum seed 키워드 매핑 상수를 추가:
  ```
  const CATEGORY_IMAGE_SEEDS: Record<string, string[]> = {
    economy: ['finance', 'stockmarket', 'trading', 'charts'],
    market: ['wallstreet', 'stocks', 'exchange', 'trading-floor'],
    politics: ['government', 'capitol', 'parliament', 'diplomacy'],
    sports: ['stadium', 'athletics', 'competition', 'match'],
    'ai-tech': ['technology', 'circuit', 'digital', 'computing'],
    semiconductor: ['microchip', 'silicon', 'wafer', 'processor'],
    automotive: ['automobile', 'factory', 'vehicle', 'highway'],
    energy: ['power', 'solar', 'wind-turbine', 'pipeline'],
    entertainment: ['performance', 'stage', 'cinema', 'entertainment'],
    health: ['medical', 'hospital', 'wellness', 'healthcare'],
    business: ['office', 'meeting', 'corporate', 'skyline'],
    science: ['laboratory', 'research', 'space', 'microscope'],
    society: ['cityscape', 'community', 'urban', 'people'],
    culture: ['museum', 'art', 'heritage', 'festival'],
    world: ['globe', 'international', 'landscape', 'travel'],
    general: ['newsroom', 'newspaper', 'press', 'editorial'],
  };
  ```
  `getDefaultImage()`에서 카테고리에 맞는 키워드 배열 중 articleId 기반으로 하나를 선택하여 seed에 사용. 기존 시그니처 유지 (`category: string | null, articleId: number | string`).
- **기대 효과**: 로고 이미지 대신 폴백이 적용될 때 카테고리에 맞는 시각적으로 관련 있는 이미지 표시

### 항목 3: NewsCard 컴포넌트 이미지 검증 적용
- **대상 파일**: `src/components/NewsCard.tsx`
- **현재 문제**: `src={article.imageUrl || getDefaultImage(...)}` — imageUrl이 로고 URL이면 그대로 표시된다.
- **개선 방법**:
  - `isValidArticleImage`를 import
  - 이미지 src 로직 변경:
    ```tsx
    src={isValidArticleImage(article.imageUrl) ? article.imageUrl : getDefaultImage(article.categoryPrimary, article.id)}
    ```
- **기대 효과**: 로고/플레이스홀더 URL이 감지되면 카테고리 맞춤 폴백 이미지로 대체

### 항목 4: NewsCardLarge 컴포넌트 이미지 검증 적용
- **대상 파일**: `src/components/NewsCardLarge.tsx`
- **현재 문제**: NewsCard와 동일한 문제. `article.imageUrl || getDefaultImage(...)` 패턴 사용.
- **개선 방법**:
  - `isValidArticleImage`를 import
  - 이미지 src 로직을 NewsCard와 동일하게 변경:
    ```tsx
    src={isValidArticleImage(article.imageUrl) ? article.imageUrl : getDefaultImage(article.categoryPrimary, article.id)}
    ```
- **기대 효과**: 대형 카드에서도 로고 이미지 대신 의미 있는 폴백 이미지 표시

### 항목 5: normalizer.ts `resolveImageUrl()` 검증 추가
- **대상 파일**: `src/workers/normalizer.ts`
- **현재 문제**: `resolveImageUrl()`이 enclosure URL, HTML img, meta og:image 순서로 추출하지만, 추출된 URL이 로고인지 검증하지 않는다.
- **개선 방법**:
  - 동일한 차단 패턴 로직을 서버사이드에 추가 (utils.ts의 `isValidArticleImage`를 직접 import하거나, 동일 로직의 인라인 함수를 normalizer 내에 구현)
  - `resolveImageUrl()` 내 각 추출 단계(enclosure, img tag, meta) 후 검증 적용:
    ```ts
    if (isImage && isValidArticleImage(url)) return url;
    ```
  - 검증 실패 시 다음 소스로 폴스루, 모두 실패 시 `null` 반환
- **기대 효과**: 수집 초기 단계에서 로고 URL이 걸러져 이후 파이프라인(스크래핑, AI 이미지 생성)이 정상 동작

### 항목 6: scraper.ts `extractOgImage()` 검증 추가
- **대상 파일**: `src/workers/scraper.ts`
- **현재 문제**: `extractOgImage()`가 og:image, twitter:image 메타 태그에서 추출한 URL을 검증 없이 반환한다. img 태그 폴백에서만 `logo`, `icon`, `avatar` 필터가 있다. **대부분의 로고 이미지는 og:image를 통해 들어온다.**
- **개선 방법**:
  - 함수 상단에 차단 패턴 검증 함수 추가 (또는 `isValidArticleImage` import)
  - og:image, twitter:image, meta name="image" 추출 후 반환 전에 검증:
    ```ts
    if (ogMatch?.[1] && isValidArticleImage(ogMatch[1])) return ogMatch[1];
    ```
  - img 태그 폴백의 기존 필터링도 `isValidArticleImage`로 통합
- **기대 효과**: 가장 빈번한 로고 유입 경로(og:image)를 차단

### 항목 7: collector.ts 스크래핑 후 이미지 검증 단계 추가
- **대상 파일**: `src/workers/collector.ts`
- **현재 문제**: 스크래핑(Step 3.5) 후 imageUrl 품질을 검증하지 않는다. 로고 URL이 imageUrl에 남아있으면 `image-generator.ts`의 `!a.imageUrl` 조건을 통과하지 못해 AI 이미지 생성이 트리거되지 않는다.
- **개선 방법**:
  - Step 3.5 (scraping) 후, Step 4 (translate/generate) 전에 검증 단계 추가:
    ```ts
    // ── Step 3.6: Validate image URLs ─────────────────────────────────────
    let clearedImages = 0;
    for (const article of normalized) {
      if (article.imageUrl && !isValidArticleImage(article.imageUrl)) {
        console.log(`[collector] Clearing bad imageUrl: ${article.imageUrl.slice(0, 80)}`);
        article.imageUrl = null;
        clearedImages++;
      }
    }
    if (clearedImages > 0) {
      console.log(`[collector] Cleared ${clearedImages} invalid image URL(s) — will trigger AI generation`);
    }
    ```
  - 이렇게 하면 imageUrl이 null이 되어 `image-generator.ts`의 `!a.imageUrl` 필터에 걸리고 AI 이미지 생성이 트리거된다.
- **기대 효과**: 다중 방어선의 최종 관문. normalizer와 scraper에서 놓친 로고 URL도 여기서 잡힌다.

### 항목 8: `/api/admin/fix-images` 관리자 API 엔드포인트 신규 생성
- **대상 파일**: `src/app/api/admin/fix-images/route.ts` (신규)
- **현재 문제**: DB에 이미 저장된 582개 기사의 잘못된 imageUrl을 수정할 방법이 없다.
- **개선 방법**:
  - `POST /api/admin/fix-images` 엔드포인트 생성
  - 동작:
    1. DB에서 모든 기사의 `id`, `imageUrl`, `categoryPrimary` 조회
    2. 각 기사의 imageUrl에 대해 `isValidArticleImage()` 검증
    3. 검증 실패한 기사의 imageUrl을 `null`로 업데이트
    4. 선택적으로 `regenerate=true` 쿼리 파라미터가 있으면 imageUrl이 null인 기사에 대해 AI 이미지 생성 트리거
    5. 결과 반환: `{ checked: number, cleared: number, regenerated: number }`
  - 보안: 기존 `/api/admin/*` 패턴과 동일한 수준 (현재 별도 인증 없음, 향후 미들웨어로 보호 가능)
  - `GET /api/admin/fix-images` 도 지원하여 현재 잘못된 이미지 수를 확인할 수 있는 dry-run 모드 제공
- **기대 효과**: 기존 기사 데이터의 일괄 수정 가능. 운영 중 관리자가 수동으로 실행하여 즉시 개선 가능.

### 항목 9: 알려진 로고 URL 블랙리스트 유지보수성 확보
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: 차단 패턴이 하드코딩되면 새로운 소스 추가 시 업데이트가 어렵다.
- **개선 방법**:
  - `BLOCKED_IMAGE_PATTERNS` 상수를 `utils.ts` 상단에 export하여 단일 위치에서 관리:
    ```ts
    export const BLOCKED_IMAGE_PATTERNS: RegExp[] = [
      /logo/i,
      /brand/i,
      /favicon/i,
      /\bicon\b/i,
      /default[-_]?image/i,
      /placeholder/i,
      /share[-_]image/i,
      /site[-_]image/i,
      /og[-_]image/i,
      /sns[-_]image/i,
      /\/common\//i,
      /widget/i,
      /spacer/i,
      /pixel/i,
      /beacon/i,
      /tracking/i,
      /\b1x1\b/i,
      /\b50x50\b/i,
      /\b100x100\b/i,
      /\.svg(\?|$)/i,
      /^data:image\//i,
    ];

    export const BLOCKED_IMAGE_DOMAINS: RegExp[] = [
      /chinadaily\.com\.cn\/.*?(logo|中文|masthead)/i,
      /nhk\.or\.jp\/.*?common\//i,
      /reuters\.com\/pf\/resources\//i,
      /static\.bbc\.co\.uk\/.*?logo/i,
    ];
    ```
  - `isValidArticleImage()`가 이 상수들을 참조
- **기대 효과**: 새로운 소스에서 로고 패턴이 발견되면 상수 하나만 수정하면 프론트/백엔드 모두에 적용

## 구현 순서

1. **utils.ts**: `BLOCKED_IMAGE_PATTERNS`, `BLOCKED_IMAGE_DOMAINS`, `isValidArticleImage()` 추가, `getDefaultImage()` 개선 (항목 1, 2, 9)
2. **normalizer.ts**: `resolveImageUrl()` 에 검증 추가 (항목 5)
3. **scraper.ts**: `extractOgImage()` 에 검증 추가 (항목 6)
4. **collector.ts**: Step 3.6 이미지 검증 단계 추가 (항목 7)
5. **NewsCard.tsx**: 이미지 src 로직 변경 (항목 3)
6. **NewsCardLarge.tsx**: 이미지 src 로직 변경 (항목 4)
7. **fix-images/route.ts**: 관리자 API 엔드포인트 생성 (항목 8)

## 회귀 안전 체크리스트

- [ ] 기존 582개 기사 데이터 보존 (imageUrl 필드만 선택적 변경, fix-images API로만 실행)
- [ ] `isValidArticleImage()`가 정상적인 이미지 URL을 오탐하지 않는지 확인
- [ ] `getDefaultImage()` 시그니처 변경 없음 — 기존 호출부 호환
- [ ] NewsCard/NewsCardLarge의 렌더링 구조 변경 없음 — 이미지 src 표현식만 변경
- [ ] normalizer/scraper/collector의 파이프라인 흐름 변경 없음 — 기존 단계 사이에 검증만 추가
- [ ] `npm run build` 성공 확인
- [ ] TypeScript 타입 오류 없음 확인
