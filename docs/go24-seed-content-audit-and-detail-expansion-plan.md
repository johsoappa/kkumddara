# 꿈따라 고용24 seed 콘텐츠 점검 및 직업 상세 확장 2단계 계획

> 작성일: 2026-06-03 · 기준 commit: `982e3f2` · 성격: **seed 콘텐츠 점검 및 설계 문서** (코드/UI/DB/migration 변경 없음)

## 1. 점검 목적

- 고용24/API 관련 seed 콘텐츠가 실제로 얼마나 존재하는지 확인
- 직업 상세 페이지에 바로 쓸 수 있는 데이터 선별
- 3단계 UI 확장 우선순위 결정

## 2. 점검 기준

- supabase/migrations seed/DDL 기준 + 소스 코드 기준
- **운영 DB 실데이터는 직접 조회하지 않음** (코드 기준 추정)
- 운영 DB 확인이 필요한 항목은 §8에 OZ 수동 SQL 후보로 별도 정리

## 3. 데이터별 seed 콘텐츠 현황

| 데이터 | seed 존재 여부 | 커버리지(코드 기준 추정) | 문구 품질 | UI 즉시 사용 가능성 | 판단 |
|---|---|---|---|---|---|
| `occupation_goyo24_profile.job_satisfaction` | **있음** (022 스키마 + 036/038/039/040/041/042/044/045 개별 + 051·054·056 일괄) | goyo24 프로파일 보유 직업 대부분(예: 74.0 등 numeric) | 양호(숫자, "직업만족도 N점"으로 변환) | **즉시 가능**(Goyo24InfoSection 1줄 + null fallback) | **P1** |
| `occupation_traits` | **없음** (015에서 테이블 DDL/인덱스/RLS만, INSERT 0건) | 0 (비어 있음) | — | 불가(데이터 없음) | **보류(선 seed 필요)** |
| `occupation_parent_questions` | **없음** (015 DDL만, INSERT 0건) | 0 | — | 불가 | **보류(선 seed 필요)** |
| `occupation_related_jobs` | **없음** (015 DDL만, INSERT 0건) | 0 | — | 불가 | **보류(선 seed 필요)** |
| `occupation_source_meta` | **없음** (015 DDL만, INSERT 0건) | 0 | — | 불가(+ RLS Tier1 anon 차단 — UI 비노출 설계) | **보류/비대상** |

> 핵심: `traits / parent_questions / related_jobs / source_meta`는 **테이블만 존재하고 seed가 전혀 없음**. 이 데이터에 의존하는 직업 상세 확장(어떤 힘이 필요한가요 / 부모와 나눠볼 질문 / 비슷한 직업)은 **데이터 seed가 선행되지 않으면 구현 불가**.
> 반면 `job_satisfaction`은 goyo24 프로파일에 이미 numeric 값으로 채워져 있어 **UI 노출만 추가하면 됨**.

## 4. 샘플 직업 커버리지 점검 (코드/seed 기준 추정)

| id | 직업명 | goyo24 | 만족도 | traits | parent_questions | related_jobs | source_meta | 판단 |
|---|---|---|---|---|---|---|---|---|
| counselor | 심리상담사 | ✅(051) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| nutritionist | 영양사 | ✅(051) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| product-manager | 프로덕트 매니저 | ✅(054) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| financial-planner | 재무 설계사 | ✅(054) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| life-science-researcher | 생명과학 연구원 | ✅(051) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| climate-data-analyst | 기후 데이터 분석가 | ✅(054) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| sports-data-analyst | 스포츠 데이터 분석가 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| youth-sports-coach | 유소년 스포츠 지도자 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| sports-content-planner | 스포츠 콘텐츠 기획자 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| exercise-prescription-specialist | 운동처방사 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| sports-safety-manager | 스포츠 안전관리자 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| sports-marketer | 스포츠 마케터 | ✅(056) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| accountant | 회계사 | ✅(051/기존) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| physical-therapist | 물리치료사 | ✅(051) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| interior-designer | 인테리어 디자이너 | ✅(051) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| after-school-teacher | 방과후 강사 | ✅(054) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |
| human-resources-specialist | 인사 전문가 | ✅(054) | ✅ | ❌ | ❌ | ❌ | ❌ | 만족도만 즉시 |

> 결론: 샘플 17개 모두 **goyo24 + job_satisfaction 보유, 나머지 4종 테이블은 전부 미보유(0건)**. 운영 DB 실수치는 §8 SQL로 OZ 확인 권장.

## 5. 직업 상세 확장 가능 항목

| 확장 항목 | 사용할 데이터 | 조건 | 우선순위 | 비고 |
|---|---|---|---|---|
| 직업만족도 1줄 | `job_satisfaction` | 데이터 충족 ✅ | **P1** | Goyo24InfoSection에 항목 추가, null fallback |
| 어떤 힘이 필요한가요 | `occupation_traits` | **seed 필요** | 보류 | 데이터 0건 |
| 부모와 나눠볼 질문 | `occupation_parent_questions` | **seed 필요** | 보류 | 데이터 0건 |
| 비슷한 직업도 살펴보기 | `occupation_related_jobs` | **seed 필요** | 보류 | 데이터 0건 (현재는 parent_occupation_id 자식만 사용 중) |
| 출처/신뢰도 표시 | `occupation_source_meta` | seed + RLS 검토 | 보류/비대상 | Tier1 anon 차단, UI 비노출 설계. 현재 Goyo24InfoSection은 profile.source로 출처 표기 중 |

## 6. 바로 구현 가능한 P1 후보

| 작업 | 구현 가능 여부 | 이유 | 예상 수정 파일 |
|---|---|---|---|
| 직업 상세 "참고 지표"에 직업만족도 1줄 추가 | **가능** | `job_satisfaction` numeric 값 다수 직업에 존재(051/054/056 등) | `src/components/explore/Goyo24InfoSection.tsx` (UI 1곳) |
| (선택) 명따라 추천 카드에 전망/만족도 근거 1줄 | 조건부 | goyo24 데이터는 있으나 카드가 정적 매핑이라 직업별 goyo24 조회 추가 필요 | `myeonddaraCareerLinks.ts` / `result/page.tsx` — 중간 범위 |

## 7. 보류해야 할 항목

| 항목 | 보류 이유 | 필요한 선행 작업 |
|---|---|---|
| 어떤 힘이 필요한가요 (traits) | `occupation_traits` seed 0건 | traits seed migration + 초등/학부모용 문구 작성 |
| 부모와 나눠볼 질문 (parent_questions) | `occupation_parent_questions` seed 0건 | parent_questions seed migration + 질문 문구 작성 |
| 비슷한 직업도 살펴보기 (related_jobs) | `occupation_related_jobs` seed 0건 + 연결 slug 검증 필요 | related_jobs seed + 최신 상세 보유 직업으로만 연결 |
| 출처/신뢰도 (source_meta) | seed 0건 + RLS Tier1(anon 차단) — UI 비노출 설계 | 노출 정책 재검토. 현재 profile.source 출처 표기로 충분 |

## 8. OZ 수동 확인이 필요한 SQL 후보

> ⚠️ 이번 작업에서 SQL을 실행하지 않음. OZ가 Supabase SQL Editor에서 직접 실행하여 운영 DB 실수치를 확인.

```sql
-- 전체 활성 직업 수
select count(*) from public.occupation_master where is_active = true;

-- goyo24 프로파일 / 직업만족도 보유 직업 수
select count(*) from public.occupation_goyo24_profile;
select count(*) from public.occupation_goyo24_profile where job_satisfaction is not null;

-- 미활용 4종 테이블 실제 데이터 보유 직업 수 (코드 기준 추정 0 → 운영 DB 확인)
select count(distinct occupation_id) from public.occupation_traits;
select count(distinct occupation_id) from public.occupation_parent_questions;
select count(distinct occupation_id) from public.occupation_related_jobs;
select count(distinct occupation_id) from public.occupation_source_meta;
```

> seed에 INSERT가 전혀 없으므로 위 4종은 **0으로 예상**되나, 외부 sync 배치로 별도 주입된 적이 있는지 OZ 확인 권장.

## 9. 3단계 권장 작업

1. **(P1, 즉시) 직업 상세 참고 지표에 "직업만족도" 1줄 추가** — `job_satisfaction` 데이터 충족, UI 1곳 수정, null fallback. 가장 작고 안전한 가치 추가.
2. **(보류 해제 선행) traits / parent_questions seed 작업** — "어떤 힘이 필요한가요" · "부모와 나눠볼 질문" 섹션의 전제. seed migration + 초등/학부모용 문구 작성이 별도 작업으로 필요.
3. **(P2) 명따라 추천 카드에 goyo24 전망/만족도 근거 1줄** — 데이터는 있으나 카드 정적 매핑에 직업별 goyo24 조회를 결합하는 중간 범위 작업.

## 10. 변경하지 않은 항목

- 소스 기능 로직 / UI 컴포넌트 / DB schema / Supabase migration / RLS / Auth / AI 호출·프롬프트 / 명따라 Phase 2 / 결제·쿠폰·PG / occupation_master 직접 수정 / 실제 사용자 데이터 — **변경 없음 (문서 점검 작업)**

## 11. 이력

| 날짜 | 내용 |
|---|---|
| 2026-06-03 | 고용24 seed 콘텐츠 점검 — job_satisfaction은 goyo24 프로파일에 다수 채워짐(P1 즉시 가능), traits/parent_questions/related_jobs/source_meta는 seed 0건(보류). 직업 상세 확장 3단계 우선순위 정리. 코드/UI/DB 변경 없음. |
