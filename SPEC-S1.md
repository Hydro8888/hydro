# Design System (Slice S1) 개선 설계서

## 현재 상태 분석

### 장점
- Tailwind CSS 기반으로 유틸리티 클래스 체계가 잡혀 있음
- `globals.css`에 컴포넌트 레이어(`@layer components`)로 재사용 클래스 정의
- `constants.ts`에 카테고리/국가/메뉴 데이터가 중앙 집중화되어 있음
- `utils.ts`에 날짜 포맷, 라벨 변환 등 공통 함수 존재

### 단점
1. **색상 시스템 파편화**: `tailwind.config.ts`에 5개 색상만 정의, 나머지는 Tailwind 기본값에 의존. 다크 테마 토큰이 전혀 없음
2. **카테고리 컬러 중복**: `NewsCard.tsx`와 `NewsCardLarge.tsx`에 동일한 `categoryColors` 맵이 각각 하드코딩됨 (16개 항목 x 2파일)
3. **라이트 모드 전용**: `globals.css`의 body가 `bg-white text-gray-900`으로 고정. 다크 테마 전환 불가
4. **컴포넌트 클래스가 라이트 색상 하드코딩**: `.news-card`의 `border-gray-100`, `hover:bg-gray-50` 등이 다크 테마와 충돌
5. **국가 컬러도 `utils.ts`에 라이트 전용 하드코딩**: `bg-blue-100 text-blue-800` 등 — 다크 배경에서 가독성 없음
6. **타이포그래피 스케일 미정의**: 헤드라인~캡션 사이즈가 각 컴포넌트에서 임의로 `text-sm`, `text-lg` 사용
7. **그림자 시스템 없음**: `tailwind.config.ts`에 boxShadow 확장 없음
8. **borderRadius, spacing 등 디자인 토큰 미정의**: 일관성 없는 둥근 모서리와 여백

---

## 디자인 방향

### 전체 분위기
**Bloomberg Terminal meets Reuters Digital** — 깊은 네이비-블랙 배경 위에 정보 밀도가 높은 뉴스 레이아웃. 따뜻한 앰버 악센트가 차가운 다크 톤에 생기를 불어넣는다. "금융 터미널을 쓰는 전문가"의 신뢰감.

### 명시적 금지 (AI slop 패턴)
- 보라색-핑크 그라데이션 배경 금지
- 흰색 카드 + 밝은 그림자 조합 금지
- 네온 컬러 악센트 금지
- 둥근 모서리 과다 사용 금지 (max `rounded-lg`, 대부분 `rounded-md`)

### 차별화 아이디어
1. **Data-ticker 미학**: 카테고리 배지에 좌측 2px 바(bar) 인디케이터 사용 — pill 형태 대신 터미널 스타일의 라벨 태그
2. **Surface elevation 시스템**: 3단계 배경색(main → card → elevated)과 매칭 그림자로 z-depth를 색상으로 표현. 호버 시 elevation이 한 단계 올라가는 마이크로 인터랙션

---

## 대상 파일 목록

| 파일 | 역할 |
|------|------|
| `tailwind.config.ts` | 디자인 토큰 중앙 정의 |
| `src/app/globals.css` | 기본 스타일 + 컴포넌트 클래스 |
| `src/lib/constants.ts` | 카테고리/국가 데이터 + **신규: 카테고리 컬러 맵** |
| `src/lib/utils.ts` | 유틸리티 함수 + 컬러 헬퍼 |

---

## 개선 항목

### 항목 1: Tailwind 다크 모던 색상 토큰 체계 구축
- **대상 파일**: `tailwind.config.ts`
- **현재 문제**: `colors`에 5개 값만 존재 (`primary`, `accent`, `dark`, `light`, `border`). 다크 테마용 surface, text, accent 등 세분화된 토큰 없음
- **개선 방법**: 시맨틱 색상 토큰을 계층적으로 정의:
  ```
  colors: {
    surface: { DEFAULT: '#0d1117', card: '#161b22', elevated: '#21262d' },
    text: { DEFAULT: '#e6edf3', secondary: '#8b949e', muted: '#484f58' },
    accent: { DEFAULT: '#f0883e', blue: '#58a6ff', red: '#f85149', green: '#3fb950' },
    border: { DEFAULT: '#30363d', muted: '#21262d' },
  }
  ```
- **기대 효과**: 모든 컴포넌트가 `bg-surface-card`, `text-text-secondary`, `border-border` 등 시맨틱 클래스로 통일. 색상 변경 시 한 곳만 수정

### 항목 2: 타이포그래피 스케일 정의
- **대상 파일**: `tailwind.config.ts`
- **현재 문제**: fontSize 확장 없음. 컴포넌트마다 `text-sm`, `text-2xl` 등을 임의 사용하여 시각적 위계가 불분명
- **개선 방법**: `fontSize` 확장에 뉴스 플랫폼용 스케일 추가:
  ```
  fontSize: {
    'headline-xl': ['2.5rem', { lineHeight: '1.15', fontWeight: '800' }],
    'headline-lg': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
    'headline-md': ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
    'headline-sm': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
    'body-lg': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
    'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
    'overline': ['0.6875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.05em' }],
  }
  ```
- **기대 효과**: `text-headline-lg`, `text-body-md` 등으로 의미 기반 타이포그래피 적용. 뉴스 헤드라인의 시각적 위계가 명확해짐

### 항목 3: 그림자 및 borderRadius 토큰 정의
- **대상 파일**: `tailwind.config.ts`
- **현재 문제**: boxShadow, borderRadius 확장 없음. 다크 테마에서의 elevation 표현 불가
- **개선 방법**: 다크 테마 최적화 그림자 3단계 + 둥근 모서리 토큰:
  ```
  boxShadow: {
    card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    elevated: '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
    dropdown: '0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)',
  }
  borderRadius: {
    card: '0.5rem',
    badge: '0.25rem',
    pill: '9999px',
  }
  ```
- **기대 효과**: `shadow-card`, `shadow-elevated`, `rounded-card` 등으로 일관된 elevation 시스템 적용

### 항목 4: globals.css 다크 모던 테마 전면 전환
- **대상 파일**: `src/app/globals.css`
- **현재 문제**: body가 `bg-white text-gray-900`으로 라이트 모드 고정. 모든 컴포넌트 클래스가 라이트 색상 하드코딩 (`border-gray-100`, `hover:bg-gray-50`, `text-gray-700` 등)
- **개선 방법**:
  - body: `bg-surface text-text antialiased` 로 변경
  - `.news-card`: `border-b border-border hover:bg-surface-elevated transition-colors`
  - `.news-card-large`: `border border-border-muted bg-surface-card hover:shadow-elevated transition-all`
  - `.category-pill`: 좌측 바 스타일로 변경 — `inline-flex items-center pl-2 border-l-2 text-overline font-semibold tracking-wide uppercase`
  - `.nav-link`: `text-text-secondary hover:text-accent transition-colors`
  - `.nav-link-active`: `text-accent border-b-2 border-accent`
  - `.tab-item` / `.tab-item-active`: 동일하게 다크 토큰 적용
  - 스크롤바 커스텀 스타일 추가 (webkit — 다크 테마 매칭)
  - `::selection` 색상: `bg-accent/20 text-text`
- **기대 효과**: 페이지 전체가 일관된 다크 모던 톤으로 전환. 라이트 색상 잔재 제거

### 항목 5: 카테고리 컬러 맵 중앙 집중화 (중복 제거)
- **대상 파일**: `src/lib/constants.ts`
- **현재 문제**: `NewsCard.tsx`와 `NewsCardLarge.tsx`에 동일한 `categoryColors` 객체가 각각 하드코딩. 색상 변경 시 양쪽 모두 수정 필요. 현재 색상은 라이트 배경 기준 (`bg-red-600` 등)
- **개선 방법**: `constants.ts`에 다크 테마 최적화된 카테고리 컬러 맵을 export:
  ```typescript
  export const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
    politics: { border: 'border-l-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    economy: { border: 'border-l-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    market: { border: 'border-l-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    // ... 전체 16개 카테고리
  };
  ```
  이후 `NewsCard.tsx`, `NewsCardLarge.tsx`에서 이 맵을 import하여 사용
- **기대 효과**: 색상 정의 단일 소스(Single Source of Truth). 다크 배경에서 가독성 확보. 유지보수성 대폭 향상

### 항목 6: 국가 컬러 함수 다크 테마 전환
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: `countryColor()` 함수가 `bg-blue-100 text-blue-800` 등 라이트 모드 전용 클래스를 반환. 다크 배경(#0d1117)에서 `bg-blue-100`은 눈에 거슬리게 밝음
- **개선 방법**: 반투명 배경 + 밝은 텍스트로 전환:
  ```typescript
  export function countryColor(code: string): string {
    const map: Record<string, string> = {
      global: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
      us: 'bg-red-500/15 text-red-400 border border-red-500/20',
      japan: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
      china: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    };
    return map[code] || 'bg-surface-elevated text-text-secondary';
  }
  ```
- **기대 효과**: 국가 배지가 다크 배경에 자연스럽게 어우러짐. 반투명 배경으로 depth 표현

### 항목 7: CSS 유틸리티 클래스 현대화 및 다크 전용 유틸리티 추가
- **대상 파일**: `src/app/globals.css`
- **현재 문제**: `@layer utilities`에 `line-clamp` 만 존재. Tailwind v3.3+에서 `line-clamp`은 기본 내장이므로 중복. 다크 테마 전용 유틸리티 없음
- **개선 방법**:
  - 중복 `line-clamp` 유틸리티 제거 (Tailwind 기본 사용)
  - 다크 테마 전용 유틸리티 추가:
    ```css
    @layer utilities {
      .text-gradient-amber {
        @apply bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent;
      }
      .border-glow {
        box-shadow: 0 0 0 1px rgba(240, 136, 62, 0.3);
      }
      .surface-interactive {
        @apply bg-surface-card hover:bg-surface-elevated active:bg-surface transition-colors duration-150;
      }
    }
    ```
  - 글로벌 스크롤바 스타일:
    ```css
    @layer base {
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #0d1117; }
      ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #484f58; }
    }
    ```
- **기대 효과**: 불필요한 중복 제거 + 다크 테마 전용 유틸리티로 컴포넌트 작성 효율 향상. 스크롤바까지 다크 테마 통일

### 항목 8: utils.ts에 디자인 시스템 헬퍼 함수 추가
- **대상 파일**: `src/lib/utils.ts`
- **현재 문제**: `categoryLabel()` 함수는 있으나 카테고리 색상을 반환하는 함수가 없음. 색상 로직이 컴포넌트에 분산
- **개선 방법**: `constants.ts`의 `CATEGORY_COLORS`를 활용하는 헬퍼 함수 추가:
  ```typescript
  import { CATEGORY_COLORS } from './constants';

  export function getCategoryStyle(slug: string): { border: string; text: string; bg: string } {
    return CATEGORY_COLORS[slug] || { border: 'border-l-gray-500', text: 'text-text-secondary', bg: 'bg-surface-elevated' };
  }
  ```
  또한 `cn()` (classnames merge) 유틸리티 추가:
  ```typescript
  export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
  }
  ```
- **기대 효과**: 컴포넌트에서 `getCategoryStyle(slug)` 한 번 호출로 border/text/bg 클래스를 모두 얻음. `cn()` 으로 조건부 클래스 결합 간편화

### 항목 9: Tailwind config에 다크 전용 애니메이션 토큰 추가
- **대상 파일**: `tailwind.config.ts`
- **현재 문제**: `globals.css`에 ticker 애니메이션만 정의. 다크 테마에서 중요한 마이크로 인터랙션(fade-in, slide-up, pulse-glow) 토큰 없음
- **개선 방법**: `keyframes`와 `animation` 확장:
  ```
  keyframes: {
    'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
    'slide-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
    'pulse-dot': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
  },
  animation: {
    'fade-in': 'fade-in 0.3s ease-out',
    'slide-up': 'slide-up 0.4s ease-out',
    'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
  }
  ```
- **기대 효과**: 속보 인디케이터에 `animate-pulse-dot`, 카드 진입에 `animate-slide-up` 등 뉴스 플랫폼 특화 모션. Bloomberg 터미널의 "라이브" 느낌 연출

### 항목 10: constants.ts에 브레이킹 뉴스 및 AI 관련 디자인 토큰 상수 추가
- **대상 파일**: `src/lib/constants.ts`
- **현재 문제**: 속보(breaking) 전용 색상 상수 없음. AI 기능 관련 시각적 구분 상수 없음. 뉴스 중요도(priority) 시각 표현 체계 없음
- **개선 방법**:
  ```typescript
  export const PRIORITY_STYLES = {
    breaking: { badge: 'bg-accent-red/15 text-accent-red border border-accent-red/30', dot: 'animate-pulse-dot bg-accent-red' },
    urgent: { badge: 'bg-accent/15 text-accent border border-accent/30', dot: 'bg-accent' },
    normal: { badge: 'bg-surface-elevated text-text-secondary', dot: 'bg-text-muted' },
  } as const;

  export const AI_BADGE_STYLE = 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-overline';
  ```
- **기대 효과**: 속보에 빨간 점멸 도트 + 빨간 배지, 긴급에 앰버, 일반에 뉴트럴. AI 생성/추천 콘텐츠를 블루 배지로 시각 구분. 뉴스 플랫폼의 정보 위계가 명확해짐

---

## 구현 우선순위

1. **항목 1** (색상 토큰) → 모든 다른 항목의 기반
2. **항목 2, 3** (타이포/그림자) → 토큰 체계 완성
3. **항목 4** (globals.css) → 토큰 적용하여 기본 스타일 전환
4. **항목 5, 6, 8** (카테고리/국가 컬러 통합) → 중복 제거 + 다크 전환
5. **항목 7, 9, 10** (유틸리티/애니메이션/상수) → 고급 기능

## 회귀 안전 체크리스트

- [ ] 기존 582개 기사 정상 표시 확인
- [ ] `CATEGORIES`, `COUNTRIES`, `MAIN_MENU` 등 기존 상수 구조 변경 없음 (추가만)
- [ ] `timeAgo()`, `formatDate()`, `truncate()`, `buildSearchParams()`, `getDefaultImage()` 함수 시그니처 변경 없음
- [ ] `countryColor()`, `categoryLabel()` 반환값 형식 호환 유지
- [ ] Tailwind 기존 클래스(`bg-white`, `text-gray-900` 등)가 쓰이는 다른 파일에서 깨지지 않도록, globals.css의 base 레이어에서만 오버라이드
- [ ] `breaking-ticker` 애니메이션 동작 보존
