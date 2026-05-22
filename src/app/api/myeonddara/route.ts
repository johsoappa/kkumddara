// ====================================================
// POST /api/myeonddara
// 명따라 통합 API: 인증 + 사용량 차감 + OpenAI 분석
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
//   analysis : MyeonddaraPhase2Result — OpenAI API 분석 결과
//   remaining: number — 남은 횟수
//
// [스키마 자동 감지]
//   migration 011 적용 여부 → child_id / parent_id 자동 분기
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ManseryeokResult } from "@/lib/manseryeok";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { validateName, validateUUID, validateGender } from "@/lib/validation";

// ── Vercel 함수 최대 실행 시간 (Hobby: 10s 캡, Pro: 최대 300s)
// OpenAI 응답 대기를 위해 30s 확보. Hobby는 10s에서 자동 캡.
export const maxDuration = 30;

// TODO(Phase2 활성화 전): subscription_plan.myeonddara_yearly_limit DB값을 실제 한도 계산에 사용하도록 변경 필요.
// 현재는 free=0 차단(gate)에만 DB값 사용. 실제 횟수는 child당 3회 고정.
// DB 기준: free=0, basic=3, premium=9, family=6, family_plus=9 → 플랜별 per-child limit 산식 확정 후 보정.
// docs/myeonddara-beta-design.md §8 참고.
const PER_CHILD_YEARLY_LIMIT = 3;

// ── OpenAI 모델 (ai-consult와 동일 provider) ──────────────────
const OPENAI_MODEL = "gpt-4o-mini";

// ── OpenAI API 응답 timeout (ms) ──────────────────────────────
// 20초 초과 시 AI_TIMEOUT 반환, 사용량 차감 없음
const AI_TIMEOUT_MS = 20_000;

// ── OpenAI 시스템 프롬프트 ────────────────────────────────────
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

// ── Phase 2 결과 검증 / 정규화 ───────────────────────────────
// 최소 필수 구조 검증: interestAreas가 배열이고 1개 이상
function isValidPhase2Result(r: Record<string, unknown>): boolean {
  return Array.isArray(r.interestAreas) && (r.interestAreas as unknown[]).length > 0;
}

// fallback 상수 (§14 기준)
const FALLBACK_PARENT_QUESTIONS = [
  "요즘 어떤 활동을 할 때 시간이 가장 빨리 가?",
  "혼자 하는 활동과 함께 하는 활동 중 어떤 것이 더 좋아?",
  "새롭게 해보고 싶은 활동이 있다면 무엇이야?",
];
const FALLBACK_RECOMMENDED_ACTIVITIES = [
  "아이가 최근 좋아한 활동을 하나 정해 10분만 함께 해보기",
  "활동 후 무엇이 재미있었는지 짧게 이야기해보기",
];
const FALLBACK_DISCLAIMER =
  "이 리포트는 아이의 진로를 결정하는 자료가 아니라, 부모와 자녀가 대화를 시작하기 위한 참고 자료입니다.";

// 누락 필드에 안전한 기본값 적용
function normalizePhase2Result(r: Record<string, unknown>): Record<string, unknown> {
  const parentQuestions =
    Array.isArray(r.parentQuestions) && (r.parentQuestions as unknown[]).length > 0
      ? r.parentQuestions
      : FALLBACK_PARENT_QUESTIONS;
  const recommendedActivities =
    Array.isArray(r.recommendedActivities) && (r.recommendedActivities as unknown[]).length > 0
      ? r.recommendedActivities
      : FALLBACK_RECOMMENDED_ACTIVITIES;
  const disclaimer =
    typeof r.disclaimer === "string" && r.disclaimer.trim()
      ? r.disclaimer
      : FALLBACK_DISCLAIMER;
  return { ...r, parentQuestions, recommendedActivities, disclaimer };
}

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

  // ── 8. OpenAI API 호출 ───────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[api/myeonddara] OPENAI_API_KEY 미설정");
    return errRes("AI 서비스 설정 오류가 있어요. 관리자에게 문의해주세요.", "AI_CONFIG_ERROR", 503);
  }

  console.log("[api/myeonddara] ① OpenAI 호출 시작 — 사주:", saju.summary);
  console.log("[api/myeonddara]   모델:", OPENAI_MODEL);

  const openai = new OpenAI({ apiKey });

  // timeout 프로미스 — AI_TIMEOUT_MS 초과 시 reject (사용량 차감 없음)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
  );

  let rawText: string;
  try {
    console.log("[api/myeonddara] ② openai.chat.completions.create 요청");
    const completion = await Promise.race([
      openai.chat.completions.create({
        model:           OPENAI_MODEL,
        max_tokens:      2048,
        temperature:     0.5,
        response_format: { type: "json_object" },  // JSON 모드: 마크다운 없는 순수 JSON 보장
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage  },
        ],
      }),
      timeoutPromise,
    ]);

    rawText = completion.choices[0]?.message?.content?.trim() ?? "";
    console.log("[api/myeonddara] ③ OpenAI 응답 수신 — finish_reason:", completion.choices[0]?.finish_reason);
    console.log("[api/myeonddara] ④ raw 응답 앞 200자:", rawText.slice(0, 200));

  } catch (apiErr: unknown) {
    // timeout 분기 — 사용량 차감 없이 즉시 반환
    if (apiErr instanceof Error && apiErr.message === "AI_TIMEOUT") {
      console.error(`[api/myeonddara] ❌ OpenAI 응답 시간 초과 (${AI_TIMEOUT_MS}ms)`);
      return errRes("AI 분석 시간이 초과됐어요. 다시 시도해 주세요.", "AI_TIMEOUT", 504);
    }

    // OpenAI SDK APIError 유형별 분기
    if (apiErr instanceof OpenAI.APIError) {
      const s = apiErr.status;
      if (s === 401) {
        console.error("[api/myeonddara] OpenAI 인증 실패(401): OPENAI_API_KEY 확인 필요");
      } else if (s === 402 || s === 403) {
        console.warn("[api/myeonddara] ⚠️ OpenAI 크레딧 부족/접근 거부 — BILLING_REQUIRED 반환");
        return errRes(
          "AI 분석 크레딧이 부족합니다. 현재는 기본 만세력 결과만 제공됩니다.",
          "BILLING_REQUIRED",
          402
        );
      } else if (s === 429) {
        console.error("[api/myeonddara] OpenAI rate limit(429): 분당 한도 초과");
      } else {
        console.error(`[api/myeonddara] OpenAI API 오류(${s}): ${apiErr.message}`);
      }
    } else {
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      console.error("[api/myeonddara] ❌ OpenAI 네트워크/기타 오류:", msg);
    }
    return errRes("AI 분석 중 오류가 발생했어요. 다시 시도해 주세요.", "AI_ERROR", 502);
  }

  // ── JSON 파싱 ─────────────────────────────────────
  let parsed: Record<string, unknown>;
  try {
    // response_format: json_object 모드에서도 방어적으로 코드블록 제거
    let text = rawText;
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    console.log("[api/myeonddara] ⑤ JSON.parse 시도");
    parsed = JSON.parse(text);
    console.log("[api/myeonddara] ⑥ JSON 파싱 성공 — summary:", (parsed.summary as string)?.slice(0, 30));
  } catch (e: unknown) {
    console.error("[api/myeonddara] ❌ JSON 파싱 실패:", e instanceof Error ? e.message : String(e));
    return errRes("AI 응답 파싱에 실패했어요. 다시 시도해 주세요.", "PARSE_ERROR", 502);
  }

  // ── 구조 검증 + fallback 정규화 ──────────────────
  if (!isValidPhase2Result(parsed)) {
    console.error("[api/myeonddara] ❌ Phase2 필수 구조 검증 실패 — interestAreas:", parsed.interestAreas);
    return errRes("AI 분석 결과 구조가 올바르지 않아요. 다시 시도해 주세요.", "PARSE_ERROR", 502);
  }
  const analysis = normalizePhase2Result(parsed);

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
