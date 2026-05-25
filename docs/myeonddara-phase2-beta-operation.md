# 명따라 Phase 2 제한 베타 운영 가이드

> 작성일: 2026-05-25  
> 상태: **Production 제한 베타 운영 중**  
> 관련 문서: [myeonddara-beta-design.md](./myeonddara-beta-design.md) · [myeonddara-phase2-smoke-test.md](./myeonddara-phase2-smoke-test.md)

---

## 목차

1. [현재 상태](#1-현재-상태)
2. [베타 허용 계정 추가 절차](#2-베타-허용-계정-추가-절차)
3. [베타 테스트 계정 관리 기준](#3-베타-테스트-계정-관리-기준)
4. [피드백 수집 항목](#4-피드백-수집-항목)
5. [Phase 2 결과 금지 표현 점검 기준](#5-phase-2-결과-금지-표현-점검-기준)
6. [정식 오픈 전환 체크리스트](#6-정식-오픈-전환-체크리스트)
7. [베타 운영 중 모니터링 항목](#7-베타-운영-중-모니터링-항목)

---

## 1. 현재 상태

명따라 Phase 2는 Production에서 **제한 베타** 상태로 운영한다.  
허용 계정만 Phase 2 결과를 사용할 수 있으며, 비허용 계정은 Phase 1 fallback으로 처리된다.

### 운영 기준 환경변수

| 환경변수 | 현재 값 | 의미 |
|---|---|---|
| `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` | `true` | Phase 2 기능 활성화 |
| `MYEONDDARA_PHASE2_BETA_EMAILS` | `user@test.com` | 허용 계정 목록 (쉼표 구분) |
| `MYEONDDARA_PHASE2_DEDUCT_USAGE` | `false` | 베타 기간 사용량 차감 유예 |

### 허용/비허용 계정 동작

| 계정 유형 | 동작 |
|---|---|
| `MYEONDDARA_PHASE2_BETA_EMAILS` 포함 계정 | Phase 2 결과 생성 및 표시 |
| 미포함 계정 | `BETA_NOT_ELIGIBLE` 403 → Phase 1 fallback + 사용량 소비 |

---

## 2. 베타 허용 계정 추가 절차

베타 대상 계정을 추가할 때는 **Vercel Production 환경변수**에서 `MYEONDDARA_PHASE2_BETA_EMAILS` 값을 수정한다.

### 형식

```text
MYEONDDARA_PHASE2_BETA_EMAILS=user@test.com,parent1@example.com,parent2@example.com
```

### 작성 규칙

- 계정은 쉼표(`,`)로 구분한다.
- 공백은 허용하며 내부 로직에서 `trim()` 처리된다.
- 이메일은 소문자 기준으로 정규화된다.
- 환경변수 수정 후 **Production Redeploy가 필요**하다 (`NEXT_PUBLIC_*`가 아니므로 즉시 반영되나, 명시적 Redeploy 권장).
- 허용 계정 추가 전 해당 계정의 회원가입·로그인 가능 여부를 먼저 확인한다.

### 주의

> ⚠️ `MYEONDDARA_PHASE2_BETA_EMAILS`를 **비우거나 삭제하면 전체 허용**으로 동작할 수 있다.  
> 제한 베타 기간 중에는 절대 비워두지 않는다.

### Vercel 환경변수 수정 경로

```
Vercel Dashboard
→ 프로젝트 선택
→ Settings
→ Environment Variables
→ MYEONDDARA_PHASE2_BETA_EMAILS 검색 → Edit
→ Production 값 수정
→ Save → Redeploy
```

---

## 3. 베타 테스트 계정 관리 기준

베타 대상은 아래 순서로 확대한다.

| 단계 | 대상 | 목적 |
|---|---|---|
| 1단계 | 내부 테스트 계정 | 기능 검증 |
| 2단계 | OZ 실계정 | 실제 사용성 검증 |
| 3단계 | 지인 3~5명 | 학부모 반응 확인 |
| 4단계 | 제한 공개 10~20명 | 운영 안정성 확인 |

### 계정별 확인 항목

각 베타 계정에 대해 아래 항목을 확인한다.

| 항목 | 확인 내용 |
|---|---|
| 로그인 방식 | 카카오 / 이메일 |
| 자녀 등록 여부 | 등록 완료 |
| 명따라 진입 가능 여부 | `/myeonddara` 접근 정상 |
| Phase 2 결과 표시 여부 | Phase 2 렌더링 정상 |
| 결과 내용 이해도 | 피드백 수집 |
| 부모 대화 질문 만족도 | 피드백 수집 |
| 추천 활동 실천 가능성 | 피드백 수집 |
| 이상 표현/불편 문구 여부 | 피드백 수집 |

---

## 4. 피드백 수집 항목

베타 사용자에게 아래 항목을 수집한다.

### 기본 정보

| 항목 | 설명 |
|---|---|
| 사용자 유형 | 학부모 / 학생 / 기타 |
| 자녀 학년 | 예: 초1, 초5, 중1 |
| 로그인 방식 | 카카오 / 이메일 |
| 사용 기기 | 모바일 / PC / 태블릿 |

### 기능 피드백

| 질문 | 답변 방식 |
|---|---|
| 명따라 결과가 이해하기 쉬웠나요? | 1~5점 |
| 아이 성향 설명이 자연스러웠나요? | 1~5점 |
| 관심을 넓혀볼 분야가 유용했나요? | 1~5점 |
| 부모 대화 질문이 실제로 써볼 만했나요? | 1~5점 |
| 이번 주 활동 제안이 실천 가능했나요? | 1~5점 |
| 결과에서 불편하거나 과하게 느껴진 표현이 있었나요? | 주관식 |
| 다시 사용하고 싶나요? | 예 / 아니오 / 모르겠음 |
| 유료 기능이라면 어느 정도 가격이 적절하다고 느끼나요? | 주관식 |

### 기술 피드백

| 질문 | 답변 방식 |
|---|---|
| 로그인 과정에서 문제가 있었나요? | 주관식 |
| 결과 생성 시간이 길게 느껴졌나요? | 예 / 아니오 |
| 화면이 깨지거나 멈춘 부분이 있었나요? | 주관식 |
| 모바일에서 사용하기 편했나요? | 1~5점 |

---

## 5. Phase 2 결과 금지 표현 점검 기준

명따라 Phase 2 결과에서는 아래 표현을 피한다.

> 관련 상세 기준: [myeonddara-beta-design.md §7](./myeonddara-beta-design.md)

### 금지 또는 주의 표현

- 아이의 미래 직업을 단정하는 표현
- 특정 직업을 운명처럼 확정하는 표현
- 사주/만세력 결과를 절대화하는 표현
- 성격을 부정적으로 낙인찍는 표현
- 부모 불안을 자극하는 표현
- 의학/심리 진단처럼 보이는 표현
- 확률·점수·등수 중심의 과도한 평가 표현

### 권장 표현 방향

- "가능성이 있어요"
- "이런 방향을 탐색해볼 수 있어요"
- "대화를 시작하는 참고 자료예요"
- "아이의 실제 경험과 함께 살펴보세요"
- "부모와 아이가 함께 이야기해보는 것이 중요해요"

---

## 6. 정식 오픈 전환 체크리스트

Phase 2를 정식 오픈하기 전 아래 항목을 모두 확인한다.

### 기능 확인

| 항목 | 기준 | 확인 |
|---|---|---|
| 카카오 로그인 | PC/모바일 정상 | |
| 이메일 로그인 | 정상 | |
| 자녀 등록 | 정상 | |
| 명따라 진입 | 정상 | |
| Phase 2 결과 생성 | 정상 | |
| 결과 화면 렌더링 | 정상 | |
| fallback 처리 | Phase 1 대체 정상 | |
| 오류 메시지 | 사용자 친화적 한국어 | |

### 정책 확인

| 항목 | 기준 | 확인 |
|---|---|---|
| 무료 체험 횟수 | 확정 (현재 1회) | |
| 사용량 차감 정책 | `MYEONDDARA_PHASE2_DEDUCT_USAGE=true` 전환 시점 확정 | |
| 유료 플랜별 제공 횟수 | `myeonddara_yearly_limit` 기준 확정 | |
| 베타 사용량 유예 종료 시점 | 명시적 공지 후 전환 | |
| 개인정보처리방침 | 필요 시 보완 | |
| 면책 문구 | 결과 화면 하단 유지 | |

### 환경변수 전환 기준

정식 오픈 시 검토할 환경변수:

| 환경변수 | 제한 베타 | 정식 오픈 후보 |
|---|---|---|
| `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` | `true` | `true` |
| `MYEONDDARA_PHASE2_BETA_EMAILS` | 허용 목록 유지 | 삭제 또는 전체 허용 전환 |
| `MYEONDDARA_PHASE2_DEDUCT_USAGE` | `false` | `true` |

> ⚠️ **`MYEONDDARA_PHASE2_DEDUCT_USAGE=true` 전환 전 반드시 확인:**
> - free 1회 체험 계정에서 1회 사용 후 잠금 동작 확인
> - `myeonddara_usage.count` 증가 → 사용 한도 도달 → 제한 안내 화면 정상 표시
> - 유료 플랜 계정에서 `myeonddara_yearly_limit` 적용 확인

---

## 7. 베타 운영 중 모니터링 항목

베타 기간에는 아래 항목을 주기적으로 모니터링한다.

| 항목 | 확인 위치 | 이상 징후 |
|---|---|---|
| `/api/myeonddara` 오류 | Vercel Logs | 5xx 응답, OpenAI timeout |
| OpenAI 응답 실패 | Vercel Logs | `OpenAI API error`, `stream error` |
| fallback 발생 빈도 | Vercel Logs | `BETA_NOT_ELIGIBLE` 과다 노출 |
| 사용량 차감 여부 | Supabase `myeonddara_usage` 테이블 | `MYEONDDARA_PHASE2_DEDUCT_USAGE=false` 기간 중 count 증가 시 이상 |
| 카카오 로그인 실패 | Vercel Logs | `kakao_start_failed`, `exchangeCodeForSession 실패` |
| role 결정 오류 | Vercel Logs | `role 결정 실패`, `role 불일치` |
| 사용자 피드백 | 별도 수집표 (Google Form 등) | 불편 표현, 로딩 실패, 화면 오류 |

---

## 8. 운영 이력

| 날짜 | 내용 |
|---|---|
| 2026-05-25 | Phase 2 Preview Live 테스트 전항목 통과 |
| 2026-05-25 | `MYEONDDARA_PHASE2_BETA_EMAILS` allowlist 구현 배포 |
| 2026-05-25 | 카카오 로그인 홈 튕김 이슈 해결 (PC/모바일 정상) |
| 2026-05-25 | debug 진단 코드 제거, 운영 정리 완료 |
| 2026-05-25 | 본 운영 가이드 문서 작성 |
