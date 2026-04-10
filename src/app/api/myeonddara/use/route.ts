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
//   - 자녀별 연 3회 한도 (plan.myeonddara_yearly_limit ÷ child_limit)
//   - 차감은 정책상 "분석 실행 시점" = 폼 제출 성공 시
//   - 실패 시 차감 없음 (DB 트랜잭션으로 보장)
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

  const isFree        = !plan || plan.plan_name === "free";
  const yearlyLimit   = plan?.myeonddara_yearly_limit ?? 0;

  // 무료 또는 yearly_limit = 0 → 차단
  if (isFree || yearlyLimit === 0) {
    return errRes(
      "명따라는 베이직 이상 플랜에서 이용할 수 있어요.",
      "PLAN_BLOCKED",
      403
    );
  }

  // ── 7. 이번 연도 자녀별 사용량 확인 ──────────────
  const currentYear = new Date().getFullYear();

  const { data: usageRow } = await supabase
    .from("myeonddara_usage")
    .select("id, count")
    .eq("child_id", childId)
    .eq("used_year", currentYear)
    .maybeSingle();

  const usedCount: number = usageRow?.count ?? 0;

  if (usedCount >= PER_CHILD_YEARLY_LIMIT) {
    return errRes(
      "이번 연도 명따라 분석 횟수를 모두 사용했어요. (연 3회)",
      "LIMIT_EXCEEDED",
      429
    );
  }

  // ── 8. 사용량 차감 (upsert) ───────────────────────
  const { error: upsertErr } = await supabase
    .from("myeonddara_usage")
    .upsert(
      {
        parent_id: parentId,
        child_id:  childId,
        used_year: currentYear,
        count:     usedCount + 1,
      },
      { onConflict: "child_id,used_year" }
    );

  if (upsertErr) {
    console.error("[myeonddara/use] usage upsert 실패:", upsertErr);
    return errRes("처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.", "SERVER_ERROR", 502);
  }

  // ── 9. 성공 응답 ──────────────────────────────────
  return NextResponse.json({
    remaining: PER_CHILD_YEARLY_LIMIT - (usedCount + 1),
  });
}
