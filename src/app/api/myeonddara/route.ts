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
//   analysis : MyeonddaraPhase2Result — Claude API 분석 결과
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
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { validateName, validateUUID, validateGender } from "@/lib/validation";

// TODO(Phase2 활성화 전): subscription_plan.myeonddara_yearly_limit DB값을 실제 한도 계산에 사용하도록 변경 필요.
// 현재는 free=0 차단(gate)에만 DB값 사용. 실제 횟수는 child당 3회 고정.
// DB 기준: free=0, basic=3, premium=9, family=6, family_plus=9 → 플랜별 per-child limit 산식 확정 후 보정.
// docs/myeonddara-beta-design.md §8 참고.
const PER_CHILD_YEARLY_LIMIT = 3;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ── Claude 시스템 프롬프트 ────────────────────────────────────
const SYSTEM_PROMPT = `너는 명리학 기반 아이 기질 분석 전문가다.
입력된 사주 4柱와 오행 분포를 기반으로 아이의 타고난 기질과 성향을 분석하라.

[분석 원칙]
- 사주를 단순 성격풀이가 아닌 타고난 기질, 강점, 잠재력 중심으로 해석하라
- 아이와 부모 모두 이해할 수 있는 쉬운 언어를 사용하라
- "이 아이는 ~한 성향이 있어요" 톤으로 따뜻하지만 구체적으로
- 전문 용어는 처음 등장 시 반드시 쉬운 말로 풀어써라

[절대 금지 사항 — 반드시 준수하라]
- 직업명을 추천하거나 열거하지 말 것 (예: "의사", "엔지니어", "예술가" 등 직업 이름 사용 금지)
- 적합도 퍼센트(fitPercent), 순위(rank) 형식 사용 금지
- "운세", "점술", "오늘의 운" 등 예언·점술성 표현 금지
- 아이의 미래를 단정 짓는 표현 금지

[interestAreas 작성 지침]
- title은 활동/관심 분야명으로 작성 (예: "탐구하고 만들기", "이야기·표현 활동", "도움과 돌봄")
- 특정 직업명이 아닌 활동·경험 영역으로 서술할 것
- activities는 실제로 집에서 또는 학교에서 해볼 수 있는 구체적 활동 2가지
- conversationQuestion은 부모가 아이에게 자연스럽게 건넬 수 있는 대화 질문 1개

[반드시 JSON 형식으로만 응답하라. 마크다운 코드블록 없이 순수 JSON만 출력]

응답 JSON 구조:
{
  "summary": "이 아이는 깊이 생각하고 차분히 관찰하는 성향이 있어요. 혼자만의 시간에 아이디어를 키워가는 타입이에요.",
  "strengthKeywords": ["깊은 관찰력", "차분한 집중력", "창의적 상상력"],
  "balancePoints": ["감정을 표현하는 연습이 도움이 돼요", "새로운 사람과 함께하는 경험을 늘려보세요"],
  "interestAreas": [
    {
      "title": "탐구하고 만들기",
      "reason": "수(水)의 깊은 사고력이 사물의 원리를 파고드는 활동과 잘 맞아요.",
      "activities": ["집에서 간단한 실험 키트 해보기", "블록이나 레고로 자유롭게 구조물 만들기"],
      "conversationQuestion": "오늘 뭔가 궁금했던 게 있었어? 왜 그렇게 생각했어?"
    },
    {
      "title": "글·그림으로 표현하기",
      "reason": "목(木)의 창의성이 자신만의 이야기를 만들어내는 활동에서 빛날 수 있어요.",
      "activities": ["하루 일기나 짧은 글쓰기", "자유 주제로 그림 그리기"],
      "conversationQuestion": "오늘 있었던 일 중에 기억에 남는 게 뭐야?"
    },
    {
      "title": "조용한 관찰과 기록",
      "reason": "차분하고 섬세한 기질이 주변을 꼼꼼히 살피는 활동에 잘 맞아요.",
      "activities": ["자연 관찰 일지 써보기", "좋아하는 것들 모아 스크랩북 만들기"],
      "conversationQuestion": "요즘 특별히 관심 가는 게 생겼어?"
    }
  ],
  "todayHint": "오늘은 아이가 스스로 무언가를 선택하게 해보세요. 작은 선택도 아이에게 큰 자신감이 돼요.",
  "parentQuestions": [
    "요즘 혼자 있을 때 주로 뭘 해?",
    "학교에서 제일 재밌었던 순간이 언제야?",
    "어떤 걸 배우고 싶어?"
  ],
  "recommendedActivities": ["주말에 함께 도서관 가서 관심 있는 책 고르기", "아이가 직접 저녁 메뉴 정해보기"],
  "disclaimer": "이 분석은 만세력 기반 참고 자료입니다. 아이의 실제 성향은 다양한 경험을 통해 발견해 주세요."
}`;

function errRes(msg: string, code: string, status: number) {
  return NextResponse.json({ error: msg, code, status }, { status });
}

export async function POST(req: NextRequest) {
  // ── 0. Rate Limiting (3회/분 per IP) ──────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`myeonddara:${ip}`, 3, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAfterMs);

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

  // ── 입력값 서버 검증 ──────────────────────────────
  const childIdResult = validateUUID(childId, "childId");
  if (!childIdResult.ok) {
    return errRes(childIdResult.error, "VALIDATION_ERROR", 400);
  }

  const nameResult = validateName(name);
  if (!nameResult.ok) {
    return errRes(nameResult.error, "VALIDATION_ERROR", 400);
  }

  const genderResult = validateGender(gender);
  if (!genderResult.ok) {
    return errRes(genderResult.error, "VALIDATION_ERROR", 400);
  }

  if (!saju) {
    return errRes("사주 데이터가 없어요.", "BAD_REQUEST", 400);
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

  const userMessage = `이름: ${nameResult.value} (${genderResult.value})
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

  // ── 8. Claude API 호출 ────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[api/myeonddara] ① API 호출 시작 — 사주:", saju.summary);
  console.log("[api/myeonddara]   모델:", CLAUDE_MODEL);
  console.log("[api/myeonddara]   API Key 존재:", !!apiKey, apiKey ? `(${apiKey.slice(0,8)}...)` : "(없음)");

  let analysis: Record<string, unknown>;
  try {
    const anthropic = new Anthropic({ apiKey });

    console.log("[api/myeonddara] ② Anthropic messages.create 요청 직전");
    const msg = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userMessage }],
    });

    console.log("[api/myeonddara] ③ Anthropic 응답 수신 — stop_reason:", msg.stop_reason);
    const content = msg.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type: " + content.type);

    let text = content.text.trim();
    console.log("[api/myeonddara] ④ raw 응답 앞 200자:", text.slice(0, 200));

    // 마크다운 코드블록 제거
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    console.log("[api/myeonddara] ⑤ JSON.parse 시도");
    analysis = JSON.parse(text);
    console.log("[api/myeonddara] ⑥ JSON 파싱 성공 — summary:", (analysis.summary as string)?.slice(0, 30));

  } catch (e: unknown) {
    // Anthropic 크레딧 부족 감지
    const err = e as { status?: number; error?: { type?: string; message?: string }; message?: string };
    const errMsg  = err?.error?.message ?? err?.message ?? "";
    const errType = err?.error?.type ?? "";

    console.error("[api/myeonddara] ❌ Claude API 실패");
    console.error("[api/myeonddara]   status:", err?.status);
    console.error("[api/myeonddara]   type:", errType);
    console.error("[api/myeonddara]   message:", errMsg);

    // 크레딧/결제 관련 에러 → 프론트에서 Phase 1 fallback 처리
    const isBilling =
      (err?.status === 400 && errMsg.toLowerCase().includes("credit")) ||
      errMsg.toLowerCase().includes("credit balance") ||
      errMsg.toLowerCase().includes("billing");

    if (isBilling) {
      console.warn("[api/myeonddara] ⚠️ Anthropic 크레딧 부족 — BILLING_REQUIRED 반환");
      return errRes(
        "AI 분석 크레딧이 부족합니다. 현재는 기본 만세력 결과만 제공됩니다.",
        "BILLING_REQUIRED",
        402
      );
    }

    // JSON 파싱 실패
    if (e instanceof SyntaxError) {
      console.error("[api/myeonddara] ❌ JSON 파싱 실패:", e.message);
      return errRes("AI 응답 파싱에 실패했어요. 다시 시도해 주세요.", "PARSE_ERROR", 502);
    }

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
  console.log("[api/myeonddara] ⑦ 사용량 차감 완료 — remaining:", remaining);
  console.log("[api/myeonddara] ⑧ sessionStorage 저장 payload 키: myeonddara_result");
  console.log("[api/myeonddara] ⑨ 최종 응답 반환");

  return NextResponse.json({ analysis, remaining });
}
