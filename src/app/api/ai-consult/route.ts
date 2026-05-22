// ====================================================
// POST /api/ai-consult
// AI 진로 상담 API route (서버 전용)
//
// [요청 Body]
//   childId?:   string  — 자녀 UUID (system prompt 연동용, 선택)
//   sessionId?: string  — 이어가기 세션 UUID (유료만, 선택)
//   message:    string  — 사용자 입력 메시지
//
// [응답 Body — 성공]
//   response:       string  — AI 답변
//   sessionId?:     string  — 유료 플랜 세션 UUID (신규 생성 또는 기존 이어가기)
//   remainingCount: number  — 이번 달 남은 횟수 (-1 = unlimited 예비용)
//   isFree:         boolean — 무료 플랜 여부
//
// [응답 Body — 에러]
//   error:   string — 에러 메시지 (한글, UI 직접 표시용)
//   code:    string — 에러 코드 (AiConsultErrorCode)
//   status:  number — HTTP 상태 코드
//
// [한도 정책]
//   무료 (plan_name = 'free'):
//     - 월 3개 (018 최신화)
//     - 세션 저장 없음, usage만 기록
//   유료 (ai_consult_monthly_limit > 0):
//     - DB 한도 적용
//     - ai_consult_sessions에 대화 이력 저장 (이전 대화 컨텍스트 유지)
//
// [보안]
//   - OPENAI_API_KEY: 서버 전용 환경변수 (NEXT_PUBLIC_ 없음)
//   - 인증: supabase.auth.getUser() → parent 역할 확인
//   - RLS: parent_id 기반, 타 유저 접근 불가
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import {
  buildSystemPrompt,
  buildChildContext,
  AI_CONSULT_ERRORS,
} from "@/lib/ai/systemPrompt";
import { hasSuspiciousText } from "@/lib/ai/validateKoreanAnswer";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { validateMessage, validateUUID } from "@/lib/validation";

// ── Vercel 함수 최대 실행 시간 (Pro 플랜: 최대 300s, Hobby: 10s 캡)
// OpenAI 응답 대기를 위해 30s 확보. Hobby는 10s에서 자동 캡.
export const maxDuration = 30;

// ── 최대 컨텍스트 메시지 수 (유료 이어가기 시 최근 N개만 전송) ──
const MAX_CONTEXT_MESSAGES = 20;

// ── OpenAI 모델 ──
const OPENAI_MODEL = "gpt-4o-mini";

// ── Free 플랜 월 상담 한도 ──
// [034 동기화] 클라이언트(page.tsx)와 동일한 상수를 서버도 사용.
// DB subscription_plan.ai_consult_monthly_limit 값과 무관하게
// plan_name = 'free' 이면 항상 FREE_LIMIT 적용.
const FREE_LIMIT = 3;

// ── OpenAI API 응답 timeout (ms) ──
// [022 안전장치] 20초 초과 시 AI_TIMEOUT 반환, usage count 증가 안 함
// maxDuration=30 기준 응답 전송 여유 10s 확보
const AI_TIMEOUT_MS = 20_000;

// ── 에러 응답 헬퍼 ──
function errRes(
  code: keyof typeof AI_CONSULT_ERRORS,
  status: number
): NextResponse {
  return NextResponse.json(
    { error: AI_CONSULT_ERRORS[code], code, status },
    { status }
  );
}

export async function POST(req: NextRequest) {
  // ── 0. 기능 플래그 확인 ─────────────────────────────────
  // featureFlags.ts에서 AI_CONSULT_ENABLED = true 로 변경하면 해제
  if (!FEATURE_FLAGS.AI_CONSULT_ENABLED) {
    return NextResponse.json(
      { error: "AI 상담 기능은 현재 준비 중입니다.", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  // ── 1. API 키 확인 ──────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[ai-consult] OPENAI_API_KEY 미설정");
    return errRes("API_KEY_MISSING", 503);
  }

  // ── 2. Rate Limiting (5회/분 per IP) ──────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`ai-consult:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAfterMs);

  // ── 3. 요청 파싱 ────────────────────────────────────────
  let body: { childId?: string; sessionId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식이에요.", code: "SERVER_ERROR", status: 400 },
      { status: 400 }
    );
  }

  const { childId, sessionId, message } = body;

  // ── 입력값 서버 검증 ────────────────────────────────────
  const msgResult = validateMessage(message);
  if (!msgResult.ok) {
    return NextResponse.json(
      { error: msgResult.error, code: "VALIDATION_ERROR", status: 400 },
      { status: 400 }
    );
  }

  if (childId !== undefined) {
    const childIdResult = validateUUID(childId, "childId");
    if (!childIdResult.ok) {
      return NextResponse.json(
        { error: childIdResult.error, code: "VALIDATION_ERROR", status: 400 },
        { status: 400 }
      );
    }
  }

  if (sessionId !== undefined) {
    const sessionIdResult = validateUUID(sessionId, "sessionId");
    if (!sessionIdResult.ok) {
      return NextResponse.json(
        { error: sessionIdResult.error, code: "VALIDATION_ERROR", status: 400 },
        { status: 400 }
      );
    }
  }

  // ── 4. Supabase 서버 클라이언트 (쿠키 기반 세션) ────────
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

  // ── 4. 인증 확인 ────────────────────────────────────────
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return errRes("AUTH_REQUIRED", 401);

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "parent") return errRes("PARENT_ONLY", 403);

  // ── 5. parent_id 조회 ───────────────────────────────────
  const { data: parentRow, error: parentErr } = await supabase
    .from("parent")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (parentErr || !parentRow) return errRes("AUTH_REQUIRED", 401);
  const parentId = parentRow.id as string;

  // ── 6. 구독 플랜 확인 ───────────────────────────────────
  const { data: plan } = await supabase
    .from("subscription_plan")
    .select("ai_consult_monthly_limit, plan_name")
    .eq("parent_id", parentId)
    .maybeSingle();

  // [009 보정] 무료 여부: plan_name 기준. "limit=0 → 무료" 암묵 규칙 제거.
  // plan row 없으면 free로 취급 (fallback).
  // [043 정규화] free=무료, basic=유료베이직으로 명칭 분리 완료.
  //   auth/callback이 신규 가입자를 plan_name="free"로 생성하도록 수정됨.
  //   기존 basic row는 migration 043에서 모두 free로 보정됨.
  // TODO: 결제 연동 후 basic/premium/family 유료 플랜 판정 로직 추가 필요.
  const FREE_PLAN_NAMES = new Set(["free"]);
  const isFree = !plan || FREE_PLAN_NAMES.has(plan.plan_name);
  // [034 버그수정] 서버·클라이언트 monthlyLimit 통일
  //   Free 플랜: DB 값 무시, 항상 FREE_LIMIT(3) 사용
  //   유료 플랜: DB 값 사용, 0이면 최소 1 보장 (설정 오류 방지)
  const monthlyLimit = isFree
    ? FREE_LIMIT
    : Math.max(plan?.ai_consult_monthly_limit ?? FREE_LIMIT, 1);

  // [035 진단 로그] 플랜 확인 결과 — Vercel Function Logs에서 값 추적 가능
  console.log(
    `[ai-consult] plan — isFree=${isFree}` +
    ` plan_name=${plan?.plan_name ?? "none"}` +
    ` db_limit=${plan?.ai_consult_monthly_limit ?? "null"}` +
    ` computed_monthlyLimit=${monthlyLimit}`
  );

  // ── 7. 이번 달 사용량 확인 ──────────────────────────────
  const usedMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const { data: usageRow } = await supabase
    .from("ai_consult_usage")
    .select("id, count")
    .eq("parent_id", parentId)
    .eq("used_month", usedMonth)
    .maybeSingle();

  const usedCount: number = usageRow?.count ?? 0;

  if (usedCount >= monthlyLimit) {
    // [035 진단 로그] LIMIT_EXCEEDED 시 실제 값 기록 — Vercel Function Logs 확인 가능
    // P0 버그 원인 추적: usedCount=0 인데 LIMIT_EXCEEDED → monthlyLimit=0 이었음
    console.warn(
      `[ai-consult] LIMIT_EXCEEDED — parentId=${parentId}` +
      ` usedCount=${usedCount} monthlyLimit=${monthlyLimit}` +
      ` isFree=${isFree} db_limit=${plan?.ai_consult_monthly_limit ?? "null"}`
    );
    return errRes("LIMIT_EXCEEDED", 429);
  }

  // ── 8. 자녀 프로필 조회 (system prompt 연동) ────────────
  let childCtx = null;
  if (childId) {
    const { data: childRow } = await supabase
      .from("child")
      .select("name, grade_level, school_grade, interests")
      .eq("id", childId)
      .eq("parent_id", parentId) // 소유권 검증
      .maybeSingle();

    if (childRow) childCtx = buildChildContext(childRow);
  }

  // ── 9. 세션 이력 로드 (유료 이어가기) ───────────────────
  type ChatMsg = { role: "user" | "assistant"; content: string };
  let priorMessages: ChatMsg[] = [];
  let resolvedSessionId: string | null = sessionId ?? null;

  if (!isFree && sessionId) {
    const { data: sessionRow } = await supabase
      .from("ai_consult_sessions")
      .select("messages")
      .eq("id", sessionId)
      .eq("parent_id", parentId) // 소유권 검증
      .maybeSingle();

    if (sessionRow?.messages) {
      const stored = sessionRow.messages as ChatMsg[];
      // 최근 N개만 컨텍스트로 사용 (토큰 절약)
      priorMessages = stored.slice(-MAX_CONTEXT_MESSAGES);
    }
  }

  // ── 10. OpenAI API 호출 ──────────────────────────────────
  // [022 안전장치] AI_TIMEOUT_MS(25s) 초과 시 AI_TIMEOUT 반환, count 증가 안 함
  const openai = new OpenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(childCtx);

  type OAIMsg = OpenAI.Chat.ChatCompletionMessageParam;
  const apiMessages: OAIMsg[] = [
    { role: "system", content: systemPrompt },
    ...priorMessages.map((m): OAIMsg => ({
      role:    m.role,
      content: m.content,
    })),
    { role: "user", content: msgResult.value },
  ];

  // timeout 프로미스 — AI_TIMEOUT_MS 초과 시 reject
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("AI_TIMEOUT")),
      AI_TIMEOUT_MS
    )
  );

  let aiResponse: string;
  try {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model:       OPENAI_MODEL,
        max_tokens:  350,  // [037] 모바일 UX — 답변 길이 제한 (1024→500→350)
        temperature: 0.3,  // [038] 낮은 temperature → 안정적 한국어 출력
        messages:    apiMessages,
      }),
      timeoutPromise,
    ]);

    aiResponse =
      completion.choices[0]?.message?.content?.trim() ?? "[응답을 불러올 수 없어요]";
  } catch (apiErr) {
    // [022 안전장치] timeout 분기 — count 증가 없이 즉시 반환
    if (apiErr instanceof Error && apiErr.message === "AI_TIMEOUT") {
      console.error(`[ai-consult] OpenAI API 응답 시간 초과 (${AI_TIMEOUT_MS}ms 초과)`);
      return errRes("AI_TIMEOUT", 504);
    }

    // OpenAI SDK APIError 유형별 구분 로깅 (API key 값 자체는 절대 출력하지 않음)
    if (apiErr instanceof OpenAI.APIError) {
      const s = apiErr.status;
      if (s === 401) {
        console.error("[ai-consult] OpenAI 인증 실패(401): OPENAI_API_KEY가 유효하지 않거나 만료됨");
      } else if (s === 403) {
        console.error("[ai-consult] OpenAI 접근 거부(403): billing/크레딧 소진 또는 권한 문제");
      } else if (s === 404) {
        console.error(`[ai-consult] OpenAI 모델 없음(404): model="${OPENAI_MODEL}" — 모델명 확인 필요`);
      } else if (s === 429) {
        console.error("[ai-consult] OpenAI rate limit(429): OpenAI 계정 분당 한도 초과");
      } else {
        console.error(`[ai-consult] OpenAI API 오류(${s}): ${apiErr.message}`);
      }
    } else {
      // 네트워크 오류 / SDK 외 예외
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      console.error("[ai-consult] OpenAI 네트워크/기타 오류:", msg);
    }
    return errRes("SERVER_ERROR", 502);
  }

  // ── 10-b. 한국어 품질 검사 + 1회 재시도 ────────────────────
  // [038] 이상 문자열 감지 시 count 증가 없이 낮은 temperature로 재시도.
  // 2회 모두 실패 시 AI_RESPONSE_QUALITY_FAILED 반환.
  if (hasSuspiciousText(aiResponse)) {
    console.warn("[ai-consult] 품질 검사 실패(1차) — 재시도 시작");
    const retryTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 8_000)
    );
    try {
      const retryCompletion = await Promise.race([
        openai.chat.completions.create({
          model:       OPENAI_MODEL,
          max_tokens:  350,
          temperature: 0.1,
          messages:    apiMessages,
        }),
        retryTimeout,
      ]);
      const retryResponse =
        retryCompletion.choices[0]?.message?.content?.trim() ?? "";
      if (hasSuspiciousText(retryResponse)) {
        console.warn("[ai-consult] 품질 검사 실패(2차) — AI_RESPONSE_QUALITY_FAILED 반환");
        return errRes("AI_RESPONSE_QUALITY_FAILED", 422);
      }
      aiResponse = retryResponse;
    } catch {
      console.warn("[ai-consult] 재시도 실패(timeout 또는 API 오류) — AI_RESPONSE_QUALITY_FAILED 반환");
      return errRes("AI_RESPONSE_QUALITY_FAILED", 422);
    }
  }

  // ── 11. 사용량 증가 (upsert) ────────────────────────────
  // [022 안전장치] usage 저장 실패 시 AI 응답 반환 금지 (한도 우회 방지)
  // OpenAI API 성공 + usage upsert 성공 시에만 응답 반환
  const { error: usageErr } = await supabase
    .from("ai_consult_usage")
    .upsert(
      {
        parent_id:  parentId,
        used_month: usedMonth,
        count:      usedCount + 1,
      },
      { onConflict: "parent_id,used_month" }
    );

  if (usageErr) {
    // usage 저장 실패 → AI 응답을 사용자에게 반환하지 않음
    // 이유: 사용량이 기록되지 않으면 한도 우회 가능
    console.error("[ai-consult] usage upsert 실패 — 응답 차단 (한도 우회 방지):", usageErr);
    return errRes("USAGE_UPDATE_FAILED", 500);
  }

  // ── 12. 세션 저장 (유료만) ──────────────────────────────
  if (!isFree) {
    const updatedMessages: ChatMsg[] = [
      ...priorMessages,
      { role: "user",      content: msgResult.value },
      { role: "assistant", content: aiResponse },
    ];

    if (resolvedSessionId) {
      // 기존 세션 업데이트
      await supabase
        .from("ai_consult_sessions")
        .update({ messages: updatedMessages })
        .eq("id", resolvedSessionId)
        .eq("parent_id", parentId);
    } else {
      // 신규 세션 생성
      const { data: newSession } = await supabase
        .from("ai_consult_sessions")
        .insert({
          parent_id: parentId,
          child_id:  childId ?? null,
          title:     msgResult.value.slice(0, 50), // 첫 메시지 50자를 제목으로
          messages:  updatedMessages,
        })
        .select("id")
        .maybeSingle();

      resolvedSessionId = newSession?.id ?? null;
    }
  }

  // ── 13. 응답 반환 ────────────────────────────────────────
  return NextResponse.json({
    response:       aiResponse,
    sessionId:      isFree ? null : resolvedSessionId,
    remainingCount: monthlyLimit - (usedCount + 1),
    isFree,
  });
}
