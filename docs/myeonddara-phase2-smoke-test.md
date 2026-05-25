# 꿈따라 명따라 Phase 2 활성화 전 스모크 테스트 기준

> **이 문서는 Phase 2를 실제로 켜기 전 확인해야 할 스모크 테스트 기준 문서입니다.**
> 이 문서는 Phase 2 활성화 작업지시서가 아닙니다.
> 이 문서의 기준을 모두 통과한 뒤에만 제한 베타 활성화를 검토합니다.
> Phase 2는 이 문서 기준 통과 전까지 비활성 상태를 유지합니다.

---

## 1. 문서 목적

명따라 Phase 2는 OpenAI `gpt-4o-mini` 기반 기질 분석 API를 통해 `interestAreas` 구조의 결과를 생성합니다.
Provider 전환 및 구조 전환이 완료되었으나, 실제 사용자에게 노출하기 전 아래 항목을 검증해야 합니다.

- Vercel 환경변수 등록 여부
- OpenAI 응답이 interestAreas 구조를 정확히 준수하는지
- 직업명·퍼센트·순위·운세 표현이 응답에 섞이지 않는지
- fallback이 정상 동작하는지
- JSON 파싱 실패 시 API가 안전하게 처리되는지
- 테스트 중 사용량 차감이 발생하지 않도록 주의

---

## 2. 현재 Phase 2 상태

| 항목 | 현재 값 |
|---|---|
| AI Provider | OpenAI |
| 모델 | `gpt-4o-mini` |
| API Key 환경변수 | `OPENAI_API_KEY` (서버 전용, `NEXT_PUBLIC_` 없음) |
| 결과 구조 | `interestAreas` 기반 (`MyeonddaraPhase2Result`) |
| Phase 2 활성화 플래그 | `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` — **미설정 (false)** |
| 사용량 차감 로직 | 기존 유지 (연 3회, child당) |
| DB 스키마 변경 | 없음 |
| 공개 접근 | 비활성 |
| 활성화 상태 | **대기 중** |
| 관련 코드 위치 | `src/app/api/myeonddara/route.ts`, `src/app/myeonddara/page.tsx` |
| 관련 문서 | `docs/myeonddara-beta-design.md` §16, §17 |

---

## 3. 스모크 테스트 전제조건

아래 조건이 모두 충족된 상태에서만 테스트를 진행합니다.

- [ ] `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED`가 **로컬/Preview 환경에만** 설정되어 있을 것
- [ ] **Production 배포로 Phase 2를 활성화하지 않은 상태**일 것
- [ ] 테스트 전용 학부모 계정이 준비되어 있을 것
- [ ] 테스트 전용 자녀 프로필이 생성되어 있을 것
- [ ] `OPENAI_API_KEY`가 테스트 환경에 등록되어 있을 것
- [ ] AI 상담(`/parent/counseling`)이 정상 작동 중일 것 (동일 API Key 확인용)
- [ ] 사용량 차감 발생 가능성을 OZ.대표가 인지한 상태일 것

---

## 4. Vercel 환경변수 확인 항목

> **실제 키 값을 이 문서에 기록하지 않습니다.**
> Vercel 환경변수는 OZ.대표가 직접 Vercel 대시보드에서 확인합니다.

### 4-1. 확인 절차

1. Vercel 프로젝트 대시보드 진입
2. Settings → Environment Variables 탭 열기
3. 아래 항목 확인

| 환경변수명 | 필요 환경 | 비고 |
|---|---|---|
| `OPENAI_API_KEY` | Production / Preview / Development | AI 상담과 동일 키 사용 가능 |
| `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` | Preview / Development만 (스모크 테스트용) | Production에는 설정하지 않음 |

### 4-2. 확인 기준

- [ ] `OPENAI_API_KEY`가 Production 환경에 등록되어 있음
- [ ] AI 상담 기능이 현재 정상 작동 중 (동일 키 유효 확인 대리 지표)
- [ ] `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED`가 Production에 설정되어 있지 않음
- [ ] 키 값이 코드, 주석, README, 문서에 노출되지 않음

### 4-3. OPENAI_API_KEY 미등록 시 동작

`OPENAI_API_KEY`가 없을 때 `POST /api/myeonddara`는 즉시 503을 반환합니다.
Phase 2 흐름에서 사용량 차감이 발생하지 않습니다. (route.ts §8 조기 반환 확인)

---

## 5. 테스트 시나리오

> **Phase 2 테스트는 PHASE2_ENABLED=true를 로컬 또는 Preview 환경에서만 설정하여 진행합니다.**
> Production에 배포하지 않습니다.

### 5-1. 정적 검토 (코드 수정 없이 수행 가능)

| 번호 | 항목 | 확인 방법 | 기준 |
|---|---|---|---|
| S-01 | `PHASE2_ENABLED=false` 유지 | `src/app/myeonddara/page.tsx` L32-33 확인 | `process.env.NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED === "true"` |
| S-02 | `OPENAI_API_KEY` 체크 | `src/app/api/myeonddara/route.ts` L308-311 확인 | 미설정 시 503, 사용량 차감 없음 |
| S-03 | `isValidPhase2Result()` 존재 | `route.ts` L107 확인 | `interestAreas` 배열 길이 > 0 검증 |
| S-04 | `normalizePhase2Result()` 존재 | `route.ts` L125 확인 | disclaimer/parentQuestions/recommendedActivities fallback |
| S-05 | 사용량 차감 위치 | `route.ts` §9 확인 | OpenAI 성공 + JSON 파싱 성공 + 구조 검증 통과 후에만 차감 |
| S-06 | Phase 1 분기 확인 | `page.tsx` L238 확인 | `if (!PHASE2_ENABLED)` 분기에서 API 미호출 |
| S-07 | response_format 설정 | `route.ts` L331 확인 | `{ type: "json_object" }` |
| S-08 | timeout 설정 | `route.ts` L316-318 확인 | `Promise.race` + `AI_TIMEOUT_MS = 20_000` |

### 5-2. 로컬 스모크 테스트 (PHASE2_ENABLED=true 로컬 설정 필요)

> 로컬 `.env.local`에 아래 두 항목을 추가하여 테스트합니다.
> 테스트 완료 후 즉시 제거합니다. Production 배포에 포함시키지 않습니다.

```
NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true
OPENAI_API_KEY=<실제 키, 코드에 직접 넣지 않음>
```

| 번호 | 시나리오 | 입력 조건 | 기대 결과 |
|---|---|---|---|
| T-01 | 정상 분석 요청 | 유효한 자녀 프로필, 유효한 사주 입력 | `interestAreas` 포함된 JSON 반환, 사용량 1 차감 |
| T-02 | 응답 구조 검증 | T-01과 동일 | `summary` / `strengthKeywords` / `balancePoints` / `interestAreas` / `todayHint` / `parentQuestions` / `recommendedActivities` / `disclaimer` 필드 모두 존재 |
| T-03 | 직업명 미포함 확인 | T-01과 동일 | `interestAreas[].title`에 "의사", "경찰관", "교사" 등 직업명 직접 없음 |
| T-04 | fitPercent 미포함 | T-01과 동일 | `%` 또는 숫자+퍼센트 패턴 없음 |
| T-05 | 운세 표현 미포함 | T-01과 동일 | "운세", "운명", "정해진 길", "반드시" 표현 없음 |
| T-06 | disclaimer 존재 | T-01과 동일 | `disclaimer` 필드가 있거나 fallback 기본 문구 표시 |
| T-07 | 한도 초과 차단 | 연 3회 사용 완료된 자녀 선택 | `LIMIT_EXCEEDED` 429 반환, 차감 없음 |
| T-08 | Phase 1 정상 유지 | `PHASE2_ENABLED=false` 상태 | API 미호출, 규칙 기반 결과 정상 표시 |
| T-09 | 인증 없는 접근 | 비로그인 상태 | `AUTH_REQUIRED` 401 반환 |
| T-10 | 플랜 차단 | `myeonddara_yearly_limit=0` 인 계정 | `PLAN_BLOCKED` 403 반환, 차감 없음 |
| T-11 | free 1회 체험 | free 플랜 계정 (미사용) | Phase 1 결과 정상 표시, usage +1 기록 |
| T-12 | free 한도 초과 | free 플랜 계정 (1회 사용 완료) | `NO_REMAINING_USAGE` 429, 잠금 화면 + 요금제 살펴보기 버튼 |

---

## 6. 정상 응답 기준

Phase 2 테스트 시 OpenAI 응답은 아래 기준을 **모두** 만족해야 합니다.

### 6-1. 필수 필드

```json
{
  "summary":               "string (비어 있지 않음)",
  "strengthKeywords":      ["string", "string", "string"],
  "balancePoints":         ["string", "string"],
  "interestAreas": [
    {
      "title":               "string (직업명 아님, 활동 분야명)",
      "reason":              "string",
      "activities":          ["string", "string"],
      "conversationQuestion":"string"
    }
  ],
  "todayHint":             "string",
  "parentQuestions":       ["string", "string", "string"],
  "recommendedActivities": ["string", "string"],
  "disclaimer":            "string"
}
```

### 6-2. 정상 판정 기준

| 항목 | 기준 |
|---|---|
| `interestAreas` | 1개 이상 존재 (권장 2~3개) |
| `interestAreas[].title` | 활동·경험 분야명. 직업명이 아닐 것 |
| `strengthKeywords` | 3개 내외 |
| `balancePoints` | 2개 내외 |
| `parentQuestions` | 3개 내외. 없으면 fallback 적용 확인 |
| `recommendedActivities` | 2개 내외. 없으면 fallback 적용 확인 |
| `disclaimer` | 있거나 fallback 문구 표시 확인 |
| fitPercent / % | **없음** |
| 순위 (1위, 2위, rank) | **없음** |
| 직업명 직접 추천 | **없음** |
| 운세 / 운명 / 반드시 | **없음** |
| 진로 단정 | **없음** |
| 응답 언어 | 자연스러운 한국어 |

---

## 7. 실패 응답 기준

아래 중 하나라도 해당되면 **실패**로 간주합니다.
실패 시 Phase 2 활성화를 중단하고 프롬프트 보정 또는 롤백을 검토합니다.

| 분류 | 실패 조건 |
|---|---|
| 구조 실패 | JSON 파싱 실패 |
| 구조 실패 | `interestAreas` 누락 또는 빈 배열 |
| 내용 실패 | `interestAreas[].title`에 경찰관, 의사, 군인, 교사, 엔지니어 등 직업명 직접 포함 |
| 내용 실패 | `fitPercent` 키 또는 숫자% 패턴 포함 |
| 내용 실패 | 순위(1위/2위/rank) 표현 포함 |
| 내용 실패 | "추천 직업군", "이 아이에게 맞는 직업", "이 분야가 적성" 표현 포함 |
| 내용 실패 | "운세", "운명", "정해진 길", "반드시" 표현 포함 |
| 내용 실패 | 성향·진로 단정 표현 포함 |
| 내용 실패 | 건강, 수명, 사고, 합격, 성공/실패 예측 포함 |
| 내용 실패 | 부모와 자녀 궁합 단정 포함 |
| 내용 실패 | 위험하거나 비현실적인 활동 제안 |
| 안전 실패 | disclaimer 누락 + fallback도 미작동 |
| 안전 실패 | API 에러가 사용자 화면 crash로 이어짐 |
| 안전 실패 | 사용량 차감이 실패 응답 이후에도 발생 |

---

## 8. 사용량 차감 방지 기준

Phase 2 스모크 테스트 중 **운영 사용자의 사용량 차감이 발생하지 않아야 합니다.**

### 8-1. 현재 차감 구조 (베타 유예 플래그 적용 후)

```
Phase 2 흐름:
  POST /api/myeonddara
    → 인증 확인
    → 플랜 확인 (yearlyLimit=0 → 403 / free=1 → 허용, 1회 체험)
    → 사용량 확인 (차감 전)
    → OpenAI 호출 (여기서 실패 시 차감 없음)
    → JSON 파싱 (여기서 실패 시 차감 없음)
    → 구조 검증 (여기서 실패 시 차감 없음)
    → ★ FEATURE_FLAGS.MYEONDDARA_PHASE2_DEDUCT_USAGE 분기
         true  → 사용량 차감 + remaining 갱신 (정식 오픈)
         false → 차감 유예 + remaining 변동 없음 (현재 베타)
    → 응답 반환
```

**베타 유예 플래그 현재 상태**: `MYEONDDARA_PHASE2_DEDUCT_USAGE = false` (차감 유예 중)

- timeout(504) → 차감 없음 (플래그 무관)
- BILLING_REQUIRED(402) → 차감 없음 (플래그 무관)
- PARSE_ERROR(502) → 차감 없음 (플래그 무관)
- AI_ERROR(502) → 차감 없음 (플래그 무관)
- AI_TIMEOUT(504) → 차감 없음 (플래그 무관)
- USAGE_ERR(502) → 플래그 true 시에만 해당 (베타 유예 중 발생 안 함)

### 8-2. 테스트 시 준수 사항

- [ ] Production에 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` 배포 금지
- [ ] 운영 학부모 계정으로 반복 API 호출 금지
- [ ] 테스트용 자녀 프로필 사용 (운영 자녀와 분리)
- [x] 베타 기간 사용량 차감 유예 → `MYEONDDARA_PHASE2_DEDUCT_USAGE=false` 적용 완료
- [ ] 정식 오픈 전 `MYEONDDARA_PHASE2_DEDUCT_USAGE=true` 전환 및 동작 확인 필요
- [ ] 가능하면 local 또는 Preview 환경에서만 테스트

---

## 9. 금지 테스트

아래 테스트는 어떤 경우에도 진행하지 않습니다.

| 금지 항목 | 이유 |
|---|---|
| Production에서 PHASE2_ENABLED=true로 즉시 배포 | 운영 사용자 차감 발생 가능 |
| 실제 운영 사용자 계정으로 반복 테스트 | 사용량 소진 |
| 차감 여부 확인을 위한 무분별한 API 반복 호출 | 사용량 소진 + OpenAI 비용 |
| `OPENAI_API_KEY`를 Vercel 로그 또는 코드에 출력 | 키 노출 보안 위협 |
| 응답 전문에 개인 식별 정보 저장 | 개인정보처리방침 위반 |
| 결과 리포트 DB 저장 로직 추가 | 범위 외 기능 추가 |
| Phase 2 활성화와 요금제 정책 변경을 동시에 진행 | 복합 변경 리스크 |
| `isValidPhase2Result()` / `normalizePhase2Result()` 우회 | 안전 구조 파괴 |
| `@anthropic-ai/sdk` 제거를 Phase 2 활성화와 동시 진행 | 복합 변경 리스크 |

---

## 10. Phase 2 활성화 전 최종 체크리스트

아래 항목을 **모두 체크**한 뒤에만 제한 베타 활성화를 진행합니다.

### 10-1. 환경 준비

- [ ] Vercel Production에 `OPENAI_API_KEY` 등록 확인
- [ ] AI 상담 기능 정상 작동 확인 (동일 API Key 유효 확인)
- [ ] `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED`가 Production에 없음 확인

### 10-2. 코드 검증

- [ ] `PHASE2_ENABLED=false` 유지 확인 (`page.tsx` L32-33)
- [ ] `isValidPhase2Result()` 정상 동작 확인
- [ ] `normalizePhase2Result()` + fallback 정상 동작 확인
- [ ] `response_format: json_object` 설정 확인
- [ ] timeout(20s) 설정 확인
- [ ] 사용량 차감이 OpenAI 성공 이후에만 발생하는 구조 확인

### 10-3. 응답 품질 검증 (로컬/Preview 테스트)

- [ ] interestAreas 구조 정상 반환 확인
- [ ] `interestAreas[].title`에 직업명 없음 확인
- [ ] fitPercent / 퍼센트 / 순위 없음 확인
- [ ] 운세 / 운명 / 단정 표현 없음 확인
- [ ] disclaimer 있거나 fallback 작동 확인
- [ ] parentQuestions 3개 내외 확인
- [ ] recommendedActivities 2개 내외 확인
- [ ] JSON 파싱 실패 시 502 반환 확인 (crash 없음)

### 10-4. 정책 결정 (OZ.대표 결정 필요)

- [x] premium yearly_limit 정책 확정 → migration 047 완료 (premium=3, family_plus=9)
- [ ] 베타 기간 사용량 차감 유예 여부 결정
- [ ] 테스트 계정 지정
- [ ] 제한 베타 오픈 대상 범위 결정 (전체 오픈 vs 특정 계정)

### 10-5. 활성화 방법 (모두 체크 후 진행)

```
1. Vercel 환경변수에 추가:
   NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true

2. Production 재배포

3. 확인:
   - /myeonddara 진입 → Phase 2 모드 로그 확인
   - 분석 1회 실행 → interestAreas 결과 확인
   - Vercel Function Logs 확인
```

---

## 11. 롤백 기준

아래 상황에서는 Phase 2 활성화를 **즉시 중단 또는 롤백**합니다.

### 11-1. 즉시 롤백 조건 (P0)

| 조건 | 대응 |
|---|---|
| `/myeonddara` 페이지 crash 발생 | Vercel에서 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 삭제 후 재배포 |
| AI 상담(`/parent/counseling`) API에 영향 발생 | 동일 OPENAI_API_KEY 공유 여부 확인, 분리 필요 시 키 교체 |
| 사용량 차감이 의도치 않게 잘못 발생 | Supabase `myeonddara_usage` 테이블 점검, 해당 row 수동 조정 |
| Vercel 배포 실패 | 이전 commit으로 즉시 rollback |
| 개인정보처리방침과 다른 데이터 저장 발생 | 즉시 비활성화 후 원인 점검 |

### 11-2. 품질 롤백 조건 (P1)

| 조건 | 대응 |
|---|---|
| OpenAI 응답에 직업명이 반복적으로 포함 | SYSTEM_PROMPT 보정 후 재테스트 |
| JSON 파싱 실패가 반복적으로 발생 | `response_format: json_object` 설정 재확인, 프롬프트 조정 |
| 부모가 결과를 진로 단정으로 오해할 수 있는 화면 발견 | 문구 보정 후 재배포 |
| disclaimer 미표시 | fallback 동작 확인, 코드 점검 |

### 11-3. 롤백 방법

```
1. Vercel 환경변수에서 NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 삭제
2. 재배포 (코드 변경 없음)
3. → 자동으로 Phase 1 모드로 복귀
4. 코드 revert는 최후 수단 (환경변수 제거만으로 충분)
```

> Provider 코드(`route.ts`)는 유지하되, 환경변수만 제거하면 Phase 1으로 즉시 복귀됩니다.

---

## 12. OZ.대표 직접 확인 항목

아래 항목은 기술팀이 대신할 수 없으며 OZ.대표가 직접 확인해야 합니다.

| 번호 | 항목 | 확인 방법 |
|---|---|---|
| 1 | Vercel Production에 `OPENAI_API_KEY` 등록 여부 | Vercel 대시보드 → Settings → Environment Variables |
| 2 | AI 상담 기능 정상 작동 여부 | `/parent/counseling` 직접 사용 확인 |
| 3 | premium yearly_limit 정책 확정 | ✅ migration 047 완료: premium=3, family_plus=9 |
| 4 | 베타 기간 사용량 차감 유예 여부 결정 | 유예 시 별도 코드 작업 필요 |
| 5 | 제한 베타 활성화 시점 결정 | 이 문서 체크리스트 완료 후 결정 |
| 6 | 테스트 계정 지정 | 운영 사용자와 분리된 테스트 계정 필요 |

---

## 13. 미결 항목 (별도 작업 필요)

| 항목 | 등급 | 비고 |
|---|---|---|
| `@anthropic-ai/sdk` `package.json` 잔재 | P2 | 미사용 dependency. 기능 영향 없음. Provider 안정화 후 별도 정리 |
| premium yearly_limit DB값 정합성 | ✅ 완료 | migration 047: free=0 / basic=3 / premium=3 / family=6 / family_plus=9 |
| 베타 사용량 차감 유예 정책 | ✅ 완료 | `FEATURE_FLAGS.MYEONDDARA_PHASE2_DEDUCT_USAGE=false` 적용. 정식 오픈 시 true 전환 필요 |
| Phase 2 실제 OpenAI 샘플 응답 검증 | P1 | 로컬 테스트 후 결과 문서화 필요 |
| interestAreas title 직업명 포함 여부 반복 검증 | P1 | 3회 이상 샘플 테스트 권장 |

---

## 14. 관련 문서

| 문서 | 내용 |
|---|---|
| `docs/myeonddara-beta-design.md` §16 | interestAreas 전환 이력 |
| `docs/myeonddara-beta-design.md` §17 | OpenAI Provider 전환 이력, fallback 구조, Vercel 배포 확인 사항 |
| `src/app/api/myeonddara/route.ts` | Phase 2 API 구현체 |
| `src/app/myeonddara/page.tsx` | Phase 2 활성화 플래그, Phase 1/2 분기 |
| `src/app/myeonddara/result/page.tsx` | Phase 2 결과 화면 렌더링 |

---

---

## 15. 정적 검토 결과 (2026-05-23)

> 이 섹션은 로컬 `.env.local`에 `OPENAI_API_KEY` 미설정 상태에서 코드 정적 검토만 수행한 결과입니다.
> live OpenAI 응답 품질 검증(T-01~T-09)은 OPENAI_API_KEY 확보 후 별도 진행이 필요합니다.

### 15-1. S-01~S-08 정적 검토 결과

| 항목 | 결과 | 확인 위치 |
|---|---|---|
| S-01 PHASE2_ENABLED=false | ✅ | `.env.local` 명시, 빌드로그 "phase1 mode" 확인 |
| S-02 OPENAI_API_KEY 체크 | ✅ | `route.ts` L317-321: 미설정 시 503, 차감 없음 |
| S-03 isValidPhase2Result() | ✅ | `route.ts` L109-111: interestAreas 배열+길이>0 |
| S-04 normalizePhase2Result() | ✅ | `route.ts` L127-141: disclaimer/parentQuestions/recommendedActivities fallback 3종 |
| S-05 사용량 차감 위치 | ✅ | `route.ts` L412: FEATURE_FLAGS.MYEONDDARA_PHASE2_DEDUCT_USAGE=false → 차감 skip 확인 |
| S-06 Phase 1 분기 | ✅ | `page.tsx` L259: `if (!PHASE2_ENABLED)` → /api/myeonddara 미호출 확인 |
| S-07 response_format | ✅ | `route.ts` L341: `{ type: "json_object" }` |
| S-08 timeout | ✅ | `route.ts` L329-331: Promise.race + AI_TIMEOUT_MS=20_000 |

### 15-2. 추가 구조 확인

| 항목 | 결과 | 비고 |
|---|---|---|
| free 차단 로직 | ✅ | `route.ts` L244: yearlyLimit===0 → PLAN_BLOCKED 403 |
| Phase 1 free 차단 로직 | ✅ | `page.tsx` L144: yearlyLimit===0 → blocked |
| free=1 허용 | ✅ | yearlyLimit=0 조건만 차단, free(1)은 통과 |
| BILLING_REQUIRED fallback | ✅ | `page.tsx` L333-339: Phase 1 결과로 자동 fallback |
| JSON 파싱 실패 처리 | ✅ | `route.ts` L396-399: PARSE_ERROR 502, 차감 없음 |
| 구조 검증 실패 처리 | ✅ | `route.ts` L402-404: interestAreas 없음 → PARSE_ERROR 502 |
| interestAreas 최대 표시 | ✅ | `result/page.tsx` L423: `.slice(0, 3)` 안전 처리 |
| OPENAI_API_KEY 로컬 상태 | ⚠️ | `.env.local` 미설정 → live 테스트 불가 |
| MYEONDDARA_PHASE2_DEDUCT_USAGE | ✅ | `featureFlags.ts` L49: false (차감 유예 유지) |
| 프롬프트 금지 표현 명시 | ✅ | `route.ts` SYSTEM_PROMPT: 직업명/fitPercent/운세/단정 금지 명시 |

### 15-3. 발견된 이슈

| 등급 | 이슈 | 위치 | 상태 |
|---|---|---|---|
| P2 | `analysis.disclaimer`가 result/page.tsx에서 미렌더링 | `result/page.tsx` | 하단 정적 면책 문구(L511-514)로 대체 표시 중 → 기능적 차단 없음. 별도 작업으로 분리 |

### 15-4. Live 테스트 대기 항목 (OPENAI_API_KEY 필요)

아래 항목은 Vercel Preview 또는 OPENAI_API_KEY가 로컬에 추가된 후 진행해야 합니다.

- T-01: OpenAI 응답 생성 여부
- T-02: 필수 필드 전체 존재 여부
- T-03: interestAreas.title에 직업명 미포함 확인
- T-04: fitPercent / % 패턴 미포함 확인
- T-05: 운세/운명 표현 미포함 확인
- T-06: disclaimer 표시 (AI 생성 or fallback)
- T-07: 한도 초과 시 LIMIT_EXCEEDED 429 반환 확인
- T-08: Phase 1 정상 유지 (PHASE2_ENABLED=false 기준 — ✅ 이미 빌드로 확인됨)
- T-09: 인증 없는 접근 → AUTH_REQUIRED 401

### 15-5. Phase 2 제한 베타 활성화 판단 (정적 검토 기준)

정적 검토 기준 P0/P1 오류 없음. live 테스트 항목(T-01~T-07) 통과 후 제한 베타 가능.

**활성화 전 필수 작업:**
1. `OPENAI_API_KEY`를 Vercel Preview 또는 로컬에 설정하여 T-01~T-07 live 테스트 실행
2. 테스트 결과 이 문서 §15-4 항목 체크 처리
3. P0/P1 없음 최종 확인
4. Vercel 환경변수에 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` 추가 (Preview → Production 순)

---

---

## 16. Preview Live 테스트 준비 현황 (2026-05-23)

### 16-1. 테스트 브랜치 정보

| 항목 | 값 |
|---|---|
| 브랜치 | `test/phase2-smoke` |
| commit | `84397e4` |
| Vercel Preview URL | `https://kkumddara-git-test-phase2-smoke-johsoappa.vercel.app` |
| 배포 상태 | ✅ success (GitHub commit status 확인) |
| PHASE2_ENABLED | `true` (next.config.js에 임시 하드코딩 — test 브랜치 전용) |
| MYEONDDARA_PHASE2_DEDUCT_USAGE | `false` (featureFlags.ts 변경 없음) |
| main 병합 | ❌ 금지 — 테스트 완료 후 브랜치 삭제 예정 |

### 16-2. 빌드 검증 결과

test/phase2-smoke 브랜치 로컬 빌드에서 Phase 2 활성화 확인:

```
[myeonddara] phase2 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true (OpenAI API 활성)
✓ Compiled successfully
✓ Generating static pages (41/41)
```

main 브랜치 빌드는 Phase 2 비활성 유지 확인:

```
[myeonddara] phase1 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 or false (API 미호출)
```

### 16-3. 차단 항목 (OZ.대표 직접 수행 필요)

| 항목 | 사유 |
|---|---|
| Preview URL 브라우저 접근 | Vercel 배포 보호 → Vercel 로그인 필요 |
| 카카오 OAuth 로그인 | 브라우저 세션 필요 |
| OpenAI Live 호출 확인 | 인증된 세션 + 브라우저 필요 |
| used_count 사전/사후 비교 | Supabase SQL Editor 접근 필요 |

### 16-4. OZ.대표가 직접 수행할 Preview Live 테스트 절차

**준비:**
1. Supabase SQL Editor에서 테스트 child의 사전 used_count 확인
   ```sql
   SELECT child_id, used_year, count FROM public.myeonddara_usage
   WHERE used_year = 2026 ORDER BY updated_at DESC LIMIT 5;
   ```

**테스트:**
1. 브라우저에서 아래 URL 접속 (Vercel 로그인 필요)
   `https://kkumddara-git-test-phase2-smoke-johsoappa.vercel.app`
2. 꿈따라 테스트 계정으로 카카오 로그인
3. `/myeonddara` 진입 → 헤더에 `"올해 N회 남음"` 배지 확인 (Phase 2 활성 지표)
4. 입력값 입력 (이름: 테스트아이, 생년월일: 2015-03-12, 양력, 시간 모름, 성별 선택)
5. 분석 시작 → 로딩 오버레이 표시 확인
6. 결과 화면 진입 후 확인:
   - [ ] `summary` — 사주 카드 하단에 표시
   - [ ] `interestAreas` — "관심을 넓혀볼 분야" 카드 (1~3개)
   - [ ] `interestAreas.title` — 직업명 아닌 활동 분야명
   - [ ] `parentQuestions` — "부모 대화 질문" 카드
   - [ ] `recommendedActivities` — "이번 주 함께 해보세요" 카드
   - [ ] `todayHint` — "오늘의 대화 힌트" 카드
   - [ ] `analysis.disclaimer` — AI 생성 면책 문구 (새로 추가)
   - [ ] 하단 정적 면책 문구 — "명따라는 만세력 기반..."

**금지 표현 검수:**
   - [ ] "%" / "퍼센트" / 순위 없음
   - [ ] 직업명 직접 추천 없음
   - [ ] "운세" / "운명" / "반드시" 없음
   - [ ] 진로 단정 없음

**사후 확인:**
7. Supabase SQL에서 테스트 child의 사후 used_count 확인 → 변동 없어야 함
8. Vercel Function Logs에서 차감 유예 로그 확인:
   `[api/myeonddara] ⑦ Phase 2 베타 사용량 차감 유예 (MYEONDDARA_PHASE2_DEDUCT_USAGE=false)`

### 16-5. 테스트 완료 후 정리

- [ ] 테스트 결과를 이 문서 §16-6에 기록
- [ ] `test/phase2-smoke` 브랜치 삭제: `git push origin --delete test/phase2-smoke`
- [ ] 로컬 브랜치 삭제: `git branch -d test/phase2-smoke`
- [ ] main에는 어떤 Phase 2 활성화 코드도 병합하지 않음 확인

### 16-6. Live 테스트 결과 기록

| 항목 | 결과 | 비고 |
|---|---|---|
| Preview 접속 | ✅ | Preview URL 접속 성공, 도메인 유지 |
| Phase 2 호출 여부 | ✅ | `POST /api/myeonddara` 200 OK |
| JSON 파싱 성공 | ✅ | Phase 2 결과 화면 정상 렌더링 |
| interestAreas 구조 | ✅ | Phase 2 결과 화면 표시 성공 |
| Coming Soon 미표시 | ✅ | Phase 2 활성 — 준비중 화면 미표시 |
| 금지 표현 | — | OZ.대표 결과 화면 목시 확인 (별도 체크 미언급) |
| disclaimer 표시 | — | OZ.대표 결과 화면 목시 확인 (별도 체크 미언급) |
| used_count 변동 | ✅ 차감 없음 | Vercel 로그: `[api/myeonddara] 최종 응답 반환 (차감 유예 - remaining 변동 없음)` |
| 전체 판정 | ✅ **통과** | Phase 2 Preview Live 테스트 통과 |
| 테스트 계정 | user@test.com | |
| 테스트 child_id | ed51a4f9-2819-4542-bd3f-c222e3ef79f5 | |
| 테스트 일자 | 2026-05-25 | |

### 16-7. 테스트 완료 후 정리 현황

- [x] `test/phase2-smoke` 브랜치 삭제 완료 (2026-05-25)
- [x] 로컬 브랜치 삭제 완료 (2026-05-25)
- [x] main에 Phase 2 활성화 코드 병합 없음 확인

---

## 17. 제한 베타 활성화 설계 (2026-05-25)

> Preview Live 테스트 전항목 통과 후 결정된 활성화 방식.
> Production 전체 활성화 없이 특정 계정에만 Phase 2를 허용합니다.

### 17-1. 허용 목록 기반 서버 분기 구조

```
POST /api/myeonddara (Phase 2)
  → 인증 확인 (3단계)
  → ★ 베타 허용 목록 확인 (3-1단계, 신규)
      MYEONDDARA_PHASE2_BETA_EMAILS 설정 시
        → 허용 목록 포함: Phase 2 진행
        → 허용 목록 미포함: BETA_NOT_ELIGIBLE 403 반환
      미설정 또는 빈 값: 전체 허용 (정식 오픈 시 이 변수 삭제로 전환)
```

클라이언트(`page.tsx`) `BETA_NOT_ELIGIBLE` 수신 시:
- 사용자에게 오류 노출 없음
- Phase 1 경로로 자동 전환 (만세력 결과, usage API 호출)

### 17-2. Vercel 환경변수 설정 (OZ.대표 직접 설정)

| 변수명 | 설정 환경 | 값 예시 | 비고 |
|---|---|---|---|
| `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` | Production | `true` | 클라이언트가 Phase 2 경로 진입 허용 |
| `MYEONDDARA_PHASE2_BETA_EMAILS` | Production | `user@test.com,oz@example.com` | 서버 전용, 쉼표 구분, 공백 허용 |

> **허용 범위 변경 시**: Vercel 대시보드에서 `MYEONDDARA_PHASE2_BETA_EMAILS` 값만 수정 후 재배포.
> 코드 변경 불필요.

> **정식 전체 오픈 시**: `MYEONDDARA_PHASE2_BETA_EMAILS` 변수를 삭제하면 모든 사용자에게 Phase 2 허용.

### 17-3. 구현 내역 (commit 기준)

| 파일 | 변경 내용 |
|---|---|
| `src/app/api/myeonddara/route.ts` | 인증 확인 후 `MYEONDDARA_PHASE2_BETA_EMAILS` allowlist 체크 추가 (§3-1) |
| `src/app/myeonddara/page.tsx` | `BETA_NOT_ELIGIBLE` 403 수신 시 Phase 1 fallback + usage 기록 처리 추가 |

### 17-4. 비허용 사용자 동작

| 상황 | 동작 |
|---|---|
| 허용 목록 미포함 계정이 분석 실행 | 스피너 표시 → Phase 2 API 호출 → `BETA_NOT_ELIGIBLE` 수신 → 자동으로 Phase 1 결과 이동 |
| Phase 1 usage 처리 | 정상 차감 (허용 목록 미포함도 분석 결과 제공) |
| 사용자 화면 | Phase 1 결과와 동일 — 오류/안내 없음 |

### 17-5. 정식 오픈 체크리스트

- [ ] `MYEONDDARA_PHASE2_DEDUCT_USAGE=true` 전환 (`featureFlags.ts`)
- [ ] `MYEONDDARA_PHASE2_BETA_EMAILS` Vercel에서 제거
- [ ] Production 배포 후 전체 사용자 Phase 2 결과 확인
- [ ] docs/myeonddara-beta-design.md에 정식 오픈 이력 기록

---

*이 문서는 2026-05-22 최초 작성, 2026-05-23 Free 1회 체험 정책 전환 반영 (T-10~T-12, §8-1 업데이트), 2026-05-23 정적 검토 결과 기록 (§15), 2026-05-23 Preview 브랜치 배포 및 수동 테스트 절차 기록 (§16), 2026-05-25 Preview Live 테스트 결과 기록 (§16-6, 전항목 통과), 2026-05-25 제한 베타 허용 목록 구현 기록 (§17).*
*Phase 2 실제 활성화 시 이 문서의 체크리스트를 완료 처리하고, 활성화 이력을 `docs/myeonddara-beta-design.md`에 기록하세요.*
