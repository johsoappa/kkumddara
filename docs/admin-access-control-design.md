# 꿈따라 관리자/운영자 권한 설계 (admin access control design)

| 항목 | 내용 |
| --- | --- |
| 문서 경로 | `docs/admin-access-control-design.md` |
| 버전 | v0.2 (2026-07-24) — 저장소 조사 결과 반영 |
| 상태 | 설계안 — 구현 전 |
| 범위 | 설계 문서 작성만 |
| 비범위 | 코드 수정, DB migration, Supabase schema/RLS 변경, middleware 수정, `/admin` 페이지 생성, `service_role` 신규 사용 |
| 선행 완료 | `/admin/sync-careers` 무인증 노출 차단(`d0a474e`), 유저 운영 리포트 문서(`8a2f6f3`), PostHog 운영 대시보드 구성 |

---

## 0. 한 줄 결론

**별도 `admin_users` 테이블(B안)** 을 권한 저장소로 두고, **middleware는 인증 여부만 확인, 실제 권한 판정은 서버 컴포넌트/Route Handler의 `requireAdmin()` · `requireOperator()`** 에서 수행하며, **미인가 접근은 전부 404(`notFound()`)** 로 처리한다.

---

## 1. 현재 권한 구조 요약

> 2026-07-24 저장소 조사로 확정된 내용이다.

| 항목 | 현재 상태 | 근거 |
| --- | --- | --- |
| 일반 사용자 role | `parent` / `student` 2종 | `src/lib/auth.ts:30, 69, 101` |
| **role 저장 위치** | **`user_metadata.role`** (Supabase Auth 유저 메타데이터) | `src/lib/auth.ts:198, 204` |
| role 재설정 지점 | onboarding 완료 시 `updateUser({ data: { role, onboarding_completed } })` | `src/lib/auth.ts:220, 242` |
| middleware 파일 경로 | **`src/middleware.ts`** (루트 `middleware.ts` 아님) | 조사 결과 |
| middleware 보호 라우트 | `/parent/*`, `/student/*` | 확인 필요 (matcher 실제 문자열 미확인) |
| `/admin/*` middleware 포함 여부 | 미포함 | 확인 필요 (matcher 미확인) |
| `/admin` 라우트 목록 | `src/app/admin/sync-careers/page.tsx` **1개** | `find` 결과 |
| `/admin/sync-careers` 상태 | `notFound()` 처리로 차단, 운영 404 확인 완료 | 커밋 `d0a474e` |
| `service_role` 사용처 | **`scripts/sync_goyo24_occupations.ts` (CLI 배치 전용) 1곳.** `src` 내 사용 0건 | grep 결과 |
| 개발자모드 / `/dev` / debug 플래그 | **없음** (매치 0건) | grep 결과 |
| `operator` 문자열 | 코드·문서 전체 **0건** | grep 결과 |
| admin/operator 권한 체계 | **없음** | 확정 |
| 관리자 행위 감사 로그 | 없음 | 확정 |

### 검증용 명령 (경로 정정본)

```bash
grep -rnF "/dev" src docs
grep -rnF "debug" src
grep -rnF "operator" src docs
grep -rnF "service_role" src scripts
grep -rnF "SERVICE_ROLE" src scripts
grep -rn "role" src/lib/auth.ts src/middleware.ts
find src/app -path "*admin*" -maxdepth 5 -type f
git status --short
```

### 현재 구조의 핵심 문제

0. **`user_metadata`는 클라이언트에서 사용자 본인이 수정 가능한 필드다.** Supabase Auth에서 `user_metadata`(DB상 `auth.users.raw_user_meta_data`)는 로그인한 사용자가 자신의 세션으로 `supabase.auth.updateUser({ data: {...} })`를 호출해 임의 값으로 덮어쓸 수 있다. 클라이언트가 쓸 수 없는 것은 `app_metadata`뿐이다.

   ```js
   // 로그인한 사용자가 브라우저에서 실행 가능
   await supabase.auth.updateUser({ data: { role: 'parent', onboarding_completed: true } })
   ```

   따라서 현재 `user_metadata.role` 기반 구조에서는:
   - student 계정이 스스로 `parent`로 전환할 수 있다.
   - `onboarding_completed`를 임의로 켤 수 있다.
   - **이 필드에 `admin`/`operator`를 추가하면, 모든 로그인 사용자가 한 줄로 관리자가 된다.**

   → 본 문서 §3의 A안이 채택 불가인 결정적 근거이며, 동시에 별도 확인이 필요한 기존 리스크다(§12-A 참조).

1. 관리자 권한이라는 개념 자체가 코드/DB 어디에도 없다. 따라서 `/admin/*`을 하나라도 추가하는 순간 "URL을 모르면 안전하다"는 보안(security by obscurity)에 의존하게 된다.
2. `/admin/*`이 middleware matcher에 없으므로, 새 admin 라우트를 만들면 **기본값이 무인증 공개**다. 이는 `d0a474e`로 차단한 사고와 동일한 구조가 재현된다는 뜻이다.
3. 전체 사용자 조회·`auth.users.last_sign_in_at` 조회는 일반 anon key + RLS로는 불가능하므로 `service_role` 도입이 불가피한데, 사용 원칙이 문서화되어 있지 않다.

---

## 2. 왜 admin/operator 권한 체계가 먼저 필요한가

| 만들려는 기능 | 권한 체계 없이 만들면 발생하는 문제 |
| --- | --- |
| `/admin/users` | 전체 사용자 목록 = 최고 위험 데이터. 무인증/약한 인증 시 전체 회원 유출 |
| `/admin/retention` | 이탈 위험 사용자 = 개인 식별 + 행동 이력 결합 데이터 |
| `/admin/sync-careers` 복구 | 외부 API 호출 + 데이터 대량 갱신. 무권한 실행 시 운영 데이터 오염 |
| CS 대응 화면 | 아동 실명·생년월일·상담 전문 접근 필요 → 최소권한 원칙 필수 |
| B2B Lite 학원/원장/학부모 관리 | 학원 관리자(원장)라는 **제3의 권한 축**이 추가됨. 지금 구조를 잘못 잡으면 재설계 비용 발생 |
| 운영 리포트 자동화 | 서버 배치가 `service_role`로 동작 → 실행 주체 식별·로그 필요 |

특히 꿈따라는 **미성년자 개인정보 + AI 생성 상담 기록**을 다룬다. 관리자 화면 사고는 일반 서비스보다 법적·신뢰 손상이 크므로, 권한 체계는 화면보다 **먼저** 확정한다.

---

## 3. 권한 모델 후보 비교

### A안. 기존 role(`user_metadata.role`)에 `admin` / `operator` 추가 — ❌ 채택 불가

| 구분 | 내용 |
| --- | --- |
| 장점 | 테이블 추가 없음. `role` 한 곳만 보면 되어 초기 구현이 빠름 |
| **치명적 결함** | 현재 role 저장 위치가 `user_metadata`다. 이 필드는 **사용자 본인이 클라이언트에서 수정 가능**하다. `admin`을 이 필드에 추가하는 순간, 모든 로그인 사용자가 `updateUser({ data: { role: 'admin' } })` 한 줄로 관리자 권한을 획득한다 |
| 단점 | 사용자 성격(학부모/학생)과 운영 성격(운영자/관리자)이 **의미가 다른 축인데 한 값에 섞임** |
| 단점 | 운영자가 자기 자녀 계정도 쓰는 경우 `parent`이면서 `admin`이어야 하는데 단일 값으로 표현 불가 |
| RLS 영향 | 기존 parent/student 관련 정책 전부 재검토 필요. 회귀 위험 큼 |
| 오부여 위험 | **최상.** 권한 상승(privilege escalation)이 취약점이 아니라 **정상 기능**이 됨 |
| 관리 복잡도 | 권한 회수 시 사용자 role 자체를 되돌려야 함 → 일반 사용 기능에 부작용 |
| 추천 | **채택 불가** |

> 참고: `user_metadata` 대신 `app_metadata`로 옮기면 클라이언트 쓰기는 막힌다. 그러나 `app_metadata` 수정에는 결국 `service_role` 또는 Admin API가 필요하므로, "코드 밖에서 수동 부여"라는 B안의 운영 방식과 동일해진다. 그럴 바에는 감사 컬럼(`created_by`, `is_active`, `memo`)을 함께 가질 수 있는 별도 테이블이 우월하다.

### B안. 별도 `admin_users` 테이블 생성 ✅

| 구분 | 내용 |
| --- | --- |
| 장점 | 사용자 권한(parent/student)과 운영 권한을 **완전 분리**. 한 사람이 학부모이면서 운영자일 수 있음 |
| 장점 | 기존 RLS 정책 **무수정**. 신규 테이블 정책만 추가하면 됨 → 회귀 위험 최소 |
| 장점 | 애플리케이션 코드에 권한 부여 경로가 아예 없음(수동 insert) → 오부여 사실상 불가 |
| 장점 | `is_active` 토글만으로 즉시 회수 가능. 사용자 기능에 영향 없음 |
| 단점 | 권한 확인 시 조회 1회 추가 (요청당 1 SELECT, 캐시로 완화 가능) |
| 단점 | 테이블 1개 + 정책 1~2개 추가 작업 필요 |
| B2B 확장성 | 향후 학원 원장 권한은 `organizations` 축에서 별도 처리 가능. 운영자 권한과 섞이지 않음 |
| 감사/로그 | `created_by`, `created_at`, 향후 `admin_action_logs` 연결 지점이 자연스러움 |
| 추천 | **추천안** |

### 결론

**B안 채택.** 결정적 이유는 현재 role 저장 위치가 클라이언트 쓰기 가능한 `user_metadata`라는 사실이다. 이 조건에서 A안은 선택지가 아니다. 부수적으로 B안은 기존 RLS 정책을 건드리지 않고, 애플리케이션 코드에 권한 부여 경로 자체가 존재하지 않는다는 이점을 갖는다.

---

## 4. `admin_users` 테이블 설계안 (초안 — 생성 금지)

```sql
-- 설계안입니다. 이번 단계에서는 실행하지 않습니다.
-- 실제 migration은 별도 작업지시서에서 진행합니다.

create table public.admin_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  role        text not null check (role in ('operator', 'admin')),
  is_active   boolean not null default true,
  memo        text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

create index admin_users_active_idx
  on public.admin_users (user_id)
  where is_active = true;
```

### 컬럼 설계 근거

| 컬럼 | 근거 |
| --- | --- |
| `user_id` UNIQUE | 한 계정 = 한 운영 권한. 다중 role 부여를 구조적으로 차단 |
| `on delete cascade` | 계정 삭제 시 권한 잔존 방지 |
| `role` CHECK | 오타 role(`Admin`, `ADMIN`) 유입 차단 |
| `is_active` | 삭제 대신 비활성화 → 이력 보존 + 즉시 회수 |
| `created_by` | 누가 부여했는지 추적. 최초 계정은 NULL 허용 |
| `memo` | "2026-07 CS 대응 임시 부여" 같은 부여 사유 기록 |

### RLS 설계안 (핵심)

```sql
alter table public.admin_users enable row level security;

-- 본인 행만 조회 가능. 이것만으로 requireAdmin()이 동작합니다.
create policy "admin_users_select_self"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE 정책은 만들지 않습니다.
-- → 일반 세션으로는 권한 부여/변경이 원천 불가.
-- → Supabase SQL Editor(또는 service_role)로만 조작 가능.
```

**이 설계의 이점:** 권한 확인에 `service_role`이 필요 없다. 로그인한 사용자가 자기 자신의 admin 행을 조회하는 것뿐이므로 anon key + 세션으로 충분하다. `service_role`은 "전체 사용자 조회" 같은 실제 데이터 조회 시점에만 등장한다.

### role별 권한 범위

| 기능 | operator | admin |
| --- | :---: | :---: |
| 유저 현황 조회 (`/admin/users`) | ✅ | ✅ |
| 이탈 위험 후보 조회 (`/admin/retention`) | ✅ | ✅ |
| CS 확인용 상세 조회 | ✅ (마스킹 유지) | ✅ |
| 직업 데이터 동기화 실행 (`/admin/sync-careers`) | ❌ | ✅ |
| 서비스 설정 변경 (`/admin/settings`) | ❌ | ✅ |
| 요금제/결제 관련 조회 | ❌ | ✅ |
| 운영자 권한 부여/회수 | ❌ | ❌ (SQL Editor 전용, P2에서 재검토) |
| 데이터 export | ❌ | ❌ (초기 미구현) |

`super_admin`은 현재 운영 인원이 1인이므로 과잉 설계다. **P2 이후, 운영 인원이 2명 이상이 되거나 B2B 파일럿 학원이 확보된 시점에 재검토**한다.

---

## 5. 최초 admin 계정 부여 방식

| 방식 | 평가 |
| --- | --- |
| 특정 이메일이면 자동 admin 부여 (하드코딩) | ❌ 이메일 변경·탈취 시 즉시 권한 탈취. 코드에 권한이 박힘 |
| `.env` admin 이메일 allowlist | ⚠️ 배포 환경 변수 실수 시 권한 확대. 회수에 재배포 필요 |
| **Supabase SQL Editor에서 수동 insert** | ✅ **추천.** 부여 경로가 코드 밖에 있어 애플리케이션 취약점으로 권한 상승 불가 |
| 관리자 초대 UI | ❌ 현 단계 과잉. 초대 UI 자체가 새로운 공격면 |

### 추천 절차

1. OZ 대표 계정으로 **일반 회원가입**을 정상 진행한다 (별도 admin 가입 플로우를 만들지 않는다).
2. Supabase SQL Editor에서 `user_id`를 확인한다.
3. `admin_users`에 `role = 'admin'`, `is_active = true`로 수동 insert 한다.
4. insert 결과를 스크린샷 또는 쿼리 결과로 1회 기록해 둔다.

```sql
-- 3단계 예시 (migration 확정 후 실행)
insert into public.admin_users (user_id, role, is_active, memo)
select id, 'admin', true, '최초 관리자 계정'
from auth.users
where email = '<대표 계정 이메일>';
```

관리자 초대 UI는 **P2 이후**로 미룬다.

---

## 6. `/admin/*` 접근 보호 흐름

```
/admin/* 요청
  → [middleware] 세션 존재 확인
       └ 없음 → 404 (로그인 페이지 리다이렉트 금지)
  → [서버 컴포넌트 / Route Handler] requireAdmin() 또는 requireOperator()
       → Supabase user 조회 (getUser)
       → admin_users에서 user_id 조회
       → 행 없음 → notFound()
       → is_active = false → notFound()
       → role 부족 (operator가 admin 전용 접근) → notFound()
       → 통과 → { userId, role } 반환
  → 페이지 렌더 / 데이터 조회
```

### 유틸 시그니처 설계안

```ts
// src/lib/auth/admin.ts (설계안 — 이번 단계 구현 금지)

export type AdminRole = 'operator' | 'admin';

/** admin 권한이 있으면 컨텍스트 반환, 아니면 notFound() */
export async function requireAdmin(): Promise<AdminContext>;

/** operator 이상 권한이 있으면 컨텍스트 반환, 아니면 notFound() */
export async function requireOperator(): Promise<AdminContext>;

export type AdminContext = {
  userId: string;
  role: AdminRole;
};
```

**규칙:** 두 함수 모두 boolean을 반환하지 않고 **직접 `notFound()`를 던진다.** 호출부에서 `if (!ok) return`을 빠뜨려 발생하는 사고를 구조적으로 막기 위함이다.

### 라우트별 필요 권한

| 라우트 | 필요 권한 | 사용 유틸 |
| --- | --- | --- |
| `/admin/users` | operator 이상 | `requireOperator()` |
| `/admin/users/[id]` | operator 이상 | `requireOperator()` |
| `/admin/retention` | operator 이상 | `requireOperator()` |
| `/admin/sync-careers` | admin | `requireAdmin()` |
| `/admin/settings` | admin | `requireAdmin()` |
| `/api/admin/*` (Route Handler) | 각 화면과 동일 | 동일 유틸 재사용 |

**중요:** 페이지에서 권한을 확인했더라도, 그 페이지가 호출하는 Route Handler / Server Action에서 **반드시 다시 확인**한다. 화면 접근 제어와 데이터 접근 제어는 별개다.

---

## 7. middleware vs 서버 컴포넌트 권한 확인 비교

| 항목 | middleware matcher에 `/admin/:path*` 추가 | 서버 컴포넌트/Route Handler에서 확인 |
| --- | --- | --- |
| DB 조회 가능 여부 | 가능하나 Edge 런타임 제약 + 모든 요청에 지연 추가 | 자유롭게 가능 |
| Supabase 세션 확인 | 쿠키 기반 확인은 적합 | 적합 (`getUser()` 서버 검증) |
| 정확성 | 라우트 문자열 매칭 의존 → 신규 라우트 누락 위험 | 해당 파일에서 직접 호출 → 누락 시 즉시 인지 가능 |
| 실패 시 영향 | matcher 실수 = 전면 노출 | 유틸 호출 누락 = 해당 페이지만 노출 |
| RLS와의 관계 | 무관 | RLS와 함께 다층 방어 구성 |

### 추천: **둘 다 쓰되 역할을 분리한다**

1. **middleware (`src/middleware.ts`)**: `/admin/:path*`를 matcher에 추가한다. 단, 여기서는 **세션 유무만** 확인한다. DB 조회는 하지 않는다. 특히 **`user_metadata.role`로 admin 여부를 판정하지 않는다**(§1-0 참조).
   → 목적: 신규 admin 라우트가 추가되어도 "무인증 공개"가 기본값이 되지 않게 하는 안전망.
2. **서버 컴포넌트 / Route Handler**: `requireAdmin()` / `requireOperator()`로 실제 role을 판정한다.
   → 목적: 정확한 권한 판정과 데이터 접근 제어.

### 404 vs redirect

**전부 404(`notFound()`)를 채택한다.**

| 상황 | 처리 |
| --- | --- |
| 비로그인 | 404 (로그인 페이지 redirect 금지 — redirect는 "여기 관리자 화면이 있다"를 알려줌) |
| 로그인 + admin_users 행 없음 | 404 |
| 로그인 + `is_active = false` | 404 |
| operator가 admin 전용 라우트 접근 | 404 (403 아님 — 기능 존재 자체를 숨김) |

부작용: 운영자 본인이 권한 문제로 404를 봐도 원인을 알 수 없다. → 운영 매뉴얼에 "관리자 화면 404 = 권한 확인 필요"를 명시하고, 서버 로그에는 사유를 남긴다(개인정보 제외).

---

## 8. `service_role` 사용 원칙

1. `service_role` 키는 **절대 클라이언트 코드에 노출하지 않는다.** `NEXT_PUBLIC_` 접두사 사용 금지.
2. 사용 위치는 **서버 전용 Route Handler 또는 Server Action으로 한정**한다. 서버 컴포넌트에서 직접 사용하지 않는다(클라이언트 경계 실수 방지).
3. 사용 전제: **반드시 `requireAdmin()` / `requireOperator()` 통과 이후**에만 클라이언트를 생성한다.
4. 사용 사유는 다음 경우로 한정한다.
   - 전체 사용자 목록 조회
   - `auth.users.last_sign_in_at` 조회
   - RLS로는 불가능한 운영 집계
5. 응답 데이터는 **화면에 실제로 표시하는 필드만** 선택한다. `select('*')` 금지.
6. 다음 필드는 `service_role` 조회 시에도 **기본 제외**한다: 아동 실명, 생년월일, 상담 전문, 명따라 입력값 전문.
7. **로그에 개인정보를 출력하지 않는다.** `console.log(user)` 금지. 필요 시 id와 건수만 기록한다.
8. `service_role` 사용 지점은 파일 상단 주석으로 사유를 명시하고, 신규 사용처 추가 시 본 문서를 갱신한다.

```ts
// 예시 원칙 (구현 아님)
// service_role 사용 사유: auth.users.last_sign_in_at은 RLS로 조회 불가
// 접근 조건: requireOperator() 통과 필수
// 반환 필드: id, last_sign_in_at (그 외 금지)
```

---

## 9. 개인정보 마스킹 원칙

### 관리자 목록 화면 기본 노출 금지 항목

| 항목 | 목록 화면 | 상세 화면 |
| --- | --- | --- |
| 자녀 실명 | ❌ 금지 | 마스킹 표시 (`김*음`) |
| 생년월일 | ❌ 금지 | 미표시. 필요 시 학년/연령대만 |
| 상담 전문 (`ai_consult_sessions`) | ❌ 금지 | 기본 미표시. 별도 admin 권한 + 사유 필요(P2) |
| 명따라 입력값 전문 | ❌ 금지 | 미표시 |
| `invite_code` | ❌ 금지 | 미표시 |
| family relation 상세 | ❌ 금지 | 연결 여부(Y/N)만 |
| 이메일 | 부분 마스킹 (`oz***@ozklab.com`) | 부분 마스킹 |

### 표시 규칙

- 이름: 첫 글자 + `*` + 마지막 글자. 2글자면 `김*`.
- 이메일: 로컬파트 앞 2자 + `***` + 도메인.
- 연령: 생년월일 대신 **모드 구분(씨앗/새싹/나침반)** 으로 표시한다. 운영 판단에는 이것으로 충분하다.
- 상세 화면 진입 시에도 role을 재확인한다.
- **export(CSV/엑셀) 기능은 초기에 만들지 않는다.** 유출 사고 시 피해 규모가 화면 조회와 비교 불가하게 커진다.
- 마스킹은 **서버에서 수행**한다. 원본을 클라이언트로 보내고 CSS/JS로 가리는 방식 금지.

---

## 10. `/admin/sync-careers` 복구 조건

현재 `notFound()` 처리로 차단 중이다. 아래 조건이 **전부** 충족되기 전에는 복구하지 않는다.

- [ ] `admin_users` 테이블(또는 동등한 권한 체계) 생성 및 RLS 적용 완료
- [ ] 최초 admin 계정 수동 insert 완료 및 동작 확인
- [ ] `requireAdmin()` 구현 및 단위 확인 완료
- [ ] `/admin/sync-careers`가 `requireAdmin()` 호출 (operator 접근 불가)
- [ ] 동기화 실행이 **서버(Route Handler 또는 Server Action)에서만** 처리됨 — 클라이언트에서 외부 API 직접 호출 금지
- [ ] 실행 결과 확인 수단 존재 (최소: 성공/실패 + 처리 건수 화면 표시, 권장: 실행 로그 테이블)
- [ ] 일반 사용자 접근 시 404 확인 (비로그인 / parent / student 3케이스)
- [ ] `service_role` 사용 여부와 사용 위치를 본 문서에 명시
- [ ] middleware matcher에 `/admin/:path*` 포함 확인
- [ ] 운영 배포 후 실제 404 재확인

---

## 11. 단계별 구현 로드맵

### P1 (권한 체계 확정 — 화면 없음)

| 순서 | 작업 | 산출물 |
| --- | --- | --- |
| 0 | **§12-A 기존 role 무결성 확인** (RLS의 jwt claim 참조 여부) | 판정 결과 기록. 1건 이상이면 P0로 승격 |
| 1 | 본 설계 문서 작성 및 확정 | `docs/admin-access-control-design.md` |
| 2 | `admin_users` 스키마/RLS 확정 | 설계 확정 (본 문서 §4) |
| 3 | migration + RLS 작업지시서 작성 | 별도 작업지시서 |
| 4 | `requireAdmin()` / `requireOperator()` 설계 확정 | 별도 작업지시서 |
| 5 | PostHog ↔ Supabase id 매핑 기준 문서화 | `docs/analytics-identity-mapping.md` |
| 6 | `signup_completed` 재발화 가드 | 별도 작업지시서 |

### P2 (운영 화면 구현)

| 순서 | 작업 | 선행 조건 |
| --- | --- | --- |
| 1 | `/admin/users` (마스킹 적용 목록) | P1 전체 완료 |
| 2 | `/admin/retention` (이탈 후보) | `/admin/users` 완료 |
| 3 | `/admin/sync-careers` 복구 | §10 체크리스트 전체 충족 |
| 4 | CS 운영 메모 기능 | `/admin/users` 상세 완료 |
| 5 | B2B Lite 학원 단위 관리 | 파일럿 학원 1곳 확보 |
| 6 | 관리자 초대 UI / `admin_action_logs` / `super_admin` | 운영 인원 2명 이상 |

---

## 12-A. 별도 확인 필요 리스크 — 기존 parent/student role 무결성

본 설계(admin 권한)와는 별개로, 조사 과정에서 확인된 기존 구조의 리스크다. **관리자 화면 구현과 무관하게 판정이 필요하다.**

`user_metadata.role`은 사용자가 수정 가능하므로, 다음 3가지에 따라 실제 위험도가 결정된다.

| # | 확인 대상 | 결과에 따른 판정 |
| --- | --- | --- |
| 1 | RLS 정책 중 `auth.jwt() -> 'user_metadata' ->> 'role'` 또는 유사 claim을 참조하는 정책이 있는가 | **1건이라도 있으면 P0.** 실제 데이터 권한 상승 가능 |
| 2 | `src/middleware.ts`가 `/parent/*`·`/student/*` 보호에 무엇을 쓰는가 (세션 유무 / role 값) | role 값 기반이면 UI 우회 가능 (표시 문제) |
| 3 | parent/student 데이터 조회가 role claim이 아닌 `user_id` 조인으로 되어 있는가 | user_id 기반이면 실피해 제한적 → P1로 처리 가능 |

### 확인 명령

```bash
# RLS 정책에서 user_metadata / jwt claim 참조 여부
grep -rn "user_metadata\|auth.jwt\|raw_user_meta_data" supabase/migrations
grep -rn "matcher\|user_metadata\|role" src/middleware.ts
```

### 판정별 조치 (설계안, 이번 단계 구현 금지)

- **1번이 0건 + 3번이 user_id 기반** → 실피해 없음. role은 "UI 분기용 힌트"로만 취급한다는 원칙을 문서화하고 P1로 처리.
- **1번이 1건 이상** → P0. 해당 정책을 `user_id` 기반 또는 `app_metadata` 기반으로 즉시 전환.
- 공통 권고: 서버에서 role이 필요한 경우 `user_metadata`가 아니라 **`parent` / `student` 테이블에 해당 `user_id` 행이 존재하는지**로 판정한다. 이 방식은 사용자가 위조할 수 없다.

---

## 12. 미결정 사항 (대표 결정 필요)

| # | 항목 | 선택지 | 권고 |
| --- | --- | --- | --- |
| 1 | 일반 사용자 role 저장 위치 | `user_metadata` 현행 유지 / `app_metadata` 이전 / 테이블 존재 여부로 판정 | **§12-A 확인 결과에 따라 결정.** admin 권한은 어느 경우에도 `admin_users` 사용 |
| 2 | admin 권한 확인 결과 캐싱 | 요청마다 조회 / 요청 단위 캐시 | 요청 단위 캐시(React `cache`) 권장 |
| 3 | `admin_action_logs` 도입 시점 | P1 / P2 | P2. 단 sync-careers 복구 시에는 최소 실행 결과 기록 필수 |
| 4 | B2B 학원 원장 권한 축 | `admin_users`에 포함 / `organizations` 별도 | **별도.** 운영자 권한과 섞지 않음 |
| 5 | 운영자 2FA | 도입 / 미도입 | 운영 인원 2명 이상 시점에 재검토 |

---

## 13. 이번 작업 금지 범위 준수 확인

| 항목 | 상태 |
| --- | --- |
| 코드 수정 | 없음 |
| DB migration 생성 | 없음 |
| Supabase schema 변경 | 없음 |
| RLS 정책 변경 | 없음 |
| `admin_users` 테이블 생성 | 없음 (설계안만) |
| `requireAdmin()` 구현 | 없음 (시그니처 설계만) |
| middleware 수정 | 없음 |
| `/admin` 페이지 생성 | 없음 |
| `/admin/sync-careers` 복구 | 없음 (차단 유지) |
| `service_role` 신규 사용 | 없음 |
| 결제/요금제 코드 변경 | 없음 |
| 인증 정책 변경 | 없음 |
| PostHog 이벤트 코드 변경 | 없음 |
| 운영 데이터 수정 | 없음 |

---

## 14. 문서 이력

| 버전 | 일자 | 변경 |
| --- | --- | --- |
| v0.1 | 2026-07-24 | 최초 작성 (설계안) |
| v0.2 | 2026-07-24 | 저장소 조사 결과 반영. role 저장 위치가 `user_metadata`임을 확인하여 A안을 채택 불가로 격상. §12-A(기존 role 무결성 리스크) 신설. middleware 경로 `src/middleware.ts`로 정정 |
