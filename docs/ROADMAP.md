# 꿈따라 종합 로드맵

> 작성 기준일: 2026년 5월 17일 (v3.2)
> 현재 상태: 제한 베타 공개 운영 중 (꿈따라.kr) — 지인 베타 피드백 5건 수집 완료
> 목표 정식 출시: 2026년 7~8월
> 작성자: OZ.K Lab 대표 OZ.Kim

---

## 목차

00. 베타 UX 피드백 대응 (v3.2 신규)
01. 현재 상태 진단 (v3.2)
02. 베타 공개 완료 항목
03. 정식 오픈 전 확인 항목
04. 유료화 전 필수 항목
05. 외부 데이터 연동 항목
06. 보안 검토 현황
07. 법무·특허·정책 현황
08. 결제 시스템 구축 계획
09. 서비스 품질 검증 항목
10. Go-Live 최종 체크리스트 (17개)
11. 전체 로드맵 (Phase 0~5)
12. 월별 출시 일정표
13. 입시 확장 서비스 로드맵
14. 출시 후 운영 계획 (KPI)
15. 리스크 관리 계획

---

## 00 베타 UX 피드백 대응 (v3.2 신규 — 2026.05.17)

> 지인 베타 테스트 5명 피드백 수집 완료. 기능 확장이 아닌 UX 혼란 제거가 현재 최우선 과제.

### 핵심 피드백 요약

| # | 피드백 | 분류 | 우선순위 |
|---|---|---|---|
| 1 | 직업 탐색 후 나오는 3문제 퀴즈 — 누가 풀어야 하는지 불명확, 완료 후 다음 단계 모름 | UX 혼란 | P1 |
| 2 | "돈 내라고 해서 사용 안 할 듯" — 결제 유도가 너무 이른 단계에서 노출 | 이탈 리스크 | P0 |
| 3 | 태권도 선수·사육사·아이돌 가수·헤어디자이너 등 아이들이 친숙하게 느끼는 직업군 추가 요청 | 콘텐츠 확장 | P4 |

### P0 — 즉시 수정 (결제 노출 조기 이탈 방지)

> 영향 파일: `pricing/page.tsx`, `guide/page.tsx`, `faq/page.tsx`
> DB/RLS/인증 변경 없음. 문구·CTA 수정만.
> **✅ 완료 — 커밋 `5d8ec85` (2026.05.17)**

| 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|
| `/pricing` 카드 순서 | 유료 4개 → 무료 체험 (맨 아래) | **무료 체험 박스를 맨 위로** 이동 | ✅ 완료 |
| `/pricing` 유료 CTA 버튼 | "내 아이 진로 지도 만들기" (클릭 시 alert) | "정식 오픈 시 신청하기" | ✅ 완료 |
| `/pricing` alert 문구 | "정식 결제 기능은 준비 중입니다\n지금은…" | "현재 베타 기간에는 무료로 주요 기능을 먼저 체험할 수 있어요" | ✅ 완료 |
| `/guide` step 1 | "14일 무료 체험이 자동으로 시작됩니다" | "현재 베타 기간에는 무료로 이용할 수 있어요" | ✅ 완료 |
| `/guide` step 9 | 실가격 직접 노출 (9,900원~24,900원) | 베타 무료 안내로 교체, 가격 제거 | ✅ 완료 |
| `/guide` 하단 CTA | "14일 무료 체험으로 꿈따라를 경험해 보세요!" | "베타 기간 무료로 꿈따라를 먼저 경험해 보세요!" | ✅ 완료 |
| `/faq` "결제 후 이용 가능?" | "결제 완료 즉시 모든 유료 기능 이용 가능" (현실 불일치) | "현재는 베타 기간으로 정식 결제 기능은 준비 중입니다" | ✅ 완료 |
| `/faq` "무료 이용?" | "최초 가입 시 14일 무료 체험" (정책 불일치) | "현재 베타 기간 동안은 무료로 먼저 경험해볼 수 있어요" | ✅ 완료 |

### P1 — 베타 중 수정 (퀴즈 혼란 제거)

> 영향 파일: `OccupationQuiz.tsx`, `MissionSuccessModal.tsx`
> DB/RLS/인증 변경 없음. 문구 추가만.
> **✅ 완료 — 커밋 `50e2a8a` (2026.05.17)**

| 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|
| 퀴즈 진입 전 맥락 표시 | 없음 | "👧 아이와 함께 풀어보세요 — 3가지 질문입니다" 안내 박스 추가 | ✅ 완료 |
| 퀴즈 결과 카드 하단 | "다시 도전하기" 버튼만 존재 | "아래의 '로드맵 만들기' 버튼을 눌러 다음 단계를 확인해보세요" 보조 문구 추가 | ✅ 완료 |
| MissionSuccessModal compass sub | "네 꿈이 한 칸 더 가까워졌어." | "퀴즈를 마쳤어요. 아래의 '로드맵 만들기' 버튼으로 다음 단계를 확인해보세요." | ✅ 완료 |

### P2 — 베타 중 수정 (student/home 오늘의 미션 DB 정합성)

> 영향 파일: `src/app/student/home/page.tsx`
> DB migration 없음. 코드 조회 로직 수정만.
> **✅ 완료 — 커밋 `630c7c4`, `bda7142` (2026.05.18)**

| 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|
| 오늘의 미션 소스 | 정적 ROADMAPS(m1~m4) 고정 | occupation_student_actions DB 우선 + static fallback | ✅ 완료 |
| prep 미션 누락 | occupation_preparations step_action 미조회 | occupation_preparations + occupation_student_actions 병렬 조회 | ✅ 완료 |
| checked_missions 정합성 | /roadmap(prep-/action-) ≠ student/home(m1~m4) 불일치 | 동일 key 체계 정합성 확보 | ✅ 완료 |
| static fallback | 없음 | DB miss / is_active=false 직업 → static ROADMAPS 유지 | ✅ 완료 |

**미완료 — 별도 작업 예정:**
- 기존 m1~m4 checked_missions 기록 변환 migration (정식 오픈 전)
- Phase 2 직업 20개 occupation_student_actions seed (029+ migration)
- roadmap Stage 2·3 occupation_student_actions DB화 (추후)

### P3 — 베타 중 수정 (/report localStorage → DB 전환)

> 영향 파일: `src/app/report/page.tsx`
> DB migration 없음. 기존 테이블만 사용.
> **✅ 완료 — 커밋 `d84ea20` (2026.05.18)**

| 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|
| userType 판단 | `kkumddara_onboarding` localStorage | `student` 테이블 row 존재 여부 | ✅ 완료 |
| 선택 직업 | `kkumddara_chosen_roadmap` localStorage | `roadmap_progress` (chosen DESC) | ✅ 완료 |
| 완료 미션 | `kkumddara_roadmap_{id}` localStorage 배열 | `roadmap_progress.checked_missions` JSONB | ✅ 완료 |
| 미션 목록 | `getRoadmap()` static data | `occupation_preparations` + `occupation_student_actions` 병렬 조회 | ✅ 완료 |
| 직업명 | static roadmap.occupationName | `occupation_master.name_ko` | ✅ 완료 |

**미완료 — 별도 작업 예정:**
- activity_logs 테이블 (연속 학습일·주간 탐색 수 정확 계산, Phase 3 이후)
- weekly_reports 스냅샷 (AI 리포트·PDF 리포트, Phase 3 이후)
- WeeklySummary / TopOccupations / GrowthChart 실데이터 연결 (추후)

### P4 — 베타 중 수정 (인기 직업 1차 5개 추가 + student/home 렌더링 게이트 수정)

> 지인 피드백 #3: 아이들이 친숙하게 느끼는 직업군 추가 요청 (사육사·아이돌 가수·헤어디자이너 등)
> 영향 파일: `supabase/migrations/029_seed_popular_5_occupations.sql`, `src/app/student/home/page.tsx`
> DB migration 1개 추가. 코드 조회 로직 최소 수정만.
> **✅ 완료 — 커밋 `10ce232` (seed), `09242cb` (렌더링 수정) (2026.05.18)**

#### 인기 직업 1차 5개 seed (10ce232)

| 직업 | slug | category | is_active | 비고 |
|---|---|---|---|---|
| 셰프 | `chef` | 비즈니스·경영 | ✅ | |
| 사육사 | `zookeeper` | 의료·과학 | ✅ | |
| 헤어디자이너 | `hair-designer` | 예술·디자인 | ✅ | 미용사 → 헤어디자이너로 직업명 정리 |
| 가수 | `singer` | 예술·디자인 | ✅ | 아이돌 → 가수로 중립 표기 |
| 크리에이터 | `creator` | 콘텐츠·미디어 | ✅ | 유튜버 → 크리에이터로 중립 표기 |

포함 데이터: occupation_master(5) + occupation_summary(15) + occupation_preparations(15) + occupation_student_actions(20)

검수 완료:
- /explore 5개 직업 카드 노출 ✅
- 직업 상세 페이지 진입 ✅
- roadmap Stage 1 미션 표시 ✅
- 미션 체크 ✅
- /report 완료율 반영 ✅
- /student/home 오늘의 미션 반영 ✅ (P4 렌더링 수정 후)
- 시크릿 크롬 최종 검수 ✅

#### student/home 렌더링 게이트 수정 (09242cb)

| 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|
| 렌더링 게이트 조건 | `!chosenRoadmap` (getRoadmap() null이면 빈 상태) | `!chosenRoadmapId` (ID 있으면 미션 영역 렌더) | ✅ 완료 |
| 직업명·이모지 | 정적 ROADMAPS 전용 | `chosenRoadmap?.xxx ?? dbChosenOcc?.xxx` DB fallback | ✅ 완료 |
| 진행률 분모 | 정적 missions 총수 / 없으면 0 | 정적 없을 때 `dbMissions?.length` fallback | ✅ 완료 |
| 파일럿 10개 직업 | — | chosenRoadmap ≠ null → 기존 동작 유지 | ✅ 영향 없음 |

**미완료 — 별도 작업 예정:**
- 베타 인기 직업 2차 5개 추가 (운동선수·스포츠 트레이너·e스포츠 선수·항공기 조종사·플로리스트)
- Phase 2 직업 20개 occupation_student_actions seed

### P5 — 베타 중 수정 (Phase 1 기존 직업 1차 5개 보강 활성화)

> Phase 1 seed(026)에 is_active=false로 삽입된 직업 중 아이 친숙도·학부모 납득도가 높은 5개를 선별.
> 영향 파일: `supabase/migrations/030_seed_phase1_selected_5_actions_and_activate.sql`
> occupation_master UPDATE + occupation_student_actions 보강. 코드 변경 없음.
> **✅ 완료 — 커밋 `1a81da3` (2026.05.19)**

| 직업 | slug | category | is_active | student_actions | 비고 |
|---|---|---|---|---|---|
| 수의사 | `veterinarian` | 의료·과학 | ✅ | 4개 | 지인 피드백 요청 직업군 |
| 웹툰 작가 | `webtoon-artist` | 예술·디자인 | ✅ | 4개 | |
| 게임 개발자 | `game-developer` | IT·기술 | ✅ | 4개 | |
| 패션 디자이너 | `fashion-designer` | 예술·디자인 | ✅ | 4개 | |
| 의사 | `doctor` | 의료·과학 | ✅ | 4개 | |

처리 내용:
- occupation_master 5행: `is_active = false → true`
- occupation_student_actions: 4개 × 5직업 = 20행 추가 (stage_number=1, DELETE 후 INSERT)
- occupation_summary / occupation_preparations: 기존 데이터 유지

검수 완료:
- /explore 5개 직업 카드 노출 ✅
- 직업 상세 페이지 진입 ✅
- /roadmap Stage 1 미션 표시 (prep 2 + action 4) ✅
- 미션 체크 ✅
- /student/home 오늘의 미션 반영 ✅
- /report 완료율 반영 ✅

**현재 베타 직업 확장 완료 현황:**
| 구분 | 직업 수 | 직업 |
|---|---:|---|
| 파일럿 | 10개 | 소프트웨어 개발자·데이터 분석가·시각디자이너·영상콘텐츠 제작자·간호사·바이오 연구원·교사·심리상담사·경찰관·마케터 |
| 베타 인기 1차 (029) | 5개 | 셰프·사육사·헤어디자이너·가수·크리에이터 |
| Phase 1 보강 1차 (030) | 5개 | 수의사·웹툰 작가·게임 개발자·패션 디자이너·의사 |
| Phase 1 보강 2차 (031) | 6개 | AI 엔지니어·사이버보안 전문가·약사·건축가·초등학교 교사·사회복지사 |
| **합계** | **26개** | |

**미완료 — 별도 작업 예정:**
- Phase 1 interest_fields 수정 후 활성화: 소방관·기자·방송 PD·과학수사관·우주항공 엔지니어
- Phase 1 활성화 보류: 로봇 엔지니어·치과의사·광고기획자·회계사
- 베타 인기 직업 2차 5개 추가 (운동선수·스포츠 트레이너·e스포츠 선수·항공기 조종사·플로리스트)
- Phase 2 직업 20개 occupation_student_actions seed

### P6 — 베타 중 수정 (Phase 1 추가 6개 직업 보강 활성화)

> Phase 1 seed(026)에 is_active=false로 삽입된 직업 중 interest_fields 정합 및 ROADMAPS 정합이 확인된 추가 6개 선별.
> 영향 파일: `supabase/migrations/031_seed_phase1_additional_6_actions_and_activate.sql`
> occupation_master UPDATE + occupation_student_actions 보강. 코드 변경 없음.
> **✅ 완료 — 커밋 `2d65d81` (2026.05.19)**

| 직업 | slug | category | is_active | student_actions | 비고 |
|---|---|---|---|---|---|
| AI 엔지니어 | `ai-engineer` | IT·기술 | ✅ | 4개 | interest_fields [it] 정합 확인 |
| 사이버보안 전문가 | `cybersecurity-expert` | IT·기술 | ✅ | 4개 | interest_fields [it] 정합 확인 |
| 약사 | `pharmacist` | 의료·과학 | ✅ | 4개 | interest_fields [medical] 정합 확인 |
| 건축가 | `architect` | 예술·디자인 | ✅ | 4개 | interest_fields [art] 정합 확인 |
| 초등학교 교사 | `elementary-teacher` | 교육·사회 | ✅ | 4개 | interest_fields [education] 정합 확인 |
| 사회복지사 | `social-worker` | 교육·사회 | ✅ | 4개 | interest_fields [education] 정합 확인 |

처리 내용:
- occupation_master 6행: `is_active = false → true`
- occupation_student_actions: 4개 × 6직업 = 24행 추가 (stage_number=1, DELETE 후 INSERT)
- occupation_summary / occupation_preparations: 기존 데이터 유지

검수 완료:
- /explore 6개 직업 카드 노출 ✅
- 직업 상세 페이지 진입 ✅
- /roadmap Stage 1 미션 표시 ✅
- 미션 체크 ✅
- /student/home 오늘의 미션 반영 ✅
- /report 완료율 반영 ✅

**미완료 — 별도 작업 예정:**
- Phase 1 interest_fields 수정 후 활성화: 소방관·기자·방송 PD·과학수사관·우주항공 엔지니어
- Phase 1 활성화 보류: 로봇 엔지니어·치과의사·광고기획자·회계사
- 베타 인기 직업 2차 5개 추가 (운동선수·스포츠 트레이너·e스포츠 선수·항공기 조종사·플로리스트)
- Phase 2 직업 20개 occupation_student_actions seed
- roadmap Stage 2·3 DB화
- 기존 m1~m4 checked_missions 변환 migration

---

## 01 현재 상태 진단 (v3.2 — 2026.05.17 기준)

> 꿈따라는 MVP 단계를 졸업하여 제한 베타 공개 운영 중입니다.
> 직업 탐색 핵심 흐름(랜딩 → explore → 직업상세 → 로드맵)이 운영 기준으로 통과되었습니다.
> 지인 5명 베타 피드백 수집 완료. UX 혼란 제거 및 결제 노출 조정이 현재 최우선 대응 과제.

### 완료된 항목 (✅)

| 항목 | 상세 | 상태 |
|---|---|---|
| 도메인 연결 | 꿈따라.kr · Vercel SSL 완료 | ✅ |
| MVP 배포 | Next.js 14 · Supabase · Vercel | ✅ |
| 카카오 로그인 | OAuth 연동 · role 유지 라우팅 정상 | ✅ |
| 온보딩 흐름 | 학부모/학생 역할 분리 · 학년·관심분야 | ✅ |
| RLS 보안 | families·children·parent·student 정책 완료 | ✅ |
| Publishable Key 회전 | Supabase API Key 교체 · Vercel 재배포 | ✅ |
| 브랜드 로고 | 파비콘·OG이미지·워드마크 전 규격 | ✅ |
| 법무 문서 | 개인정보처리방침·청소년보호정책·이용약관 | ✅ |
| 상표 등록 | 꿈따라 워드마크 + 가로로고 등록 완료 | ✅ |
| occupation DB 구조 | occupation_master·summary·traits·preparations 등 생성 | ✅ |
| 파일럿 10개 직업 seed | 소프트웨어 개발자·데이터 분석가·시각디자이너 등 10개 | ✅ |
| explore DB 전환 | occupation_master 기반 is_active=true 직업 노출 | ✅ |
| explore 상세 DB 전환 | DB 우선 + static fallback 구조 | ✅ |
| roadmap Stage 1 DB 전환 | DB 미션 기반 · effectiveStatuses · unlock 로직 | ✅ |
| 미션 unlock 버그 수정 | toast와 카드 unlock 데이터 소스 일치 처리 (f2c8599) | ✅ |
| demo→auth 전환 UX | role 파라미터 유지 · GuestLoginPrompt 문구 개선 | ✅ |
| 미들웨어 보호 | /parent/* /student/* /demo/* 경로 보호 정상화 | ✅ |
| 명따라 MVP | 만세력 계산 엔진 + Claude API 연동 · 캐시 구조 설계 | ✅ |
| CS 문서 전체 | 약관·환불·FAQ·이용가이드·문의 페이지 | ✅ |
| 운영사 표기 정리 | OZ.K Lab 공식 표기 통일 완료 | ✅ |
| 카카오채널 정리 | 채널명 꿈따라_자녀 진로 탐색 · URL _xfkxfjX 통일 | ✅ |
| 홈 타이틀 개선 | "아직 꿈이 없어도 괜찮아요" · 모바일 줄바꿈 개선 | ✅ |
| 베타 UX P0 — 결제 문구 완화 | pricing FreePlanBox 상단 배치 · 유료 CTA 문구 · FAQ/가이드 결제 가능 오해 문구 전면 제거 (5d8ec85) | ✅ |
| 베타 UX P1 — 퀴즈 혼란 제거 | OccupationQuiz 대상 안내 박스 추가 · 결과 카드 다음 행동 안내 · MissionSuccessModal compass 문구 수정 (50e2a8a) | ✅ |
| 베타 UX P2 — student/home 오늘의 미션 DB 정합성 개선 | /roadmap와 동일한 prep-{uuid}+action-{uuid} 구성 · occupation_preparations+occupation_student_actions 병렬 조회 · static fallback 유지 (630c7c4, bda7142) | ✅ |
| 베타 UX P3 — /report localStorage → DB 전환 | student 테이블 기반 userType · roadmap_progress 기반 선택 직업·완료 미션 · occupation_master.name_ko 직업명 · MissionStatus DB 기반 렌더링 (d84ea20) | ✅ |
| 베타 인기 직업 1차 5개 추가 | 셰프·사육사·헤어디자이너·가수·크리에이터 · occupation_master+summary+preparations+student_actions seed · is_active=true · /explore·/roadmap·/report·/student/home 연동 검수 완료 (10ce232) | ✅ |
| student/home 렌더링 게이트 수정 | 신규 DB-only 직업도 오늘의 미션 정상 렌더 · getRoadmap() 정적 데이터 의존 제거 · DB occupation fallback + dbMissions.length fallback (09242cb) | ✅ |
| Phase 1 기존 직업 1차 5개 보강 활성화 | 수의사·웹툰 작가·게임 개발자·패션 디자이너·의사 · is_active=true 전환 · occupation_student_actions 직업당 4개 보강 · /explore~report 전 화면 검수 완료 (1a81da3) | ✅ |
| Phase 1 추가 6개 직업 보강 활성화 | AI 엔지니어·사이버보안 전문가·약사·건축가·초등학교 교사·사회복지사 · is_active=true 전환 · occupation_student_actions 직업당 4개 보강 · /explore~report 전 화면 검수 완료 (2d65d81) | ✅ |
| 직업정보제공사업 신고 준비 | 신고서·사업계획서 작성 완료 · 경기지방고용노동청 제출 진행 중 | 🔄 진행 중 |

---

## 02 베타 공개 완료 항목

> 현재 제한 베타 기준으로 정상 운영 중인 항목입니다.

- 랜딩 페이지 (꿈따라.kr)
- 학부모/학생 시작 흐름 (온보딩 → 역할 분기)
- 관심사 기반 직업 탐색 (explore, 파일럿 10개 + 베타 확장 16개 = 총 26개 직업)
- 직업 상세 + 로드맵 Stage 1 확인
- 미션 unlock 구조 (CURRENT → NEXT → FUTURE, 75% 기준)
- 명따라 MVP (베타 disclaimer 유지)
- 피드백 폼 운영
- 카카오채널 (_xfkxfjX) 운영 (평일 19:00~22:00)
- 운영사·브랜드·법무 문서 전체
- **베타 UX P0** — 요금제/결제 부담 문구 완화, 베타 무료 이용 안내 강화 (5d8ec85)
- **베타 UX P1** — 직업 퀴즈 대상 안내 추가, 완료 후 다음 행동 유도 문구 추가 (50e2a8a)
- **베타 UX P2** — student/home 오늘의 미션 DB 전환 + prep/action 정합성 수정 (630c7c4, bda7142)
- **베타 UX P3** — /report localStorage 완전 제거 · roadmap_progress + occupation_master 기반 MissionStatus DB 렌더링 (d84ea20)
- **베타 인기 직업 1차 5개** — 셰프·사육사·헤어디자이너·가수·크리에이터 · is_active=true · /explore~student/home 전 화면 검수 완료 (10ce232)
- **student/home 렌더링 게이트 수정** — 신규 DB-only 직업 오늘의 미션 정상 렌더 · DB occupation fallback 추가 (09242cb)
- **Phase 1 기존 직업 1차 5개 보강 활성화** — 수의사·웹툰 작가·게임 개발자·패션 디자이너·의사 · is_active=true + student_actions 직업당 4개 · /explore~report 전 화면 검수 완료 (1a81da3)
- **Phase 1 추가 6개 직업 보강 활성화** — AI 엔지니어·사이버보안 전문가·약사·건축가·초등학교 교사·사회복지사 · is_active=true + student_actions 직업당 4개 · /explore~report 전 화면 검수 완료 (2d65d81)

---

## 03 정식 오픈 전 확인 항목

> 유료 오픈 전에 완료 여부를 코드 기준으로 재확인해야 하는 항목입니다.

| 항목 | 현재 상태 | 비고 |
|---|---|---|
| /student/home DB 연결 | ⚠️ 부분 완료 | 오늘의 미션 DB 전환 완료 (630c7c4, bda7142). 잔여: m1~m4 checked_missions 변환 migration · Phase 2 직업 20개 seed · Stage 2·3 DB화 |
| /report DB 연결 | ✅ 완료 (d84ea20) | MissionStatus DB 기반 렌더링 완료. 잔여: WeeklySummary·TopOccupations·GrowthChart 실데이터 연결 (Phase 3 이후) |
| /parent/home DB 연결 | ⚠️ 미확인 | 직업/질문 DB 연결 범위 확인 필요 |
| roadmap Stage 2·3 DB화 | ⚠️ 미완료 | Stage 1만 확인됨. Stage 2·3은 static 유지 중 |
| 보호자 초대 코드 E2E | ⚠️ 미확인 | caregiver_invite 스키마 존재 추정. 발급→전달→수락→권한 연결 E2E 완료 여부 미확인 |
| slug 기준 라우팅 전환 | ⚠️ 미완료 | legacy_id 브리지 유지 중. 고용24 연동 전 완료 필수 |
| helper 함수 복구 | ⚠️ 미완료 | fn_deactivate / fn_publish_content_version — plain insert 운영 중 |
| 미션 성공 피드백 모달 | ⚠️ 미완료 | 굿잡/잘했어요 애니메이션 리텐션 장치 |
| 모든 에러 페이지 처리 | ⚠️ 미완료 | 404·500 처리 완성 필요 |
| 세션 만료 처리 | ⚠️ 미완료 | 로그인 세션 자동 갱신·만료 처리 |
| 입력값 서버 검증 | ⚠️ 미완료 | grade·interests 등 허용값 검증 로직 |

---

## 04 유료화 전 필수 항목

> 유료 구독 오픈 직전에 반드시 완료해야 하는 항목입니다.

| 항목 | 상태 | 우선순위 |
|---|---|---|
| PG사(토스페이먼츠) 계약 체결 | ❌ 미완료 | 🔴 긴급 |
| 결제 API 샌드박스 연동 | ❌ 미완료 | 🔴 긴급 |
| 정기 구독 자동 결제 로직 | ❌ 미완료 | 🔴 긴급 |
| 구독 해지 기능 | ❌ 미완료 | 🔴 긴급 |
| 환불 처리 로직 (UI + 백엔드) | ❌ 미완료 | 🔴 긴급 |
| 플랜별 기능 분기 처리 | ❌ 미완료 | 🟠 필수 |
| 요금제 플랜 DB 반영 | ❌ 미완료 | 🟠 필수 |
| AI 상담 횟수 제한 연동 | ❌ 미완료 | 🟠 필수 |
| 쿠폰·무료체험·할인코드 설계 | ❌ 미완료 | 🟡 중요 |
| 구독 취소 후 권한 처리 | ❌ 미완료 | 🟠 필수 |
| 전자상거래법 고지 의무 이행 | ❌ 미완료 | 🟠 필수 |
| Supabase Pro 전환 | ❌ 미완료 | 🔴 외부 베타 모집 직전 당일 완료 필수 |

> ⚠️ Supabase Pro 전환은 외부 베타 사용자 모집 또는 테스트 링크 배포 직전 당일에 완료해야 합니다. Free 플랜 비활성화 리스크(경험: 2026.05.06) 반복 방지.

### 확정 요금제 구조

| 플랜 | 월 금액 | 아이 | 보호자 | AI 상담 | 명따라 | 로드맵 |
|---|---|---|---|---|---|---|
| 무료 | 0원 | 1명 | 1명 | 월 1회 | 없음 | 미리보기 1개 |
| 베이직 | 9,900원 | 1명 | 2명 | 월 5회 | 연 3회 | 전체 |
| 패밀리 | 14,900원 | 2명 | 2명 | 월 10회 | 아이당 연 3회 | 전체 |
| 프리미엄 | 19,900원 | 3명 | 2명 | 월 15회 | 아이당 연 3회 | 전체 |

※ 명따라 외부 단건 판매: 9,900원/회 (카카오채널 꿈따라_자녀 진로 탐색) · 꿈따라 스탠다드 이상: 5,000원

---

## 05 외부 데이터 연동 항목

| 항목 | 상태 | 비고 |
|---|---|---|
| 고용24 API 인증키 발급 | ⚠️ 미확인 | 신청 및 서류 준비 완료. 발급 완료 여부 미확정. 미완료로 분류 |
| 고용24 API 호출 테스트 | ❌ 미완료 | 인증키 발급 후 즉시 진행 |
| slug 기반 직업 라우팅 전환 | ❌ 미완료 | 고용24 연동 전 완료 필수 |
| 직업 DB 100개 구축 | ❌ 미완료 | 현재 파일럿 10개 운영 중 |
| 관리자 draft/publish 워크플로우 | ❌ 미완료 | 직업 콘텐츠 편집 UI |

---

## 06 보안 검토 현황

### 완료 (✅)

| 항목 | 내용 |
|---|---|
| RLS 전체 재활성화 | families·children·parent·student 정책 설정 |
| occupation DB RLS | is_active=true 공개 조회 · service layer 서버 중심 |
| 비로그인 DB 접근 차단 | user null 시 Supabase 쿼리 실행 금지 |
| Anon Key 회전 | Publishable Key 교체 완료 |
| 카카오 OAuth | redirectTo role 반영 · 운영 도메인 콜백 정상화 |
| 미들웨어 경로 보호 | /parent/* /student/* /demo/* 분리 완료 |
| 미들웨어 디버그 로그 제거 | 트레이스 로그 삭제 완료 |

### 필수 잔여 항목

| 항목 | 우선순위 |
|---|---|
| Rate Limiting (Supabase API 호출) | 🟠 |
| DB 자동 백업 주기 확인 | 🟡 |
| 세션 만료 자동 갱신 처리 | 🟠 |
| 입력값 서버 검증 (grade·interests 등) | 🟠 |
| 명따라 생년월일 암호화 저장 | 🟠 |
| 쿠키 정책 동의 배너 | 🟡 |

---

## 07 법무·특허·정책 현황

| 항목 | 상태 |
|---|---|
| 꿈따라 상표 등록 (워드마크) | ✅ 완료 |
| 꿈따라 상표 등록 (가로로고) | ✅ 완료 |
| 이용약관·개인정보처리방침·청소년보호정책 | ✅ 완료 |
| 환불 정책 | ✅ 완료 |
| 직업정보제공사업 신고 | 🔄 진행 중 (경기지방고용노동청) |
| 명따라 법적 성격 고지 (오락/참고용) | 🟠 필수 |
| 전자상거래법 준수 고지 | 🟠 결제 전 완료 필수 |
| 오즈케이랩 상표 출원 | 🟡 검토 |
| 오픈소스 라이선스 검토 | 🟡 중요 |

---

## 08 결제 시스템 구축 계획

> 토스페이먼츠를 1순위로 추천. 개발 문서 우수 · 구독 결제 지원 · 스타트업 친화적 (수수료 2.2%~)

### 구현 순서

1. 토스페이먼츠 사업자 계약
2. 샌드박스 연동 + 단건 결제 테스트
3. 정기 구독(빌링) 결제 로직 구현
4. 플랜별 기능 분기 처리 (DB role/plan 필드 기반)
5. 구독 해지 + 환불 처리 로직
6. 웹훅 처리 완성
7. 실결제 소액 테스트
8. 쿠폰·무료체험·할인코드 설계 (정식 오픈 직전)

---

## 09 서비스 품질 검증 항목

| 테스트 항목 | 검증 기준 | 상태 |
|---|---|---|
| 신규 가입 (카카오→온보딩→홈) | 3초 이내 완료 | 🔘 확인 필요 |
| demo→explore→직업상세→로드맵 | 각 화면 정상 전환 | ✅ |
| 파일럿 10개 직업 노출 | is_active=true 직업만 노출 | ✅ |
| Stage 1 unlock (75% 기준) | 3/4 완료 → NEXT 해제 | ✅ |
| 로드맵 달성률 새로고침 후 복원 | 상태 복원 정상 | ✅ |
| 명따라 생년월일→만세력→분석 결과 | 정상 포맷 표시 | ✅ |
| Android Chrome 전체 흐름 | 결제·입력폼 포함 | ❌ 진행 필요 |
| iOS Safari 전체 흐름 | 카카오 로그인 포함 | ❌ 진행 필요 |
| PC Chrome | 전체 흐름 | 🔘 진행 필요 |

---

## 10 Go-Live 최종 체크리스트

> 이하 항목이 모두 충족되어야 정식 유료 출시를 진행할 수 있습니다.

| No | 체크 항목 | 상태 |
|---|---|---|
| 1 | 카카오 로그인 실제 연동 완료 | ☑ 완료 |
| 2 | Supabase RLS 전체 테이블 재활성화 | ☑ 완료 |
| 3 | 상표 등록 완료 (꿈따라 + 가로로고) | ☑ 완료 |
| 4 | 직업정보제공사업 신고증 수령 | ☐ 진행 중 |
| 5 | 고용24 API 인증키 발급 및 연동 완료 | ☐ 미확인 → 미완료 분류 |
| 6 | PG사 계약 및 결제 테스트 완료 | ☐ 미완료 |
| 7 | 정기 구독 자동 결제 정상 작동 | ☐ 미완료 |
| 8 | 플랜별 기능 분기 처리 완료 | ☐ 미완료 |
| 9 | AI 상담 횟수 제한 정상 작동 | ☐ 미완료 |
| 10 | 보호자 초대 코드 기능 E2E 완료 | ☐ 미확인 → 미완료 분류 |
| 11 | 구독 해지 기능 정상 작동 | ☐ 미완료 |
| 12 | 환불 정책 UI 및 처리 로직 완성 | ☐ 미완료 |
| 13 | /student/home · /parent/home DB 연결 완료 | ☐ 부분 완료 (student/home 오늘의 미션 완료 · 잔여: Phase 2 seed · Stage 2·3 · /parent/home) |
| 14 | Android·iOS 핵심 흐름 테스트 완료 | ☐ 미완료 |
| 15 | 모든 에러 페이지 처리 완료 (404·500) | ☐ 미완료 |
| 16 | 입시 정보 면책 문구 삽입 | ☐ 미완료 |
| 17 | Supabase Pro 전환 (외부 베타 모집 직전) | ☐ 미완료 |

---

## 11 전체 로드맵 (Phase 0~5)

| Phase | 시기 | 주요 목표 |
|---|---|---|
| Phase 0 MVP 완성 ✅ | ~2026.04 | 꿈따라.kr 배포 · 카카오 로그인 · RLS 보안 완료 · 파일럿 10개 직업 · occupation DB 구조화 · 상표 등록 · 법무 문서 정비 |
| Phase 1 베타 완성 🔨 | 2026.04~06 | /student·parent home DB 연결 · 고용24 API 연동 · slug 라우팅 전환 · Stage 2·3 DB화 · 미션 피드백 모달 · PG 결제 연동 · 보호자 초대 코드 · AI 상담 베타 · 크로스 플랫폼 테스트 |
| Phase 2 정식 런칭 🚀 | 2026.07~08 | 유료 구독 공식 오픈 · 외부 베타 사용자 모집 · 마케팅 시작 · 초기 구독자 확보 |
| Phase 3 프리미엄 확장 | 2026.09~12 | 명따라 정식 출시 · AI 상담 고도화 · 부모 리포트 · 뱃지 시스템 · 푸시 알림 · PDF 리포트 |
| Phase 4 입시 서비스 | 2027 상반기 | 고등학생 입시 설계 · 진로→학과→전형 연결 · 과목 선택 가이드 · 입시 멘토 베타 |
| Phase 5 B2B·앱 전환 | 2027 하반기~ | 법인 전환 · 학교·학원 B2B 라이선스 · iOS/Android 앱 · 투자 유치 검토 · 구독자 15,000명 목표 |

---

## 12 월별 출시 일정표

### 2026년 4월 — 완료 ✅

| 주차 | 작업 내용 | 상태 |
|---|---|---|
| 1주차 (4/1~4/7) | Supabase RLS 전체 재활성화 · Publishable Key 회전 · 이메일 보안 강화 | ✅ |
| 2주차 (4/8~4/14) | 카카오 로그인 완료 · occupation DB + 파일럿 10개 seed · explore/roadmap DB 전환 | ✅ |
| 3주차 (4/15~4/21) | 상표 등록 완료 · 직업정보제공사업 신고 서류 제출 · 고용24 API 기업회원 가입 | ✅/🔄 |
| 4주차 (4/22~4/30) | 운영사 표기 정리 · 카카오채널 정리 · 홈 타이틀 개선 · ROADMAP.md 신규 생성 | ✅ |

### 2026년 5월 — 결제 시스템 구축 (진행 중 🔨)

| 주차 | 작업 내용 | 상태 |
|---|---|---|
| 1주차 (5/1~5/7) | PG사 계약 체결 · 고용24 API 연동 · roadmap Stage 2·3 DB화 | 🔘 확인 필요 |
| 2주차 (5/8~5/14) | 결제 API 샌드박스 연동 · 정기 구독 결제 로직 · AI 상담 횟수 제한 | 🔘 확인 필요 |
| 3주차 (5/15~5/21) | 베타 UX P0/P1 개선 완료 (결제 문구 완화 · 퀴즈 대상 안내) · **P2 student/home 오늘의 미션 DB 정합성 완료** (630c7c4, bda7142) · **P3 /report localStorage → DB 전환 완료** (d84ea20) · **P4 베타 인기 직업 1차 5개 추가 + student/home 렌더링 게이트 수정 완료** (10ce232, 09242cb) · **P5 Phase 1 기존 직업 1차 5개 보강 활성화 완료** (1a81da3) · **P6 Phase 1 추가 6개 직업 보강 활성화 완료** (2d65d81) · 플랜별 기능 분기 · 구독 해지·환불 로직 · 보호자 초대 코드 | 🔨 진행 중 |
| 4주차 (5/22~5/31) | 실결제 테스트 (소액) · 웹훅 처리 완성 · 미션 성공 피드백 모달 | 예정 |

### 2026년 6월 — 품질 완성 및 출시 준비

| 주차 | 작업 내용 |
|---|---|
| 1주차 (6/1~6/7) | 명따라 연동 완성 · 전체 보안 최종 점검 · Lighthouse 성능 측정 |
| 2주차 (6/8~6/14) | 베타 테스트 (지인 10명) · 피드백 수집 · 긴급 버그 수정 · Go-Live 체크리스트 최종 |
| 3주차 (6/15~6/21) | 마케팅 자료 준비 (카드뉴스·영상) · PWA 설정 · 소셜 채널 준비 |
| 4주차 (6/22~6/30) | Go-Live 최종 검토 · 출시 공지 준비 · 소프트 런칭 (비공개 베타) |

### 2026년 7월~12월

| 시기 | 작업 내용 | 목표 |
|---|---|---|
| 7월 🚀 | 유료 구독 공식 오픈 · SNS·맘카페 출시 공지 · 초기 할인 이벤트 | 첫 유료 구독자 확보 |
| 8월 | 실사용자 피드백 반영 · 마케팅 본격화 · 미션 콘텐츠 추가 | 구독자 성장 |
| 9월 | 명따라 정식 출시 (프리미엄) · 분석 UI 고도화 | 프리미엄 전환율 상승 |
| 10월 | AI 상담 고도화 · 공동 양육자 초대 완성 | 프리미엄 플랜 확대 |
| 11월 | PDF 리포트 · 부모 리포트 고도화 · 푸시 알림 | 이탈 방지 |
| 12월 | 2026 성과 분석 · 2027 로드맵 수립 · 입시 설계 개발 착수 | 연간 KPI 달성 |

---

## 13 입시 확장 서비스 로드맵

> 핵심 원칙: 합격 보장형이 아닌 '진로 기반 준비 설계형'
> 면책 문구 필수: "해당 내용은 일반적인 가이드이며, 실제 입시 일정과 전형은 각 대학 및 한국대학교육협의회 공식 발표를 반드시 확인하세요."

| 단계 | 시기 | 기능 | 우선순위 |
|---|---|---|---|
| 사전 준비 | 2026.05~ | 온보딩 고등학생 분기 · relatedMajors 필드 구성 | 🟠 |
| 입시 MVP | 2027 상반기 | 진로→관련 학과 연결 · 학과→전형 유형 안내 · 과목 선택 가이드 | 🔵 |
| 입시 v2 | 2027 하반기 | 학생부 활동 방향 제안 · 입시 일정 캘린더·알림 | 🔵 |
| 입시 프리미엄 | 2027 하반기~ | 입시 전문 멘토 연결 · 개인화 입시 설계 상담 | 🔵 |

---

## 14 출시 후 운영 계획 (KPI)

| 지표 | 출시 1개월 | 출시 3개월 | 출시 6개월 |
|---|---|---|---|
| 유료 구독자 | 목표 10명 | 목표 50명 | 목표 200명 |
| 월 매출 (MRR) | ~100만원 | ~500만원 | ~2,000만원 |
| 구독 유지율 | 기준 수립 | 70% 이상 | 80% 이상 |
| 월 방문자 | 500명 | 2,000명 | 8,000명 |
| 게스트→구독 전환율 | 5% | 8% | 12% |

### 초기 사용자 획득 전략

| 채널 | 전략 | 예상 효과 |
|---|---|---|
| 게스트 체험 모드 | 로그인 없이 체험 → 저장 시 로그인 유도 | ★★★★★ |
| 학부모 카페·밴드 | 맘카페·초등맘 커뮤니티 바이럴 콘텐츠 | ★★★★ |
| 대표 SNS 채널 | 유튜브·블로그·숏폼 꿈따라 스토리 | ★★★★ |
| 초기 할인 이벤트 | 출시 기념 1개월 무료 or 50% 할인 | ★★★★ |
| 감성 마케팅 | 어린이날·어버이날·수능 등 이벤트 | ★★★★ |

---

## 15 리스크 관리 계획

| 등급 | 리스크 | 대응 방안 |
|---|---|---|
| 🔴 | 결제 오류·이중 청구 | 샌드박스 철저 테스트 + 롤백 계획 수립 |
| 🔴 | 카카오 로그인 정책 변경 | 정기 정책 확인 + 이메일 로그인 백업 유지 |
| 🔴 | 고용24 API 정책 변경·중단 | 공공데이터포털 백업 채널 확보 + 핵심 직업 DB 자체 저장 |
| 🔴 | slug 전환 후 라우팅 오류 | 고용24 연동 전 파일럿 10개 단계에서 전환 완료 |
| 🔴 | Supabase Free 플랜 비활성화 | 외부 베타 모집 직전 당일 Pro 전환 필수 (2026.05.06 장애 경험) |
| 🟠 | AI API 비용 폭증 | 플랜별 횟수 제한 + 명따라 캐싱 + Haiku/Sonnet 모델 분리 |
| 🟠 | 입시 정보 표현 리스크 | 내부 가이드라인 수립 + 면책 문구 필수 삽입 |
| 🟠 | Vercel 서버 장애 | Vercel Status 모니터링 + 장애 공지 자동화 |
| 🟡 | 초기 구독자 미달 | 게스트 체험 강화 + 무료 체험 기간 연장 |
| 🟡 | 구독 해지율 높음 | 미션 콘텐츠 빠른 보강 + 피드백 즉시 반영 |
| 🔵 | 경쟁 서비스 출시 | 브랜드 차별화 + 상표 등록 선점 완료 |

---

> 꿈따라 · 꿈을 찾고, 길을 만든다
> 꿈따라.kr | OZ.K Lab 대표 OZ.Kim | contact@ozklab.com
> 운영시간: 평일 19:00~22:00
