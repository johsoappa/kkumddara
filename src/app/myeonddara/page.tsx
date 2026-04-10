"use client";

// ====================================================
// 명따라 메인 입력 화면 (/myeonddara)
//
// [008 변경] 연간 사용량 체크 추가
//   - free: 명따라 자체 차단 (yearly_limit = 0)
//   - 유료: subscription_plan.myeonddara_yearly_limit 기준
//   - 현재 연도 myeonddara_usage.count >= limit → 차단
//   - 제공 시점 안내: 1학기(3월) · 2학기(9월) · 연말(12월)
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import SajuInput from "@/components/myeonddara/SajuInput";
import { MYEONDDARA_INPUT_KEY } from "@/data/myeonddara";
import type { SajuInputData } from "@/types/myeonddara";
import { supabase } from "@/lib/supabase";

const OHAENG_BADGES = [
  { emoji: "🔥", label: "화(火)" },
  { emoji: "🌊", label: "수(水)" },
  { emoji: "🌲", label: "목(木)" },
  { emoji: "⚙️", label: "금(金)" },
  { emoji: "⛰️", label: "토(土)" },
];

/** 한도 초과 안내 문구 (확정) */
const LIMIT_EXCEEDED_MSG =
  "이번 연도 명따라 분석 횟수를 모두 사용했어요.\n1학기(3월) · 2학기(9월) · 연말(12월)\n총 3회 제공됩니다.";

/** 무료 플랜 차단 문구 */
const FREE_BLOCKED_MSG =
  "명따라는 베이직 이상 플랜에서 이용할 수 있어요.\n연 3회 (1학기·2학기·연말) 제공됩니다.";

export default function MyeonddaraPage() {
  const router = useRouter();
  const [isLoading, setIsLoading]       = useState(false);

  // ── 사용량 체크 상태 ──────────────────────────────────
  const [checkDone, setCheckDone]       = useState(false);
  const [blocked, setBlocked]           = useState(false);
  const [blockMsg, setBlockMsg]         = useState("");
  const [remainingCount, setRemaining]  = useState<number | null>(null);
  const [parentId, setParentId]         = useState<string | null>(null);

  // ── 초기 로드: 로그인 + 플랜 + 사용량 확인 ───────────
  useEffect(() => {
    async function checkUsage() {
      const { data: { user } } = await supabase.auth.getUser();

      // 비로그인 또는 학생 계정 → 차단 없이 테스트 모드로 허용
      if (!user || user.user_metadata?.role !== "parent") {
        setCheckDone(true);
        return;
      }

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) { setCheckDone(true); return; }
      setParentId(parentRow.id);

      // 구독 플랜 조회
      const { data: plan } = await supabase
        .from("subscription_plan")
        .select("myeonddara_yearly_limit, plan_name")
        .eq("parent_id", parentRow.id)
        .maybeSingle();

      const yearlyLimit: number = plan?.myeonddara_yearly_limit ?? 0;

      // 무료 플랜 (yearly_limit = 0) → 차단
      if (yearlyLimit === 0) {
        setBlocked(true);
        setBlockMsg(FREE_BLOCKED_MSG);
        setCheckDone(true);
        return;
      }

      // 현재 연도 사용량 조회
      const currentYear = new Date().getFullYear();
      const { data: usageRow } = await supabase
        .from("myeonddara_usage")
        .select("count")
        .eq("parent_id", parentRow.id)
        .eq("used_year", currentYear)
        .maybeSingle();

      const usedCount: number = usageRow?.count ?? 0;

      if (usedCount >= yearlyLimit) {
        setBlocked(true);
        setBlockMsg(LIMIT_EXCEEDED_MSG);
        setRemaining(0);
      } else {
        setRemaining(yearlyLimit - usedCount);
      }

      setCheckDone(true);
    }

    checkUsage();
  }, []);

  // ── 폼 제출: localStorage 저장 + 사용량 증가 ─────────
  const handleSubmit = async (data: SajuInputData) => {
    if (blocked) return;
    setIsLoading(true);
    localStorage.setItem(MYEONDDARA_INPUT_KEY, JSON.stringify(data));

    // 로그인된 학부모인 경우 사용량 증가
    if (parentId) {
      const currentYear = new Date().getFullYear();
      const { data: usageRow } = await supabase
        .from("myeonddara_usage")
        .select("count")
        .eq("parent_id", parentId)
        .eq("used_year", currentYear)
        .maybeSingle();

      const newCount = (usageRow?.count ?? 0) + 1;
      await supabase
        .from("myeonddara_usage")
        .upsert(
          { parent_id: parentId, used_year: currentYear, count: newCount },
          { onConflict: "parent_id,used_year" }
        );
    }

    // 분석 시뮬레이션 (실제 연동 시 API 호출로 교체)
    setTimeout(() => {
      router.push("/myeonddara/result");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 헤더 ── */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">명따라</h1>
            {/* 남은 횟수 배지 */}
            {remainingCount !== null && !blocked && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
              >
                올해 {remainingCount}회 남음
              </span>
            )}
            {remainingCount === null && <div className="w-9" />}
          </div>
        </div>

        {/* ── 컨텐츠 ── */}
        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

          {/* 🧪 테스트 버전 안내 배너 */}
          <div
            className="rounded-card p-3 border text-sm leading-relaxed"
            style={{ backgroundColor: "#FFF9C4", borderColor: "#F9A825" }}
          >
            <p className="font-semibold text-yellow-900 mb-0.5">🧪 현재 테스트 버전입니다.</p>
            <p className="text-yellow-800 text-xs leading-relaxed">
              분석 결과는 실제 사주 데이터가 아닌 예시 데이터로 제공됩니다.<br />
              정식 버전에서는 정확한 분석을 제공할 예정입니다.
            </p>
          </div>

          {/* ① 소개 카드 */}
          <div
            className="rounded-card-lg px-4 py-6 text-center"
            style={{
              background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)",
            }}
          >
            <span className="text-5xl leading-none block mb-3">✨</span>
            <h2 className="text-2xl font-bold text-white mb-2">명따라</h2>
            <p className="text-sm text-white/80 leading-relaxed mb-3">
              아이의 생년월일시로<br />
              타고난 기질과 적성을 분석해드려요.<br />
              동양 철학의 지혜로<br />
              진로의 방향을 찾아보세요.
            </p>
            {/* 제공 시점 안내 */}
            <p className="text-xs text-white/60 mb-4">
              연 3회 제공 · 1학기(3월) · 2학기(9월) · 연말(12월)
            </p>
            {/* 오행 뱃지 */}
            <div className="flex justify-center gap-1 flex-nowrap">
              {OHAENG_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="flex items-center gap-0.5 text-xs font-semibold text-white px-2 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <span>{b.emoji}</span>
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ② 차단 상태 — 무료 플랜 또는 한도 초과 */}
          {checkDone && blocked && (
            <div className="bg-white rounded-card-lg shadow-card p-6 text-center flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFF0EB" }}
              >
                <Lock size={22} style={{ color: "#E84B2E" }} />
              </div>
              <p className="text-sm font-semibold text-base-text">
                {blockMsg.split("\n")[0]}
              </p>
              <p className="text-xs text-base-muted leading-relaxed whitespace-pre-line">
                {blockMsg.split("\n").slice(1).join("\n")}
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="mt-1 px-5 py-2.5 rounded-button text-sm font-bold text-white"
                style={{ backgroundColor: "#E84B2E" }}
              >
                요금제 살펴보기
              </button>
            </div>
          )}

          {/* ③ 입력 폼 (사용 가능 상태) */}
          {checkDone && !blocked && (
            <SajuInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* ③ 로딩 스켈레톤 (체크 전) */}
          {!checkDone && (
            <div className="bg-white rounded-card-lg shadow-card p-6 animate-pulse">
              <div className="h-4 bg-base-border rounded w-1/3 mb-4" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded" />
            </div>
          )}

          {/* ④ 하단 안내 문구 */}
          <p className="text-xs text-base-muted text-center leading-relaxed px-4">
            명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다.<br />
            아이의 가능성은 무한합니다. 💛
          </p>
        </div>
      </div>
    </div>
  );
}
