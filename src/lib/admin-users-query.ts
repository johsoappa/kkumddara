// ====================================================
// /admin/users — service role 단일 진입점 (서버 전용)
//
// [역할] 관리자 사용자 목록을 service role로 읽기 전용 조회하고,
//        서버에서 마스킹을 완료한 DTO만 반환한다.
//
// [규칙]
//   - 이 파일이 service role을 사용하는 유일한 앱 런타임 파일이다.
//   - service role 클라이언트는 getAdminUsersPage() 내부에서만 생성한다.
//   - 호출부는 반드시 requireOperator() 통과 후에만 getAdminUsersPage()를 부른다.
//   - 반환 DTO에는 원문 email, UUID, 자녀/결제 원본 정보를 포함하지 않는다.
//
// 참고: docs/admin-access-control-design.md §8·§9
// ====================================================

import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { AdminContext } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

const ONBOARDING_LABEL_PARENT: Record<string, string> = {
  pending: "가입 진행중",
  child_creation: "자녀 등록 중",
  completed: "온보딩 완료",
};

const ONBOARDING_LABEL_STUDENT: Record<string, string> = {
  pending: "가입 진행중",
  child_linking: "자녀 연결 중",
  completed: "온보딩 완료",
};

const PLAN_NAME_LABEL: Record<string, string> = {
  free: "무료",
  basic: "베이직",
  family: "패밀리",
  premium: "프리미엄",
  family_plus: "패밀리+",
};

export type AdminUserRow = {
  maskedEmail: string;
  accountRole: "학부모" | "학생" | "설정 전";
  onboardingStatusLabel: string;
  joinedMonth: string;
  childConnectionLabel: string;
  planName: string;
};

export type AdminUsersPageResult = {
  items: AdminUserRow[];
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  summary: {
    parentCount: number;
    studentCount: number;
    unsetCount: number;
  };
};

// 목록 조회 실패 시 어느 단계에서 실패했는지만 내부적으로 구분한다.
// Supabase 원본 오류·응답 body는 이 식별자에 담지 않는다 (UI/console/로그 어디에도 노출 금지).
export type AdminUsersFailureStage =
  | "auth_users"
  | "parents"
  | "students"
  | "children"
  | "plans"
  | "unexpected";

// HTTP 상태를 안전하게 분류한다. 원문 오류 메시지·응답 body는 담지 않는다.
export type AdminUsersHttpStatusClass = "401" | "403" | "429" | "5xx" | "other" | "unknown";

function classifyHttpStatus(status: number | null | undefined): AdminUsersHttpStatusClass {
  if (typeof status !== "number") return "unknown";
  if (status === 401) return "401";
  if (status === 403) return "403";
  if (status === 429) return "429";
  if (status >= 500) return "5xx";
  return "other";
}

export class AdminUsersQueryError extends Error {
  readonly stage: AdminUsersFailureStage;
  readonly httpStatus?: AdminUsersHttpStatusClass;

  constructor(message: string, stage: AdminUsersFailureStage, httpStatus?: AdminUsersHttpStatusClass) {
    super(message);
    this.name = "AdminUsersQueryError";
    this.stage = stage;
    this.httpStatus = httpStatus;
  }
}

const GENERIC_FAILURE_MESSAGE = "사용자 목록을 불러오지 못했습니다.";

function isValidAdminContext(ctx: AdminContext): boolean {
  return (
    !!ctx &&
    typeof ctx.userId === "string" &&
    ctx.userId.length > 0 &&
    (ctx.role === "operator" || ctx.role === "admin")
  );
}

function normalizePage(rawPage: number): number {
  if (!Number.isInteger(rawPage) || rawPage < 1) return 1;
  return rawPage;
}

function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "이메일 없음";
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return "이메일 없음";
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  if (!domain) return "이메일 없음";
  const prefix = local.length >= 2 ? local.slice(0, 2) : local;
  return `${prefix}***@${domain}`;
}

function formatJoinedMonth(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/**
 * 활성 operator/admin 컨텍스트가 있을 때만 호출한다.
 * service role 클라이언트는 이 함수 내부에서만 생성한다.
 */
export async function getAdminUsersPage(
  ctx: AdminContext,
  rawPage: number
): Promise<AdminUsersPageResult> {
  if (!isValidAdminContext(ctx)) {
    throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "unexpected");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "unexpected");
  }

  const page = normalizePage(rawPage);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let users: { id: string; email?: string; created_at: string }[];
  let hasNextPage: boolean;

  try {
    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (listError) {
      throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "auth_users", classifyHttpStatus(listError.status));
    }
    users = listData.users;
    hasNextPage = listData.nextPage !== null;
  } catch (e) {
    if (e instanceof AdminUsersQueryError) throw e;
    throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "auth_users", "unknown");
  }

  const userIds = users.map((u) => u.id);

  let parentRows: { id: string; user_id: string; onboarding_status: string }[] = [];
  let studentRows: { user_id: string; child_id: string | null; onboarding_status: string }[] = [];

  if (userIds.length > 0) {
    try {
      const parentResult = await adminClient
        .from("parent")
        .select("id, user_id, onboarding_status")
        .in("user_id", userIds);
      if (parentResult.error) {
        throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "parents");
      }
      parentRows = parentResult.data ?? [];
    } catch (e) {
      if (e instanceof AdminUsersQueryError) throw e;
      throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "parents");
    }

    try {
      const studentResult = await adminClient
        .from("student")
        .select("user_id, child_id, onboarding_status")
        .in("user_id", userIds);
      if (studentResult.error) {
        throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "students");
      }
      studentRows = studentResult.data ?? [];
    } catch (e) {
      if (e instanceof AdminUsersQueryError) throw e;
      throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "students");
    }
  }

  const parentIds = parentRows.map((p) => p.id);
  const childCountMap = new Map<string, number>();
  const planMap = new Map<string, string>();

  if (parentIds.length > 0) {
    try {
      const childResult = await adminClient
        .from("child")
        .select("parent_id")
        .in("parent_id", parentIds);
      if (childResult.error) {
        throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "children");
      }
      for (const row of childResult.data ?? []) {
        childCountMap.set(row.parent_id, (childCountMap.get(row.parent_id) ?? 0) + 1);
      }
    } catch (e) {
      if (e instanceof AdminUsersQueryError) throw e;
      throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "children");
    }

    try {
      const planResult = await adminClient
        .from("subscription_plan")
        .select("parent_id, plan_name")
        .in("parent_id", parentIds);
      if (planResult.error) {
        throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "plans");
      }
      for (const row of planResult.data ?? []) {
        planMap.set(row.parent_id, row.plan_name);
      }
    } catch (e) {
      if (e instanceof AdminUsersQueryError) throw e;
      throw new AdminUsersQueryError(GENERIC_FAILURE_MESSAGE, "plans");
    }
  }

  const parentByUserId = new Map(parentRows.map((p) => [p.user_id, p]));
  const studentByUserId = new Map(studentRows.map((s) => [s.user_id, s]));

  let parentCount = 0;
  let studentCount = 0;
  let unsetCount = 0;

  const items: AdminUserRow[] = users.map((u) => {
    const parentRow = parentByUserId.get(u.id);
    const studentRow = studentByUserId.get(u.id);

    if (parentRow) {
      parentCount++;
      const childCount = childCountMap.get(parentRow.id) ?? 0;
      const planNameRaw = planMap.get(parentRow.id);
      return {
        maskedEmail: maskEmail(u.email),
        accountRole: "학부모",
        onboardingStatusLabel:
          ONBOARDING_LABEL_PARENT[parentRow.onboarding_status] ?? "확인 필요",
        joinedMonth: formatJoinedMonth(u.created_at),
        childConnectionLabel: childCount > 0 ? `${childCount}명 연결` : "연결 없음",
        planName: planNameRaw ? PLAN_NAME_LABEL[planNameRaw] ?? "확인 필요" : "-",
      };
    }

    if (studentRow) {
      studentCount++;
      return {
        maskedEmail: maskEmail(u.email),
        accountRole: "학생",
        onboardingStatusLabel:
          ONBOARDING_LABEL_STUDENT[studentRow.onboarding_status] ?? "확인 필요",
        joinedMonth: formatJoinedMonth(u.created_at),
        childConnectionLabel: studentRow.child_id ? "연결됨" : "연결 안됨",
        planName: "-",
      };
    }

    unsetCount++;
    return {
      maskedEmail: maskEmail(u.email),
      accountRole: "설정 전",
      onboardingStatusLabel: "역할 설정 전",
      joinedMonth: formatJoinedMonth(u.created_at),
      childConnectionLabel: "-",
      planName: "-",
    };
  });

  return {
    items,
    page,
    hasPrev: page > 1,
    hasNext: hasNextPage,
    summary: { parentCount, studentCount, unsetCount },
  };
}
