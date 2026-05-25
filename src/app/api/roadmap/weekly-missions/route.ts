// ====================================================
// GET /api/roadmap/weekly-missions
// 직업 주간 AI 미션 조회/생성 API
//
// [흐름]
//   1. 인증 확인 (parent | student)
//   2. childId 접근 권한 확인
//   3. KST 기준 week_start 계산 (해당 주 월요일)
//   4. weekly_roadmap_missions 조회 → 있으면 즉시 반환 (OpenAI 호출 없음)
//   5. 없으면 OpenAI로 주간 미션 2개 생성 (최대 2회 시도)
//   6. 실패 시 정적 roadmaps.ts fallback 사용
//   7. DB 저장 후 반환
//
// [핵심 정책]
//   - 완료 버튼 클릭 시 이 API 호출 금지 (이 API는 "조회/생성"만 담당)
//   - 같은 주: 저장된 미션 재사용, OpenAI 재호출 없음
//   - 다음 주: week_start 변경 → 새 미션 생성
//   - 중복 생성 방지: unique(child_id, occupation_slug, stage, week_start) + upsert
//
// [권한]
//   parent: 본인 child_id만 접근
//   student: 연결된 child_id만 접근
//   비로그인: 401 차단
// ====================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRoadmap } from "@/data/roadmaps";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { validateUUID } from "@/lib/validation";
import type { WeeklyMissionItem } from "@/types/roadmap";

// Vercel 함수 최대 실행 시간
export const maxDuration = 30;

// OpenAI 모델 (기존 환경변수 재사용)
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// AI 응답 timeout
const AI_TIMEOUT_MS = 20_000;

// 단계 한국어 라벨
const STAGE_LABELS: Record<string, string> = {
  current: "탐색하기",
  next:    "실력 키우기",
  future:  "전문가 되기",
};

// 금지 표현 목록 (§19 기준)
const FORBIDDEN_EXPRESSIONS = [
  "딱 맞아",
  "반드시",
  "될 거야",
  "전문가 수준으로",
  "꼭 해야",
  "적성에 안 맞아",
  "진단 결과",
  "운명",
  "확률",
  "등수",
  "점수",
];

// ── 유틸 함수 ────────────────────────────────────────────────

/**
 * KST 기준 이번 주 월요일 날짜 반환 (YYYY-MM-DD)
 * UTC+9 변환 후 요일을 계산한다. 서버에서만 호출한다.
 */
function getKstWeekStart(): string {
  const now = new Date();
  // KST = UTC + 9시간
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const dayOfWeek = kst.getUTCDay(); // 0=일, 1=월, ..., 6=토
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = kstMs - daysFromMonday * 24 * 60 * 60 * 1000;
  const monday = new Date(mondayMs);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 미션 ID 생성 (weekStart + stage + index 기반, 결정적) */
function makeMissionId(weekStart: string, stage: string, index: number): string {
  const stageCode = stage.charAt(0); // c / n / f
  return `wm-${weekStart}-${stageCode}-${index}`;
}

/** 금지 표현 포함 여부 확인 */
function hasForbiddenExpression(texts: string[]): boolean {
  const joined = texts.join(" ");
  return FORBIDDEN_EXPRESSIONS.some((expr) => joined.includes(expr));
}

// ── OpenAI 응답 검증 ─────────────────────────────────────────

interface RawMission {
  title:            string;
  description:      string;
  checklist:        string[];
  parentGuide:      string;
  estimatedMinutes: number;
  difficulty:       "easy" | "normal" | "hard";
}

/**
 * OpenAI 응답에서 미션 배열 추출 + 검증.
 * 검증 통과 시 첫 2개 반환, 실패 시 null.
 */
function validateOpenAiResponse(data: unknown): RawMission[] | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.missions) || obj.missions.length < 2) return null;

  const missions = obj.missions as unknown[];
  const valid: RawMission[] = [];

  for (const raw of missions.slice(0, 2)) {
    if (!raw || typeof raw !== "object") return null;
    const m = raw as Record<string, unknown>;

    if (typeof m.title       !== "string" || !m.title.trim()) return null;
    if (typeof m.description !== "string" || !m.description.trim()) return null;
    if (!Array.isArray(m.checklist) || m.checklist.length < 2 || m.checklist.length > 4) return null;
    if (typeof m.estimatedMinutes !== "number" || m.estimatedMinutes < 5 || m.estimatedMinutes > 60) return null;
    if (!["easy", "normal", "hard"].includes(m.difficulty as string)) return null;

    // 금지 표현 검사
    const texts = [m.title, m.description, ...(m.checklist as string[])];
    if (hasForbiddenExpression(texts as string[])) return null;

    valid.push({
      title:            m.title.trim(),
      description:      m.description.trim(),
      checklist:        (m.checklist as string[]).map((c) => String(c).trim()),
      parentGuide:      typeof m.parentGuide === "string" ? m.parentGuide.trim() : "",
      estimatedMinutes: m.estimatedMinutes,
      difficulty:       m.difficulty as "easy" | "normal" | "hard",
    });
  }

  return valid.length >= 2 ? valid : null;
}

// ── Fallback 미션 ─────────────────────────────────────────────

/**
 * OpenAI 실패 시 정적 roadmaps.ts에서 미션 2개를 추출한다.
 * 정적 데이터도 없으면 공통 fallback 텍스트를 사용한다.
 */
function buildFallbackMissions(
  occupationSlug: string,
  stage: string,
  weekStart: string,
): WeeklyMissionItem[] {
  const stageId   = `stage-${stage}`;
  const roadmap   = getRoadmap(occupationSlug);
  const stageData = roadmap?.stages.find((s) => s.id === stageId);
  const statics   = stageData?.missions ?? [];

  if (statics.length >= 2) {
    // 정적 미션 앞 2개를 주간 미션으로 재사용 (ID 그대로 — 완료 기록 호환)
    return statics.slice(0, 2).map((m) => ({
      id:          m.id,
      title:       m.text,
      description: "",
    }));
  }

  // 공통 fallback
  return [
    {
      id:          makeMissionId(weekStart, stage, 0),
      title:       "이번 주에 알게 된 점을 가족과 이야기해보기",
      description: "이 직업에 대해 새롭게 알게 된 점을 가족과 나눠보는 미션이에요.",
    },
    {
      id:          makeMissionId(weekStart, stage, 1),
      title:       "관련 직업 하나 더 찾아보기",
      description: "이 직업과 비슷하거나 연결된 직업을 하나 찾아보는 미션이에요.",
    },
  ];
}

// ── 에러 응답 헬퍼 ──────────────────────────────────────────────
function errRes(msg: string, code: string, status: number) {
  return NextResponse.json({ error: msg, code, status }, { status });
}

// ════════════════════════════════════════════════════════════════
// GET 핸들러
// ════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  // ── 0. Rate Limit (IP 기준 분당 10회) ──────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`weekly-missions:${ip}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAfterMs);

  // ── 1. 쿼리 파라미터 파싱 + 검증 ───────────────────────────
  const { searchParams } = new URL(req.url);
  const childIdRaw      = searchParams.get("childId")       ?? "";
  const occupationSlug  = (searchParams.get("occupationSlug") ?? "").trim();
  const stage           = (searchParams.get("stage")          ?? "current").trim();

  const childIdResult = validateUUID(childIdRaw, "childId");
  if (!childIdResult.ok) return errRes(childIdResult.error, "VALIDATION_ERROR", 400);

  if (!occupationSlug || occupationSlug.length > 100) {
    return errRes("occupationSlug 값이 올바르지 않아요.", "VALIDATION_ERROR", 400);
  }
  if (!["current", "next", "future"].includes(stage)) {
    return errRes("stage 값이 올바르지 않아요. (current | next | future)", "VALIDATION_ERROR", 400);
  }

  const childId = childIdResult.value;

  // ── 2. Supabase 서버 클라이언트 (인증 쿠키 기반) ───────────
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

  // ── 3. 인증 확인 ─────────────────────────────────────────────
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return errRes("로그인이 필요해요.", "AUTH_REQUIRED", 401);

  const userRole = user.user_metadata?.role as "parent" | "student" | undefined;
  if (userRole !== "parent" && userRole !== "student") {
    return errRes("접근 권한이 없어요.", "FORBIDDEN", 403);
  }

  // ── 4. childId 접근 권한 확인 ──────────────────────────────
  // RLS가 자동으로 차단하지만, 명시적 체크로 404를 반환한다.
  if (userRole === "parent") {
    const { data: childRow } = await supabase
      .from("child")
      .select("id")
      .eq("id", childId)
      .eq("profile_status", "active")
      .maybeSingle();
    if (!childRow) return errRes("자녀 정보를 찾을 수 없어요.", "CHILD_NOT_FOUND", 404);
  } else {
    // student
    const { data: studentRow } = await supabase
      .from("student")
      .select("child_id")
      .eq("user_id", user.id)
      .eq("child_id", childId)
      .maybeSingle();
    if (!studentRow) return errRes("자녀 정보를 찾을 수 없어요.", "CHILD_NOT_FOUND", 404);
  }

  // ── 5. KST 기준 week_start 계산 ────────────────────────────
  const weekStart = getKstWeekStart();

  // ── 6. 이번 주 미션 존재 여부 확인 ─────────────────────────
  const { data: existing } = await supabase
    .from("weekly_roadmap_missions")
    .select("missions, source")
    .eq("child_id",       childId)
    .eq("occupation_slug", occupationSlug)
    .eq("stage",          stage)
    .eq("week_start",     weekStart)
    .maybeSingle();

  if (existing) {
    // 이번 주 미션이 이미 있으면 OpenAI 호출 없이 즉시 반환
    console.info("[api/roadmap/weekly-missions] 기존 주간 미션 반환", {
      occupationSlug, stage, weekStart, source: existing.source,
    });
    return NextResponse.json({
      missions: existing.missions as WeeklyMissionItem[],
      weekStart,
      source: existing.source,
    });
  }

  // ── 7. 새 주간 미션 생성 ─────────────────────────────────────
  console.info("[api/roadmap/weekly-missions] 주간 미션 생성 시작", {
    occupationSlug, stage, weekStart,
  });

  // ── 7-1. 자녀 학년 조회 ─────────────────────────────────────
  const { data: childProfile } = await supabase
    .from("child")
    .select("grade_level")
    .eq("id", childId)
    .maybeSingle();
  const childGrade = childProfile?.grade_level as string | null | undefined;

  // ── 7-2. 정적 미션 컨텍스트 준비 ───────────────────────────
  const roadmap        = getRoadmap(occupationSlug);
  const stageData      = roadmap?.stages.find((s) => s.id === `stage-${stage}`);
  const staticMissions = stageData?.missions?.map((m) => m.text) ?? [];
  const occupationName = roadmap?.occupationName ?? occupationSlug;

  // ── 7-3. 과거 AI 미션 제목 조회 (최대 5주, 중복 방지용) ──────
  const { data: pastRows } = await supabase
    .from("weekly_roadmap_missions")
    .select("missions")
    .eq("child_id",       childId)
    .eq("occupation_slug", occupationSlug)
    .eq("stage",          stage)
    .eq("source",         "ai")
    .order("week_start", { ascending: false })
    .limit(5);

  const pastMissionTitles: string[] = [];
  for (const row of pastRows ?? []) {
    const ms = row.missions as { title?: string }[];
    ms.forEach((m) => { if (m.title) pastMissionTitles.push(m.title); });
  }

  // ── 8. OpenAI 호출 (최대 2회 시도) ────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  let generatedRaw: RawMission[] | null = null;
  let source: "ai" | "fallback" = "fallback";

  if (apiKey) {
    const openai     = new OpenAI({ apiKey });
    const stageLabel = STAGE_LABELS[stage] ?? stage;

    const systemPrompt = `너는 아이 진로 탐색 미션 전문가다.
직업과 단계에 맞는 주간 미션 2개를 JSON으로 출력하라.

[미션 기준]
- 초등학생이 부모 도움으로 10~30분 안에 시작 가능
- 비싼 준비물이나 외부 결제 불필요
- 직업을 단정하지 않고 경험 중심으로 작성
- 결과물이 있거나 부모 대화로 이어지는 내용
- 한 주 안에 부담 없이 완료 가능
- 지난 주 미션과 주제 중복 금지

[절대 금지 표현]
딱 맞아 / 반드시 / 될 거야 / 전문가 수준으로 / 꼭 해야 / 적성에 안 맞아
진단 결과 / 운명 / 확률 / 등수 / 점수

[출력 형식 — 반드시 순수 JSON만 출력. 마크다운 코드블록 없이]
{
  "missions": [
    {
      "title": "미션 제목 (20자 이내)",
      "description": "미션 설명 (아이와 부모가 이해할 수 있는 2~3문장)",
      "checklist": ["항목1", "항목2", "항목3"],
      "parentGuide": "부모에게 전하는 참여 가이드 (1~2문장)",
      "estimatedMinutes": 20,
      "difficulty": "normal"
    },
    { ... }
  ]
}`;

    const userMsg = `직업: ${occupationName}
단계: ${stageLabel}${childGrade ? `\n아이 학년: ${childGrade}` : ""}${
  staticMissions.length > 0
    ? `\n\n기본 미션 예시 (참고용):\n${staticMissions.join("\n")}`
    : ""
}${
  pastMissionTitles.length > 0
    ? `\n\n지난 주 미션 (중복 금지):\n${pastMissionTitles.join("\n")}`
    : ""
}

이번 주 미션 2개를 위 JSON 형식으로 생성하라.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
    );

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.info(`[api/roadmap/weekly-missions] OpenAI 호출 attempt ${attempt}`);
        const completion = await Promise.race([
          openai.chat.completions.create({
            model:           OPENAI_MODEL,
            max_tokens:      1024,
            temperature:     0.7,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: userMsg },
            ],
          }),
          timeoutPromise,
        ]);

        const raw    = completion.choices[0]?.message?.content?.trim() ?? "";
        const parsed = JSON.parse(raw);
        const valid  = validateOpenAiResponse(parsed);

        if (valid) {
          generatedRaw = valid;
          source       = "ai";
          console.info("[api/roadmap/weekly-missions] ✅ OpenAI 응답 검증 성공", { attempt });
          break;
        }
        console.warn(`[api/roadmap/weekly-missions] 검증 실패 attempt ${attempt} — fallback으로 재시도`);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[api/roadmap/weekly-missions] OpenAI 오류 attempt ${attempt}:`, msg);
      }
    }
  } else {
    console.warn("[api/roadmap/weekly-missions] OPENAI_API_KEY 미설정 — fallback 사용");
  }

  // ── 9. DB 저장용 미션 배열 구성 ─────────────────────────────
  let dbMissions: object[];
  let responseMissions: WeeklyMissionItem[];

  if (generatedRaw) {
    // AI 생성 미션: ID를 결정적 방식으로 부여
    dbMissions = generatedRaw.map((m, i) => ({
      id:               makeMissionId(weekStart, stage, i),
      title:            m.title,
      description:      m.description,
      checklist:        m.checklist,
      parentGuide:      m.parentGuide,
      estimatedMinutes: m.estimatedMinutes,
      difficulty:       m.difficulty,
    }));
    responseMissions = dbMissions as WeeklyMissionItem[];
  } else {
    // fallback: 정적 미션 or 공통 텍스트
    source   = "fallback";
    const fb = buildFallbackMissions(occupationSlug, stage, weekStart);
    dbMissions = fb.map((m) => ({
      id:          m.id,
      title:       m.title,
      description: m.description ?? "",
    }));
    responseMissions = fb;
    console.warn("[api/roadmap/weekly-missions] fallback 미션 사용", { occupationSlug, stage });
  }

  // ── 10. DB 저장 (중복 race condition 대비 upsert) ────────────
  const { data: saved, error: saveErr } = await supabase
    .from("weekly_roadmap_missions")
    .upsert(
      {
        child_id:       childId,
        occupation_slug: occupationSlug,
        stage,
        week_start:     weekStart,
        missions:       dbMissions,
        source,
        ai_model:       source === "ai" ? OPENAI_MODEL : null,
        prompt_version: "v1",
      },
      { onConflict: "child_id,occupation_slug,stage,week_start" }
    )
    .select("missions, source")
    .maybeSingle();

  if (saveErr) {
    // DB 저장 실패 시에도 생성된 미션을 반환 (화면 깨짐 방지)
    console.error("[api/roadmap/weekly-missions] DB 저장 실패:", saveErr.message);
    return NextResponse.json({ missions: responseMissions, weekStart, source });
  }

  console.info("[api/roadmap/weekly-missions] ✅ 주간 미션 저장 완료", {
    occupationSlug, stage, weekStart, source,
  });

  return NextResponse.json({
    missions: (saved?.missions ?? responseMissions) as WeeklyMissionItem[],
    weekStart,
    source: saved?.source ?? source,
  });
}
