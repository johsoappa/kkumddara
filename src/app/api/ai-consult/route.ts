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
//   무료 (ai_consult_monthly_limit = 0):
//     - 월 1회 (FREE_PLAN_MONTHLY_LIMIT)
//     - 세션 저장 없음, usage만 기록
//   유료 (ai_consult_monthly_limit > 0):
//     - DB 한도 적용
//     - ai_consult_sessions에 대화 이력 저장 (이전 대화 컨텍스트 유지)
//
// [보안]
//   - ANTHROPIC_API_KEY: 서버 전용 환경변수 (NEXT_PUBLIC_ 없음)
//   - 인증: supabase.auth.getUser() → parent 역할 확인
//   - RLS: parent_id 기반, 타 유저 접근 불가
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import {
  buildSystemPrompt,
  buildChildContext,
  AI_CONSULT_ERRORS,
} from "@/lib/ai/systemPrompt";

// ── 최대 컨텍스트 메시지 수 (유료 이어가기 시 최근 N개만 전송) ──
const MAX_CONTEXT_MESSAGES = 20;

// ── Claude 모델 ──
const CLAUDE_MODEL = "claude-3-5-haiku-20241022";

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai-consult] ANTHROPIC_API_KEY 미설정");
    return errRes("API_KEY_MISSING", 503);
  }

  // ── 2. 요청 파싱 ────────────────────────────────────────
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

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "메시지를 입력해주세요.", code: "SERVER_ERROR", status: 400 },
      { status: 400 }
    );
  }

  // ── 3. Supabase 서버 클라이언트 (쿠키 기반 세션) ────────
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
  const isFree       = !plan || plan.plan_name === "free";
  const monthlyLimit = plan?.ai_consult_monthly_limit ?? 1; // DB 값 그대로 사용

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

  // ── 10. Claude API 호출 ──────────────────────────────────
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(childCtx);

  const apiMessages: Anthropic.MessageParam[] = [
    ...priorMessages.map((m) => ({
      role:    m.role,
      content: m.content,
    })),
    { role: "user" as const, content: message.trim() },
  ];

  let aiResponse: string;
  try {
    const completion = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   apiMessages,
    });

    const firstBlock = completion.content[0];
    aiResponse =
      firstBlock.type === "text" ? firstBlock.text : "[응답을 불러올 수 없어요]";
  } catch (apiErr) {
    console.error("[ai-consult] Claude API 오류:", apiErr);
    return errRes("SERVER_ERROR", 502);
  }

  // ── 11. 사용량 증가 (upsert) ────────────────────────────
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
    // usage 기록 실패는 치명적이지 않으므로 경고만 남기고 계속
    console.warn("[ai-consult] usage upsert 실패:", usageErr);
  }

  // ── 12. 세션 저장 (유료만) ──────────────────────────────
  if (!isFree) {
    const updatedMessages: ChatMsg[] = [
      ...priorMessages,
      { role: "user",      content: message.trim() },
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
          title:     message.trim().slice(0, 50), // 첫 메시지 50자를 제목으로
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
