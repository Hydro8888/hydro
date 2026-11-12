# Unslop 감사 · 방향 · 토큰 계약 (LiveNews)

> 스킬: `.claude/skills/unslop` (unslop by Damir Sokolovsky [@heydamir](https://x.com/heydamir), CC BY 4.0).
> 이 문서는 스킬의 1~4단계(화면 보기 → 감사 → 변경 범위 결정 → 방향)의 산출물이고,
> 5단계(9개 패스)는 CLAUDE.md 하네스의 슬라이스 S1~S4가 이 문서를 계약으로 삼아 수행한다.
> 수정 전 화면: `qa-out/unslop/before/prod/*.jpg` (운영 사이트, 1440px·390px), 스냅샷 `qa-out/unslop/before/prod-home.html`.

## 1. 감사 — 발견한 징후 (references/signs.md 순서)

### 표면과 색
- 색이 16가지 이상 크롬에 퍼져 있음: 카테고리마다 다른 색 글자·왼쪽 테두리·배경(`constants.ts` CATEGORY_COLORS — red, blue, emerald, cyan, amber, pink, violet, teal, sky, rose, orange, lime, indigo, green …), 강조색 4개(`accent` 주황, `accent-blue`, `accent-red`, `accent-green`), 초록 "Hacker News" 링크, 섹션 제목 옆 주황·파랑 세로 막대 → **모든 것이 강조돼 아무것도 눈에 띄지 않음** (색 유틸리티 사용 115곳)
- 중립색이 GitHub 다크 팔레트 그대로(`#0d1117 / #161b22 / #21262d`, 테두리 `#30363d`) — 푸른 기운의 템플릿 기본값
- 모든 카드에 주황색 "자세히 보기 →" 링크(카드 전체가 이미 링크) → 강조색이 화면마다 수십 번 반복
- 그라데이션 6곳: `.text-gradient-amber`(그라데이션 글자), NewsletterBanner, NewsCardLarge 이미지 위 그라데이션, BreakingTicker 양끝 페이드
- 글로우·그림자·블러 5곳: `.border-glow`, `shadow-elevated` 호버, BookmarkButton `backdrop-blur`, Header, NewsCardLarge
- 푸터의 파란 테두리 배지 + 반짝이(sparkle) 아이콘 "OpenAI GPT 기반 자동 번역 … 운영 중" — AI 표시용 sparkle

### 서체
- 제목 굵기 700~800: `headline-xl` 800, `headline-lg`·`headline-md` 700, `font-bold`/`font-extrabold` 29곳
- 대문자 + 넓은 자간 라벨: `uppercase` 11곳, `tracking-wide*` 13곳 (예: 기사 본문 "요약"·"원문" 오버라인, 푸터 섹션 라벨, `KST`)
- 작은 글자에 음수 자간: `tracking-tight*` 3곳 (Header 로고, 404)
- 강조용 기울임: 기사 원제목 `italic` 1곳
- 숫자 형식 불일치: 헤더 `164,917 건` vs 속보 페이지 `164917개`, `tabular-nums` 일부만 적용
- 로고가 빨강("Live") + 파랑("News") + 회색(".co.kr") + 빨간 점의 4색 워드마크

### 아이콘
- 이모지를 아이콘으로 사용: `constants.ts` CATEGORIES 16개(🏛 📊 📈 💼 🤖 🔬 🚗 ⚡ 👥 🎭 🎬 ⚽ 🔭 ❤ …) → 푸터 카테고리 목록에 노출, `[country]/page.tsx` 🌍
- 인라인 SVG 아이콘의 크기·선 굵기가 섞여 있음(12~20px, stroke 1.5~2) — 슬라이스에서 전수 확인 필요

### 간격
- 4px 격자를 벗어난 값: Tailwind 반 단계(`p-1.5`=6px, `gap-2.5`=10px, `py-3.5`=14px 등) 69곳, 임의 값(`h-[160px]` 류 외 `text-[11px]`, `min-h-[…]` 등) 24곳
- 카드 패딩이 화면마다 다름(16 / 20 / 24 혼용), 메타 줄 간격 불균일

### 문구
- 모든 카드의 "자세히 보기 →" 반복 CTA
- "1분 읽기": 본문이 아니라 피드 요약문 길이로 계산돼 거의 모든 카드가 "1분" — 의미 없는 채움 정보
- 속보 페이지 `164917개` 같은 날것의 숫자, "최신 뉴스" 목록의 1·2·3 순번(순위가 아닌데 순위처럼 보임)
- 푸터 "…시스템 운영 중" 배지 문구 (AI 강조)

### 컴포넌트
- 알약(pill) 과다: `rounded-full` 18곳(카운트, 태그, 검색, 버튼)
- 카운트·상태가 색 있는 알약(속보 배지, `164917개` 배지)
- 모든 카드 이미지 위에 블러 원형 북마크 버튼

### 모션
- `transition-all` 9곳, 카드 이미지 `group-hover:scale-105` 2곳
- `animate-pulse`/`animate-ping` 5곳(헤더·티커의 점) — 실시간이 아닌 것에도 사용
- 진입 애니메이션 클래스 11곳(`animate-fade*`, `animate-slide*`) — 화면마다 다른 방향
- 뉴스 티커 무한 스크롤: 제품의 실제 기능(통신 티커)이므로 유지 대상, 단 한 가지 easing·hover/focus 정지 유지

### 템플릿 느낌 (정리 후에도 남기 쉬운 것)
- 제품 이름을 바꿔도 그대로 쓸 수 있는 화면: GitHub 다크 + Pretendard + 주황 버튼 + 색색 카테고리 배지

**판정: Heavy slop** — 색·서체·아이콘·문구 전반에 징후가 많아 전체 9패스를 수행한다. 단 섹션 구성과 순서, 기능은 그대로 둔다.

## 2. 방향 (Direction)

- **Product.** 해외 주요 언론 30곳의 기사를 몇 시간마다 모아 한국어로 번역해 보여 주는, 한국 독자를 위한 해외 뉴스 통신 데스크.
- **Character.** 차분한, 정확한, 종이 신문 같은.
- **World.** 밤의 편집국과 통신사 데스크 — 신문지와 잉크, 시각이 찍혀 나오는 통신 전문(電文). 중립색은 종이·잉크 쪽으로 아주 약하게 따뜻하게, 강조색은 기존 주황(교정 연필·잉크 주황) 하나만.
- **Moments.** ① 홈 머리기사의 실제 보도 사진 — 화면에서 유일하게 색이 풍부한 곳. ② "최신 뉴스" 통신 목록 — 시각이 고정폭 숫자로 찍힌 전문 목록.
- **Signature.** 통신 시각표: 기사마다 KST 시각을 고정폭 숫자로 표기(`14:02`, 날짜가 다르면 `11.05 14:02`). 이 한 가지만, 목록·카드 메타·기사 머리에 일관되게.

기존 브랜드: 로고 워드마크의 빨강·파랑 2색은 실제 브랜드 자산이 아니라 생성된 장식이므로 평평하게 다시 그린다(이름 `LiveNews`는 그대로, 한 색 워드마크 + 빨간 live 점은 "실시간"이라는 의미가 있을 때만).
글꼴 Pretendard는 한글 인터페이스를 위해 고른 것이므로 유지한다.

## 3. 토큰 계약 (모든 슬라이스 공통 — S1이 구현, S2~S4가 사용)

기존 토큰 **이름은 유지**하고 값만 바꾼다(다른 파일 빌드가 깨지지 않게). 새 이름은 아래에 명시한 것만 추가한다.

### 색 (Tailwind `theme.extend.colors`)
| 토큰 | 값 | 용도 |
|---|---|---|
| `surface-deep` (신규) | `#12110f` | 가장 깊은 면(푸터, 모바일 하단 탭) |
| `surface` | `#161513` | 페이지 배경 |
| `surface-card` | `#1c1a18` | 카드 |
| `surface-elevated` | `#262421` | 활성 행·입력·hover |
| `text` | `#efe9de` | 본문·제목 |
| `text-secondary` | `#aaa398` | 보조 |
| `text-muted` | `#8a847a` | 메타·캡션 전용 |
| `border` | `rgba(239,233,222,0.10)` | 헤어라인 |
| `border-muted` | `rgba(239,233,222,0.06)` | 더 옅은 구분선 |
| `accent` | `#f0883e` (유지) | 유일한 강조색: 현재 위치(활성 탭·현재 페이지), 주요 동작 1개 |
| `accent-ink` (신규) | `#161513` | 강조색 면 위의 글자 |
| `live` (신규) | `#e5484d` | "속보/실시간" 의미 전용(점·라벨) |
| `positive` / `negative` (신규) | `#4cc38a` / `#e5484d` | 관리자 화면의 성공·실패 의미 전용 |

- 삭제: `accent-blue`, `accent-red`, `accent-green`, `primary`, `dark`, `light`, CATEGORY_COLORS의 모든 색. 카테고리는 **색 없는 글자 라벨**(`text-secondary`)로 표시한다. `getCategoryStyle()`은 이름·시그니처를 유지하되 모든 카테고리에 같은 중립 클래스를 돌려준다.
- 그라데이션·글로우·색 그림자·`backdrop-blur` 없음. 이미지 위 글자 가독용 단색 스크림(같은 중립색의 투명도 변화)만 허용.
- 어두운 테마의 깊이는 면 단계 + 헤어라인으로. 그림자는 떠 있는 메뉴(`shadow-float`: `0 8px 24px rgba(0,0,0,0.35)`) 하나만.
- 주요 버튼(어두운 테마): `text` 색 면(`#efe9de`) + `accent-ink` 글자. 강조색 면 버튼은 쓰지 않는다.

### 서체
| 토큰 | 값 |
|---|---|
| `font-sans` | Pretendard Variable (유지) — 인터페이스 전체 |
| `font-serif` (신규) | `'Noto Serif KR', 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif` — **큰 헤드라인 2곳만**: 홈 머리기사 제목, 기사 상세 h1 |
| `font-mono` (신규) | `'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace` — 시각·숫자·카운트 |

- 글꼴 로딩: Google Fonts `Noto Serif KR:wght@500;600` + `IBM Plex Mono:wght@400;500`, `display=swap`, **렌더를 막지 않는 방식**(빌드 시점 다운로드 금지 — 운영 서버 빌드가 네트워크에 의존하면 안 됨). 실패해도 대체 글꼴로 정상 표시.
- 굵기: 400(본문), 500(제목·라벨), 600(큰 헤드라인만). **700 이상 금지.**
- 크기 토큰(이름 유지): `headline-xl` clamp(1.75rem → 2.5rem)/1.2/600, `headline-lg` 1.75rem/1.25/600, `headline-md` 1.25rem/1.35/500, `headline-sm` 1rem/1.45/500, `body-lg` 0.9375rem/1.6/400, `body-md` 0.875rem/1.6/400, `caption` 0.75rem/1rem/400, `overline` 0.75rem/1rem/500 **자간 0** (대문자 변환 금지).
- 신규 `text-meta`: 0.75rem/1rem/400 — 시각·카운트용(`font-mono tabular-nums`와 함께).
- `uppercase`, `tracking-wide*`, `tracking-tight*`(40px 미만), `italic` 금지. 숫자는 `tabular-nums` + 천 단위 쉼표 한 가지 형식(`164,917건`).

### 간격·모서리·모션
- 간격: 4px 격자(Tailwind 정수 단계 1,2,3,4,5,6,8,10,12,16…). 반 단계(`1.5`, `2.5`, `3.5`)와 임의 px 금지. `0.5`(2px)는 작은 컨트롤 내부 보정에만. 카드 패딩 20(`p-5`), 조밀한 패널 16, 페이지 가장자리 16(모바일)/24~32(데스크톱).
- 모서리: `rounded-tag` 6px(신규), `rounded-control` 8px(신규), `rounded-card` 12px, `rounded-panel` 16px(신규). `rounded-full`은 실제 원(점, 아이콘 버튼)만.
- 모션: easing 하나 `cubic-bezier(0.22, 1, 0.36, 1)`(Tailwind 기본 timing function으로 설정), 지속 150ms(hover·press), 200ms(메뉴), 400ms(진입). `transition-all`·`hover:scale`·`animate-pulse/ping`·튀는 애니메이션 금지. 전환은 `transition-colors` / `transition-[transform,opacity]`처럼 이름을 적는다. 진입은 페이지당 한 번, 짧은 fade+rise(8px)만. 티커 스크롤은 유지(hover·focus 정지, reduced-motion 존중).
- 포커스: 키보드 포커스 링 `outline 2px accent, offset 2px` 한 가지.

### 시그니처·모먼트용 유틸
- `formatWireTime(date, now?)` (S1, `utils.ts`): 같은 KST 날짜면 `HH:mm`, 아니면 `MM.DD HH:mm`, 무효 입력은 `''`. 서버·브라우저 동일 출력(기존 KST 헬퍼 재사용).
- `.dateline` (S1, globals.css): `font-mono tabular-nums text-meta text-text-muted`.
- `.img-standin` (S1): 기사 사진이 아닌 대체 사진(카테고리 스톡 사진)용 인쇄 처리 — `filter: grayscale(1) contrast(1.05) brightness(0.9)`. 실제 보도 사진만 원색으로 남겨 모먼트가 되게 한다. (references/effects.md의 Duotone을 CSS만으로 적용. 캔버스·애니메이션 없음.)

## 4. 패스 ↔ 슬라이스

| 패스 | S1 디자인 시스템 | S2 레이아웃 | S3 컴포넌트 | S4 페이지 |
|---|---|---|---|---|
| 1 간격 | 규칙·유틸 | 헤더·푸터·내비 행 높이 | 카드 패딩·메타 줄 | 페이지 여백·섹션 간격 |
| 2 색 | 램프·강조색·카테고리 중립화 | 로고·내비·푸터 | 카드·티커·페이지네이션 | 섹션 머리·관리자 의미색 |
| 3 아이콘 | CATEGORIES 이모지 제거 | 헤더·푸터 아이콘 크기/선 | 카드 아이콘 | 🌍 등 페이지 아이콘 |
| 4 문구 | — | 푸터 AI 배지 문구 | "자세히 보기"·"1분 읽기" | 숫자 형식·섹션 제목·빈 상태 |
| 5 서체 | 굵기·크기·serif/mono | 워드마크 | 카드 제목·메타 | 기사 h1 serif·오버라인 |
| 6 레이아웃 | — | 내비 조용하게 | — | 섹션·순서 유지, 정렬만 |
| 7 디테일 | 모서리·포커스 | 활성 상태·키캡 | 북마크·카운트·배지 | 표 상태·시그니처 배치 |
| 8 비주얼 | `.img-standin` | — | 대체 사진 인쇄 처리 | 생성 이미지 없음(앱 화면) |
| 9 모션 | easing·지속 | 헤더 전환 | 카드 hover·티커 | 진입 애니메이션 1개 |

S5(백엔드)는 화면이 없어 이번 작업 대상이 아니다.

## 5. 하지 않는 것
- 제품 이름·기능·섹션 순서 변경, 새 기능·주장·데이터 추가
- 제거한 장식을 다른 장식(글래스, 그레인, 네온, 벤토)으로 교체
- 유료 이미지 생성(이미지 생성 도구가 연결돼 있지 않고, 앱 화면이라 필요하지 않음)
