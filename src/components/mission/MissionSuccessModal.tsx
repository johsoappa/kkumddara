"use client";

// ====================================================
// MissionSuccessModal — 미션 성공 피드백 모달
//
// [모드별 동작]
//   seed    : 별 confetti + 아이콘 bounce — 새싹 모드 (초등 저학년)
//   sprout  : 슬라이드업 + 페이드인 — 새싹 성장
//   compass : 팝업 스케일 + 체크 SVG 드로잉 — 나침반 모드
//
// [닫기 정책]
//   "다음으로" 버튼으로만 닫힘 — 바깥 클릭 / ESC 차단
// ====================================================

import { useEffect, useState } from "react";

// ── Props ──────────────────────────────────────────────────────
export interface MissionSuccessModalProps {
  mode:          "seed" | "sprout" | "compass";
  isOpen:        boolean;
  onClose:       () => void;
  missionTitle?: string;
}

// ── 모드별 설정 ────────────────────────────────────────────────
const MODE_CONFIG = {
  seed: {
    headline: "와! 해냈어요! 🌱",
    sub:      "정말 대단해요! 오늘도 씨앗이 자라고 있어요.",
    color:    "#FF7043",
    bgLight:  "rgba(255,112,67,0.12)",
  },
  sprout: {
    headline: "잘했어요! 🌿",
    sub:      "한 걸음 더 나아갔어요. 계속 해봐요!",
    color:    "#4CAF50",
    bgLight:  "rgba(76,175,80,0.12)",
  },
  compass: {
    headline: "미션 완료! 🧭",
    sub:      "네 꿈이 한 칸 더 가까워졌어.",
    color:    "#E84B2E",
    bgLight:  "rgba(232,75,46,0.12)",
  },
} as const;

// ── Confetti 파티클 (seed 전용) ────────────────────────────────
const CONFETTI_COLORS = [
  "#FF7043","#FFC107","#4CAF50","#2196F3","#E84B2E","#9C27B0","#FFEB3B",
];

interface Particle {
  id:       number;
  x:        number;   // vw 기준 left %
  delay:    number;   // ms
  dur:      number;   // ms
  color:    string;
  size:     number;   // px
  isCircle: boolean;
  rotate:   number;   // 초기 각도
}

function makeParticles(n = 32): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id:       i,
    x:        (i / n) * 96 + Math.random() * 4,   // 균일하게 분산
    delay:    Math.floor(Math.random() * 500),
    dur:      1100 + Math.floor(Math.random() * 700),
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:     6 + Math.floor(Math.random() * 7),
    isCircle: i % 2 === 0,
    rotate:   Math.floor(Math.random() * 360),
  }));
}

// ── keyframes 문자열 ───────────────────────────────────────────
const KEYFRAMES = `
  @keyframes confetti-fall {
    0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }
  @keyframes slide-up-fade {
    0%   { transform: translateY(64px); opacity: 0; }
    100% { transform: translateY(0);    opacity: 1; }
  }
  @keyframes pop-scale {
    0%   { transform: scale(0.76); opacity: 0; }
    70%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes circle-draw {
    0%   { stroke-dashoffset: 138; }
    100% { stroke-dashoffset: 0;   }
  }
  @keyframes check-draw {
    0%   { stroke-dashoffset: 80; }
    100% { stroke-dashoffset: 0;  }
  }
  @keyframes icon-bounce {
    0%, 100% { transform: scale(1);    }
    40%      { transform: scale(1.22); }
    65%      { transform: scale(0.94); }
  }
`;

// ── 컴포넌트 ──────────────────────────────────────────────────
export default function MissionSuccessModal({
  mode,
  isOpen,
  onClose,
  missionTitle,
}: MissionSuccessModalProps) {
  const [particles] = useState<Particle[]>(() => makeParticles(32));
  const cfg = MODE_CONFIG[mode];

  // ESC 차단
  useEffect(() => {
    if (!isOpen) return;
    const block = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", block, { capture: true });
    return () => document.removeEventListener("keydown", block, { capture: true });
  }, [isOpen]);

  // body 스크롤 잠금
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  // 모드별 카드 애니메이션
  const cardAnimation =
    mode === "compass"
      ? "pop-scale 0.45s cubic-bezier(0.34,1.56,0.64,1) both"
      : "slide-up-fade 0.38s ease-out both";

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* 딤 오버레이 — 클릭해도 닫히지 않음 */}
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.58)" }}
        role="dialog"
        aria-modal="true"
        aria-label={`미션 성공${missionTitle ? ": " + missionTitle : ""}`}
      >

        {/* ── seed: confetti 파티클 ── */}
        {mode === "seed" && (
          <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
              <span
                key={p.id}
                style={{
                  position:        "absolute",
                  left:            `${p.x}%`,
                  top:             `-${p.size * 2}px`,
                  width:           `${p.size}px`,
                  height:          `${p.size}px`,
                  borderRadius:    p.isCircle ? "50%" : "3px",
                  backgroundColor: p.color,
                  transform:       `rotate(${p.rotate}deg)`,
                  animation:       `confetti-fall ${p.dur}ms ease-in ${p.delay}ms both`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── 모달 카드 ── */}
        <div
          className="relative w-full max-w-sm rounded-card-lg bg-white p-8 text-center shadow-xl"
          style={{ animation: cardAnimation }}
        >

          {/* 아이콘 영역 */}
          <div className="mb-5 flex justify-center">
            {mode === "compass" ? (
              /* compass: SVG 체크 드로잉 */
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: cfg.bgLight }}
              >
                <svg width="48" height="48" viewBox="0 0 50 50" fill="none" aria-hidden="true">
                  <circle
                    cx="25" cy="25" r="22"
                    stroke={cfg.color}
                    strokeWidth="3"
                    strokeDasharray="138"
                    strokeDashoffset="138"
                    style={{ animation: "circle-draw 0.6s ease-out 0.1s both" }}
                  />
                  <polyline
                    points="14,25 22,33 36,16"
                    stroke={cfg.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="80"
                    strokeDashoffset="80"
                    style={{ animation: "check-draw 0.45s ease-out 0.6s both" }}
                  />
                </svg>
              </div>
            ) : (
              /* seed / sprout: 이모지 아이콘 */
              <span
                className="text-6xl leading-none select-none"
                style={{
                  animation:
                    mode === "seed"
                      ? "icon-bounce 0.65s ease-out 0.25s both"
                      : "none",
                }}
              >
                {mode === "seed" ? "🌟" : "🌿"}
              </span>
            )}
          </div>

          {/* 타이틀 */}
          <h2 className="mb-2 text-xl font-bold" style={{ color: cfg.color }}>
            {cfg.headline}
          </h2>

          {/* 미션 제목 (optional) */}
          {missionTitle && (
            <p className="mb-1 text-sm font-semibold" style={{ color: "#212121" }}>
              {missionTitle}
            </p>
          )}

          {/* 서브 문구 */}
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "#9E9E9E" }}>
            {cfg.sub}
          </p>

          {/* 닫기 버튼 — 유일한 종료 수단 */}
          <button
            onClick={onClose}
            className="w-full rounded-button py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: cfg.color }}
          >
            다음으로
          </button>
        </div>
      </div>
    </>
  );
}

/*
 * ── 사용 예시 ─────────────────────────────────────────────────────
 *
 * import MissionSuccessModal from "@/components/mission/MissionSuccessModal";
 * import { useState } from "react";
 *
 * const [open, setOpen] = useState(false);
 *
 * // seed 모드 — 새싹(초등 저학년) 미션 완료
 * <MissionSuccessModal
 *   mode="seed"
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   missionTitle="오늘의 탐색 미션"
 * />
 *
 * // sprout 모드 — 성장 단계 미션 완료
 * <MissionSuccessModal
 *   mode="sprout"
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 * />
 *
 * // compass 모드 — 나침반(초등 고학년~고등) 미션 완료
 * <MissionSuccessModal
 *   mode="compass"
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   missionTitle="역사학자 퀴즈 완료"
 * />
 */
