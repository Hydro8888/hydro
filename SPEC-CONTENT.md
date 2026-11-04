# SPEC-CONTENT: 기사 본문 수집 파이프라인 근본 수정

## 문제
기사 상세 페이지에서 본문이 1-2문장으로 매우 짧게 표시됨.

## 근본 원인
1. `normalizer.ts:149` — RSS 콘텐츠를 `.slice(0, 500)`으로 절단
2. `scraper.ts:232` — `contentOriginal.length < 500` 조건으로 재스크래핑 판단 → normalizer가 500으로 잘랐으므로 스크래퍼 건너뜀
3. `content-translator.ts:50` — 번역 입력 `.slice(0, 4500)` 제한

## 개선 항목

### Item 1: normalizer.ts — 500 → 8000
- 라인 144 주석: "max 3000 chars" → "max 8000 chars"
- 라인 149: `.slice(0, 500)` → `.slice(0, 8000)`

### Item 2: scraper.ts — 재스크래핑 임계값 500 → 1500
- 라인 232: `a.contentOriginal.length < 500` → `a.contentOriginal.length < 1500`

### Item 3: content-translator.ts — 번역 입력 4500 → 6000
- 라인 50: `.slice(0, 4500)` → `.slice(0, 6000)`

### Item 4: 기존 기사 복구 API `/api/admin/fix-content/route.ts` (신규)
- GET: contentOriginal 500자 이하 기사 수 + 샘플 반환 (dry-run)
- POST: 해당 기사 재스크래핑 → DB 업데이트 + contentKo null 설정
- scraper.ts의 fetchArticlePage 재사용
- 배치: 10개씩, 800ms 딜레이

## 검증 기준
- `npm run build` 성공
- `npx tsc --noEmit` 에러 없음
- 기존 기능 회귀 없음
