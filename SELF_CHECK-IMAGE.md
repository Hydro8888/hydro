# 자체 점검 — 이미지 검증 및 폴백 개선 (SPEC-IMAGE)

## SPEC 개선 항목 체크
- [x] 항목 1: `isValidArticleImage()` — 이미 구현됨. BLOCKED_IMAGE_PATTERNS (21개 정규식), BLOCKED_IMAGE_DOMAINS (4개 정규식), BLOCKED_IMAGE_DOMAIN_NAMES (1개 도메인)으로 다층 검증 수행.
- [x] 항목 2: `getDefaultImage()` 카테고리별 키워드 매핑 — 이미 구현됨. 16개 카테고리에 대해 각 4개 키워드가 CATEGORY_IMAGE_SEEDS에 매핑됨. articleId 기반으로 키워드를 순환 선택.
- [x] 항목 3: NewsCard.tsx 이미지 검증 — 이미 구현됨. `isValidArticleImage(article.imageUrl) ? article.imageUrl! : getDefaultImage(...)` 패턴 적용. non-null assertion 추가로 TS 타입 에러 수정.
- [x] 항목 4: NewsCardLarge.tsx 이미지 검증 — 이미 구현됨. NewsCard와 동일 패턴 적용. non-null assertion 추가로 TS 타입 에러 수정.
- [x] 항목 5: normalizer.ts `resolveImageUrl()` 검증 — 이미 구현됨. enclosure, img tag, meta og:image 각 추출 후 `isValidArticleImage()` 검증 적용.
- [x] 항목 6: scraper.ts `extractOgImage()` 검증 — 이미 구현됨. og:image, twitter:image, meta name="image", img tag 모두에 `isValidArticleImage()` 검증 적용.
- [x] 항목 7: collector.ts Step 3.6 이미지 검증 — 이미 구현됨. 스크래핑 후/번역 전에 모든 기사의 imageUrl을 검증하고 실패 시 null로 클리어.
- [x] 항목 8: `/api/admin/fix-images` 관리자 API — 신규 생성 완료. GET (dry-run: 불량 이미지 수 확인 + 샘플 10개) + POST (불량 imageUrl을 null로 클리어) 지원.
- [x] 항목 9: 블랙리스트 유지보수성 — 이미 구현됨. BLOCKED_IMAGE_PATTERNS, BLOCKED_IMAGE_DOMAINS가 utils.ts 상단에 export 상수로 관리됨.

## 수정 파일 목록
- `src/components/NewsCard.tsx`: `article.imageUrl` → `article.imageUrl!` non-null assertion 추가 (TS 타입 에러 수정)
- `src/components/NewsCardLarge.tsx`: 동일한 non-null assertion 추가
- `src/app/api/admin/fix-images/route.ts`: 신규 생성. GET/POST 엔드포인트로 DB의 불량 이미지 URL 확인 및 일괄 클리어 기능.

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음. 이번 변경은 백엔드/유틸리티 로직 변경으로 시각 디자인 변경 없음.
- 독창적 요소: 5단계 다층 방어선 (normalizer → scraper → collector → 프론트엔드 → 관리자 API)
- 다크 모던 테마 일관성: 영향 없음 (이미지 URL 검증은 로직 레벨 변경)

## 회귀 위험 확인
- 기존 기능 영향: 없음. 기존 파이프라인 흐름 유지, 검증 로직만 추가.
- TypeScript 오류: 없음 (`npx tsc --noEmit` 통과)
- getDefaultImage() 시그니처: 변경 없음, 기존 호출부 호환
- DB 데이터: fix-images API를 수동 실행해야만 기존 데이터 변경 (자동 변경 없음)
- isValidArticleImage() 오탐 위험: 정상 기사 이미지 URL에 "logo", "icon", "pixel" 등의 키워드가 포함된 경우 오탐 가능. 현재 패턴은 보수적으로 설정됨.
