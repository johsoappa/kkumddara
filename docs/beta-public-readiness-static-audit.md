# 꿈따라 베타 공개 전 정적 리스크 점검 리포트

## 1. 점검 기준

- 기준 commit: `fdd9595` (작업지시서 기준점) / 점검 시 HEAD: `f659b6d`
- 점검 일시: 2026-06-01
- 점검 범위: 공개 전제 조건(P0) · 역할/세션/운영 안정성(P1) · 공개 품질(P2)
- 점검 방식: **정적 점검 전용** — 코드 검색(grep), 라우트 구조 확인, 미들웨어/가드 로직 확인, 마이그레이션 SQL 확인, 메타데이터/매니페스트 확인, 기존 문서 확인, `tsc`/`build` 실행. **소스/DB/RLS/Auth/AI/결제 로직은 일절 변경하지 않음.**
- 한계: 이 리포트는 코드/문서 기준 정적 분석이다. RLS 실제 활성 상태, 실 메일 발송, 모바일 실렌더, OG 공유 미리보기는 **OZ가 실 환경에서 직접 확인**해야 한다.

---

## 2. 최종 요약

| 구분 | 판정 | 메모 |
|---|---|---|
| P0 공개 전제 조건 | **PASS** | RLS 실 활성 상태 OZ 확인 완료(2026-06-01): public 23개 테이블 전부 `rowsecurity=true`, policy 53개. 비활성 테이블 0건 → P0 RLS 리스크 해소. (미성년자 동의 문구는 정책/법무 판단 잔여) |
| P1 역할/세션/운영 안정성 | **보완 권장** | 역할 분리·보호 라우트·체험/실로그인 우선순위는 코드상 정상. 환불 문구 충돌(1건), 다자녀 선택 UI 부재, 데모 role 로그아웃 미정리 등 보완 후보 존재 |
| P2 공개 품질 | **보완 권장** | 커스텀 404/500/loading 없음, robots/sitemap 없음, `metadataBase` 미설정(OG 공유 이미지 URL 리스크), per-page OG 없음 |

> 종합: **즉시 치명적 공개 차단(FAIL) 항목은 발견되지 않음.** 단 P0 RLS 실 활성 확인(OZ 수동)과 P1·P2 보완 후보 판정이 선행되어야 안전한 공개가 가능하다. 본 1단계는 점검 리포트이며, 수정은 2단계에서 선별 진행한다.

---

## 3. P0 점검 결과

| 항목 | 결과 | 우선순위 | 근거 파일/위치 | 후속 조치 |
|---|---|---|---|---|
| RLS 활성 (실 DB 확인 완료) | **PASS** | P0 | OZ Supabase 확인(2026-06-01): public 23개 테이블 전부 `rowsecurity=true`, 비활성 0건 | 해소 완료 |
| 사용자 데이터 테이블 policy 조건 | **PASS** | P0 | OZ 확인: pg_policies 53개. parent/student `user_id=auth.uid()`, child·roadmap_progress·weekly_*·liked_occupations는 parent/student 연결 조건, myeonddara_usage with_check 확인 | 해소 완료 |
| 공개 콘텐츠 테이블 정책 | **PASS** | P0 | `occupation_*`는 published/active/current 공개 조회 + 관리자 수정은 `is_admin()` 분리 | 의도된 공개 — 정상 |
| 회원가입/역할 결정 흐름 | PASS(코드) | P0 | `src/middleware.ts`, `src/app/onboarding/*`, `src/app/auth/callback` | OZ 실 브라우저 가입 1회 확인 |
| 미성년자 동의/약관 노출 | 확인 필요 | P0 | `src/app/onboarding/student`, `src/app/terms`, `src/app/privacy`, `src/app/youth` | 학생 단독 가입 흐름의 법정대리인 동의 문구 유무 OZ/법무 판단 (본 리포트는 법률 판단 아님) |
| "14일 무료 체험" 사용자 노출 | PASS | P0 | `src/` 전역 grep 결과 **0건** (docs·`.claude/worktrees/` 비배포 사본 제외) | 없음 |
| 결제 가능 오인 문구 | PASS | P0 | 데모/약관/가이드 모두 "베타 기간 무료 이용 · 자동결제 없음" 기조 | 없음 |

### 3-1. 마이그레이션 기준 RLS enable 테이블 (코드 근거)

`enable row level security`가 선언된 주요 테이블:
`users, families, family_members, invitations, children, roadmap_progress, liked_occupations, myeonddara_sessions, parent, child, student, subscription_plan, caregiver_invite, ai_consult_sessions, ai_consult_usage, myeonddara_usage, occupations, missions, occupation_master(+ source_meta/sync_log/summary/traits/preparations/parent_questions/student_actions/related_jobs), occupation_goyo24_profile, weekly_activity_completions, weekly_roadmap_missions`

> ⚠️ 마이그레이션에 enable 구문이 있어도 **실 DB 적용 여부는 별개**다. 반드시 §8의 SQL로 실 상태를 확인한다. 마스터/직업 데이터 테이블(`occupation_*`, `occupations`, `missions`)은 읽기 공개가 의도일 수 있으므로 정책 내용(SELECT 허용 범위)을 함께 확인한다.

---

## 4. P1 점검 결과

| 항목 | 결과 | 우선순위 | 근거 파일/위치 | 후속 조치 |
|---|---|---|---|---|
| 보호 라우트 redirect (비로그인/세션만료) | PASS(코드) | P1 | `src/middleware.ts` (`/parent/*`,`/student/*` role 가드, 미설정 시 `/`) | OZ 로그아웃 후 접근 1회 확인 |
| 역할 교차 직접 URL 접근 | PASS(코드) | P1 | 미들웨어 + `src/app/report/page.tsx` (학생→`/student/activity`) | §7 매트릭스 참조 |
| 체험 vs 실로그인 role 우선순위 | PASS(코드) | P1 | `src/components/layout/BottomNav.tsx` (`loginRole ?? roleOverride ?? demoRole ?? pathname ?? parent`, 로그인 시 demo role 제거) | 없음 (정상) |
| 데모 role 로그아웃 후 잔존 | 확인 필요 | P1 | `BottomNav.tsx` demo role은 로그인 확정 시에만 제거. 로그아웃 단독 시 sessionStorage 잔존 가능(희박) | 2단계 검토: 로그아웃 시 `kkumddara_demo_role` 정리 여부 |
| 환불 문구 충돌 | **FAIL(문구)** | P1 | `src/app/pricing/page.tsx:202` "결제 후 24시간 이내 무조건 전액 환불" ↔ `src/app/faq/page.tsx:38` "7일 이내 + 미이용 조건부 검토" | 2단계: 환불 기준 단일화 (refund 페이지 기준으로 통일 권장) |
| 다자녀 선택 UI | 보완 권장 | P1 | `report/myeonddara/counseling`은 첫 active child 자동 선택(`order created_at asc limit 1`), 전환 UI 없음. `parent/home`은 children 목록 표시 | 2단계: 리포트/명따라/상담에 현재 자녀 표시·선택 UI 검토 |
| 명따라 베타 디스클레이머 | PASS | P1 | 진입 `myeonddara/page.tsx:454,458,657` + 결과 `result/page.tsx:176,538` (참고용·베타·절기 ±1일 오차 안내) | 없음 |
| AI 한도/모델명 노출 | PASS | P1 | `parent/counseling`("무료 N회 남음/이번 달 종료"), `myeonddara`(Phase2 비활성 시 "베타 운영 중"). 모델명 `gpt-4o-mini`는 API/DB 내부만, UI 미노출 | 없음 (모델명 비노출 확인) |
| 이메일/사업자명/카카오 일관성 | PASS | P1 | `kkumddara@ozklab.com`·`contact@ozklab.com`·`pf.kakao.com/_xfkxfjX`·`OZ.K Lab`·`꿈따라_자녀 진로 탐색` 일관. `src/`에 `좋소아빠/johsoappa/gmail` **0건** | 경미: `settings.tsx:122` "대표 OZ.Kim" 표기 일관성만 검토 |
| 이메일 발송 흐름 | 확인 필요 | P1 | Supabase Auth 사용. 가입/비번재설정 메일 안내 UI 문구는 제한적 | OZ 실 메일 발송 테스트(가입 인증/비번 재설정) 필요 |

---

## 5. P2 점검 결과

| 항목 | 결과 | 우선순위 | 근거 파일/위치 | 후속 조치 |
|---|---|---|---|---|
| 커스텀 404(not-found) | 없음 | P2 | `src/app/`에 `not-found.tsx` 부재 → Next 기본(영문) 404 | 2단계: 브랜드 톤 한국어 not-found 추가 검토 |
| 커스텀 500(error)/loading | 없음 | P2 | `error.tsx`/`global-error.tsx`/`loading.tsx` 부재 | 2단계: 최소 error 경계 검토 |
| robots | 없음 | P2 | `src/app/robots.ts` 부재 | OZ: 베타 검색 노출(noindex) 정책 결정 후 추가 |
| sitemap | 없음 | P2 | `src/app/sitemap.ts` 부재 | OZ 정책 결정 후 추가 |
| `metadataBase` | 미설정 | P2 | `src/app/layout.tsx` (build 경고 `metadataBase ... using localhost`) | OG 이미지 절대 URL 깨짐 가능 → 도메인 확정 후 설정 |
| OG/공유 메타데이터 | 부분 | P2 | `layout.tsx` 전역 OG(title/desc/`/og-image.png`/locale) 존재, twitter card·per-page OG 없음 | 카카오 공유 미리보기 OZ 확인, 필요 시 per-page 보강 |
| 빈 상태 CTA | PASS | P2 | report/student-activity/demo-activity 등 빈 상태에 탐색/로그인 CTA 존재 | 없음 |
| 분석 도구(GA 등) | 없음(추정) | P2 | `src/`에 GA/gtag 코드 미발견 | 현재 분석 미설치 — 신규 추가는 별도 결정 |
| robots 비노출 위험 | 확인 필요 | P2 | robots 부재 시 전 페이지 색인 허용 → `/demo/*`, `/report` 등 색인 가능성 | OZ 정책 결정 |

---

## 6. grep 점검 결과

| 검색어 | 결과 | 메모 |
|---|---|---|
| `14일` | src 0건 | docs·`.claude/worktrees/`(비배포)만 → 사용자 노출 없음 PASS |
| `무료 체험` | 다수 | 대부분 직업 미션 텍스트(앱 "무료 체험하기") 또는 "베타 기간 무료 체험" 기조. "14일/7일 무료 체험" 사용자 노출 없음 |
| `자동결제` | 3건 | 데모/가이드 "자동결제 없음" + terms 정식 약관 조항 — 충돌 없음 |
| `환불` | 다수 | **pricing FAQ(24시간 무조건 전액) ↔ faq(7일 조건부) 충돌** — P1 |
| `구독` | 다수 | terms/faq/guide 정식 약관·정책 문맥. 베타 충돌 없음 |
| `좋소아빠`/`johsoappa`/`gmail` | src 0건 | `backup/dump_test_log.txt`(비배포 백업), docs(점검 문서)만 — 배포 코드 clean |
| `GPT`/`OpenAI`/`gpt-4o` | API/데이터만 | `api/myeonddara`,`api/roadmap/weekly-missions`에 `gpt-4o-mini`. 미션 텍스트의 "ChatGPT" 언급은 활동 제안. UI 모델명 노출 없음 |
| `참고용`/`절기`/`음력`/`베타` | 존재 | 명따라 진입+결과 디스클레이머 정상 |
| `kkumddara@ozklab.com`/`contact@ozklab.com`/`pf.kakao.com`/`오즈케이랩`/`OZ.K Lab` | 일관 | 표기 일관성 PASS |
| `robots`/`sitemap`/`metadataBase`/`noindex` | src 0건 | 미설정 — P2 |

---

## 7. 라우트/역할 분리 점검 결과

| 상태 | 접근 경로 | 기대 동작 | 코드상 확인 결과 | 리스크 |
|---|---|---|---|---|
| 학생 로그인 | `/parent/home` | 차단/redirect | `middleware.ts` `/parent` role≠parent → `/` | 없음 |
| 학생 로그인 | `/report` | 부모 리포트 미노출 | `report/page.tsx` !parent → `/student/activity` | 없음 |
| 학생 로그인 | `/parent/counseling` | 차단/redirect | `/parent` → `/` | 없음 |
| 학부모 로그인 | `/student/home` | 차단/redirect | `/student` role≠student → `/` | 없음 |
| 학부모 로그인 | `/student/activity` | 차단/redirect | `/student` → `/` | 없음 |
| 비로그인 | `/student/activity` | 로그인/홈 redirect | `/student` !user → `/` | 없음 |
| 비로그인 | `/report` | 로그인/홈 redirect | `report/page.tsx` !user → `/` | 없음 |
| 비로그인(데모) | `/demo/student/activity` | 정상 노출(비보호) | 미들웨어 matcher에 `/demo/*` 미포함 | 의도된 동작 |

> 미들웨어 matcher: `/`, `/home`, `/onboarding`, `/onboarding/:path*`, `/parent/:path*`, `/student/:path*`. `/report`,`/myeonddara`,`/settings`,`/parent/counseling`는 페이지 레벨에서 인증 처리(서버/클라이언트 `getUser`). `/parent/counseling`은 `/parent/*` 매칭으로 미들웨어 보호됨.

---

## 8. OZ 수동 확인 필요 항목

| 항목 | 이유 | 확인 방법 |
|---|---|---|
| ~~RLS 실 활성 상태~~ | ✅ **확인 완료(2026-06-01)** — 23개 테이블 전부 `rowsecurity=true` | (해소) 참고용 SQL은 아래 보존 |
| ~~RLS 정책 내용~~ | ✅ **확인 완료** — policy 53개, 사용자 데이터 연결 조건/with_check 확인 | (해소) |
| 실 메일 발송 | 가입 인증·비번 재설정 메일 수신/한글 깨짐 | 실 계정으로 가입·재설정 1회 |
| 모바일 실렌더 | BottomNav 고정/CTA 가림/가로 스크롤 | 실기기(iOS/Android) `/`,`/demo/student/activity`,`/student/activity`,`/report`,`/myeonddara` |
| OG 공유 미리보기 | `metadataBase` 미설정으로 이미지 URL 리스크 | 카카오톡/슬랙에 URL 공유 |
| 미성년자 동의 문구 | 법률 판단 영역 | 법무/정책 검토 |

```sql
-- (1) public 테이블 RLS 활성 여부
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
-- (2) public 테이블 정책 목록
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

판정 가이드: 사용자 데이터 테이블의 `rowsecurity = false` → **P0**. 정책이 필요한데 policy 0건 → **P0/P1**. 직업/마스터 데이터는 읽기 공개 여부를 의도와 대조.

---

## 9. 수정 필요 후보

| 우선순위 | 수정 후보 | 이유 | 권장 처리 |
|---|---|---|---|
| ✅ 완료(2026-06-01) | 환불 문구 단일화 (`pricing.tsx` vs `faq.tsx`) | "24시간 무조건 전액" vs "7일 조건부" 충돌 | pricing·faq present-tense 문구를 베타 기준으로 보정, refund 정식 정책(베타 배너) 유지 — 해소 |
| ✅ 완료(2026-06-02) | 환불 기준 체리피킹 리스크 (`refund.tsx` 제3조) | "24시간 이용 이력 무관 전액 환불"이 콘텐츠 캡처 후 환불 악용 소지 | 해당 기준 삭제, 7일 미이용/이용내역/7일 초과·지속형/오류·중복 기준으로 재구성 + 완화 표현 — 해소 |
| P1 | 다자녀 현재 자녀 표시/선택 | report/명따라/상담이 첫 자녀 자동 선택, 전환 불가 | 자녀 표시 라벨 + (가능 시) 선택 UI |
| P1 | 데모 role 로그아웃 정리 | 로그아웃 단독 시 sessionStorage 잔존 가능(희박) | 로그아웃 시 `kkumddara_demo_role` 제거 |
| P2 | 커스텀 not-found/error | 기본 영문 404/500 노출 | 브랜드 톤 한국어 페이지 |
| P2 | `metadataBase` 설정 | OG 이미지 절대 URL | 운영 도메인 확정 후 설정 |
| P2 | robots/sitemap | 베타 색인 정책 부재 | OZ 정책 결정 후 추가 |
| P3(경미) | `settings.tsx:122` "대표 OZ.Kim" / `api/myeonddara` "Claude API" 주석 | 표기/주석 정합성 | 정리 시 일괄 |

> ⚠️ 본 1단계에서는 위 항목을 **수정하지 않는다.** 우선순위 판정은 OZ/메이/크라가 결정한다.

---

## 10. 이번 작업에서 변경하지 않은 항목

- DB / migration / Supabase SQL / RLS / Auth 구조 / AI 호출 로직 / 명따라 Phase 2 / 결제·요금제 로직 / `occupation_master` / `roadmaps.ts` / `weekly_activity_completions` / 부모 리포트 계산 로직 / 실제 사용자 데이터 — **일절 변경 없음** (점검 리포트 문서만 생성)

---

## 11. 검증 결과

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0, 출력 없음) |
| `npm run build` | **PASS** (46 페이지 정상, `metadataBase` 경고 ×7 — §5 P2 항목으로 기록됨) |

> 정적 점검이므로 build PASS가 실 브라우저 동작 PASS를 의미하지 않는다. 실 브라우저 QA는 OZ가 별도 수행한다.

---

## 12. 최종 판정

- **보완 필요 (조건부 공개 가능)** — *P0 RLS 선행 확인 완료(2026-06-01, PASS)로 공개 전제 조건 충족.*
  - P0: RLS 실 활성/정책 OZ 확인 **PASS**(23개 테이블 전부 활성, policy 53개). 미성년자 동의 문구만 정책/법무 잔여.
  - P1: 환불 문구 충돌 1건은 공개 전 정리 권장. 다자녀/데모 role 잔존은 보완 후보.
  - P2: 404/robots/OG 보완은 품질 향상 항목(공개 차단 아님).

---

## 13. 다음 권장 작업

1. ✅ **(P0 — 완료)** RLS 실 활성·정책 OZ 확인 완료(2026-06-01): 23개 테이블 전부 `rowsecurity=true`, policy 53개 → **P0 RLS 리스크 해소**
2. **(P1)** ✅ 환불 문구 단일화 완료(2026-06-01) + 구독/결제 관리 UI(`/settings/billing`) 추가 완료 / 다자녀 자녀 표시·선택 UI는 후속 검토
3. **(P2)** `metadataBase`/robots/sitemap/커스텀 404 — 운영 도메인·색인 정책 확정 후 일괄 보강
4. **(잔여 확인)** ✅ 실 메일 발송 — 비밀번호 재설정 메일 발송·수신·링크·변경·로그인 OZ 검증 PASS(2026-06-02, 계정 복구 P1 종료). 가입 인증 메일·미성년자 동의 문구(정책/법무)는 잔여 확인
