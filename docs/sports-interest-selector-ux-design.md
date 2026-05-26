# 꿈따라 관심 운동 선택 화면 UX 설계안

> 작성일: 2026-05-26  
> 보정일: 2026-05-26 (실제 페이지 구현 완료, smoke test PASS); 2026-05-26 (운동선수 직업군 정책 문서 연결); 2026-05-26 (weekly roadmap 검토 문서 연결)
> 상태: UX 설계 완료 + 실제 구현 완료  
> 관련 문서: [`docs/sports-interest-career-expansion-design.md`](./sports-interest-career-expansion-design.md)  
> 관련 문서: [`docs/sports-athlete-occupation-policy.md`](./sports-athlete-occupation-policy.md) — 운동선수 직업군 추가 여부 정책 검토  
> 관련 문서: [`docs/sports-ecosystem-weekly-roadmap-decision.md`](./sports-ecosystem-weekly-roadmap-decision.md) — weekly roadmap 직접 작성 여부 검토  
> 관련 데이터: [`src/data/sportsInterestData.ts`](../src/data/sportsInterestData.ts)

---

## 1. 작업 목적

꿈따라에서 아이가 좋아하는 운동을 직접 선택하고, 해당 운동과 연결된 다양한 직업군을 탐색할 수 있는 UX를 설계한다.

현재 `/explore/[id]` 상세 화면에는 이미 관심 운동 기반 연결 직업 섹션이 구현되어 있다.  
이번 설계는 그 다음 단계로, 사용자가 직업 상세에서 우연히 연결 직업을 보는 것을 넘어, 처음부터 "좋아하는 운동"을 출발점으로 직업을 탐색할 수 있는 화면 구조를 설계하는 것이다.

**핵심 메시지:**

```
좋아하는 운동을 출발점으로 더 넓은 직업을 살펴볼 수 있어요.
```

**예시 흐름:**

1. 아이가 좋아하는 운동 선택
2. 대표 꿈 확인
3. 연결 직업군 확인
4. 관심 있는 직업 상세 페이지로 이동
5. 추후 명따라/로드맵/퀴즈와 연결 가능성 검토

---

## 2. 현재 구현 상태

| 항목 | 상태 |
|---|---|
| 대표 직업 100개 | ✅ 완료 |
| occupation_master 전체 | 114개 |
| 스포츠 진로 생태계 10개 직업 | ✅ 완료 |
| 스포츠 진로 생태계 quizData | ✅ 완료 |
| `src/data/sportsInterestData.ts` | ✅ 완료 (2026-05-26) |
| `/explore/[id]` 관심 운동 연결 섹션 | ✅ 구현 완료 (2026-05-26) |
| `/explore/[id]` smoke test | ✅ PASS (2026-05-26) |
| 관심 운동 선택 화면 UX 설계 | ✅ 완료 (2026-05-26) |
| 관심 운동 선택 화면 실제 구현 | ✅ 완료 (2026-05-26) |
| `/explore/interests/sports` smoke test | ✅ PASS (2026-05-26) |

**현재 구현 완료된 컴포넌트:**

```text
src/components/explore/SportsInterestCareerSection.tsx   ← /explore/[id] 내 섹션
src/components/explore/SportsInterestSelector.tsx        ← 관심 운동 선택 화면 (신규)
```

**현재 구현 완료된 페이지:**

```text
src/app/explore/interests/sports/page.tsx   ← 관심 운동 선택 화면 (신규)
```

**`/explore` 메인 CTA 추가:**

```text
src/app/explore/page.tsx   ← "좋아하는 운동으로 직업 찾기" CTA 배너 추가
```

**현재 사용 중인 정적 데이터:**

```text
src/data/sportsInterestData.ts
```

---

## 3. UX 핵심 메시지

**화면 제목:**

```text
좋아하는 운동으로 찾는 직업
```

**섹션 설명 문구 (권장):**

```text
운동을 좋아한다고 해서 꼭 선수만 길은 아니에요.
경기를 분석하고, 가르치고, 안전하게 운영하고, 콘텐츠로 전하는
다양한 직업을 함께 살펴보세요.
```

**대체 문구:**

```text
좋아하는 운동을 출발점으로, 관련된 여러 직업을 탐색해볼 수 있어요.
```

**금지 문구:**

- ❌ `선수가 못 되면`
- ❌ `실패하면`
- ❌ `운동선수 대신`
- ❌ `대체 직업`

**설계 원칙:**

1. 운동 종목은 직업이 아니라 관심 분야로 다룬다.
2. 축구선수, 야구선수, 줄넘기 선수 등은 대표 꿈 예시로만 보여준다.
3. 실제 연결은 기존 occupation slug가 있는 직업으로만 연결한다.
4. 아이가 좋아하는 운동을 부정하지 않고, 진로를 넓혀주는 방향으로 안내한다.
5. 학부모 입장에서는 "운동을 좋아하는 것도 진로 탐색의 출발점이 될 수 있다"는 메시지를 받게 한다.
6. MVP에서는 복잡한 추천 알고리즘 없이 `sportsInterestData.ts` 정적 데이터를 활용하는 구조로 설계한다.

---

## 4. URL 구조 후보

| 후보 URL | 장점 | 단점 | 판단 |
|---|---|---|---|
| `/explore/sports-interests` | explore 하위라 자연스러움 | `/explore/[id]` 동적 라우트와 충돌 가능성 확인 필요 | ⚠️ 충돌 검토 필요 |
| `/explore/interests/sports` | 구조적으로 명확, 동적 라우트 충돌 없음 | 라우팅이 조금 깊음 | ✅ 추천 |
| `/sports-interests` | 독립 페이지로 명확 | 기존 explore 흐름과 분리됨 | 보류 |
| `/student/interests/sports` | 학생 홈과 연결 좋음 | 로그인/권한 고려 필요 | 후순위 |

**권장 URL:**

```text
/explore/interests/sports
```

**라우팅 충돌 주의:**  
현재 `/explore/[id]` 동적 라우트가 존재하므로 `/explore/sports-interests`는 `sports-interests`가 직업 slug로 처리될 수 있다.  
Next.js App Router 기준으로 정적 세그먼트(`interests`)가 동적 세그먼트(`[id]`)보다 우선 처리되므로 `/explore/interests/sports` 구조가 안전하다.

**구현 전 확인 사항:**

```text
[ ] /explore/interests/sports 라우트가 /explore/[id]와 충돌하지 않는지 확인
[ ] /explore/interests/sports 진입 시 직업 상세 로직이 실행되지 않는지 확인
```

---

## 5. 화면 구성안

### 5-1. 진입 위치

| 위치 | 진입 문구 | 우선순위 |
|---|---|---:|
| `/explore` 상단 또는 카테고리 하단 | 좋아하는 운동으로 직업 찾기 | 1 |
| `/explore/[id]` 관심 운동 연결 섹션 하단 | 운동별 직업 더 보기 | 2 |
| 학생 홈 | 좋아하는 운동으로 진로 탐색하기 | 3 |
| 명따라 결과 화면 | 운동 관심이 있다면 함께 볼 직업 | 4 |
| 로드맵 페이지 | 이 직업과 연결된 관심 운동 보기 | 5 |

**MVP 1차 구현 권장 진입 위치:**

```text
/explore 페이지 내부 섹션 또는 별도 /explore/interests/sports 페이지
```

### 5-2. 상단 히어로 영역

| 요소 | 내용 |
|---|---|
| 배지 | 관심 운동 진로 탐색 |
| 제목 | 좋아하는 운동으로 찾는 직업 |
| 설명 | 운동을 좋아한다고 해서 꼭 선수만 길은 아니에요. 좋아하는 운동을 출발점으로 다양한 직업을 살펴보세요. |
| 보조 문구 | 축구, 야구, 줄넘기, 수영, e스포츠까지 관심 운동을 선택해보세요. |

### 5-3. 관심 운동 카드 그리드

10개 관심 운동을 카드로 표시한다.

**카드 요소:**

| 요소 | 내용 |
|---|---|
| 아이콘/이모지 | ⚽ ⚾ 🏀 등 (섹션 7 참조) |
| 관심 운동명 | 축구 |
| 대표 꿈 | 축구선수 |
| 설명 | 1~2줄 (sportsInterestData.description 활용) |
| 연결 직업 수 | 예: 연결 직업 7개 |
| 버튼 | 연결 직업 보기 |

**카드 표시 순서:**

| 순서 | 관심 운동 | 대표 꿈 | 연결 직업 수 |
|---:|---|---|---:|
| 1 | 축구 ⚽ | 축구선수 | 7 |
| 2 | 야구 ⚾ | 야구선수 | 7 |
| 3 | 농구 🏀 | 농구선수 | 7 |
| 4 | 배구 🏐 | 배구선수 | 6 |
| 5 | 수영 🏊 | 수영선수 | 6 |
| 6 | 태권도·무도 🥋 | 태권도 선수 | 6 |
| 7 | 줄넘기 🪢 | 줄넘기 선수 | 6 |
| 8 | 골프 ⛳ | 골프선수 | 7 |
| 9 | e스포츠 🎮 | e스포츠 선수 | 6 |
| 10 | 캠핑·등산·아웃도어 🏕️ | 아웃도어 활동가 | 7 |

### 5-4. 선택 방식

MVP에서는 **단일 선택 방식**으로 설계한다.

| 방식 | 판단 |
|---|---|
| 단일 운동 선택 | ✅ 추천 |
| 다중 운동 선택 | 후순위 |
| 검색 | 후순위 |
| 필터 | 후순위 |

단일 선택 이유:
- UX가 단순하고 아이가 즉시 이해할 수 있다.
- 구현 난이도가 낮다.
- `sportsInterestData.ts` 구조와 잘 맞는다.

페이지 이동 없이 **같은 화면에서 선택 상태를 바꾸는 구조**를 권장한다.

---

## 6. 관심 운동 카드 구조

### 6-1. 카드 UI 요소

```text
┌─────────────────────────────────┐
│ ⚽  축구                         │
│ 대표 꿈: 축구선수                  │
│ 경기를 뛰고, 팀워크와 전략을...     │
│ 키워드: 팀워크 · 경기 · 전략        │
│ 연결 직업 7개                     │
│            [연결 직업 보기]        │
└─────────────────────────────────┘
```

### 6-2. 카드 데이터 출처

| 요소 | 데이터 필드 |
|---|---|
| 이모지 | `SPORTS_EMOJI_MAP[slug]` (컴포넌트 내 상수) |
| 관심 운동명 | `sportsInterestData.nameKo` |
| 대표 꿈 | `sportsInterestData.representativeDream` |
| 설명 | `sportsInterestData.description` |
| 키워드 | `sportsInterestData.keywords` |
| 연결 직업 수 | `sportsInterestData.careerLinks.length` |

### 6-3. 선택 상태

선택된 카드는 시각적으로 강조한다 (예: border-brand-red, 배경 변경).  
선택하지 않은 카드는 흐리게 처리하거나 기본 스타일 유지.

---

## 7. 선택 후 연결 직업 표시 구조

운동 카드 선택 후 아래 정보를 동일 화면 하단에 표시한다.

### 7-1. 상단 요약 영역

| 요소 | 내용 |
|---|---|
| 선택한 운동 이모지 + 이름 | ⚽ 축구 |
| 대표 꿈 표시 | 대표 꿈: 축구선수 |
| 운동 설명 | sportsInterestData.description |
| 키워드 칩 | 팀워크 · 경기 · 전략 |

### 7-2. 연결 직업 카드 목록

| 요소 | 내용 |
|---|---|
| 직업명 | 스포츠 데이터 분석가 |
| 연결 유형 | 분석 / 지도 / 건강 / 콘텐츠 등 (`careerLinks.relationType`) |
| 연결 이유 | 축구 경기 흐름과 선수 움직임을 데이터로 살펴보는 직업입니다. (`careerLinks.reason`) |
| 이동 버튼 | 직업 상세 보기 → `/explore/${occupationSlug}` |

**연결 직업 카드 사용 데이터:**

```ts
// careerLinks 항목당 사용하는 필드
occupationSlug   // 라우팅에 사용
relationType     // 연결 유형 표시
label            // 직업 연결 방향 레이블
reason           // 연결 이유 문구
```

**주의:**
- 존재하지 않는 occupationSlug는 표시하지 않는다.
- 축구선수, 야구선수 같은 대표 꿈은 아직 occupationSlug가 없으므로 링크로 만들지 않는다.
- 대표 꿈은 카드 상단 안내 문구로만 보여준다.

### 7-3. CTA

```text
직업 상세 보기 →  (→ /explore/${occupationSlug})
```

---

## 8. 줄넘기 UX 강조

줄넘기는 꿈따라 타깃(초등학생)에 잘 맞는 관심 운동으로 별도 설계 포인트를 문서화한다.

**카드 설명 문구 예시:**

```text
줄넘기는 학교와 일상에서 쉽게 접할 수 있는 운동이에요.
체력, 리듬감, 순발력, 꾸준함을 기르는 활동이기도 해요.
```

**연결 직업 예시:**

| 연결 방향 | 직업 | slug |
|---|---|---|
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 방과후 활동 | 방과후 강사 | after-school-teacher |
| 건강·체력 | 운동처방사 | exercise-prescription-specialist |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 안전 | 스포츠 안전관리자 | sports-safety-manager |
| 데이터·기록 | 스포츠 데이터 분석가 | sports-data-analyst |

**줄넘기 UX 주의:**
- 줄넘기를 단순 놀이로만 표현하지 않는다.
- 음악줄넘기, 리듬줄넘기, 학교 체육, 방과후 활동과의 연결을 강조한다.
- `육상선수`는 포함하지 않는다.
- `after-school-teacher` slug는 migration 053에서 확인된 slug다.

---

## 9. e스포츠 UX 주의

e스포츠는 아이 관심도가 높지만 표현에 주의한다.

**권장 표현:**

```text
e스포츠는 전략, 팀워크, 집중력, 데이터 분석, 콘텐츠 기획과 연결해서 탐색할 수 있어요.
```

**금지 표현:**

- ❌ `게임을 오래 하면 좋아요.`
- ❌ `게임만 잘하면 됩니다.`
- ❌ `프로게이머가 되면 성공합니다.`

**e스포츠 연결 직업:**

| 방향 | 직업 | slug |
|---|---|---|
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 안전·생활관리 | 스포츠 안전관리자 | sports-safety-manager |

**표현 원칙:**
- 게임 중독을 부추기는 표현을 피한다.
- 집중력, 전략, 팀워크, 콘텐츠, 기술, 건강 관리 관점으로 표현한다.

---

## 10. 데이터 사용 기준

이번 UX는 아래 데이터만 사용한다.

```text
src/data/sportsInterestData.ts
```

**사용 가능 helper 함수:**

```ts
// 특정 slug의 관심 운동 데이터 조회
getSportsInterestBySlug(slug: string): SportsInterestItem | undefined

// 특정 직업과 연결된 관심 운동 목록 조회 (현재 SportsInterestCareerSection에서 사용 중)
getSportsInterestsByOccupationSlug(occupationSlug: string): SportsInterestItem[]

// 특정 관심 운동의 연결 직업군 조회 (이번 새 화면에서 사용 권장)
getRelatedOccupationsBySportSlug(slug: string): SportsInterestCareerLink[]
```

**이번 새 화면에서 주로 사용할 함수:**

```ts
// 사용자가 운동을 선택하면:
const interest = getSportsInterestBySlug(selectedSlug);
const relatedOccupations = getRelatedOccupationsBySportSlug(selectedSlug);
```

**금지 사항:**
- DB 직접 조회 없음
- 신규 API 없음
- Supabase query 추가 없음
- `sportsInterestData.ts` 수정 없음 (구현 단계에서도 데이터 변경 없이 사용)

---

## 11. 예상 컴포넌트 구조

이번 작업에서는 구현하지 않지만, 향후 구현 파일 후보를 문서화한다.

### 11-1. 권장 컴포넌트 구조

```text
src/
├── app/
│   └── explore/
│       └── interests/
│           └── sports/
│               └── page.tsx          ← 관심 운동 선택 화면 페이지
└── components/
    └── explore/
        ├── SportsInterestCareerSection.tsx   ← 기존 (직업 상세 내 섹션)
        └── SportsInterestSelector.tsx        ← 신규 (운동 선택 화면 컴포넌트)
```

### 11-2. `SportsInterestSelector.tsx` 역할

- 10개 관심 운동 카드 그리드 렌더링
- 선택 상태 관리 (`useState<SportsInterestSlug | null>`)
- 선택된 운동의 연결 직업 목록 표시
- `/explore/${occupationSlug}` 이동 처리

### 11-3. `page.tsx` 역할

```tsx
// src/app/explore/interests/sports/page.tsx
"use client"

import SportsInterestSelector from "@/components/explore/SportsInterestSelector";

export default function SportsInterestsPage() {
  return (
    <main>
      <SportsInterestSelector />
    </main>
  );
}
```

---

## 12. 구현 전 확인 사항

| 확인 항목 | 내용 |
|---|---|
| 라우팅 충돌 | `/explore/interests/sports`가 `/explore/[id]`와 충돌하지 않는지 확인 |
| 타입 안전성 | `SportsInterestSlug` 타입 기반 선택 상태 관리 |
| 접근성 | 운동 카드 버튼에 `aria-label` 또는 `aria-pressed` 적용 |
| 금지 표현 | "선수가 못 되면", "실패하면", "대체 직업" 없는지 최종 확인 |
| 대표 꿈 처리 | 대표 꿈(예: 축구선수)은 링크 생성 없이 텍스트 표시만 |
| 모바일 레이아웃 | 카드 그리드 모바일에서 2열 또는 1열로 줄어드는지 확인 |
| 빌드 통과 | `npx tsc --noEmit`, `npm run build` 통과 |

**구현 전 반드시 확인할 명령:**

```bash
# 라우팅 충돌 확인
ls src/app/explore/

# 타입 확인
npx tsc --noEmit

# 빌드 확인
npm run build
```

---

## 13. 후속 작업 제안

| 우선순위 | 작업 | 내용 |
|---|---|---|
| 1 | 관심 운동 선택 화면 구현 | `/explore/interests/sports` 페이지 + `SportsInterestSelector.tsx` 컴포넌트 — ✅ 완료 (2026-05-26) |
| 2 | `/explore` 메인에서 진입 CTA 추가 | "좋아하는 운동으로 직업 찾기" 버튼 또는 섹션 — ✅ 완료 (2026-05-26) |
| 3 | 운동선수 직업군 추가 여부 정책 결정 | ✅ 정책 문서 작성 완료 (2026-05-26) — **현 단계 미추가 유지 (A안 + 검색 UX 보완)** → [`docs/sports-athlete-occupation-policy.md`](./sports-athlete-occupation-policy.md) |
| 4 | **검색 UX 보완** | ✅ 완료 (2026-05-26) — `/explore` 검색에서 `축구선수`, `줄넘기 선수` 등 31개 키워드 입력 시 관심 운동 탐색 CTA 안내 블록 표시 |
| 5 | 명따라 결과 연결 | 명따라 관심사·성향 결과와 관심 운동 추천 연결 여부 검토 |
| 6 | 다중 운동 선택 | 복수 운동 선택 후 공통 직업 추천 기능 |
| 7 | DB 테이블 전환 | `interest_sports` / `sport_career_links` 도입 (데이터 확장 시) |

**운동선수 직업군 처리 원칙 (이후 작업 전 반드시 확인):**
- 운동 종목(축구, 야구, 줄넘기 등)은 직업이 아니라 **관심 분야(진로 출발점)**로 관리한다.
- 대표 꿈(축구선수, 줄넘기 선수 등)은 `representativeDream` 텍스트로만 표시한다.
- 현 단계에서는 운동선수 직업군을 `occupation_master`에 바로 추가하지 않는다.
- 줄넘기 선수는 육상선수 대신 포함된 대표 꿈 예시로 유지한다.
- 육상선수는 제외 대상이다.
- 향후 사용자 반응 확인 후 추가 여부를 재검토한다.

---

*이 문서는 UX 설계 문서입니다.  
DB 변경 없음 / migration 없음 / UI 구현 없음.  
작성일: 2026-05-26*
