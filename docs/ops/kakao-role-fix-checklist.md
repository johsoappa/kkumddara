# 카카오 로그인 Role 교정 운영 체크리스트

> 작성일: 2026-04-21  
> 대상: 학부모 카카오 로그인 → /student/home 오분기 이슈 수정 후 운영 검증

---

## 1. 이슈 배경

`/auth/callback` 의 `existingRole || role` 패턴으로 인해, 카카오 계정에
`role = "student"` 가 잘못 저장된 경우 재로그인 시에도 student home 으로 오분기됐다.

수정 후 동작:
- `requestedRole(URL param)` 우선 → `existingRole` 은 fallback
- `requestedRole ≠ existingRole` → `/?error=role_mismatch` 에러 페이지 (명시적 차단)

---

## 2. 잘못 저장된 카카오 계정 Role 교정 방법

### 2-A. Supabase Dashboard 에서 직접 수정 (권장)

1. [Supabase Dashboard](https://app.supabase.com) → 프로젝트 선택
2. `Authentication` → `Users` 탭
3. 해당 카카오 계정 검색 (이메일 없으면 Provider = `kakao` 로 필터)
4. 사용자 클릭 → `Raw User Meta Data` 확인
5. 현재 값 예시:
   ```json
   { "role": "student", "sub": "...", "name": "홍길동" }
   ```
6. `Edit` 클릭 → `role` 값을 `"parent"` 로 변경 → `Save`

> ⚠️ 주의: `raw_user_meta_data` 를 직접 수정하면 JWT 가 즉시 갱신되지 않음.
> 사용자가 다시 로그인(세션 재발급)해야 새 role 이 반영됨.

### 2-B. SQL Editor 에서 일괄 수정

```sql
-- 특정 user_id 의 role 확인
SELECT id, email, raw_user_meta_data->>'role' AS role
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL
  AND raw_app_meta_data->>'provider' = 'kakao'
ORDER BY created_at DESC;

-- role 교정 (user_id 를 정확히 확인 후 실행)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"parent"')
WHERE id = '<user_id_here>';

-- parent row 없으면 생성 (email 없는 카카오 계정 대응)
INSERT INTO public.parent (user_id, display_name)
VALUES ('<user_id_here>', '<카카오_닉네임>')
ON CONFLICT (user_id) DO NOTHING;

-- subscription_plan 없으면 생성
INSERT INTO public.subscription_plan (parent_id, plan_name, child_limit)
SELECT id, 'basic', 1 FROM public.parent WHERE user_id = '<user_id_here>'
ON CONFLICT DO NOTHING;
```

> ⚠️ `auth.users` 는 Supabase 시스템 테이블. SQL Editor 에서 직접 수정 가능하나
> 반드시 user_id 를 정확히 확인 후 실행할 것.

---

## 3. 신규 로그인 재검증 순서

수정 배포 후 아래 순서로 검증한다.

### STEP 1 — 신규 학부모 카카오 가입 (최우선)

**목적**: 첫 번째 Kakao 로그인에서 role=parent 가 정상 저장되는지 확인

1. 시크릿 창 오픈
2. 랜딩 → "학부모로 시작하기" 클릭
3. "카카오로 시작하기" 클릭
4. 카카오 인증 완료
5. ✅ `/onboarding/parent` 또는 `/parent/home` 진입 확인
6. Supabase Dashboard → Users → 해당 계정 `raw_user_meta_data.role = "parent"` 확인

**실패 시**: 콜백 URL의 `?role=parent` 파라미터가 OAuth 체인에서 소실된 경우.
`Supabase Dashboard → Authentication → URL Configuration → Redirect URLs` 에
`https://<your-domain>/auth/callback*` 또는 `https://<your-domain>/**` 가 등록되어 있는지 확인.

---

### STEP 2 — 기존 학부모 카카오 재로그인

**목적**: `existingRole = "parent"` 인 기존 계정이 정상 재로그인되는지 확인

1. 시크릿 창 오픈
2. 랜딩 → "학부모로 시작하기" 클릭
3. "카카오로 시작하기" 클릭
4. 카카오 인증 (STEP 1 에서 생성한 계정 사용)
5. ✅ `/parent/home` 직행 확인 (온보딩 완료 상태 기준)
6. 서버 로그에 `[auth/callback] role 불일치` 없음 확인

---

### STEP 3 — 학생 이메일 로그인

**목적**: 미들웨어 수정이 student 계정에 영향을 주지 않는지 확인

1. 시크릿 창 오픈
2. 랜딩 → "학생으로 시작하기" 클릭 → 이메일 로그인
3. ✅ `/student/home` 또는 `/onboarding/student` 진입 확인
4. `/parent/*` 경로 직접 접근 시 `/` 리다이렉트 확인

---

### STEP 4 — role_mismatch 에러 배너 확인

**목적**: role 불일치 시 사용자에게 에러 배너가 보이는지 확인

1. 브라우저 주소창에 직접 입력: `/?error=role_mismatch`
2. ✅ 랜딩 화면에 빨간 에러 배너 표시 확인
   - 제목: "계정 역할이 일치하지 않아요"
   - 본문: 운영팀 문의 안내
3. 역할 선택 카드는 정상 표시 확인 (배너와 충돌 없음)

---

### STEP 5 — role_required 에러 배너 확인

1. 브라우저 주소창에 직접 입력: `/?error=role_required`
2. ✅ 랜딩 화면에 빨간 에러 배너 표시 확인
   - 제목: "역할 정보를 확인할 수 없어요"
   - 본문: 역할 재선택 안내

---

## 4. 서버 로그 모니터링 포인트

배포 후 Vercel 또는 서버 로그에서 아래 키워드를 검색해 이상 징후를 파악한다.

| 로그 키워드 | 의미 | 조치 |
|---|---|---|
| `[auth/callback] role 결정 실패` | requestedRole·existingRole 모두 없음 | redirectTo 파라미터 누락 의심 → STEP 1 재검증 |
| `[auth/callback] role 불일치` | 기존 student role 카카오 계정이 parent로 로그인 시도 | 2-A 또는 2-B 로 해당 계정 role 교정 |
| `[auth/callback] updateUser 실패` | Supabase auth 업데이트 오류 | Supabase 서비스 상태 확인 |
| `[middleware] /home — role 미설정` | 세션은 있으나 metadata.role 없음 | 해당 계정 Supabase Dashboard 에서 role 확인 |

---

## 5. 롤백 기준

아래 상황 중 하나라도 발생하면 이전 커밋(`0e2a1c1`)으로 롤백 후 분석한다.

- [ ] 신규 학부모 카카오 가입이 전원 실패하는 경우
- [ ] 기존 parent 계정이 `role_mismatch` 에러를 받는 경우
- [ ] 학생 이메일 로그인이 깨지는 경우

---

*최종 확인자: OZ.대표*
