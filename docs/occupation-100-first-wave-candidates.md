# 꿈따라 대표 직업 100개 확장 — 1차 후보 23개 선정안

> 작성일: 2026-05-25
> 기준: occupation-100-expansion-audit.md + occupation-100-expansion-plan.md 감사 결과 반영
> 상태: OZ 승인 대기 (DB 변경 없음 — 문서 전용)

---

## 1. 작업 목적

- 대표 직업 100개 확장을 위해 1차 후보 23개를 선정한다.
- 이번 문서는 053 migration 작성 전 OZ 승인용 후보 문서다.
- 이 문서만으로 DB 변경은 발생하지 않는다.
- 기존 `occupation_master`, 기존 migration, `src/data/occupations.ts`, `quizData.ts`, `roadmaps.ts`를 전수 검색해 중복 여부를 확인했다.

---

## 2. 현재 기준값

> Supabase 실측 기준 (2026-05-25), migration 052 철도 직업 보정 적용 후

| 항목 | 값 |
|---|---:|
| 현재 대표 직업 수 | 67 |
| 최종 목표 대표 직업 수 | 100 |
| 총 추가 필요 수 | 33 |
| 1차 후보 수 | 23 |
| 1차 반영 후 예상 대표 직업 수 | 90 |
| 2차 이후 추가 필요 수 | 10 |

---

## 3. 카테고리별 1차 후보 배분

| 카테고리 | 현재 대표 | 최종 목표 | 총 추가 필요 | 1차 후보 | 2차 이후 |
|---|---:|---:|---:|---:|---:|
| IT·기술 | 10 | 14 | 4 | 2 | 2 |
| 의료·과학 | 12 | 14 | 2 | 1 | 1 |
| 예술·디자인 | 14 | 14 | 0 | 0 | 0 |
| 콘텐츠·미디어 | 7 | 11 | 4 | 3 | 1 |
| 비즈니스·경영 | 7 | 11 | 4 | 3 | 1 |
| 교육·사회 | 7 | 11 | 4 | 3 | 1 |
| 환경·미래산업 | 4 | 11 | 7 | 5 | 2 |
| 공공·안전 | 4 | 10 | 6 | 4 | 2 |
| 항공·운송 | 2 | 4 | 2 | 2 | 0 |
| 합계 | 67 | 100 | 33 | 23 | 10 |

배분 판단 근거:

- **예술·디자인:** 이미 14개로 목표 충족. 1차 대상 제외.
- **환경·미래산업:** 가장 부족한 카테고리. 1차에서 5개 우선 보강.
- **공공·안전:** 052 적용 후 대표 4개. 1차에서 4개 보강.
- **항공·운송:** 052 적용 후 대표 2개. 1차에서 목표 4개 달성 (2개 추가).
- **콘텐츠·미디어 / 비즈니스·경영 / 교육·사회:** 각각 3개씩 균형 보강.
- **IT·기술 / 의료·과학:** 현재 비교적 안정적. 일부만 보강.

---

## 4. 1차 후보 23개 목록

> 중복 확인 완료 기준. 대체 적용 후보는 비고에 표시.

| 우선순위 | 카테고리 | 직업명 | slug 제안 | 중복 여부 | 1차 포함 | 선정 이유 | goyo24/manual |
|---:|---|---|---|---|---|---|---|
| 1 | 환경·미래산업 | 스마트팜 전문가 | smart-farm-specialist | 없음 (static만 존재) | ✅ | static 데이터 보유로 표준 세트 준비도 높음. 농촌·IT 융합 직업으로 학생 이해도 높음 | manual 권장 |
| 2 | 환경·미래산업 | 기후데이터 분석가 | climate-data-analyst | 없음 | ✅ | 환경·데이터 융합 직업, 명따라 추천 연결성 높음 | manual 권장 |
| 3 | 환경·미래산업 | 자원순환 전문가 | resource-recycling-specialist | 없음 | ✅ | 재활용·순환경제 주제로 체험 활동 구성 쉬움 | goyo24 가능 |
| 4 | 환경·미래산업 | 녹색건축 전문가 | green-building-specialist | 없음 | ✅ | 건축·환경 융합, 국가자격 연결 가능 | goyo24 가능 |
| 5 | 환경·미래산업 | 환경 컨설턴트 | environmental-consultant | 없음 | ✅ | 학부모 이해도 높고 공개지표 작성 쉬움 | manual 권장 |
| 6 | 공공·안전 | 재난안전관리자 | disaster-safety-manager | 없음 | ✅ | 공공·안전 대표성 높고 사회 안전 주제로 적합 | goyo24 가능 |
| 7 | 공공·안전 | 보호관찰관 | probation-officer | 없음 | ✅ (대체) | 원래 응급구조사(중복) → 대체. 공공직으로 고용24 데이터 풍부, 사법·보호 분야 대표성 있음 | goyo24 가능 |
| 8 | 공공·안전 | 교정직 공무원 | correctional-officer | 없음 | ✅ | 공공 안전 직업군 다양화, 공무원 시험 경로 명확 | goyo24 가능 |
| 9 | 공공·안전 | 일반행정 공무원 | public-administration-officer | 없음 | ✅ | 공공 분야 대표 직업, 학부모 이해도 최고 수준 | goyo24 가능 |
| 10 | 항공·운송 | 항공정비사 | aircraft-maintenance-technician | 없음 | ✅ | airline-pilot과 쌍 구성, 직업 이미지 명확 | goyo24 가능 |
| 11 | 항공·운송 | 물류관리사 | logistics-manager | 없음 | ✅ | 물류·공급망 분야, 국가자격 연결 가능 | goyo24 가능 |
| 12 | 콘텐츠·미디어 | 영상 감독 | video-director | 없음 | ✅ (대체) | 원래 방송 PD(중복, pd-director 존재) → 대체. video-content-editor와 구분되는 연출직 | manual 권장 |
| 13 | 콘텐츠·미디어 | 게임 기획자 | game-planner | 없음 | ✅ | game-developer(IT·기술)와 별개. 콘텐츠 설계·기획 역할로 카테고리 적합 | manual 권장 |
| 14 | 콘텐츠·미디어 | 스포츠 해설가 | sports-commentator | 없음 | ✅ (대체) | 원래 기자(중복, journalist 존재) → 대체. 미디어·스포츠 분야, 학생 관심도 높음 | manual 권장 |
| 15 | 비즈니스·경영 | 인사담당자 | human-resources-specialist | 없음 | ✅ | 기업 조직관리 직업, 이해도 높고 진로 연결 쉬움 | goyo24 가능 |
| 16 | 비즈니스·경영 | 재무설계사 | financial-planner | 없음 | ✅ | 금융·경제 교육 연결 가능, 국가자격 경로 명확 | goyo24 가능 |
| 17 | 비즈니스·경영 | 프로덕트 매니저 | product-manager | 없음 | ✅ | IT·비즈니스 융합 직업, 미래 직업성 높음 | manual 권장 |
| 18 | 교육·사회 | 평생교육사 | lifelong-education-specialist | 없음 | ✅ (대체) | 원래 초등교사(중복, elementary-teacher 존재) → 대체. 국가자격, 교육 분야 다양화 | goyo24 가능 |
| 19 | 교육·사회 | 청소년지도사 | youth-worker | 없음 | ✅ | 국가자격, 교육·사회 분야 확장에 적합 | goyo24 가능 |
| 20 | 교육·사회 | 방과후교사 | after-school-teacher | 없음 | ✅ | 초등 학부모 타깃과 연결성 높음 | manual 권장 |
| 21 | IT·기술 | 네트워크 엔지니어 | network-engineer | 없음 | ✅ (대체) | 원래 데이터 분석가(중복, data-analyst 존재) → 대체. IT 인프라 직업, 수요 안정적 | goyo24 가능 |
| 22 | IT·기술 | 모바일 앱 개발자 | mobile-app-developer | 없음 | ✅ (대체) | 원래 정보보안전문가(중복, cybersecurity-expert 존재) → 대체. software-developer와 구분, 학생 친숙 | manual 권장 |
| 23 | 의료·과학 | 방사선사 | radiologic-technologist | 없음 | ✅ | 의료 보건 직업군 다양화, 국가자격 경로 명확 | goyo24 가능 |

---

## 5. 후보별 표준 세트 준비도

> 준비도는 이번 작업 중 migration 및 static 파일 전수 검색 결과 기반 평가.  
> 실제 데이터는 이번 작업에서 작성하지 않음.

| 직업명 | occupation_master | summary | preparations | quizData | roadmap/fallback | goyo24/manual | legacy 매핑 | 종합 난이도 |
|---|---|---|---|---|---|---|---|---|
| 스마트팜 전문가 | 낮음 (static 참조) | 낮음 (static 참조) | 낮음 (static 참조) | 중간 (신규 작성) | **높음 (roadmaps.ts 존재)** | manual 권장 | slug 동일 | **낮음** |
| 기후데이터 분석가 | 낮음 | 중간 | 중간 | 중간 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 자원순환 전문가 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **중간** |
| 녹색건축 전문가 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **중간** |
| 환경 컨설턴트 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 재난안전관리자 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **중간** |
| 보호관찰관 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 교정직 공무원 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 일반행정 공무원 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 항공정비사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 물류관리사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 영상 감독 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 게임 기획자 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 스포츠 해설가 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 인사담당자 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 재무설계사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 프로덕트 매니저 | 낮음 | 중간 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **중간** |
| 평생교육사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 청소년지도사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 방과후교사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **낮음** |
| 네트워크 엔지니어 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |
| 모바일 앱 개발자 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | manual 권장 | slug 동일 | **낮음** |
| 방사선사 | 낮음 | 낮음 | 낮음 | 낮음 | 중간 (fallback) | goyo24 가능 | slug 동일 | **낮음** |

**전체 종합 판단:**

- occupation_master 추가 난이도: **낮음** (23개 전체 일관된 패턴)
- summary / preparations 작성 난이도: **대부분 낮음, 신생 직업군 중간**
- quizData 작성 난이도: **낮음~중간** (스마트팜은 static 참조 가능, 나머지는 신규 작성)
- roadmap/fallback 적합성: **스마트팜 높음 (roadmaps.ts 존재), 나머지 중간 (weekly fallback)**
- goyo24/manual 지표 가능성: **15개 goyo24 가능, 8개 manual 권장**
- legacy_occupation_id 필요성: 전체 **slug 동일 권장** (별도 mapping 불필요)

---

## 6. 중복 확인 결과

### 확인 대상

- `supabase/migrations/` 전체 (026~051)
- `supabase/seeds/`
- `src/data/occupations.ts`
- `src/data/quizData.ts`
- `src/data/roadmaps.ts`

### 발견된 중복 6건 및 대체 결과

| 원래 후보 | slug | 중복 사유 | 중복 위치 | 대체 후보 | 대체 slug |
|---|---|---|---|---|---|
| 응급구조사 | emergency-medical-technician | DB 존재 (의료·과학, migration 028) | migration 028 | 보호관찰관 | probation-officer |
| 방송 PD | broadcast-producer | DB 존재 (slug='pd-director', migration 026) | migration 026 | 영상 감독 | video-director |
| 기자 | journalist | DB 존재 (slug='journalist', migration 026) | migration 026 | 스포츠 해설가 | sports-commentator |
| 초등교사 | elementary-school-teacher | DB 존재 (slug='elementary-teacher', migration 026) | migration 026, 031 | 평생교육사 | lifelong-education-specialist |
| 데이터 분석가 | data-analyst | DB 존재 (slug='data-analyst', seeds/001) | seeds/001, migration 017 | 네트워크 엔지니어 | network-engineer |
| 정보보안전문가 | cybersecurity-specialist | DB 존재 (slug='cybersecurity-expert', migration 026, 031) | migration 026, 031 | 모바일 앱 개발자 | mobile-app-developer |

### 추가 주의 사항

- **스마트팜 전문가 (smart-farm-specialist):** DB에 없음 (migration 전수 검색 결과). `src/data/occupations.ts`와 `src/data/roadmaps.ts`에 static 데이터 존재. DB 추가 시 static 데이터와 정합성 확인 필요.
- **게임 기획자 (game-planner):** `game-developer` (게임 개발자, IT·기술)와 직무가 다름. game-planner는 콘텐츠·기획 직무로 콘텐츠·미디어 카테고리 적합. 중복 아님.
- **사회복지사 (social-worker):** 교육·사회 대체 후보 풀에 포함되어 있으나 DB에 이미 존재 (migration 026). 대체 풀 사용 시 제외 대상.

---

## 7. 053 migration 전 확인 사항

- [ ] OZ 1차 후보 23개 승인
- [ ] 각 후보 slug 최종 확정
- [ ] 카테고리 최종 확정
- [ ] 대표/세부 구분 확정 (전체 `is_representative=true` 예정)
- [ ] `is_representative=true` 기준 확인
- [ ] `legacy_occupation_id` 결정 (전체 slug 동일 권장)
- [ ] `occupation_summary` 작성 범위 확정 (easy_description / why_this_job / simple_future_outlook)
- [ ] `occupation_preparations` 작성 범위 확정 (최소 3개 이상)
- [ ] `quizData` 3문항 작성 범위 확정
- [ ] `occupation_goyo24_profile` source 정책 확정
- [ ] goyo24 실제 데이터와 manual 참고 데이터 구분 (15개 goyo24 가능, 8개 manual 권장)
- [ ] `roadmaps` 직접 작성 여부 또는 weekly mission fallback 사용 여부 확정 (스마트팜만 roadmaps.ts 존재)
- [ ] 053 migration 범위 확정 (occupation_master + summary + preparations 일괄 삽입 예정)
- [ ] 스마트팜 전문가 static → DB 동기화 시 occupations.ts id/category 정합성 재확인

---

## 8. 스마트팜 전문가 특이사항

스마트팜 전문가는 다른 22개 후보와 달리 이미 static 데이터가 존재한다.

| 항목 | 현재 상태 |
|---|---|
| `src/data/occupations.ts` | 존재 (`id: "smart-farm-specialist"`) |
| `src/data/roadmaps.ts` | 존재 (키: `"smart-farm-specialist"`) |
| `src/data/quizData.ts` | **없음 — 신규 작성 필요** |
| `supabase/migrations/` | **없음 — 053에서 추가 필요** |
| `occupation_goyo24_profile` | 없음 — manual 권장 (농촌진흥청 통계 참고) |

053 migration 작성 시 주의:
- `occupation_master` 삽입 시 slug / legacy_occupation_id = `'smart-farm-specialist'`
- `category = '환경·미래산업'`, `is_active = true`, `is_representative = true`
- `occupation_summary` / `occupation_preparations`는 occupations.ts 기존 static 데이터 기반으로 작성 가능

---

*이 문서는 DB 변경 없이 OZ 승인용으로 작성되었습니다.  
중복 확인 기준일: 2026-05-25. 승인 후 053 migration 작성으로 이어집니다.*
