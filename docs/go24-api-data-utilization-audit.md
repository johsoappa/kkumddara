# 꿈따라 고용24/API 데이터 활용 현황 점검 및 확장 설계

> 작성일: 2026-06-03 · 기준 commit: `c67e893` · 성격: **현황 점검 및 설계 리포트** (코드/DB/API/UI 변경 없음)

## 1. 점검 목적

- 현재 고용24/API 또는 공공 직업 데이터가 어디에 저장되어 있고, 어디에 쓰이고 있는지 확인
- 저장되어 있으나 UI에 거의 안 쓰이는 데이터(미활용 후보) 식별
- 직업 상세·로드맵·명따라·부모 리포트·AI 상담으로의 확장 활용 후보 정리
- 유료화 전 서비스 가치·공공데이터 활용 근거 강화 방향 제안

---

## 2. 현재 데이터 구조

| 데이터/테이블/파일 | 역할 | 주요 필드 | 출처 추정 | 현재 상태 |
|---|---|---|---|---|
| `occupation_master` | 직업 기준 테이블 | slug, name_ko, emoji, category, interest_fields, legacy_occupation_id, is_active, priority, parent_occupation_id | 수동/sync 혼합 | 활용 높음 |
| `occupation_goyo24_profile` | **고용24 직업정보 API(D01) 핵심 데이터** | salary_lower/median/upper/survey_year, **job_satisfaction**, prospect_raw/label, related_majors[], source, synced_at | **고용24 API / manual** | 부분 활용 |
| `occupation_summary` | 직업 소개 문구 | content_type(one_liner / easy_description / why_this_job …) | 수동/생성 | 활용 중간 |
| `occupation_preparations` | 준비 활동 | prep_type(mission_hint / step_action), content, display_order | 수동 | 활용 중간 |
| `occupation_student_actions` | 학생 실천 미션(Stage) | stage_number, action_text, stage_title, action_type | 수동 seed | 활용 중간 |
| `occupation_traits` | 흥미·적성·성향 | (테이블 존재) | 수동/sync | **미사용(저장만)** |
| `occupation_parent_questions` | 학부모 대화 질문 | (테이블 존재) | 수동 | **미사용(저장만)** |
| `occupation_related_jobs` | 유사/관련 직업 | (테이블 존재) | 수동/sync | **미사용(저장만)** |
| `occupation_source_meta` | 출처 메타데이터 | (테이블 존재) | sync | **미사용(저장만)** |
| `occupation_sync_log` | 동기화 로그 | sync 이력 | sync 배치 | 운영 로그(비노출) |
| `src/data/occupations.ts` (OCCUPATIONS) | 정적 fallback 직업 | name, description, skills, relatedMajors(+universities), salaryMin/Max, growthRate, futureRating, preparations | 정적(수동) | static 모드 한정 활용 |
| `src/data/roadmaps.ts` (ROADMAPS) | 정적 로드맵 미션 | stages[].missions[] | 정적(수동) | 로드맵 fallback 활용 |

> 고용24 API 원천: `src/types/goyo24.ts`(L01 목록 / D01 상세 파싱), `src/app/admin/sync-careers` + 배치 스크립트로 `occupation_goyo24_profile`에 upsert. D01 원천 필드 = 임금(sal), 직업만족도(jobSatis), 고용전망(jobProspect), 관련학과(relMajorList), 직업분류명(jobLrcl/Mdcl/SmclNm).

---

## 3. 현재 UI 활용 현황

| 화면 | 사용 데이터 | 노출 방식 | 활용 수준 | 메모 |
|---|---|---|---|---|
| `/explore/[id]` (db 모드) | summary(one_liner/easy_description/why_this_job), preparations(mission_hint/step_action), **goyo24_profile**, 자식 직업(parent_occupation_id) | 소개·왜 이 직업·준비·"미래를 그리는 참고 지표"·관련 직업 | **높음** | 최신 상세 |
| `/explore/[id]` (static 폴백) | OCCUPATIONS(skills, relatedMajors+universities, salary, growthRate, futureRating, preparations) + QUIZ | 구형 5섹션 | 중간 | 구 화면. goyo24 미사용 |
| `Goyo24InfoSection` (참고 지표) | prospect_label/raw, related_majors, salary_* | 고용전망·관련학과·임금 참고 | **높음** | **job_satisfaction 미표시** |
| `/explore` 목록 | occupation_master + summary(one_liner) | 카드 목록 | 높음 | |
| `/student/home`·`/student/activity` | occupation_master + one_liner + student_actions/preparations | 추천 직업·오늘의 미션 | 중간 | goyo24/traits 미사용 |
| `/roadmap/[occupationId]` | preparations(step_action)·student_actions + ROADMAPS fallback | 단계 미션 | 중간 | 직무/역량 데이터 미반영 |
| `/report` (부모 리포트) | occupation_master(name/category/emoji), liked_occupations, occupation_student_actions(추천 활동) | 관심 직업·추천 활동 | 중간 | **goyo24/역량/전망 미반영** |
| `/myeonddara/result` | (직접 없음) → `/explore/[id]`로 연결 | 추천 직업 카드 | 중간 | 카드 자체엔 공공 데이터 근거 없음 |
| `/parent/counseling` (AI 상담) | 없음 | — | **미사용** | 프롬프트에 공공 직업 데이터 미주입 |

---

## 4. 미활용 또는 저활용 데이터 후보

| 데이터 | 현재 활용 | 확장 가능성 | 추천 우선순위 |
|---|---|---|---|
| `occupation_goyo24_profile.job_satisfaction` (직업만족도) | 저장만, 미표시 | 직업 상세 "참고 지표"에 1줄 추가 용이 | **P1** |
| `occupation_parent_questions` (학부모 질문) | 미사용 | 부모 리포트·직업 상세 "부모와 나눠볼 질문" | **P1** |
| `occupation_traits` (흥미·적성·성향) | 미사용 | 명따라 추천 근거 보강·직업 상세 "어떤 힘이 필요한가요" | **P1** |
| `occupation_related_jobs` (유사 직업) | 미사용(자식 직업만 사용) | 직업 상세 "비슷한 직업"·다음 탐색 카드 | P2 |
| `prospect_raw` 상세 비율(증가/유지/감소 %) | label/desc만 표시 | 상세 보기 확장(선택) | P3 |
| `occupation_source_meta` (출처 메타) | 미사용 | 신뢰도 표기 강화 | P3 |
| 직무 내용/하는 일(원천 D01엔 요약만, 서비스엔 why_this_job) | 일부 | 초등·학부모용 "이 직업은 어떤 일을 하나요" 변환 | P2 |

---

## 5. 직업 상세 확장 제안

| 확장 섹션 | 사용할 데이터 | 사용자 가치 | 우선순위 |
|---|---|---|---|
| 이 직업은 어떤 일을 하나요? | summary(easy_description/why_this_job) | 초등·학부모 이해 | P2(대부분 존재) |
| 어떤 힘이 필요한가요? | `occupation_traits` | 역량을 쉬운 말로 | **P1** |
| 어떤 과목/활동과 연결되나요? | goyo24 related_majors + traits | 중고등 탐색 힌트 | P2 |
| 앞으로의 변화는 어떤가요? | goyo24 prospect + **job_satisfaction** | 미래 참고 강화 | **P1** |
| 비슷한 직업은 무엇인가요? | `occupation_related_jobs` | 다음 탐색 유도 | P2 |
| 집에서 해볼 수 있는 작은 미션 | preparations(step_action) | 실천 연결 | 이미 활용 |
| 부모님과 나눠볼 질문 | `occupation_parent_questions` | 대화 도구 | **P1** |

> 원칙: 공공 데이터를 그대로 노출하지 않고 초등/학부모용 쉬운 문구로 변환. "추천 대학/취업 보장/평균 연봉" 금지 표현 유지.

---

## 6. 로드맵 확장 제안

| 공공 데이터 요소 | 로드맵 변환 방식 | 예시 | 우선순위 |
|---|---|---|---|
| 직무 내용 | 역할 체험 미션 | "이 직업이 하는 일 1가지 따라 해보기" | P2 |
| 필요 역량(traits) | 작은 연습 미션 | "○○ 역량을 키우는 활동 1개" | **P1** |
| 관련 학과(goyo24) | 중고등 탐색 힌트 | "관련 학과 1곳 찾아보기" | P2 |
| 관련 직업(related_jobs) | 다음 탐색 카드 | "비슷한 직업 1개 더 살펴보기" | P2 |
| 준비 활동(preparations) | 집에서 해볼 활동 | 이미 활용 | — |

> 현재 `roadmaps.ts` 미션은 수동 작성. 공공 데이터 기반 자동 생성은 별도 작업(대규모)으로 분리 권장.

---

## 7. 명따라 확장 제안

| 현재 명따라 요소 | 보강 가능 데이터 | 개선 방향 | 우선순위 |
|---|---|---|---|
| 추천 직업 카드(오행 성향 매핑) | goyo24 prospect / traits | 카드에 "이 직업이 보는 힘/전망" 1줄 근거 추가 | **P1** |
| 성향 단정 우려 | 공공 직업 데이터 | "성향 참고 + 공공 직업 데이터 기반 탐색" 구조로 표현 강화 | P1 |
| 연결 이유 | occupation_traits | 성향→역량 연결을 데이터로 뒷받침 | P2 |

> "사주에 맞는 직업" 금지 유지, "이 성향과 함께 살펴볼 수 있는 직업" 유지.

---

## 8. 부모 리포트 확장 제안

| 리포트 요소 | 보강 가능 데이터 | 학부모 가치 | 우선순위 |
|---|---|---|---|
| 이번 주 탐색 직업 | goyo24 prospect/related_majors | 직업 이해 심화 | **P1** |
| 이 직업의 중요한 역량 | occupation_traits | "무엇을 키우면 좋은지" 이해 | **P1** |
| 완료 미션 ↔ 직업 연결 | preparations/student_actions | 활동의 의미 부여 | P2 |
| 다음 대화 질문 | `occupation_parent_questions` | 가정 대화 도구 | **P1** |

---

## 9. AI 상담 확장 제안

| 상담 영역 | 활용 가능 데이터 | 기대 효과 | 주의사항 |
|---|---|---|---|
| 직업 세계 안내 | summary/traits/goyo24 prospect | 공공 데이터 근거 있는 답변 | 프롬프트 토큰·정확도 |
| 학년별 준비 방향 | preparations/student_actions | 실천 연결 | 단정 금지 |
| 관심 분야 탐색 | related_majors/related_jobs | 탐색 폭 확장 | 출처 표기 |
| 유료화 차별점 | 공공 데이터 기반 상담 | 일반 챗봇과 차별 | AI 호출/프롬프트 변경은 별도 작업 |

> 현재 `systemPrompt.ts`는 공공 직업 데이터를 주입하지 않음("직업 세계 안내"는 범위 문구만). 데이터 주입은 본 점검 범위 밖(설계 후보).

---

## 10. 유료화 전 우선 적용 후보

| 우선순위 | 작업 | 이유 | 예상 범위 |
|---|---|---|---|
| P1 | 직업 상세 "참고 지표"에 **직업만족도(job_satisfaction)** 1줄 추가 | 이미 저장됨, 변환만 | 소(Goyo24InfoSection 1곳) |
| P1 | 직업 상세에 **"부모와 나눠볼 질문"**(parent_questions) 섹션 | 대화 도구 가치 | 중(데이터 seed 확인 필요) |
| P1 | 직업 상세 **"어떤 힘이 필요한가요"**(traits) 섹션 | 역량 이해 | 중 |
| P1 | 명따라 추천 카드에 공공 데이터 기반 **연결 근거 1줄** | 사주 단정 완화 + 가치 | 소~중 |
| P2 | 부모 리포트에 탐색 직업의 역량/전망 요약 | 학부모 설득력 | 중 |
| P2 | 로드맵 미션에 필요 역량 연결 설명 | 미션 의미 강화 | 중~대 |

> 주의: P1 후보 중 traits/parent_questions는 **실제 seed 데이터 존재 여부 확인 필요**(테이블은 있으나 콘텐츠가 비어 있을 수 있음). 적용 전 별도 점검 권장.

---

## 11. 이번 점검에서 변경하지 않은 항목

- 소스 기능 로직 / UI 컴포넌트 / DB schema / Supabase migration / RLS / Auth / AI 호출 로직 / AI 프롬프트 / 명따라 Phase 2 / 결제·쿠폰·PG / occupation_master 직접 수정 / 실제 사용자 데이터 — **변경 없음 (문서 점검 작업)**

---

## 12. 다음 권장 작업

1. **직업 상세 공공 데이터 활용 확장** — job_satisfaction(소) → traits/parent_questions 섹션(중). 단, seed 데이터 존재 여부 선점검.
2. **명따라 추천 직업 카드 근거 보강** — 카드에 goyo24/traits 기반 연결 근거 1줄 추가(성향 단정 완화).
3. **부모 리포트 공공 데이터 요약 반영** — 탐색 직업의 역량/전망/대화 질문 요약.

---

## 13. 이력

| 날짜 | 내용 |
|---|---|
| 2026-06-03 | 고용24/API 데이터 활용 현황 점검 문서 생성. 공공 직업 데이터 활용 수준·미활용 후보(job_satisfaction/traits/parent_questions/related_jobs/source_meta) 정리, 직업 상세/로드맵/명따라/부모 리포트/AI 상담 확장 후보 정리. 코드/DB/API/AI/결제 변경 없음. |
| 2026-06-03 | (2단계) seed 콘텐츠 점검 결과 `docs/go24-seed-content-audit-and-detail-expansion-plan.md`로 분리 정리. **job_satisfaction = seed 다수 보유(P1 즉시), traits/parent_questions/related_jobs/source_meta = seed 0건(보류)** 확정. 3단계 우선순위: ① 직업만족도 1줄 ② traits/parent_questions seed 선행 ③ 명따라 카드 근거(P2). |
| 2026-06-03 | (3단계 P1 구현) 직업 상세 참고 지표에 직업만족도 1줄 추가(`Goyo24InfoSection`). 값 있을 때만 "N점" 표시. 미활용 후보 중 job_satisfaction 활용 시작. |
| 2026-06-03 | occupation_traits seed 설계 1단계 문서 생성(`docs/occupation-traits-seed-design-phase1.md`) — 역량 표준안 + 샘플 10개 직업 traits 초안. 보류였던 traits의 seed 작업 선행 설계 시작. seed/UI 변경 없음. |
