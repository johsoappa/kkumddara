// ====================================================
// 관리자/운영자 서버 전용 권한 가드
//
// [권한 원천] public.admin_users 테이블 단일 원천 (058 migration)
//   - user_metadata / app_metadata의 role은 절대 참조하지 않는다.
//   - operator: 활성(is_active=true) admin_users 행이 있으면 통과
//   - admin   : 활성 admin_users 행이면서 role='admin'이어야 통과
//
// [무권한 처리] 비로그인 · 행 없음 · 비활성 · 역할 부족 → 전부 notFound() (404)
//   → 로그인 페이지 redirect 금지 (관리자 화면 존재 자체를 노출하지 않는다).
//
// [이번 GOAL(G1.9-A2) 범위]
//   - service role 클라이언트는 이 파일에서 생성·사용하지 않는다.
//   - /admin 화면·Route Handler는 이 GOAL에서 만들지 않는다.
//   - role/userId 외 개인정보는 반환·로그·노출하지 않는다 (console.log 없음).
//
// 참고: docs/admin-access-control-design.md §6
// ====================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export type AdminRole = "operator" | "admin";

export type AdminContext = {
  userId: string;
  role: AdminRole;
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "operator" || value === "admin";
}

// admin_users에서 현재 세션 사용자의 활성 권한 행을 조회한다.
// 조회 실패·미부여·비활성은 전부 null — 호출부가 notFound()로 통일 처리한다.
async function getAdminContext(): Promise<AdminContext | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) return null;
  if (row.is_active !== true) return null;
  if (!isAdminRole(row.role)) return null;

  return { userId: user.id, role: row.role };
}

/** operator 이상(operator 또는 admin) 활성 권한 필요. 미달 시 404. */
export async function requireOperator(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) notFound();
  return ctx;
}

/** admin 전용 — operator는 통과하지 못한다. 미달 시 404. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx || ctx.role !== "admin") notFound();
  return ctx;
}
