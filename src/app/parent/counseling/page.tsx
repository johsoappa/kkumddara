"use client";

// ====================================================
// AI 진로 상담 페이지 (/parent/counseling)
//
// 설계 원칙:
//   - 결과 보장형 표현 금지, 준비·설계형 표현 유지
//   - 무료: 월 3개, 저장 없음, remainingCount = 0 되면 업그레이드 안내
//   - 유료: 남은 횟수 표시, 이어가기(sessionId) 지원
//   - 자녀 프로필이 있으면 childId 자동 연동
//
// [UX 개선 — P0]
//   - Welcome 메시지: 자녀 이름 기반 환영 문구
//   - 추천 질문 칩: 클릭 → 입력창 채움 (자동 전송 없음)
//   - 신뢰/면책 문구: 입력창 하단
//   - 무료 제한 안내: 경고 배너 → 작은 헤더 배지로 위계 낮춤
//   - 한도 종료 CTA: 목적 지향 문구
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ChevronLeft, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFirstActiveChild } from "@/lib/db/family";
import { FEATURE_FLAGS } from "@/lib/featureFlags";

// ── 추천 질문 칩 ──
const SUGGESTED_QUESTIONS = [
  "아이가 장래희망이 없다고 할 때 어떻게 대화하면 좋을까요?",
  "아이가 유튜브 크리에이터에 관심이 있는데 집에서 어떻게 도와줄까요?",
  "아이가 관심 있어 하는 직업이 자주 바뀌는데 괜찮을까요?",
  "아이가 좋아하는 것을 진로와 어떻게 연결해 볼 수 있을까요?",
] as const;

// ── 채팅 메시지 타입 ──
type ChatRole = "user" | "assistant" | "system";
interface ChatMessage {
  role:    ChatRole;
  content: string;
}

// ── API 응답 타입 ──
interface AiConsultResponse {
  response:       string;
  sessionId:      string | null;
  remainingCount: number;
  isFree:         boolean;
}

// ── 초기 안내 메시지 (시스템 메시지로 표시) ──
const WELCOME_MSG: ChatMessage = {
  role:    "system",
  content:
    "안녕하세요! 꿈따라 AI 진로 탐색 도우미예요.\n아이의 관심사나 진로 탐색 방향에 대해 궁금한 점을 자유롭게 물어보세요.\n\n예시: \"중2 아이가 IT에 관심이 있는데, 어떤 활동을 해볼 수 있을까요?\"",
};

// ── AI 상담 준비중 화면 ──────────────────────────────────
// FEATURE_FLAGS.AI_CONSULT_ENABLED = false 일 때 표시
// 재활성화: featureFlags.ts 에서 true 로 변경 후 배포
function ComingSoonScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-base-border">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-sm font-bold text-base-text">AI 진로 상담</h1>
        </div>

        {/* 바디 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FFF0EB" }}
          >
            <Clock size={28} style={{ color: "#E84B2E" }} />
          </div>

          <div>
            <p className="text-lg font-bold text-base-text mb-2">
              AI 진로 상담 준비 중
            </p>
            <p className="text-sm text-base-muted leading-relaxed">
              자녀 맞춤형 AI 상담 기능을 준비하고 있어요.<br />
              곧 오픈 예정입니다.
            </p>
          </div>

          <button
            onClick={onBack}
            className="mt-2 px-6 py-3 rounded-button text-sm font-semibold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 래퍼 — 플래그에 따라 준비중 / 실제 화면 분기 ──────────
// Hooks 규칙 준수: early return은 래퍼에서, 실제 hook 사용은 Impl에서
export default function CounselingPage() {
  const router = useRouter();
  if (!FEATURE_FLAGS.AI_CONSULT_ENABLED) {
    return <ComingSoonScreen onBack={() => router.back()} />;
  }
  return <CounselingPageImpl />;
}

// ── 실제 AI 상담 구현 (AI_CONSULT_ENABLED = true 시 사용) ──
function CounselingPageImpl() {
  const router                            = useRouter();
  const bottomRef                         = useRef<HTMLDivElement>(null);

  const [messages, setMessages]           = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [childId, setChildId]             = useState<string | null>(null);
  const [childName, setChildName]         = useState<string | null>(null);
  const [remainingCount, setRemaining]    = useState<number | null>(null);
  const [isFree, setIsFree]               = useState<boolean | null>(null);
  const [limitReached, setLimitReached]   = useState(false);
  const [initError, setInitError]         = useState<string | null>(null);

  // ── 초기 로드: 자녀 프로필 + 기본 상담 정보 ──────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const role = user.user_metadata?.role as string | undefined;
      if (role !== "parent") { router.replace("/"); return; }

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) { setInitError("학부모 정보를 불러오지 못했어요."); return; }

      // 자녀 프로필 조회 (system prompt 연동 + 이름 표시용)
      try {
        const child = await getFirstActiveChild(parentRow.id);
        if (child) {
          setChildId(child.id);
          setChildName(child.name ?? null);
        }
      } catch {
        // 자녀 없어도 상담 진행 가능
      }

      // 현재 달 사용량 + 플랜 확인
      const usedMonth = new Date().toISOString().slice(0, 7);
      const [planRes, usageRes] = await Promise.all([
        supabase
          .from("subscription_plan")
          .select("ai_consult_monthly_limit, plan_name")
          .eq("parent_id", parentRow.id)
          .maybeSingle(),
        supabase
          .from("ai_consult_usage")
          .select("count")
          .eq("parent_id", parentRow.id)
          .eq("used_month", usedMonth)
          .maybeSingle(),
      ]);

      // [009 보정] 무료 여부: plan_name 기준. "limit=0 → 무료" 암묵 규칙 제거.
      // [043 정규화] free=무료, basic=유료베이직으로 명칭 분리 완료.
      //   auth/callback 신규 가입자 → plan_name="free" 생성.
      //   기존 basic row → migration 043에서 free로 보정됨.
      // TODO: 결제 연동 후 basic/premium/family 유료 플랜 판정 로직 추가 필요.
      const FREE_PLAN_NAMES = new Set(["free"]);
      const free = !planRes.data || FREE_PLAN_NAMES.has(planRes.data.plan_name);
      // [034 버그수정] Free 플랜 한도는 항상 3 (018 정책 반영)
      // subscription_plan row 없거나 plan_name=free → FREE_LIMIT(3) 사용
      // 유료 플랜인데 DB 값이 0이면 최소 1 보장 (설정 오류 방지)
      const FREE_LIMIT = 3;
      const monthlyLimit: number = free
        ? FREE_LIMIT
        : Math.max(planRes.data?.ai_consult_monthly_limit ?? FREE_LIMIT, 1);
      const used: number         = usageRes.data?.count ?? 0;
      const remaining            = Math.max(0, monthlyLimit - used);

      setIsFree(free);
      setRemaining(remaining);
      if (remaining === 0) setLimitReached(true);
    }

    init();
  }, [router]);

  // ── 자동 스크롤 ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 전송 처리 ─────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading || limitReached) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-consult", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:   userMsg,
          childId:   childId ?? undefined,
          sessionId: sessionId ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          if (data.code === "LIMIT_EXCEEDED") {
            // 월 한도 초과: 이달 상담 불가 → 입력창 영구 비활성
            setLimitReached(true);
            setRemaining(0);
            setMessages((prev) => [
              ...prev,
              { role: "system", content: data.error ?? "이번 달 상담 횟수를 모두 사용했어요." },
            ]);
          } else {
            // RATE_LIMITED (분당 5회 초과): 횟수 차감 없음, 입력창 유지
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                content:
                  "요청이 너무 많아요. 상담 횟수는 차감되지 않았으니 잠시 후 다시 시도해주세요.",
              },
            ]);
          }
          return;
        }

        // AI_TIMEOUT / SERVER_ERROR / USAGE_UPDATE_FAILED 등
        // → OpenAI 실패 또는 서버 오류. 횟수 차감되지 않음, 재시도 가능.
        const isRetryable = ["AI_TIMEOUT", "SERVER_ERROR", "USAGE_UPDATE_FAILED", "AI_RESPONSE_QUALITY_FAILED"].includes(
          data.code ?? ""
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: isRetryable
              ? "지금은 AI 상담 연결이 원활하지 않아요. 상담 횟수는 차감되지 않았으니 잠시 후 다시 시도해주세요."
              : data.error ?? "오류가 발생했어요. 잠시 후 다시 시도해주세요.",
          },
        ]);
        return;
      }

      const result = data as AiConsultResponse;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);
      if (result.sessionId) setSessionId(result.sessionId);
      setRemaining(result.remainingCount);
      if (result.remainingCount <= 0) setLimitReached(true);
    } catch {
      // 네트워크 오류 / fetch 자체 실패 → 서버에 요청 미도달 또는 응답 수신 실패
      // 횟수가 차감되었는지 알 수 없으나 대부분 미차감. 재시도 안내.
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content:
            "네트워크 오류가 발생했어요. 상담 횟수는 차감되지 않았을 가능성이 높으니 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSession = () => {
    setMessages([WELCOME_MSG]);
    setSessionId(null);
    setInput("");
    setLimitReached(remainingCount === 0);
  };

  // ── 헬퍼: 말풍선 스타일 ──────────────────────────────────
  function bubbleStyle(role: ChatRole) {
    if (role === "user")
      return "ml-auto bg-brand-red text-white rounded-2xl rounded-br-sm";
    if (role === "assistant")
      return "mr-auto bg-white border border-base-border text-base-text rounded-2xl rounded-bl-sm";
    return "mx-auto bg-base-off text-base-muted text-center rounded-2xl text-xs";
  }

  // 대화가 시작된 상태인지 (WELCOME_MSG 이외 메시지 존재)
  const isConversationStarted = messages.length > 1;

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-base-border"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-base-text">AI 진로 상담</h1>
            <p className="text-xs text-base-muted">
              {childId ? "자녀 관심사 기반 탐색 상담" : "진로 탐색 도우미"}
            </p>
          </div>

          {/* 남은 무료 상담 배지 — 작은 chip 형태, 위계 낮춤 */}
          {remainingCount !== null && !limitReached && (
            <span className="text-xs text-base-muted px-2 py-1 rounded-full bg-base-off border border-base-border whitespace-nowrap">
              무료 {remainingCount}회 남음
            </span>
          )}
          {remainingCount !== null && limitReached && (
            <span className="text-xs text-red-400 px-2 py-1 rounded-full bg-red-50 whitespace-nowrap">
              이번 달 종료
            </span>
          )}

          {/* 새 대화 버튼 */}
          {isConversationStarted && (
            <button
              onClick={handleNewSession}
              className="p-1.5 rounded-full hover:bg-base-off transition-colors"
              aria-label="새 대화"
              title="새 대화 시작"
            >
              <RefreshCw size={16} className="text-base-muted" />
            </button>
          )}
        </div>

        {/* 초기 오류 */}
        {initError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 rounded-button text-sm text-red-500">
            {initError}
          </div>
        )}

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {/* ── Welcome 카드 + 추천 질문 칩 (대화 시작 전만 표시) ── */}
          {!isConversationStarted && !limitReached && (
            <div className="mb-1">
              {/* 환영 메시지 */}
              <div className="mb-4">
                <p className="text-base font-bold text-base-text leading-snug">
                  {childName
                    ? `안녕하세요, ${childName} 부모님.`
                    : "안녕하세요."}
                </p>
                <p className="text-sm text-base-muted mt-1 leading-relaxed">
                  오늘 아이의 어떤 관심과 가능성에 대해 이야기해 볼까요?
                </p>
                <p className="text-xs text-base-muted mt-2">
                  아래 질문을 선택하거나 직접 입력해 보세요.
                </p>
              </div>

              {/* 추천 질문 칩 */}
              <div className="flex flex-col gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="
                      text-left text-sm px-4 py-3 rounded-2xl border border-base-border
                      bg-base-off text-base-text leading-snug
                      hover:border-brand-red hover:bg-brand-light transition-colors
                    "
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 채팅 메시지 (WELCOME_MSG system 말풍선은 대화 시작 후에만 표시) */}
          {messages.map((msg, i) => {
            // 대화 시작 전 WELCOME_MSG system 메시지는 별도 Welcome 카드로 대체
            if (i === 0 && msg.role === "system" && !isConversationStarted) return null;
            return (
              <div
                key={i}
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleStyle(msg.role)}`}
              >
                {msg.content}
              </div>
            );
          })}

          {/* 로딩 인디케이터 */}
          {loading && (
            <div className="mr-auto bg-white border border-base-border rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 items-center text-base-muted text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-base-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-base-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-base-muted animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 한도 초과 안내 — 목적 지향 문구 */}
        {limitReached && (
          <div className="mx-4 mb-3 p-4 bg-base-off rounded-2xl text-center">
            <p className="text-sm font-semibold text-base-text mb-1">
              이번 달 준비된 무료 맞춤 상담을 모두 사용했어요.
            </p>
            <p className="text-xs text-base-muted mb-3 leading-relaxed">
              {childName
                ? `${childName}의 진로 탐색을 계속 이어가고 싶다면 맞춤 플랜을 살펴보세요.`
                : "아이의 진로 탐색을 계속 이어가고 싶다면 맞춤 플랜을 살펴보세요."}
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="px-4 py-2 rounded-button text-xs font-semibold text-white transition-opacity"
              style={{ backgroundColor: "#E84B2E" }}
            >
              맞춤 진로 플랜 시작하기
            </button>
          </div>
        )}

        {/* 입력 영역 */}
        <div
          className="border-t border-base-border px-4 pt-3 pb-2 bg-white"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}
        >
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                limitReached
                  ? "이번 달 상담 횟수를 모두 사용했어요"
                  : "메시지를 입력하세요… (Enter로 전송)"
              }
              disabled={limitReached || loading}
              rows={1}
              className="
                flex-1 resize-none rounded-button border border-base-border
                px-3 py-2.5 text-sm text-base-text bg-white
                focus:outline-none focus:border-brand-red transition-colors
                placeholder:text-base-muted disabled:bg-base-off disabled:text-base-muted
                max-h-32 overflow-y-auto
              "
              style={{ minHeight: "42px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || limitReached}
              className="
                p-2.5 rounded-button text-white transition-opacity
                disabled:opacity-40
              "
              style={{ backgroundColor: "#E84B2E" }}
              aria-label="전송"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>

          {/* 신뢰/면책 문구 */}
          {!limitReached && (
            <p className="mt-1.5 text-[11px] text-base-muted leading-relaxed">
              💡 AI 답변은 아이의 가능성을 넓히기 위한 참고 제안입니다. 아이의 반응을 보며 가볍게 대화로 시작해 보세요.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
