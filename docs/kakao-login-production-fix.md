# Production 카카오 로그인 홈 튕김 이슈 해결 기록

> 작성일: 2026-05-25  
> 검증 완료: PC + 모바일 실기 통과  
> 상태: **Production 배포 완료 · 이슈 종결**

---

## 1. 문제 증상

- 모바일에서 학부모로 시작하기 → 카카오로 시작하기 클릭 시 홈으로 튕김
- PC에서는 첫 클릭 시 홈으로 튕기고 두 번째 클릭 시 카카오 로그인 진행
- 이메일 로그인은 정상
- Phase 2 제한 베타는 정상

Vercel 로그에서 관찰된 비정상 흐름:

```
/auth/kakao/start 307
/                200   ← /auth/callback 없이 바로 루트로 복귀
/parent/home     200   ← 미들웨어가 기존 세션으로 분기
```

---

## 2. 원인 (복합)

| # | 원인 | 내용 |
|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` 오입력 | `https://https://kkumddara.k.kr` (double-https) → Supabase redirectTo 검증 실패 |
| 2 | client-side `signInWithOAuth` race condition | 버튼 클릭 → 비동기 실행 중 기존 세션 초기화 충돌 → 첫 클릭 실패 |
| 3 | `redirectTo`에 query 포함 | `/auth/callback?role=parent` → Supabase Redirect URL 등록값(`/auth/callback`)과 불일치 → Supabase가 `site_url`(루트 `/`)로 fallback |

---

## 3. 수정 내용

### 3-1. 서버 Route Handler 도입 (`src/app/auth/kakao/start/route.ts`)

client-side `signInWithOAuth` 호출을 서버 Route Handler로 이전.

| 항목 | 기존 | 변경 |
|---|---|---|
| 호출 위치 | 브라우저 (`page.tsx`) | 서버 Route Handler |
| 이동 방식 | async `signInWithOAuth` | `window.location.href = /auth/kakao/start?role=...` (전체 페이지 이동) |
| origin 결정 | `NEXT_PUBLIC_SITE_URL` (빌드 타임 임베딩) | `requestUrl.origin` (요청 기반, 런타임) |

### 3-2. redirectTo query 제거

| 항목 | 기존 | 변경 |
|---|---|---|
| redirectTo | `/auth/callback?role=parent` | `/auth/callback` (query 없음) |
| role 전달 | URL query | `oauth_role` 쿠키 (httpOnly, secure, maxAge 10분) |

### 3-3. `/auth/callback` role 결정 우선순위 변경 (`src/app/auth/callback/route.ts`)

```
1순위: URL query ?role=     (이메일 로그인 하위 호환)
2순위: oauth_role 쿠키      (카카오 OAuth 신규 방식)
3순위: user_metadata.role  (기존 계정 재로그인)
부재 시: /?error=role_required (조용한 fallback 금지)
```

oauth_role 쿠키는 callback 완료 후 즉시 삭제.

---

## 4. 최종 정상 흐름

```
꿈따라.kr
→ 학부모로 시작하기
→ 카카오로 시작하기 (window.location.href → /auth/kakao/start?role=parent)
→ 서버: requestUrl.origin 기준 redirectTo 생성, oauth_role 쿠키 세팅
→ Supabase OAuth URL로 307 redirect
→ accounts.kakao.com (카카오 인증 화면)
→ Kakao 계속하기
→ Supabase callback → /auth/callback
→ exchangeCodeForSession 성공
→ oauth_role 쿠키에서 role=parent 복원
→ /home → 미들웨어 → /parent/home
```

---

## 5. 검증 결과

| 항목 | 결과 |
|---|---|
| PC 카카오 로그인 (신규) | ✅ 통과 |
| PC 카카오 로그인 (재로그인) | ✅ 통과 |
| 모바일 카카오 로그인 | ✅ 통과 |
| 첫 클릭 정상 진입 | ✅ 통과 |
| /auth/callback 도달 | ✅ 통과 |
| finalRole = parent | ✅ 통과 |
| /parent/home 이동 | ✅ 통과 |
| 이메일 로그인 | ✅ 영향 없음 |
| Phase 2 제한 베타 | ✅ 영향 없음 |

---

## 6. 운영 환경 설정 기준

| 항목 | 값 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.xn--cw0bo6ho3b.kr` |
| Supabase Redirect URL | `https://www.xn--cw0bo6ho3b.kr/auth/callback` |
| Kakao Developers Redirect URI | `https://wqrfoxilcawscacppuel.supabase.co/auth/v1/callback` |

---

## 7. 주의사항

- **Kakao Developers** Redirect URI에는 꿈따라 `/auth/callback`이 아니라 **Supabase `/auth/v1/callback`** 을 등록한다.
- **Supabase** Redirect URLs에는 꿈따라 `/auth/callback`을 등록한다 (query 없는 순수 경로).
- 카카오 OAuth role 전달은 URL query가 아니라 **`oauth_role` 쿠키**를 사용한다.
- `NEXT_PUBLIC_SITE_URL`을 변경하면 빌드 재배포가 필요하다 (webpack DefinePlugin 임베딩).

---

## 8. 관련 커밋

| 커밋 | 내용 |
|---|---|
| `7d7b8d7` | 카카오 로그인 에러 핸들링 + kakaoLoading 상태 추가 |
| `54a45da` | `/auth/kakao/start` 서버 Route Handler 신규 생성 |
| `e790ed4` | OAuth URL 진단 로깅 추가 (§3-1~§3-3, debug=1) |
| `59e026d` | redirectTo query 제거, oauth_role 쿠키 전환 |
| `b2c78c1` | debug=1 제거, 진단 로그 정리 (운영 정리 완료) |

---

## 9. 관련 파일

```
src/app/auth/kakao/start/route.ts   — 카카오 OAuth 시작 서버 Handler
src/app/auth/callback/route.ts      — OAuth 콜백 세션 교환
src/app/page.tsx                    — 카카오 버튼 (window.location.href 방식)
src/lib/auth.ts                     — signInWithKakao (현재 미사용, 보존)
docs/ops/kakao-role-fix-checklist.md — role 교정 운영 체크리스트 (2026-04-21)
```
