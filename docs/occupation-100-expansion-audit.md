# 꿈따라 대표 직업 100개 확장 사전 감사 보고서

> 작성일: 2026-05-25  
> 기준: 코드 및 migration 파일 분석 (Production DB 직접 접근 불가)  
> 담당: Claude Code 자동 감사

---

## 1. 현재 직업 수 요약

| 항목 | 수량 | 기준 | 비고 |
|---|---:|---|---|
| occupation_master 전체 | **~80** | migration 015~051 누적 | DB 실측 필요 |
| 활성 직업 (is_active=true) | **~60+** | migration 기준 추정 | DB 실측 필요 — 026/028 일부 미활성 가능 |
| 대표 직업 (is_representative=true) | **68** | migration 037 기본값 + 명시 설정 | 아래 카테고리별 상세 참조 |
| 세부 직업 (is_representative=false) | **~12** | 039/040/041/045 명시 | 의사 자식 4개 + 경찰 자식 2개 + 철도 자식 2개 + 군인 자식 4개 |
| summary 연결 | **~68** | occupation_summary (service/one_liner) | migration에서 직접 삽입 |
| preparations 연결 | **~68** | occupation_preparations (mission_hint/step_action) | migration에서 직접 삽입 |
| goyo24 profile 연결 | **~36+** | occupation_goyo24_profile | 파일럿 10 + 026/028/029 일부 + 051 16개 |
| quizData 연결 | **69** | src/data/quizData.ts (legacy_id 기준) | 코드 직접 확인 |
| roadmaps 정적 데이터 | **51** | src/data/roadmaps.ts | DB 없는 직업도 포함 |
| weekly mission fallback 가능 | **전체 active** | weekly_roadmap_missions + OpenAI | slug 기준 생성 가능 |

> ⚠️ DB 실측 필요: `SELECT count(*), count(*) FILTER (WHERE is_active=true), count(*) FILTER (WHERE is_representative=true) FROM occupation_master;`

---

## 2. 카테고리별 현황

아래 수치는 migration 파일 기준 집계입니다. is_active 여부는 DB 실측 필요.

| 카테고리 | 전체 (추정) | 대표 직업 | 세부 직업 | 현재 판단 |
|---|---:|---:|---:|---|
| IT·기술 | 9 | 9 | 0 | 목표(15)까지 **6개 추가 필요** |
| 의료·과학 | 16 | 12 | 4 | 목표(14)까지 **2개 추가 필요** — 사육사 포함 여부 재검토 |
| 예술·디자인 | 12 | 12 | 0 | 목표(13)까지 **1개 추가 필요** |
| 콘텐츠·미디어 | 9 | 9 | 0 | 목표(12)까지 **3개 추가 필요** |
| 비즈니스·경영 | 7 | 7 | 0 | 목표(12)까지 **5개 추가 필요** |
| 교육·사회 | 7 | 7 | 0 | 목표(12)까지 **5개 추가 필요** |
| 환경·미래산업 | 4 | 4 | 0 | 목표(11)까지 **7개 추가 필요 — 가장 부족** |
| 공공·안전 | 16 | 8 | 8 | 목표(11)까지 **3개 추가 필요** |
| **합계** | **~80** | **68** | **~12** | **대표 100개까지 32개 추가 필요** |

### 카테고리별 현재 대표 직업 목록

**IT·기술 (9개)**
: software-engineer, data-analyst, ai-engineer, game-developer, cybersecurity-expert, cloud-engineer, vr-ar-developer, ai-service-planner, robotics-engineer

**의료·과학 (12개)**
: nurse, biotech-researcher, doctor, pharmacist, veterinarian, dentist, physical-therapist, emergency-medical-technician, clinical-laboratory-technologist, life-science-researcher, nutritionist, zookeeper

> ⚠️ zookeeper(사육사)는 `category='의료·과학'`으로 등록되어 있으나, 학부모 체감상 대표 직업으로 적합한지 재검토 필요.

**예술·디자인 (12개)**
: graphic-designer, architect, fashion-designer, webtoon-artist, product-designer, ux-ui-designer, illustrator, photographer, hair-designer, singer, spatial-designer, interior-designer

**콘텐츠·미디어 (9개)**
: video-content-editor, journalist, pd-director, novelist, translator, creator, animation-director, actor, podcast-producer

**비즈니스·경영 (7개)**
: marketer, ad-planner, accountant, entrepreneur, trade-specialist, banker, chef

**교육·사회 (7개)**
: teacher, counselor, elementary-teacher, social-worker, kindergarten-teacher, librarian, special-education-teacher

**환경·미래산업 (4개)**
: aerospace-engineer, renewable-energy-specialist, environmental-engineer, carbon-neutrality-specialist

> ⚠️ 환경·미래산업이 4개로 가장 부족. 목표 11개까지 7개 추가 필요. 1차 확장에서 우선 배정 권장.

**공공·안전 (대표 8개 + 세부 8개)**
- 대표: police-officer, firefighter, forensic-scientist, diplomat, coast-guard-officer, train-driver, military-soldier, airline-pilot
- 세부 (is_representative=false): railway-police-officer, cyber-investigator, train-controller, railway-maintenance-technician, army-soldier, navy-sailor, air-force-pilot, marine-soldier

---

## 3. 직업 1개 추가 표준 세트 확인

| 세트 | 현재 위치 | 필수 여부 | 누락 시 영향 | 확인 결과 |
|---|---|---|---|---|
| occupation_master | Supabase DB | 필수 | 탐색/검색/로드맵 진입 불가 | ✅ 스키마 확인 — slug, name_ko, category, interest_fields, is_active, is_representative, parent_occupation_id, legacy_occupation_id 필수 |
| occupation_summary | Supabase DB (service layer) | 필수 | 상세 설명 미표시 (DB 모드 불가) | ✅ one_liner, easy_description, why_this_job 3종 필수 |
| occupation_preparations | Supabase DB (service layer) | 필수 | 준비 힌트/Step 미션 미표시 | ✅ mission_hint 1개 + step_action 2개 최소 |
| quizData | src/data/quizData.ts | 대표 직업 필수 | 퀴즈 체험 불가 (null 반환) | ✅ key = legacy_occupation_id, 최소 3문항 |
| roadmaps (정적) 또는 weekly mission fallback | src/data/roadmaps.ts / OpenAI | 필수 | 로드맵 미표시 또는 AI 생성 실패 | ✅ roadmaps.ts 없으면 weekly_roadmap_missions로 대체 |
| occupation_goyo24_profile | Supabase DB | 권장 | "참고 지표 준비 중" fallback 표시 | ✅ source='manual' 허용 — "참고 데이터" 뱃지 표시 |
| legacy_occupation_id | occupation_master 컬럼 | URL 호환 시 필수 | /explore/{id}, /roadmap/{id} URL 깨짐 | ⚠️ 신규는 slug=legacy_id로 통일 권장, 기존 호환 경우만 별도 지정 |

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
| occupations.ts ↔ DB slug 불일치 | 🔴 높음 | `carbon-neutral-specialist` (ts) vs `carbon-neutrality-specialist` (DB), `renewable-energy-engineer` (ts) vs `renewable-energy-specialist` (DB), `vr-ar-developer` 카테고리 불일치 (ts: 환경, DB: IT) |
| legacy_occupation_id 없는 신규 직업 | 🟡 중간 | occupation_master에 legacy_occupation_id가 null이면 /explore/{id} 진입 불가. slug로 진입하는 흐름이 없으면 탐색 불가 |
| quizData key 불일치 가능성 | 🟡 중간 | quizData key = legacy_occupation_id. airline-pilot(DB slug) → pilot(legacy) → quizData['pilot'] 확인 필요 |
| is_active 상태 불확실 | 🟡 중간 | migration 026/028 일부 직업의 is_active=true 여부 불확실 — 026의 robot-engineer, dentist, ad-planner, firefighter 등 개별 activation migration 없음 |
| 로드맵 fallback 없는 직업 | 🟢 낮음 | weekly_roadmap_missions AI fallback 존재 — 신규 직업도 slug 기준 자동 생성 가능 |
| /explore 기본 목록 과밀화 | 🟡 중간 | 대표 직업 68개 → 100개로 확장 시 필터 없으면 카드 목록 길어짐. 카테고리 필터 or 페이지네이션 검토 필요 |
| occupation_goyo24_profile source='manual' 뱃지 | 🟢 낮음 | source='manual'이면 "참고 데이터" 뱃지 표시 (4182077 커밋으로 정상 처리) |
| occupations.ts에만 있는 순정적 직업 | 🟡 중간 | info-security-specialist, historian, ux-designer, bio-researcher, environmental-scientist 등은 DB 없이 정적 fallback만 작동 — DB 연동 안 됨, quizData/roadmaps만 존재 |

---

## 5. 감사 결론

- **현재 대표 직업 수:** 68개 (migration 기준, DB 실측 필요)
- **현재 세부 직업 수:** 약 12개 (is_representative=false 명시)
- **대표 직업 100개까지 추가 필요 수:** **32개**
- **우선 보강이 필요한 카테고리:** 환경·미래산업 (+7), 교육·사회 (+5), 비즈니스·경영 (+5)
- **1차 확장 전 반드시 보정해야 할 항목:**
  1. occupations.ts와 DB slug 불일치 4건 해소 (`carbon-neutral-specialist`, `renewable-energy-engineer`, `vr-ar-developer` 카테고리, `vr-ar-developer` 위치)
  2. is_active=true 여부 DB 실측 확인 (migration 026/028 일부 직업)
  3. airline-pilot legacy_occupation_id='pilot' → quizData['pilot'] 연결 확인
- **100개 확장 가능 여부 판단:** ✅ 가능 — 표준 세트(occupation_master + summary + preparations + quizData + goyo24_profile) 패턴이 확립되어 있으며, weekly_roadmap_missions AI fallback으로 로드맵 부재 위험 낮음

---

*이 문서는 Production DB 직접 접근 없이 migration 파일 분석 기준으로 작성되었습니다. 수치에 "~"가 붙은 항목은 DB 실측 후 보정 필요합니다.*
