# 꿈따라 대표 직업 100개 확장 사전 감사 보고서

> 작성일: 2026-05-25  
> 보정일: 2026-05-25 (Supabase 실측값 반영)  
> 기준: Supabase SQL Editor 실측값 + migration 파일 분석  
> 담당: Claude Code 자동 감사

---

## 1. 현재 직업 수 요약

| 항목 | 수량 | 기준 | 비고 |
|---|---:|---|---|
| occupation_master 전체 | **81** | Supabase 실측 | inactive_total=0 (전체 활성) |
| 활성 직업 (is_active=true) | **81** | Supabase 실측 | 비활성 직업 없음 |
| 대표 직업 (is_representative=true) | **67** | Supabase 실측 | 아래 카테고리별 상세 참조 |
| 세부 직업 (is_representative=false) | **14** | Supabase 실측 | 의사 자식 4개 + 경찰 자식 2개 + 철도 자식 2개 + 군인 자식 4개 + IT 1개 + 공공 1개 |
| summary 연결 | 추가 실측 필요 | occupation_summary (service/one_liner) | migration에서 직접 삽입 |
| preparations 연결 | 추가 실측 필요 | occupation_preparations (mission_hint/step_action) | migration에서 직접 삽입 |
| goyo24 profile 연결 | **~36+** | occupation_goyo24_profile | 파일럿 10 + 026/028/029 일부 + 051 16개 |
| quizData 연결 | **69** | src/data/quizData.ts (legacy_id 기준) | 코드 직접 확인 |
| roadmaps 정적 데이터 | **51** | src/data/roadmaps.ts | DB 없는 직업도 포함 |
| weekly mission fallback 가능 | **전체 active** | weekly_roadmap_missions + OpenAI | slug 기준 생성 가능 |

> ✅ Supabase 실측 완료 (2026-05-25): occupation_master 전체 81개, 활성 81개, 비활성 0개, 대표 67개, 세부 14개, legacy 매핑 81개 전체

---

## 2. 카테고리별 현황

아래 수치는 Supabase SQL Editor 실측값 기준입니다.

| 카테고리 | 전체 (실측) | 대표 직업 | 세부 직업 | 현재 판단 |
|---|---:|---:|---:|---|
| IT·기술 | 11 | 10 | 1 | 목표(14)까지 **4개 추가 필요** |
| 의료·과학 | 16 | 12 | 4 | 목표(14)까지 **2개 추가 필요** — 사육사 포함 여부 재검토 |
| 예술·디자인 | 14 | 14 | 0 | **목표(14) 이미 충족 — 1차 확장 제외** |
| 콘텐츠·미디어 | 7 | 7 | 0 | 목표(11)까지 **4개 추가 필요** |
| 비즈니스·경영 | 7 | 7 | 0 | 목표(11)까지 **4개 추가 필요** |
| 교육·사회 | 7 | 7 | 0 | 목표(11)까지 **4개 추가 필요** |
| 환경·미래산업 | 4 | 4 | 0 | 목표(11)까지 **7개 추가 필요 — 가장 부족** |
| 공공·안전 | 14 | 5 | 9 | 목표(10)까지 **5개 추가 필요** — 세부 직업 9개로 많지만 대표는 5개뿐 |
| 항공·운송 | 1 | 1 | 0 | 목표(4)까지 **3개 추가 필요** — 9번째 정식 카테고리 |
| **합계** | **81** | **67** | **14** | **대표 100개까지 33개 추가 필요** |

### 카테고리별 현재 대표 직업 목록

**IT·기술 (10개)**
: software-engineer, data-analyst, ai-engineer, game-developer, cybersecurity-expert, cloud-engineer, vr-ar-developer, ai-service-planner, robotics-engineer, ai-engineer (+ 세부 1개 미확인)

> ⚠️ IT·기술 세부 직업 1개 존재 — slug 확인 필요 (is_representative=false)

**의료·과학 (12개)**
: nurse, biotech-researcher, doctor, pharmacist, veterinarian, dentist, physical-therapist, emergency-medical-technician, clinical-laboratory-technologist, life-science-researcher, nutritionist, zookeeper

> ⚠️ zookeeper(사육사)는 `category='의료·과학'`으로 등록되어 있으나, 학부모 체감상 대표 직업으로 적합한지 재검토 필요.

**예술·디자인 (14개)**
: graphic-designer, architect, fashion-designer, webtoon-artist, product-designer, ux-ui-designer, illustrator, photographer, hair-designer, singer, spatial-designer, interior-designer + 2개

**콘텐츠·미디어 (7개)**
: video-content-editor, journalist, pd-director, novelist, translator, creator, animation-director, actor, podcast-producer → 실측 7개 (occupations.ts와 차이 — 추가 확인 필요)

**비즈니스·경영 (7개)**
: marketer, ad-planner, accountant, entrepreneur, trade-specialist, banker, chef

**교육·사회 (7개)**
: teacher, counselor, elementary-teacher, social-worker, kindergarten-teacher, librarian, special-education-teacher

**환경·미래산업 (4개)**
: aerospace-engineer, renewable-energy-specialist, environmental-engineer, carbon-neutrality-specialist

> ⚠️ 환경·미래산업이 4개로 가장 부족. 목표 11개까지 7개 추가 필요. 1차 확장에서 우선 배정 권장.

**공공·안전 (대표 5개 + 세부 9개)**
- 대표: police-officer, firefighter, forensic-scientist, diplomat, coast-guard-officer
- 세부: railway-police-officer, cyber-investigator, train-controller, railway-maintenance-technician, army-soldier, navy-sailor, air-force-pilot, marine-soldier + 1개

> ⚠️ migration 기준 대표 8개였으나 실측은 5개. train-driver / military-soldier / airline-pilot이 다른 카테고리로 이동한 것으로 보임. 추가 실측 확인 필요.

**항공·운송 (1개)**

| slug | legacy_occupation_id | name_ko | is_active | is_representative |
|---|---|---|---|---|
| airline-pilot | pilot | 항공기 조종사 | true | true |

> ✅ 실측 확인 완료. airline-pilot은 항공·운송 카테고리의 유일한 대표 직업으로, 9번째 정식 카테고리로 유지한다.

---

## 3. 직업 1개 추가 표준 세트 확인

| 세트 | 현재 위치 | 필수 여부 | 누락 시 영향 | 확인 결과 |
|---|---|---|---|---|
| occupation_master | Supabase DB | 필수 | 탐색/검색/로드맵 진입 불가 | ✅ slug, name_ko, category, interest_fields, is_active, is_representative, parent_occupation_id, legacy_occupation_id 필수 |
| occupation_summary | Supabase DB (service layer) | 필수 | 상세 설명 미표시 (DB 모드 불가) | ✅ one_liner, easy_description, why_this_job 3종 필수 |
| occupation_preparations | Supabase DB (service layer) | 필수 | 준비 힌트/Step 미션 미표시 | ✅ mission_hint 1개 + step_action 2개 최소 |
| quizData | src/data/quizData.ts | 대표 직업 필수 | 퀴즈 체험 불가 (null 반환) | ✅ key = legacy_occupation_id, 최소 3문항 |
| roadmaps (정적) 또는 weekly mission fallback | src/data/roadmaps.ts / OpenAI | 필수 | 로드맵 미표시 또는 AI 생성 실패 | ✅ roadmaps.ts 없으면 weekly_roadmap_missions로 대체 |
| occupation_goyo24_profile | Supabase DB | 권장 | "참고 지표 준비 중" fallback 표시 | ✅ source='manual' 허용 — "참고 데이터" 뱃지 표시 |
| legacy_occupation_id | occupation_master 컬럼 | URL 호환 시 필수 | /explore/{id}, /roadmap/{id} URL 깨짐 | ⚠️ 신규는 slug=legacy_id로 통일 권장, 기존 호환 경우만 별도 지정 (예: airline-pilot → pilot) |

### 연결 방식 상세

**explore 라우팅:**
```
/explore/[id]  →  params.id = legacy_occupation_id
            →  occupation_master WHERE legacy_occupation_id = id AND is_active = true
            →  occupation_summary (service layer, is_current=true, status='published')
            →  occupation_preparations (service layer, is_current=true, status='published')
            →  occupation_goyo24_profile (occupation_id FK)
            →  quizData[id]  (legacy_occupation_id 기준 정적 매칭)
```

**roadmap 라우팅:**
```
/roadmap/[occupationId]  →  occupationId = legacy_occupation_id
                      →  occupation_master WHERE legacy_occupation_id = occupationId
                      →  occupation_preparations (step_action, stage_number=1)
                      →  weekly_roadmap_missions (slug 기준 AI 생성)
                      →  roadmap_progress.checked_missions (occupation_id = legacy_occupation_id)
```

**주의:** roadmap_progress.occupation_id = legacy_occupation_id (text key, UUID 아님)

---

## 4. 현재 구조상 리스크

| 리스크 항목 | 수준 | 상세 |
|---|---|---|
| 항공·운송 카테고리 체계 불일치 | 🔴 높음 | 기존 8개 카테고리 체계 설계와 달리 DB에 `항공·운송` 9번째 카테고리 존재. `/explore` UI 필터, 카테고리 정렬, 카테고리별 통계에서 `항공·운송`이 누락되지 않는지 확인 필요 |
| occupations.ts ↔ DB slug 불일치 | 🔴 높음 | `carbon-neutral-specialist` (ts) vs `carbon-neutrality-specialist` (DB), `renewable-energy-engineer` (ts) vs `renewable-energy-specialist` (DB) — quizData·roadmaps는 DB slug 기준으로 이미 보정되어 있음 |
| vr-ar-developer 카테고리 불일치 | 🟡 중간 | DB: `IT·기술`, occupations.ts: `환경·미래산업` — /explore 카테고리 필터 결과가 달라질 수 있음 |
| legacy_occupation_id 없는 신규 직업 | 🟡 중간 | occupation_master에 legacy_occupation_id가 null이면 /explore/{id} 진입 불가. 신규 직업은 slug=legacy_id 동일 설정 권장 |
| quizData key 불일치 가능성 | 🟡 중간 | quizData key = legacy_occupation_id. airline-pilot(DB slug) → pilot(legacy) → quizData['pilot'] 확인 필요 |
| 공공·안전 대표 직업 수 감소 | 🟡 중간 | migration 기준 대표 8개였으나 실측 5개. train-driver(철도기관사), military-soldier(군인), airline-pilot(항공기 조종사)이 category 분리된 것으로 추정. 실측 재확인 필요 |
| /explore 기본 목록 과밀화 | 🟡 중간 | 대표 직업 67개 → 100개로 확장 시 필터 없으면 카드 목록 길어짐. 카테고리 필터 or 페이지네이션 검토 필요 |
| 로드맵 fallback 없는 직업 | 🟢 낮음 | weekly_roadmap_missions AI fallback 존재 — 신규 직업도 slug 기준 자동 생성 가능 |
| occupation_goyo24_profile source='manual' 뱃지 | 🟢 낮음 | source='manual'이면 "참고 데이터" 뱃지 표시 (정상 처리) |

---

## 5. 사전 보정 이슈 조사 결과

아래 4건은 migration 파일 및 src/data 코드 기준으로 확인한 결과다.  
실제 보정은 별도 작업 지시 후 진행한다.

| 항목 | DB 상태 | occupations.ts | quizData | roadmaps.ts | 수정 필요 여부 | 제안 방향 |
|---|---|---|---|---|---|---|
| carbon-neutrality-specialist | slug='carbon-neutrality-specialist', is_active=true, 환경·미래산업 | id='carbon-neutral-specialist' **(불일치)** | occupationId='carbon-neutrality-specialist' ✅ | key='carbon-neutrality-specialist' ✅ | ✅ occupations.ts만 보정 필요 | occupations.ts id를 `carbon-neutrality-specialist`로 수정 |
| renewable-energy-specialist | slug='renewable-energy-specialist', is_active=true, 환경·미래산업 | id='renewable-energy-engineer' **(불일치)** | occupationId='renewable-energy-specialist' ✅ | key='renewable-energy-specialist' ✅ | ✅ occupations.ts만 보정 필요 | occupations.ts id를 `renewable-energy-specialist`로 수정 |
| vr-ar-developer | slug='vr-ar-developer', category='IT·기술', is_active=true | category='환경·미래산업' **(불일치)** | occupationId='vr-ar-developer' ✅ | key='vr-ar-developer' ✅ | ✅ occupations.ts만 보정 필요 | occupations.ts category를 `IT·기술`로 수정 |
| 026/028 is_active | **inactive_total=0 (실측)** — 전체 81개 활성 | - | - | - | ✅ 현재 비활성 직업 없음 확인 | migration 026/028의 ACTIVATE 섹션은 주석처리되어 있으나 SQL Editor에서 별도 실행된 것으로 추정. 재실행 불필요 |

### 세부 확인 내용

**carbon-neutrality-specialist:**
- migration 028에서 `slug='carbon-neutrality-specialist'`로 삽입됨
- quizData.ts의 occupationId, roadmaps.ts의 key 모두 DB slug 기준으로 이미 보정됨
- occupations.ts만 `id='carbon-neutral-specialist'`로 남아 있어 불일치 발생
- 영향: occupations.ts 기반 정적 fallback에서 잘못된 id 참조 가능

**renewable-energy-specialist:**
- migration 028에서 `slug='renewable-energy-specialist'`로 삽입됨
- quizData.ts, roadmaps.ts 모두 DB slug 기준으로 이미 보정됨
- occupations.ts만 `id='renewable-energy-engineer'`로 남아 있어 불일치 발생

**vr-ar-developer:**
- migration 028에서 `category='IT·기술'`로 삽입됨
- occupations.ts에서 `category='환경·미래산업'`로 설정됨
- 영향: /explore 카테고리 필터 시 서로 다른 카테고리에 표시될 수 있음

**026/028 is_active:**
- migration 026 ACTIVATE 섹션은 `/* ... */`로 주석처리 (실행 기록 없음)
- migration 028 ACTIVATE 섹션도 동일하게 주석처리
- migration 030/031에서 일부 직업(11개)을 is_active=true로 전환
- migration 050에서 12개 신규 직업을 is_active=true로 직접 삽입
- DB 실측 inactive_total=0 → 나머지 직업들은 Supabase SQL Editor에서 별도 활성화된 것으로 추정
- **결론: 현재 비활성 직업 없음. 추가 조치 불필요.**

---

## 6. 감사 결론

- **현재 대표 직업 수:** 67개 (Supabase 실측)
- **현재 세부 직업 수:** 14개 (Supabase 실측)
- **전체 직업 수:** 81개 (전체 활성, is_active=false 없음)
- **카테고리 체계:** 9개 (IT·기술, 의료·과학, 예술·디자인, 콘텐츠·미디어, 비즈니스·경영, 교육·사회, 환경·미래산업, 공공·안전, 항공·운송)
- **대표 직업 100개까지 추가 필요 수:** **33개**
- **우선 보강이 필요한 카테고리:** 환경·미래산업 (+7), 공공·안전 (+5), 콘텐츠·미디어/비즈니스·경영/교육·사회 (+4씩), 항공·운송 (+3)
- **예술·디자인 1차 확장 제외:** 이미 14개로 목표치 충족
- **1차 확장 전 반드시 보정해야 할 항목:**
  1. occupations.ts의 id 불일치 2건 보정 (`carbon-neutral-specialist` → `carbon-neutrality-specialist`, `renewable-energy-engineer` → `renewable-energy-specialist`)
  2. occupations.ts의 vr-ar-developer category 불일치 보정 (`환경·미래산업` → `IT·기술`)
  3. 항공·운송 카테고리가 `/explore` UI 필터에 정상 노출되는지 확인
  4. 공공·안전 대표 직업 5개 실측 이유 확인 (train-driver, military-soldier 카테고리 분리 여부)
- **100개 확장 가능 여부 판단:** ✅ 가능 — 표준 세트(occupation_master + summary + preparations + quizData + goyo24_profile) 패턴이 확립되어 있으며, weekly_roadmap_missions AI fallback으로 로드맵 부재 위험 낮음

---

*이 문서는 Supabase SQL Editor 실측값(2026-05-25)과 migration 파일 분석 기준으로 작성되었습니다. summary/preparations/goyo24_profile 연결 수는 추가 실측이 필요합니다.*
