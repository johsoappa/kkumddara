# 꿈따라 명따라 베타 설계 및 안전 오픈 기준 문서

> **문서 성격**: 명따라 베타 오픈 전 설계·안전 기준 정리  
> **작성 기준**: 2026-05-21, 코드베이스 실제 구조 기반  
> **운영사**: OZ.K Lab (오즈케이랩)  
> **이 문서는 구현 완료 보고서가 아닙니다. 실제 베타 오픈 전 확정이 필요한 항목이 포함되어 있습니다.**

---

## 목차

1. [문서 목적](#1-문서-목적)
2. [명따라 베타 포지셔닝](#2-명따라-베타-포지셔닝)
3. [현재 구현 상태 (코드 기반 조사)](#3-현재-구현-상태-코드-기반-조사)
4. [베타 기능 범위](#4-베타-기능-범위)
5. [입력 정보 기준](#5-입력-정보-기준)
6. [결과 리포트 구조](#6-결과-리포트-구조)
7. [금지 문구 / 허용 문구](#7-금지-문구--허용-문구)
8. [요금제 / 사용량 정책](#8-요금제--사용량-정책)
9. [개인정보처리방침 영향](#9-개인정보처리방침-영향)
10. [UI 흐름](#10-ui-흐름)
11. [데이터 저장 기준](#11-데이터-저장-기준)
12. [안전장치](#12-안전장치)
13. [후속 구현 작업 분리](#13-후속-구현-작업-분리)
14. [최종 오픈 체크리스트](#14-최종-오픈-체크리스트)

---

## 1. 문서 목적

이 문서는 명따라 베타를 안전하게 오픈하기 위해 다음을 먼저 고정한다.

- 현재 명따라 구현 상태 정리
- 베타 기능 범위 확정
- 입력 정보 기준 정리
- 결과 리포트 구조 정의
- 금지/허용 문구 기준 확립
- 요금제/사용량 정책 영향 정리
- 개인정보처리방침 충돌 가능성 점검
- 후속 구현 작업 분리

이 문서는 명따라 결과 생성 로직을 새로 구현하지 않는다.  
DB schema, RLS, auth, AI API, 요금제, 결제, 개인정보처리방침은 이 문서에서 변경하지 않는다.

---

## 2. 명따라 베타 포지셔닝

### 2-1. 핵심 포지셔닝

명따라는 **"아이의 진로를 결정하는 기능"이 아니다.**

명따라는 부모가 아이를 더 잘 이해하고, 대화를 시작하기 위한 **참고용 리포트**다.

| 구분 | 내용 |
|---|---|
| 기능 성격 | 만세력 기반 성향 참고 리포트 |
| 주 대상 | 학부모 (자녀 진로 대화 소재 제공) |
| 주요 역할 | 부모-자녀 대화 시작점 제공 |
| 단정 여부 | 아이의 진로·성향을 단정하지 않음 |
| 베타 상태 | 현재 Phase 1 (만세력 계산 결과만 표시) |

### 2-2. 명확한 경계

**명따라가 아닌 것:**
- 진로 결정 도구
- 직업 단정 추천 도구
- 사주/명리 전문 감정 서비스
- 성격 진단 도구
- 학업 성취 예측 도구

**명따라인 것:**
- 만세력 기반 성향 키워드 참고 자료
- 부모 대화 질문 소재
- 함께 해볼 안전한 활동 안내
- 아이의 관심을 넓히는 탐색 도구

### 2-3. 권장 표현

| 권장 표현 | 금지 표현 |
|---|---|
| 참고 리포트 | 운명 분석 |
| 대화 시작점 | 정해진 진로 |
| 성향 키워드 | 반드시 해야 할 직업 |
| 관심을 넓혀볼 방향 | 타고난 직업 |
| 부모 질문 | 이 아이는 이 직업이 맞다 |
| 함께 해볼 활동 | 성공할 수밖에 없다 |
| 균형 포인트 | 맞지 않는다 / 부족하다 |

---

## 3. 현재 구현 상태 (코드 기반 조사)

### 3-1. 파일 구조

| 경로 | 존재 여부 | 설명 |
|---|---|---|
| `src/app/myeonddara/page.tsx` | ✅ 존재 | 입력 폼 + 자녀 선택 + 차단 로직 |
| `src/app/myeonddara/result/page.tsx` | ✅ 존재 | 결과 표시 (Phase 1/2 분기) |
| `src/app/api/myeonddara/route.ts` | ✅ 존재 | Claude API 호출 + 사용량 차감 |
| `src/lib/manseryeok.ts` | ✅ 존재 | 만세력 계산 (korean-lunar-calendar 라이브러리 사용) |
| `src/lib/myeonddara-rules.ts` | ✅ 존재 | 규칙 기반 Phase 1 결과 생성 |
| `src/components/myeonddara/SajuInput` | ✅ 존재 | 사주 입력 폼 컴포넌트 |
| `src/types/myeonddara.ts` | ✅ 존재 | SajuInputData, BIRTH_TIME_LABEL 등 |

### 3-2. DB 테이블

| 테이블 | 존재 여부 | 주요 컬럼 | migration |
|---|---|---|---|
| `myeonddara_usage` | ✅ 존재 | `parent_id`, `child_id`, `used_year`, `count` | 008, 011 |
| `myeonddara_sessions` | ✅ 존재 | `birth_date`, `birth_time`, `calendar_type`, `gender`, `result_snapshot` | 001, 002 |
| `subscription_plan.myeonddara_yearly_limit` | ✅ 존재 | free=0, basic=3, family=6, premium=9, family_plus=9 | 008, 020 |

### 3-3. Phase 구분 (현재 상태)

```
NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED = false (미설정 / 현재 비활성화)
```

| Phase | 활성 여부 | 내용 |
|---|---|---|
| **Phase 1** | ✅ 현재 활성 | 만세력 계산 결과 표시. Claude API 미호출. 사용량 미차감. |
| Phase 2 | ❌ 비활성화 | Claude API 호출. 직업군 추천, 기질 분석, 운세 메시지 표시. 사용량 차감. |

> **Phase 1 현재 동작**: 입력 → 만세력 계산 → sessionStorage 저장 → 결과 이동  
> API 미호출. 사용량 차감 없음. free 포함 누구나 접근 가능 (플랜 차단 로직은 Phase 2 기준).

### 3-4. 현재 결과 화면 구성 (Phase 1)

1. 베타 안내 배너 — 만세력 기반, 절기 오차 안내
2. 4주 카드 (년·월·일·시)
3. 오행 분포 (막대 그래프)
4. 일간 한줄 해설
5. 기질 키워드
6. 부모 관찰 포인트
7. 오행 균형 해설
8. 학습 스타일
9. 부모 가이드 팁
10. "AI 기질 분석 준비 중" 안내 + Coming Soon 배지
11. 면책 안내

### 3-5. 부모 홈 명따라 카드

```
label:       "명따라"
description: "사주 기반으로 아이의 성향과 진로를 분석해요."
href:        "/myeonddara"
```

### 3-6. 요금제 페이지 명따라 문구 (pricing/page.tsx)

| 플랜 | 명따라 문구 |
|---|---|
| 베이직 | "명따라 정밀 진로 성향 리포트, 연 3회 제공 (1학기·2학기·연말)" |
| 프리미엄 | "명따라 정밀 진로 성향 리포트, 연 3회 제공 + 관심사 변화 흐름 심층 점검" |
| 패밀리 | "명따라 정밀 진로 성향 리포트, 각 연 3회 제공 (1학기·2학기·연말)" |
| 패밀리 플러스 | "명따라 정밀 진로 성향 리포트, 각 연 3회 제공 (1학기·2학기·연말)" |
| 프리 | 명따라 미포함 |

### 3-7. 위험 문구 점검 결과

#### P0 (즉시 수정 필요)

현재 Phase 2 비활성화 상태이므로 화면에 노출되는 P0 위험 문구 없음.

#### P1 (Phase 2 활성화 전 반드시 보정 필요)

| 위치 | 위험 문구 | 문제점 |
|---|---|---|
| `result/page.tsx` Phase 2 섹션 | `"추천 직업군"` + `fitPercent: 92%` 형태로 직업 표시 | 직업 단정 추천. 퍼센트로 수치화하여 과도한 신뢰 유도 |
| `result/page.tsx` Phase 2 섹션 | `"오늘의 진로 운세"` 섹션 타이틀 | "운세" 표현 — 금지 단어 |
| `api/myeonddara/route.ts` SYSTEM_PROMPT | `careers[{rank, name, fitPercent}]` 구조 요청 | Claude에 직업 단정 + 퍼센트 추천 요청 |
| `api/myeonddara/route.ts` SYSTEM_PROMPT | `weaknesses` 필드 요청 | AI 생성 약점 텍스트가 부정 표현이 될 가능성 |

#### P2 (개선 권장)

| 위치 | 현재 문구 | 개선 방향 |
|---|---|---|
| `page.tsx` IntroCard | `"타고난 기질과 적성을 분석해드려요."` | `"기질 성향 키워드를 살펴볼 수 있어요."` |
| `page.tsx` IntroCard | `"동양 철학의 지혜로 진로의 방향을 찾아보세요."` | `"동양 철학 기반 참고 자료로 대화를 시작해보세요."` |
| `parent/home` 카드 | `"사주 기반으로 아이의 성향과 진로를 분석해요."` | `"만세력 기반 성향 참고 리포트예요."` |

---

## 4. 베타 기능 범위

### 4-1. 베타 1차 포함 범위

현재 Phase 1 기준. Phase 2는 별도 작업지시서로 분리한다.

| # | 기능 | 상태 |
|---|---|---|
| 1 | 자녀 이름/닉네임 표시 | ✅ 구현됨 |
| 2 | 생년월일 입력 (필수) | ✅ 구현됨 |
| 3 | 태어난 시간 입력 (선택, "모름" 허용) | ✅ 구현됨 |
| 4 | 양력/음력/윤달 선택 | ✅ 구현됨 |
| 5 | 4주 (년·월·일·시) 표시 | ✅ 구현됨 |
| 6 | 오행 분포 그래프 | ✅ 구현됨 |
| 7 | 일간 한줄 해설 | ✅ 구현됨 |
| 8 | 기질 키워드 | ✅ 구현됨 |
| 9 | 부모 관찰 포인트 | ✅ 구현됨 |
| 10 | 오행 균형 해설 | ✅ 구현됨 |
| 11 | 학습 스타일 참고 | ✅ 구현됨 |
| 12 | 부모 가이드 팁 | ✅ 구현됨 |
| 13 | 베타 안내/면책 문구 | ✅ 구현됨 |

### 4-2. 베타 1차 제외 범위

| # | 기능 | 이유 |
|---|---|---|
| 1 | 직업 단정 추천 (Phase 2) | 단정적 진로 표현 위험 |
| 2 | fitPercent 직업 매칭 % (Phase 2) | 과도한 수치화 신뢰 유도 위험 |
| 3 | 오늘의 진로 운세 (Phase 2) | "운세" 표현 금지 |
| 4 | weaknesses(단점) AI 생성 (Phase 2) | 부정 표현 위험 |
| 5 | 성별 필수 입력 제거 | 현재 "male"|"female" 필수 구조 — 후속 작업 필요 |
| 6 | 관심 직업과 명따라 연결 | 최소 CTA 구현 완료 (2026-05-27): 결과 화면 하단에 `/explore/interests/sports` 이동 버튼 추가. liked_occupations 연결은 후속 설계 필요 |
| 7 | 결과 PDF 출력 | 미구현, 이번 베타 제외 |
| 8 | 이메일 발송 | 미구현, 이번 베타 제외 |
| 9 | 결제 연동 | 미구현 |
| 10 | 자녀 프로필에서 생년월일 자동 불러오기 | child 테이블에 birth_date 컬럼 없음 — 후속 작업 필요 |

---

## 5. 입력 정보 기준

### 5-1. 현재 입력 정보 목록

| 입력 항목 | 필수 여부 | DB 저장 여부 | 비고 |
|---|---|---|---|
| 자녀 이름 | 필수 | `myeonddara_sessions.child_name` | child.name과 별도 입력 (직접 입력) |
| 생년월일 | 필수 | `myeonddara_sessions.birth_date` | YYYY-MM-DD |
| 태어난 시간 | **선택** | `myeonddara_sessions.birth_time` | "unknown" 허용 |
| 양력/음력/윤달 | 필수 (기본: 양력) | `myeonddara_sessions.calendar_type` | `"양력"\|"음력"\|"윤달"` |
| 성별 | 필수 | `myeonddara_sessions.gender` | `"male"\|"female"` — 비이분법 미지원 |

### 5-2. child 테이블과의 관계

- **현재 child 테이블에 `birth_date` 컬럼 없음** — 자녀 프로필에서 자동 불러오기 불가
- 자녀 이름은 child.name에서 초기값을 가져올 수 있으나 별도 입력 허용
- **후속 작업 필요**: child 테이블에 `birth_date` 추가 여부 결정 → OZ.대표 확정 필요

### 5-3. 입력 정책

1. 태어난 시간을 모르는 경우에도 결과가 나와야 함 — ✅ 현재 "unknown" 처리 구현됨
2. 음력/양력 변환은 `korean-lunar-calendar` 라이브러리로 처리 — ✅ 구현됨
3. 입력 정보를 최소화한다 — ✅ 현재 5개 항목
4. 결과 생성에 필요하지 않은 정보는 입력받지 않는다

### 5-4. 주의 사항

- 태어난 시간 미입력 시 결과 품질이 낮아진다는 식의 불안감 조성 문구 금지
- 아이의 민감한 정보를 과도하게 요구하지 않는다
- 성별 필수 입력이 향후 포용성 측면에서 개선 필요 — P2 후속 작업

---

## 6. 결과 리포트 구조

### 6-1. Phase 1 (현재 활성 — 안전)

현재 구현된 Phase 1은 아래 구조로 베타 1차 기준에 부합한다.

| 섹션 | 내용 | 안전성 |
|---|---|---|
| 4주 카드 | 년·월·일·시 한자 표시 | ✅ 계산 결과, 단정 없음 |
| 오행 분포 | 목·화·토·금·수 비율 | ✅ 수치 표시, 단정 없음 |
| 일간 해설 | 일간 기질 한줄 안내 | ✅ 참고 표현 |
| 기질 키워드 | 성향 키워드 태그 | ✅ 참고 표현 |
| 부모 관찰 포인트 | 일상 관찰 질문 | ✅ 부모 대화용 |
| 오행 균형 | 균형 해설 | ✅ 참고 표현 |
| 학습 스타일 | 스타일 참고 | ✅ 참고 표현 |
| 부모 가이드 팁 | 부모님께 한마디 | ✅ 참고 표현 |
| 면책 문구 | 참고용 서비스 안내 | ✅ 면책 포함 |

### 6-2. Phase 2 활성화 전 보정 필요 섹션

Phase 2는 현재 비활성화 상태이므로 화면에 노출되지 않는다.  
**Phase 2 활성화 전 반드시 별도 작업지시서를 통해 보정해야 한다.**

| 섹션 | 현재 구조 | 보정 방향 |
|---|---|---|
| 추천 직업군 | `careers[{name, fitPercent}]` — 직업 단정 + % 표시 | 분야 제안으로 완화. % 제거. |
| 오늘의 진로 운세 | `fortuneMessage` + "오늘의 진로 운세" 타이틀 | 타이틀에서 "운세" 제거. "오늘의 응원 메시지"로 변경 검토. |
| 주의점 (weaknesses) | AI 생성 단점 표현 | "균형 포인트" 또는 "함께 살펴볼 부분"으로 프레임 변경. 부정 표현 금지 |
| Claude 프롬프트 | `careers` + `fitPercent` + `weaknesses` 구조 요청 | 직업 → 분야. % → 제거. weaknesses → 균형 포인트. |

### 6-3. 권장 결과 리포트 구조 (베타 1차 기준)

```
① 상단 요약
   - {아이이름}의 명따라 참고 리포트 (베타)
   - "아이의 가능성을 좁히기보다 대화를 시작하는 데 활용해 주세요."

② 4주 + 오행 분포

③ 강점 키워드 3개
   예: 관찰력 / 표현력 / 꾸준함

④ 균형 포인트 2개
   예: "새로운 환경에서는 천천히 적응할 시간이 필요할 수 있어요."

⑤ 관심을 넓혀볼 분야 (직업 단정 아님)
   예: 만들고 고치는 활동 / 사람을 돕는 활동

⑥ 부모 대화 질문 3개

⑦ 함께 해볼 활동 2개

⑧ 하단 면책 문구 (필수)
   - "이 리포트는 아이의 진로를 결정하는 자료가 아닙니다."
   - "결과를 단정적으로 말하기보다 아이의 반응을 함께 관찰해 주세요."
```

---

## 7. 금지 문구 / 허용 문구

### 7-1. 금지 표현 (절대 금지)

| 카테고리 | 금지 표현 예시 |
|---|---|
| 운명·단정 | 운명, 정해진 진로, 반드시, 타고난 직업, 숙명 |
| 직업 단정 | 이 아이는 이 직업이 맞다, 최적의 직업 |
| 성공·실패 단정 | 성공할 수밖에 없다, 실패할 가능성이 높다 |
| 부정적 성격 | 고집이 세다, 산만하다, 게으르다, 예민하다, 문제가 있다 |
| 부모-자녀 관계 | 부모와 맞지 않는다 |
| 학업 단정 | 공부를 못한다, 성적이 낮을 것이다 |
| 수치화 단정 | 이 직업 적합도 92%, 이 분야 확률 87% |

### 7-2. 허용 표현

| 카테고리 | 허용 표현 예시 |
|---|---|
| 성향 키워드 | 관찰력이 있는 편이에요, 표현력이 발달할 수 있어요 |
| 균형 포인트 | 새로운 환경에서는 적응 시간이 필요할 수 있어요 |
| 분야 제안 | 만들고 고치는 활동에 관심을 가져볼 수 있어요 |
| 부모 질문 | 요즘 어떤 활동을 할 때 시간이 빨리 가? |
| 활동 제안 | 이번 주에 아이가 좋아한 활동을 10분만 함께 해보기 |
| 면책 | 아이의 가능성은 무한합니다 / 참고 자료로 봐주세요 |

### 7-3. Phase 2 Claude 프롬프트 수정 기준 (Phase 2 활성화 전 필수)

현재 SYSTEM_PROMPT에 아래 요소가 포함되어 있어 Phase 2 활성화 전 반드시 수정해야 한다.

```
현재 (수정 필요):
careers[{rank, name, reason, fitPercent}]  → 직업 단정 + 퍼센트
weaknesses: [...]                           → 단점 표현 위험
fortuneMessage                              → "운세" 타이틀 위험

수정 방향:
careers → interest_areas: ["분야명", ...]  (직업 단정 아닌 분야 제안)
weaknesses → balance_points: [...]         ("균형 포인트" 표현)
fortuneMessage → parent_encouragement      ("부모 응원 메시지")
```

---

## 8. 요금제 / 사용량 정책

### 8-1. 현재 코드 기준 정책

| 항목 | 값 | 소스 |
|---|---|---|
| 자녀당 연 사용 한도 | 3회 | `PER_CHILD_YEARLY_LIMIT = 3` (하드코딩) |
| 차감 기준 | child_id + used_year | `myeonddara_usage` |
| 차단 조건 | `myeonddara_yearly_limit === 0` (free 플랜) | `subscription_plan` |
| Phase 1 사용량 차감 | ❌ 차감 없음 | Claude API 미호출 |
| Phase 2 사용량 차감 | ✅ API 성공 시 차감 | `myeonddara_usage` UPDATE/INSERT |

### 8-2. DB 기준 myeonddara_yearly_limit

| 플랜 | DB 값 | 코드 사용 방식 |
|---|---|---|
| free | 0 | 0이면 접근 차단 (gate 역할) |
| basic | 3 | 0이 아니면 허용 (실제 한도는 코드 상수로 제어) |
| premium | 3 *(migration 047 보정: 9→3)* | 0이 아니면 허용 |
| family | 6 | 0이 아니면 허용 |
| family_plus | 9 *(migration 047 보정: 0→9)* | 0이 아니면 허용 |

> **⚠️ P1 — 불일치 주의**  
> `myeonddara_yearly_limit`의 DB 값은 실제 한도 계산에 사용되지 않는다.  
> 실제 한도는 `PER_CHILD_YEARLY_LIMIT = 3`으로 child당 3회 고정이다.  
> DB 값은 현재 "0이면 차단" gate 역할만 한다.  
> **OZ.대표 확정 필요**: 향후 플랜별로 횟수를 달리할 계획이 있다면 DB 값 기반으로 로직 변경이 필요하다.

### 8-3. 베타 기간 사용량 차감 정책

| 구분 | 현재 동작 |
|---|---|
| Phase 1 (현재) | API 미호출 → 사용량 차감 없음 |
| Phase 2 비활성 | 사용량 차감 없음 |
| Phase 2 활성화 시 | Claude API 성공 시만 차감 |

> **확정 필요**: 베타 기간에 사용량을 차감할지 여부는 OZ.대표가 결정해야 한다.  
> 권장: 베타 기간에는 사용량 차감 유예 또는 무제한 허용 후 정식 오픈 시 적용.

### 8-4. 권장 요금제 방향

| 플랜 | 명따라 제공 | 횟수 |
|---|---|---|
| Free | 미제공 (현재 코드 동일) | 0 |
| Basic | 자녀 1명 제공 | 연 3회 |
| Premium | 자녀 1명 제공 | 연 3회 |
| Family | 자녀 2명 각 제공 | 각 연 3회 |
| Family Plus | 자녀 3명 각 제공 | 각 연 3회 |

---

## 9. 개인정보처리방침 영향

### 9-1. 현재 개인정보처리방침과의 일치 여부

| 항목 | 처리방침 포함 여부 | 실제 수집 여부 | 충돌 여부 |
|---|---|---|---|
| 자녀 생년월일 (`birth_date`) | ✅ 제1조 3항 명시 | ✅ 수집 | ✅ 일치 |
| 태어난 시간 (`birth_time`) | ✅ 제1조 3항 명시 | ✅ 수집 | ✅ 일치 |
| 성별 (`gender`) | ✅ 제1조 3항 명시 | ✅ 수집 | ✅ 일치 |
| 양력/음력 구분 (`calendar_type`) | ✅ 제1조 3항 명시 | ✅ 수집 | ✅ 일치 |
| 명따라 분석 이력 보관 기간 | ✅ "탈퇴 시 즉시 삭제" | `myeonddara_sessions` 존재 | ✅ 일치 |

> **현재 개인정보처리방침과 충돌 없음.**  
> 제1조 3항이 이미 명따라 입력 정보를 모두 명시하고 있다.

### 9-2. 추가 검토 필요 항목

| 항목 | 상태 | 조치 |
|---|---|---|
| `myeonddara_sessions.result_snapshot` | `nullable` — 현재 API에서 저장 안 함 | Phase 2 활성화 시 저장 여부 결정 필요 |
| 결과 리포트 전문 저장 | 현재 sessionStorage만 사용 (DB 미저장) | Phase 2 활성화 시 저장 범위 결정 필요 |
| 성별 비이분법 대응 | `"male"\|"female"` 고정 구조 | 향후 포용성 개선 필요 (후속 작업) |

### 9-3. 이번 작업에서 처리방침 수정 여부

**이번 작업에서 개인정보처리방침은 수정하지 않는다.**  
현재 처리방침이 명따라 입력 정보를 이미 포함하고 있어 즉각 수정 불필요.

Phase 2 결과 리포트를 DB에 저장하는 구조로 변경할 경우 처리방침 검토 필요.

---

## 10. UI 흐름

### 10-1. 현재 UI 흐름 (Phase 1)

```
/parent/home → [명따라 카드] → /myeonddara

/myeonddara:
  → (비로그인) 로그인 유도
  → (학생 계정) 학부모 전용 안내
  → (free 플랜) 베이직 이상 플랜 안내 + 요금제 이동
  → (parent, 유료 플랜, 자녀 있음)
    → 자녀 선택 (2명 이상 시 드롭다운)
    → 사주 입력 폼 (이름, 생년월일, 태어난 시간, 양력/음력, 성별)
    → "명따라 리포트 보기" 버튼
    → 만세력 계산 → sessionStorage 저장
    → /myeonddara/result 이동

/myeonddara/result:
  → sessionStorage 로드
  → 4주 + 오행 + 일간 해설 + 기질 키워드 + ...
  → "AI 기질 분석 준비 중 (Coming Soon)"
  → [CTA] "관심 운동으로 진로를 더 넓게 살펴보세요" → /explore/interests/sports (2026-05-27 추가)
  → 다시 분석하기 버튼
  → 면책 문구
```

### 10-2. Phase 2 활성화 시 추가 흐름

```
  → (same as above)
  → POST /api/myeonddara
    → Claude API 호출 (약 10~20초)
    → 분석 중 오버레이
  → sessionStorage 저장
  → /myeonddara/result 이동
    → Claude 분석 결과 섹션 표시
    → 사용량 차감
```

### 10-3. 현재 UI 개선 권장 사항 (P2)

| 위치 | 현재 | 개선 방향 |
|---|---|---|
| IntroCard 소개 문구 | "타고난 기질과 적성을 분석해드려요." | "기질 성향 키워드를 살펴볼 수 있어요." |
| IntroCard | "진로의 방향을 찾아보세요." | "부모-자녀 대화를 시작해보세요." |
| parent/home 카드 설명 | "사주 기반으로 아이의 성향과 진로를 분석해요." | "만세력 기반 성향 참고 리포트예요." |

---

## 11. 데이터 저장 기준

### 11-1. 현재 저장 구조

| 데이터 | 저장 위치 | 보존 기간 |
|---|---|---|
| 입력 정보 (사주) | `sessionStorage` (탭 닫으면 삭제) | 세션 중만 |
| Phase 1 결과 | `sessionStorage` (탭 닫으면 삭제) | 세션 중만 |
| Phase 2 결과 | `sessionStorage` (탭 닫으면 삭제) | 세션 중만 |
| 사용량 | `myeonddara_usage` (DB) | 탈퇴 시 cascade |
| 세션 이력 | `myeonddara_sessions` (DB) — 현재 미사용 | 탈퇴 시 즉시 삭제 (처리방침) |

> **현재 결과 리포트는 DB에 저장되지 않는다.**  
> 탭을 닫거나 새로고침하면 결과가 사라진다.  
> `myeonddara_sessions` 테이블은 DB에 존재하지만 현재 API에서 INSERT하지 않는다.

### 11-2. 베타 기간 저장 정책

**권장**: 베타 1차에서는 결과 전문을 DB에 저장하지 않고 sessionStorage 중심 운영.  
저장이 필요한 경우 별도 설계 및 처리방침 검토 후 진행.

---

## 12. 안전장치

### 12-1. 현재 구현된 안전장치

| 안전장치 | 구현 위치 | 상태 |
|---|---|---|
| 베타 안내 배너 | `result/page.tsx` 상단 | ✅ 구현됨 |
| 면책 문구 | `result/page.tsx` 하단 | ✅ 구현됨 ("참고용 진로 분석 서비스", "아이의 가능성은 무한합니다") |
| 절기 오차 안내 | 베타 배너 | ✅ 구현됨 (±1일 오차) |
| Rate Limit | `api/myeonddara` | ✅ IP당 3회/분 |
| 플랜 차단 | `page.tsx` + `route.ts` | ✅ free 플랜 차단 |
| 인증 확인 | `route.ts` | ✅ auth.uid() 검증 |
| 자녀 소유권 확인 | `route.ts` | ✅ child.parent_id 검증 |

### 12-2. Phase 2 활성화 전 추가 필요 안전장치

| 안전장치 | 필요 이유 | 우선순위 |
|---|---|---|
| 결과 상단 참고용 안내 강화 | Phase 2 결과가 더 구체적이므로 과도한 신뢰 방지 | P1 |
| Claude 프롬프트 금지 표현 가이드 추가 | 현재 프롬프트에 단정 표현 방지 지침 미흡 | P1 |
| 직업 추천 → 분야 제안으로 구조 변경 | `careers` 구조 자체를 분야 제안으로 교체 | P1 |
| "운세" 표현 제거 | `fortuneMessage` 타이틀 변경 | P1 |

---

## 13. 후속 구현 작업 분리

### 13-1. Phase 2 활성화 전 필수 작업

| 작업 | 우선순위 | 내용 |
|---|---|---|
| Claude 프롬프트 보정 | P1 | `careers` → `interest_areas`, `weaknesses` → `balance_points`, `fortuneMessage` 타이틀 변경 |
| 결과 화면 Phase 2 섹션 보정 | P1 | "추천 직업군" → "관심 분야", fitPercent 제거, "운세" 타이틀 제거 |
| Phase 2 결과 안전 문구 추가 | P1 | 결과 상단에 참고용 강조 문구 추가 |
| 베타 기간 사용량 차감 정책 확정 | P1 — OZ.대표 결정 | 베타 기간 차감 유예 여부 |

### 13-2. 별도 설계 후 진행 필요 작업

| 작업 | 분리 이유 |
|---|---|
| child 테이블에 `birth_date` 추가 | migration 필요, 별도 작업지시서 |
| 자녀 프로필에서 생년월일 자동 불러오기 | child.birth_date 추가 후 연동 |
| 성별 비이분법 대응 | 입력 구조 변경, 처리방침 검토 |
| 명따라 + liked_occupations 연결 | 별도 설계 필요 (최소 CTA는 2026-05-27 구현됨 — `/explore/interests/sports` 링크) |
| 결과 리포트 DB 저장 | `myeonddara_sessions` 활용 설계 + 처리방침 검토 |
| 결제 연동 | PG 도입 후 별도 작업지시서 |
| PDF 출력 | 미구현, 별도 작업지시서 |

### 13-3. OZ.대표가 결정할 항목

| # | 결정 항목 | 현재 상태 | 권장 방향 |
|---|---|---|---|
| 1 | 베타 기간 사용량 차감 여부 | Phase 1은 차감 없음 | 베타 기간 유예 권장 |
| 2 | Phase 2 활성화 시점 | 현재 비활성화 | 프롬프트 보정 완료 후 |
| 3 | child.birth_date 컬럼 추가 여부 | 없음 | 추가 권장 (UX 개선) |
| 4 | 결과 리포트 DB 저장 여부 | 미저장 | 저장 시 처리방침 검토 필요 |
| 5 | 플랜별 명따라 횟수 차등화 여부 | 모두 child당 3회 | 현재 유지 또는 플랜별 차등화 |
| 6 | Phase 2 결과에서 분야 vs 직업 제공 형태 | 현재 직업 단정 (위험) | 분야 제안으로 변경 권장 |

---

## 14. 최종 오픈 체크리스트

### 14-1. Phase 1 베타 오픈 체크리스트 (현재)

- [x] `/myeonddara` 페이지 존재 및 접근 가능
- [x] 비로그인 → 로그인 유도 동작
- [x] 학생 계정 → 차단 동작
- [x] free 플랜 → 차단 동작
- [x] 자녀 선택 → 사주 입력 → 결과 이동 정상 동작
- [x] 음력/양력/윤달 변환 동작
- [x] 태어난 시간 "모름" 처리 동작
- [x] 4주, 오행 분포, 기질 키워드 표시
- [x] 베타 안내 배너 노출
- [x] 면책 문구 노출
- [x] 개인정보처리방침과 입력 정보 일치
- [ ] P2 문구 보정 (IntroCard 단정 표현 완화) — 선택적

### 14-2. Phase 2 활성화 체크리스트 (활성화 전 필수)

- [x] ~~Claude 프롬프트에서 `careers` → `interestAreas` 구조 변경~~ ✅ 2026-05-22
- [x] ~~Claude 프롬프트에서 `fitPercent` 제거~~ ✅ 2026-05-22
- [x] ~~Claude 프롬프트에서 `weaknesses` → `balancePoints` 변경~~ ✅ 2026-05-22
- [x] ~~결과 화면 "추천 직업군" → "관심을 넓혀볼 분야" 변경~~ ✅ 2026-05-22
- [x] ~~결과 화면 fitPercent 퍼센트 표시 제거~~ ✅ 2026-05-22
- [x] ~~결과 화면 "오늘의 진로 운세" → "오늘의 대화 힌트"로 변경~~ ✅ 2026-05-22
- [x] ~~"추천 직업군" → "관심을 넓혀볼 분야" + fitPercent/순위 제거~~ ✅ 2026-05-22
- [x] ~~careers 구조를 interestAreas 분야 제안으로 교체 (Claude 프롬프트 포함)~~ ✅ 2026-05-22
- [x] ~~Phase 2 빌드 + 타입 검증~~ ✅ 2026-05-22
- [ ] 결과 화면 상단 참고용 안내 문구 강화 (Phase 2 결과 섹션)
- [ ] 베타 기간 사용량 차감 정책 확정 (OZ.대표 결정)
- [ ] Phase 2 Claude API 비용 예상치 검토

---

## 15. 문구·사용량 정책 정리 업데이트 이력 (2026-05-22)

### 15-1. 완료된 문구 보정

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| `parent/home` 명따라 카드 | "사주 기반으로 아이의 성향과 진로를 분석해요." | "아이의 성향 키워드를 참고해 부모 대화의 실마리를 찾아보세요." |
| `/myeonddara` IntroCard | "타고난 기질과 적성을 분석해드려요. 동양 철학의 지혜로 진로의 방향을 찾아보세요." | "아이를 이해하는 참고 리포트로 부모 대화의 실마리를 찾아보세요. (진로를 정해주는 기능이 아니라 대화를 시작하는 베타 기능)" |
| `result/page.tsx` Phase 2 | "타고난 기질" (섹션 타이틀) | "성향 키워드" |
| `result/page.tsx` Phase 2 | "주의점" (섹션 타이틀) | "균형 포인트" |
| `result/page.tsx` Phase 2 | "추천 직업군" + fitPercent % + 순위 | "관심을 넓혀볼 분야" (% 제거, 순위 제거, 분야 제안 중심) |
| `result/page.tsx` Phase 2 | "✨ 오늘의 진로 운세" | "💬 오늘의 대화 힌트" |
| `result/page.tsx` Phase 1 | "타고난 기질 · 강점 · 추천 직업군 등" | "성향 키워드 · 강점 · 관심을 넓혀볼 분야 등" |

### 15-2. 사용량 정책 정리 방향

**채택: 방향 B (현재 3회 고정 유지 + TODO 주석 명시)**

- `PER_CHILD_YEARLY_LIMIT = 3` 하드코딩 유지
- `subscription_plan.myeonddara_yearly_limit` DB값은 현재 gate(0 = 차단) 역할만 수행
- DB 실제값(premium=9, family=6 등)과 실제 코드 한도(3회 고정) 불일치가 존재함
- 방향 A(DB값 기반 한도 계산)로의 전환은 플랜별 per-child 산식 확정 후 별도 작업 필요
- 관련 코드 위치: `src/app/myeonddara/page.tsx` L43, `src/app/api/myeonddara/route.ts` L29

**OZ.대표 확정 필요: planlimit 산식**
- basic(1명): child당 3회 → yearly_limit=3 ✅ 일치
- premium(1명): child당 3회 → yearly_limit=9 ⚠️ 불일치 (9는 3명×3회 기준)
- family(2명): child당 3회 → yearly_limit=6 ✅ 일치
- family_plus(3명): child당 3회 → yearly_limit=9 ✅ 일치

→ premium의 yearly_limit을 3으로 보정하거나, 코드에서 child_count를 나누어 산출하는 방식 중 선택 필요.

### 15-3. Phase 2 활성화 전 남은 필수 작업

| 작업 | 우선순위 | 상태 |
|---|---|---|
| Claude 프롬프트 보정 (careers→interestAreas, weaknesses→balancePoints, fortuneMessage 타이틀) | P1 | ✅ 완료 (§16 참고) |
| 결과 화면 Phase 2 타입·렌더링 교체 (MyeonddaraPhase2Result) | P1 | ✅ 완료 (§16 참고) |
| premium yearly_limit DB값 3 또는 9 확정 및 코드 반영 | P1 | OZ.대표 결정 필요 |
| 결과 화면 Phase 2 섹션 상단 참고 안내 문구 강화 | P2 | 미완료 |
| 베타 기간 사용량 차감 유예 여부 결정 | P1 | OZ.대표 결정 필요 |

---

## 16. Phase 2 결과 구조 interestAreas 전환 업데이트 이력 (2026-05-22)

### 16-1. 변경 요약

기존 `ClaudeAnalysis` 타입(careers + fitPercent + weaknesses + fortuneMessage 기반)을  
`MyeonddaraPhase2Result` 타입(interestAreas + strengthKeywords + balancePoints + todayHint 기반)으로 완전 교체.  
Phase 2는 여전히 비활성화 상태(`NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 미설정).

### 16-2. 타입 변경

| 항목 | 이전 | 이후 |
|---|---|---|
| 인터페이스명 | `CareerItem` + `ClaudeAnalysis` | `InterestArea` + `MyeonddaraPhase2Result` |
| 직업 추천 | `careers[{rank, emoji, name, fitPercent, reason}]` | 제거 |
| 관심 분야 | (없음) | `interestAreas[{title, reason, activities, conversationQuestion}]` |
| 성향 키워드 | `personalityTags` | `strengthKeywords` |
| 주의점 | `weaknesses` | `balancePoints` |
| 오늘 메시지 | `fortuneMessage` | `todayHint` |
| 성향 요약 | `ilganDescription` + `personalitySummary` | `summary` (단일 필드) |
| 부모 질문 | `parentMessage` (단일 문장) | `parentQuestions` (배열) |
| 추천 활동 | (없음) | `recommendedActivities` |
| 면책 문구 | (없음) | `disclaimer` |

### 16-3. SYSTEM_PROMPT 변경 핵심

- 직업명 추천 명시적 금지 지시 추가
- fitPercent/순위/운세 표현 명시적 금지 지시 추가
- `interestAreas.title` = 활동·관심 분야명 (직업명 아님) 지침 추가
- `interestAreas.activities` = 실제 해볼 수 있는 구체 활동 2개 지침 추가
- `interestAreas.conversationQuestion` = 부모 대화 질문 1개 지침 추가

### 16-4. result/page.tsx Phase 2 렌더링 구조 변경

| 섹션 | 이전 | 이후 |
|---|---|---|
| 4주 카드 하단 | `ilganDescription` | `summary` |
| 성향 카드 | `personalityTags` + `personalitySummary` (혼합) | `strengthKeywords` (키워드만) |
| 주의점 | `weaknesses` 배열 | `balancePoints` 배열 |
| 관심 분야 | `careers` 루프 (직업명 `career.name` 노출) | `interestAreas` 루프 (title + reason + activities + conversationQuestion) |
| 부모 메시지 | `parentMessage` 단일 문장 | `parentQuestions` 번호 목록 |
| 추천 활동 | (없음) | `recommendedActivities` 목록 |
| 오늘 힌트 | `fortuneMessage` | `todayHint` |

### 16-5. Phase 2 활성화 전 체크리스트 (갱신)

- [x] ~~Claude 프롬프트 보정 (careers→interestAreas, fitPercent 제거, 직업명 금지 지시)~~ ✅ 2026-05-22
- [x] ~~result/page.tsx 타입·렌더링 교체 (CareerItem/ClaudeAnalysis → MyeonddaraPhase2Result)~~ ✅ 2026-05-22
- [x] ~~tsc --noEmit 통과~~ ✅ 2026-05-22
- [x] ~~npm run build 통과~~ ✅ 2026-05-22
- [x] ~~Phase 2 AI Provider Claude → OpenAI 전환~~ ✅ 2026-05-22 (§17 참고)
- [ ] Phase 2 실제 OpenAI API 응답 + JSON 파싱 검증 (OPENAI_API_KEY 세팅 후)
- [ ] premium yearly_limit DB값 3 또는 9 확정 및 코드 반영 (OZ.대표 결정)
- [ ] 베타 기간 사용량 차감 유예 여부 결정 (OZ.대표 결정)
- [ ] `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` 설정 + 재배포

---

## 17. Phase 2 AI Provider OpenAI 전환 업데이트 이력 (2026-05-22)

### 17-1. 전환 사유

현재 운영 환경에서 Claude API(ANTHROPIC_API_KEY)가 연결되어 있지 않고,  
꿈따라 AI 상담(`/api/ai-consult`)에서 이미 OpenAI(`OPENAI_API_KEY`, `gpt-4o-mini`)를 사용 중이다.  
Provider를 통합해 안정적으로 Phase 2를 테스트하고 베타 오픈할 기반을 마련하기 위해 전환했다.  
Phase 2는 이번 작업 후에도 여전히 비활성 상태(`NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 미설정)다.

### 17-2. 변경 파일 요약

| 파일 | 변경 내용 |
|---|---|
| `src/app/api/myeonddara/route.ts` | `import Anthropic` 제거, `import OpenAI` 추가, `CLAUDE_MODEL` → `OPENAI_MODEL = "gpt-4o-mini"`, `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`, `anthropic.messages.create()` → `openai.chat.completions.create()`, `response_format: json_object` 추가, Promise.race timeout(20s) 추가, `OpenAI.APIError` 에러 분기, `isValidPhase2Result()` + `normalizePhase2Result()` + fallback 상수 추가, `export const maxDuration = 30` 추가 |
| `src/app/myeonddara/page.tsx` | 주석/로그의 "Claude API" → "OpenAI API", "Anthropic 크레딧 부족" → "OpenAI 크레딧/API 오류" 보정 |
| `src/lib/featureFlags.ts` | 주석의 `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` 보정 |
| `src/app/api/ai-consult/route.ts` | 주석 잔재 "Anthropic API 성공" → "OpenAI API 성공" 보정 |

### 17-3. OpenAI 호출 구조 (ai-consult와 동일 패턴)

- 모델: `gpt-4o-mini` (`OPENAI_MODEL` 상수)
- 환경변수: `OPENAI_API_KEY` (서버 전용, `NEXT_PUBLIC_` 없음)
- timeout: `Promise.race` + 20,000ms `AI_TIMEOUT_MS`
- JSON 안정화: `response_format: { type: "json_object" }` + 마크다운 코드블록 방어적 제거
- 에러 분기: `OpenAI.APIError` 상태코드별 처리 (401/402/403/429)
- 크레딧 부족(402/403): `BILLING_REQUIRED` 반환 → 프론트 Phase 1 fallback

### 17-4. fallback 구조 (§14 기준 구현)

| fallback 항목 | 트리거 | 기본값 |
|---|---|---|
| `disclaimer` | 누락 또는 빈 문자열 | "이 리포트는 아이의 진로를 결정하는 자료가 아니라, 부모와 자녀가 대화를 시작하기 위한 참고 자료입니다." |
| `parentQuestions` | 누락 또는 빈 배열 | 기본 질문 3개 (§14-3 기준) |
| `recommendedActivities` | 누락 또는 빈 배열 | 기본 활동 2개 (§14-4 기준) |
| `interestAreas` 미달 | 배열 길이 0 또는 누락 | `PARSE_ERROR` 반환 (잘못된 결과를 정상처럼 노출하지 않음) |

### 17-5. Vercel 배포 시 필수 확인

- `OPENAI_API_KEY` Vercel 환경변수 등록 필요 (ai-consult와 동일 키 공유 가능)
- `ANTHROPIC_API_KEY`는 myeonddara에서 더 이상 사용하지 않음
- Phase 2 활성화 시: `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` 추가

### 17-6. 미변경 항목

- interestAreas 결과 구조 유지
- 직업 추천/fitPercent/순위/운세 금지 기준 유지
- Phase 2 활성화 플래그 false 유지
- 사용량 차감 로직 무변경
- DB/RLS/migration 무변경
- AI 상담(`/api/ai-consult`) 무변경

---

## 18. Phase 2 활성화 전 스모크 테스트 준비 (2026-05-22)

Phase 2를 실제로 켜기 전 확인해야 할 테스트 기준, 정상/실패 응답 기준, 사용량 차감 방지 기준, 롤백 절차를 별도 문서로 분리하여 작성했다.

**스모크 테스트 기준 문서**: `docs/myeonddara-phase2-smoke-test.md`

### 18-1. 요약

| 항목 | 현재 상태 |
|---|---|
| Phase 2 활성화 | **비활성** (`NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 미설정) |
| 스모크 테스트 문서 | ✅ `docs/myeonddara-phase2-smoke-test.md` 생성 완료 |
| Vercel OPENAI_API_KEY | OZ.대표 직접 확인 필요 |
| premium yearly_limit 정책 | ✅ 확정 (migration 047: premium=3, family_plus=9) |
| 베타 사용량 차감 유예 | 미확정 (OZ.대표 결정 필요) |

### 18-2. 활성화 전 필수 절차

1. `docs/myeonddara-phase2-smoke-test.md` 체크리스트 전항목 통과
2. Vercel `OPENAI_API_KEY` 등록 확인
3. ~~premium yearly_limit 정책 확정~~ ✅ migration 047 완료
4. 베타 사용량 차감 유예 여부 결정
5. 로컬/Preview 환경에서 interestAreas 샘플 응답 검증
6. 직업명·퍼센트·순위·운세 표현 미포함 확인
7. **위 항목 완료 후** `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` Vercel 등록 + 재배포

### 18-3. 롤백 방법

Vercel 환경변수에서 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 삭제 후 재배포.
코드 revert 없이 즉시 Phase 1으로 복귀됩니다.

---

## 19. yearly_limit 정책 정리 업데이트 이력 (2026-05-22)

### 19-1. 변경 배경

migration 008에서 premium.myeonddara_yearly_limit=9로 설정된 값이 실제 플랜 정책과 불일치함이 확인됨.  
- premium은 "자녀 1명 집중" 플랜이며, 정책은 "자녀당 연 3회"이므로 yearly_limit=3이 정확함.  
- family_plus는 migration 019에서 plan_name constraint만 추가, yearly_limit 미설정으로 0(기본값) 상태.

### 19-2. 변경 내용

| 항목 | 변경 전 | 변경 후 | 방법 |
|---|---|---|---|
| `premium.myeonddara_yearly_limit` | 9 | **3** | migration 047 |
| `family_plus.myeonddara_yearly_limit` | 0 | **9** | migration 047 |
| `route.ts` TODO 주석 | "premium=9" | "premium=3 (migration 047 완료)" | 코드 주석 |
| `page.tsx` TODO 주석 | "premium=9" | "premium=3 (migration 047 완료)" | 코드 주석 |

### 19-3. 변경하지 않은 항목

- `child_limit` — 변경 금지 (§9-3)
- `PER_CHILD_YEARLY_LIMIT = 3` — 유지 (Phase 2 활성화 전 DB 기반 전환 불필요)
- pricing/page.tsx — 이미 모든 유료 플랜에 "연 3회" 표시, 변경 없음
- free 플랜 FreePlanBox "명따라 연 3회" 문구 — P1 별도 처리 항목, 이번 범위 외

### 19-4. migration 파일

`supabase/migrations/047_fix_myeonddara_yearly_limit_policy.sql`

멱등성 보장: 동일 migration 재실행 시 결과 동일. `ELSE myeonddara_yearly_limit` 처리로 목록 외 플랜 값 보존.

---

---

## 20. FreePlanBox 명따라 문구 보정 (2026-05-22)

### 20-1. 변경 배경

`src/app/pricing/page.tsx` FreePlanBox 체험 항목에 `"명따라 정밀 진로 성향 리포트 연 3회"` 문구가 포함되어 있었다.  
free 플랜의 `myeonddara_yearly_limit=0` 정책과 충돌 — free 사용자가 명따라를 무료 제공 기능으로 오해할 수 있음.

### 20-2. 변경 내용

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| FreePlanBox 체험 항목 (pricing/page.tsx L384) | `"명따라 정밀 진로 성향 리포트 연 3회"` | `"명따라 리포트는 정식 오픈 후 유료 플랜에서 제공 예정"` |

### 20-3. 변경하지 않은 항목

- 유료 플랜(베이직/프리미엄/패밀리/패밀리플러스) 명따라 문구 — 모두 "연 3회" 표시, 정책 일치, 변경 없음
- `/myeonddara` free 차단 메시지 (line 139) — "베이직 이상 플랜에서 이용 가능" upsell 안내, 정책 충돌 없음, 변경 없음
- DB/RLS/migration — 변경 없음
- Phase 2 — 비활성 유지
- 사용량 차감 로직 — 변경 없음

### 20-4. free 플랜 명따라 정책 기준 (확정)

- `myeonddara_yearly_limit = 0` → free 사용자 명따라 접근 차단
- FreePlanBox에서 명따라는 "유료 플랜에서 제공 예정" 으로만 안내
- free 영역에서 "연 3회" 숫자 표시 금지
- free 영역에서 명따라 사용 가능처럼 보이는 표현 금지

---

---

## 21. Phase 2 베타 사용량 차감 유예 정책 (2026-05-22)

### 21-1. 정책 결론

명따라 Phase 2 제한 베타 기간에는 **사용량 차감을 유예**한다.

- 테스트 중 `myeonddara_usage.count`를 증가시키지 않는다.
- 연간 사용 가능 횟수(자녀당 연 3회)가 줄어들지 않는다.
- API 호출 자체는 서버 콘솔 로그로 추적 가능하다.
- 정식 오픈 시 플래그를 `true`로 전환하여 차감 재활성화한다.

### 21-2. 유예 범위 명확화

| 항목 | 유예 여부 |
|---|---|
| `myeonddara_usage` 차감 | ✅ 유예 (증가 안 함) |
| free 차단 (`myeonddara_yearly_limit=0`) | ❌ 유예 아님 — 유지 |
| 베이직 이상 플랜 접근 제한 | ❌ 유예 아님 — 유지 |
| OpenAI API 호출 자체 | ❌ 유예 아님 — Phase 2 활성화 시 호출 |

### 21-3. 구현 방법

**방향 A 채택** — `FEATURE_FLAGS.MYEONDDARA_PHASE2_DEDUCT_USAGE = false`

| 파일 | 변경 내용 |
|---|---|
| `src/lib/featureFlags.ts` | `MYEONDDARA_PHASE2_DEDUCT_USAGE: false` 추가 |
| `src/app/api/myeonddara/route.ts` | `FEATURE_FLAGS` import, 차감 블록(§9)을 플래그로 감싸기 |

```typescript
// 유예 시 동작 (false)
console.info("[api/myeonddara] Phase 2 베타 사용량 차감 유예", { childId, year })
const remaining = PER_CHILD_YEARLY_LIMIT - usedCount  // 변동 없음
return NextResponse.json({ analysis, remaining })

// 차감 활성화 시 동작 (true)
await supabase.from("myeonddara_usage").update/insert(...)
const remaining = PER_CHILD_YEARLY_LIMIT - (usedCount + 1)
return NextResponse.json({ analysis, remaining })
```

### 21-4. 정식 오픈 전 재활성화 방법

1. `src/lib/featureFlags.ts` — `MYEONDDARA_PHASE2_DEDUCT_USAGE: false → true`
2. `docs/myeonddara-phase2-smoke-test.md` 체크리스트 전항목 통과 확인
3. `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` Vercel 등록
4. 배포 후 `myeonddara_usage` UPDATE/INSERT 정상 동작 확인
5. 연간 사용량 차감 후 `remaining` 값 감소 확인

### 21-5. 베타 기간 사용자 안내 기준

- 베타 기간 동안 명따라 사용량은 차감되지 않는다.
- 정식 오픈 후에는 플랜별 제공 횟수에 따라 차감될 수 있다.
- 화면 문구 추가 여부는 Phase 2 활성화 작업에서 별도 결정한다.

---

## 22. Free 1회 체험 정책 전환 (2026-05-23)

### 22-1. 정책 변경 요약

| 항목 | 이전 | 이후 |
|---|---|---|
| 무료 플랜 명따라 한도 | `myeonddara_yearly_limit = 0` (완전 차단) | `myeonddara_yearly_limit = 1` (베타 체험 1회) |
| 무료 사용자 진입 | plan_name=free 조건으로 403 차단 | yearlyLimit=0 조건만 차단, free(1)은 허용 |
| 체험 후 안내 | 차단 메시지 없음 | "무료 체험 1회를 모두 사용했어요." + 요금제 살펴보기 버튼 |
| pricing 페이지 문구 | "명따라 리포트는 정식 오픈 후 유료 플랜에서 제공 예정" | "명따라 참고 리포트 1회 체험" |

### 22-2. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `supabase/migrations/048_enable_free_myeonddara_one_time_trial.sql` | 기존 free 행 `myeonddara_yearly_limit` 0→1 UPDATE |
| `src/app/auth/callback/route.ts` | 신규 가입 기본값 `myeonddara_yearly_limit: 0 → 1` |
| `src/app/api/myeonddara/usage/route.ts` | Phase 1 전용 사용량 기록 API 신규 생성 |
| `src/app/myeonddara/page.tsx` | effectiveLimit/isFreeUser 상태, free 안내 카드, Phase 1 usage API 호출, 잠금 화면 업셀 버튼 |
| `src/app/api/myeonddara/route.ts` | plan_name=free 조건 제거, effectiveYearlyLimit 산식 추가 |
| `src/app/pricing/page.tsx` | FreePlanBox 명따라 항목 문구 보정 |

### 22-3. effectiveYearlyLimit 산식

```typescript
const PER_CHILD_YEARLY_LIMIT = 3; // 자녀당 유료 표준

const effectiveYearlyLimit = plan.myeonddara_yearly_limit < PER_CHILD_YEARLY_LIMIT
  ? plan.myeonddara_yearly_limit   // free(=1), 특수 플랜
  : PER_CHILD_YEARLY_LIMIT;        // 유료 표준: 자녀당 3회
```

- free: DB값 그대로 (=1)
- basic/premium: 3 (DB=3, PER_CHILD 이상이므로 PER_CHILD로 캡)
- family(DB=6)/family_plus(DB=9): 3 (자녀당 3회 기준)

### 22-4. Phase 1 usage API와 Phase 2 차감 유예 플래그 분리

- **Phase 1 경로** (`/api/myeonddara/usage`): OpenAI 미호출, 규칙 기반 리포트 완료 후 사용량 +1
- **Phase 2 경로** (`/api/myeonddara`): OpenAI 호출, `MYEONDDARA_PHASE2_DEDUCT_USAGE=false` 시 차감 유예
- 두 경로는 완전히 독립적. `MYEONDDARA_PHASE2_DEDUCT_USAGE=false`는 free 1회 제한을 무력화하지 않음.
- Phase 2 현재 비활성 (`NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 미설정)

### 22-5. 정식 오픈 전 확인 항목

- [ ] migration 048을 Supabase 프로덕션에 적용했는가?
- [ ] 기존 free 사용자 `myeonddara_yearly_limit`이 1로 갱신되었는가?
- [ ] `myeonddara_usage` 테이블에 `child_id` 컬럼(migration 011)이 적용되어 있는가?
- [ ] free 사용자가 명따라 결과 화면까지 진입 가능한가?
- [ ] 1회 사용 후 잠금 화면 + "요금제 살펴보기" 버튼이 표시되는가?
- [ ] 유료 사용자 흐름(3회 한도)이 기존과 동일하게 동작하는가?

---

*이 문서는 2026-05-21 최초 작성, 2026-05-22 문구·사용량 정책 정리 업데이트, 2026-05-22 interestAreas 전환 업데이트, 2026-05-22 OpenAI Provider 전환 업데이트, 2026-05-22 스모크 테스트 준비 업데이트, 2026-05-22 yearly_limit 정책 정리 업데이트, 2026-05-22 FreePlanBox 문구 보정, 2026-05-22 Phase 2 베타 사용량 차감 유예 정책, 2026-05-23 Free 1회 체험 정책 전환, 2026-05-27 관심 운동 CTA 연결 구현 반영, 2026-05-27 베타 최종 스모크 테스트 반영.*  
*Phase 2 활성화, 요금제 정책 변경, child.birth_date 추가 등 주요 사항 변경 시 이 문서를 함께 갱신하세요.*

---

## 경진대회 사업계획서용 기능 현황 정리 이력

- `docs/competition-gg-publicdata-ai-feature-status.md` 문서 신규 작성 (2026-05-27)
- 명따라 Phase 1/2 현황, AI 활용 구조, 관심 운동 CTA 연결, 면책 안내 설계를 사업계획서 작성용으로 정리
- DB/API/AI/RLS/요금제 변경 없이 문서화만 진행

## 베타 공개 전 최종 스모크 테스트 이력

- `docs/final-beta-smoke-test-20260527.md` 신규 작성 (2026-05-27)
- 명따라 흐름, 학부모 홈, 학생 홈, 주간 리포트, AI 상담, 관심 운동 섹션, 정책 페이지 전체 코드 기반 검증
- `tsc --noEmit` PASS, `npm run build` PASS (44+ 페이지)
- P0 이슈 없음. 판정: **A. 베타 공개 가능**
- P1 이슈: refund §2 문구 불일치, roadmap mission ID 호환성, weekly_activity_completions 마이그레이션 확인 필요
- DB/API/AI/RLS/요금제/Phase 2 변경 없이 문서화만 진행
