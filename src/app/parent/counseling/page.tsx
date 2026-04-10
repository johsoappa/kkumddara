"use client";

// ====================================================
// AI 진로 상담 페이지 (/parent/counseling)
//
// 설계 원칙:
//   - 결과 보장형 표현 금지, 준비·설계형 표현 유지
//   - 무료: 월 1회, 저장 없음, remainingCount = 0 되면 업그레이드 안내
//   - 유료: 남은 횟수 표시, 이어가기(sessionId) 지원
//   - 자녀 프로필이 있으면 childId 자동 연동
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ChevronLeft, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFirstActiveChild } from "@/lib/db/family";

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
    "안녕하세요! 꿈따라 AI 진로 설계 도우미예요.\n자녀의 진로 탐색이나 준비 방향에 대해 궁금한 점을 자유롭게 물어보세요.\n\n예시: \"중2 아이가 IT에 관심이 있는데, 어떤 활동을 해볼 수 있을까요?\"",
};

export default function CounselingPage() {
  const router                            = useRouter();
  const bottomRef                         = useRef<HTMLDivElement>(null);

  const [messages, setMessages]           = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [childId, setChildId]             = useState<string | null>(null);
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

      // 자녀 프로필 조회 (system prompt 연동용)
      try {
        const child = await getFirstActiveChild(parentRow.id);
        if (child) setChildId(child.id);
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
      const free = !planRes.data || planRes.data.plan_name === "free";
      const monthlyLimit: number = planRes.data?.ai_consult_monthly_limit ?? 1;
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
        // 한도 초과
        if (res.status === 429) {
          setLimitReached(true);
          setRemaining(0);
          setMessages((prev) => [
            ...prev,
            { role: "system", content: data.error },
          ]);
          return;
        }
        // 기타 에러
        setMessages((prev) => [
          ...prev,
          { role: "system", content: data.error ?? "오류가 발생했어요. 다시 시도해주세요." },
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
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
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
              {childId ? "자녀 프로필 연동됨" : "일반 진로 설계 모드"}
            </p>
          </div>

          {/* 남은 횟수 배지 */}
          {remainingCount !== null && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                remainingCount === 0
                  ? "bg-red-50 text-red-500"
                  : "bg-brand-light text-brand-red"
              }`}
            >
              {remainingCount === 0
                ? "이번 달 종료"
                : `이번 달 ${remainingCount}회 남음`}
            </span>
          )}

          {/* 새 대화 버튼 */}
          {messages.length > 1 && (
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

        {/* 무료 플랜 안내 배너 */}
        {isFree && !limitReached && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-button flex gap-2 text-xs text-amber-700">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              무료 플랜은 매달 1회 상담을 탐색해볼 수 있어요.
              더 많은 상담이 필요하다면 베이직 이상 플랜을 고려해 보세요.
            </span>
          </div>
        )}

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleStyle(msg.role)}`}
            >
              {msg.content}
            </div>
          ))}

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

        {/* 한도 초과 안내 */}
        {limitReached && (
          <div className="mx-4 mb-3 p-4 bg-base-off rounded-button text-center">
            <p className="text-sm font-semibold text-base-text mb-1">
              이번 달 상담을 모두 탐색했어요
            </p>
            <p className="text-xs text-base-muted mb-3">
              {isFree
                ? "베이직 이상 플랜에서 매달 더 많은 상담을 이용할 수 있어요."
                : "다음 달 1일에 다시 시작하거나 플랜을 살펴보세요."}
            </p>
            <button
              onClick={() => router.push("/settings")}
              className="text-xs font-semibold text-brand-red underline underline-offset-2"
            >
              플랜 살펴보기
            </button>
          </div>
        )}

        {/* 입력창 */}
        <div
          className="border-t border-base-border px-4 py-3 flex gap-2 items-end bg-white"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
        >
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

      </div>
    </div>
  );
}
