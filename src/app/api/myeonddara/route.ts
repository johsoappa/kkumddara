// ====================================================
// POST /api/myeonddara
// 명따라 통합 API: 인증 + 사용량 차감 + Claude 분석
//
// [요청 Body]
//   childId   : string — 분석 대상 자녀 UUID
//   name      : string — 아이 이름
//   saju      : ManseryeokResult — 클라이언트 계산 결과
//   gender    : "남자" | "여자"
//   birthDate : string — "2014년 1월 17일 (양력)"
//   birthTime : string — "오시 (11~13시)" | "시주 미상"
//
// [응답 Body — 성공]
//   analysis : ClaudeAnalysis — Claude API 분석 결과
//   remaining: number — 남은 횟수
//
// [스키마 자동 감지]
//   migration 011 적용 여부 → child_id / parent_id 자동 분기
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import type { ManseryeokResult } from "@/lib/manseryeok";

const PER_CHILD_YEARLY_LIMIT = 3;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ── Claude 시스템 프롬프트 ────────────────────────────────────
const SYSTEM_PROMPT = `너는 명리학 전문 분석가이자 아이 진로 상담 전문가다.
입력된 사주 4柱와 오행 분포를 기반으로 아래 항목을 분석하라.

[분석 원칙]
- 사주를 단순 성격풀이가 아닌 타고난 기질, 강점, 잠재력 중심으로 해석하라
- 아이와 부모 모두 이해할 수 있는 쉬운 언어를 사용하라
- 희망고문 없이 현실적이고 구체적으로 설명하라
- 전문 용어는 처음 등장 시 반드시 쉬운 말로 풀어써라
- "이 아이는 ~한 성향이 있어요" 톤으로 따뜻하지만 정확하게

[반드시 JSON 형식으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력]

응답 JSON 구조:
{
  "dominantOhaeng": "수(水)",
  "ilganDescription": "壬(임)수는 큰 강물처럼...",
  "personalityTags": ["분석적 사고", "목표 지향", "창의력", "협력적"],
  "personalitySummary": "이 아이는 논리적으로...",
  "strengths": ["수(水)의 깊은 사고력", "목(木)의 창의성"],
  "weaknesses": ["감정 표현이 서툴 수 있음"],
  "careers": [
    { "rank": 1, "emoji": "💻", "name": "소프트웨어 엔지니어", "reason": "수(水)의 논리력과 목(木)의 창의력이 결합", "fitPercent": 92 },
    { "rank": 2, "emoji": "📊", "name": "데이터 분석가", "reason": "수(Water)의 분석력이 빛나는 직업", "fitPercent": 87 },
    { "rank": 3, "emoji": "🔬", "name": "연구원", "reason": "깊이 탐구하는 수(Water) 기질에 최적", "fitPercent": 83 }
  ],
  "fortuneMessage": "물처럼 유연하게, 바다처럼 깊게. 오늘은 새로운 것을 배우기 좋은 날이에요.",
  "parentMessage": "이 아이는 혼자만의 생각 시간이 필요한 아이예요. 조급하게 답을 요구하기보다 충분히 기다려주세요."
}`;

function errRes(msg: string, code: string, status: number) {
  return NextResponse.json({ error: msg, code, status }, { status });
}

export async function POST(req: NextRequest) {
  // ── 1. 요청 파싱 ──────────────────────────────────
  let body: {
    childId?:   string;
    name?:      string;
    saju?:      ManseryeokResult;
    gender?:    string;
    birthDate?: string;
    birthTime?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errRes("잘못된 요청 형식이에요.", "BAD_REQUEST", 400);
  }

  const { childId, name, saju, gender, birthDate, birthTime } = body;
  if (!childId || !name || !saju) {
    return errRes("필수 데이터가 없어요.", "BAD_REQUEST", 400);
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
  if (!plan || plan.plan_name === "free" || plan.myeonddara_yearly_limit === 0) {
    return errRes("명따라는 베이직 이상 플랜에서 이용할 수 있어요.", "PLAN_BLOCKED", 403);
  }

  // ── 7. 사용량 확인 (스키마 자동 감지) ────────────
  const currentYear = new Date().getFullYear();
  console.log("[api/myeonddara] parentId:", parentId, "childId:", childId, "year:", currentYear);

  const { data: usageByChild, error: childColErr } = await supabase
    .from("myeonddara_usage")
    .select("id, count")
    .eq("child_id", childId)
    .eq("used_year", currentYear)
    .maybeSingle();

  const hasChildIdCol = !childColErr || childColErr.code !== "42703";
  console.log("[api/myeonddara] 스키마 감지 — hasChildIdCol:", hasChildIdCol,
    childColErr ? `err=${childColErr.code}` : "");

  let usedCount     = 0;
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

  if (usedCount >= PER_CHILD_YEARLY_LIMIT) {
    return errRes(
      "이번 연도 명따라 분석 횟수를 모두 사용했어요. (연 3회)",
      "LIMIT_EXCEEDED", 429
    );
  }

  // ── 8. Claude API 호출 ────────────────────────────
  const { hourPillar, yearPillar, monthPillar, dayPillar, ohaeng, ilgan } = saju;

  const userMessage = `이름: ${name} (${gender ?? "성별 미상"})
생년월일: ${birthDate ?? ""} ${birthTime ?? ""}

사주 4柱:
年柱: ${yearPillar.ganHanja}${yearPillar.jiHanja} (${yearPillar.ganKr}${yearPillar.jiKr})
月柱: ${monthPillar.ganHanja}${monthPillar.jiHanja} (${monthPillar.ganKr}${monthPillar.jiKr})
日柱: ${dayPillar.ganHanja}${dayPillar.jiHanja} (${dayPillar.ganKr}${dayPillar.jiKr})
時柱: ${hourPillar ? `${hourPillar.ganHanja}${hourPillar.jiHanja} (${hourPillar.ganKr}${hourPillar.jiKr})` : "시주 미상 (모름 선택)"}

오행 분포:
목(木) ${ohaeng.wood}개 (${ohaeng.woodPercent}%)
화(火) ${ohaeng.fire}개 (${ohaeng.firePercent}%)
토(土) ${ohaeng.earth}개 (${ohaeng.earthPercent}%)
금(金) ${ohaeng.metal}개 (${ohaeng.metalPercent}%)
수(水) ${ohaeng.water}개 (${ohaeng.waterPercent}%)
일간: ${ilgan}

위 사주를 분석해서 규정된 JSON 형식으로 응답하라.`;

  console.log("[api/myeonddara] Claude 호출 — 사주:", saju.summary);

  let analysis: Record<string, unknown>;
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userMessage }],
    });

    const content = msg.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    let text = content.text.trim();
    // 마크다운 코드블록 제거
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    analysis = JSON.parse(text);
    console.log("[api/myeonddara] Claude 분석 완료 — dominantOhaeng:", analysis.dominantOhaeng);
  } catch (e) {
    console.error("[api/myeonddara] Claude API 실패:", e);
    return errRes("AI 분석 중 오류가 발생했어요. 다시 시도해 주세요.", "AI_ERROR", 502);
  }

  // ── 9. 사용량 차감 (select→update/insert 2단계) ───
  if (existingRowId) {
    const { error: updateErr } = await supabase
      .from("myeonddara_usage")
      .update({ count: usedCount + 1, updated_at: new Date().toISOString() })
      .eq("id", existingRowId);
    if (updateErr) {
      console.error("[api/myeonddara] UPDATE 실패:", updateErr.message, updateErr.code);
      return errRes("사용량 기록 실패. AI 분석은 완료됐어요.", "USAGE_ERR", 502);
    }
  } else {
    const payload = hasChildIdCol
      ? { parent_id: parentId, child_id: childId, used_year: currentYear, count: 1 }
      : { parent_id: parentId, used_year: currentYear, count: 1 };
    const { error: insertErr } = await supabase
      .from("myeonddara_usage")
      .insert(payload);
    if (insertErr) {
      console.error("[api/myeonddara] INSERT 실패:", insertErr.message, insertErr.code);
      return errRes("사용량 기록 실패. AI 분석은 완료됐어요.", "USAGE_ERR", 502);
    }
  }

  const remaining = PER_CHILD_YEARLY_LIMIT - (usedCount + 1);
  console.log("[api/myeonddara] 완료 — remaining:", remaining);

  return NextResponse.json({ analysis, remaining });
}
