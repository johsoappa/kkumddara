# 꿈따라 대표 직업 100개 확장 설계안

> 작성일: 2026-05-25  
> 보정일: 2026-05-25 (Supabase 실측값 반영 — 9개 카테고리 체계 확정, migration 052 철도 직업 보정 반영, migration 053·054 초안 작성 완료); 2026-05-26 (quizData 23개 직업 69문항 작성 완료, 2차 스포츠 진로 생태계 후보 10개 선정안 작성 완료, 055·056 migration 초안 작성 완료, quizData 2차 10개 직업 30문항 작성 완료, 관심 운동 기반 진로 확장 구조 설계 문서 작성 완료)  
> 기준: occupation-100-expansion-audit.md 감사 결과 반영  
> 상태: 055 migration 초안 완료(대표 직업 100개 달성), 056 migration 초안 완료(미래 참고 지표 연결) — OZ 순서대로 적용 대기

---

## 1. 확장 목표

- 대표 직업 100개(`is_representative=true`)를 기준으로 직업 탐색, 로드맵, 퀴즈, 미래 참고 지표, 명따라 추천 연결성을 강화한다.
- 이번 설계의 기준은 **"대표 직업 100개"**이다.
- 세부 직업은 검색 보강 및 하위 전문화 목적으로 별도 관리한다.
- 대표 100개 카운트에는 `is_representative=true`인 직업만 포함한다.
- 1차 확장(~90개) → 운영 안정성 확보 → 2차 확장(100개) 고품질 순서로 진행한다.

---

## 2. 현재 직업 현황 요약

> Supabase SQL Editor 실측값 기준 (2026-05-26, 053·054 적용 후)

- **현재 occupation_master 전체:** 104개
- **현재 활성 직업 (is_active=true):** 104개 (비활성 0개)
- **현재 대표 직업 (is_representative=true):** 90개
- **현재 세부 직업 (is_representative=false):** 14개
- **카테고리 체계:** 9개 (기존 8개 + 항공·운송)
- **현재 카테고리별 대표 직업 분포:**

| 카테고리 | 현재 대표 직업 수 |
|---|---:|
| IT·기술 | 12 |
| 의료·과학 | 13 |
| 예술·디자인 | 14 |
| 콘텐츠·미디어 | 10 |
| 비즈니스·경영 | 10 |
| 교육·사회 | 10 |
| 환경·미래산업 | 9 |
| 공공·안전 | 8 |
| 항공·운송 | 4 |
| **합계** | **90** |

- **대표 직업 100개까지 추가 필요 수:** **10개**

---

## 3. 목표 카테고리 구성

| 카테고리 | 현재 대표 직업 수 | 목표 대표 직업 수 | 추가 필요 수 |
|---|---:|---:|---:|
| IT·기술 | 10 | 14 | **+4** |
| 의료·과학 | 12 | 14 | **+2** |
| 예술·디자인 | 14 | 14 | **0 — 목표 충족** |
| 콘텐츠·미디어 | 7 | 11 | **+4** |
| 비즈니스·경영 | 7 | 11 | **+4** |
| 교육·사회 | 7 | 11 | **+4** |
| 환경·미래산업 | 4 | 11 | **+7 — 최우선** |
| 공공·안전 | 4 | 10 | **+6** |
| 항공·운송 | 2 | 4 | **+2** |
| **합계** | **67** | **100** | **+33** |

### 카테고리 구성 판단 근거

- **예술·디자인:** 이미 14개로 목표치 충족. **1차 확장 대상에서 제외.**
- **환경·미래산업:** 현재 4개로 가장 부족. **1차 확장 최우선 배정.**
- **공공·안전:** migration 052 적용 후 대표 직업 4개(train-driver → 항공·운송 이동). 세부 직업 8개. 대표 직업 보강이 필요. (+6)
- **항공·운송:** migration 052 적용 후 대표 직업 2개(airline-pilot + train-driver). 정식 카테고리로 유지하고 4개까지 확장. (+2)
- **콘텐츠·미디어 / 비즈니스·경영 / 교육·사회:** 각각 4개씩 균형 보강.
- **IT·기술:** 10개로 비교적 안정적. 14개까지 4개 추가.
- **의료·과학:** 12개로 충분한 편. 14개까지 2개 추가.

---

## 4. 대표 직업 vs 세부 직업 구분 기준

### 대표 직업 선정 기준

1. 초등·중등 학생과 학부모가 바로 이해할 수 있는 직업명
2. 독립적인 직업 카드로 노출해도 어색하지 않은 직업
3. 자체 로드맵, 퀴즈, 준비 활동을 만들 가치가 있는 직업
4. 카테고리 대표성이 있는 직업
5. 명따라 또는 AI 상담 결과와 연결했을 때 자연스러운 직업
6. 검색 수요가 높을 가능성이 있는 직업

### 세부 직업 선정 기준

1. 대표 직업의 하위 전문 분야
2. 기본 `/explore` 목록에 노출하면 목록이 복잡해지는 직업
3. 검색 결과에는 노출되어야 하는 직업
4. 상위 직업의 로드맵을 공유해도 큰 문제가 없는 직업
5. 추후 프리미엄 상세 로드맵으로 확장 가능한 직업

### 표기 기준

| 기준 | 대표 직업 | 세부 직업 |
|---|---|---|
| 기본 `/explore` 목록 | 노출 | 미노출 |
| 검색 결과 | 노출 | 노출 |
| `is_active` | true | true |
| `is_representative` | true | false |
| `occupation_level` | 1 | 2 |
| `parent_occupation_id` | null 가능 | 상위 직업 연결 권장 |
| 카드 표시 | 일반 직업 카드 | 상위 직업명 표시 권장 |
| 로드맵 | 자체 로드맵 권장 | 상위 직업 fallback 가능 |
| 퀴즈 | 최소 3문항 필수 | 선택 또는 상위 직업 공유 |
| 대표 100개 카운트 포함 | 포함 | **미포함** |

---

## 5. 항공·운송 카테고리 확장 방향

### 현재 상태

Supabase 실측 결과 `항공·운송` 카테고리가 9번째 정식 카테고리로 존재한다.  
migration 052 적용 후 대표 직업 2개, 세부 직업 1개 체계로 전환된다.

| slug | legacy_occupation_id | name_ko | is_active | is_representative | 비고 |
|---|---|---|---|---|---|
| airline-pilot | pilot | 항공기 조종사 | true | true | 기존 |
| train-driver | train-driver | 철도 기관사 | true | true | migration 052 이동 |
| train-controller | train-controller | 열차 관제사 | true | false | migration 052 이동 (세부) |

### 정식 카테고리 유지 판단 근거

1. `airline-pilot`은 `legacy_occupation_id=pilot`로 정상 매핑되어 `/explore/pilot`, `/roadmap/pilot` 정상 작동
2. `항공기 조종사`는 독립 대표 직업으로 유지할 가치가 있음
3. 향후 `항공정비사`, `물류관리사`, `선박항해사` 등 확장 가능성이 있음
4. `공공·안전`에 편입하면 카테고리 의미가 혼재됨

### 100개 확장 목표 (항공·운송 4개)

후보 예시:

| 우선순위 | 직업명 | slug 제안 | 확장 단계 | 선정 이유 |
|---:|---|---|---|---|
| 1 | 항공기 조종사 | airline-pilot | **기존** | 이미 존재 |
| 2 | 철도 기관사 | train-driver | **기존 (052)** | migration 052로 이동 |
| 3 | 항공정비사 | aircraft-maintenance-technician | 1차 | 조종사와 쌍 구성, 직업 이미지 명확 |
| 4 | 물류관리사 | logistics-manager | 2차 | 물류·운송 분야, 공개지표 풍부 |

선정 기준:
- 초등·중등 학생이 직업 이미지를 쉽게 떠올릴 수 있어야 한다.
- 진로 로드맵과 체험 활동을 구성하기 쉬워야 한다.
- 공공·안전과 혼동되지 않는 운송·이동·물류 성격을 가져야 한다.
- 기존 `airline-pilot`과 중복되지 않아야 한다.

---

## 6. 대표 직업 후보군 (32개 초안 → 33개로 보정)

이번 설계에서 전체 33개 후보를 확정하지 않는다. 아래 표준 컬럼으로 추후 후보군을 작성한다.

### 후보군 표준 컬럼

| 우선순위 | 카테고리 | 직업명 | slug 제안 | 대표/세부 | 확장 단계 | 선정 이유 | 공개지표 가능성 | 비고 |
|---:|---|---|---|---|---|---|---|---|
| 1 | 환경·미래산업 | 기후변화 전문가 | climate-change-specialist | 대표 | 1차 | 카테고리 최우선 보강, 학부모 관심 높음 | 중간 | 탄소중립전문가와 차별화 필요 |
| 2 | 환경·미래산업 | 스마트팜 전문가 | smart-farm-specialist | 대표 | 1차 | occupations.ts에 이미 존재 (static), DB 추가 필요 | 중간 | 농촌진흥청 통계 활용 가능 |
| 3 | 환경·미래산업 | 해양환경 연구원 | marine-environmental-researcher | 대표 | 1차 | 기후 위기 대응 직업군, 고용24 가능 | 중간 | |
| 4 | 환경·미래산업 | 폐기물 처리 전문가 | waste-management-specialist | 대표 | 1차 | 환경부 관련직, 공개지표 풍부 | 높음 | |
| 5 | 환경·미래산업 | 드론 전문가 | drone-specialist | 대표 | 1차 | 학생 흥미 높음, 즉각 탐색 가능 | 중간 | |
| 6 | 환경·미래산업 | 에너지 저장 엔지니어 | energy-storage-engineer | 대표 | 2차 | 배터리/ESS 분야, 미래 수요 높음 | 낮음 | 학부모 인식 낮아 2차 적합 |
| 7 | 환경·미래산업 | 생태복원 전문가 | ecosystem-restoration-specialist | 대표 | 2차 | 차별화 가능, 학부모 이해 낮음 | 낮음 | |
| 8 | 공공·안전 | 교도관 | correctional-officer | 대표 | 1차 | 공공직, 고용24 데이터 풍부 | 높음 | |
| 9 | 공공·안전 | 구조대원 | rescue-specialist | 대표 | 1차 | firefighter 보완, 학생 관심 높음 | 중간 | |
| 10 | 공공·안전 | 군무원 | military-civil-servant | 대표 | 1차 | 군 관련 직업군 보완, 시험 경로 명확 | 높음 | |
| 11 | 공공·안전 | 경호원 | security-guard | 대표 | 1차 | 학생 관심 높음, 직업 이미지 명확 | 중간 | |
| 12 | 공공·안전 | 해양경찰관 | maritime-police-officer | 대표 | 1차 | coast-guard-officer가 is_representative=false로 확인 시 대표로 신규 추가 가능 | 높음 | forensic-scientist/coast-guard-officer 실측 후 결정 |
| 13 | 항공·운송 | 항공정비사 | aircraft-maintenance-technician | 대표 | 1차 | 항공기 조종사와 쌍 구성, 직업 이미지 명확 | 높음 | |
| 14 | 항공·운송 | 물류관리사 | logistics-manager | 대표 | 1차 | 물류·운송 분야, 공개지표 풍부 | 높음 | |
| 15 | 항공·운송 | 선박항해사 | ship-navigator | 대표 | 2차 | 해양 운송 분야 | 중간 | |
| 16 | 콘텐츠·미디어 | 게임 스트리머 | game-streamer | 대표 | 1차 | 학생 관심 최상위 직업 | 낮음 | creator와 중복 가능성 검토 |
| 17 | 콘텐츠·미디어 | 작가 | writer | 대표 | 1차 | occupations.ts 존재, DB 추가 필요 | 중간 | novelist와 구분 필요 |
| 18 | 콘텐츠·미디어 | 방송작가 | broadcast-writer | 대표 | 1차 | pd-director와 쌍 구성 | 중간 | |
| 19 | 콘텐츠·미디어 | 광고 크리에이티브 디렉터 | creative-director | 대표 | 2차 | 광고·브랜딩 분야 | 중간 | |
| 20 | 비즈니스·경영 | 변호사 | lawyer | 대표 | 1차 | 학부모 선호도 최상위, 이해도 높음 | 높음 | |
| 21 | 비즈니스·경영 | 세무사 | tax-accountant | 대표 | 1차 | accountant와 쌍 구성, 시험 경로 명확 | 높음 | |
| 22 | 비즈니스·경영 | 물류·유통 전문가 | logistics-specialist | 대표 | 1차 | 공급망 분야 성장, 고용24 가능 | 높음 | 항공·운송 logistics-manager와 중복 검토 |
| 23 | 비즈니스·경영 | 보험계리사 | actuary | 대표 | 2차 | 전문직이지만 학부모 인식 낮음 | 중간 | |
| 24 | 교육·사회 | 중학교 교사 | middle-school-teacher | 대표 | 1차 | elementary-teacher와 쌍 구성, 학부모 친숙 | 높음 | |
| 25 | 교육·사회 | 진로상담 교사 | career-counseling-teacher | 대표 | 1차 | 학부모 탐색 동기 직접 연결 | 높음 | |
| 26 | 교육·사회 | 청소년 지도사 | youth-counselor | 대표 | 1차 | 방과후·학교 밖 청소년 대상 | 중간 | |
| 27 | 교육·사회 | 평생교육사 | lifelong-education-specialist | 대표 | 2차 | 성인교육 분야 | 중간 | |
| 28 | IT·기술 | 데이터 엔지니어 | data-engineer | 대표 | 1차 | data-analyst와 차별화, 실무 수요 높음 | 중간 | |
| 29 | IT·기술 | 앱 개발자 | app-developer | 대표 | 1차 | software-engineer와 구분, 학생 친숙 | 높음 | |
| 30 | IT·기술 | 디지털 마케터 | digital-marketer | 대표 | 1차 | marketer와 구분, 실용적 | 높음 | |
| 31 | IT·기술 | 블록체인 개발자 | blockchain-developer | 대표 | 2차 | 미래 직업, 학부모 이해도 낮음 | 낮음 | |
| 32 | 의료·과학 | 한의사 | oriental-medicine-doctor | 대표 | 1차 | 전통 의료, 학부모 인식 높음 | 높음 | |
| 33 | 의료·과학 | 간호조무사 또는 산업안전 전문가 | nursing-assistant 또는 industrial-safety-specialist | 대표 | 2차 | nurse 보완 또는 산업 안전 분야 | 높음 | OZ.대표 결정 필요 |

> 이 후보군은 초안이며, OZ.대표 최종 결정 전 수정 가능합니다.

---

## 7. 세부 직업 후보군 작성 기준

| 상위 직업 | 세부 직업명 | slug 제안 | 검색 노출 필요성 | 자체 로드맵 필요 여부 | 비고 |
|---|---|---|---|---|---|
| doctor | 소아과의사 | pediatrician | 높음 | 상위 직업 공유 가능 | migration 038 기존 존재 |
| doctor | 정신건강의학과 의사 | psychiatrist | 높음 | 상위 직업 공유 가능 | migration 039 기존 존재 |
| doctor | 응급의학과 의사 | emergency-physician | 중간 | 상위 직업 공유 가능 | migration 039 기존 존재 |
| lawyer | 검사 | prosecutor | 높음 | 추후 판단 | lawyer 추가 후 연결 |
| lawyer | 판사 | judge | 높음 | 추후 판단 | |
| 군인 | 육군 | army-soldier | 높음 | 상위 직업 공유 가능 | migration 045 기존 존재 |
| 군인 | 해군 | navy-sailor | 높음 | 상위 직업 공유 가능 | migration 045 기존 존재 |

---

## 8. 1차 / 2차 확장 전략

> **1차 후보 23개 선정 완료** — 상세 내용은 [`docs/occupation-100-first-wave-candidates.md`](./occupation-100-first-wave-candidates.md) 참조.  
> 중복 확인 후 6개 대체 적용. **`053_seed_first_wave_occupations.sql` 초안 작성 완료 (2026-05-25) — OZ 적용 대기.**

> **053 적용 후 예상 대표 직업 수: 90개** (현재 67개 + 23개 추가)

### 8-1. 1차 확장 원칙 (현재 67개 → ~90개 목표)

현재 대표 직업 67개에 추가로 약 23개를 1차 확장 대상으로 선정한다.

**선정 기준 (우선순위순):**
1. 초등·중등 학생과 학부모가 즉시 이해할 수 있는 직업
2. 환경·미래산업 카테고리 우선 보강 (현재 4개 → 9개 목표)
3. 공공·안전, 항공·운송 보강
4. 콘텐츠·미디어, 비즈니스·경영, 교육·사회 균형 보강
5. 고용24 또는 공개 통계로 임금·전망 자료 작성이 가능한 직업
6. quizData 3문항, occupation_summary 3종, occupation_preparations 3개 작성 난이도가 낮은 직업
7. 기존 occupation_master slug과 중복되지 않는 직업
8. **예술·디자인은 이미 14개로 목표 충족 — 1차 확장 제외**

**1차 확장 목표 (확정 배분안):**

| 카테고리 | 현재 대표 | 1차 추가 | 1차 후 대표 | 최종 목표 |
|---|---:|---:|---:|---:|
| IT·기술 | 10 | +2 | 12 | 14 |
| 의료·과학 | 12 | +1 | 13 | 14 |
| 예술·디자인 | 14 | 0 | 14 | 14 |
| 콘텐츠·미디어 | 7 | +3 | 10 | 11 |
| 비즈니스·경영 | 7 | +3 | 10 | 11 |
| 교육·사회 | 7 | +3 | 10 | 11 |
| 환경·미래산업 | 4 | +5 | 9 | 11 |
| 공공·안전 | 4 | +4 | 8 | 10 |
| 항공·운송 | 2 | +2 | 4 | 4 |
| **합계** | **67** | **+23** | **90** | **100** |

**1차 확정 후보 23개 (중복 확인 완료):**

| 우선순위 | 카테고리 | 직업명 | slug | 비고 |
|---:|---|---|---|---|
| 1 | 환경·미래산업 | 스마트팜 전문가 | smart-farm-specialist | static 데이터 존재, DB 추가 필요 |
| 2 | 환경·미래산업 | 기후데이터 분석가 | climate-data-analyst | |
| 3 | 환경·미래산업 | 자원순환 전문가 | resource-recycling-specialist | |
| 4 | 환경·미래산업 | 녹색건축 전문가 | green-building-specialist | |
| 5 | 환경·미래산업 | 환경 컨설턴트 | environmental-consultant | |
| 6 | 공공·안전 | 재난안전관리자 | disaster-safety-manager | |
| 7 | 공공·안전 | 보호관찰관 | probation-officer | 대체 (응급구조사 → 의료·과학 중복) |
| 8 | 공공·안전 | 교정직 공무원 | correctional-officer | |
| 9 | 공공·안전 | 일반행정 공무원 | public-administration-officer | |
| 10 | 항공·운송 | 항공정비사 | aircraft-maintenance-technician | |
| 11 | 항공·운송 | 물류관리사 | logistics-manager | |
| 12 | 콘텐츠·미디어 | 영상 감독 | video-director | 대체 (방송 PD → pd-director 중복) |
| 13 | 콘텐츠·미디어 | 게임 기획자 | game-planner | game-developer와 별개 |
| 14 | 콘텐츠·미디어 | 스포츠 해설가 | sports-commentator | 대체 (기자 → journalist 중복) |
| 15 | 비즈니스·경영 | 인사담당자 | human-resources-specialist | |
| 16 | 비즈니스·경영 | 재무설계사 | financial-planner | |
| 17 | 비즈니스·경영 | 프로덕트 매니저 | product-manager | |
| 18 | 교육·사회 | 평생교육사 | lifelong-education-specialist | 대체 (초등교사 → elementary-teacher 중복) |
| 19 | 교육·사회 | 청소년지도사 | youth-worker | |
| 20 | 교육·사회 | 방과후교사 | after-school-teacher | |
| 21 | IT·기술 | 네트워크 엔지니어 | network-engineer | 대체 (데이터 분석가 → data-analyst 중복) |
| 22 | IT·기술 | 모바일 앱 개발자 | mobile-app-developer | 대체 (정보보안전문가 → cybersecurity-expert 중복) |
| 23 | 의료·과학 | 방사선사 | radiologic-technologist | |

### 8-2. 2차 확장 원칙 (~90개 → 100개 목표)

> **2차 후보 10개 선정 완료** — 스포츠 진로 생태계 방향으로 설계. 상세 내용은 [`docs/occupation-100-second-wave-sports-ecosystem-candidates.md`](./occupation-100-second-wave-sports-ecosystem-candidates.md) 참조.  
> 중복 확인 완료. **055 migration 초안 작성 완료. 056 migration 초안 작성 완료.**

**2차 후보 10개 핵심 방향:** 운동선수 외에도 스포츠 분야 안에서 다양한 직업을 발견할 수 있도록 스포츠 데이터·기술·건강·지도·콘텐츠·마케팅·안전·레저 직업군으로 구성한다.

**2차 확정 후보 10개 (중복 확인 완료):**

| 우선순위 | 카테고리 | 직업명 | slug | 비고 |
|---:|---|---|---|---|
| 1 | IT·기술 | 스포츠 데이터 분석가 | sports-data-analyst | |
| 2 | IT·기술 | 스포츠 테크 개발자 | sports-tech-developer | |
| 3 | 의료·과학 | 운동처방사 | exercise-prescription-specialist | 국가자격 직종 |
| 4 | 콘텐츠·미디어 | 스포츠 콘텐츠 기획자 | sports-content-planner | sports-commentator와 역할 구분 |
| 5 | 비즈니스·경영 | 스포츠 마케터 | sports-marketer | |
| 6 | 교육·사회 | 유소년 스포츠 지도자 | youth-sports-coach | youth-worker와 역할 구분 |
| 7 | 환경·미래산업 | 아웃도어 레저 기획자 | outdoor-leisure-planner | |
| 8 | 환경·미래산업 | 해양레저 전문가 | marine-leisure-specialist | marine-corps-soldier와 무관 |
| 9 | 공공·안전 | 스포츠 안전관리자 | sports-safety-manager | |
| 10 | 공공·안전 | 수상안전요원 | water-safety-lifeguard | 국가자격(수상구조사) 연결 |

**2차 확장 목표:**

| 카테고리 | 현재 대표 | 2차 추가 | 최종 대표 직업 수 |
|---|---:|---:|---:|
| IT·기술 | 12 | +2 | 14 |
| 의료·과학 | 13 | +1 | 14 |
| 예술·디자인 | 14 | 0 | 14 |
| 콘텐츠·미디어 | 10 | +1 | 11 |
| 비즈니스·경영 | 10 | +1 | 11 |
| 교육·사회 | 10 | +1 | 11 |
| 환경·미래산업 | 9 | +2 | 11 |
| 공공·안전 | 8 | +2 | 10 |
| 항공·운송 | 4 | 0 | 4 |
| **합계** | **90** | **+10** | **100** |

---

## 9. 직업 1개 추가 표준 템플릿

### 9-1. occupation_master 기준

**필수 확인 필드:**

| 필드 | 설명 | 주의사항 |
|---|---|---|
| `slug` | 영문 소문자 + 하이픈 | 기존 slug와 중복 금지 |
| `name_ko` | 한국어 직업명 | UI 표기와 동일해야 함 |
| `emoji` | 직업 이모지 1개 | 기존 직업과 동일 이모지 사용 지양 |
| `category` | 9개 카테고리 중 하나 | 기존 UI 표기와 정확히 일치 |
| `interest_fields` | `array['it']` 등 | 기존 값 참조 |
| `is_active` | `true` (노출 즉시) 또는 `false` (검토 후 활성화) | |
| `is_representative` | 대표 직업: `true`, 세부 직업: `false` | |
| `occupation_level` | 대표: `1`, 세부: `2` | |
| `parent_occupation_id` | 세부 직업의 상위 직업 UUID | 대표는 null |
| `legacy_occupation_id` | URL 라우팅용 ID | `slug`와 동일 값 권장 |

**카테고리명 표기 기준 (9개):**
- ✅ `IT·기술`, `의료·과학`, `예술·디자인`, `콘텐츠·미디어`, `비즈니스·경영`, `교육·사회`, `환경·미래산업`, `공공·안전`, `항공·운송`
- ❌ `IT/기술`, `IT기술`, `의료과학`, `항공운송` (슬래시/하이픈/중간점 표기 다르면 explore 필터 깨짐)

**legacy_occupation_id 설정 기준:**
- 신규 직업: `legacy_occupation_id = slug` (동일값 권장)
- URL 호환 필요: `legacy_occupation_id = 기존 ID` (예: airline-pilot → 'pilot')
- quizData, roadmaps 기존 키와 맞춰야 하는 경우: 해당 키 값으로 설정

### 9-2. occupation_summary 기준

**필수 3종 (layer='service'):**

| content_type | 설명 | 길이 기준 |
|---|---|---|
| `one_liner` | 직업 한 줄 요약 | 50자 이내 |
| `easy_description` | 쉬운 설명 (초등 고학년 기준) | 2~3문장, 120자 이내 |
| `why_this_job` | 이 직업에 관심을 갖는 이유 | 2문장 |

**작성 기준:**
- 초등 고학년과 학부모가 이해할 수 있는 표현을 사용한다.
- 아래 표현을 사용하지 않는다:
  - ❌ "반드시 성공", "고소득 보장", "미래 보장", "취업 보장", "평균 연봉", "최고 연봉"
  - ✅ "일자리 수요가 있을 것으로 예측되는 분야예요", "다양한 곳에서 일할 수 있어요"

### 9-3. occupation_preparations 기준

**필수 최소 세트 (layer='service'):**

| prep_type | 최소 개수 | 설명 |
|---|---|---|
| `mission_hint` | 1개 | 오늘 당장 할 수 있는 탐색 힌트 |
| `step_action` | 2개 | Stage 1 준비 활동 (display_order=0, 1) |

**작성 기준:**
- 학생이 실제로 해볼 수 있는 활동 중심 (유튜브 탐색, 독서, 메모 등)
- 대학 진학이나 자격증 취득보다 탐색·경험 중심으로 작성
- `grade_group='all'`, `stage_number=1`, `version_no=1`, `is_current=true`, `is_latest=true`, `status='published'`

### 9-4. quizData 기준

```
key = legacy_occupation_id (= URL params.id)
예: /explore/lawyer → quizData['lawyer']
    /explore/pilot  → quizData['pilot'] (airline-pilot의 legacy_occupation_id='pilot')
```

**필수 구성:**

```typescript
'legacy-occupation-id': [
  {
    id: 'slug-q1',
    question: '질문 (초등 고학년 이해 수준)',
    options: ['보기1', '보기2', '보기3', '보기4'],
    correctIndex: 0,   // 0-based index
    explanation: '정답 설명',
  },
  // 최소 3문항
]
```

**주의사항:**
- `correctIndex`와 `options` 배열 순서가 반드시 일치해야 한다.
- key는 반드시 `legacy_occupation_id`와 일치해야 한다.
- 초등 고학년이 이해 가능한 문장 사용 (전문 용어 최소화)

### 9-5. roadmaps 또는 weekly mission fallback 기준

**확인 순서:**
1. `src/data/roadmaps.ts`에 `legacy_occupation_id` 키로 정적 로드맵이 있는지 확인
2. 없으면 `weekly_roadmap_missions` (AI 생성) fallback 작동 — slug 기준 자동 생성
3. `/report` 실천 미션 비교는 `roadmap_progress.occupation_id = legacy_occupation_id` 기준으로 집계됨

**주의사항:**
- 로드맵 완료 로직(`roadmap_progress.checked_missions`)을 변경하지 않는다.
- ProgressCircle 계산 로직을 변경하지 않는다.
- mission id는 기존 `m1~m12` 또는 `wm-YYYY-MM-DD-c-N` 패턴 유지
- 신규 직업에 정적 roadmaps를 추가하지 않아도 weekly mission fallback으로 운영 가능

### 9-6. occupation_goyo24_profile 기준

| source 값 | 화면 뱃지 | 출처 문구 | 동기화 날짜 표시 |
|---|---|---|---|
| `goyo24`, `api`, `goyo24_api` | 고용24 제공 | 출처: 고용24 | 표시 |
| `manual` | 참고 데이터 | 출처: 공개 참고 정보 | 미표시 |
| row 없음 | 없음 | — | "참고 지표 준비 중" |

**작성 기준:**
- 수동 작성 시 반드시 `source='manual'`로 설정한다.
- 임금 단위는 만원, survey_year는 가장 최근 조사연도 기준
- `goyo24_occ_code=null`로 시작하고 추후 sync 스크립트 실행 시 갱신

### 9-7. legacy_occupation_id 기준

| 상황 | 설정 방법 |
|---|---|
| 신규 직업 (URL 호환 불필요) | `legacy_occupation_id = slug` (동일값) |
| 기존 URL 호환 필요 | `legacy_occupation_id = 기존 ID` (예: airline-pilot → 'pilot') |
| static quizData, roadmaps 키와 맞춰야 하는 경우 | `legacy_occupation_id = quizData/roadmaps 기존 키` |

---

## 10. 확장 전 체크리스트

- [ ] `occupation_master` 중복 slug 없음
- [ ] 카테고리명 기존 UI 표기와 일치 (9개 카테고리 체계)
- [ ] 항공·운송 카테고리가 `/explore` UI 필터에 정상 노출되는지 확인
- [ ] 대표 직업과 세부 직업 구분 명확
- [ ] 대표 직업은 `is_representative=true`, `occupation_level=1`
- [ ] 세부 직업은 `is_representative=false`, `occupation_level=2`
- [ ] 세부 직업의 `parent_occupation_id` 연결 기준 확인
- [ ] `legacy_occupation_id` 필요한 직업 확인 (URL 호환)
- [ ] `occupation_summary` one_liner/easy_description/why_this_job 3종 누락 없음
- [ ] `occupation_preparations` mission_hint 1개 + step_action 2개 이상
- [ ] 대표 직업 `quizData` 최소 3문항 기준 충족
- [ ] roadmaps.ts 정적 데이터 or weekly mission fallback 정상 동작 확인
- [ ] `occupation_goyo24_profile.source` 정책 정상 (`manual` → "참고 데이터" 뱃지)
- [ ] `/explore` 기본 목록 과밀화 없음 (카테고리 필터 or 페이지네이션 검토)
- [ ] 검색 결과에서 세부 직업 노출 가능 (is_active=true)
- [ ] `/roadmap/[occupationId]` 진입 가능 (legacy_occupation_id 일치)
- [ ] `/report` 집계 영향 없음 (roadmap_progress.occupation_id 매핑 확인)
- [ ] OpenAI 호출 구조 변경 없음
- [ ] 요금제 변경 없음
- [ ] RLS 변경 없음
- [ ] Auth 변경 없음
- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 성공

---

## 11. 사전 보정 필요 항목

확장 작업 시작 전 아래 항목을 보정해야 한다.

| 항목 | 확인 결과 | 수정 필요 파일 | 제안 방향 |
|---|---|---|---|
| `carbon-neutrality-specialist` slug | DB: `carbon-neutrality-specialist` ✅, occupations.ts: `carbon-neutral-specialist` ❌ | `src/data/occupations.ts` | id를 `carbon-neutrality-specialist`로 수정 (quizData·roadmaps는 이미 보정됨) |
| `renewable-energy-specialist` slug | DB: `renewable-energy-specialist` ✅, occupations.ts: `renewable-energy-engineer` ❌ | `src/data/occupations.ts` | id를 `renewable-energy-specialist`로 수정 (quizData·roadmaps는 이미 보정됨) |
| `vr-ar-developer` category | DB: `IT·기술` ✅, occupations.ts: `환경·미래산업` ❌ | `src/data/occupations.ts` | category를 `IT·기술`로 수정 |
| is_active 현황 | 실측 inactive_total=0 ✅ — 현재 비활성 직업 없음 | 없음 | 추가 조치 불필요 |

> ⚠️ occupations.ts 보정 3건은 `/explore` 카테고리 필터 정확도에 직접 영향을 미칩니다. 052 migration 이전에 보정을 권장합니다.

---

## 12. 다음 단계

1. **사전 보정 3건 실행** (occupations.ts slug/category 불일치 — 별도 작업지시서 필요)

2. **항공·운송 UI 필터 확인** — `/explore` 카테고리 필터에 `항공·운송` 탭이 노출되는지 확인

3. **forensic-scientist / coast-guard-officer 실측 확인** — is_representative 및 category 현황 확인 후 공공·안전 1차 확장 목록 보정
   ```sql
   SELECT slug, name_ko, category, is_representative
   FROM occupation_master
   WHERE slug IN ('forensic-scientist', 'coast-guard-officer');
   ```

4. **1차 확장 후보 23개 확정** ✅ (OZ 승인 완료 — 2026-05-25)

5. **`053_seed_first_wave_occupations.sql` 초안 작성** ✅ (2026-05-25 완료)
   - occupation_master + summary + preparations 일괄 삽입 (23개 × 3테이블)
   - ON CONFLICT DO NOTHING 패턴 적용 (멱등성 보장)
   - **OZ가 Supabase SQL Editor에서 직접 실행 및 검증 필요**

5-1. **`054_seed_goyo24_profiles_for_first_wave_occupations.sql` 초안 작성** ✅ (2026-05-25 완료)
   - occupation_goyo24_profile 23개 수동 입력 (source='manual', goyo24_occ_code=null)
   - ON CONFLICT (occupation_id) DO NOTHING 패턴 (기존 goyo24 sync row 보호)
   - 화면: "참고 데이터" 뱃지 표시 (Goyo24InfoSection source 정책 준수)
   - **OZ가 Supabase SQL Editor에서 직접 실행 및 검증 필요**
   - 향후 sync_goyo24_occupations.ts MANUAL_MAPPING 업데이트 시 source='goyo24'로 갱신 가능

6. **quizData 추가** (23개 직업, 각 3문항) ✅ (2026-05-26 완료)
   - src/data/quizData.ts에 23개 × 3문항 = 69문항 추가
   - Q1: 하는 일 이해, Q2: 역량·태도 이해, Q3: 탐색 활동 구성
   - 4지선다, correctIndex 분산, explanation 초등 고학년 수준

7. **2차 후보 10개 선정** (스포츠 진로 생태계) ✅ (2026-05-26 완료)
   - `docs/occupation-100-second-wave-sports-ecosystem-candidates.md` 작성 완료
   - 카테고리별 배분 준수 (IT 2, 의료 1, 콘텐츠 1, 비즈니스 1, 교육 1, 환경 2, 공공 2)
   - 중복 확인 완료 — 10개 전원 기존 직업과 명확한 중복 없음

8. **055 migration 작성** ✅ (2026-05-26 완료)
   - `supabase/migrations/055_seed_second_wave_sports_ecosystem_occupations.sql` 초안 작성 완료
   - occupation_master + summary(3종) + preparations(3종) × 10개 = 70 rows
   - ON CONFLICT DO NOTHING 패턴 (멱등성 보장)
   - 적용 후 기대: occupation_master 114개, **대표 직업 100개 달성**
   - **OZ가 Supabase SQL Editor에서 직접 실행 및 검증 필요**

9. **056 migration 작성** ✅ (2026-05-26 완료)
   - `supabase/migrations/056_seed_goyo24_profiles_for_second_wave_sports_occupations.sql` 초안 작성 완료
   - occupation_goyo24_profile 10개 수동 입력 (source='manual', goyo24_occ_code=null)
   - ON CONFLICT (occupation_id) DO NOTHING 패턴 (기존 goyo24 sync row 보호)
   - prospect_label: 증가 7개, 유지 3개 / 화면: "참고 데이터" 뱃지 표시
   - **OZ가 Supabase SQL Editor에서 055 실행 후 이어서 실행 필요**

10. **quizData 추가** (2차 10개 직업, 각 3문항 = 30문항) ✅ (2026-05-26 완료)
    - src/data/quizData.ts에 10개 × 3문항 = 30문항 추가
    - correctIndex 분포: 0→8, 1→8, 2→7, 3→7 (균형 분배)
    - tsc --noEmit 통과 / next build 통과

11. **Preview/로컬 smoke test** → /explore, /roadmap, /report 흐름 확인

12. **관심 운동 기반 진로 확장 구조 설계** ✅ (2026-05-26 완료)
    - `docs/sports-interest-career-expansion-design.md` 신규 작성
    - 관심 운동 10개 (축구·야구·농구·배구·수영·태권도·줄넘기·골프·e스포츠·아웃도어) × 연결 직업군 정의
    - 운동 종목 ≠ 직업 원칙 문서화: 종목명은 `occupation_master`에 넣지 않음
    - 운동선수 직업군(축구선수·야구선수 등)은 별도 후속 설계 대상으로 분리
    - `육상선수` 제외 / `줄넘기 선수` 포함 (초등 접근성·방과후 연결성 기준)
    - 기존 스포츠 진로 생태계 10개 직업을 연결 직업군으로 재활용하는 구조 확정
    - 장기 DB 설계안 (`interest_sports`, `sport_career_links`) 문서화 (미구현)
    - 정적 데이터 파일(`sportsInterestData.ts`) 대안 방향 제시

---

## 13. 대표 직업 100개 이후 확장 방향

대표 직업 100개 1차 운영 완료 이후, 아래 방향을 검토한다.

| 방향 | 내용 | 우선순위 |
|---|---|---|
| 관심 운동 기반 진로 추천 UI | `/explore` 내 "이 운동을 좋아한다면 함께 볼 직업" 섹션 구현 | 높음 |
| 운동선수 직업군 추가 | 축구선수·야구선수·줄넘기 선수 등 occupation_master 추가 여부 결정 | OZ 결정 필요 |
| 정적 데이터 파일 작성 | `src/data/sportsInterestData.ts` — DB 없이 빠른 연결 구현 | 중간 |
| roadmaps 직접 작성 | 스포츠 생태계 10개 직업 weekly roadmap 직접 작성 여부 판단 | 중간 |
| 명따라 결과 연결 | 명따라 관심사·성향과 관심 운동 추천 연결 여부 검토 | 낮음 |

> 상세 설계: [`docs/sports-interest-career-expansion-design.md`](./sports-interest-career-expansion-design.md)

**운동 종목 처리 원칙 (이후 작업 전 반드시 확인):**
- 운동 종목(축구, 야구, 줄넘기 등)은 직업이 아니라 **관심 분야(진로 출발점)**로 관리한다.
- `occupation_master`에 종목명 자체를 직업으로 삽입하지 않는다.
- 운동선수 직업군은 별도 설계 작업지시서를 통해 추가한다.

---

*이 문서는 Production DB 변경 없이 설계 목적으로만 작성된 문서입니다. 실제 확장 작업은 별도 migration(052~)에서 진행합니다.*
