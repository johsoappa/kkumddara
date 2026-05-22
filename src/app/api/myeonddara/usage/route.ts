// ====================================================
// POST /api/myeonddara/usage
// 명따라 Phase 1 사용량 기록 API
//
// [목적]
//   Phase 1 (규칙 기반 리포트)은 OpenAI API를 호출하지 않으므로
//   기존 /api/myeonddara route.ts에서 사용량이 차감되지 않는다.
//   이 API는 Phase 1 완료 후 myeonddara_usage를 1 증가시키기 위한 전용 엔드포인트.
//
// [요청 Body]
//   childId : string — 분석 대상 자녀 UUID
//   action  : "consume" — 사용량 차감 액션 (검증용)
//
// [응답 Body — 성공]
//   ok        : true
//   usedCount : number — 차감 후 사용 횟수
//   remaining : number — 남은 횟수
//
// [응답 Body — 차단]
//   ok    : false
//   error : string
//   code  : "NO_REMAINING_USAGE"
//
// [절대 금지]
//   - OpenAI 호출 없음
//   - Phase 2 활성화 없음
//   - birth_date/birth_time 저장 없음
//   - 결과 리포트 DB 저장 없음
//   - RLS 변경 없음
//
// [스키마 자동 감지]
//   migration 011 적용 여부 → child_id / parent_id 자동 분기
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateUUID } from "@/lib/validation";

// 유료 플랜 자녀당 연 사용 한도 (free 1회와 구분)
const PER_CHILD_YEARLY_LIMIT = 3;

function errRes(msg: string, code: string, status: number) {
  return NextResponse.json({ ok: false, error: msg, code }, { status });
}

export async function POST(req: NextRequest) {
  // ── 1. 요청 파싱 ──────────────────────────────────
  let body: { childId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return errRes("잘못된 요청 형식이에요.", "BAD_REQUEST", 400);
  }

  const { childId, action } = body;
  if (action !== "consume") {
    return errRes("유효하지 않은 action이에요.", "BAD_REQUEST", 400);
  }

  const childIdResult = validateUUID(childId, "childId");
  if (!childIdResult.ok) {
    return errRes(childIdResult.error, "VALIDATION_ERROR", 400);
  }

  // ── 2. Supabase 클라이언트 ────────────────────────
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
  if (!plan || plan.myeonddara_yearly_limit === 0) {
    return errRes("명따라 이용 권한이 없어요.", "PLAN_BLOCKED", 403);
  }

  // effectiveYearlyLimit:
  //   free(=1) → 1 (베타 체험 1회)
  //   family(=6), family_plus(=9) → PER_CHILD_YEARLY_LIMIT(=3) (자녀당 3회 기준)
  //   basic/premium(=3) → PER_CHILD_YEARLY_LIMIT(=3)
  const effectiveYearlyLimit = plan.myeonddara_yearly_limit < PER_CHILD_YEARLY_LIMIT
    ? plan.myeonddara_yearly_limit   // free 등 특수 플랜: DB값 그대로 (=1)
    : PER_CHILD_YEARLY_LIMIT;        // 유료 표준: 자녀당 3회

  // ── 7. 사용량 확인 (스키마 자동 감지) ────────────
  const currentYear = new Date().getFullYear();
  console.log("[api/myeonddara/usage] parentId:", parentId, "childId:", childId, "year:", currentYear);

  const { data: usageByChild, error: childColErr } = await supabase
    .from("myeonddara_usage")
    .select("id, count")
    .eq("child_id", childId)
    .eq("used_year", currentYear)
    .maybeSingle();

  const hasChildIdCol = !childColErr || childColErr.code !== "42703";

  let usedCount = 0;
  let existingRowId: string | null = null;

  if (hasChildIdCol) {
    usedCount     = usageByChild?.count ?? 0;
    existingRowId = usageByChild?.id    ?? null;
  } else {
    const { data: usageByParent } = await supabase
      .from("myeonddara_usage")
      .select("id, count")
      .eq("parent_id", parentId)
      .eq("used_year", currentYear)
      .maybeSingle();
    usedCount     = usageByParent?.count ?? 0;
    existingRowId = usageByParent?.id    ?? null;
  }

  if (usedCount >= effectiveYearlyLimit) {
    console.log("[api/myeonddara/usage] 사용량 초과 — usedCount:", usedCount, "limit:", effectiveYearlyLimit);
    return errRes("이번 연도 명따라 체험 횟수를 모두 사용했어요.", "NO_REMAINING_USAGE", 429);
  }

  // ── 8. 사용량 증가 ────────────────────────────────
  if (existingRowId) {
    const { error: updateErr } = await supabase
      .from("myeonddara_usage")
      .update({ count: usedCount + 1, updated_at: new Date().toISOString() })
      .eq("id", existingRowId);
    if (updateErr) {
      console.error("[api/myeonddara/usage] UPDATE 실패:", updateErr.message, updateErr.code);
      return errRes("사용량 기록에 실패했어요.", "USAGE_ERR", 502);
    }
  } else {
    const payload = hasChildIdCol
      ? { parent_id: parentId, child_id: childId, used_year: currentYear, count: 1 }
      : { parent_id: parentId, used_year: currentYear, count: 1 };
    const { error: insertErr } = await supabase
      .from("myeonddara_usage")
      .insert(payload);
    if (insertErr) {
      console.error("[api/myeonddara/usage] INSERT 실패:", insertErr.message, insertErr.code);
      return errRes("사용량 기록에 실패했어요.", "USAGE_ERR", 502);
    }
  }

  const remaining = effectiveYearlyLimit - (usedCount + 1);
  console.log("[api/myeonddara/usage] 기록 완료 — childId:", childId, "remaining:", remaining);

  return NextResponse.json({ ok: true, usedCount: usedCount + 1, remaining });
}
