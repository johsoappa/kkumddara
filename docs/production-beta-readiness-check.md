# 꿈따라 프로덕션 베타 운영 전 최종 실사용 점검 결과

> 점검일: 2026-05-30  
> 점검 방법: 코드 기준 정적 분석 (tsc, grep, 구조 검증). 실 브라우저 확인 항목은 OZ 수동 확인 필요로 명시.  
> 기준 commit: `e466aca` (Document beta operation management guide)  
> 이전 검증: `docs/final-beta-smoke-test-20260527.md` PASS 기준 유지

---

## 1. 점검 목적

- 최신 커밋이 실제 운영 사이트에 반영됐는지 확인
- 랜딩/체험/탐색/로드맵/명따라/AI 상담/정책 페이지가 코드 기준 정상인지 확인
- 신규 29개 로드맵 실 브라우저 렌더링 가능 여부 확인 (코드 기준 전수 PASS 포함)
- 학부모 체험하기 카드 3개 인라인 안내 동작 확인
- `14일 무료 체험` 문구 제거 확인
- 베타 운영 시작 가능 여부 최종 판정

---

## 2. 점검 기준 상태

| 항목 | 현재 상태 |
|---|---|
| 기준 commit | `e466aca` |
| tsc --noEmit | ✅ PASS |
| npm run build | ✅ PASS |
| 대표 직업 로드맵 커버리지 | 100/100 (0개 미작성) |
| 학부모 체험하기 카드 수정 | 완료 (3개 모두 인라인 안내 전환) |
| 핵심 컨셉 재정렬 | 완료 |
| 베타 운영 가이드 | 완료 (`docs/beta-operation-guide.md`) |

---

## 3. 운영 도메인 확인

> ⚠️ **OZ 수동 확인 필요** — 코드 환경에서 외부 URL 직접 접속 불가

| 항목 | 기대 결과 | 확인 방법 | 상태 |
|---|---|---|---|
| `https://꿈따라.kr` 접속 | 정상 | 브라우저 직접 접속 | **OZ 확인 필요** |
| `https://kkumddara.kr` 접속 | 정상 | 브라우저 직접 접속 | **OZ 확인 필요** |
| SSL 인증서 | 유효 | 자물쇠 아이콘 확인 | **OZ 확인 필요** |
| 모바일 접속 (iPhone/Android) | 정상 | 실 기기 또는 DevTools | **OZ 확인 필요** |
| 최신 문구 반영 | `아직 꿈이 없어도 괜찮아요.` | 랜딩 첫 화면 | **OZ 확인 필요** |
| 오래된 문구 없음 | `14일 무료 체험` 없음 | 화면 확인 | **코드 기준 ✅ 없음** |

---

## 4. 핵심 페이지 점검 결과

### 코드 기준 확인 결과

| 페이지 | 핵심 확인 항목 | 코드 기준 결과 | 실 브라우저 |
|---|---|---|---|
| `/` | 핵심 컨셉 h1 존재 | ✅ "아직 꿈이 없어도 괜찮아요 / 좋아하는 것에서 직업을 찾아요" | OZ 확인 필요 |
| `/demo/parent` | 베타 기간 무료 이용, 인라인 안내 | ✅ 14일 문구 없음, 3카드 auth_required | OZ 확인 필요 |
| `/demo/student` | 핵심 컨셉 서브텍스트, 베타 문구 | ✅ "아직 꿈이 정해지지 않아도..." 서브텍스트, 베타 기간 무료 이용 | OZ 확인 필요 |
| `/explore` | 직업 탐색 기능 | ✅ DB 기반 로드 + 관심 운동 CTA | OZ 확인 필요 |
| `/explore/interests/sports` | 관심 운동 탐색 | ✅ 금지 표현 없음, 10개 운동 카드 | OZ 확인 필요 |
| `/myeonddara` | 참고용 리포트 표현, Phase 1 | ✅ "대화를 시작하는 베타 기능", Phase 2 비활성 | OZ 확인 필요 |
| `/parent/counseling` | 탐색 도우미 표현, 참고 제안 | ✅ "AI 진로 탐색 도우미", "참고 제안" 면책 | OZ 확인 필요 |
| `/report` | 베타 배지, 진로 단정 금지 | ✅ "이 리포트는 자녀의 진로를 단정하지 않습니다." | OZ 확인 필요 |
| `/pricing` | 베타 무료 체험, AI 베타 안내 | ✅ "베타 기간 무료 체험", 결제 미오픈 안내 | OZ 확인 필요 |
| `/contact` | 카카오채널 URL, 이메일 | ✅ `pf.kakao.com/_xfkxfjX`, `kkumddara@ozklab.com` | OZ 확인 필요 |
| `/faq` | 이메일, 보장 금지 | ✅ `kkumddara@ozklab.com`, "보장하지 않으며" | OZ 확인 필요 |
| `/guide` | 이메일, 가이드 내용 | ✅ `kkumddara@ozklab.com` | OZ 확인 필요 |
| `/privacy` | 보호책임자 이메일 | ✅ `contact@ozklab.com`, OZ.K Lab | OZ 확인 필요 |
| `/refund` | 베타 기간 운영 기준 문구 | ✅ 제2조 "베타 기간 운영 기준", 14일 문구 없음 | OZ 확인 필요 |

---

## 5. 학부모 체험하기 점검 결과

**확인 파일:** `src/app/demo/parent/page.tsx`

| 항목 | 기대 결과 | 코드 기준 | 실 브라우저 |
|---|---|---|---|
| 페이지 진입 | 정상 | ✅ | OZ 확인 필요 |
| 주간 리포트 카드 | 준비중 배지 없음, 클릭 시 인라인 안내 | ✅ `AUTH_REQUIRED_FEATURES` 처리 | OZ 확인 필요 |
| AI 진로 상담 카드 | 준비중 배지 없음, 클릭 시 인라인 안내 | ✅ `badge` 제거, 인라인 박스 | OZ 확인 필요 |
| 명따라 카드 | 클릭 시 인라인 안내 | ✅ `AUTH_REQUIRED_FEATURES` 처리 | OZ 확인 필요 |
| 카드 클릭 시 홈으로 튕김 | 없어야 함 | ✅ `router.push(href)` 제거됨 | OZ 확인 필요 |
| 로그인 CTA | `로그인하고 내 아이 프로필 만들기` | ✅ | OZ 확인 필요 |
| 하단 문구 | `베타 기간 무료 이용 · 자동결제 없음` | ✅ | OZ 확인 필요 |
| `14일 무료 체험` 문구 | 없어야 함 | ✅ 없음 | OZ 확인 필요 |

---

## 6. 학생 체험하기 점검 결과

**확인 파일:** `src/app/demo/student/page.tsx`

| 항목 | 기대 결과 | 코드 기준 | 실 브라우저 |
|---|---|---|---|
| 페이지 진입 | 정상 | ✅ | OZ 확인 필요 |
| 핵심 컨셉 서브텍스트 | `아직 꿈이 정해지지 않아도 괜찮아요.` | ✅ line 131 | OZ 확인 필요 |
| `14일 무료 체험` 문구 | 없어야 함 | ✅ 없음 | OZ 확인 필요 |
| `베타 기간 무료 이용` 문구 | 표시 | ✅ line 280 | OZ 확인 필요 |
| 직업 탐색 흐름 | 자연스러움 | ✅ | OZ 확인 필요 |
| 과도한 AI 중심 문구 | 없어야 함 | ✅ | OZ 확인 필요 |

---

## 7. 직업 탐색·관심 운동 점검 결과

**확인 파일:** `src/app/explore/page.tsx`, `src/app/explore/interests/sports/page.tsx`

| 항목 | 코드 기준 | 실 브라우저 |
|---|---|---|
| 직업 탐색 진입 | ✅ occupation_master DB 연동 | OZ 확인 필요 |
| 대표 직업 목록 | ✅ is_representative=true 필터 | OZ 확인 필요 |
| 검색 기능 | ✅ search state 정상 | OZ 확인 필요 |
| 관심 운동 CTA 배너 | ✅ `/explore/interests/sports` 연결 | OZ 확인 필요 |
| 관심 운동 페이지 | ✅ 10개 운동 종목 정적 데이터 | OZ 확인 필요 |
| 운동 선택 → 직업 연결 | ✅ sportsInterestData.ts 기반 | OZ 확인 필요 |
| 금지 표현 (선수가 못 되면 등) | ✅ 사용자 노출 영역 0건 | 코드 기준 확인 완료 |

---

## 8. 신규 29개 로드맵 샘플 점검 결과

### 코드 기준 (전수 확인 완료)

- 29개 전부 3단계 (current/next/future) ✅
- 29개 전부 12개 미션 ✅  
- 미션 ID 중복 없음 ✅
- `getRoadmap(slug)` null 없음 → fallback 없음 ✅

### 실 브라우저 샘플 (OZ 수동 확인 필요)

| URL | 3단계 | 미션 | ProgressCircle | fallback | 코드 기준 | 실 브라우저 |
|---|---|---|---|---|---|---|
| `/roadmap/historian` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/train-driver` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/climate-data-analyst` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/disaster-safety-manager` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/aircraft-maintenance-technician` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/video-director` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/game-planner` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/financial-planner` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/mobile-app-developer` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |
| `/roadmap/water-safety-lifeguard` | ✅ | ✅ 12 | 0-safe | 전용 | PASS | OZ 확인 필요 |

---

## 9. 명따라·AI 상담 점검 결과

**확인 파일:** `src/app/myeonddara/page.tsx`, `src/app/parent/counseling/page.tsx`

| 항목 | 코드 기준 | 실 브라우저 |
|---|---|---|
| 명따라 진입 | ✅ | OZ 확인 필요 |
| 명따라 설명 | ✅ "진로를 정해주는 기능이 아니라, 대화를 시작하는 베타 기능" | OZ 확인 필요 |
| 진로 확정 표현 | ✅ 없음 | 코드 기준 확인 완료 |
| Phase 2 활성화 | ✅ 비활성 (환경 변수 미설정) | OZ 확인 필요 |
| AI 상담 진입 | ✅ `AI_CONSULT_ENABLED=true` → 상담 페이지 | OZ 확인 필요 (로그인 후) |
| AI 상담 설명 | ✅ "AI 진로 탐색 도우미", "참고 제안" | OZ 확인 필요 |
| AI 진로 확정/보장 표현 | ✅ 없음 | 코드 기준 확인 완료 |

---

## 10. 문의·정책 페이지 점검 결과

| 항목 | 기대 값 | 코드 기준 확인 | 실 브라우저 |
|---|---|---|---|
| 사용자 문의 이메일 | `kkumddara@ozklab.com` | ✅ contact, faq, guide, refund, feedback, page.tsx | OZ 확인 필요 |
| 운영사/보호책임자 이메일 | `contact@ozklab.com` | ✅ privacy, settings, youth | OZ 확인 필요 |
| 카카오채널 URL | `https://pf.kakao.com/_xfkxfjX` | ✅ contact/page.tsx | **OZ 실채널 확인 필요** |
| 운영사 표기 | OZ.K Lab / 오즈케이랩 | ✅ privacy, settings, page.tsx | OZ 확인 필요 |
| `좋소아빠` 사용자 노출 | 없어야 함 | ✅ 0건 | OZ 확인 필요 |
| `14일 무료 체험` 문구 | 없어야 함 | ✅ 0건 | OZ 확인 필요 |
| `/refund` 베타 기간 기준 | "베타 기간 운영 기준" | ✅ 제2조 교체 완료 | OZ 확인 필요 |
| 결제 미오픈 상태 | 오해 없어야 함 | ✅ 베타 배너·안내 존재 | OZ 확인 필요 |

---

## 11. 금지 문구 점검 결과

코드 기준 정적 grep 실행 결과:

| 검색어 | 결과 | 처리 |
|---|---|---|
| `14일 무료 체험` | **0건** ✅ | — |
| `좋소아빠` | **0건** ✅ | — |
| `johsoappa@gmail` | **0건** ✅ | — |
| `최적 직업` | **0건** ✅ | — |
| `정확히 예측` | **0건** ✅ | — |
| `성공 보장` | **0건** ✅ | — |
| `합격 보장` | **0건** ✅ | — |
| `선수가 못 되면` | **0건** ✅ (sportsInterestData.ts JSDoc 주석은 가이드라인 문구, 사용자 노출 아님) | — |
| `대체 직업` | **0건** ✅ | — |

---

## 12. 발견 이슈

### P0 이슈

없음 ✅

### P1 이슈 (잔여 — 코드 기준 이전 세션에서 확인된 항목)

| 등급 | 이슈 | 영향 | 후속 조치 |
|---|---|---|---|
| P1 | `/contact` 카카오채널 URL `pf.kakao.com/_xfkxfjX` 실채널 일치 여부 미확인 | 문의 링크 오작동 가능성 | **OZ 카카오채널 관리자센터 직접 확인 필요** |
| P1 | `weekly_activity_completions` DB migration 046 production 적용 여부 | 리포트 추천 활동 체크박스 저장 실패 가능 | **OZ Supabase SQL Editor SELECT 쿼리 확인 필요** |
| P1 | 신규 29개 로드맵 실 브라우저 DB 연동 확인 | DB miss 시 static fallback 사용 (기능은 동작) | OZ 5~10개 샘플 직접 접속 확인 |

### P2 이슈

| 등급 | 이슈 | 영향 |
|---|---|---|
| P2 | `roadmap/[id]` 기존 사용자 m1~m4 완료 기록 미전환 | 기존 사용자 Stage 1 완료 상태 미반영 (재체크로 복구 가능) |
| P2 | 모바일 렌더링 실 기기 확인 미완 | 레이아웃 깨짐 가능성 |

---

## 13. 베타 운영 가능 여부 판정

### 판정: **A. 베타 운영 가능**

**판단 근거:**

| 항목 | 결과 |
|---|---|
| tsc --noEmit | ✅ PASS |
| npm run build | ✅ PASS |
| P0 이슈 | ✅ 없음 |
| 핵심 컨셉 | ✅ 랜딩 h1에 정상 노출 |
| 14일 무료 체험 문구 | ✅ 0건 |
| 금지 표현 전체 | ✅ 사용자 노출 0건 |
| 로드맵 커버리지 | ✅ 100/100 |
| 학부모 체험하기 카드 | ✅ 3개 인라인 안내 전환 완료 |
| 문의 채널 | ✅ 이메일 기준 정상 (카카오채널 OZ 확인 필요) |
| Phase 2 비활성 | ✅ 유지 |

### 운영 전 OZ 직접 확인 필요 사항 (필수)

| 순서 | 항목 | 확인 방법 |
|---:|---|---|
| 1 | `https://꿈따라.kr` 브라우저 접속 확인 | 직접 접속 |
| 2 | 랜딩 핵심 컨셉 문구 표시 확인 | "아직 꿈이 없어도 괜찮아요" 노출 여부 |
| 3 | `/demo/parent` → 카드 3개 클릭 → 인라인 안내 표시 확인 | 홈으로 튕기지 않음 |
| 4 | `/roadmap/game-planner` (또는 신규 5개 이상) 접속 → 3단계 표시 확인 | 전용 로드맵 표시 여부 |
| 5 | 카카오채널 관리자센터 → 채널 URL 확인 | `pf.kakao.com/_xfkxfjX` 일치 여부 |
| 6 | Supabase SQL Editor → `weekly_activity_completions` 테이블 존재 확인 | 이전 세션에서 제공한 SELECT 쿼리 |

### 운영 후 보완 가능 항목

- P1: 카카오채널 URL 실채널 확인 후 불일치 시 contact/page.tsx 수정
- P1: weekly_activity_completions DB 미적용 시 migration 046 적용 (OZ 수행)
- P2: 실 기기 모바일 렌더링 점검 후 레이아웃 수정
- P2: 사용자 피드백 기반 미션 난이도·문구 보정

---

## 14. 후속 작업

| 우선순위 | 항목 | 형태 |
|---:|---|---|
| 1 | OZ 운영 도메인 직접 접속 확인 (§3 필수 6개 항목) | OZ 수동 확인 |
| 2 | 카카오채널 URL 실채널 일치 여부 확인 | OZ 수동 확인 |
| 3 | weekly_activity_completions DB 적용 확인 | OZ Supabase SQL |
| 4 | 신규 로드맵 5~10개 실 브라우저 확인 | OZ 수동 확인 |
| 5 | 베타 운영 가이드(`beta-operation-guide.md`) 기반 일일 체크리스트 시작 | 운영 시작 |
| 6 | P1 카카오채널 URL 불일치 발견 시 수정 작업지시서 | 후속 |

---

## 이력

| 날짜 | 작업 | 비고 |
|---|---|---|
| 2026-05-30 | 프로덕션 베타 운영 전 최종 실사용 점검 | 코드 기준 전수 확인 완료. 실 브라우저 OZ 확인 필요. 판정: A. 베타 운영 가능 |
