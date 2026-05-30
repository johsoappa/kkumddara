# 꿈따라 정책 문서 ↔ 실제 UI 문구 정합성 점검

> 작성일: 2026-05-30  
> 기준 정책 문서: `docs/plan-permission-and-usage-policy.md`  
> 기준 commit: `8c06b49` (Document plan permission and usage limit policy)

---

## 1. 점검 목적

`docs/plan-permission-and-usage-policy.md` 정책 문서 생성 이후,
실제 사용자 화면의 문구가 정책 기준과 충돌하지 않는지 확인하고 명백한 불일치를 최소 보정한다.

---

## 2. 기준 문서

- `docs/plan-permission-and-usage-policy.md`

---

## 3. 점검 범위

| 파일 | 점검 여부 |
|---|---|
| `src/app/page.tsx` | ✅ 점검 |
| `src/app/pricing/page.tsx` | ✅ 점검 + FIXED |
| `src/app/demo/parent/page.tsx` | ✅ 점검 |
| `src/app/demo/student/page.tsx` | ✅ 점검 |
| `src/app/myeonddara/page.tsx` | ✅ 점검 |
| `src/app/myeonddara/result/page.tsx` | ✅ 점검 |
| `src/app/parent/counseling/page.tsx` | ✅ 점검 |
| `src/app/report/page.tsx` | ✅ 점검 |
| `src/app/refund/page.tsx` | ✅ 점검 |
| `src/app/faq/page.tsx` | ✅ 점검 + FIXED |
| `src/app/contact/page.tsx` | ✅ 점검 |
| `src/app/guide/page.tsx` | ✅ 점검 + FIXED |
| `src/app/settings/page.tsx` | ✅ 점검 |
| `src/app/terms/page.tsx` | ✅ 점검 |

---

## 4. 검색어 기준

아래 검색어로 사용자 노출 영역을 전수 점검했다:

```
14일 무료 체험 / 자동결제 / 무료 체험 / 베타
명따라 / 연 3회 / AI 진로 상담
공동 양육자 초대 / 자녀 / 결제 / 환불
50개 직업 / 합격 보장 / 진로 확정 / 성공 보장
미래를 예측 / 선수가 못 되면 / 대체 직업
```

---

## 5. 주요 점검 결과

| 영역 | 파일 | 결과 | 내용 |
|---|---|---|---|
| 베타 안내 | demo/parent/page.tsx | **PASS** | "베타 기간 무료 이용 · 자동결제 없음" — 정책 기준과 일치 |
| 베타 안내 | demo/student/page.tsx | **PASS** | "베타 기간 무료 이용 · 자동결제 없음" — 정책 기준과 일치 |
| 랜딩 문구 | page.tsx | **PASS** | "아직 꿈이 없어도 괜찮아요 / 좋아하는 것에서 직업을 찾아요" |
| 명따라 1회 체험 | myeonddara/page.tsx | **PASS** | "무료 체험 1회를 모두 사용했어요" — 정책 기준과 일치 |
| 명따라 연 3회 | myeonddara/page.tsx | **PASS** | 코드 `PER_CHILD_YEARLY_LIMIT=3` 기준과 일치. 유료 플랜 안내 |
| AI 상담 참고용 | parent/counseling/page.tsx | **PASS** | "AI 답변은 참고 제안", "진로 탐색 도우미" |
| 리포트 진로 대화 도구 | report/page.tsx | **PASS** | "이 리포트는 자녀의 진로를 단정하지 않습니다." |
| 환불 베타 안내 | refund/page.tsx | **PASS** | 베타 운영 배너 + 제2조 "베타 기간 운영 기준" |
| 결제 미오픈 | pricing/page.tsx FAQ | **PASS** | "정식 결제 기능은 준비 중", "베타 기간 무료" 명시 |
| 금지 표현 전체 | 전체 | **PASS** | 합격보장·진로확정·성공보장·AI정답·대체직업 — 0건 |
| 요금제 직업 수 | pricing/page.tsx | **FIXED** | `"50개 직업"` → `"100개 직업"` (직업 확장 반영) |
| 베타 안내 카드 제목 | pricing/page.tsx | **FIXED** | `"베타 기간 무료 체험"` → `"베타 기간 무료 이용"` (정책 표준 문구) |
| 공동 양육자 FAQ | faq/page.tsx | **FIXED** | 가능처럼 표현된 문구 → 베타 비활성 상태로 수정 |
| 공동 양육자 가이드 | guide/page.tsx | **FIXED** | 가능처럼 표현된 문구 → 베타 비활성 상태로 수정 |
| 구독 해지 FAQ | faq/page.tsx | **DEFER** | "설정 > 구독 관리" — 결제 기능 미오픈 맥락이나, 정식 오픈 후 안내용으로 유지 |
| terms 자동결제 | terms/page.tsx | **DEFER** | "자동결제 여부와 주기는 결제 화면에 별도 표시" — 정식 오픈 후 적용 기준. 유지 |
| 공동 양육자 pricing 플랜표 | pricing/page.tsx | **DEFER** | "공동 양육자 초대 (1명)" — 유료 플랜 정식 오픈 시 제공 예정 기능. 정책 미확정이나 pricing 플랜 설명표 맥락으로 유지 |

---

## 6. 수정한 사용자 노출 문구

| 영역 | 파일 | 변경 전 | 변경 후 | 사유 |
|---|---|---|---|---|
| 요금제 직업 수 (유료 플랜 카드) | `src/app/pricing/page.tsx` | `"진로 탐색 50개 직업 전체 열람"` | `"진로 탐색 100개 직업 열람"` | occupation_master 100개 확장 반영 |
| 요금제 직업 수 (FreePlanBox) | `src/app/pricing/page.tsx` | `"진로 탐색 50개 직업 전체 열람"` | `"진로 탐색 100개 직업 열람"` | 동일 |
| 베타 안내 카드 제목 | `src/app/pricing/page.tsx` | `"베타 기간 무료 체험"` | `"베타 기간 무료 이용"` | 정책 표준 문구 "베타 기간 무료 이용 · 자동결제 없음" 기준 통일 |
| 공동 양육자 FAQ | `src/app/faq/page.tsx` | `"네, 메인 계정(결제자)이 공동 양육자 1인을 초대할 수 있습니다. ..."` | `"현재 베타 기간에는 공동 양육자 초대 기능이 제공되지 않습니다. 정식 오픈 후 ... 준비 중입니다."` | 실제 코드에서 베타 기간 비활성 상태와 충돌. 실제 기능 상태 반영 |
| 공동 양육자 가이드 | `src/app/guide/page.tsx` | `"설정 메뉴에서 배우자 또는 공동 양육자를 초대하세요. ..."` | `"현재 베타 기간에는 공동 양육자 초대 기능이 제공되지 않습니다. 정식 오픈 후 ... 준비 중입니다."` | 동일 |

---

## 7. 수정하지 않은 항목과 사유

| 항목 | 결과 | 사유 |
|---|---|---|
| FAQ "구독 해지" 안내 | DEFER | 결제 기능 오픈 시 유효한 안내. 기능 구현 전 맥락이나, 미래 지향적 안내로 유지 가능 |
| terms.tsx "자동결제 여부와 주기" | DEFER | 이용약관은 정식 오픈 기준. 현재 베타 배너가 상단에 존재해 맥락 명확 |
| pricing.tsx 유료 플랜 "공동 양육자 초대 (1명)" | DEFER | 유료 플랜 정식 오픈 시 제공 예정 기능 설명. 정책 미확정이나 pricing 비교 맥락으로 유지. 정식 오픈 전 확정 필요 |
| myeonddara.tsx "연 3회" | PASS | 코드 `PER_CHILD_YEARLY_LIMIT=3`과 일치. 실제 동작 기준 |
| pricing FAQ "연 3회" subLabel | PASS | 동일. 코드 기준과 일치 |

---

## 8. 남은 정책 확정 필요 항목

이번 점검에서 확인된 정책 미확정 항목:

| 항목 | 현재 상태 |
|---|---|
| 명따라 유료 플랜별 연간 횟수 | 코드 기준 3회이나 공식 정책 미확정 |
| AI 상담 월간/일간 제한 | 코드 기준 `FREE_LIMIT=3` 이나 플랜별 정식 정책 미확정 |
| 공동 양육자 초대 인원 수 | 미확정 (pricing 플랜표에는 1명으로 표기) |
| Family Plus 자녀 수 상한 | 미확정 |
| 부모 주간 리포트 플랜별 제공 범위 | 미확정 |
| Free 플랜 정식 오픈 후 제공 범위 | 미확정 |
| `MYEONDDARA_PHASE2_DEDUCT_USAGE` → true 전환 시점 | 미확정 |

---

## 9. 변경하지 않은 기술 영역

| 항목 | 상태 |
|---|---|
| DB / migration | ❌ 없음 |
| Supabase SQL | ❌ 없음 |
| RLS / Auth | ❌ 없음 |
| API 라우트 | ❌ 없음 |
| AI 호출 로직 | ❌ 없음 |
| 사용량 차감 로직 | ❌ 없음 |
| 결제 로직 | ❌ 없음 |
| 요금제 권한 체크 로직 | ❌ 없음 |
| occupation_master | ❌ 없음 |
| roadmaps.ts | ❌ 없음 |
| Phase 2 활성화 | ❌ 없음 |
| 환경변수 | ❌ 없음 |

---

## 10. 최종 판정

**PASS** — 정책 문서 기준과 실제 UI 문구 간 주요 불일치 해소됨

| 항목 | 결과 |
|---|---|
| 금지 표현 전체 | ✅ 0건 |
| 14일 무료 체험 문구 | ✅ 0건 |
| 베타 기간 무료 이용 표준 문구 | ✅ 통일 |
| 직업 수 100개 반영 | ✅ 완료 |
| 공동 양육자 베타 비활성 반영 | ✅ FAQ/guide 수정 완료 |
| 결제 미오픈 상태 반영 | ✅ 기존 베타 안내로 유지 |
| tsc --noEmit | ✅ PASS |
| npm run build | ✅ PASS |

---

## 11. 변경 이력

| 날짜 | 내용 | 파일 |
|---|---|---|
| 2026-05-30 | 정책 ↔ UI 문구 정합성 점검 및 최소 보정 | 본 문서 신규 생성 |
| 2026-05-30 | `"50개 직업"` → `"100개 직업"` | pricing/page.tsx |
| 2026-05-30 | `"베타 기간 무료 체험"` → `"베타 기간 무료 이용"` | pricing/page.tsx |
| 2026-05-30 | 공동 양육자 초대 FAQ → 베타 비활성 상태 반영 | faq/page.tsx |
| 2026-05-30 | 공동 양육자 초대 가이드 → 베타 비활성 상태 반영 | guide/page.tsx |
