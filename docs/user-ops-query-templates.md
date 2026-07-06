# 꿈따라 운영 SQL·PostHog 코호트 템플릿

> 작성일: 2026-07-07  
> 상태: P0 운영 리포트 문서 (코드 변경 없음)  
> 근거: `supabase/migrations/002_mvp_refactor.sql`, `007_ai_consult.sql`, `008_update_myeonddara.sql`, `046_add_weekly_activity_completions.sql`, `src/lib/analytics.ts`, `docs/analytics-events.md`  
> 관련 문서: [`docs/analytics-events.md`](./analytics-events.md)

---

## 1. 문서 목적

관리자 화면이 없는 현재 단계에서, 운영자(OZ)가 **Supabase SQL Editor**와 **PostHog Dashboard**만으로 가입자·자녀 연결률·플랜·사용량·탐색/퀴즈 퍼널·이탈 위험 사용자를 수동 확인하는 절차를 정리한다.

- **Supabase** = 가입자·자녀 연결·플랜·사용량의 기준 데이터 (source of truth)
- **PostHog** = 탐색·퀴즈·퍼널·리텐션의 기준 데이터
- 회원 "상태" 판단은 Supabase 우선, 행동 "흐름" 판단은 PostHog 보조

---

## 2. 현재 운영 가능 범위

| 확인 항목 | 도구 | 가능 여부 |
|---|---|:---:|
| 가입자 수·추세 | Supabase SQL | ✅ |
| 자녀 연결 완료/미완료/연결률 | Supabase SQL | ✅ |
| 플랜 분포 | Supabase SQL | ✅ (실결제 미연동 — free/베타 중심) |
| AI 상담·명따라 사용량 | Supabase SQL | ✅ |
| 직업 탐색·퀴즈 완료 | PostHog | ✅ (DB 기록 없음 — PostHog 단독) |
| 퍼널·리텐션·이탈 코호트 | PostHog | ✅ |
| 최근 로그인(last_sign_in_at) | Supabase Dashboard 수동 | △ (SQL Editor에서 `auth.users` 조회 권한에 따라 다름 — 안 되면 Authentication 메뉴에서 확인) |

---

## 3. Supabase와 PostHog 역할 분리

| 데이터 | source of truth | 이유 |
|---|---|---|
| 가입자·role | Supabase `parent`/`student` | 계측 도입(2026-07-05) 이전 가입자는 PostHog에 없음 |
| 자녀 연결 여부 | Supabase `student.child_id IS NOT NULL` | 연결 완료의 유일한 정확 기준 |
| 플랜 | Supabase `subscription_plan` | PostHog에 플랜 정보 없음 |
| AI 상담·명따라 사용량 | Supabase `ai_consult_usage`/`myeonddara_usage` | 전용 이벤트 미계측 |
| 직업 조회 | PostHog `occupation_viewed` | DB에 조회 기록 테이블 없음 |
| 퀴즈 완료 | PostHog `quiz_completed` | DB 저장 없음 (local state만) |
| 리텐션·재방문 | PostHog `$pageview` | 자동 수집 |

PostHog person과 Supabase 매칭 기준: PostHog identify에 들어가는 uuid는 **`parent.id` 또는 `student.id`** (auth.users.id 아님). auth 계정까지 추적하려면 `parent.user_id`/`student.user_id`로 한 단계 더 조인한다.

---

## 4. 매주 확인할 핵심 지표

| 지표 | 확인 도구 | 기준 데이터 | 운영 해석 | 주의사항 |
|---|---|---|---|---|
| 전체 parent 가입자 수 | Supabase | `parent` | 서비스 규모 기준선 | onboarding 미완료 포함 (§5-1에서 구분) |
| 최근 7일 신규 parent | Supabase | `parent.created_at` | 유입 추세 | 마케팅 활동과 함께 해석 |
| 전체 student 가입자 수 | Supabase | `student` | 학생 계정 규모 | 자녀 연결 여부와 별개 |
| 자녀 연결 완료 수 | Supabase | `student.child_id IS NOT NULL` | 온보딩 핵심 전환 | PostHog `child_connected`보다 우선 |
| 자녀 연결 미완료 수 | Supabase | `student.child_id IS NULL` | 후속 안내 대상 | 개인 식별은 대시보드에서 별도 |
| 자녀 연결률 | Supabase | 위 두 값의 비율 | 온보딩 UX 판단 근거 | 분모=전체 student |
| 플랜별 parent 수 | Supabase | `subscription_plan` | 유료 전환 준비 지표 | 실결제 미연동 — 현재 free/베타 중심 |
| AI 상담 사용량 | Supabase | `ai_consult_usage` | 핵심 기능 사용률 | parent 단위 월 집계 |
| 명따라 사용량 | Supabase | `myeonddara_usage` | 핵심 기능 사용률 | 세션 상세는 민감정보 — 건수만 |
| 최근 7일 직업 탐색 수 | PostHog | `occupation_viewed` | 콘텐츠 소비량 | 익명 포함 |
| 최근 7일 퀴즈 완료 수 | PostHog | `quiz_completed` | 몰입도 | 재도전도 1회씩 집계됨 |
| 최근 7일 자녀 연결 수 | PostHog | `child_connected` | 주간 전환 흐름 | 절대값은 Supabase와 대조 |
| 최근 7일 이탈 위험 후보 | PostHog | Cohort 3 (§7) | 후속 응대 대상 | 계측 이전 가입자 누락 |
| 최근 30일 휴면 후보 | PostHog | Cohort 4 (§7) | 재활성화 대상 | `last_sign_in_at` 대체 지표 |

---

## 5. Supabase SQL 템플릿

Supabase Dashboard → SQL Editor에서 실행한다. 모든 쿼리는 **집계 중심·개인정보 최소 조회** 원칙으로 작성했다. `child.name`, `myeonddara_sessions.child_name`, `birth_date`, `ai_consult_sessions.messages`는 어떤 운영 쿼리에도 포함하지 않는다.

### 5-1. 전체 parent 가입자 수 (온보딩 상태별)

```sql
-- 학부모 계정 전체 규모 + 온보딩 완주 현황
select onboarding_status, count(*) as parent_count
from public.parent
group by onboarding_status
order by parent_count desc;
```

### 5-2. 최근 7일 신규 parent 가입자 (일별)

```sql
-- 최근 유입 추세
select date_trunc('day', created_at)::date as signup_date,
       count(*) as new_parents
from public.parent
where created_at >= now() - interval '7 days'
group by 1
order by 1 desc;
```

### 5-3. 전체 student 가입자 수

```sql
select onboarding_status, count(*) as student_count
from public.student
group by onboarding_status
order by student_count desc;
```

### 5-4. 자녀 연결 완료/미완료 현황

```sql
-- 연결 완료 기준: student.child_id IS NOT NULL
select
  count(*) filter (where child_id is not null) as connected,
  count(*) filter (where child_id is null)     as not_connected,
  count(*)                                     as total_students
from public.student;
```

### 5-5. 자녀 연결률

```sql
select
  round(
    100.0 * count(*) filter (where child_id is not null) / nullif(count(*), 0),
    1
  ) as connect_rate_pct
from public.student;
```

### 5-6. 플랜별 parent 수

```sql
-- 실결제 미연동 상태이므로 free/베타 중심으로 나오는 것이 정상
select plan_name, status, count(*) as parent_count
from public.subscription_plan
group by plan_name, status
order by parent_count desc;

-- 만료 예정 확인 (expires_at 있는 행만)
select plan_name, count(*) as expiring
from public.subscription_plan
where expires_at is not null
  and expires_at < now() + interval '30 days'
group by plan_name;
```

### 5-7. AI 상담 사용량 (이번 달)

```sql
-- 월 총 사용량 + 사용 parent 수 (parent 개인 식별 없이 집계)
select used_month,
       sum(count)                          as total_consults,
       count(*) filter (where count > 0)   as active_parents
from public.ai_consult_usage
where used_month = to_char(now(), 'YYYY-MM')
group by used_month;

-- 후속 응대가 필요할 때만: parent_id(uuid)까지 조회 (실명·이메일은 조회하지 않음)
select parent_id, count
from public.ai_consult_usage
where used_month = to_char(now(), 'YYYY-MM')
order by count desc
limit 20;
```

### 5-8. 명따라 사용량 (올해)

```sql
-- 연간 사용량 집계
select used_year,
       sum(count)                        as total_uses,
       count(*) filter (where count > 0) as active_parents
from public.myeonddara_usage
where used_year = extract(year from now())::int
group by used_year;

-- 세션 건수만 확인 (child_name, birth_date 등 민감 컬럼은 절대 조회하지 않는다)
select date_trunc('week', created_at)::date as week,
       count(*) as sessions
from public.myeonddara_sessions
where created_at >= now() - interval '30 days'
group by 1
order by 1 desc;
```

### 5-9. 최근 활동 후보 (child 단위)

```sql
-- 주의: 아래 활동일은 "자녀(child) 단위" 활동이다.
-- 학부모 본인의 접속 여부가 아니므로 parent 활동일로 해석하지 말 것.
select
  count(distinct child_id) as active_children_7d
from public.roadmap_progress
where last_visited_at >= now() - interval '7 days';

select
  count(distinct child_id) as mission_completed_children_7d
from public.weekly_activity_completions
where is_completed = true
  and completed_at >= now() - interval '7 days';
```

### 5-10. 자녀 연결 미완료 후보 목록

```sql
-- 후속 안내 대상 추출. uuid와 가입일만 조회한다.
-- 이메일 등 직접 식별정보가 필요하면 이 uuid(user_id)로
-- Supabase Dashboard → Authentication → Users에서 운영자가 개별 확인한다.
select id as student_id, user_id, created_at, onboarding_status
from public.student
where child_id is null
order by created_at desc
limit 50;
```

### 5-11. (참고) 이탈 위험 근사 쿼리 — 제한적

```sql
-- Supabase만으로는 "최근 7일 무활동 parent"를 정확히 구할 수 없다
-- (parent 접속 기록 테이블이 없음). 아래는 자녀 활동 기준의 근사치다.
-- 정식 판별은 PostHog Cohort 3(§7)을 사용한다.
select p.id as parent_id, p.created_at
from public.parent p
where p.created_at < now() - interval '7 days'
  and not exists (
    select 1
    from public.child c
    join public.roadmap_progress rp on rp.child_id = c.id
    where c.parent_id = p.id
      and rp.last_visited_at >= now() - interval '7 days'
  )
order by p.created_at
limit 50;
```

---

## 6. PostHog Dashboard 구성 방법

Dashboard 이름: **`꿈따라 운영 대시보드`** (New dashboard로 생성 후 아래 Insight 4개를 추가)

### Insight 1 — 탐색 후 가입 퍼널

- 유형: Funnel
- 단계: ① `occupation_viewed` → ② `signup_completed` → ③ `quiz_completed` → ④ `child_connected`
- 기간: 최근 30일
- 목적: 비로그인 탐색에서 가입·퀴즈·자녀 연결까지 이어지는 흐름 확인
- 주의: 익명→가입 병합은 **같은 브라우저에서 이어질 때만** 정확하다. 다른 기기/브라우저로 가입하면 1→2 전환이 실제보다 낮게 보인다.

### Insight 2 — 가입 후 탐색 퍼널

- 유형: Funnel
- 단계: ① `signup_completed` → ② `occupation_viewed` → ③ `quiz_completed` → ④ `child_connected`
- 기간: 최근 30일
- 목적: 가입자가 실제 기능 사용까지 도달하는지 확인
- 주의: `signup_completed`는 온보딩 재진입 시 재발화 가능 → 집계 단위는 반드시 **Unique users** 기준으로 본다.

### Insight 3 — 직업 탐색 → 퀴즈 완료 퍼널

- 유형: Funnel
- 단계: ① `occupation_viewed` → ② `quiz_completed`
- Breakdown: `occupation_id`
- 목적: 직업별로 상세 조회 후 퀴즈까지 완료하는 비율 확인 → **직업 확장 우선순위 판단 근거**

### Insight 4 — 최근 7일 핵심 이벤트 추이

- 유형: Trends (Line)
- 이벤트: `occupation_viewed`, `quiz_completed`, `child_connected` (3개 시리즈)
- 기간: 최근 7일, 일 단위
- 목적: 주간 사용량 흐름 확인. 급락 시 장애/배포 이슈 의심

추가 권장: Retention 인사이트 1개 — 기준 이벤트 `signup_completed`, 재방문 이벤트 `$pageview`, Weekly. 7일 재방문율이 여기서 나온다.

---

## 7. PostHog Cohort 정의

Cohorts 메뉴에서 아래 4개를 생성한다.

### Cohort 1 — 가입 후 자녀 연결 미완료

- 조건: `signup_completed` 수행함 (all time) **AND** `child_connected` 수행 안 함 (all time)
- 주의: 계측 도입(2026-07-05) 이전 가입자는 PostHog에 이벤트 자체가 없어 이 코호트에 잡히지 않는다. **운영 판단은 Supabase §5-10 쿼리를 우선**하고, 이 코호트는 최근 가입자 흐름 확인용으로 쓴다.

### Cohort 2 — 직업 탐색 후 퀴즈 미완료

- 조건: `occupation_viewed` 수행함 (최근 30일) **AND** `quiz_completed` 수행 안 함 (최근 30일)
- 목적: 탐색까지는 왔지만 몰입 단계에서 이탈한 사용자 규모 확인

### Cohort 3 — 최근 7일 이탈 위험 후보

- 조건:
  1. `signup_completed` 수행함, **7일 이전** (PostHog UI: "completed event" + 기간을 "more than 7 days ago"로 설정. 해당 옵션이 없으면 "first seen more than 7 days ago"로 대체)
  2. **AND** 최근 7일 내 `occupation_viewed` 수행 안 함
  3. **AND** 최근 7일 내 `quiz_completed` 수행 안 함
  4. **AND** 최근 7일 내 `child_connected` 수행 안 함
- 대체 기준: 위 다중 조건 구성이 번거로우면 "최근 7일 내 `$pageview` 수행 안 함 AND `signup_completed` 수행함"으로 단순화해도 초기 운영에는 충분하다.

### Cohort 4 — 최근 30일 휴면 후보

- 조건: `$pageview` 수행 안 함 (최근 30일) **AND** `signup_completed` 수행함 (all time)
- 주의: Supabase `auth.users.last_sign_in_at`은 앱 코드에서 접근하지 않으므로, 현재 휴면 판별은 이 코호트 또는 Supabase Dashboard(Authentication → Users의 Last sign in 컬럼) 수동 확인으로 대체한다.

---

## 8. 운영 해석 기준

### 8-1. source of truth

- 가입자·자녀 연결·플랜·AI 상담·명따라 사용량 → **Supabase**
- 직업 탐색·퀴즈 완료·퍼널·리텐션 → **PostHog**
- 자녀 연결 완료 = `student.child_id IS NOT NULL` (유일 기준)
- 퀴즈 완료·직업 조회는 DB 기록이 없으므로 PostHog가 유일한 기록이다

### 8-2. 데이터 불일치 주의

- PostHog 계측 도입(2026-07-05) **이전 가입자는 이벤트가 없다** — Supabase와 영구 불일치
- 익명→가입 병합은 같은 브라우저에서만 정확하다. 기기를 바꿔 가입하면 행동이 분리된다
- `signup_completed`는 온보딩 재진입 시 중복 발화 가능 → **Unique users 기준**으로 본다
- `quiz_completed`는 재도전 시 여러 번 발생한다 (완료 "횟수"와 완료 "사용자 수"를 구분)
- 자녀 연결 수치가 두 도구에서 다르면 **항상 Supabase가 맞다**

### 8-3. 개인정보·보안 주의

- 운영 리포트 기본 조회에서 자녀 실명·생년월일·상담 전문(`ai_consult_sessions.messages`)·명따라 입력값을 **조회하지 않는다**
- PostHog에는 민감정보를 보내지 않는다 (현재 전송 값: role, occupation_id, 점수, uuid, 경로뿐 — `docs/analytics-events.md` 참조)
- `myeonddara_sessions`의 자녀 실명/생년월일 평문 저장은 **기존 리스크로 별도 개선 대상** (이 문서 범위 아님)
- 향후 관리자 화면을 만들 경우 실명/생년월일 마스킹이 필수 전제다
- SQL Editor 결과를 스크린샷·문서로 공유할 때 uuid 목록도 외부 공유하지 않는다

---

## 9. 다음 단계 제안 (이 문서 범위 밖 — 별도 승인 후 진행)

1. (P1) 핵심 기능 이벤트 추가: `ai_counseling_started`, `myeonddara_completed`, `roadmap_viewed` — 결제·요금제 코드 미접촉으로 추가 가능
2. (P1) `signup_completed` 온보딩 재진입 재발화 가드
3. (P1) 가격 관심: `/pricing` 경로 `$pageview` 인사이트로 우선 확인, 전용 이벤트는 그 후 판단
4. (P2) `/admin/users` 내부 관리자 화면 (admin role + 서버 전용 service_role + 마스킹 설계 전제)
5. (P2) 명따라 생년월일 암호화 저장 개선
