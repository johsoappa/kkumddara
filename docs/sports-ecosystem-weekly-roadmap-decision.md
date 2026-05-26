# 꿈따라 스포츠 생태계 10개 직업 weekly roadmap 직접 작성 여부 검토

> 작성일: 2026-05-26  
> 최종 업데이트: 2026-05-27 — P1 5개 직접 작성 완료 (commit: Add roadmaps for priority sports ecosystem occupations)  
> 상태: **C안 실행 완료** — P1 5개 `roadmaps.ts` 직접 작성 완료 / P2 5개 fallback 유지  
> 관련 문서: [`docs/sports-interest-career-expansion-design.md`](./sports-interest-career-expansion-design.md)  
> 관련 문서: [`docs/sports-interest-selector-ux-design.md`](./sports-interest-selector-ux-design.md)  
> 관련 문서: [`docs/occupation-100-expansion-plan.md`](./occupation-100-expansion-plan.md)  
> 관련 문서: [`docs/sports-athlete-occupation-policy.md`](./sports-athlete-occupation-policy.md)

---

## 1. 작업 목적

꿈따라 스포츠 생태계 10개 직업에 대해 `roadmaps.ts` 정적 데이터를 직접 작성할지, 기존 AI 생성 + fallback 구조를 유지할지 검토하고 정책 방향을 결정한다.

이 문서는 **정책 검토 문서**다.

- 이번 작업에서 `roadmaps.ts`를 직접 수정하지 않는다.
- DB를 변경하지 않는다.
- `src/` 코드 변경을 수행하지 않는다.
- 다음 단계 작업지시서 작성의 기반 자료로 사용한다.

---

## 2. 현재 구현 상태

### 2-1. weekly roadmap 미션 동작 구조

```
GET /api/roadmap/weekly-missions
 ├─ weekly_roadmap_missions 테이블 조회 (저장된 미션)
 │   └─ 있으면 즉시 반환 (source: "ai")
 ├─ 없으면 OpenAI로 주간 미션 2개 생성 (최대 2회 시도)
 │   └─ 성공 시 DB 저장 후 반환 (source: "ai")
 └─ OpenAI 실패 시 정적 roadmaps.ts fallback 사용 (source: "fallback" | "static")
```

- 정상 경로: AI 생성 → DB 저장 → 재사용
- fallback 경로: `src/data/roadmaps.ts`의 `getRoadmap(occupationSlug)` 반환값 사용
- `source` 필드 타입: `"ai" | "fallback" | "static"` (`src/types/roadmap.ts`)

### 2-2. 스포츠 생태계 10개 직업 현재 상태

| 직업명 | slug | roadmaps.ts 등록 | 비고 |
|---|---|:---:|---|
| 스포츠 데이터 분석가 | `sports-data-analyst` | ✅ 직접 작성 완료 (P1) | 2026-05-27 추가 |
| 스포츠 테크 개발자 | `sports-tech-developer` | ❌ 없음 (P2) | AI 생성 또는 generic fallback 유지 |
| 운동처방사 | `exercise-prescription-specialist` | ✅ 직접 작성 완료 (P1) | 2026-05-27 추가 |
| 스포츠 콘텐츠 기획자 | `sports-content-planner` | ✅ 직접 작성 완료 (P1) | 2026-05-27 추가 |
| 스포츠 마케터 | `sports-marketer` | ❌ 없음 (P2) | AI 생성 또는 generic fallback 유지 |
| 유소년 스포츠 지도자 | `youth-sports-coach` | ✅ 직접 작성 완료 (P1) | 2026-05-27 추가 |
| 아웃도어 레저 기획자 | `outdoor-leisure-planner` | ❌ 없음 (P2) | AI 생성 또는 generic fallback 유지 |
| 해양레저 전문가 | `marine-leisure-specialist` | ❌ 없음 (P2) | AI 생성 또는 generic fallback 유지 |
| 스포츠 안전관리자 | `sports-safety-manager` | ✅ 직접 작성 완료 (P1) | 2026-05-27 추가 |
| 수상안전요원 | `water-safety-lifeguard` | ❌ 없음 (P2) | AI 생성 또는 generic fallback 유지 |

> **2026-05-27 기준:** P1 5개 직접 작성 완료. P2 5개는 fallback 유지. `roadmaps.ts`에 5개 entry 추가됨.

---

## 3. 정책 3안 비교

### A안: fallback 유지 — 직접 작성 없음

**개요:** 현 상태를 유지한다. AI가 weekly 미션을 생성하고, AI 실패 시 generic fallback 텍스트를 사용한다.

**장점:**
- 추가 작업 없음 — 즉시 운영 가능
- AI 생성 미션이 직업별로 적절하게 개인화됨
- OpenAI 호출이 정상 작동하는 환경에서는 품질 문제 없음

**단점:**
- OpenAI 비용 발생 (호출당 과금)
- AI 실패 시 generic fallback 텍스트 품질 낮음 — 스포츠 생태계 직업 특성 미반영
- 서비스 초기 사용자(weekly_roadmap_missions DB가 비어 있는 상태)는 항상 AI 호출 발생
- 스포츠 직업군 특유의 구체적 준비 활동(예: "경기 기록 직접 작성해보기", "줄넘기 수업 보조 체험")이 AI 생성 텍스트에 반영되지 않을 수 있음

**적합한 상황:** 운영 중 트래픽이 낮거나, AI 품질이 검증된 경우

---

### B안: 10개 전부 직접 작성

**개요:** 스포츠 생태계 10개 직업 모두에 대해 `roadmaps.ts`에 정적 weekly roadmap 데이터를 직접 작성한다.

**장점:**
- OpenAI fallback 없이도 일관된 품질 보장
- 스포츠 직업 특성에 맞는 구체적 준비 활동 제시 가능
- 네트워크/AI 장애 시에도 안정적 동작

**단점:**
- 10개 직업 × 3단계(탐색·실력·전문가) 기준 상당한 작성 분량
- 직접 작성한 정적 데이터는 AI 생성 대비 개인화 수준 낮음
- 우선순위 낮은 직업(해양레저 전문가, 아웃도어 레저 기획자 등)에도 즉시 투자 필요
- 현재 운영 중인 fallback 구조가 이미 안전망 역할을 하고 있어 긴급도 낮음

**적합한 상황:** 10개 직업 모두 주요 사용자 진입 경로에 있고, AI 비용이 과다한 경우

---

### C안: P1 5개 우선 직접 작성 (1차 권장안)

**개요:** 사용자 접근 빈도와 스포츠 생태계 내 연결성이 높은 5개 직업만 우선 직접 작성하고, 나머지 5개는 기존 AI + fallback 구조를 유지한다.

**P1 — 우선 직접 작성 대상 5개:**

| 직업명 | slug | 선정 이유 |
|---|---|---|
| 스포츠 데이터 분석가 | `sports-data-analyst` | 8개 관심 운동과 연결 — 가장 광범위한 진입점. 데이터 분석 관심 아이 핵심 직업 |
| 유소년 스포츠 지도자 | `youth-sports-coach` | 8개 관심 운동과 연결 — 코칭·교육 방향 최다 연결. 부모가 가장 친숙한 직업 유형 |
| 스포츠 콘텐츠 기획자 | `sports-content-planner` | 8개 관심 운동과 연결 — 미디어·창작 관심 아이와 스포츠 교차점. 접근 경로 다양 |
| 운동처방사 | `exercise-prescription-specialist` | 8개 관심 운동과 연결 — 의료·과학 + 스포츠 교차. 준비 활동 구체화 용이 |
| 스포츠 안전관리자 | `sports-safety-manager` | 8개 관심 운동과 연결 — 공공·안전 + 스포츠. 학교 체육 연계 준비 활동 구체화 용이 |

> P1 5개는 모두 **8개 이상의 관심 운동과 연결**되어 있어 사용자 진입 빈도가 상대적으로 높다.

**P2 — fallback 유지 대상 5개:**

| 직업명 | slug | 이유 |
|---|---|---|
| 스포츠 테크 개발자 | `sports-tech-developer` | IT·기술 카테고리 내 기존 로드맵 커버리지 있음. 긴급도 낮음 |
| 스포츠 마케터 | `sports-marketer` | 비즈니스·경영 카테고리 유사 직업 fallback 활용 가능 |
| 수상안전요원 | `water-safety-lifeguard` | 연결 관심 운동 2개(수영·아웃도어)로 진입량 상대적 낮음 |
| 아웃도어 레저 기획자 | `outdoor-leisure-planner` | 연결 관심 운동 1개(아웃도어)로 진입량 낮음 |
| 해양레저 전문가 | `marine-leisure-specialist` | 연결 관심 운동 2개(수영·아웃도어)로 진입량 상대적 낮음 |

**장점:**
- 투자 대비 효과가 높은 직업에 집중
- 10개 전부 즉시 작성 대비 작업량 절반
- P2는 AI 생성 품질이 충분히 수용 가능한 직업군
- 운영 후 실제 사용 데이터 확인 후 P2 작성 여부 재결정 가능

**단점:**
- P1/P2 구분 기준이 추후 달라질 수 있음
- P2 직업 사용자에게 여전히 AI 비용 발생

---

## 4. 1차 권장안: C안

**선택 이유:**
1. P1 5개 직업이 10개 관심 운동 중 8개와 연결되어 있어 실질적 사용자 도달 범위를 충분히 커버한다.
2. 스포츠 생태계 특성상 초등·중등 아이들이 "스포츠 데이터 분석가", "유소년 스포츠 지도자", "운동처방사"로 자주 진입할 것으로 예상된다.
3. P2 직업은 AI 생성 미션도 직업 특성을 일정 수준 반영하므로 즉시 투자 대비 효과가 낮다.
4. B안(전부 직접 작성)은 현 MVP 단계에서 과도한 선행 투자다.

---

## 5. roadmaps.ts 직접 작성 시 품질 기준

P1 직접 작성 시 아래 기준을 준수한다.

### 5-1. 단계 구성 (3단계 고정)

| 단계 | 키 | 한국어 레이블 | 주간 미션 방향 |
|---|---|---|---|
| 1단계 | `current` | 탐색하기 | 직업 이해, 관련 콘텐츠 접근, 간단한 체험 |
| 2단계 | `next` | 실력 키우기 | 준비 활동 심화, 관련 기술/지식 학습 |
| 3단계 | `future` | 전문가 되기 | 실무 연결, 자격·경험 탐색 |

### 5-2. 미션 작성 원칙

- 각 단계당 주간 미션 2개 기준으로 작성
- 초등·중등 수준에서 실제로 해볼 수 있는 활동 중심
- 부모와 아이가 함께 할 수 있는 항목 포함
- **금지 표현:** "선수가 못 되면", "실패하면", "대체 직업", "프로가 안 되면", "어쩔 수 없이"
- 스포츠 직업 특유의 구체적 활동 포함 (예: 경기 기록 직접 해보기, 지도 현장 참관)

### 5-3. 데이터 구조 예시 (roadmaps.ts 형식)

```typescript
"sports-data-analyst": {
  current: [
    { title: "경기 기록 직접 해보기", description: "좋아하는 팀의 경기를 보면서 득점, 실점, 주요 장면을 메모해보세요." },
    { title: "스포츠 데이터 분석 유튜브 찾아보기", description: "스포츠 통계·데이터 분석을 소개하는 영상 1개를 부모님과 함께 봐요." },
  ],
  next: [
    { title: "스프레드시트로 경기 기록 정리하기", description: "엑셀이나 구글 시트를 활용해 2주 동안 경기 결과를 표로 만들어보세요." },
    { title: "좋아하는 선수 시즌 성적 비교하기", description: "두 선수의 시즌 성적을 찾아 간단하게 비교 분석 자료를 만들어보세요." },
  ],
  future: [
    { title: "스포츠 통계 공개 데이터 탐색하기", description: "KBO, K리그 등 공식 기록 사이트에서 공개 통계를 찾아 분석해보세요." },
    { title: "데이터 분석 관련 자격·진학 경로 찾아보기", description: "통계학과, 컴퓨터과학과 등 관련 전공 정보를 부모님과 함께 탐색해보세요." },
  ],
},
```

---

## 6. 다음 단계 액션

| 단계 | 내용 | 담당 | 상태 |
|---|---|---|---|
| 1 | P1 5개 직업 weekly roadmap 직접 작성 (`roadmaps.ts` 수정) | 크라 | 대기 |
| 2 | tsc --noEmit + next build 통과 확인 | 크라 | 대기 |
| 3 | `/roadmap/[id]` 화면에서 P1 5개 직업 로드맵 표시 smoke test | 크라 | 대기 |
| 4 | P2 5개 직업 작성 여부 — 실제 사용 데이터 확인 후 재결정 | OZ.대표 | 대기 |

---

## 7. 영향 범위

| 항목 | 영향 |
|---|---|
| `src/data/roadmaps.ts` | 이번 검토 단계에서 미수정. P1 직접 작성 시 변경 대상 |
| `src/app/api/roadmap/weekly-missions/route.ts` | 변경 없음 — fallback 로직 그대로 활용 |
| DB `weekly_roadmap_missions` | 변경 없음 |
| `src/data/sportsInterestData.ts` | 변경 없음 |
| 인증/권한/RLS | 영향 없음 |
| 기존 직업 roadmap 데이터 | 영향 없음 |

---

## 8. 관련 정책 원칙 재확인

- **운동 종목 ≠ 직업:** 축구, 줄넘기, 수영은 직업이 아니라 진로 탐색의 출발점. `roadmaps.ts`에 종목명으로 키를 만들지 않는다.
- **금지 표현 준수:** weekly roadmap 미션 텍스트에서도 부정적 표현 사용 금지.
- **MVP 단순성 우선:** 필요 이상의 단계 세분화, 개인화 로직 추가 없음. 정적 2개 미션 구조 유지.
- **스포츠 안전관리자 명칭:** `sports-safety-manager` slug와 한국어명 "스포츠 안전관리자"로 통일 (occupation_master 기준).

---

*이 문서는 정책 검토 목적으로 작성된 문서입니다. 실제 `roadmaps.ts` 수정은 별도 작업지시서에서 진행합니다.*
