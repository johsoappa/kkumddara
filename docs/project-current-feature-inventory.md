# 꿈따라 현재 적용 기능 전체 현황 감사

> 작성일: 2026-05-26  
> 작성 기준: 코드베이스(`src/`) + migration(`supabase/migrations/`) + 문서(`docs/`) 기준  
> 상태: 1차 감사 완료  
> 목적: 로드맵 업데이트 기준 문서 / 사업계획서·기능 소개 근거 자료 / 향후 개발 우선순위 판단 기반  
> 주의: Supabase 운영 DB 직접 조회 없음. DB 실측이 필요한 항목은 "OZ 확인 필요"로 표시.

---

## 1. 요약 결론

| 항목 | 상태 | 요약 |
|---|---|---|
| 서비스 기본 구조 | **구현 완료** | 랜딩·학부모 홈·학생 홈·요금제 모두 운영 중. 역할 분리 정상. |
| 인증/사용자 구조 | **구현 완료** | 카카오 로그인·RLS·역할 분기 완료. caregiver_invite 베타 비활성. |
| 직업 탐색 기능 | **구현 완료** | DB 우선 + 정적 폴백 구조. 카테고리·검색·상세·퀴즈·고용24 참고 지표 모두 작동. |
| 대표 직업 100개 확장 | **구현 완료** | migration 055·056 기준 스포츠 생태계 10개 포함 100개+α. OZ 운영 DB 실측 필요. |
| 관심 운동 기반 진로 확장 | **구현 완료** | sportsInterestData.ts + SportsInterestCareerSection + SportsInterestSelector 모두 작동. Smoke Test PASS. |
| 로드맵/주간 미션 | **부분 구현** | Stage 1 DB화 완료. Stage 2·3 정적 유지. weekly roadmap AI 생성 완료. P1 5개 정적 작성 미완료. |
| 리포트 | **부분 구현** | 기본 주간 리포트·비교 그래프 완료. WeeklySummary·GrowthChart 실데이터 미연결. |
| 명따라/AI | **부분 구현** | Phase 1 운영 중(API 미호출). Phase 2 환경변수 미설정 상태. 차감 유예 플래그 active. |
| 요금제 | **문서화 완료** | UI 구조 완성. 실결제 연동 미완료(토스페이먼츠 미계약). |
| 공공데이터/사업계획서 | **부분 구현** | 고용24 참고 지표 정적 seed 완료. API 직접 연동 미완료. 경기도 공공데이터 직접 연동 없음. |

---

## 2. 전체 기능 현황 표

| 기능 | 상태 | 근거 파일 | 메모 |
|---|---|---|---|
| 랜딩 페이지 | 구현 완료 | `src/app/page.tsx` | 서비스 소개·CTA·역할 진입 |
| 학부모 홈 | 구현 완료 | `src/app/parent/home/page.tsx` | 자녀 요약·AI 상담·명따라·리포트 진입 |
| 학생 홈 | 구현 완료 | `src/app/student/home/page.tsx` | 오늘의 미션 DB 전환 완료 (prep+action) |
| 요금제 페이지 | 구현 완료 | `src/app/pricing/page.tsx` | 베이직·프리미엄·패밀리·패밀리 플러스 UI. 실결제 미연동. |
| 카카오 로그인 | 구현 완료 | `src/app/auth/kakao/start/route.ts`, `src/app/auth/callback/route.ts` | OAuth 콜백·role 유지 라우팅 정상 |
| 이메일 로그인 | 미구현 | — | 카카오 단일 로그인만 운영 중 |
| parent/student role 분기 | 구현 완료 | `src/lib/auth.ts` | 역할 기반 홈 분기 정상 |
| child 생성/연결 | 구현 완료 | `src/lib/db/family.ts`, `supabase/migrations/001_*` | 자녀 생성·연결 구조 완료 |
| caregiver_invite | 문서화 완료 | `supabase/migrations/023_disable_caregiver_invite_for_beta.sql` | 베타 기간 비활성화됨 |
| subscription_plan DB 구조 | 구현 완료 | `supabase/migrations/006_plan_refactor.sql` 외 다수 | free/basic/family/family_plus/premium 정의. 실결제 미연동. |
| RLS | 구현 완료 | `supabase/migrations/003_rls_insert_policies.sql` | families·children·parent·student 정책 완료 |
| 직업 목록 (`/explore`) | 구현 완료 | `src/app/explore/page.tsx` | DB 우선·정적 폴백·카테고리 9개·검색 |
| 카테고리 필터 (9개) | 구현 완료 | `src/app/explore/page.tsx` | IT·기술/의료·과학/예술·디자인/콘텐츠·미디어/비즈니스·경영/교육·사회/환경·미래산업/공공·안전/항공·운송 |
| 검색 (한글+공백 정규화) | 구현 완료 | `src/app/explore/page.tsx` | `qNorm` 공백 제거 비교 포함 |
| 관심 운동 검색 CTA | 구현 완료 | `src/app/explore/page.tsx` | `SPORT_INTEREST_SEARCH_KEYWORDS` 31개 키워드, `/explore/interests/sports` 안내 |
| 직업 상세 (`/explore/[id]`) | 구현 완료 | `src/app/explore/[id]/page.tsx` | DB 모드 + 정적 폴백 양방 구현 |
| 직업 퀴즈 | 구현 완료 | `src/data/quizData.ts`, `src/components/quiz/OccupationQuiz.tsx` | 1차 23개 69문항 + 스포츠 10개 30문항 |
| 고용24 참고 지표 (Goyo24) | 구현 완료 | `src/components/explore/Goyo24InfoSection.tsx`, `migration/056` | 정적 seed 기반. 실시간 API 미연동. |
| 세부 직업 검색 노출 | 구현 완료 | `src/app/explore/page.tsx` | `is_representative=false` 직업도 검색 결과 노출 |
| 관심 운동 연결 섹션 | 구현 완료 | `src/components/explore/SportsInterestCareerSection.tsx` | Smoke Test PASS (5개 URL 확인) |
| `sportsInterestData.ts` | 구현 완료 | `src/data/sportsInterestData.ts` | 관심 운동 10개 × 연결 직업 데이터 |
| 관심 운동 선택 화면 | 구현 완료 | `src/app/explore/interests/sports/page.tsx`, `src/components/explore/SportsInterestSelector.tsx` | `/explore/interests/sports` Smoke Test PASS |
| 운동선수 직업군 정책 | 문서화 완료 | `docs/sports-athlete-occupation-policy.md` | A안(미추가) 확정. DB 즉시 추가 없음. |
| weekly roadmap 검토 | 문서화 완료 | `docs/sports-ecosystem-weekly-roadmap-decision.md` | C안(P1 5개 우선) 확정. 실제 작성 미완료. |
| P1 스포츠 5개 roadmaps.ts | **미구현** | `src/data/roadmaps.ts` | sports-data-analyst 등 5개 미등록 확인 |
| 로드맵 페이지 (`/roadmap/[id]`) | 구현 완료 | `src/app/roadmap/[occupationId]/page.tsx` | Stage 1 DB 우선·Stage 2·3 정적 유지 |
| ProgressCircle | 구현 완료 | `src/components/roadmap/ProgressCircle.tsx` | 진행률 시각화 |
| weekly_roadmap_missions | 구현 완료 | `src/app/api/roadmap/weekly-missions/route.ts`, `migration/049` | AI 생성 + roadmaps.ts fallback 구조 |
| roadmap_progress (DB 저장) | 구현 완료 | `supabase/migrations/001_init_schema.sql` | child_id 있을 때 DB 저장. 없으면 localStorage fallback. |
| 부모 주간 리포트 | 구현 완료 | `src/app/report/page.tsx` | 7일 활동·비교 막대 그래프·완료 미션 확인 |
| 지난주/이번주 비교 그래프 | 구현 완료 | `src/app/report/page.tsx` | weekly_activity_completions 기반 |
| WeeklySummary·GrowthChart | 부분 구현 | `src/app/report/page.tsx` | 실데이터 미연결. Phase 3 이후 예정. |
| 명따라 입력 화면 | 구현 완료 | `src/app/myeonddara/page.tsx` | Phase 1 운영 중. Phase 2 환경변수 미설정(API 미호출). |
| 명따라 결과 화면 | 구현 완료 | `src/app/myeonddara/result/page.tsx` | OhaengChart·RecommendedCareers 포함 |
| 명따라 사용량 API | 구현 완료 | `src/app/api/myeonddara/usage/route.ts` | 조회/차감 구조 완성 |
| 명따라 Phase 2 차감 유예 | 구현 완료 | `src/lib/featureFlags.ts` | `MYEONDDARA_PHASE2_DEDUCT_USAGE: false` (베타 유예 상태) |
| 명따라 free 차단 정책 | 구현 완료 | `supabase/migrations/048_enable_free_myeonddara_one_time_trial.sql` | free 1회 체험 정책 반영 |
| AI 진로 상담 (`/parent/counseling`) | 구현 완료 | `src/app/api/ai-consult/route.ts`, `src/lib/featureFlags.ts` | `AI_CONSULT_ENABLED: true` 활성. 월 제한 구조 있음. |
| 요금제 UI 구조 | 구현 완료 | `src/app/pricing/page.tsx` | 베이직·프리미엄·패밀리·패밀리 플러스·베타 무료 체험 |
| 실결제 연동 | **미구현** | — | 토스페이먼츠 미계약. 결제 버튼 → 안내 문구만. |
| 플랜별 기능 분기 | **미구현** | — | subscription_plan DB 구조만 있음. 실제 분기 처리 미완료. |
| 고용24 API 직접 연동 | **미구현** | `docs/ROADMAP.md` §05 | API 인증키 발급 여부 미확인. 직접 연동 없음. |
| 경기도 공공데이터 직접 연동 | **없음** | — | 직접 연동 없음. 향후 계획만 존재. |
| PG 결제 시스템 | **미구현** | `docs/ROADMAP.md` §04 | 토스페이먼츠 미계약. 긴급 필수 항목. |
| 보호자 초대 코드 E2E | **확인 필요** | `supabase/migrations/010_caregiver_invite_v2.sql` | 스키마 존재. 발급→수락→권한 E2E 완료 여부 미확인. |

---

## 3. 서비스 기본 구조

### 3-1. 랜딩 페이지 (`/`)
- **상태:** 구현 완료
- 서비스 소개 ("아직 꿈이 없어도 괜찮아요"), CTA, 역할 선택(학부모/학생) 진입
- 비로그인 체험 모드 → 로그인 유도 흐름 작동

### 3-2. 학부모 홈 (`/parent/home`)
- **상태:** 구현 완료
- 섹션 1: 자녀 요약 카드 (이름·학년·초대코드·관심분야)
- 섹션 2: 부모 전용 기능 진입 (리포트·AI 상담·명따라)
- 규칙 기반 대화 주제 제안 (AI 없음, `INTEREST_QUESTIONS` 로직)
- `FEATURE_FLAGS.AI_CONSULT_ENABLED` 반영

### 3-3. 학생 홈 (`/student/home`)
- **상태:** 구현 완료
- 오늘의 미션: occupation_preparations(step_action) + occupation_student_actions 병렬 조회 (DB 우선)
- 추천 직업: occupation_master 기반 is_active=true
- 정적 ROADMAPS fallback 유지
- **잔여 미완료:** m1~m4 checked_missions 변환 migration, Phase 2 직업 20개 seed

### 3-4. AppShell / 공통 레이아웃
- **상태:** 구현 완료
- `src/components/layout/AppShell.tsx`, `BottomNav.tsx`
- 인증 상태 감지 + 리다이렉트 처리

### 3-5. 인증 필요 여부
| 경로 | 인증 필요 |
|---|---|
| `/` (랜딩) | 불필요 |
| `/explore`, `/explore/[id]` | 불필요 (비로그인 체험 가능) |
| `/explore/interests/sports` | 불필요 |
| `/parent/*` | 필요 (미들웨어 보호) |
| `/student/*` | 필요 (미들웨어 보호) |
| `/roadmap/[id]` | 선택 (localStorage fallback 가능) |
| `/myeonddara` | 필요 (학부모 전용) |

---

## 4. 인증/사용자 구조

| 항목 | 상태 | 근거 |
|---|---|---|
| 카카오 로그인 | 구현 완료 | `src/app/auth/kakao/start/route.ts`, `src/app/auth/callback/route.ts` |
| 이메일 로그인 | 미구현 | 카카오 단일 OAuth만 운영 |
| parent 역할 | 구현 완료 | `src/lib/auth.ts`, `src/types/family.ts` |
| student 역할 | 구현 완료 | 온보딩 분기 완료 |
| child 생성/연결 | 구현 완료 | `src/lib/db/family.ts`, migration 001 |
| subscription_plan 구조 | 구현 완료 | migration 006·018·019·043 등 — free/basic/family/family_plus/premium |
| caregiver_invite | 베타 비활성 | migration 023 (스키마 존재, 베타 비활성화) |
| RLS | 구현 완료 | migration 003 — families·children·parent·student 정책 |

**확인 필요:**
- caregiver_invite E2E (발급→전달→수락→권한 연결) 실제 완료 여부 → OZ 확인 필요

---

## 5. 직업 탐색 기능

### 5-1. `/explore` (직업 목록)
- **상태:** 구현 완료
- DB 우선 (`occupation_master` is_active=true 조회) + 정적 OCCUPATIONS fallback
- 카테고리 필터: 9개 (IT·기술/의료·과학/예술·디자인/콘텐츠·미디어/비즈니스·경영/교육·사회/환경·미래산업/공공·안전/항공·운송)
- 검색: 직업명 + description + skills 포함 검색. 공백 정규화 (`qNorm`) 비교 추가.
- 찜 기능 (localStorage)
- 관심 운동 CTA 배너 + 검색 키워드 연동 힌트

### 5-2. `/explore/[id]` (직업 상세)
- **상태:** 구현 완료
- DB 모드: occupation_master + occupation_summary + occupation_preparations + occupation_goyo24_profile + 세부 직업
- 정적 폴백: OCCUPATIONS 정적 데이터 (DB 미등록 직업)
- 퀴즈: QUIZ_DATA 정적 기반
- SportsInterestCareerSection: 관심 운동 연결 섹션 (DB 모드·정적 모드 양방 삽입)
- Goyo24InfoSection: 고용24 참고 지표 (정적 seed 기반)

### 5-3. 퀴즈
- **상태:** 구현 완료
- 근거: `src/data/quizData.ts` — 1차 23개 직업 69문항 + 스포츠 생태계 10개 30문항

### 5-4. 고용24 참고 지표
- **상태:** 구현 완료 (정적 seed 기반)
- `src/components/explore/Goyo24InfoSection.tsx`
- migration 022·051·054·056에서 seed. 실시간 고용24 API 미연동.
- source 정책: "참고 데이터" / "공개 참고 정보" 표시 (과장 없음)

---

## 6. 대표 직업 100개 확장 현황

| migration | 내용 | 상태 |
|---|---|---|
| 026~029 | Phase 1 직업 40개 + 인기 5개 seed | migration 존재 |
| 030·031 | Phase 1 기존 직업 11개 보강·활성화 | migration 존재 |
| 032·033 | interest_fields 수정 | migration 존재 |
| 035~041 | 철도·세부 직업·군인·계급 직업 추가 | migration 존재 |
| 044·045 | 군인(병) 대표·세부 직업 | migration 존재 |
| 050 | 로드맵 대상 직업 보완 | migration 존재 |
| 051 | 신규 16개 goyo24 profile seed | migration 존재 |
| 052 | 철도 직업 항공·운송 카테고리 이동 | migration 존재 |
| 053 | 1차 후보 23개 직업 seed | migration 존재 |
| 054 | 1차 후보 goyo24 profile seed | migration 존재 |
| 055 | 스포츠 생태계 10개 직업 seed | migration 존재 |
| 056 | 스포츠 생태계 10개 goyo24 profile seed | migration 존재 |

**현재 코드 기준 직업 수 추정:**
- `docs/sports-athlete-occupation-policy.md`: occupation_master 전체 114개, 대표 100개, 세부 14개 (migration 055·056 적용 후 기준)
- **OZ 확인 필요:** 운영 DB 실측값. 위 수치는 migration 기준 추정.

**quizData 현황:**
- `src/data/quizData.ts`: 1차 23개 직업 69문항 + 스포츠 생태계 10개 30문항 = 총 99문항 (코드 기준)

---

## 7. 관심 운동 기반 진로 확장

| 항목 | 상태 | 근거 | 메모 |
|---|---|---|---|
| 관심 운동 10개 데이터 | 구현 완료 | `src/data/sportsInterestData.ts` | 축구·야구·농구·배구·수영·태권도·줄넘기·골프·e스포츠·캠핑아웃도어 |
| jump-rope 포함 | 구현 완료 | `sportsInterestData.ts` — `slug: "jump-rope"` | 정상 포함 확인 |
| 육상선수 제외 | 구현 완료 | `sportsInterestData.ts`, `docs/sports-interest-career-expansion-design.md` | slug 없음 확인 |
| 관심 운동 선택 화면 | 구현 완료 | `src/app/explore/interests/sports/page.tsx` | Smoke Test PASS |
| SportsInterestSelector | 구현 완료 | `src/components/explore/SportsInterestSelector.tsx` | 10개 운동 선택·전환·연결 직업 표시 |
| SportsInterestCareerSection | 구현 완료 | `src/components/explore/SportsInterestCareerSection.tsx` | DB 모드·정적 모드 양방 삽입. Smoke Test PASS. |
| /explore CTA 배너 | 구현 완료 | `src/app/explore/page.tsx` | "좋아하는 운동으로 직업 찾기" 상단 배너 |
| 관심 운동 검색 CTA | 구현 완료 | `src/app/explore/page.tsx` | `SPORT_INTEREST_SEARCH_KEYWORDS` 31개 키워드 |
| 운동선수 직업군 정책 | 문서화 완료 | `docs/sports-athlete-occupation-policy.md` | A안 확정 — 현 단계 DB 즉시 추가 없음 |
| 대표 꿈 링크 미생성 | 구현 완료 | `sportsInterestData.ts` — `representativeDream` 텍스트만 | 클릭 가능 링크 없음 확인 |
| 금지 표현 소스 코드 내 부재 | 구현 완료 | `rg "선수가 못 되면\|실패하면\|대체 직업" src` → 0건 | 문서에만 "금지" 규칙 명시 |

---

## 8. 로드맵/주간 미션

| 항목 | 상태 | 근거 | 메모 |
|---|---|---|---|
| `roadmaps.ts` 정적 데이터 | 구현 완료 | `src/data/roadmaps.ts` | 68개 직업 키 등록 (3단계 구조) |
| Stage 1 DB화 | 구현 완료 | `src/app/roadmap/[occupationId]/page.tsx` | occupation_preparations + occupation_student_actions DB 우선 |
| Stage 2·3 | 부분 구현 | `src/app/roadmap/[occupationId]/page.tsx` | 정적 ROADMAPS 유지. DB화 미완료. |
| weekly_roadmap_missions | 구현 완료 | `src/app/api/roadmap/weekly-missions/route.ts`, migration 049 | AI 생성 + roadmaps.ts fallback |
| roadmap_progress | 구현 완료 | migration 001 | child_id 있을 때 DB 저장. localStorage fallback 병행. |
| ProgressCircle | 구현 완료 | `src/components/roadmap/ProgressCircle.tsx` | 진행률 시각화 |
| checked_missions JSONB | 구현 완료 | roadmap_progress 테이블 | `{ [missionId]: true }` 구조 |
| **P1 스포츠 5개 roadmaps.ts 직접 작성** | **미구현** | `src/data/roadmaps.ts` — 키 없음 확인 | sports-data-analyst·youth-sports-coach·sports-content-planner·exercise-prescription-specialist·sports-safety-manager 모두 미등록 |
| P2 스포츠 5개 fallback 유지 | 문서화 완료 | `docs/sports-ecosystem-weekly-roadmap-decision.md` | C안 확정. AI fallback 유지. |

**P1 직접 작성 미완료 목록:**
| 직업명 | slug | roadmaps.ts 등록 |
|---|---|:---:|
| 스포츠 데이터 분석가 | `sports-data-analyst` | ❌ |
| 유소년 스포츠 지도자 | `youth-sports-coach` | ❌ |
| 스포츠 콘텐츠 기획자 | `sports-content-planner` | ❌ |
| 운동처방사 | `exercise-prescription-specialist` | ❌ |
| 스포츠 안전관리자 | `sports-safety-manager` | ❌ |

---

## 9. 리포트 기능

| 항목 | 상태 | 근거 |
|---|---|---|
| 부모 주간 리포트 `/report` | 구현 완료 | `src/app/report/page.tsx` |
| 7일 활동 요약 | 구현 완료 | weekly_activity_completions 기반 |
| 지난주/이번주 비교 막대 그래프 | 구현 완료 | `report/page.tsx` 내 SVG 직접 구현 (차트 라이브러리 미사용) |
| roadmap_progress 완료 미션 반영 | 구현 완료 | DB 기반 렌더링 완료 (d84ea20) |
| weekly_roadmap_missions 반영 | 부분 구현 | 구조는 있으나 리포트 표시 범위 제한적 |
| WeeklySummary·TopOccupations·GrowthChart | 부분 구현 | UI 구조 존재. 실데이터 미연결. Phase 3 이후 예정. |
| AI 리포트·PDF 리포트 | 미구현 | Phase 3 이후 예정 |
| OpenAI 호출 | 없음 | `report/page.tsx` 내 OpenAI 호출 없음 확인 |

---

## 10. 명따라/AI 기능

| 항목 | 상태 | 근거 | 메모 |
|---|---|---|---|
| 명따라 페이지 (`/myeonddara`) | 구현 완료 | `src/app/myeonddara/page.tsx` | Phase 1(만세력 계산) 운영 중 |
| 결과 페이지 (`/myeonddara/result`) | 구현 완료 | `src/app/myeonddara/result/page.tsx` | OhaengChart·RecommendedCareers 포함 |
| Phase 1 (만세력 계산, API 미호출) | 구현 완료 | `src/lib/manseryeok.ts` (추정) | `PHASE2_ENABLED=false` 기본 상태 |
| Phase 2 (OpenAI 호출) | 부분 구현 | `src/app/api/myeonddara/route.ts`, `src/lib/featureFlags.ts` | `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 환경변수 미설정 → 현재 비활성 |
| 사용량 차감 | 유예 중 | `FEATURE_FLAGS.MYEONDDARA_PHASE2_DEDUCT_USAGE: false` | 베타 기간 차감 유예. Phase 2 활성화 전 `true`로 전환 필요. |
| free 1회 체험 | 구현 완료 | `migration/048_enable_free_myeonddara_one_time_trial.sql` | free 플랜 myeonddara_yearly_limit=0 → 1회 체험 정책 반영 |
| myeonddara_usage 구조 | 구현 완료 | `src/app/api/myeonddara/usage/route.ts`, migration 008·011 | 조회·차감 API 완성 |
| disclaimer 표시 | 구현 완료 | `src/app/myeonddara/page.tsx` (추정) | 오락/참고용 법적 고지 포함 (코드 확인 완료) |
| parentQuestions | 구현 완료 | `src/components/myeonddara/RecommendedCareers.tsx` (추정) | 결과에 부모 질문 포함 구조 |
| recommendedActivities | 구현 완료 | `src/data/myeonddara.ts` (추정) | 추천 활동 결과 포함 |
| interestAreas | 구현 완료 | `src/lib/myeonddara-rules.ts` | 관심 분야 결과 포함 |
| 금지 표현 방어 | 구현 완료 | `src/lib/ai/systemPrompt.ts`, `src/lib/myeonddara-rules.ts` | 시스템 프롬프트 내 표현 제어 |
| AI 진로 상담 (`/parent/counseling`) | 구현 완료 | `src/app/api/ai-consult/route.ts` | `AI_CONSULT_ENABLED: true` 활성. gpt-4o-mini. 월 제한 구조. |
| Rate Limiting | 구현 완료 | `src/lib/rateLimit.ts` | API 호출 rate limit 적용 |

---

## 11. 요금제/수익모델

| 항목 | 상태 | 근거 | 메모 |
|---|---|---|---|
| 요금제 UI 구조 | 구현 완료 | `src/app/pricing/page.tsx` | 베이직(9,900)·프리미엄(14,900)·패밀리(19,900)·패밀리 플러스(24,900) |
| Free (베타 체험) | 구현 완료 | `pricing/page.tsx` FreePlanBox | 베타 기간 무료 이용 안내. 실제 분기 없음. |
| Basic | 문서화 완료 | `pricing/page.tsx` + migration 006 | UI만 있음. 실결제·분기 미완료. |
| Family / Family Plus | 문서화 완료 | migration 019 | child_limit 구조 존재. 실결제 미완료. |
| Premium | 문서화 완료 | `pricing/page.tsx` | UI만 있음. 실결제 미완료. |
| child_limit | 구현 완료 | migration 019 (`child_limit int not null`) | DB 구조 존재. 실제 분기 처리 미완료. |
| myeonddara_yearly_limit | 구현 완료 | migration 047·048 | DB 구조 + free 차단 정책 작동 |
| Free 1회 체험 | 구현 완료 | migration 048 | myeonddara_yearly_limit=1 → free 1회 체험 반영 |
| 실결제 연동 | **미구현** | `docs/ROADMAP.md` §04 | PG사(토스페이먼츠) 미계약. CTA 클릭 시 안내 문구만 표시. |
| 플랜별 기능 분기 | **미구현** | `docs/ROADMAP.md` §04 | subscription_plan DB 구조만 있음. 실제 기능 차단 로직 미완료. |
| 구독 해지·환불 처리 | **미구현** | `docs/ROADMAP.md` §04 | 유료화 전 필수 항목. |

---

## 12. 공공데이터/사업계획서 관련 현황

| 항목 | 상태 | 근거 | 메모 |
|---|---|---|---|
| 고용24 참고 지표 (정적 seed) | 구현 완료 | `src/components/explore/Goyo24InfoSection.tsx`, migration 022·051·054·056 | 고용전망·임금·관련학과 참고 정보를 정적 seed로 수집·표시. "참고 데이터" 라벨. |
| 고용24 API 실시간 연동 | **미구현** | `docs/ROADMAP.md` §05 | API 인증키 발급 여부 미확인(OZ 확인 필요). 직접 연동 코드 없음. |
| 경기도 공공데이터 직접 연동 | **없음** | — | 직접 연동 없음. 향후 계획·설계만 존재. |
| 직업정보제공사업 신고 | 진행 중 | `docs/ROADMAP.md` §07 | 경기지방고용노동청 제출. 신고증 수령 여부 OZ 확인 필요. |
| 경진대회 기능 정리 문서 | **없음** | `docs/` 검색 | 사업계획서 목적 기능 요약 문서 없음. **신규 작성 필요** |
| 사업계획서 15P 구성안 | **없음** | `docs/` 검색 | 없음. **향후 작업 대상** |
| AI 활용 현황 문서화 | 부분 완료 | `docs/myeonddara-beta-design.md`, `docs/ROADMAP.md` | OpenAI gpt-4o-mini 활용 명시. 정리 문서 별도 없음. |

---

## 13. 현재 미구현/보류 기능

| 기능 | 상태 | 비고 |
|---|---|---|
| 이메일/비밀번호 로그인 | 미구현 | 카카오 OAuth 단일 운영 |
| caregiver_invite E2E | 베타 비활성 | migration 023. 스키마 존재. 베타 후 재활성화 필요. |
| roadmap Stage 2·3 DB화 | 미완료 | 정적 ROADMAPS 유지 중 |
| m1~m4 checked_missions 변환 | 미완료 | Stage 1 DB 전환 후 기록 호환성 문제 |
| P1 스포츠 5개 roadmaps.ts | 미구현 | C안 확정 후 실제 작성 필요 |
| 실결제 연동 (토스페이먼츠) | 미구현 | PG사 미계약 |
| 플랜별 기능 분기 처리 | 미구현 | subscription_plan DB만 있음 |
| 고용24 API 실시간 연동 | 미구현 | 인증키 발급 여부 미확인 |
| 경기도 공공데이터 연동 | 없음 | 향후 계획만 |
| 사업계획서 15P 초안 | 없음 | 신규 작성 필요 |
| 경진대회 기능 정리 문서 | 없음 | 신규 작성 필요 |
| WeeklySummary·GrowthChart 실데이터 | 미완료 | Phase 3 이후 |
| AI 리포트·PDF 리포트 | 미구현 | Phase 3 이후 |
| 명따라 Phase 2 활성화 | 부분 구현 | 환경변수 미설정 → API 미호출 상태 |
| slug 기준 라우팅 전환 | 미완료 | legacy_id 브리지 유지 중. 고용24 연동 전 완료 필수. |
| Android·iOS 크로스 플랫폼 테스트 | 미완료 | 정식 오픈 전 필수. |
| 미션 성공 피드백 모달 | 미완료 | 리텐션 장치 미완료 |
| 명따라 생년월일 암호화 저장 | 미완료 | 보안 필수 항목 |
| 운동선수 직업군 추가 | 보류 | A안 확정. 재검토 필요 시 별도 작업지시서. |

---

## 14. 로드맵 업데이트 후보

### 14-1. P1 스포츠 생태계 5개 roadmaps.ts 직접 작성

| 항목 | 내용 |
|---|---|
| **작업명** | `src/data/roadmaps.ts`에 P1 5개 직업 주간 미션 직접 작성 |
| **필요 이유** | 현재 스포츠 생태계 직업 로드맵 페이지 진입 시 AI fallback에 의존. 서비스 초기 빠른 품질 확보 필요. |
| **영향 범위** | `src/data/roadmaps.ts`만 수정. DB·인증·migration 변경 없음. |
| **위험도** | 낮음 — 정적 데이터 추가. 기존 기능 영향 없음. |
| **추천 우선순위** | **P1** |

### 14-2. 명따라 결과와 관심 운동 추천 연결

| 항목 | 내용 |
|---|---|
| **작업명** | 명따라 분석 결과에서 관심 운동 기반 직업 추천 연결 |
| **필요 이유** | 현재 명따라 결과와 sportsInterestData 연결 없음. 진로 맥락 연속성 강화. |
| **영향 범위** | `src/app/myeonddara/result/page.tsx`, `src/data/myeonddara.ts`, `src/data/sportsInterestData.ts` |
| **위험도** | 중간 — 명따라 Phase 2 활성화 여부와 연동 시 복잡도 증가. Phase 1 기준은 낮음. |
| **추천 우선순위** | **P2** |

### 14-3. 경기도 공공데이터 직접 연계 설계

| 항목 | 내용 |
|---|---|
| **작업명** | 경기도 공공데이터 포털 API 연계 설계 및 경진대회 대응 문서 작성 |
| **필요 이유** | 경기도 창업경진대회 대응. 현재 공공데이터 직접 연동 없음. 고용24 API 대비 설계 필요. |
| **영향 범위** | 신규 API 연동 설계 문서 + 추후 `src/app/api` 신규 라우트 가능성. 이번은 설계·문서화만. |
| **위험도** | 중간 — 공공 API 인증키 발급·정책 변경 리스크. 설계 단계는 낮음. |
| **추천 우선순위** | **P1** (경진대회 시기 대응 필요 시) |

### 14-4. 운동선수 직업군 추가 여부 재검토

| 항목 | 내용 |
|---|---|
| **작업명** | 축구선수·야구선수 등 운동선수 직업군 occupation_master 추가 여부 재검토 |
| **필요 이유** | 현재 A안(미추가) 확정. 사용자 피드백 수집 후 재결정 필요. |
| **영향 범위** | migration 신규 작성 + occupation_master insert + quizData 추가. |
| **위험도** | 낮음 — 신규 직업 추가는 기존 기능 영향 없음. |
| **추천 우선순위** | **P3** |

### 14-5. 관심 운동 데이터 DB 전환

| 항목 | 내용 |
|---|---|
| **작업명** | `sportsInterestData.ts` 정적 데이터 → Supabase 테이블 전환 |
| **필요 이유** | 현재 정적 파일 기반. DB 전환 시 운영 중 데이터 수정 가능. |
| **영향 범위** | 신규 테이블 설계 + migration + API 라우트 + 컴포넌트 조회 변경. |
| **위험도** | 중간 — 기존 정적 구조 의존 컴포넌트 다수 변경 필요. |
| **추천 우선순위** | **P3** |

### 14-6. B2B 학교/학원 제안용 기능 정리

| 항목 | 내용 |
|---|---|
| **작업명** | 학교·학원 B2B 라이선스 제안용 기능 목록 및 차별점 정리 문서 작성 |
| **필요 이유** | Phase 5 B2B 전환 준비 사전 문서화. 경진대회 심사에도 활용 가능. |
| **영향 범위** | 문서 작성만. 코드·DB 변경 없음. |
| **위험도** | 낮음 |
| **추천 우선순위** | **P2** |

### 14-7. 사업계획서 15P 초안 작성

| 항목 | 내용 |
|---|---|
| **작업명** | 경기도 창업경진대회 또는 투자 대응용 사업계획서 15P 초안 작성 |
| **필요 이유** | 현재 `docs/` 내 사업계획서 문서 없음. 경진대회 대응·투자 유치 준비에 필수. |
| **영향 범위** | 문서 작성만. 코드·DB 변경 없음. |
| **위험도** | 낮음 |
| **추천 우선순위** | **P1** (경진대회 일정 기준) |

---

## 15. 즉시 다음 작업 추천

| 우선순위 | 작업 | 이유 |
|---|---|---|
| 1 | P1 스포츠 5개 `roadmaps.ts` 직접 작성 | 코드 변경 범위 최소. 즉시 품질 개선 가능. |
| 2 | 사업계획서 15P 초안 작성 | 경진대회 대응. 현재 관련 문서 없음. |
| 3 | 경기도 공공데이터 연계 설계 문서 작성 | 경진대회 대응. 직접 연동은 없음으로 명확히 정리 필요. |
| 4 | 명따라 Phase 2 활성화 (환경변수 설정) | `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` + `MYEONDDARA_PHASE2_DEDUCT_USAGE=true` 동시 전환. smoke-test 필수. |
| 5 | 실결제 연동 (토스페이먼츠) | 유료화 전 반드시 필요. 현재 가장 큰 미완료 항목. |

---

*이 문서는 코드·migration·문서 기준 감사 결과입니다. Supabase 운영 DB 직접 조회 없이 작성되었습니다. 운영 DB 실측이 필요한 항목은 "OZ 확인 필요"로 표시했습니다.*  
*작성일: 2026-05-26 | 근거 기준일: commit `985ac30` 기준*
