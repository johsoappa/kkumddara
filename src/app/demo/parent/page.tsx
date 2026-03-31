"use client";

// ====================================================
// 학부모 데모 홈 (/demo/parent)
// - 로그인 없이 접근 가능 (미들웨어 비보호 구간)
// - 샘플 자녀 데이터로 UI 체험
// - 저장 액션 시 GuestLoginPrompt 표시
// ====================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  Sparkles,
  Copy,
  ChevronRight,
} from "lucide-react";
import GuestLoginPrompt from "@/components/ui/GuestLoginPrompt";
import type { Grade, InterestField } from "@/types/family";
import { GRADE_LABEL, INTEREST_LABEL } from "@/types/family";

// ── 데모용 샘플 자녀 데이터 ──────────────────────────
const DEMO_CHILD = {
  name:         "지우",
  school_grade: "middle1" as Grade,
  interests:    ["it", "art"] as InterestField[],
  avatar_emoji: "🌟",
};

const DEMO_PLAN = { plan_name: "basic" };

const PARENT_FEATURES = [
  {
    id:          "report",
    icon:        <FileText size={20} strokeWidth={1.8} />,
    label:       "주간 리포트",
    description: "아이의 이번 주 진로 탐색 현황을 확인해요.",
    locked:      false,
    href:        "/report",
  },
  {
    id:          "counseling",
    icon:        <MessageSquare size={20} strokeWidth={1.8} />,
    label:       "AI 진로 상담",
    description: "아이의 관심 분야에 맞는 진로를 함께 탐색해요.",
    locked:      false,
    badge:       "준비 중",
    href:        "#",
  },
  {
    id:          "myeonddara",
    icon:        <Sparkles size={20} strokeWidth={1.8} />,
    label:       "명따라",
    description: "사주 기반으로 아이의 성향과 진로를 분석해요.",
    locked:      false,
    href:        "/myeonddara",
  },
];

export default function DemoParentPage() {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const gradeLabel     = GRADE_LABEL[DEMO_CHILD.school_grade];
  const interestLabels = DEMO_CHILD.interests
    .map((f) => INTEREST_LABEL[f])
    .filter(Boolean);

  const handleLockedAction = () => setShowPrompt(true);

  const handleCopyCode = () => {
    // 게스트는 초대코드 복사 → 로그인 유도
    setShowPrompt(true);
  };

  return (
    <>
      {showPrompt && <GuestLoginPrompt onClose={() => setShowPrompt(false)} />}

      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off">

          {/* ── 헤더 ──────────────────────────────── */}
          <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: "#E84B2E" }}
            >
              꿈따라
            </span>
            <button
              onClick={() => router.push("/")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-base-border text-base-muted active:opacity-70"
            >
              로그인 / 가입
            </button>
          </header>

          {/* ── 데모 배너 ─────────────────────────── */}
          <div
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
          >
            <span>체험 모드</span>
            <span className="text-brand-red opacity-50">·</span>
            <span className="font-normal text-brand-red/80">샘플 데이터로 UI를 체험 중이에요</span>
          </div>

          <div className="px-5 py-6 flex flex-col gap-5">

            {/* ── 인사말 ────────────────────────────── */}
            <div>
              <p className="text-xs text-base-muted">학부모 홈 (체험)</p>
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
                <span className="text-xs text-base-muted">
                  플랜:{" "}
                  <span className="font-semibold text-base-text uppercase">
                    {DEMO_PLAN.plan_name}
                  </span>
                </span>
              </div>

              <div className="bg-white rounded-card-lg shadow-card p-5">
                {/* 이름 + 학년 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{DEMO_CHILD.avatar_emoji}</span>
                    <div>
                      <p className="text-base font-bold text-base-text">{DEMO_CHILD.name}</p>
                      <p className="text-xs text-base-muted">{gradeLabel}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
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
                </div>

                {/* 초대 코드 → 게스트는 로그인 유도 */}
                <div className="flex items-center justify-between bg-base-off rounded-button px-3 py-2.5">
                  <div>
                    <p className="text-[10px] text-base-muted mb-0.5">학생 초대 코드</p>
                    <p className="text-sm font-mono font-bold tracking-widest text-base-muted">
                      ••••••••
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-button"
                    style={{ background: "#FFF0EB", color: "#E84B2E" }}
                  >
                    <Copy size={12} />
                    로그인 후 확인
                  </button>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                섹션 2 — 부모 전용 기능
            ══════════════════════════════════════════ */}
            <section>
              <h2 className="text-sm font-bold text-base-text mb-3">부모 전용 기능</h2>
              <div className="flex flex-col gap-2.5">
                {PARENT_FEATURES.map((feat) => {
                  const disabled = feat.badge === "준비 중";
                  return (
                    <button
                      key={feat.id}
                      onClick={
                        disabled ? undefined
                        : feat.locked ? handleLockedAction
                        : () => router.push(feat.href)
                      }
                      className={`
                        w-full bg-white rounded-card-lg shadow-card p-4
                        flex items-center gap-4 text-left transition-all
                        ${disabled
                          ? "opacity-60 cursor-default"
                          : "hover:shadow-card-hover active:scale-[0.99]"}
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
                        style={{ background: "#FFF0EB", color: "#E84B2E" }}
                      >
                        {feat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-base-text">{feat.label}</p>
                          {feat.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-base-card text-base-muted">
                              {feat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
                          {feat.description}
                        </p>
                      </div>
                      {!disabled && <ChevronRight size={16} className="text-base-muted shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 로그인 CTA ─────────────────────────── */}
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-button text-sm font-bold text-white flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#E84B2E" }}
            >
              로그인하고 내 자녀 프로필 만들기
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-xs text-base-muted -mt-2">
              14일 무료 체험 · 자동결제 없음
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
