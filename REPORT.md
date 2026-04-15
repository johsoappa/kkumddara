# 명따라 Phase 1 미적용 원인 분석 보고서

> 작성일: 2026-04-15
> 작업 구분: 긴급 점검 — 운영 환경 Phase 2 지속 호출 원인 분석

---

## 1. 확정 원인

| 항목 | 내용 |
|---|---|
| **증상** | 운영에서 계속 `POST /api/myeonddara` + 502 발생 |
| **원인** | 피처 플래그 코드가 **로컬에만 존재, Vercel에 미배포** |
| **핵심** | 변경된 파일 5개 모두 `git commit` 미완료 상태 |
| **결론** | Vercel은 이전 커밋(`2549bde`) 기준으로 동작 중 — 플래그 코드 자체 없음 |

> `.env.local` 수정은 로컬 개발 전용입니다. Vercel 운영 환경에 **전혀 영향을 주지 않습니다.**

---

## 2. git 상태 (점검 시점 기준)

```bash
$ git status --short
 M src/app/myeonddara/page.tsx        ← 피처 플래그 + 안전장치 로그 (미커밋)
 M src/app/api/myeonddara/route.ts    ← Billing 에러 감지 + 디버그 로그 (미커밋)
 M src/app/myeonddara/result/page.tsx ← Phase 1/2 세션 키 통합 (미커밋)
 M src/data/myeonddara.ts             ← MYEONDDARA_SAJU_KEY 추가 (미커밋)
 M src/lib/manseryeok.ts              ← 만세력 엔진 수정 (미커밋)
?? REPORT.md                          ← 미추적

$ git log --oneline -1
2549bde feat: 명따라 만세력 + Claude API 전면 업그레이드  ← Vercel이 실행 중인 버전
```

---

## 3. NEXT_PUBLIC_ 변수 동작 구조

```
┌─────────────────────────────────────────────────────────┐
│  빌드 시 (Vercel Build)                                  │
│  NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED = ?              │
│   → "true"  : 번들에 "true"  임베드 → Phase 2 활성      │
│   → "false" : 번들에 "false" 임베드 → Phase 1 활성      │
│   → 미설정  : 번들에 undefined 임베드 → Phase 1 활성    │
└────────────────────────┬────────────────────────────────┘
                         │ 런타임에는 변경 불가 (빌드 타임 상수)
                         ▼
              클라이언트 JS 번들에 고정
```

현재 운영 번들(`2549bde`)에는 `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 로직 자체가 없음.
해당 버전은 항상 `/api/myeonddara`를 호출합니다.

---

## 4. 피처 플래그 코드 분석 (로컬 현재 상태)

### 분기 위치: `src/app/myeonddara/page.tsx`

```typescript
// 29~33행: 피처 플래그 정의
const PHASE2_ENABLED =
  process.env.NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED === "true";
```

### 안전장치 로그 (35~41행, 기추가)

```typescript
console.log(
  PHASE2_ENABLED
    ? "[myeonddara] phase2 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true (Claude API 활성)"
    : "[myeonddara] phase1 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 or false (API 미호출)"
);
```

### 분기 로직 위치

```typescript
if (!PHASE2_ENABLED) {
  // Phase 1: 만세력 계산 → sessionStorage → 결과 이동
  sessionStorage.setItem(MYEONDDARA_SAJU_KEY, JSON.stringify({ saju, inputData }));
  router.push("/myeonddara/result");
  return;   // ← 완전 종료. API 호출 경로 없음.
}

// Phase 2: Claude API 호출 (아래부터)
setAnalyzing(true);
const res = await fetch("/api/myeonddara", { ... });
```

**false일 때 API 호출 가능한 잔여 경로: 없음.** `return`으로 완전 종료.

---

## 5. 기본값 처리 문제 여부

| 시나리오 | `PHASE2_ENABLED` 값 | 동작 |
|---|---|---|
| Vercel 환경변수 미설정 | `undefined === "true"` → `false` | ✅ Phase 1 (안전) |
| Vercel 환경변수 `"false"` | `"false" === "true"` → `false` | ✅ Phase 1 |
| Vercel 환경변수 `"true"` | `"true" === "true"` → `true` | Phase 2 활성 |

> **Vercel에 해당 변수가 설정되어 있지 않아도 Phase 1이 기본 동작합니다.**
> 코드 배포 후 추가 환경변수 설정 없이도 Phase 1이 작동합니다.

---

## 6. TypeScript 빌드 결과

```bash
$ npx tsc --noEmit
(출력 없음) → ✅ 에러 없음
```

---

## 7. 수정 필요 파일 — 커밋 대상

| 파일 | 변경 내용 | 상태 |
|---|---|---|
| `src/app/myeonddara/page.tsx` | 피처 플래그 + Phase 1 분기 + 안전장치 로그 | ⚠️ 미커밋 |
| `src/app/api/myeonddara/route.ts` | Billing 에러 감지 + 디버그 로그 ①~⑨ | ⚠️ 미커밋 |
| `src/app/myeonddara/result/page.tsx` | Phase 1/2 세션 키 통합, 준비중 카드 | ⚠️ 미커밋 |
| `src/data/myeonddara.ts` | `MYEONDDARA_SAJU_KEY` 상수 추가 | ⚠️ 미커밋 |
| `src/lib/manseryeok.ts` | 만세력 엔진 수정 | ⚠️ 미커밋 |

---

## 8. 해결 절차

### Step 1 — 커밋 및 푸시

```bash
git add src/app/myeonddara/page.tsx \
        src/app/api/myeonddara/route.ts \
        src/app/myeonddara/result/page.tsx \
        src/data/myeonddara.ts \
        src/lib/manseryeok.ts

git commit -m "fix: 명따라 Phase 1 전환 — Claude API 미호출, 피처 플래그 + 안전장치 로그 추가"

git push  # Vercel 자동 배포 트리거
```

### Step 2 — Vercel 환경변수 (선택)

코드 배포 후 변수 미설정 상태로 둬도 Phase 1이 동작합니다.
명시적으로 관리하려면 Vercel Dashboard에서 아래를 설정하세요.

```
NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED = false
```

### Step 3 — 배포 후 검증

Vercel 함수 로그 또는 브라우저 콘솔에서 아래 문구 확인:

```
[myeonddara] phase1 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 or false (API 미호출)
```

이 로그가 보이면 Phase 1 정상 동작. `POST /api/myeonddara` 호출이 사라져야 합니다.

---

## 9. 남은 리스크

| 항목 | 내용 | 조치 |
|---|---|---|
| `manseryeok.ts` 동시 커밋 | 만세력 엔진 변경도 함께 배포됨 | 엔진 확정 보류 중 — 분리 커밋 고려 |
| `NEXT_PUBLIC_` 빌드 타임 임베드 | 환경변수 변경 후 반드시 재배포 필요 | git push 후 Vercel 배포 완료 확인 |

---

## 10. 다음 액션

| 순서 | 항목 | 담당 | 기준 |
|---|---|---|---|
| 1 | **git commit + git push** (Step 1 명령어 실행) | 크라 | 5개 파일 커밋, Vercel 배포 대기 |
| 2 | Vercel 배포 완료 후 로그 확인 | 크라 | `[myeonddara] phase1 mode` 로그 확인 |
| 3 | 운영에서 `POST /api/myeonddara` 호출 소멸 확인 | 크라 | Vercel Functions 로그 모니터링 |
| 4 | Anthropic 크레딧 충전 후 Phase 2 재활성화 | OZ.대표 | `NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true` + 재배포 |
