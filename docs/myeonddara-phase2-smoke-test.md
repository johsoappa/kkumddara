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
| T-10 | 플랜 차단 | free 플랜 계정 | `PLAN_BLOCKED` 403 반환, 차감 없음 |

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

### 8-1. 현재 차감 구조

```
Phase 2 흐름:
  POST /api/myeonddara
    → 인증 확인
    → 플랜 확인
    → 사용량 확인 (차감 전)
    → OpenAI 호출 (여기서 실패 시 차감 없음)
    → JSON 파싱 (여기서 실패 시 차감 없음)
    → 구조 검증 (여기서 실패 시 차감 없음)
    → ★ 사용량 차감 (이 시점에서만 차감 발생)
    → 응답 반환
```

- timeout(504) → 차감 없음
- BILLING_REQUIRED(402) → 차감 없음
- PARSE_ERROR(502) → 차감 없음
- AI_ERROR(502) → 차감 없음
- AI_TIMEOUT(504) → 차감 없음
- USAGE_ERR(502) → 차감 실패, 응답도 차단

### 8-2. 테스트 시 준수 사항

- [ ] Production에 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` 배포 금지
- [ ] 운영 학부모 계정으로 반복 API 호출 금지
- [ ] 테스트용 자녀 프로필 사용 (운영 자녀와 분리)
- [ ] 테스트 1회 = 사용량 1회 차감 발생 가능성 인지
- [ ] 사용량 차감이 발생하는 실 테스트는 OZ.대표 승인 후 진행
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
| 베타 사용량 차감 유예 정책 | P1 | OZ.대표 결정 필요. 유예 시 추가 코드 작업 필요 |
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

*이 문서는 2026-05-22 최초 작성.*
*Phase 2 실제 활성화 시 이 문서의 체크리스트를 완료 처리하고, 활성화 이력을 `docs/myeonddara-beta-design.md`에 기록하세요.*
