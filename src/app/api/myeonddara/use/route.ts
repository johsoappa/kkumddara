// ====================================================
// POST /api/myeonddara/use
// 명따라 사용 처리 (서버 차단 + 차감)
//
// [요청 Body]
//   childId: string — 분석 대상 자녀 UUID
//
// [응답 Body — 성공]
//   remaining: number — 이번 연도 남은 횟수
//
// [응답 Body — 에러]
//   error:  string
//   code:   string
//   status: number
//
// [정책]
//   - 인증 필수 (학부모만)
//   - child 소유권 검증
//   - 자녀별 연 3회 한도
//   - 차감: select → update / insert 명시적 2단계
//     (PostgREST upsert + partial index 불호환 문제 회피)
//   - 실패 시 차감 없음
//
// [스키마 버전 자동 감지]
//   - migration 011 적용 → child_id 컬럼 존재 → child 기준
//   - migration 011 미적용 → 42703 에러 → parent_id 기준 폴백
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── 자녀당 연간 명따라 횟수 고정값 ──
const PER_CHILD_YEARLY_LIMIT = 3;

function errRes(msg: string, code: string, status: number) {
  return NextResponse.json({ error: msg, code, status }, { status });
}

export async function POST(req: NextRequest) {
  // ── 1. 요청 파싱 ──────────────────────────────────
  let body: { childId?: string };
  try {
    body = await req.json();
  } catch {
    return errRes("잘못된 요청 형식이에요.", "BAD_REQUEST", 400);
  }

  const { childId } = body;
  if (!childId || typeof childId !== "string") {
    return errRes("자녀 정보가 필요해요.", "BAD_REQUEST", 400);
  }

  // ── 2. Supabase 서버 클라이언트 ───────────────────
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 3. 인증 확인 ──────────────────────────────────
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return errRes("로그인이 필요해요.", "AUTH_REQUIRED", 401);
  }

  if (user.user_metadata?.role !== "parent") {
    return errRes("명따라는 학부모 계정에서만 이용할 수 있어요.", "PARENT_ONLY", 403);
  }

  // ── 4. parent_id 조회 ─────────────────────────────
  const { data: parentRow } = await supabase
    .from("parent")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!parentRow) {
    return errRes("학부모 정보를 찾을 수 없어요.", "AUTH_REQUIRED", 401);
  }
  const parentId = parentRow.id as string;

  // ── 5. 자녀 소유권 확인 ───────────────────────────
  const { data: childRow } = await supabase
    .from("child")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .eq("profile_status", "active")
    .maybeSingle();

  if (!childRow) {
    return errRes("자녀 프로필을 찾을 수 없어요.", "CHILD_NOT_FOUND", 404);
  }

  // ── 6. 플랜 확인 ──────────────────────────────────
  const { data: plan } = await supabase
    .from("subscription_plan")
    .select("myeonddara_yearly_limit, plan_name")
    .eq("parent_id", parentId)
    .maybeSingle();

  const isFree      = !plan || plan.plan_name === "free";
  const yearlyLimit = plan?.myeonddara_yearly_limit ?? 0;

  if (isFree || yearlyLimit === 0) {
    return errRes(
      "명따라는 베이직 이상 플랜에서 이용할 수 있어요.",
      "PLAN_BLOCKED",
      403
    );
  }

  // ── 7. 이번 연도 사용량 확인 (스키마 자동 감지) ──
  // migration 011 적용 여부 판단: child_id 컬럼 존재 확인
  // PostgreSQL error code 42703 = "column does not exist"
  const currentYear = new Date().getFullYear();
  console.log("[myeonddara/use] 요청 — parentId:", parentId, "childId:", childId, "year:", currentYear);

  const { data: usageByChild, error: childColErr } = await supabase
    .from("myeonddara_usage")
    .select("id, count")
    .eq("child_id", childId)
    .eq("used_year", currentYear)
    .maybeSingle();

  // child_id 컬럼 존재 여부 판단
  const hasChildIdCol = !childColErr || childColErr.code !== "42703";

  console.log("[myeonddara/use] 스키마 감지 — hasChildIdCol:", hasChildIdCol,
    "childColErr:", childColErr ? `${childColErr.code} / ${childColErr.message}` : "없음");

  let usedCount = 0;
  let existingRowId: string | null = null;

  if (hasChildIdCol) {
    // ── v2 스키마 (migration 011 적용) — child 기준 ──
    usedCount     = usageByChild?.count   ?? 0;
    existingRowId = usageByChild?.id      ?? null;
    console.log("[myeonddara/use] v2 (child_id) — usedCount:", usedCount, "rowId:", existingRowId);
  } else {
    // ── v1 스키마 (migration 011 미적용) — parent_id 폴백 ──
    console.log("[myeonddara/use] v1 폴백 (parent_id) — migration 011 미적용");
    const { data: usageByParent, error: parentUsageErr } = await supabase
      .from("myeonddara_usage")
      .select("id, count")
      .eq("parent_id", parentId)
      .eq("used_year", currentYear)
      .maybeSingle();
    if (parentUsageErr) {
      console.error("[myeonddara/use] parent 사용량 조회 실패:", parentUsageErr);
    }
    usedCount     = usageByParent?.count ?? 0;
    existingRowId = usageByParent?.id    ?? null;
    console.log("[myeonddara/use] v1 parent 기준 — usedCount:", usedCount, "rowId:", existingRowId);
  }

  // ── 8. 한도 초과 확인 ─────────────────────────────
  if (usedCount >= PER_CHILD_YEARLY_LIMIT) {
    return errRes(
      "이번 연도 명따라 분석 횟수를 모두 사용했어요. (연 3회)",
      "LIMIT_EXCEEDED",
      429
    );
  }

  // ── 9. 사용량 차감 — select → update / insert 2단계 ──
  // 이유: PostgREST upsert + partial unique index 불호환
  //       (partial index는 onConflict 타겟으로 인식 안 됨)
  if (existingRowId) {
    // ── 9a. 기존 행 업데이트 ──────────────────────────
    console.log("[myeonddara/use] UPDATE 시도 — id:", existingRowId, "→ count:", usedCount + 1);

    const { error: updateErr } = await supabase
      .from("myeonddara_usage")
      .update({ count: usedCount + 1, updated_at: new Date().toISOString() })
      .eq("id", existingRowId);

    if (updateErr) {
      console.error("[myeonddara/use] UPDATE 실패 —",
        "message:", updateErr.message,
        "code:", updateErr.code,
        "details:", updateErr.details,
        "hint:", updateErr.hint
      );
      return errRes(
        "사용량 기록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        "SERVER_ERROR",
        502
      );
    }

    console.log("[myeonddara/use] UPDATE 성공");
  } else {
    // ── 9b. 신규 행 삽입 ──────────────────────────────
    const insertPayload = hasChildIdCol
      ? { parent_id: parentId, child_id: childId, used_year: currentYear, count: 1 }
      : { parent_id: parentId, used_year: currentYear, count: 1 };

    console.log("[myeonddara/use] INSERT 시도 — payload:", JSON.stringify(insertPayload));

    const { error: insertErr } = await supabase
      .from("myeonddara_usage")
      .insert(insertPayload);

    if (insertErr) {
      console.error("[myeonddara/use] INSERT 실패 —",
        "message:", insertErr.message,
        "code:", insertErr.code,
        "details:", insertErr.details,
        "hint:", insertErr.hint
      );
      return errRes(
        "사용량 기록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        "SERVER_ERROR",
        502
      );
    }

    console.log("[myeonddara/use] INSERT 성공");
  }

  const remaining = PER_CHILD_YEARLY_LIMIT - (usedCount + 1);
  console.log("[myeonddara/use] 완료 — remaining:", remaining);

  // ── 10. 성공 응답 ─────────────────────────────────
  return NextResponse.json({ remaining });
}
