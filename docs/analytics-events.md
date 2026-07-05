# 꿈따라 분석 계측 이벤트 정의 (PostHog)

> 작성일: 2026-07-05  
> 상태: 코드 계측 완료. **PostHog 프로젝트 생성 + 환경변수 설정은 OZ 대기.**  
> 원칙: 핵심 지표 5개만 유지한다. 이벤트 추가는 OZ.대표 승인 후 진행한다.

---

## 1. 동작 구조

- 래퍼: `src/lib/analytics.ts` — 컴포넌트는 posthog를 직접 import하지 않고 이 래퍼만 사용
- 초기화: `src/components/common/AnalyticsProvider.tsx` (루트 레이아웃에서 1회)
- **`NEXT_PUBLIC_POSTHOG_KEY` 미설정 시 전부 no-op** — 키 없이도 빌드·운영 영향 없음
- 개인정보 보호: autocapture 비활성, 세션 녹화 비활성(미성년자 대상 서비스), 식별자는 DB uuid만 사용 (이름·이메일·생년월일 전송 금지)

## 2. 이벤트 목록

| # | 이벤트 | 발생 시점 | 속성 | 코드 위치 |
|---|---|---|---|---|
| 1 | `signup_completed` | 온보딩 최종 완료 | `role: parent \| student` | `src/app/onboarding/parent/page.tsx`, `src/app/onboarding/student/page.tsx` |
| 2 | `child_connected` | 학생이 초대 코드로 자녀 프로필 연결 완료 | — | `src/app/onboarding/student/page.tsx` |
| 3 | `occupation_viewed` | 직업 상세 페이지 진입 | `occupation_id` | `src/app/explore/[id]/page.tsx` |
| 4 | `quiz_completed` | 퀴즈 결과 화면 도달 | `occupation_id`, `correct_count`, `total_questions` | `src/components/quiz/OccupationQuiz.tsx` |
| 5 | 재방문 (7일) | 자동 `$pageview` 기반 — 별도 코드 없음 | — | PostHog 리텐션 차트에서 조회 |

## 3. 활성화 절차 (OZ 담당)

1. [posthog.com](https://posthog.com) 무료 가입 → 프로젝트 생성 (US 리전 기본)
2. Project API Key 복사 (`phc_...` 형태 — 클라이언트 노출용 public key)
3. `.env.local` 및 Vercel 환경변수에 추가:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
   ```
   (EU 리전 사용 시 `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` 추가)
4. 배포 후 PostHog Activity 화면에서 `$pageview` 유입 확인
5. 회원가입 1건 테스트 → `signup_completed` 수신 확인

## 4. 대시보드 권장 구성

- 퍼널: `signup_completed` → `occupation_viewed` → `quiz_completed`
- 리텐션: `$pageview` 기준 주간 리텐션 (7일 재방문)
- 직업 수요: `occupation_viewed`를 `occupation_id`로 분해 → 2차 직업 확장 판단 근거
- 검색 실패 키워드 계측은 **미포함** — 직업 확장 판단 시 별도 이벤트 추가 검토 (OZ.대표 승인 필요)
