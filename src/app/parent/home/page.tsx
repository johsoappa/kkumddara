"use client";

// ====================================================
// 학부모 홈 (/parent/home)
// Must Have v1:
//   섹션 1 — 자녀 요약 카드 (이름, 학년, 초대코드, 관심분야)
//   섹션 2 — 부모 전용 기능 진입 (리포트, AI 상담, 명따라)
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  Sparkles,
  Users,
  Copy,
  Check,
  LogOut,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import type { Child, SubscriptionPlan } from "@/types/family";
import { GRADE_LABEL, GRADE_LEVEL_LABEL, INTEREST_LABEL, PLAN_LABEL } from "@/types/family";
import type { Grade, GradeLevel, InterestField } from "@/types/family";

type ParentFeature = {
  id:          string;
  icon:        React.ReactNode;
  label:       string;
  description: string;
  href:        string;
  badge?:      string;
};

const PARENT_FEATURES: ParentFeature[] = [
  {
    id:          "report",
    icon:        <FileText size={20} strokeWidth={1.8} />,
    label:       "주간 리포트",
    description: "아이의 이번 주 진로 탐색 현황을 확인해요.",
    href:        "/report",
  },
  {
    id:          "counseling",
    icon:        <MessageSquare size={20} strokeWidth={1.8} />,
    label:       "AI 진로 상담",
    description: FEATURE_FLAGS.AI_CONSULT_ENABLED
      ? "아이의 관심 분야에 맞는 진로를 함께 탐색해요."
      : "자녀 맞춤형 AI 상담 기능을 준비하고 있어요.",
    href:        "/parent/counseling",
    badge:       FEATURE_FLAGS.AI_CONSULT_ENABLED ? undefined : "준비 중",
  },
  {
    id:          "myeonddara",
    icon:        <Sparkles size={20} strokeWidth={1.8} />,
    label:       "명따라",
    description: "사주 기반으로 아이의 성향과 진로를 분석해요.",
    href:        "/myeonddara",
  },
  {
    id:          "family",
    icon:        <Users size={20} strokeWidth={1.8} />,
    label:       "가족 설정",
    description: "보호자를 초대하고 자녀의 진로 탐색을 함께 확인해요.",
    href:        "/parent/family",
  },
];

export default function ParentHomePage() {
  const router = useRouter();

  const [children, setChildren]   = useState<Child[]>([]);
  const [plan, setPlan]           = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading]     = useState(true);
  const [copiedId, setCopiedId]   = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // 비로그인 → 미들웨어가 /로 redirect하므로 여기선 안전하게 return

        const { data: parentData } = await supabase
          .from("parent")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(); // single() 대신 — parent 레코드 없을 때 throw 방지

        if (!parentData) return; // 트리거 미실행 등 예외 상황 → 빈 화면으로 fallback

        const [childrenRes, planRes] = await Promise.all([
          supabase
            .from("child")
            .select("*")
            .eq("parent_id", parentData.id)
            .eq("profile_status", "active")
            .order("created_at", { ascending: true }),
          supabase
            .from("subscription_plan")
            .select("*")
            .eq("parent_id", parentData.id)
            .maybeSingle(),
        ]);

        if (childrenRes.data) setChildren(childrenRes.data as Child[]);
        if (planRes.data) setPlan(planRes.data as SubscriptionPlan);
      } catch (err) {
        console.error("[parent/home] loadData 오류:", err);
      } finally {
        setLoading(false); // 성공/실패/예외 모두 로딩 종료 보장
      }
    }

    loadData();
  }, []);

  const copyInviteCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 앱 헤더 ──────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "#E84B2E" }}
          >
            꿈따라
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs text-base-muted active:opacity-60"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </header>

        <div className="px-5 py-6 flex flex-col gap-5">

          {/* ── 인사말 ────────────────────────────── */}
          <div>
            <p className="text-xs text-base-muted">학부모 홈</p>
            <h1 className="mt-0.5 text-xl font-bold text-base-text leading-snug">
              오늘도 함께
              <span style={{ color: "#E84B2E" }}> 꿈을 설계</span>해요
            </h1>
          </div>

          {/* ══════════════════════════════════════════
              섹션 1 — 자녀 요약 카드
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-base-text">자녀 현황</h2>
              {plan && (
                <span className="text-xs text-base-muted">
                  플랜:{" "}
                  <span className="font-semibold text-base-text">
                    {PLAN_LABEL[plan.plan_name] ?? plan.plan_name}
                  </span>
                </span>
              )}
            </div>

            {children.length === 0 ? (
              /* 자녀 없을 때 */
              <button
                onClick={() => router.push("/onboarding/parent")}
                className="
                  w-full bg-white border-2 border-dashed border-base-border
                  rounded-card-lg p-5 text-center
                  hover:border-brand-red transition-colors
                "
              >
                <p className="text-sm font-semibold text-base-muted">
                  자녀 프로필이 없어요
                </p>
                <p className="text-xs text-base-muted mt-1">
                  탭하여 자녀 프로필을 추가해요
                </p>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {children.map((child) => (
                  <ChildSummaryCard
                    key={child.id}
                    child={child}
                    copied={copiedId === child.id}
                    onCopy={() =>
                      child.invite_code && copyInviteCode(child.invite_code, child.id)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════
              섹션 2 — 부모 전용 기능 진입
          ══════════════════════════════════════════ */}
          <section>
            <h2 className="text-sm font-bold text-base-text mb-3">부모 전용 기능</h2>
            <div className="flex flex-col gap-2.5">
              {PARENT_FEATURES.map((feat) => (
                <ParentFeatureRow
                  key={feat.id}
                  feature={feat}
                  onClick={() => router.push(feat.href)}
                />
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── 자녀 요약 카드 ──────────────────────────────────────────
function ChildSummaryCard({
  child,
  copied,
  onCopy,
}: {
  child:   Child;
  copied:  boolean;
  onCopy:  () => void;
}) {
  const router = useRouter();

  // grade_level 우선, 없으면 school_grade 폴백
  const gradeLabel =
    child.grade_level
      ? (GRADE_LEVEL_LABEL[child.grade_level as GradeLevel] ?? null)
      : child.school_grade
        ? (GRADE_LABEL[child.school_grade as Grade] ?? null)
        : null;

  const interestLabels = (child.interests ?? [])
    .slice(0, 3)
    .map((f) => INTEREST_LABEL[f as InterestField] ?? f);

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      {/* 이름 + 학년 + 수정 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{child.avatar_emoji}</span>
          <div>
            <p className="text-base font-bold text-base-text">{child.name}</p>
            {gradeLabel ? (
              <p className="text-xs text-base-muted">{gradeLabel}</p>
            ) : (
              <p className="text-xs text-base-muted">학년 미설정</p>
            )}
          </div>
        </div>
        {/* 관심 분야 뱃지 + 수정 버튼 */}
        <div className="flex flex-col items-end gap-1.5">
          {interestLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
              {interestLabels.map((label) => (
                <span
                  key={label}
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#FFF0EB", color: "#E84B2E" }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push(`/parent/child/${child.id}/edit`)}
            className="
              flex items-center gap-1 text-[11px] font-semibold
              px-2 py-1 rounded-full
              transition-colors
            "
            style={{ background: "#F3F4F6", color: "#6B7280" }}
          >
            <Pencil size={10} />
            수정
          </button>
        </div>
      </div>

      {/* 초대 코드 */}
      {child.invite_code && (
        <div className="flex items-center justify-between bg-base-off rounded-button px-3 py-2.5">
          <div>
            <p className="text-[10px] text-base-muted mb-0.5">학생 초대 코드</p>
            <p className="text-sm font-mono font-bold tracking-widest text-base-text">
              {child.invite_code}
            </p>
          </div>
          <button
            onClick={onCopy}
            className="
              flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-button
              transition-all
            "
            style={
              copied
                ? { background: "#F0FDF4", color: "#16A34A" }
                : { background: "#FFF0EB", color: "#E84B2E" }
            }
          >
            {copied ? (
              <><Check size={12} /> 복사됨</>
            ) : (
              <><Copy size={12} /> 복사</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 부모 전용 기능 행 ───────────────────────────────────────
function ParentFeatureRow({
  feature,
  onClick,
}: {
  feature: ParentFeature;
  onClick: () => void;
}) {
  const disabled = feature.badge === "준비 중";

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`
        w-full bg-white rounded-card-lg shadow-card p-4
        flex items-center gap-4 text-left
        transition-all
        ${disabled
          ? "opacity-60 cursor-default"
          : "hover:shadow-card-hover active:scale-[0.99]"}
      `}
    >
      {/* 아이콘 */}
      <div
        className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
        style={{ background: "#FFF0EB", color: "#E84B2E" }}
      >
        {feature.icon}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-base-text">{feature.label}</p>
          {feature.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-base-card text-base-muted">
              {feature.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {!disabled && (
        <ChevronRight size={16} className="text-base-muted shrink-0" />
      )}
    </button>
  );
}
