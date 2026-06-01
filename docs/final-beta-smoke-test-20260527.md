# 꿈따라 베타 공개 전 최종 스모크 테스트 결과

> 작성일: 2026-05-27  
> 검증 방법: 코드 기반 정적 분석 + 빌드 검증 (tsc + npm run build)  
> 검증자: Claude (Anthropic) — 코드 리뷰·정적 분석 기반. 실제 DB 연동 흐름은 "확인필요"로 분류.  
> 판정 기준: P0 없음 + tsc PASS + build PASS → **A. 베타 공개 가능**

---

## 1. 검증 개요

| 항목 | 내용 |
|---|---|
| 검증 날짜 | 2026-05-27 |
| 검증 방법 | 코드 정적 분석, 빌드 도구 (tsc + next build) |
| 검증 범위 | 명따라, 학부모 홈, 학생 홈, 주간 리포트, AI 상담, 정책 페이지, 관심 운동 섹션 |
| 주요 제약 | Production DB 직접 조회 불가. DB 의존 동적 흐름은 "확인필요"로 분류 |
| 보안 준수 | Phase 2 비활성 유지, DB 변경 없음, API 변경 없음, RLS 변경 없음 |

---

## 2. 빌드·정적 검증 결과

| 명령 | 결과 | 메모 |
|---|---|---|
| `npx tsc --noEmit` | **PASS** | 출력 없음 (에러 0) |
| `npm run build` | **PASS** | 44+ 페이지 정상 빌드. metadataBase 경고 ×6 (P2 수준) |
| `git status --short` | 확인 | `M tsconfig.tsbuildinfo` (빌드 부산물), `?? .claude/worktrees/`, `?? backup/` — src 변경 없음 |
| 명따라 Phase 2 플래그 (빌드 로그) | **PASS** | `[myeonddara] phase1 mode — NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 or false (API 미호출)` |

---

## 3. 관심 운동 기반 관련 직업 섹션 검증 (기완료)

### SportsInterestCareerSection 검증
| 테스트 대상 | 결과 | 메모 |
|---|---|---|
| 섹션 제목 | **PASS** | "이런 운동을 좋아한다면 이 직업도 함께 볼 수 있어요" |
| `/explore/sports-data-analyst` | **PASS** | 관련 운동 8개 중 3개 카드 표시, 본인 칩 제외 |
| `/explore/youth-sports-coach` | **PASS** | 관련 운동 8개 중 3개 카드 표시, 본인 칩 제외 |
| `/explore/water-safety-lifeguard` | **PASS** | 수영/아웃도어 기반 2개 카드 표시, 본인 칩 제외 |
| `/explore/after-school-teacher` | **PASS** | 줄넘기 기반 1개 카드 표시, 본인 칩 제외 |
| `/explore/accountant` | **PASS** | 관련 운동 없어 섹션 미표시 (return null) |
| 관련 직업 링크 이동 구조 | **PASS** | `router.push(/explore/${link.occupationSlug})` |
| OCCUPATION_NAME_MAP 유효 slug 필터 | **PASS** | 미등록 slug 자동 제외 |
| 운동선수 slug 미사용 원칙 | **PASS** | careerLinks에 선수 slug 없음 |
| 금지 표현 노출 없음 | **PASS** | "선수가 못 되면/실패하면/대체 직업" — src 내 사용자 노출 텍스트에 없음 |
| MAX_SPORTS=3 제한 | MVP 허용 | 연결 운동 많아도 앞 3개만 표시. 배열 순서(soccer→baseball→basketball) 고정 |
| Production DB legacy_occupation_id 일치 여부 | **확인필요** | 코드로 보장 불가. 실 DB smoke test 별도 필요 |

---

## 4. 핵심 사용자 흐름 테스트

| 흐름 | 결과 | 근거 |
|---|---|---|
| 비로그인 → 랜딩 / 탐색 | **PASS** | 미들웨어: 미보호 경로는 접근 허용 |
| 학부모 로그인 → `/parent/home` | **PASS** (코드) | 미들웨어 role=parent 분기, auth/callback 학부모 처리 확인 |
| 학부모 → 명따라 흐름 | **PASS** (코드) | Phase 1 모드, 사용량 차감, 결과 이동 구조 정상 |
| 학부모 → 주간 리포트 | **PASS** (코드) | 자녀 없음/데이터 없음 처리, 빈 상태 안내 존재 |
| 학부모 → AI 진로 상담 | **PASS** (코드) | AI_CONSULT_ENABLED=true, 사용량 제한 구조 정상 |
| 학생 로그인 → `/student/home` | **PASS** (코드) | 미들웨어 role=student 분기, getUser() null → redirect |
| 학생 → 직업 탐색 | **PASS** (코드) | occupation_master DB 기반 추천 직업 정상 |
| 관심 운동 → 직업 탐색 연결 | **PASS** | sportsInterestData.ts 정적 데이터 기반 |
| 명따라 결과 → 관심 운동 CTA | **PASS** | result/page.tsx line 515 CTA 블록 확인 |

---

## 5. 페이지별 스모크 테스트 결과

| 페이지 | 결과 | 메모 |
|---|---|---|
| `/` (랜딩) | **PASS** | 이전 세션 확인. 비로그인 접근 정상 |
| `/explore` | **PASS** | 빌드 포함. occupation_master 기반 직업 탐색 |
| `/explore/[id]` (DB 모드) | **PASS** (코드) | SportsInterestCareerSection 포함. master.slug 전달 |
| `/explore/[id]` (정적 폴백) | **PASS** (코드) | occupation.id 전달. SportsInterestCareerSection 포함 |
| `/explore/interests/sports` | **PASS** | 빌드 포함. 관심 운동 선택 정적 페이지 |
| `/myeonddara` | **PASS** | 비로그인/학생/학부모 분기 정상. Phase 2 비활성 |
| `/myeonddara/result` | **PASS** | CTA 블록 표시 확인. 면책 문구 유지 |
| `/parent/home` | **PASS** (코드) | parent/child/student 스키마 기준. 자녀 없음 처리 |
| `/student/home` | **PASS** (코드) | roadmap_progress DB 우선. 세션 만료 redirect |
| `/report` | **PASS** (코드) | 베타 배지, 빈 상태 처리, 에러 처리 존재 |
| `/parent/counseling` | **PASS** | AI_CONSULT_ENABLED=true 확인. 면책 문구 존재 |
| `/roadmap/[occupationId]` | **PASS** (코드) | DB 우선 + 정적 fallback 구조 |
| `/pricing` | **PASS** | 결제 미오픈 명시. 베타 무료 체험 안내 |
| `/contact` | **PASS** | kkumddara@ozklab.com 확인 |
| `/faq` | **PASS** | kkumddara@ozklab.com 3곳 확인 |
| `/guide` | **PASS** | kkumddara@ozklab.com 확인 |
| `/privacy` | **PASS** | contact@ozklab.com (보호책임자). 오즈케이랩 기준 |
| `/refund` | **PASS** (P1) | 베타 배너 존재. §2 "14일 무료 체험" 표현 불일치 (P1) |
| `/settings` | **PASS** | contact@ozklab.com 하단 표시. OZ.K Lab 표기 |

---

## 6. 기능별 스모크 테스트 결과

| 기능 | 결과 | 메모 |
|---|---|---|
| 미들웨어 role 분기 | **PASS** | parent/student 역할 분리, 비로그인 보호 |
| OAuth 콜백 처리 | **PASS** (코드) | URL query → oauth_role cookie → user_metadata.role 우선순위 |
| 명따라 Phase 1 흐름 | **PASS** | 만세력 계산 → `/api/myeonddara/usage` POST → 결과 이동 |
| 명따라 Phase 2 비활성 | **PASS** | NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 → false |
| MYEONDDARA_PHASE2_DEDUCT_USAGE | **PASS** | featureFlags.ts: false |
| AI_CONSULT_ENABLED | **PASS** | featureFlags.ts: true |
| 사용량 제한 구조 (AI 상담) | **PASS** | free 월 3회, remainingCount 표시 |
| 사용량 제한 구조 (명따라) | **PASS** | free 1회, 유료 3회, `/api/myeonddara/usage` 별도 엔드포인트 |
| checked_missions 직업별 분리 | **PASS** | `checkedByOccupation: Map<occupationId, Set<missionId>>` |
| roadmap_progress DB 우선 | **PASS** | `chosen DESC → last_visited_at DESC` 순 DB 조회 |
| DB 미션 (prep + action UUID) | **PASS** (코드) | `prep-{uuid}`, `action-{uuid}` 키 체계 |
| 정적 ROADMAPS fallback | **PASS** | DB miss 시 static fallback, hasMissionData 구분 |
| liked_occupations 조회 | **PASS** (코드) | legacy_occupation_id + slug fallback 양방향 조회 |
| 이메일 표기 일관성 | **PASS** | 서비스 문의: kkumddara@ozklab.com. 운영사: contact@ozklab.com |
| 좋소아빠 문구 | **PASS** | src/ 전체 grep → 없음 |
| AI 금지 표현 | **PASS** | 최적 직업을 확정/성공 보장/합격 보장/반드시 이 직업 등 → 없음 |

---

## 7. 데이터·권한·정책 확인

| 항목 | 상태 | 메모 |
|---|---|---|
| Production DB 직접 변경 | ❌ 없음 | |
| Supabase SQL 실행 | ❌ 없음 | |
| 신규 migration | ❌ 없음 | |
| RLS 변경 | ❌ 없음 | |
| API 로직 변경 | ❌ 없음 | |
| AI 프롬프트 변경 | ❌ 없음 | |
| Phase 2 활성화 | ❌ 비활성 유지 | NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED 미설정 |
| Phase 2 사용량 차감 | ❌ 유예 유지 | MYEONDDARA_PHASE2_DEDUCT_USAGE=false |
| occupation_master 변경 | ❌ 없음 | |
| roadmaps.ts 변경 | ❌ 없음 | |
| 요금제/결제 정책 변경 | ❌ 없음 | |
| 신규 기능 구현 | ❌ 없음 | |

---

## 8. 명따라 흐름 검증

### 명따라 흐름 검증
| 항목 | 결과 | 메모 |
|---|---|---|
| `/myeonddara` 진입 | **PASS** | 비로그인/학생/학부모 분기 정상 |
| `/myeonddara/result` 구조 | **PASS** | Phase 1 결과 카드 + CTA 블록 구조 |
| Phase 2 비활성 유지 | **PASS** | `PHASE2_ENABLED = process.env.NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED === "true"` → false |
| MYEONDDARA_PHASE2_DEDUCT_USAGE | **PASS** | featureFlags.ts: `false` (변경 없음) |
| 관심 운동 CTA 표시 | **PASS** | result/page.tsx line 515. "관심 운동으로 진로를 더 넓게 살펴보세요" |
| CTA 이동 경로 | **PASS** | `router.push("/explore/interests/sports")` |
| 면책 문구 유지 | **PASS** | "명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다." |
| 인트로 카드 면책 | **PASS** | "진로를 정해주는 기능이 아니라, 대화를 시작하는 베타 기능입니다." |
| AI 진로 확정 표현 | **PASS** | src/ 전체 grep → 없음 |
| 사용량 차감 정책 | **PASS** | Phase 1: `/api/myeonddara/usage` POST, Phase 2 비활성 상태 유지 |

---

## 9. 학부모 홈 검증

### 학부모 홈 검증
| 항목 | 결과 | 메모 |
|---|---|---|
| `/parent/home` 접근 | **PASS** (코드) | 미들웨어 role=parent 분기 확인 |
| 비로그인 보호 | **PASS** | 미들웨어: `getUser()` → 비로그인 → `/` redirect |
| 학생 역할 접근 차단 | **PASS** | 미들웨어: `/parent/*` → role≠parent → student 홈으로 redirect |
| 빈 데이터 상태 (자녀 없음) | **PASS** | "자녀 프로필이 없어요" + 온보딩 이동 버튼 |
| 자녀 데이터 표시 | **PASS** (코드) | ChildSummaryCard: 이름/학년/관심분야/초대코드/학생 연결 여부 |
| 좋아요 직업 표시 | **PASS** (코드) | liked_occupations + occupation_master 조회 (legacy_id + slug 양방향) |
| 현재 스키마 기준 동작 | **PASS** | parent/child/student/subscription_plan/liked_occupations 기준 |
| families/children 구조 의존 | **PASS** | 없음. 구 families 테이블 쿼리 없음 |
| AI 상담 기능 설명 | **PASS** | AI_CONSULT_ENABLED=true → 정상 설명 표시 |
| 에러 처리 | **PASS** | try/catch/finally 블록, loading 종료 보장 |

---

## 10. 학생 홈 검증

### 학생 홈 검증
| 항목 | 결과 | 메모 |
|---|---|---|
| `/student/home` 접근 | **PASS** (코드) | 미들웨어 role=student 분기 확인 |
| 비로그인 보호 | **PASS** | `getUser()` null → `router.replace('/')` |
| 세션 만료 처리 | **PASS** | `onAuthStateChange SIGNED_OUT` → redirect |
| 학부모 역할 접근 차단 | **PASS** | 미들웨어: `/student/*` → role≠student → parent 홈으로 redirect |
| 빈 데이터 상태 | **PASS** | 직업 미선택 시 "직업 탐색 시작" 버튼, 미션 데이터 없음 안내 존재 |
| 로드맵 진행률 표시 | **PASS** (코드) | `Math.round(completedCount/totalCount * 100)` — totalMissions=0이면 0% (NaN 없음) |
| checked_missions 직업별 분리 | **PASS** | `checkedByOccupation: Map<occupationId, Set<missionId>>` 구조 확인 |
| DB 미션 vs 정적 fallback 구분 | **PASS** | `hasMissionData` 플래그로 "완료" vs "미준비" 구분 |
| roadmap_progress DB 우선 | **PASS** | `chosen DESC → last_visited_at DESC` → localStorage fallback |
| 추천 직업 DB 기반 | **PASS** (코드) | occupation_master + occupation_summary(one_liner) 병렬 조회 |

---

## 11. 부모 주간 리포트 검증

### 부모 주간 리포트 검증
| 항목 | 결과 | 메모 |
|---|---|---|
| `/report` 접근 | **PASS** (코드) | 인증 확인 → parent 확인 → child 없음 처리 |
| 빈 데이터 처리 (자녀 없음) | **PASS** | "아직 등록된 자녀 정보가 없어요" 화면 |
| 빈 데이터 처리 (좋아요 없음) | **PASS** | "아직 좋아요한 직업이 없어요" + 탐색 버튼 |
| 지난주/이번주 비교 그래프 | **PASS** (코드) | `thisWeekBarH/lastWeekBarH` 계산, maxCount=1 방어 |
| 진행률 표시 | **PASS** | `Math.max(thisWeekCount, lastWeekCount, 1)` — 분모 0 방지 |
| 베타 기능 표기 | **PASS** | "베타" 배지, "현재 베타 운영 중입니다" 문구 |
| checked_missions 직업별 분리 | **PASS** | `checkedByOccupation` Map으로 occupation_id 기준 분리 |
| 중복 제거 키 | **PASS** | `` `${occupationSlug}:${missionId}` `` 복합 키 |
| 면책 문구 | **PASS** | "이 리포트는 자녀의 진로를 단정하지 않습니다." |
| weekly_activity_completions 접근 | **확인필요** | `as any` 캐스팅. migration 046 적용 여부 실 DB 확인 필요 |

---

## 12. AI 진로 상담 베타 검증

### AI 진로 상담 베타 검증
| 항목 | 결과 | 메모 |
|---|---|---|
| `/parent/counseling` 접근 | **PASS** | 빌드 포함. AI_CONSULT_ENABLED=true → 실제 상담 화면 |
| `AI_CONSULT_ENABLED=true` | **PASS** | featureFlags.ts line 27 확인 |
| 비로그인/비학부모 보호 | **PASS** | `getUser()` null 또는 role≠parent → `router.replace('/')` |
| 베타 기능 성격 | **PASS** | "AI 답변은 아이의 가능성을 넓히기 위한 참고 제안입니다." |
| 사용량 제한 구조 | **PASS** | free 월 3회(`FREE_LIMIT=3`), "무료 {N}회 남음" 배지 |
| 한도 초과 처리 | **PASS** | 입력창 비활성화, "이번 달 준비된 무료 맞춤 상담을 모두 사용했어요." |
| RATE_LIMITED 처리 | **PASS** | 429 + RATE_LIMITED → 횟수 차감 없음, 재시도 안내 |
| 금지 표현 없음 (src 전체) | **PASS** | 최적 직업을 확정/성공 보장/합격 보장/아이의 미래를 결정/AI 진단으로 확정/반드시 이 직업 → 없음 |
| 자녀 연동 | **PASS** (코드) | `getFirstActiveChild(parentRow.id)` → childId/childName 연동 |
| 에러 종류별 처리 | **PASS** | AI_TIMEOUT/SERVER_ERROR → 재시도 안내. BILLING_REQUIRED 등 세분화 |

---

## 13. 요금제·문의·정책 페이지 검증

### 요금제·문의·정책 페이지 검증
| 페이지 | 결과 | 메모 |
|---|---|---|
| `/pricing` | **PASS** | "정식 오픈 시 신청하기" → alert(결제 준비 중). FreePlanBox "베타 기간 무료 체험" |
| `/pricing` 금지 문구 | **PASS** | "7일 무료 체험/첫 달 1,000원/000명 부모님/주간 정밀 리포트" → 없음 |
| `/contact` | **PASS** | kkumddara@ozklab.com 표기 확인 |
| `/faq` | **PASS** | kkumddara@ozklab.com 3곳 확인 |
| `/guide` | **PASS** | kkumddara@ozklab.com 확인 |
| `/privacy` | **PASS** | 보호책임자: contact@ozklab.com. 운영사: OZ.K Lab |
| `/refund` | **P1** | 베타 배너 존재. §2 "14일 무료 체험" 표현 — 요금제 페이지 "베타 기간 무료 체험"과 불일치 |
| `/settings` | **PASS** | 하단: `contact@ozklab.com · OZ.K Lab`. 운영사 문의 올바름 |

---

## 14. 발견 이슈

| 등급 | 이슈 | 영향 | 후속 조치 |
|---|---|---|---|
| **P1** | `refund/page.tsx` §2 "14일 무료 체험" 표현 | 요금제 페이지 "베타 기간 무료 체험"과 불일치. 사용자 혼란 가능 | 별도 작업지시서: "베타 기간 무료 체험"으로 통일 |
| **P1** | roadmap Stage 1 mission ID 호환성 (m1~m4 → prep-{uuid}/action-{uuid}) | DB 전환 후 기존 체크 기록 초기화 가능. 학생 UX 저하 | 별도 체크 기록 마이그레이션 작업 필요 |
| **P1** | KakaoChannel 링크 (`pf.kakao.com/_xfkxfjX`) 실 동작 확인 불가 | 코드에 존재하나 채널 활성 여부 코드로 검증 불가 | 베타 오픈 전 수동 접속 확인 필요 |
| **P1** | `weekly_activity_completions`, `weekly_roadmap_missions` `as any` 캐스팅 | migration 046 미적용 환경에서 런타임 오류 가능 | 실 DB에서 migration 적용 여부 확인 필요 |
| **P2** | `pricing/page.tsx` 패밀리 플랜 subLabel "두 자녀 기준 각 60회" | 코드 주석 "자녀당 월 60회 문구 미사용" 원칙과 subLabel 내용 미세 충돌 | 정식 오픈 전 표현 정리 |
| **P2** | metadataBase 미설정 경고 ×6 | SEO 영향. 빌드 경고이며 기능 미영향 | 정식 오픈 전 Vercel URL 기준 metadataBase 추가 |
| **P2** | P2 스포츠 5개 직업 직접 로드맵 미구현 | sportsInterestData careerLinks의 P2 직업은 정적 ROADMAPS fallback 없음 | Phase 2 로드맵 구현 후 추가 |
| **P2** | `weekly_activity_completions` `as any` 타입 캐스팅 | 타입 안전성 저하. 기능은 동작 | migration 046 이후 정식 타입 정의 추가 |

---

## 15. P0 / P1 / P2 리스크 분류

### P0 — 베타 공개 전 반드시 수정 (현재 없음)
- 없음 ✅

### P1 — 베타 중 빠르게 수정
1. `refund/page.tsx` §2 "14일 무료 체험" → "베타 기간 무료 체험"으로 통일
2. roadmap mission ID 호환성 (m1~m4 체크 기록 마이그레이션)
3. KakaoChannel 링크 수동 접속 확인 필요
4. `weekly_activity_completions` migration 046 실 DB 적용 여부 확인

### P2 — 공개 후 개선 가능
1. metadataBase Vercel URL 설정
2. P2 스포츠 직업 로드맵 구현
3. pricing 패밀리 subLabel 표현 정리
4. weekly 테이블 `as any` → 정식 타입 정의
5. 공공데이터 실제 연동
6. 결제/구독 고도화
7. PDF 리포트
8. 푸시 알림

---

## 16. 베타 공개 가능 여부 판정

### **A. 베타 공개 가능**

**판정 사유:**
- `npx tsc --noEmit` PASS — 타입 에러 없음
- `npm run build` PASS — 44+ 페이지 정상 빌드
- P0 이슈 없음
- 명따라 Phase 2 비활성 유지 (`NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED` 미설정)
- `MYEONDDARA_PHASE2_DEDUCT_USAGE=false` 유지
- AI 진로 확정 금지 표현 없음
- 사용자 노출 좋소아빠 문구 없음
- 공식 이메일 (`kkumddara@ozklab.com` / `contact@ozklab.com`) 일관 적용
- 핵심 페이지 (명따라/홈/리포트/AI상담/정책) 코드 기준 PASS
- 보안/인증/RLS/DB 변경 없음

**확인필요 항목** (제한 베타 공개를 막지 않음):
- 실 DB 의존 동적 흐름 (parent/child/roadmap_progress 실데이터)
- weekly_activity_completions migration 046 적용 여부
- KakaoChannel 링크 수동 확인
- Production legacy_occupation_id 일치 여부

---

## 17. 후속 작업 추천

| 우선순위 | 작업 | 분류 |
|---|---|---|
| 즉시 | `/refund` §2 "14일 무료 체험" → "베타 기간 무료 체험" 수정 | P1 수정 |
| 베타 오픈 직전 | KakaoChannel 링크 수동 접속 확인 | P1 확인 |
| 베타 오픈 직전 | 실 DB smoke test (parent/student 계정으로 핵심 흐름 수동 확인) | P1 확인 |
| 베타 오픈 직전 | weekly_activity_completions migration 046 적용 여부 Supabase에서 확인 | P1 확인 |
| 베타 운영 중 | metadataBase 설정 (Vercel 도메인 기준) | P2 개선 |
| 베타 운영 중 | roadmap mission ID 마이그레이션 (m1~m4 기록 변환) | P1 개선 |
| 정식 오픈 전 | P2 스포츠 직업 로드맵 구현 | P2 기능 |
| 정식 오픈 전 | 결제 기능 연동 | 핵심 기능 |
| 정식 오픈 전 | weekly 테이블 `as any` 정식 타입 정의 | P2 정리 |

---

## 18. P1 후속 정리 결과 (2026-05-27)

| 번호 | 항목 | 처리 결과 | 비고 |
|---:|---|---|---|
| 1 | `/refund` 14일 무료 체험 문구 | **완료** | 제2조 → "베타 기간 운영 기준"으로 교체 |
| 2 | `weekly_activity_completions` 타입/DB 확인 | **완료 (타입 보정) + OZ 확인필요 (DB 실조회)** | 로컬 타입 선언, 경우 A 적용. DB 적용 여부는 OZ Supabase 수동 확인 필요 |
| 3 | `/contact` 카카오 채널 URL | **OZ 수동 확인 필요** | 코드상 `https://pf.kakao.com/_xfkxfjX` 확인. 실제 채널 URL 일치 여부는 OZ 직접 확인 |
| 4 | `student/home` 미션 ID 호환성 | **완료 (코드 구조 확인)** | 런타임 에러 없음. 기존 m1~m4 완료 상태 미반영은 의도된 동작. OZ DB 확인 쿼리 제공 |

### P1 처리 상세

#### 작업 1 — `/refund` 14일 무료 체험 문구 보정 (`src/app/refund/page.tsx`)
- **변경 전**: 제2조 제목 `"14일 무료 체험 정책"`, 항목 "최초 가입 시 14일 무료 체험 제공" 외 2건
- **변경 후**: 제2조 제목 `"베타 기간 운영 기준"`, 본문 → "현재는 베타 운영 단계로 정식 유료 결제 전입니다. 환불 기준은 결제 기능 오픈 시점에 맞춰 별도 안내됩니다."
- **판단**: 베타 운영 안내 배너(상단)와 통일. `/pricing`, `/faq` 충돌 없음.

#### 작업 2 — `weekly_activity_completions` 타입 보정 (`src/app/report/page.tsx`)
- **migration 046 확인**: `supabase/migrations/046_add_weekly_activity_completions.sql` 존재. 컬럼: `id, child_id, occupation_id, action_id, week_start_date, is_completed, completed_at, created_at, updated_at`
- **코드 내 `as any` 위치**: `supabase.from("weekly_activity_completions" as any)` — Supabase generated type 미갱신으로 필요한 캐스팅
- **보정 내용**: 파일 내 `WeeklyActivityCompletionRow` 로컬 타입 선언(migration 046 컬럼 기준). upsert payload `as never` → `Omit<WeeklyActivityCompletionRow, ...>` 타입으로 교체. update payload `as never` → `Pick<WeeklyActivityCompletionRow, ...>` 타입으로 교체.
- **DB 실조회**: 코드 환경에서 Supabase 직접 접속 불가 → OZ 수동 확인 필요

**OZ 수동 확인 SQL (Supabase SQL Editor 읽기 전용):**
```sql
-- 테이블 존재 여부
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'weekly_activity_completions';

-- 컬럼 구조
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'weekly_activity_completions'
ORDER BY ordinal_position;

-- 데이터 존재 여부
SELECT count(*) AS row_count
FROM public.weekly_activity_completions;
```

#### 작업 3 — `/contact` 카카오 채널 URL 확인

- **코드상 URL**: `https://pf.kakao.com/_xfkxfjX` (contact/page.tsx line 30)
- **이메일**: `kkumddara@ozklab.com` ✅ (서비스 문의 기준)
- **외부 URL 접속 확인**: 불가 (코드 환경 제약)
- **수동 확인 필요**: 카카오채널 관리자센터 → 채널명 "꿈따라_자녀 진로 탐색" → 공개 프로필 URL과 `pf.kakao.com/_xfkxfjX` 일치 여부 직접 확인 필요
- **오래된 이메일 노출**: 없음 (`johsoappa@gmail.com` 미노출 확인)

#### 작업 4 — `student/home` 미션 ID 호환성 확인

- **기존 m1~m4 형식**: static ROADMAPS fallback 경로에서만 사용. `completedSet.has(m.id)` 비교에서 string 키로 안전하게 처리됨.
- **신규 UUID 형식**: DB 파일럿 직업은 `prep-{uuid}` / `action-{uuid}` 형식. 동일 방식으로 `completedSet.has(m.id)` 비교.
- **런타임 에러**: 없음. 기존 `checked_missions` JSONB에 m1/m2 키가 있어도 에러 발생하지 않음.
- **진행률 0-safe**: `totalMissions > 0` 조건으로 divide-by-zero 방지 ✅
- **의도된 동작**: 기존 m1~m4 완료 상태가 신규 UUID 미션에 반영되지 않는 것은 코드 주석에서 명시한 의도된 동작 ("기존 m1~m4 체크 기록 변환은 별도 작업 예정"). UX 영향은 있으나 런타임 오류 없음.
- **후속 필요**: 기존 사용자의 완료 기록 마이그레이션 (별도 작업지시서)

**OZ 수동 확인 SQL (Supabase SQL Editor 읽기 전용):**
```sql
-- 기존 m1/m2 형식 기록 보유 자녀 확인
SELECT occupation_id, checked_missions
FROM public.roadmap_progress
WHERE checked_missions::text LIKE '%m1%'
   OR checked_missions::text LIKE '%m2%'
LIMIT 20;

-- 전체 checked_missions 현황 샘플
SELECT occupation_id, checked_missions
FROM public.roadmap_progress
WHERE checked_missions IS NOT NULL
LIMIT 20;
```

---

## 19. 학부모 체험하기 카드 라우팅 후속 수정 (2026-05-28)

- **발견 증상**: `/demo/parent` 학부모 체험하기 화면에서 `주간 리포트`, `명따라` 카드 클릭 시 홈(`/`)으로 튕기는 현상
- **원인**: 두 카드가 `router.push("/report")`, `router.push("/myeonddara")`로 직접 이동 → 해당 페이지 내 `getUser()` null 체크 → `router.replace('/')` 로 redirect
- **수정**: `AUTH_REQUIRED_FEATURES` Set 도입. 해당 기능 클릭 시 직접 이동 대신 카드 아래에 기능별 인라인 안내 박스(+로그인 CTA 버튼) 표시. 홈 이동 없음.
- **추가 수정**: 하단 `"14일 무료 체험 · 자동결제 없음"` → `"베타 기간 무료 이용 · 자동결제 없음"` 교체
- **DB/API/Auth/RLS/AI/요금제 변경 없음**
- tsc PASS, build PASS

---

## 20. 학부모 체험하기 AI 진로 상담 카드 최신화 (2026-05-28)

- `AI 진로 상담` 카드에서 `준비중` 배지 제거 → 주간 리포트/명따라와 동일한 활성 카드로 표시
- `badge: "준비 중"` 항목 삭제, `AUTH_REQUIRED_FEATURES`에 `"counseling"` 추가
- 클릭 시 `/parent/counseling` 직접 이동 대신 인라인 안내 박스 표시 (비로그인 홈 튕김 방지)
- 인라인 안내: "AI 진로 상담은 자녀 프로필을 만든 뒤 사용할 수 있어요." + 로그인 CTA
- 렌더링 코드에서 `disabled` / `feat.badge` 참조 정리 (모든 카드 활성 상태)
- `베타 기간 무료 이용 · 자동결제 없음` 문구 유지 확인
- DB/API/Auth/RLS/AI/요금제 변경 없음
- tsc PASS, build PASS

---

## 21. 꿈따라 핵심 컨셉 재정렬 점검 (2026-05-28)

**점검 기준**: `AI 중심` 포지션이 아닌 `좋아하는 것 기반 진로 탐색` 포지션 확인

| 영역 | 결과 | 메모 |
|---|---|---|
| 랜딩 `/` | PASS | 메인 h1에 "아직 꿈이 없어도 괜찮아요 / 좋아하는 것에서 직업을 찾아요" 이미 존재 |
| 학부모 체험 `/demo/parent` | PASS | "베타 기간 무료 이용 · 자동결제 없음" 유지 확인 |
| 학생 체험 `/demo/student` | **수정** | "14일 무료 체험" → "베타 기간 무료 이용" + 핵심 컨셉 서브텍스트 추가 |
| 직업 탐색 `/explore` | PASS | AI 중심 문구 없음, 관심분야 기반 탐색 구조 유지 |
| 관심 운동 탐색 `/explore/interests/sports` | PASS | 금지 표현 없음, "운동으로 찾는 직업" 헤더 ✅ |
| 명따라 `/myeonddara` | PASS | "진로를 정해주는 기능이 아니라, 대화를 시작하는 베타 기능" ✅ |
| 명따라 결과 `/myeonddara/result` | PASS | "만세력 기반 참고용 진로 분석 서비스 (베타)" ✅ |
| AI 진로 상담 `/parent/counseling` | **수정** | "진로 설계 도우미" → "진로 탐색 도우미" (설계→탐색 포지션 완화) |
| 부모 리포트 `/report` | PASS | "진로를 단정하지 않습니다" 면책 문구 ✅ |
| 요금제 `/pricing` | PASS | "베타 기간 무료 체험" (14일 아님), AI 코칭 베타 안내 ✅ |

**금지 표현 검색 결과**: 사용자 노출 영역 해당 없음 (`src/data/sportsInterestData.ts` JSDoc 주석만 존재, 무해)

**수정 내용**:
- `/demo/student`: `14일 무료 체험 · 자동결제 없음` → `베타 기간 무료 이용 · 자동결제 없음`
- `/demo/student`: 인사말 h1 아래 서브텍스트 추가 — "아직 꿈이 정해지지 않아도 괜찮아요. 좋아하는 것부터 탐색해 보세요."
- `/parent/counseling`: 초기 AI 메시지 "진로 설계 도우미" → "진로 탐색 도우미"
- `/parent/counseling`: 헤더 서브타이틀 "진로 설계 도우미" → "진로 탐색 도우미", "자녀 맞춤형 상담" → "자녀 관심사 기반 탐색 상담"

**DB/API/Auth/RLS/AI 로직/요금제 변경 없음**

---

## 이력

| 날짜 | 작업 | 커밋 |
|---|---|---|
## 22. 베타 운영 관리 체계 문서화 (2026-05-30)

- `docs/beta-operation-guide.md` 신규 작성
- 포함 항목: 운영 목적, 현재 베타 기준 상태, 일일/주간 체크리스트, 문의·오류 접수 기준, 피드백 분류 기준, P0/P1/P2 이슈 분류 기준, 기능별 확인 우선순위, 사용자 피드백 기록 템플릿, 오류 기록 템플릿, 배포 전 확인 체크리스트, 베타 운영 중 금지 작업, 체험단 확대 전 확인 사항, 운영 지표 기준, 다음 작업 결정 기준
- 신규 기능 구현 없음 — 운영 관리 문서만 추가
- DB/API/Auth/RLS/AI/요금제 변경 없음

---

| 2026-05-30 | 베타 운영 관리 체계 문서화 (`docs/beta-operation-guide.md` 신규 작성) | — |
| 2026-05-28 | 꿈따라 핵심 컨셉 재정렬 — 좋아하는 것 기반 진로 탐색 문구 점검 및 최소 보정 | f9d1aba |
| 2026-05-28 | 학부모 체험하기 AI 진로 상담 카드 최신화 (준비중 배지 제거, 인라인 안내 추가) | 7fa9270 |
## 23. 프로덕션 베타 운영 전 최종 실사용 점검 (2026-05-30)

- `docs/production-beta-readiness-check.md` 신규 작성
- 코드 기준 정적 분석 완료: 금지 표현 0건, tsc PASS, build PASS
- P0 이슈 없음 → **판정: A. 베타 운영 가능**
- 실 브라우저 확인은 OZ 수동 확인 필요 (§3 필수 6개 항목)
- DB/API/Auth/RLS/AI/요금제 변경 없음

---

## 24. 자녀 모드 "내 활동" 전용 페이지 분리 (2026-05-30)

- 증상: BottomNav "내 활동" 탭이 `/student/home`으로 연결되어, 미션 선택/완료 후 탭을 눌러도 홈으로 튕기는 것처럼 보임
- 조치: `/student/activity` 전용 페이지 신규 생성, 완료 미션 기록을 독립적으로 확인하도록 분리
- BottomNav 학생 "내 활동" 경로 → `/student/activity`, student/home은 "내 활동" 요약 카드로 변경 (상세는 `/student/activity`)
- 완료 미션 계산 로직은 `StudentActivitySection` 컴포넌트로 통합 (home/activity 중복 방지)
- 학생 `/report` 직접 접근 시 redirect 대상을 `/student/home` → `/student/activity`로 변경 (부모 리포트 미노출 유지)
- DB/migration/API/AI/요금제/부모 리포트 계산 로직 변경 없음, tsc PASS, build PASS

---

## 25. 자녀 내 활동 완료 미션 목록 표시 보강 (2026-06-01)

- 니즈: 완료 개수만으로는 회고·성취감이 부족 → 실제 완료한 미션을 자녀가 직접 확인 가능하게 보강
- StudentActivitySection 에 완료 미션 카드 목록 추가 (최근 최대 5개, 미션 제목 + 관련 직업명)
- 미션 제목 없음 → "완료한 미션", 직업명 없음 → "관련 직업 정보 확인 중" fallback
- `checked_missions` 구조상 미션별 완료일이 없어 완료일은 표시하지 않음 (지시서 기준 준수)
- 완료 미션 5개 초과 시 "최근 완료한 미션 5개만 보여줄게요." 안내
- student/home 요약 카드는 그대로 유지(상세 목록 미노출), 문구만 "지금까지 N개의 미션을 완료했어요 / 자세한 기록은 내 활동에서"로 정리
- DB/migration/API/AI/요금제/부모 리포트 계산 로직 변경 없음, tsc PASS, build PASS

---

## 26. 학생 체험 BottomNav "리포트" 노출 오류 수정 (2026-06-01)

- 증상: 학생 체험(`/demo/student`)에서 공용 `/explore`·`/roadmap`로 이동 시 하단 BottomNav가 부모용으로 렌더되어 "리포트" 탭이 노출됨
- 원인: `/demo/student`는 자체 레이아웃이라 BottomNav 미렌더. 공용 `/explore`(AppShell→BottomNav)에 진입할 때 비로그인 사용자라 role 미확정 → parent fallback → "리포트" 노출
- 조치: BottomNav role 결정 로직을 우선순위 기반으로 재구성
  1. 실제 로그인 role(user_metadata.role) 2. roleOverride prop 3. demo session role(sessionStorage) 4. pathname fallback 5. parent fallback
- `/demo/student`·`/demo/parent` 진입 시 sessionStorage(`kkumddara_demo_role`)에 데모 role 기록 → 공용 화면 이동 후에도 학생/부모 nav 유지
- 실제 로그인 role이 확정되면 데모 role 잔재 제거하여 항상 실 role 우선
- AppShell 에 `navRoleOverride` prop 추가(실 로그인 role 우선, 보조용)
- DB/migration/RLS/Auth 구조/부모 리포트 계산/`/student/activity` 표시 로직 변경 없음, tsc PASS, build PASS

---

## 32. 비밀번호 재설정 updateUser 실패 보정 (2026-06-02)

- 증상(OZ 실환경): 메일 발송·링크 진입·새 비밀번호 화면까지 정상이나, 새 비밀번호 저장 시 updateUser 실패 → "비밀번호 변경 중 문제..." 에러
- 추정 원인: PKCE recovery 링크의 `?code=` 세션 교환 미완료 상태에서 updateUser 실행 / 2.5초 대기 부족
- 조치(`/auth/reset-password`):
  - recovery 확보 순서 정립: ① getSession ② `?code=`면 `exchangeCodeForSession(code)` ③ getSession 재확인 ④ PASSWORD_RECOVERY/SIGNED_IN 이벤트 ⑤ 타임아웃
  - 자동 교환이 먼저 처리한 경우 중복 교환 회피(세션 선확인) + 교환 실패 시 세션 재확인 fallback
  - recovery 대기 시간 2.5초 → **5초** 상향 (느린 네트워크 고려)
  - updateUser 실패 시 개발자 콘솔에 Supabase error(message/status/name) 기록, 사용자에겐 친화 문구 유지. 동일 비밀번호 정책 위반은 "새 비밀번호는 이전 비밀번호와 다르게 설정해 주세요"로 구분
- 직접 URL 접근 invalid 안내 유지
- Auth 구조/회원가입 role/Kakao OAuth/callback 변경 없음, tsc PASS, build PASS
- ⚠️ 메일 링크 진입 후 실제 변경 성공은 OZ 실 환경 재확인 필요 (동일 브라우저에서 요청·링크 클릭 시 PKCE verifier 일치 전제)

---

| 2026-06-02 | 비밀번호 재설정 updateUser 실패 보정 (`?code=` exchangeCodeForSession + 세션 확인 강화 + 대기 5초 + updateUser 에러 로깅/동일PW 구분) | — |

---

## 31. 비밀번호 재설정 링크 노출 보정 + reset 직접 접근 처리 (2026-06-02)

- 증상: 실제 학부모/학생 로그인 화면에 "비밀번호를 잊으셨나요?" 링크 미노출
- 원인: 직전 작업에서 링크를 `OnboardingForm`(개발 테스트용 이메일 로그인 블록)에 추가했으나, **실제 로그인 UI는 `src/app/page.tsx`의 `step === "auth"` 블록**이라 사용자 화면에 보이지 않았음
- 조치: `src/app/page.tsx` 로그인 폼(signin 모드)의 비밀번호 입력 아래에 "비밀번호를 잊으셨나요?" 링크 추가 → `/auth/forgot-password` (학부모/학생 공통 동일 화면이라 양쪽 모두 노출)
- `/auth/reset-password` 직접 접근 처리: recovery 세션 게이팅 추가 (checking/ready/invalid)
  - 메일 링크 진입(PASSWORD_RECOVERY/SIGNED_IN 또는 세션 존재) → 새 비밀번호 입력폼
  - 직접 URL 접근(세션 없음) → "재설정 링크가 만료되었거나 잘못된 접근입니다" 안내 + "재설정 메일 다시 받기"(→ `/auth/forgot-password`)
  - 확인 중에는 로딩 안내
- Auth 구조/회원가입 role/Kakao OAuth/callback 변경 없음, tsc PASS, build PASS

---

| 2026-06-02 | 비밀번호 재설정 링크 노출 보정 (실제 로그인 화면 `page.tsx`에 링크 추가) + reset-password 직접 접근 시 recovery 세션 게이팅 | — |

---

## 30. 비밀번호 재설정 UI 추가 (2026-06-02)

- 배경: 로그인 화면에 비밀번호 찾기/재설정 메뉴가 없어 베타 계정 복구 흐름 테스트 불가
- 로그인 폼(OnboardingForm 이메일 로그인 영역)에 "비밀번호를 잊으셨나요?" 링크 추가 → `/auth/forgot-password`
- `/auth/forgot-password` 신규: 이메일 입력 → `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth/reset-password })`, 성공/보조(스팸함)/에러/로딩 상태 + "로그인으로 돌아가기"
- `/auth/reset-password` 신규: 메일 링크 진입(recovery 세션 자동 처리, `PASSWORD_RECOVERY` 감지) → 새 비밀번호+확인 입력 → `supabase.auth.updateUser({ password })`. 일치/최소 6자/빈값 검증, 성공/만료 안내
- 친화적 에러 문구(원문 비노출), 모바일 레이아웃 고려
- 미들웨어 matcher에 `/auth/*` 미포함 → 비로그인 접근 가능
- Auth callback 구조 / Kakao OAuth / 회원가입 role 로직 / DB / RLS 변경 없음, tsc PASS, build PASS
- ⚠️ 실 메일 발송/수신·링크 클릭·변경 후 로그인은 OZ 실 환경 확인 필요 (Supabase Auth 메일 템플릿/리디렉트 URL 허용 목록 점검 포함)

---

| 2026-06-02 | 비밀번호 재설정 UI 추가 (로그인 화면 링크 + `/auth/forgot-password` + `/auth/reset-password`, Supabase Auth reset flow 연동) | — |

---

## 29. 환불 기준 문구 보정 + 이용 개시 안내 문구 기준 정리 (2026-06-02)

- `/refund` 제3조 환불 기준 재구성 (체리피킹 리스크 완화):
  - **삭제**: "결제 후 24시간 이내 → 전액 환불(이용 이력 무관)" — 콘텐츠 캡처·데이터 수집 후 환불 악용 가능
  - **유지·명확화**: "7일 이내 + 미이용 → 전액 환불 안내" (미이용 = 진단 시작·리포트 열람·AI 상담·유료 데이터 조회 등 실 이용 내역 없음)
  - **보정**: "7일 이내 + 이용 내역 있음 → 이용 내역 기준 안내", "7일 초과 또는 지속형 서비스 → 상품 유형·잔여 기간 기준 안내", "서비스 오류/중복 결제 → 확인 후 별도 처리"
  - 하단 "※ 이용 내역 안내" 유의사항 추가
- 직설/단정 표현 미사용: "환불 불가", "미이용 전액 환불 대상에서 제외" → "환불 기준이 달라질 수 있습니다"/"이용 내역 기준으로 안내될 수 있습니다"로 완화
- 현재 베타 무료 단계 — 실제 결제·구독 해지·환불 신청·PG 취소 로직은 미구현 유지
- `terms` 정식 약관·`refund` §6 장애 보상(서비스 장애 시 보상, 환불-window와 무관)은 유지

### 정식 유료 결제 오픈 전 추가 설계 필요 항목 (향후 과제)

1. 이용 개시 이벤트 로그 설계 (`billing_usage_events` 등)
2. `is_used` 또는 `first_used_at` 판정 기준
3. 단건 콘텐츠 vs 지속형 구독 환불 기준 분리
4. 이용 개시 전 확인 모달 적용 위치
5. 환불 신청/조회 UI
6. PG 취소 API 연동
7. 환불 테스트 시나리오

### 이용 개시 전 확인 모달 문구 기준 (정식 오픈 시 적용 — 현재 미적용)

- 제목: "서비스 이용을 시작할까요?"
- 본문: "이 기능을 시작하면 서비스 이용 내역이 기록됩니다. 진단 시작, 리포트 열람, AI 상담 사용, 유료 데이터 조회 등 실제 이용 내역이 있는 경우에는 환불 기준이 달라질 수 있습니다. 계속 진행하시겠습니까?"
- 버튼: "취소" / "동의하고 시작하기"
- 금지 문구: "미이용 전액 환불 대상에서 제외됩니다" · "환불이 불가능합니다" · "이 버튼을 누르면 환불받을 수 없습니다" · "전액 환불이 제한됩니다"

> ⚠️ 위 모달은 현재 베타에서 **기능에 강제 적용하지 않으며**, 정식 결제 오픈 시 사용할 문구 기준만 기록.

---

| 2026-06-02 | 환불 기준 문구 보정 ("24시간 이용 이력 무관 전액" 삭제, 7일 미이용/이용내역/7일 초과·지속형/오류·중복 기준으로 재구성, 완화 표현 채택) + 이용 개시 모달 문구 기준 문서화 | — |

---

## 28. 구독 및 결제 관리 안내 UI 추가 + 환불 문구 단일화 (2026-06-01)

- 배경: 정적 점검(P1)에서 환불 문구 충돌(`pricing` "24시간 무조건 전액" ↔ `faq` "7일 조건부") + 구독/결제 관리 UI 경로 부재 확인
- `/settings/billing` 신규 생성: 베타 무료 이용 / 결제 수단 없음 / 환불·구독 해지 대상 없음 안내 + 요금제·환불정책·문의 CTA. "구독 해지" 버튼은 미노출(해지 대상 없음)
- 설정 페이지에 "구독 및 결제 관리" 진입 카드 추가 (→ `/settings/billing`)
- 문구 단일화: `pricing`/`faq`의 present-tense 결제/해지/환불 단정 문구를 베타 기준("정식 결제 오픈 전, 실제 결제 없음, 정식 오픈 시 안내")으로 보정
- 유지: `refund` 정식 환불정책(베타 배너로 "정식 도입 시 기준" 명시), `terms` 정식 약관, 데모/가이드 "베타 무료 이용·자동결제 없음", 명따라 1회 무료 체험(실 베타 기능)
- 실제 구독 해지/환불/결제 수단/PG/subscription 상태 변경 등 결제 로직은 구현하지 않음(결제 오픈 전)
- DB/migration/RLS/Auth/AI/결제 로직/요금제 권한/subscription_plan 구조 변경 없음, tsc PASS, build PASS

---

## 27. 학생 체험 "내 활동" 탭 홈 이동 오류 수정 (2026-06-01)

- 증상: 학생 체험(비로그인)에서 BottomNav "내 활동" 클릭 시 보호 라우트 `/student/activity`로 이동 → 미들웨어(`/student/:path*` role=student 필요)에 걸려 홈/랜딩으로 튕김
- 조치: 데모 학생 모드에서는 내 활동/홈 href를 비보호 데모 라우트로 분기
  - 내 활동: `/demo/student/activity`, 홈: `/demo/student`
  - 실제 로그인 학생은 기존 `/student/activity`·`/student/home` 유지 (loginRole 우선)
- `/demo/student/activity` 데모 안내 페이지 신규 생성 (실제 저장 데이터 미조회, 빈 상태 + 탐색/로그인 CTA, BottomNav navRoleOverride="student")
- BottomNav `isDemoStudent = !loginRole && (demoRole==="student" || pathname.startsWith("/demo/student"))` 기준으로 href 분기, 데모 홈 탭 active는 정확 일치로 처리(하위 경로 중복 활성 방지)
- 미들웨어 matcher에 `/demo/*` 미포함 → 데모 라우트는 비보호, 튕김 없음
- DB/migration/RLS/Auth 구조/`/student/activity` 표시 로직/부모 리포트 변경 없음, tsc PASS, build PASS

**실 브라우저 검증 (OZ, 2026-06-01 22:32, Chrome / PC·모바일) — 판정: PASS, 이슈 종료**
- 비로그인 `/demo/student` 진입 정상
- 학생 체험 → 직업 탐색 이동 정상, BottomNav 홈/직업 탐색/내 활동 정상 표시
- 학생 체험 상태에서 "리포트" 미노출 정상
- "내 활동" 클릭 시 `/demo/student/activity` 이동 정상, 홈 튕김 현상 없음
- 실제 학생 로그인 시 `/student/activity` 정상 이동
- 부모 리포트는 학부모 모드에서 정상 진입

---

| 2026-06-01 | 구독 및 결제 관리 안내 UI 추가 (`/settings/billing` 신규) + 환불/결제 문구 베타 기준 단일화 (pricing·faq present-tense 결제·해지·환불 문구 보정) | — |
| 2026-06-01 | 학생 체험 "내 활동" 탭 홈 이동 오류 수정 (`/demo/student/activity` 신규 + BottomNav 데모 href 분기) | — |
| 2026-06-01 | 학생 체험 BottomNav "리포트" 노출 오류 수정 (role 우선순위 + demo session role, AppShell navRoleOverride) | — |
| 2026-06-01 | 자녀 내 활동(`/student/activity`) 완료 미션 목록 표시 보강 (최대 5개, 미션 제목 + 관련 직업명) | — |
| 2026-05-30 | 자녀 모드 "내 활동" 탭 → `/student/activity` 전용 페이지 분리, BottomNav 경로 보정, `/report` 학생 redirect 보정 | — |
| 2026-05-30 | 자녀 모드 내 활동 UI 추가 (BottomNav role-aware, student/home 내 활동 섹션, report redirect 수정) | — |
| 2026-05-30 | 베타 운영 전 OZ 수동 확인 체크리스트 (`docs/manual-beta-operation-checklist.md`) | a194735 |
| 2026-05-30 | 베타 피드백·문의·오류 기록 템플릿 구축 (`docs/beta-feedback-and-issue-log-template.md`) | 84f1b1c |
| 2026-05-30 | 정책 문서 ↔ UI 문구 정합성 점검 및 최소 보정 (`docs/plan-policy-ui-consistency-audit.md`) | 60f9f31 |
| 2026-05-30 | 플랜별 권한표 및 사용량 제한 정책 문서화 (`docs/plan-permission-and-usage-policy.md`) | 8c06b49 |
| 2026-05-30 | 프로덕션 베타 운영 전 최종 실사용 점검 완료 (`docs/production-beta-readiness-check.md`) | de4da76 |
| 2026-05-30 | 베타 운영 관리 체계 문서화 (`docs/beta-operation-guide.md` 신규 작성) | e466aca |
| 2026-05-28 | 학부모 체험하기 카드 라우팅 오류 수정 (report/myeonddara 인라인 안내 전환) | ea555a3 |
| 2026-05-27 | 관심 운동 기반 관련 직업 섹션 검증 완료 (SportsInterestCareerSection) | — |
| 2026-05-27 | 베타 공개 전 최종 스모크 테스트 문서 작성 완료 | ab6e43d |
| 2026-05-27 | P1 4건 후속 정리 완료 (refund 문구 보정, report 타입 선언, contact/student 확인) | 209bfc8 |
| 2026-05-27 | 명따라 결과 → 관심 운동 CTA 구현 | e032a1e |
| 2026-05-27 | 경진대회 사업계획서용 기능 현황 문서 작성 | c79a290 |
